import { resolveVariantRange } from "@/lib/leaderboard-dates"
import {
  parseSnapshotVariant,
  prizeForRank,
  SNAPSHOT_VARIANTS,
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
  const config = SNAPSHOT_VARIANTS[variant]
  const range = resolveVariantRange(config, searchParams)

  const entries =
    variant === "bitfortune"
      ? await fetchBitfortuneEntries(range.fromUnix, range.toUnix)
      : await fetchBombasticEntries()

  const leaderboard = rankPlayers(entries, config.prizeMap)
  const prizes = {
    1: prizeForRank(config.prizeMap, 1),
    2: prizeForRank(config.prizeMap, 2),
    3: prizeForRank(config.prizeMap, 3),
    4: prizeForRank(config.prizeMap, 4),
  }

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

export function formatSnapshotMessage(
  snapshot: LeaderboardSnapshot,
  options?: { maskUsernames?: boolean }
): string {
  const { leaderboard, dateRange, prizes, title, prizePoolTotal } = snapshot
  const maskUsernames = options?.maskUsernames ?? false

  let message = `🏆 **${title}** 🏆\n\n`
  message += `📅 **Period:** ${dateRange.start} ${dateRange.startTime} → ${dateRange.end} ${dateRange.endTime}\n\n`
  message += `💰 **Prize Pool ($${prizePoolTotal.toLocaleString()}):**\n`
  message += `🥇 1st: $${prizes[1]}\n`
  message += `🥈 2nd: $${prizes[2]}\n`
  message += `🥉 3rd: $${prizes[3]}\n`
  message += `4th: $${prizes[4]}\n\n`
  message += `**Current Standings:**\n\n`

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
