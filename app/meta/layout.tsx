import type { Metadata } from "next"
import type { ReactNode } from "react"
import { buildLeaderboardSocialMetadata } from "@/lib/leaderboard-metadata"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...buildLeaderboardSocialMetadata("meta"),
    keywords: [
      "Metaspins",
      "Streaming Shack",
      "leaderboard",
      "5K Wager Race",
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
