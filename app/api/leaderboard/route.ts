import { NextResponse } from "next/server"

function formatDateYYYYMMDD(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function computeRolling12thRangeUTC(now: Date): { startAt: string; endAt: string } {
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
  return { startAt: formatDateYYYYMMDD(start), endAt: formatDateYYYYMMDD(end) }
}

export async function GET(request: Request) {
  try {
    const baseUrl = process.env.RAINBET_API_URL || "https://services.rainbet.com/v1/external/affiliates"
    const apiKeyEnv = process.env.RAINBET_API_KEY

    const reqUrl = new URL(request.url)

    const startAtEnv = process.env.RAINBET_START_AT
    const endAtEnv = process.env.RAINBET_END_AT

    const now = new Date()
    const rolling = computeRolling12thRangeUTC(now)

    const startAt = reqUrl.searchParams.get("start_at") || startAtEnv || rolling.startAt
    const endAt = reqUrl.searchParams.get("end_at") || endAtEnv || rolling.endAt
    const apiKey = apiKeyEnv || reqUrl.searchParams.get("key")

    if (!apiKey) {
      return NextResponse.json({ error: "Missing RAINBET_API_KEY" }, { status: 500 })
    }

    const url = new URL(baseUrl)
    url.searchParams.set("start_at", startAt)
    url.searchParams.set("end_at", endAt)
    url.searchParams.set("key", apiKey)

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream error ${response.status}` }, { status: response.status })
    }

    const data = await response.json()

    const array = Array.isArray((data as any)?.affiliates)
      ? (data as any).affiliates
      : Array.isArray(data)
        ? data
        : Array.isArray((data as any).leaderboard)
          ? (data as any).leaderboard
          : Array.isArray((data as any).data)
            ? (data as any).data
            : []

    const normalized = array.map((entry: any, index: number) => ({
      id: entry.id ?? String(index + 1),
      username: entry.username ?? entry.name ?? `Player${index + 1}`,
      wagered: Number(entry.wagered_amount ?? entry.wagered ?? entry.totalWagered ?? 0),
      prize: Number(entry.prize ?? entry.reward ?? 0),
      rank: entry.rank ?? index + 1,
    }))

    return NextResponse.json(normalized)
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
