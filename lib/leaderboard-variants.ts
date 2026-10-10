import {
  DEFAULT_LEADERBOARD_END_DATE,
  DEFAULT_LEADERBOARD_START_DATE,
} from "@/lib/leaderboard-dates"

export type LeaderboardVariantConfig = {
  cachePrefix: string
  apiPath: string
  prizeMap: Record<number, number>
  isoDateFromKeys: string[]
  isoDateToKeys: string[]
  unixFromKeys: string[]
  unixToKeys: string[]
  defaultStartDate: string
  defaultEndDate: string
  /** When true, race dates and countdown come from the API response (not client env). */
  datesFromApi?: boolean
}

export const BOMBASTIC_VARIANT: LeaderboardVariantConfig = {
  cachePrefix: "leaderboard",
  apiPath: "/api/leaderboard",
  prizeMap: { 1: 1500, 2: 800, 3: 450, 4: 250 },
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
  datesFromApi: true,
}

export const BITFORTUNE_STREAMER_VARIANT: LeaderboardVariantConfig = {
  cachePrefix: "bitfortune-streamer",
  apiPath: "/api/bitfortune/leaderboard",
  prizeMap: { 1: 2500, 2: 1500, 3: 600, 4: 400 },
  isoDateFromKeys: [
    "BITFORTUNE_STREAMER_DATE_FROM",
    "BITFORTUNE_STREAMER_FROM_DATE",
    "NEXT_PUBLIC_BITFORTUNE_STREAMER_FROM_DATE",
    "NEXT_PUBLIC_BITFORTUNE_STREAMER_DATE_FROM",
  ],
  isoDateToKeys: [
    "BITFORTUNE_STREAMER_DATE_TO",
    "BITFORTUNE_STREAMER_TO_DATE",
    "NEXT_PUBLIC_BITFORTUNE_STREAMER_TO_DATE",
    "NEXT_PUBLIC_BITFORTUNE_STREAMER_DATE_TO",
  ],
  unixFromKeys: ["BITFORTUNE_STREAMER_FROM", "NEXT_PUBLIC_BITFORTUNE_STREAMER_FROM"],
  unixToKeys: [
    "BITFORTUNE_STREAMER_END_AT",
    "BITFORTUNE_STREAMER_TO",
    "NEXT_PUBLIC_BITFORTUNE_STREAMER_TO",
    "NEXT_PUBLIC_BITFORTUNE_STREAMER_END_AT",
  ],
  defaultStartDate: "2026-06-10",
  defaultEndDate: "2026-07-10",
}

/** Default Metaspins prizes (1st→6th). Override with NEXT_PUBLIC_METASPINS_PRIZES / METASPINS_PRIZES. */
export const DEFAULT_META_PRIZE_MAP: Record<number, number> = {
  1: 2500,
  2: 1200,
  3: 600,
  4: 350,
  5: 250,
  6: 100,
}

/**
 * Parse a prize list string into a rank→amount map.
 * Accepted formats:
 * - "2500,1200,600,350,250,100" (rank order, 1st first)
 * - "2500 1200 600 350 250 100"
 * - "1:2500,2:1200,3:600"
 */
export function parsePrizeList(raw: string | undefined | null): Record<number, number> | null {
  if (!raw?.trim()) return null

  const trimmed = raw.trim()
  const map: Record<number, number> = {}

  if (trimmed.includes(":")) {
    for (const part of trimmed.split(/[,;\s]+/)) {
      if (!part) continue
      const [rankRaw, amountRaw] = part.split(":")
      const rank = Number(rankRaw)
      const amount = Number(String(amountRaw ?? "").replace(/[$,]/g, ""))
      if (!Number.isFinite(rank) || rank < 1 || !Number.isFinite(amount) || amount < 0) continue
      map[rank] = amount
    }
  } else {
    const amounts = trimmed
      .split(/[,;\s]+/)
      .map((s) => Number(s.replace(/[$,]/g, "")))
      .filter((n) => Number.isFinite(n) && n >= 0)
    amounts.forEach((amount, index) => {
      map[index + 1] = amount
    })
  }

  return Object.keys(map).length > 0 ? map : null
}

export function resolveMetaPrizeMap(): Record<number, number> {
  const fromEnv = parsePrizeList(
    process.env.NEXT_PUBLIC_METASPINS_PRIZES || process.env.METASPINS_PRIZES
  )
  return fromEnv ?? { ...DEFAULT_META_PRIZE_MAP }
}

export function sumPrizePool(map: Record<number, number>): number {
  return Object.values(map).reduce((sum, amount) => sum + amount, 0)
}

/** e.g. 5000 → "5K", 2500 → "2.5K", 750 → "$750" */
export function formatPoolLabel(total: number): string {
  if (!Number.isFinite(total) || total <= 0) return "0"
  if (total >= 1000) {
    const k = total / 1000
    const label = Number.isInteger(k) ? String(k) : String(parseFloat(k.toFixed(1)))
    return `${label}K`
  }
  return `$${total.toLocaleString()}`
}

const META_STREAMER_BASE: Omit<LeaderboardVariantConfig, "prizeMap"> = {
  cachePrefix: "meta-streamer",
  apiPath: "/api/meta/leaderboard",
  isoDateFromKeys: [
    "METASPINS_DATE_FROM",
    "METASPINS_FROM_DATE",
    "NEXT_PUBLIC_METASPINS_FROM_DATE",
    "NEXT_PUBLIC_METASPINS_DATE_FROM",
  ],
  isoDateToKeys: [
    "METASPINS_DATE_TO",
    "METASPINS_TO_DATE",
    "NEXT_PUBLIC_METASPINS_TO_DATE",
    "NEXT_PUBLIC_METASPINS_DATE_TO",
  ],
  unixFromKeys: ["METASPINS_FROM", "NEXT_PUBLIC_METASPINS_FROM"],
  unixToKeys: [
    "METASPINS_END_AT",
    "METASPINS_TO",
    "NEXT_PUBLIC_METASPINS_TO",
    "NEXT_PUBLIC_METASPINS_END_AT",
  ],
  defaultStartDate: "2026-07-01",
  defaultEndDate: "2026-07-31",
}

/** Static fallback (defaults). Prefer getMetaStreamerVariant() so env prizes apply. */
export const META_STREAMER_VARIANT: LeaderboardVariantConfig = {
  ...META_STREAMER_BASE,
  prizeMap: { ...DEFAULT_META_PRIZE_MAP },
}

export function getMetaStreamerVariant(): LeaderboardVariantConfig {
  return {
    ...META_STREAMER_BASE,
    prizeMap: resolveMetaPrizeMap(),
  }
}

/** Default Daler prizes (1st→4th). Override with NEXT_PUBLIC_DALER_PRIZES. */
export const DEFAULT_DALER_PRIZE_MAP: Record<number, number> = {
  1: 1200,
  2: 500,
  3: 200,
  4: 100,
}

export function resolveDalerPrizeMap(): Record<number, number> {
  const fromEnv = parsePrizeList(process.env.NEXT_PUBLIC_DALER_PRIZES)
  return fromEnv ?? { ...DEFAULT_DALER_PRIZE_MAP }
}

const DALER_BASE: Omit<LeaderboardVariantConfig, "prizeMap"> = {
  cachePrefix: "daler",
  apiPath: "/api/daler/leaderboard",
  isoDateFromKeys: ["DALER_DATE_FROM"],
  isoDateToKeys: ["DALER_DATE_TO"],
  unixFromKeys: ["DALER_FROM"],
  unixToKeys: ["DALER_TO"],
  defaultStartDate: "2026-10-09",
  defaultEndDate: "2026-10-31",
  datesFromApi: true,
}

export const DALER_VARIANT: LeaderboardVariantConfig = {
  ...DALER_BASE,
  prizeMap: { ...DEFAULT_DALER_PRIZE_MAP },
}

export function getDalerVariant(): LeaderboardVariantConfig {
  return {
    ...DALER_BASE,
    prizeMap: resolveDalerPrizeMap(),
  }
}

export function prizeForRank(map: Record<number, number>, rank: number): number {
  return map[rank] ?? 0
}

export type SnapshotVariantId = "bombastic" | "bitfortune" | "meta" | "daler"

export type SnapshotVariantMeta = LeaderboardVariantConfig & {
  title: string
  prizePoolTotal: number
}

export const SNAPSHOT_VARIANTS: Record<SnapshotVariantId, SnapshotVariantMeta> = {
  bombastic: {
    ...BOMBASTIC_VARIANT,
    title: "Streaming Shack and Diamond Dixie 3K Wager Race",
    prizePoolTotal: 3000,
  },
  bitfortune: {
    ...BITFORTUNE_STREAMER_VARIANT,
    title: "Streaming Shack 5K Wager Race",
    prizePoolTotal: 5000,
  },
  meta: {
    ...META_STREAMER_VARIANT,
    title: "Streaming Shack 5K Metaspins Wager Race",
    prizePoolTotal: 5000,
  },
  daler: {
    ...DALER_VARIANT,
    title: "Streaming Shack 2K Daler Wager Race",
    prizePoolTotal: 2000,
  },
}

/** Resolve variant config at runtime (Metaspins/Daler prizes/title come from env). */
export function getSnapshotVariant(id: SnapshotVariantId): SnapshotVariantMeta {
  if (id === "meta") {
    const prizeMap = resolveMetaPrizeMap()
    const prizePoolTotal = sumPrizePool(prizeMap)
    const poolLabel = formatPoolLabel(prizePoolTotal)
    return {
      ...META_STREAMER_BASE,
      prizeMap,
      prizePoolTotal,
      title: `Streaming Shack ${poolLabel} Metaspins Wager Race`,
    }
  }
  if (id === "daler") {
    const prizeMap = resolveDalerPrizeMap()
    const prizePoolTotal = sumPrizePool(prizeMap)
    const poolLabel = formatPoolLabel(prizePoolTotal)
    return {
      ...DALER_BASE,
      prizeMap,
      prizePoolTotal,
      title: `Streaming Shack ${poolLabel} Daler Wager Race`,
    }
  }
  return SNAPSHOT_VARIANTS[id]
}

export function parseSnapshotVariant(value: string | null | undefined): SnapshotVariantId {
  if (value === "bitfortune") return "bitfortune"
  if (value === "meta") return "meta"
  if (value === "daler") return "daler"
  return "bombastic"
}
