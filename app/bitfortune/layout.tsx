import type { Metadata } from "next"
import type { ReactNode } from "react"
import { buildLeaderboardSocialMetadata } from "@/lib/leaderboard-metadata"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const social = buildLeaderboardSocialMetadata("bitfortune")

  return {
    ...social,
    keywords: [
      "BitFortune",
      "Streaming Shack",
      "leaderboard",
      "5K Wager Race",
      "wager race",
      "streamer",
    ],
  }
}

export default function BitfortuneLeaderboardLayout({ children }: { children: ReactNode }) {
  return children
}
