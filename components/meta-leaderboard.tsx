"use client"

import LeaderboardPanel from "@/components/leaderboard-panel"
import { useMetaLeaderboard } from "@/hooks/use-meta-leaderboard"

export default function MetaLeaderboard() {
  const hook = useMetaLeaderboard()

  return (
    <LeaderboardPanel
      branding={{
        theme: "meta",
        title: "Streaming Shack 5K Wager Race",
        subtitle: "Metaspins streamer leaderboard",
        note: "Note: No originals can be used at 1.01x for wagering",
      }}
      {...hook}
    />
  )
}
