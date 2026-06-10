export const BITFORTUNE_GOLD = "#F7BB26"

export type LeaderboardThemeId = "default" | "bitfortune"

export type LeaderboardTheme = {
  subtitleClass: string
  noteClass: string
  podiumCardShadow: string
  podiumWagerBadge: string
  podiumRingFirst: string
  podiumRingSecond: string
  podiumRingThird: string
  trophyFirst: string
  trophyThird: string
  rowGlowGradient: string
  rowShadow: string
  rowBorder: string
  refreshButton: string
  dateAccent: string
  prizeAmount: string
}

export const LEADERBOARD_THEMES: Record<LeaderboardThemeId, LeaderboardTheme> = {
  default: {
    subtitleClass: "text-cyan-100/90",
    noteClass: "text-orange-400",
    podiumCardShadow: "shadow-[0_0_20px_rgba(0,255,255,0.06)]",
    podiumWagerBadge:
      "bg-white/10 text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.25)]",
    podiumRingFirst: "ring-2 ring-yellow-400",
    podiumRingSecond: "ring-2 ring-gray-300",
    podiumRingThird: "ring-2 ring-amber-500",
    trophyFirst: "text-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.7)]",
    trophyThird: "text-amber-600 drop-shadow-[0_0_12px_rgba(217,119,6,0.55)]",
    rowGlowGradient: "bg-gradient-to-r from-orange-600 via-amber-600 to-red-600",
    rowShadow: "shadow-[0_0_20px_rgba(251,146,60,0.08)]",
    rowBorder: "border-zinc-800/60",
    refreshButton: "border-white/30 text-white hover:bg-white/20",
    dateAccent: "text-white",
    prizeAmount: "text-white",
  },
  bitfortune: {
    subtitleClass: "text-[#F7BB26]/90",
    noteClass: "text-[#F7BB26]/80",
    podiumCardShadow: "shadow-[0_0_24px_rgba(247,187,38,0.12)]",
    podiumWagerBadge:
      "bg-[#F7BB26]/10 text-white border-[#F7BB26]/40 shadow-[0_0_14px_rgba(247,187,38,0.3)]",
    podiumRingFirst: "ring-2 ring-[#F7BB26]",
    podiumRingSecond: "ring-2 ring-white/40",
    podiumRingThird: "ring-2 ring-[#C8941A]",
    trophyFirst: "text-[#F7BB26] drop-shadow-[0_0_16px_rgba(247,187,38,0.8)]",
    trophyThird: "text-[#C8941A] drop-shadow-[0_0_12px_rgba(200,148,26,0.6)]",
    rowGlowGradient: "bg-gradient-to-r from-[#8B6914] via-[#F7BB26] to-[#C8941A]",
    rowShadow: "shadow-[0_0_20px_rgba(247,187,38,0.1)]",
    rowBorder: "border-[#F7BB26]/20",
    refreshButton: "border-[#F7BB26]/40 text-[#F7BB26] hover:bg-[#F7BB26]/10",
    dateAccent: "text-[#F7BB26]",
    prizeAmount: "text-[#F7BB26]",
  },
}

export function getLeaderboardTheme(id?: LeaderboardThemeId): LeaderboardTheme {
  return LEADERBOARD_THEMES[id ?? "default"]
}
