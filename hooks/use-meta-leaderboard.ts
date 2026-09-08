"use client"

import { getMetaStreamerVariant } from "@/lib/leaderboard-variants"
import { createLeaderboardHook } from "@/hooks/create-leaderboard-hook"

export const useMetaLeaderboard = createLeaderboardHook(getMetaStreamerVariant())
