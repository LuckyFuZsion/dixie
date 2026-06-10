"use client"

import LeaderboardPanel from "@/components/leaderboard-panel"
import { useBitfortuneLeaderboard } from "@/hooks/use-bitfortune-leaderboard"

export default function BitfortuneLeaderboard() {
  const hook = useBitfortuneLeaderboard()

  return (
    <LeaderboardPanel
      branding={{
        title: "Streaming Shack and Diamond Dixie 5K Wager Race",
        subtitle: "BitFortune streamer leaderboard",
        note: "Note: No originals can be used at 1.01x for wagering",
        logo: {
          src: "/images/bitfortune-logo.svg",
          alt: "BitFortune",
          href: "https://bitfortune.com/ref/sutchy",
          width: 320,
          height: 46,
        },
      }}
      {...hook}
    />
  )
}
