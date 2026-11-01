import { NextResponse } from "next/server"

const DEFAULT_SLUG = "streamingshack"
const DEFAULT_API_BASE = "https://circustance.de/v2"

type CrossfadePlayer = {
  playerId?: number | string
  userId?: number | string
  username?: string
  bets?: number
  totalWagered?: number
}

type CrossfadeResponse = {
  players?: CrossfadePlayer[]
}

export async function GET(request: Request) {
  try {
    const reqUrl = new URL(request.url)
    const from = reqUrl.searchParams.get("from")
    const to = reqUrl.searchParams.get("to")

    if (!from || !to || !/^\d+$/.test(from) || !/^\d+$/.test(to)) {
      return NextResponse.json({ error: "from and to unix timestamps are required" }, { status: 400 })
    }

    const apiKey = process.env.METASPINS_API_KEY
    const slug = process.env.METASPINS_SLUG || DEFAULT_SLUG
    const apiBase = process.env.METASPINS_API_BASE || DEFAULT_API_BASE

    if (!apiKey) {
      return NextResponse.json({ error: "Metaspins API key not configured" }, { status: 500 })
    }

    const upstream = `${apiBase}/${slug}/${apiKey}?from=${from}&to=${to}`

    const response = await fetch(upstream, {
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

    const data = (await response.json()) as CrossfadeResponse
    const array = Array.isArray(data.players) ? data.players : []

    const normalized = array.map((entry, index) => ({
      id: String(entry.playerId ?? entry.userId ?? index + 1),
      username: entry.username ?? `Player${index + 1}`,
      wagered: Number(entry.bets ?? entry.totalWagered ?? 0),
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
    console.error("Error fetching Metaspins leaderboard:", error)
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
