import { readFile } from "fs/promises"
import path from "path"
import { resolveVariantRange } from "@/lib/leaderboard-dates"
import {
  getSnapshotVariant,
  parseSnapshotVariant,
  prizeForRank,
  type SnapshotVariantId,
} from "@/lib/leaderboard-variants"

const DEFAULT_LEADERBOARD_EXPORT_URL =
  "https://exportdata.xcdn.tech/bombastic-affiliate-leaderboard-export/3633/1960940194/304548477.json"

const DEFAULT_STREAMER_API_URL =
  "https://platformv2.bitfortune.com/api/v1/refx/streamer/leaderboard"

export type SnapshotPlayer = {
  id: string
  username: string
  wagered: number
  prize: number
  rank: number
}

export type SnapshotDateRange = {
  start: string
  startTime: string
  end: string
  endTime: string
}

export type LeaderboardSnapshot = {
  variant: SnapshotVariantId
  title: string
  prizePoolTotal: number
  leaderboard: SnapshotPlayer[]
  dateRange: SnapshotDateRange
  prizes: Record<number, number>
}

function formatDateRange(fromUnix: number, toUnix: number): SnapshotDateRange {
  const startDate = new Date(fromUnix * 1000)
  const endDate = new Date(toUnix * 1000)

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    })

  return {
    start: formatDate(startDate),
    startTime: formatTime(startDate),
    end: formatDate(endDate),
    endTime: formatTime(endDate),
  }
}

function rankPlayers(
  entries: Array<{ id: string; username: string; wagered: number }>,
  prizeMap: Record<number, number>
): SnapshotPlayer[] {
  const sorted = [...entries].sort((a, b) => b.wagered - a.wagered)
  return sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    prize: prizeForRank(prizeMap, idx + 1),
  }))
}

function prizesFromMap(prizeMap: Record<number, number>): Record<number, number> {
  const prizes: Record<number, number> = {}
  for (const rank of Object.keys(prizeMap)
    .map(Number)
    .sort((a, b) => a - b)) {
    prizes[rank] = prizeForRank(prizeMap, rank)
  }
  return prizes
}

async function fetchBombasticEntries(): Promise<Array<{ id: string; username: string; wagered: number }>> {
  const exportUrl = process.env.LEADERBOARD_EXPORT_URL || DEFAULT_LEADERBOARD_EXPORT_URL
  const response = await fetch(exportUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Bombastic leaderboard: ${response.status}`)
  }

  const data = await response.json()
  const array = Array.isArray(data) ? data : []

  return array.map((entry: Record<string, unknown>, index: number) => ({
    id: entry.playerId != null ? String(entry.playerId) : String(index + 1),
    username: String(entry.username ?? `Player${index + 1}`),
    wagered: Number(entry.bets ?? entry.wagered ?? entry.total_wager_usd ?? 0),
  }))
}

function extractDalerRows(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>
  const payload = data as { items?: Array<{ rows?: unknown[] }>; rows?: unknown[]; leaderboard?: unknown[] }
  if (Array.isArray(payload.rows)) return payload.rows as Array<Record<string, unknown>>
  if (Array.isArray(payload.items)) {
    const withRows = payload.items.find((item) => Array.isArray(item.rows) && item.rows!.length > 0)
    if (withRows?.rows) return withRows.rows as Array<Record<string, unknown>>
    const first = payload.items[0]
    if (Array.isArray(first?.rows)) return first.rows as Array<Record<string, unknown>>
  }
  if (Array.isArray(payload.leaderboard)) return payload.leaderboard as Array<Record<string, unknown>>
  return []
}

const DEFAULT_DALER_EXPORT_URL =
  "https://api.daler.com/revibe/tournaments/public/streaming-shack/active?page=0&size=10"

async function fetchDalerEntries(): Promise<Array<{ id: string; username: string; wagered: number }>> {
  const exportUrl = process.env.DALER_EXPORT_URL || DEFAULT_DALER_EXPORT_URL
  let data: unknown
  try {
    const response = await fetch(exportUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch Daler leaderboard: ${response.status}`)
    }
    data = await response.json()
  } catch {
    const raw = await readFile(path.join(process.cwd(), "active.json"), "utf8")
    data = JSON.parse(raw)
  }

  return extractDalerRows(data).map((entry, index) => ({
    id: String(entry.playerId ?? entry.userId ?? entry.id ?? entry.player ?? index + 1),
    username: String(
      entry.player ?? entry.username ?? entry.userName ?? entry.displayName ?? entry.name ?? `Player${index + 1}`
    ),
    wagered: Number(
      entry.points ?? entry.bets ?? entry.wagered ?? entry.totalWagered ?? entry.score ?? entry.amount ?? 0
    ),
  }))
}

async function fetchBitfortuneEntries(
  fromUnix: number,
  toUnix: number
): Promise<Array<{ id: string; username: string; wagered: number }>> {
  const apiKey = process.env.BITFORTUNE_STREAMER_API_KEY || process.env.BITFORTUNE_API_KEY
  const baseUrl = process.env.BITFORTUNE_STREAMER_API_URL || DEFAULT_STREAMER_API_URL

  if (!apiKey) {
    throw new Error("BitFortune API key not configured")
  }

  const upstream = new URL(baseUrl)
  upstream.searchParams.set("api_key", apiKey)
  upstream.searchParams.set("from", String(fromUnix))
  upstream.searchParams.set("to", String(toUnix))

  const response = await fetch(upstream.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch BitFortune leaderboard: ${response.status}`)
  }

  const data = await response.json()
  const array = Array.isArray(data) ? data : []

  return array.map((entry: Record<string, unknown>, index: number) => ({
    id: entry.user_id != null ? String(entry.user_id) : String(index + 1),
    username: String(entry.user_name ?? entry.username ?? `Player${index + 1}`),
    wagered: Number(entry.total_wager_usd ?? entry.wagered ?? 0),
  }))
}

export async function buildLeaderboardSnapshot(
  variantInput: string | null | undefined,
  searchParams?: URLSearchParams
): Promise<LeaderboardSnapshot> {
  const variant = parseSnapshotVariant(variantInput)
  const config = getSnapshotVariant(variant)
  const range = resolveVariantRange(config, searchParams)

  const entries =
    variant === "bitfortune"
      ? await fetchBitfortuneEntries(range.fromUnix, range.toUnix)
      : variant === "daler"
        ? await fetchDalerEntries()
        : await fetchBombasticEntries()

  const leaderboard = rankPlayers(entries, config.prizeMap)
  const prizes = prizesFromMap(config.prizeMap)

  return {
    variant,
    title: config.title,
    prizePoolTotal: config.prizePoolTotal,
    leaderboard,
    dateRange: formatDateRange(range.fromUnix, range.toUnix),
    prizes,
  }
}

export function maskUsernameForDiscord(username: string): string {
  if (username === "Awaiting player" || username.length <= 4) {
    return username
  }
  const originalLength = username.length
  const firstTwo = username.slice(0, 2).toUpperCase()
  const lastTwo = username.slice(-2)
  const asterisks = "*".repeat(Math.max(0, originalLength - 4))
  return `${firstTwo}${asterisks}${lastTwo}`
}

function ordinalPrizeLine(rank: number, amount: number): string {
  if (rank === 1) return `🥇 1st: $${amount}`
  if (rank === 2) return `🥈 2nd: $${amount}`
  if (rank === 3) return `🥉 3rd: $${amount}`
  return `${rank}th: $${amount}`
}

export function formatSnapshotMessage(
  snapshot: LeaderboardSnapshot,
  options?: { maskUsernames?: boolean }
): string {
  const { leaderboard, dateRange, prizes, title, prizePoolTotal } = snapshot
  const maskUsernames = options?.maskUsernames ?? false

  let message = `🏆 **${title}** 🏆\n\n`
  message += `📅 **Period:** ${dateRange.start} ${dateRange.startTime} → ${dateRange.end} ${dateRange.endTime}\n\n`
  message += `💰 **Prize Pool ($${prizePoolTotal.toLocaleString()}):**\n`
  for (const rank of Object.keys(prizes)
    .map(Number)
    .sort((a, b) => a - b)) {
    message += `${ordinalPrizeLine(rank, prizes[rank])}\n`
  }
  message += `\n**Current Standings:**\n\n`

  leaderboard.slice(0, 20).forEach((player) => {
    const medal = player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : ""
    const rankStr = medal ? `${medal} **${player.rank}.**` : `${player.rank}.`
    const prizeStr = player.prize > 0 ? ` | Prize: **$${player.prize}**` : ""

    if (player.username === "Awaiting player" || player.wagered === 0) {
      message += `${rankStr} *Awaiting player*${prizeStr}\n`
      return
    }

    const displayName = maskUsernames ? maskUsernameForDiscord(player.username) : player.username
    const nameStr = maskUsernames ? `\`${displayName}\`` : displayName
    const wagered = player.wagered.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    message += `${rankStr} ${nameStr} - $${wagered}${prizeStr}\n`
  })

  message += `\n---\n*Updated: ${new Date().toLocaleString()}*`
  return message
}
