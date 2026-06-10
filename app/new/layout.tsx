import type { Metadata } from "next"
import type { ReactNode } from "react"
import { buildLeaderboardSocialMetadata } from "@/lib/leaderboard-metadata"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return buildLeaderboardSocialMetadata("bombastic", {
    titlePrefix: "Neo leaderboard",
    descriptionLead: "Alternate futuristic UI for the",
  })
}

export default function NewLeaderboardLayout({ children }: { children: ReactNode }) {
  return children
}
