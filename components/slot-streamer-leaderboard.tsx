"use client"

import LeaderboardPanel from "@/components/leaderboard-panel"
import { useLeaderboard } from "@/hooks/use-leaderboard"

export default function SlotStreamerLeaderboard() {
  const hook = useLeaderboard()

  return (
    <LeaderboardPanel
      branding={{
        title: "Streaming Shack and Diamond Dixie 3K Wager Race",
        subtitle: "Fortnightly leaderboard",
        note: "Note: No originals can be used at 1.01x for wagering",
        logo: {
          src: "/bombastic-logo.png",
          alt: "Bombastic",
          href: "https://bombastic.com/?ref=diamonddixie",
          width: 390,
          height: 78,
        },
      }}
      {...hook}
    />
  )
}
