import type { Metadata } from "next"
import type { ReactNode } from "react"
import { buildLeaderboardSocialMetadata } from "@/lib/leaderboard-metadata"
import { formatPoolLabel, getSnapshotVariant } from "@/lib/leaderboard-variants"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const meta = getSnapshotVariant("meta")
  const poolLabel = formatPoolLabel(meta.prizePoolTotal)

  return {
    ...buildLeaderboardSocialMetadata("meta"),
    keywords: [
      "Metaspins",
      "Streaming Shack",
      "leaderboard",
      `${poolLabel} Wager Race`,
      "wager race",
      "streamer",
      "Crossfade",
    ],
    authors: [{ name: "Streaming Shack" }],
  }
}

export default function MetaLeaderboardLayout({ children }: { children: ReactNode }) {
  return children
}
