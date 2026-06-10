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

export function prizeForRank(map: Record<number, number>, rank: number): number {
  return map[rank] ?? 0
}

export type SnapshotVariantId = "bombastic" | "bitfortune"

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
}

export function parseSnapshotVariant(value: string | null | undefined): SnapshotVariantId {
  return value === "bitfortune" ? "bitfortune" : "bombastic"
}
