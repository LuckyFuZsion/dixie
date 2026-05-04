/** Calendar dates only (UTC). Casino API still receives these as Unix `from` / `to`. */

export const DEFAULT_LEADERBOARD_START_DATE = "2026-05-01"
export const DEFAULT_LEADERBOARD_END_DATE = "2026-05-17"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDateString(s: string): boolean {
  return ISO_DATE.test(s.trim())
}

export function utcStartOfDayUnix(isoDate: string): number {
  return Math.floor(new Date(isoDate.trim() + "T00:00:00.000Z").getTime() / 1000)
}

export function utcEndOfDayUnix(isoDate: string): number {
  return Math.floor(new Date(isoDate.trim() + "T23:59:59.999Z").getTime() / 1000)
}

export function rangeFromIsoDates(startIso: string, endIso: string) {
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
