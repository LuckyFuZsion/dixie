import { NextResponse } from "next/server"

const DEFAULT_STREAMER_API_URL =
  "https://platformv2.bitfortune.com/api/v1/refx/streamer/leaderboard"

type StreamerRow = {
  user_id?: number
  user_name?: string
  total_wager_usd?: number
}

export async function GET(request: Request) {
  try {
    const reqUrl = new URL(request.url)
    const from = reqUrl.searchParams.get("from")
    const to = reqUrl.searchParams.get("to")

    if (!from || !to || !/^\d+$/.test(from) || !/^\d+$/.test(to)) {
      return NextResponse.json({ error: "from and to unix timestamps are required" }, { status: 400 })
    }

    const apiKey =
      process.env.BITFORTUNE_STREAMER_API_KEY ||
      process.env.BITFORTUNE_API_KEY
    const baseUrl = process.env.BITFORTUNE_STREAMER_API_URL || DEFAULT_STREAMER_API_URL

    if (!apiKey) {
      return NextResponse.json({ error: "BitFortune API key not configured" }, { status: 500 })
    }

    const upstream = new URL(baseUrl)
    upstream.searchParams.set("api_key", apiKey)
    upstream.searchParams.set("from", from)
    upstream.searchParams.set("to", to)

    const response = await fetch(upstream.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error ${response.status}` },
        {
          status: response.status,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      )
    }

    const data = await response.json()
    const array: StreamerRow[] = Array.isArray(data) ? data : []

    const normalized = array.map((entry, index) => ({
      id: entry.user_id != null ? String(entry.user_id) : String(index + 1),
      username: entry.user_name ?? `Player${index + 1}`,
      wagered: Number(entry.total_wager_usd ?? 0),
      prize: 0,
      rank: index + 1,
    }))

    const sorted = [...normalized].sort((a, b) => b.wagered - a.wagered)
    const ranked = sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }))

    return NextResponse.json(ranked, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error fetching BitFortune streamer leaderboard:", error)
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    )
  }
}
