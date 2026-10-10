"use client"

import LeaderboardPanel from "@/components/leaderboard-panel"
import { useDalerLeaderboard } from "@/hooks/use-daler-leaderboard"
import { formatPoolLabel, getSnapshotVariant } from "@/lib/leaderboard-variants"

export default function DalerLeaderboard() {
  const hook = useDalerLeaderboard()
  const daler = getSnapshotVariant("daler")
  const poolLabel = formatPoolLabel(daler.prizePoolTotal)

  return (
    <LeaderboardPanel
      branding={{
        theme: "daler",
        title: `Streaming Shack ${poolLabel} Wager Race`,
        subtitle: "Daler streamer leaderboard",
        note: "Note: No originals can be used at 1.01x for wagering",
      }}
      {...hook}
    />
  )
}
