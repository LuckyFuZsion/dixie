import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Neo leaderboard · Streaming Shack and Diamond Dixie 3K Wager Race",
  description:
    "Alternate futuristic UI for the 3K wager race leaderboard—same data and schedule as the classic view.",
}

export default function NewLeaderboardLayout({ children }: { children: ReactNode }) {
  return children
}
