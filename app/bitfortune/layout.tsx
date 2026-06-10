import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "BitFortune leaderboard · Streaming Shack and Diamond Dixie 5K Wager Race",
  description:
    "BitFortune streamer wager race leaderboard with a $5,000 prize pool. Updates every 15 minutes.",
}

export default function BitfortuneLeaderboardLayout({ children }: { children: ReactNode }) {
  return children
}
