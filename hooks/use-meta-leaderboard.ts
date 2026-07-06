"use client"

import { META_STREAMER_VARIANT } from "@/lib/leaderboard-variants"
import { createLeaderboardHook } from "@/hooks/create-leaderboard-hook"

export const useMetaLeaderboard = createLeaderboardHook(META_STREAMER_VARIANT)
