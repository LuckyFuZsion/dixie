import type { Metadata } from "next"
import {
  resolveLeaderboardRange,
  resolveVariantRange,
  type LeaderboardRange,
} from "@/lib/leaderboard-dates"
import {
  BITFORTUNE_STREAMER_VARIANT,
  META_STREAMER_VARIANT,
  prizeForRank,
  SNAPSHOT_VARIANTS,
  type SnapshotVariantId,
} from "@/lib/leaderboard-variants"

/** Bump when OG assets change so social crawlers fetch fresh previews. */
const OG_IMAGE_CACHE_VERSION = "5"

const OG_SITE_NAMES: Record<SnapshotVariantId, string> = {
  bombastic: "Streaming Shack and Diamond Dixie",
  bitfortune: "Streaming Shack",
  meta: "Streaming Shack",
}

const OG_IMAGES: Record<SnapshotVariantId, { path: string; alt: string }> = {
  bombastic: {
    path: "/og-image.png",
    alt: "Streaming Shack and Diamond Dixie 3K Wager Race — Bombastic promotional banner",
  },
  bitfortune: {
    path: "/images/og-bitfortune.png",
    alt: "Streaming Shack 5K Wager Race — BitFortune promotional banner",
  },
  meta: {
    path: "/metaspins-opengraph.png",
    alt: "Streaming Shack 5K Metaspins Wager Race — Metaspins promotional banner",
  },
}

function ogImageUrl(path: string): string {
  return `${path}?v=${OG_IMAGE_CACHE_VERSION}`
}

/** Same date resolution the live leaderboards use (server env via variant config). */
export function resolveRangeForVariant(variantId: SnapshotVariantId): LeaderboardRange {
  if (variantId === "bombastic") {
    return resolveLeaderboardRange()
  }
  if (variantId === "meta") {
    return resolveVariantRange(META_STREAMER_VARIANT)
  }
  return resolveVariantRange(BITFORTUNE_STREAMER_VARIANT)
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z")
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function ordinalLabel(rank: number): string {
  if (rank === 1) return "1st"
  if (rank === 2) return "2nd"
  if (rank === 3) return "3rd"
  return `${rank}th`
}

function formatPrizeBreakdown(prizeMap: Record<number, number>): string {
  return Object.keys(prizeMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((rank) => `${ordinalLabel(rank)} $${prizeForRank(prizeMap, rank).toLocaleString()}`)
    .join(", ")
}

type SocialMetadataOptions = {
  titlePrefix?: string
  descriptionLead?: string
}

export function buildLeaderboardSocialMetadata(
  variantId: SnapshotVariantId,
  options?: SocialMetadataOptions
): Pick<Metadata, "title" | "description" | "openGraph" | "twitter"> {
  const variant = SNAPSHOT_VARIANTS[variantId]
  const range = resolveRangeForVariant(variantId)
  const start = formatDisplayDate(range.startAt)
  const end = formatDisplayDate(range.endAt)
  const prizes = formatPrizeBreakdown(variant.prizeMap)
  const brand =
    variantId === "meta" ? "Metaspins" : variantId === "bitfortune" ? "BitFortune" : "Bombastic"
  const poolLabel = variantId === "bombastic" ? "3K" : "5K"

  const title = options?.titlePrefix ? `${options.titlePrefix} · ${variant.title}` : variant.title

  const raceDetails = `${brand} ${poolLabel} Wager Race · ${start} – ${end} · $${variant.prizePoolTotal.toLocaleString()} prize pool (${prizes})`
  const description = options?.descriptionLead
    ? `${options.descriptionLead} ${raceDetails} Leaderboard updates every 15 minutes.`
    : `${raceDetails}. Leaderboard updates every 15 minutes.`

  const ogImage = OG_IMAGES[variantId]
  const imageUrl = ogImageUrl(ogImage.path)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: OG_SITE_NAMES[variantId],
      images: [{ url: imageUrl, alt: ogImage.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}
