import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { buildLeaderboardSnapshot } from "@/lib/leaderboard-snapshot"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get("admin-auth")

    if (authCookie?.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reqUrl = new URL(request.url)
    const snapshot = await buildLeaderboardSnapshot(
      reqUrl.searchParams.get("variant"),
      reqUrl.searchParams
    )

    return NextResponse.json(snapshot)
  } catch (error) {
    console.error("Error fetching snapshot:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch snapshot"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
