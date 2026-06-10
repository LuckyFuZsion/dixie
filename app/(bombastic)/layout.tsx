import type { Metadata } from "next"
import type { ReactNode } from "react"
import { buildLeaderboardSocialMetadata } from "@/lib/leaderboard-metadata"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const social = buildLeaderboardSocialMetadata("bombastic")

  return {
    ...social,
    keywords: [
      "Bombastic",
      "Streaming Shack",
      "Diamond Dixie",
      "leaderboard",
      "3K Wager Race",
      "wager race",
      "prizes",
      "Twitch",
      "gaming",
      "slots",
    ],
    authors: [{ name: "Streaming Shack" }, { name: "Diamond Dixie" }],
  }
}

export default function BombasticLeaderboardLayout({ children }: { children: ReactNode }) {
  return children
}
