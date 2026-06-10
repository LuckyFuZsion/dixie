"use client"

import { BOMBASTIC_VARIANT } from "@/lib/leaderboard-variants"
import { createLeaderboardHook, maskUsername, type LeaderboardEntry } from "@/hooks/create-leaderboard-hook"

export type { LeaderboardEntry }
export { maskUsername }

export const useLeaderboard = createLeaderboardHook(BOMBASTIC_VARIANT)
