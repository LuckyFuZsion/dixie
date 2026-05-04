import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  DEFAULT_LEADERBOARD_END_DATE,
  DEFAULT_LEADERBOARD_START_DATE,
  isIsoDateString,
  utcEndOfDayUnix,
  utcStartOfDayUnix,
} from "@/lib/leaderboard-dates"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get("admin-auth")

    if (authCookie?.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reqUrl = new URL(request.url)
    const LEADERBOARD_DURATION_DAYS = 28

    const calculateEndDateUnix = (startUnix: number): number => {
      const startDate = new Date(startUnix * 1000)
      const startOfDay = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 0, 0, 0, 0)
      )
      const endDate = new Date(
        startOfDay.getTime() + LEADERBOARD_DURATION_DAYS * 24 * 60 * 60 * 1000 - 1
      )
      return Math.floor(endDate.getTime() / 1000)
    }

    let from: number
    let to: number

    const startIso = reqUrl.searchParams.get("start")
    const endIso = reqUrl.searchParams.get("end")
    const fromParam = reqUrl.searchParams.get("from")
    const toParam = reqUrl.searchParams.get("to")

    const dateFromEnv =
      process.env.LEADERBOARD_DATE_FROM ||
      process.env.BITFORTUNE_DATE_FROM ||
      process.env.BITFORTUNE_START_DATE ||
      process.env.NEXT_PUBLIC_LEADERBOARD_FROM_DATE
    const dateToEnv =
      process.env.LEADERBOARD_DATE_TO ||
      process.env.BITFORTUNE_DATE_TO ||
      process.env.BITFORTUNE_END_DATE ||
      process.env.NEXT_PUBLIC_LEADERBOARD_TO_DATE
    const unixFromEnv = process.env.BITFORTUNE_FROM || process.env.NEXT_PUBLIC_BITFORTUNE_FROM
    const unixToEnv =
      process.env.BITFORTUNE_END_AT || process.env.BITFORTUNE_TO || process.env.NEXT_PUBLIC_BITFORTUNE_TO

    if (fromParam !== null && fromParam !== "" && Number.isFinite(Number(fromParam))) {
      from = parseInt(fromParam, 10)
      to =
        toParam !== null && toParam !== "" && Number.isFinite(Number(toParam))
          ? parseInt(toParam, 10)
          : calculateEndDateUnix(from)
    } else if (
      startIso &&
      endIso &&
      isIsoDateString(startIso) &&
      isIsoDateString(endIso)
    ) {
      from = utcStartOfDayUnix(startIso)
      to = utcEndOfDayUnix(endIso)
    } else if (
      dateFromEnv &&
      dateToEnv &&
      isIsoDateString(dateFromEnv) &&
      isIsoDateString(dateToEnv)
    ) {
      from = utcStartOfDayUnix(dateFromEnv)
      to = utcEndOfDayUnix(dateToEnv)
    } else if (unixFromEnv && /^\d+$/.test(unixFromEnv.trim())) {
      from = parseInt(unixFromEnv, 10)
      to =
        unixToEnv && /^\d+$/.test(unixToEnv.trim())
          ? parseInt(unixToEnv, 10)
          : calculateEndDateUnix(from)
    } else {
      from = utcStartOfDayUnix(DEFAULT_LEADERBOARD_START_DATE)
      to = utcEndOfDayUnix(DEFAULT_LEADERBOARD_END_DATE)
    }

    const exportUrl =
      process.env.LEADERBOARD_EXPORT_URL ||
      "https://exportdata.xcdn.tech/bombastic-affiliate-leaderboard-export/3633/1960940194/304548477.json"

    const response = await fetch(exportUrl, {
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

    const prizeForRank = (rank: number): number => {
      const map: Record<number, number> = { 1: 1500, 2: 800, 3: 450, 4: 250 }
      return map[rank] ?? 0
    }

    const normalized = array.map((entry: any, index: number) => ({
      id: entry.playerId != null ? String(entry.playerId) : entry.user_id?.toString() ?? String(index + 1),
      username: entry.username ?? entry.user_name ?? entry.name ?? `Player${index + 1}`,
      wagered: Number(entry.bets ?? entry.total_wager_usd ?? entry.wagered ?? entry.totalWagered ?? 0),
      rank: entry.rank ?? index + 1,
    }))

    const sorted = [...normalized].sort((a, b) => b.wagered - a.wagered)
    const ranked = sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      prize: prizeForRank(idx + 1),
    }))

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
      },
      prizes: {
        1: 1500,
        2: 800,
        3: 450,
        4: 250,
      },
    })
  } catch (error) {
    console.error("Error fetching snapshot:", error)
    return NextResponse.json({ error: "Failed to fetch snapshot" }, { status: 500 })
  }
}
