"use client"

import LeaderboardPanel from "@/components/leaderboard-panel"
import { useMetaLeaderboard } from "@/hooks/use-meta-leaderboard"
import { formatPoolLabel, getSnapshotVariant } from "@/lib/leaderboard-variants"

export default function MetaLeaderboard() {
  const hook = useMetaLeaderboard()
  const meta = getSnapshotVariant("meta")
  const poolLabel = formatPoolLabel(meta.prizePoolTotal)

  return (
    <LeaderboardPanel
      branding={{
        theme: "meta",
        title: `Streaming Shack ${poolLabel} Wager Race`,
        subtitle: "Metaspins streamer leaderboard",
        note: "Note: No originals can be used at 1.01x for wagering",
      }}
      {...hook}
    />
  )
}
