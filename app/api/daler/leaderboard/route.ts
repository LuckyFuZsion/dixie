import { readFile } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { resolveVariantRange } from "@/lib/leaderboard-dates"
import { getDalerVariant } from "@/lib/leaderboard-variants"

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

const DEFAULT_DALER_EXPORT_URL =
  "https://api.daler.com/revibe/tournaments/public/streaming-shack/active?page=0&size=10"

type TournamentRow = {
  playerId?: number | string
  userId?: number | string
  id?: number | string
  rank?: number
  player?: string
  username?: string
  userName?: string
  displayName?: string
  name?: string
  bets?: number
  wagered?: number
  totalWagered?: number
  score?: number
  points?: number
  amount?: number
}

type TournamentItem = {
  rows?: TournamentRow[]
  startAt?: string
  endAt?: string
}

type ActivePayload = {
  items?: TournamentItem[]
  rows?: TournamentRow[]
}

function extractRows(data: unknown): TournamentRow[] {
  if (Array.isArray(data)) return data as TournamentRow[]

  const payload = data as ActivePayload
  if (Array.isArray(payload.rows)) return payload.rows

  if (Array.isArray(payload.items)) {
    const withRows = payload.items.find((item) => Array.isArray(item.rows) && item.rows!.length > 0)
    if (withRows?.rows) return withRows.rows
    const first = payload.items[0]
    if (Array.isArray(first?.rows)) return first.rows
  }

  const nested = (data as { leaderboard?: unknown }).leaderboard
  if (Array.isArray(nested)) return nested as TournamentRow[]

  return []
}

async function loadActiveData(): Promise<unknown> {
  const exportUrl = process.env.DALER_EXPORT_URL || DEFAULT_DALER_EXPORT_URL

  try {
    const response = await fetch(exportUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (response.ok) {
      return response.json()
    }
    console.error(`Daler upstream error ${response.status}, falling back to active.json`)
  } catch (error) {
    console.error("Daler upstream fetch failed, falling back to active.json:", error)
  }

  const filePath = path.join(process.cwd(), "active.json")
  const raw = await readFile(filePath, "utf8")
  return JSON.parse(raw)
}

export async function GET(request: Request) {
  try {
    const reqUrl = new URL(request.url)
    const range = resolveVariantRange(getDalerVariant(), reqUrl.searchParams)
    const data = await loadActiveData()
    const rows = extractRows(data)

    const normalized = rows.map((entry, index) => ({
      id: String(entry.playerId ?? entry.userId ?? entry.id ?? entry.player ?? index + 1),
      username: String(
        entry.player ??
          entry.username ??
          entry.userName ??
          entry.displayName ??
          entry.name ??
          `Player${index + 1}`
      ),
      wagered: Number(
        entry.points ?? entry.bets ?? entry.wagered ?? entry.totalWagered ?? entry.score ?? entry.amount ?? 0
      ),
      prize: 0,
      rank: Number(entry.rank ?? index + 1),
    }))

    const sorted = [...normalized].sort((a, b) => b.wagered - a.wagered)
    const ranked = sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }))

    return NextResponse.json(
      {
        leaderboard: ranked,
        range,
      },
      { headers: noStoreHeaders }
    )
  } catch (error) {
    console.error("Error fetching Daler leaderboard:", error)
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      {
        status: 500,
        headers: noStoreHeaders,
      }
    )
  }
}
