import { NextResponse } from "next/server"
import { cookies } from "next/headers"

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
    start = currentMonth12th
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 12))
  } else {
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
    // Check authentication
    const cookieStore = await cookies()
    const authCookie = cookieStore.get("admin-auth")

    if (authCookie?.value !== "authenticated") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const reqUrl = new URL(request.url)
    const fromParam = reqUrl.searchParams.get("from")
    const toParam = reqUrl.searchParams.get("to")

    // Get date range - URL params have highest priority
    const fromEnv = process.env.BITFORTUNE_FROM || process.env.NEXT_PUBLIC_BITFORTUNE_FROM
    const toEnv = process.env.BITFORTUNE_END_AT || process.env.BITFORTUNE_TO || process.env.NEXT_PUBLIC_BITFORTUNE_TO

    const now = new Date()
    const rolling = computeRolling12thRangeUTC(now)

    let from: number
    let to: number

    // Priority: URL params > Env vars > Rolling 12th
    if (fromParam) {
      from = parseInt(fromParam, 10)
      if (toParam) {
        to = parseInt(toParam, 10)
      } else {
        const LEADERBOARD_DURATION_DAYS = 28
        const startDate = new Date(from * 1000)
        const startOfDay = new Date(Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate(),
          0, 0, 0, 0
        ))
        const endDate = new Date(startOfDay.getTime() + (LEADERBOARD_DURATION_DAYS * 24 * 60 * 60 * 1000) - 1)
        to = Math.floor(endDate.getTime() / 1000)
      }
    } else if (fromEnv) {
      from = parseInt(fromEnv, 10)
      if (toEnv) {
        to = parseInt(toEnv, 10)
      } else {
        const LEADERBOARD_DURATION_DAYS = 28
        const startDate = new Date(from * 1000)
        const startOfDay = new Date(Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate(),
          0, 0, 0, 0
        ))
        const endDate = new Date(startOfDay.getTime() + (LEADERBOARD_DURATION_DAYS * 24 * 60 * 60 * 1000) - 1)
        to = Math.floor(endDate.getTime() / 1000)
      }
    } else {
      from = rolling.from
      to = rolling.to
    }

    // Fetch leaderboard data
    const baseUrl = process.env.BITFORTUNE_API_URL || "https://platformv2.bitfortune.com/api/v1/external/affiliates/leaderboard"
    const apiKeyEnv = process.env.BITFORTUNE_API_KEY || "c10d749e-9179-4fe0-9d3d-0f258702ffa6"

    const url = new URL(baseUrl)
    url.searchParams.set("api_key", apiKeyEnv)
    url.searchParams.set("from", from.toString())
    url.searchParams.set("to", to.toString())

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch leaderboard: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const array = Array.isArray(data) ? data : []

    // Prize mapping
    const prizeForRank = (rank: number): number => {
      const map: Record<number, number> = { 1: 2000, 2: 1000, 3: 500, 4: 175, 5: 100, 6: 75, 7: 50, 8: 50, 9: 25, 10: 25 }
      return map[rank] ?? 0
    }

    // Normalize and sort
    const normalized = array.map((entry: any, index: number) => ({
      id: entry.user_id?.toString() ?? String(index + 1),
      username: entry.user_name ?? entry.username ?? entry.name ?? `Player${index + 1}`,
      wagered: Number(entry.total_wager_usd ?? entry.wagered_amount ?? entry.wagered ?? entry.totalWagered ?? 0),
      rank: entry.rank ?? index + 1,
    }))

    const sorted = [...normalized].sort((a, b) => b.wagered - a.wagered)
    const ranked = sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      prize: prizeForRank(idx + 1),
    }))

    // Format dates
    const startDate = new Date(from * 1000)
    const endDate = new Date(to * 1000)
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      })
    }

    return NextResponse.json({
      leaderboard: ranked,
      dateRange: {
        start: formatDate(startDate),
        startTime: formatTime(startDate),
        end: formatDate(endDate),
        endTime: formatTime(endDate),
        fromUnix: from,
        toUnix: to,
      },
      prizes: {
        1: 2000,
        2: 1000,
        3: 500,
        4: 175,
        5: 100,
        6: 75,
        7: 50,
        8: 50,
        9: 25,
        10: 25,
      },
    })
  } catch (error) {
    console.error("Error fetching snapshot:", error)
    return NextResponse.json(
      { error: "Failed to fetch snapshot" },
      { status: 500 }
    )
  }
}

