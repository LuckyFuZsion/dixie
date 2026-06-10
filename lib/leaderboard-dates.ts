import type { LeaderboardVariantConfig } from "@/lib/leaderboard-variants"

/** Calendar dates only (UTC). Casino API still receives these as Unix `from` / `to`. */

export const DEFAULT_LEADERBOARD_START_DATE = "2026-05-01"
export const DEFAULT_LEADERBOARD_END_DATE = "2026-05-17"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const LEADERBOARD_DURATION_DAYS = 28

export type LeaderboardRange = {
  startAt: string
  endAt: string
  fromUnix: number
  toUnix: number
  endTimeMs: number
}

export function isIsoDateString(s: string): boolean {
  return ISO_DATE.test(s.trim())
}

export function utcStartOfDayUnix(isoDate: string): number {
  return Math.floor(new Date(isoDate.trim() + "T00:00:00.000Z").getTime() / 1000)
}

export function utcEndOfDayUnix(isoDate: string): number {
  return Math.floor(new Date(isoDate.trim() + "T23:59:59.999Z").getTime() / 1000)
}

export function formatYYYYMMDDUTC(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function calculateEndDateUnix(startUnix: number): number {
  const startDate = new Date(startUnix * 1000)
  const startOfDay = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 0, 0, 0, 0)
  )
  const endDate = new Date(startOfDay.getTime() + LEADERBOARD_DURATION_DAYS * 24 * 60 * 60 * 1000 - 1)
  return Math.floor(endDate.getTime() / 1000)
}

function rangeFromUnixTimestamps(fromUnix: number, toUnix: number): LeaderboardRange {
  const startDate = new Date(fromUnix * 1000)
  const endDate = new Date(toUnix * 1000)
  return {
    startAt: formatYYYYMMDDUTC(startDate),
    endAt: formatYYYYMMDDUTC(endDate),
    fromUnix,
    toUnix,
    endTimeMs: toUnix * 1000,
  }
}

export function rangeFromIsoDates(startIso: string, endIso: string): LeaderboardRange {
  const startAt = startIso.trim()
  const endAt = endIso.trim()
  const fromUnix = utcStartOfDayUnix(startAt)
  const toUnix = utcEndOfDayUnix(endAt)
  return {
    startAt,
    endAt,
    fromUnix,
    toUnix,
    endTimeMs: toUnix * 1000,
  }
}

function readEnv(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]
    if (value) return value
  }
  return undefined
}

type RangeConfig = Pick<
  LeaderboardVariantConfig,
  "isoDateFromKeys" | "isoDateToKeys" | "unixFromKeys" | "unixToKeys" | "defaultStartDate" | "defaultEndDate"
>

/** Resolve the active race window for a leaderboard variant (server env + optional query overrides). */
export function resolveVariantRange(config: RangeConfig, searchParams?: URLSearchParams): LeaderboardRange {
  const startIso = searchParams?.get("start") ?? undefined
  const endIso = searchParams?.get("end") ?? undefined
  const fromParam = searchParams?.get("from") ?? undefined
  const toParam = searchParams?.get("to") ?? undefined

  if (startIso && endIso && isIsoDateString(startIso) && isIsoDateString(endIso)) {
    return rangeFromIsoDates(startIso, endIso)
  }

  if (fromParam && /^\d+$/.test(fromParam.trim())) {
    const fromUnix = parseInt(fromParam, 10)
    const toUnix =
      toParam && /^\d+$/.test(toParam.trim()) ? parseInt(toParam, 10) : calculateEndDateUnix(fromUnix)
    return rangeFromUnixTimestamps(fromUnix, toUnix)
  }

  const dateFrom = readEnv(config.isoDateFromKeys)
  const dateTo = readEnv(config.isoDateToKeys)
  if (dateFrom && dateTo && isIsoDateString(dateFrom) && isIsoDateString(dateTo)) {
    return rangeFromIsoDates(dateFrom, dateTo)
  }

  const unixFrom = readEnv(config.unixFromKeys)
  const unixTo = readEnv(config.unixToKeys)
  if (unixFrom && /^\d+$/.test(unixFrom.trim())) {
    const fromUnix = parseInt(unixFrom, 10)
    const toUnix =
      unixTo && /^\d+$/.test(unixTo.trim()) ? parseInt(unixTo, 10) : calculateEndDateUnix(fromUnix)
    return rangeFromUnixTimestamps(fromUnix, toUnix)
  }

  return rangeFromIsoDates(config.defaultStartDate, config.defaultEndDate)
}

const BOMBASTIC_RANGE_CONFIG: RangeConfig = {
  isoDateFromKeys: [
    "LEADERBOARD_DATE_FROM",
    "BITFORTUNE_DATE_FROM",
    "BITFORTUNE_START_DATE",
    "NEXT_PUBLIC_LEADERBOARD_FROM_DATE",
    "NEXT_PUBLIC_LEADERBOARD_DATE_FROM",
  ],
  isoDateToKeys: [
    "LEADERBOARD_DATE_TO",
    "BITFORTUNE_DATE_TO",
    "BITFORTUNE_END_DATE",
    "NEXT_PUBLIC_LEADERBOARD_TO_DATE",
    "NEXT_PUBLIC_LEADERBOARD_DATE_TO",
  ],
  unixFromKeys: ["BITFORTUNE_FROM", "NEXT_PUBLIC_BITFORTUNE_FROM"],
  unixToKeys: [
    "BITFORTUNE_END_AT",
    "BITFORTUNE_TO",
    "NEXT_PUBLIC_BITFORTUNE_TO",
    "NEXT_PUBLIC_BITFORTUNE_END_AT",
  ],
  defaultStartDate: DEFAULT_LEADERBOARD_START_DATE,
  defaultEndDate: DEFAULT_LEADERBOARD_END_DATE,
}

/** Resolve the Bombastic race window (server-side env, optional query overrides). */
export function resolveLeaderboardRange(searchParams?: URLSearchParams): LeaderboardRange {
  return resolveVariantRange(BOMBASTIC_RANGE_CONFIG, searchParams)
}
