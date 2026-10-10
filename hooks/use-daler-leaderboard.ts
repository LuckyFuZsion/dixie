"use client"

import { getDalerVariant } from "@/lib/leaderboard-variants"
import { createLeaderboardHook } from "@/hooks/create-leaderboard-hook"

export const useDalerLeaderboard = createLeaderboardHook(getDalerVariant())
