import { NextResponse } from "next/server"

function dateToUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

function formatDateYYYYMMDD(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function computeRolling12thRangeUTC(now: Date): { startAt: string; endAt: string; from: number; to: number } {
  const currentMonth12th = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 12))
  let start: Date
  let end: Date
  if (now >= currentMonth12th) {
    // From 12th of current month → 12th of next month
    start = currentMonth12th
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 12))
  } else {
    // From 12th of previous month → 12th of current month
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 12))
    end = currentMonth12th
  }
  end.setUTCHours(23, 59, 59, 999)
  return { 
    startAt: formatDateYYYYMMDD(start), 
    endAt: formatDateYYYYMMDD(end),
    from: dateToUnixTimestamp(start),
    to: dateToUnixTimestamp(end)
  }
}

export async function GET(request: Request) {
  try {
    const baseUrl = process.env.BITFORTUNE_API_URL || "https://platformv2.bitfortune.com/api/v1/external/affiliates/leaderboard"
    const apiKeyEnv = process.env.BITFORTUNE_API_KEY || "c10d749e-9179-4fe0-9d3d-0f258702ffa6"
    const LEADERBOARD_DURATION_DAYS = 28

    const reqUrl = new URL(request.url)

    // Helper to calculate end date from start date (exactly 28 days later)
    // Calculates: start date + exactly 28 days = end of day 28
    const calculateEndDate = (startUnix: number): number => {
      const startDate = new Date(startUnix * 1000)
      // Normalize start to beginning of day (00:00:00.000) for consistent calculation
      const startOfDay = new Date(Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
        0, 0, 0, 0
      ))
      // Add exactly 28 days worth of milliseconds, then subtract 1ms to get end of day 28
      // This gives us: day 1 00:00:00.000 to day 28 23:59:59.999 = exactly 28 days
      const endDate = new Date(startOfDay.getTime() + (LEADERBOARD_DURATION_DAYS * 24 * 60 * 60 * 1000) - 1)
      return Math.floor(endDate.getTime() / 1000)
    }

    // Read Unix timestamps from env vars or query params
    const fromEnv = process.env.BITFORTUNE_FROM
    const toEnv = process.env.BITFORTUNE_END_AT || process.env.BITFORTUNE_TO

    const now = new Date()
    const rolling = computeRolling12thRangeUTC(now)

    // Get from/to as Unix timestamps
    let from: number
    let to: number

    const fromParam = reqUrl.searchParams.get("from")
    const toParam = reqUrl.searchParams.get("to")

    if (fromParam) {
      // Query params - only "from" is required, "to" is optional (backwards compatibility)
      from = parseInt(fromParam, 10)
      if (toParam) {
        to = parseInt(toParam, 10)
      } else {
        // Calculate end date from start + 28 days
        to = calculateEndDate(from)
      }
    } else if (fromEnv) {
      // Env vars - only "from" is required, "to" is optional (backwards compatibility)
      from = parseInt(fromEnv, 10)
      if (toEnv) {
        to = parseInt(toEnv, 10)
      } else {
        // Calculate end date from start + 28 days
        to = calculateEndDate(from)
      }
    } else {
      // Fallback to rolling 12th
      from = rolling.from
      to = rolling.to
    }

    const apiKey = apiKeyEnv || reqUrl.searchParams.get("api_key") || reqUrl.searchParams.get("key")

    if (!apiKey) {
      return NextResponse.json({ error: "Missing BITFORTUNE_API_KEY" }, { status: 500 })
    }

    const url = new URL(baseUrl)
    url.searchParams.set("api_key", apiKey)
    url.searchParams.set("from", from.toString())
    url.searchParams.set("to", to.toString())

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream error ${response.status}` }, { status: response.status })
    }

    const data = await response.json()

    // BitFortune API returns array directly
    const array = Array.isArray(data) ? data : []

    const normalized = array.map((entry: any, index: number) => ({
      id: entry.user_id?.toString() ?? String(index + 1),
      username: entry.user_name ?? entry.username ?? entry.name ?? `Player${index + 1}`,
      wagered: Number(entry.total_wager_usd ?? entry.wagered_amount ?? entry.wagered ?? entry.totalWagered ?? 0),
      prize: 0, // Prize will be calculated based on rank
      rank: entry.rank ?? index + 1,
    }))

    // Sort by wagered amount descending and assign ranks
    const sorted = [...normalized].sort((a, b) => b.wagered - a.wagered)
    const ranked = sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }))

    return NextResponse.json(ranked)
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
