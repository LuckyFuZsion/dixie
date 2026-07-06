export const BITFORTUNE_GOLD = "#F7BB26"
export const METASPINS_NEON = "#78FF00"
export const METASPINS_NEON_DIM = "#4DB800"

export type LeaderboardThemeId = "default" | "bitfortune" | "meta"

export type LeaderboardTheme = {
  subtitleClass: string
  noteClass: string
  titleClass: string
  logoImageClass: string
  podiumCardBg: string
  podiumCardShadow: string
  podiumWagerBadge: string
  podiumRingFirst: string
  podiumRingSecond: string
  podiumRingThird: string
  trophyFirst: string
  trophySecond: string
  trophyThird: string
  rowGlowGradient: string
  rowShadow: string
  rowBorder: string
  rowBg: string
  refreshButton: string
  dateAccent: string
  prizeAmount: string
  countdownLabelClass: string
}

export const LEADERBOARD_THEMES: Record<LeaderboardThemeId, LeaderboardTheme> = {
  default: {
    subtitleClass: "text-cyan-100/90",
    noteClass: "text-orange-400",
    titleClass: "text-white",
    logoImageClass: "opacity-90",
    podiumCardBg: "bg-black border border-zinc-800/50",
    podiumCardShadow: "shadow-[0_0_20px_rgba(0,255,255,0.06)]",
    podiumWagerBadge:
      "bg-white/10 text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.25)]",
    podiumRingFirst: "ring-2 ring-yellow-400",
    podiumRingSecond: "ring-2 ring-gray-300",
    podiumRingThird: "ring-2 ring-amber-500",
    trophyFirst: "text-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.7)]",
    trophySecond: "text-slate-200 drop-shadow-[0_0_12px_rgba(226,232,240,0.55)]",
    trophyThird: "text-amber-600 drop-shadow-[0_0_12px_rgba(217,119,6,0.55)]",
    rowGlowGradient: "bg-gradient-to-r from-orange-600 via-amber-600 to-red-600",
    rowShadow: "shadow-[0_0_20px_rgba(251,146,60,0.08)]",
    rowBorder: "border-zinc-800/60",
    rowBg: "bg-black",
    refreshButton: "border-white/30 text-white hover:bg-white/20",
    dateAccent: "text-white",
    prizeAmount: "text-white",
    countdownLabelClass: "text-white/70",
  },
  bitfortune: {
    subtitleClass: "text-[#F7BB26]/90",
    noteClass: "text-[#F7BB26]/80",
    titleClass: "text-white",
    logoImageClass: "opacity-90",
    podiumCardBg: "bg-black border border-zinc-800/50",
    podiumCardShadow: "shadow-[0_0_24px_rgba(247,187,38,0.12)]",
    podiumWagerBadge:
      "bg-[#F7BB26]/10 text-white border-[#F7BB26]/40 shadow-[0_0_14px_rgba(247,187,38,0.3)]",
    podiumRingFirst: "ring-2 ring-[#F7BB26]",
    podiumRingSecond: "ring-2 ring-white/40",
    podiumRingThird: "ring-2 ring-[#C8941A]",
    trophyFirst: "text-[#F7BB26] drop-shadow-[0_0_16px_rgba(247,187,38,0.8)]",
    trophySecond: "text-slate-200 drop-shadow-[0_0_12px_rgba(226,232,240,0.55)]",
    trophyThird: "text-[#C8941A] drop-shadow-[0_0_12px_rgba(200,148,26,0.6)]",
    rowGlowGradient: "bg-gradient-to-r from-[#8B6914] via-[#F7BB26] to-[#C8941A]",
    rowShadow: "shadow-[0_0_20px_rgba(247,187,38,0.1)]",
    rowBorder: "border-[#F7BB26]/20",
    rowBg: "bg-black",
    refreshButton: "border-[#F7BB26]/40 text-[#F7BB26] hover:bg-[#F7BB26]/10",
    dateAccent: "text-[#F7BB26]",
    prizeAmount: "text-[#F7BB26]",
    countdownLabelClass: "text-white/70",
  },
  meta: {
    subtitleClass: "text-[#78FF00]/90 italic tracking-[0.2em] uppercase text-xs md:text-sm",
    noteClass: "text-[#78FF00]/60",
    titleClass: "text-white [text-shadow:0_0_24px_rgba(120,255,0,0.35)]",
    logoImageClass: "opacity-100 drop-shadow-[0_0_28px_rgba(120,255,0,0.55)]",
    podiumCardBg:
      "bg-[#050805] border border-[#78FF00]/35 shadow-[inset_0_0_40px_rgba(120,255,0,0.04)]",
    podiumCardShadow: "shadow-[0_0_32px_rgba(120,255,0,0.18)]",
    podiumWagerBadge:
      "bg-[#78FF00]/10 text-[#D4FF8A] border-[#78FF00]/50 shadow-[0_0_16px_rgba(120,255,0,0.35)]",
    podiumRingFirst: "ring-2 ring-[#78FF00] shadow-[0_0_20px_rgba(120,255,0,0.5)]",
    podiumRingSecond: "ring-2 ring-[#78FF00]/45",
    podiumRingThird: "ring-2 ring-[#4DB800]",
    trophyFirst: "text-[#78FF00] drop-shadow-[0_0_18px_rgba(120,255,0,0.95)]",
    trophySecond: "text-[#B8FF66] drop-shadow-[0_0_12px_rgba(120,255,0,0.45)]",
    trophyThird: "text-[#4DB800] drop-shadow-[0_0_12px_rgba(77,184,0,0.65)]",
    rowGlowGradient: "bg-gradient-to-r from-[#1a3300] via-[#78FF00] to-[#4DB800]",
    rowShadow: "shadow-[0_0_24px_rgba(120,255,0,0.12)]",
    rowBorder: "border-[#78FF00]/25",
    rowBg: "bg-[#050805]",
    refreshButton:
      "border-[#78FF00]/50 text-[#78FF00] hover:bg-[#78FF00]/10 shadow-[0_0_12px_rgba(120,255,0,0.15)]",
    dateAccent: "text-[#78FF00]",
    prizeAmount: "text-[#B8FF66]",
    countdownLabelClass: "text-[#78FF00]/70",
  },
}

export function getLeaderboardTheme(id?: LeaderboardThemeId): LeaderboardTheme {
  return LEADERBOARD_THEMES[id ?? "default"]
}
