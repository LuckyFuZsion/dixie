import type { Metadata } from "next"
import type { ReactNode } from "react"
import { buildLeaderboardSocialMetadata } from "@/lib/leaderboard-metadata"
import { formatPoolLabel, getSnapshotVariant } from "@/lib/leaderboard-variants"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const daler = getSnapshotVariant("daler")
  const poolLabel = formatPoolLabel(daler.prizePoolTotal)

  return {
    ...buildLeaderboardSocialMetadata("daler"),
    keywords: [
      "Daler",
      "Streaming Shack",
      "leaderboard",
      `${poolLabel} Wager Race`,
      "wager race",
      "streamer",
    ],
    authors: [{ name: "Streaming Shack" }],
  }
}

export default function DalerLeaderboardLayout({ children }: { children: ReactNode }) {
  return children
}
