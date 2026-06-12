import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { buildLeaderboardSnapshot, formatSnapshotMessage } from "@/lib/leaderboard-snapshot"
import { parseSnapshotVariant, type SnapshotVariantId } from "@/lib/leaderboard-variants"

function discordWebhookForVariant(variant: SnapshotVariantId): string | undefined {
  if (variant === "bitfortune") {
    return process.env.DISCORD_BITFORTUNE_WEBHOOK_URL
  }
  return process.env.DISCORD_WEBHOOK_URL
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get("admin-auth")
    if (authCookie?.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let variant: string | undefined
    try {
      const body = await request.json()
      variant = typeof body?.variant === "string" ? body.variant : undefined
    } catch {
      variant = undefined
    }

    const reqUrl = new URL(request.url)
    const searchParams = new URLSearchParams(reqUrl.searchParams)
    if (variant) {
      searchParams.set("variant", variant)
    }

    const snapshot = await buildLeaderboardSnapshot(searchParams.get("variant"), searchParams)
    const discordMessage = formatSnapshotMessage(snapshot, { maskUsernames: true })

    const webhookUrl = discordWebhookForVariant(parseSnapshotVariant(snapshot.variant))
    if (!webhookUrl) {
      const envKey =
        snapshot.variant === "bitfortune" ? "DISCORD_BITFORTUNE_WEBHOOK_URL" : "DISCORD_WEBHOOK_URL"
      return NextResponse.json({ error: `${envKey} not configured` }, { status: 500 })
    }

    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: discordMessage }),
    })

    if (!discordResponse.ok) {
      throw new Error("Discord API returned an error")
    }

    return NextResponse.json({ success: true, variant: snapshot.variant })
  } catch (error) {
    console.error("Discord Error:", error)
    const message = error instanceof Error ? error.message : "Failed to send to Discord"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
