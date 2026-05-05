import { NextResponse } from "next/server"

/**
 * Affiliate export JSON (full snapshot). Does not accept date filters — race dates only affect UI countdown via env.
 * @see https://exportdata.xcdn.tech/bombastic-affiliate-leaderboard-export/3633/1960940194/304548477.json
 */
const DEFAULT_LEADERBOARD_EXPORT_URL =
  "https://exportdata.xcdn.tech/bombastic-affiliate-leaderboard-export/3633/1960940194/304548477.json"

type ExportRow = {
  playerId?: number
  username?: string
  bets?: number
  deposits?: number
  cashouts?: number
}

export async function GET() {
  try {
    const exportUrl = process.env.LEADERBOARD_EXPORT_URL || DEFAULT_LEADERBOARD_EXPORT_URL

    const response = await fetch(exportUrl, {
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
    const array: ExportRow[] = Array.isArray(data) ? data : []

    const normalized = array.map((entry, index) => ({
      id: entry.playerId != null ? String(entry.playerId) : String(index + 1),
      username: entry.username ?? `Player${index + 1}`,
      wagered: Number(entry.bets ?? 0),
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
    console.error("Error fetching leaderboard:", error)
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
