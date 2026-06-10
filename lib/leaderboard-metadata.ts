import type { Metadata } from "next"
import {
  resolveLeaderboardRange,
  resolveVariantRange,
  type LeaderboardRange,
} from "@/lib/leaderboard-dates"
import {
  BITFORTUNE_STREAMER_VARIANT,
  prizeForRank,
  SNAPSHOT_VARIANTS,
  type SnapshotVariantId,
} from "@/lib/leaderboard-variants"

/** Bump when OG assets change so social crawlers fetch fresh previews. */
const OG_IMAGE_CACHE_VERSION = "2"

const OG_IMAGES: Record<SnapshotVariantId, { path: string; alt: string }> = {
  bombastic: {
    path: "/og-image.png",
    alt: "Streaming Shack and Diamond Dixie 3K Wager Race — Bombastic promotional banner",
  },
  bitfortune: {
    path: "/images/og-img-bitfortune.png",
    alt: "Streaming Shack 5K Wager Race — BitFortune promotional banner",
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
  return resolveVariantRange(BITFORTUNE_STREAMER_VARIANT)
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z")
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function formatPrizeBreakdown(prizeMap: Record<number, number>): string {
  const ranks = [1, 2, 3, 4] as const
  const labels = ["1st", "2nd", "3rd", "4th"] as const
  return ranks
    .map((rank, i) => `${labels[i]} $${prizeForRank(prizeMap, rank).toLocaleString()}`)
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
  const brand = variantId === "bitfortune" ? "Streaming Shack" : "Bombastic"
  const poolLabel = variantId === "bitfortune" ? "5K" : "3K"

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
