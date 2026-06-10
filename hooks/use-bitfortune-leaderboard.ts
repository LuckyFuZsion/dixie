"use client"

import { BITFORTUNE_STREAMER_VARIANT } from "@/lib/leaderboard-variants"
import { createLeaderboardHook } from "@/hooks/create-leaderboard-hook"

export const useBitfortuneLeaderboard = createLeaderboardHook(BITFORTUNE_STREAMER_VARIANT)
