"use client"

import LeaderboardPanel from "@/components/leaderboard-panel"
import { useBitfortuneLeaderboard } from "@/hooks/use-bitfortune-leaderboard"

export default function BitfortuneLeaderboard() {
  const hook = useBitfortuneLeaderboard()

  return (
    <LeaderboardPanel
      branding={{
        theme: "bitfortune",
        title: "Streaming Shack 5K Wager Race",
        subtitle: "BitFortune streamer leaderboard",
        note: "Note: No originals can be used at 1.01x for wagering",
        logo: {
          src: "/images/bitfortune-logo.svg",
          alt: "BitFortune",
          href: "https://bitfortune.com/ref/sutchy",
          width: 640,
          height: 92,
        },
      }}
      {...hook}
    />
  )
}
