"use client"

import Image from "next/image"
import { Trophy } from "lucide-react"
import { maskUsername, type LeaderboardEntry } from "@/hooks/create-leaderboard-hook"
import {
  getLeaderboardTheme,
  type LeaderboardTheme,
  type LeaderboardThemeId,
} from "@/lib/leaderboard-themes"

export type LeaderboardPanelBranding = {
  title: string
  subtitle: string
  note?: string
  theme?: LeaderboardThemeId
  logo?: {
    src: string
    alt: string
    href: string
    width: number
    height: number
  }
  logoText?: {
    label: string
    href: string
  }
}

type LeaderboardPanelProps = {
  branding: LeaderboardPanelBranding
  loading: boolean
  timeLeft: { days: number; hours: number; minutes: number; seconds: number }
  range: { startAt: string; endAt: string }
  manualCooldownMs: number
  handleManualRefresh: () => void
  formatCooldown: (ms: number) => string
  formatCalendarDate: (iso: string) => string
  currency: (n: number) => string
  topThree: LeaderboardEntry[]
  rest: LeaderboardEntry[]
  fallbackPodiumPrizes: { first: number; second: number; third: number }
}

function podiumRingClass(rank: number, theme: LeaderboardTheme): string {
  if (rank === 1) return theme.podiumRingFirst
  if (rank === 2) return theme.podiumRingSecond
  return theme.podiumRingThird
}

function PodiumPlaceCard({
  p,
  currency,
  theme,
}: {
  p: LeaderboardEntry
  currency: (n: number) => string
  theme: LeaderboardTheme
}) {
  const sizeClass = p.rank === 1 ? "h-72" : "h-64"
  return (
    <div className={`relative group w-full max-w-[18rem] mx-auto ${sizeClass}`}>
      <div className={`absolute inset-0 rounded-2xl ${podiumRingClass(p.rank, theme)} opacity-80`} />
      <div
        className={`relative h-full bg-black border border-zinc-800/50 rounded-2xl flex flex-col items-center justify-center text-center px-6 ${theme.podiumCardShadow}`}
      >
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full bg-zinc-950/95 border border-white/15 px-2 py-1.5 shadow-lg ring-1 ring-white/10">
          <PodiumTrophy rank={p.rank} theme={theme} />
        </div>
        <div className="mb-1 text-white text-2xl font-extrabold flex items-center gap-2" style={{ fontFamily: "var(--font-future)" }}>
          <span>{maskUsername(p.username)}</span>
        </div>
        <div
          className={`mb-4 mt-1 font-bold px-4 py-2 rounded-full border ${theme.podiumWagerBadge}`}
          style={{ fontFamily: "var(--font-future)" }}
        >
          ${currency(p.wagered)}
        </div>
        <div className="text-white text-xs uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-future)" }}>
          Prize
        </div>
        <div className={`text-2xl font-black ${theme.prizeAmount}`} style={{ fontFamily: "var(--font-future)" }}>
          ${p.prize.toLocaleString()}
        </div>
      </div>
    </div>
  )
}

function PodiumTrophy({ rank, theme }: { rank: number; theme: LeaderboardTheme }) {
  const sizeClass =
    rank === 1 ? "w-8 h-8 sm:w-9 sm:h-9" : "w-7 h-7 sm:w-8 sm:h-8"
  const trophyClass =
    rank === 1
      ? `${sizeClass} ${theme.trophyFirst}`
      : rank === 2
        ? `${sizeClass} text-slate-200 drop-shadow-[0_0_12px_rgba(226,232,240,0.55)]`
        : `${sizeClass} ${theme.trophyThird}`
  const label = rank === 1 ? "1st place" : rank === 2 ? "2nd place" : "3rd place"
  return (
    <span className="flex items-center justify-center" title={label}>
      <Trophy className={trophyClass} strokeWidth={1.75} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export default function LeaderboardPanel({
  branding,
  loading,
  timeLeft,
  range,
  manualCooldownMs,
  handleManualRefresh,
  formatCooldown,
  formatCalendarDate,
  currency,
  topThree,
  rest,
  fallbackPodiumPrizes,
}: LeaderboardPanelProps) {
  const theme = getLeaderboardTheme(branding.theme)

  return (
    <div className="relative overflow-visible">
      <div className="relative z-10 overflow-visible">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            {branding.logo ? (
              <a
                href={branding.logo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-100 transition-opacity"
              >
                <Image
                  src={branding.logo.src}
                  alt={branding.logo.alt}
                  width={branding.logo.width}
                  height={branding.logo.height}
                  className="opacity-90"
                />
              </a>
            ) : branding.logoText ? (
              <a
                href={branding.logoText.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300 font-black tracking-widest text-2xl md:text-3xl uppercase"
                style={{
                  fontFamily: "var(--font-future)",
                  textShadow: "0 0 10px rgba(34, 211, 238, 0.5), 0 0 20px rgba(34, 211, 238, 0.3)",
                  letterSpacing: "0.15em",
                }}
              >
                {branding.logoText.label}
              </a>
            ) : null}
          </div>
          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 tracking-wide drop-shadow-lg max-w-4xl mx-auto leading-tight px-2"
            style={{ fontFamily: "var(--font-future)", textShadow: "2px 2px 4px rgba(0,0,0,0.2)" }}
          >
            {branding.title}
          </h1>
          <p className={`${theme.subtitleClass} text-sm md:text-base font-semibold tracking-wide mb-2`} style={{ fontFamily: "var(--font-future)" }}>
            {branding.subtitle}
          </p>
          <p className="text-white text-sm italic drop-shadow-sm mb-2" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.1)" }}>
            The leaderboard updates every 15 minutes.
          </p>
          {branding.note && (
            <p className={`${theme.noteClass} text-xs font-semibold drop-shadow-sm`} style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.1)" }}>
              {branding.note}
            </p>
          )}
        </div>

        {range.startAt && range.endAt && (
          <div className="text-center mb-8 px-2">
            <p className="text-white/80 text-xs uppercase tracking-widest mb-2" style={{ fontFamily: "var(--font-future)" }}>
              Race period
            </p>
            <div
              className="text-white text-base sm:text-lg md:text-xl mb-3 drop-shadow-md"
              style={{ fontFamily: "var(--font-future)", textShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-3">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="text-white/70 text-sm">From</span>
                  <span className={`font-bold ${theme.dateAccent}`}>{formatCalendarDate(range.startAt)}</span>
                </div>
                <span className="text-white/50 hidden sm:inline" aria-hidden>
                  →
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="text-white/70 text-sm">To</span>
                  <span className={`font-bold ${theme.dateAccent}`}>{formatCalendarDate(range.endAt)}</span>
                </div>
              </div>
            </div>
            <div
              className="flex items-center justify-center gap-2 text-white font-semibold mb-2 drop-shadow-sm"
              style={{ fontFamily: "var(--font-future)", textShadow: "1px 1px 2px rgba(0,0,0,0.1)" }}
            >
              <span>⏱️</span>
              <span>Time remaining</span>
            </div>
            <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-xl mx-auto">
              {(
                [
                  { label: "days", value: timeLeft.days },
                  { label: "hours", value: timeLeft.hours },
                  { label: "mins", value: timeLeft.minutes },
                  { label: "secs", value: timeLeft.seconds },
                ] as const
              ).map((t) => (
                <div key={t.label} className="text-center">
                  <div
                    className={`text-2xl sm:text-3xl md:text-5xl font-extrabold drop-shadow-lg ${theme.dateAccent}`}
                    style={{ fontFamily: "var(--font-future)", textShadow: "2px 2px 4px rgba(0,0,0,0.2)" }}
                  >
                    {t.value}
                  </div>
                  <div
                    className="text-[10px] sm:text-xs uppercase tracking-widest text-white/70 drop-shadow-sm"
                    style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.1)" }}
                  >
                    {t.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col md:hidden justify-center items-stretch gap-4 mb-8 px-1">
          {[0, 1, 2].map((idx) => {
            const p = topThree[idx]
            if (!p) return <div key={`empty-m-${idx}`} className="w-full max-w-[18rem] mx-auto" />
            return <PodiumPlaceCard key={`m-${p.id}`} p={p} currency={currency} theme={theme} />
          })}
        </div>

        <div className="hidden md:flex lg:hidden flex-col gap-4 mb-8 px-2 w-full max-w-3xl mx-auto">
          {topThree[0] && (
            <div className="flex justify-center w-full">
              <PodiumPlaceCard p={topThree[0]} currency={currency} theme={theme} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
            {topThree[1] && (
              <div className="min-w-0 flex justify-center">
                <PodiumPlaceCard p={topThree[1]} currency={currency} theme={theme} />
              </div>
            )}
            {topThree[2] && (
              <div className="min-w-0 flex justify-center">
                <PodiumPlaceCard p={topThree[2]} currency={currency} theme={theme} />
              </div>
            )}
          </div>
        </div>

        <div className="desktop-podium-container justify-center items-end gap-4 lg:gap-5 xl:gap-8 mb-12 min-h-[280px] lg:min-h-[320px] w-full max-w-full min-w-0 px-2 sm:px-4 lg:px-4 relative z-10 box-border">
          {[1, 0, 2].map((idx) => {
            const p = topThree[idx] || {
              id: `fallback-${idx}`,
              username: "Awaiting player",
              wagered: 0,
              prize: idx === 0 ? fallbackPodiumPrizes.second : idx === 1 ? fallbackPodiumPrizes.first : fallbackPodiumPrizes.third,
              rank: idx === 0 ? 2 : idx === 1 ? 1 : 3,
            }
            const isFirst = p.rank === 1
            const sizeClass = isFirst ? "h-72 lg:h-80" : "h-64 lg:h-72"
            return (
              <div
                key={`d-${p.id}`}
                className={`relative group w-52 flex-shrink-0 min-w-0 xl:w-64 2xl:w-72 ${sizeClass}`}
              >
                <div className={`absolute inset-0 rounded-2xl ${podiumRingClass(p.rank, theme)} opacity-80`} />
                <div
                  className={`relative h-full bg-black border border-zinc-800/50 rounded-2xl flex flex-col items-center justify-center text-center px-2 sm:px-4 lg:px-6 ${theme.podiumCardShadow}`}
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full bg-zinc-950/95 border border-white/15 px-2 py-1.5 shadow-lg ring-1 ring-white/10">
                    <PodiumTrophy rank={p.rank} theme={theme} />
                  </div>
                  <div
                    className="mb-1 text-white text-lg lg:text-xl xl:text-2xl font-extrabold flex items-center justify-center gap-1 sm:gap-2 flex-wrap px-1"
                    style={{ fontFamily: "var(--font-future)" }}
                  >
                    <span className="max-w-full break-words">{maskUsername(p.username)}</span>
                  </div>
                  <div
                    className={`mb-4 mt-1 font-bold px-2 sm:px-4 py-2 rounded-full border text-xs sm:text-sm lg:text-base max-w-[min(100%,11rem)] mx-auto ${theme.podiumWagerBadge}`}
                    style={{ fontFamily: "var(--font-future)" }}
                  >
                    ${currency(p.wagered)}
                  </div>
                  <div className="text-white text-xs uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-future)" }}>
                    Prize
                  </div>
                  <div className={`text-xl lg:text-2xl xl:text-3xl font-black ${theme.prizeAmount}`} style={{ fontFamily: "var(--font-future)" }}>
                    ${p.prize.toLocaleString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-end mb-4 pr-0 md:pr-2 gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={loading || manualCooldownMs > 0}
            className={`inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border disabled:opacity-50 ${theme.refreshButton}`}
            style={{ fontFamily: "var(--font-future)" }}
            title={manualCooldownMs > 0 ? `Available in ${formatCooldown(manualCooldownMs)}` : "Refresh leaderboard"}
          >
            <span>↻</span>
            <span>{manualCooldownMs > 0 ? `Refresh (${formatCooldown(manualCooldownMs)})` : "Refresh"}</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 md:gap-4 mb-16">
          {rest.map((p) => (
            <div key={p.id} className="relative group w-full max-w-[64rem] mx-2 md:mx-4">
              <div className={`absolute -inset-1 ${theme.rowGlowGradient} rounded-2xl blur-sm opacity-20 group-hover:opacity-40 transition`} />
              <div className={`relative bg-black rounded-2xl px-4 md:px-6 py-4 md:py-5 border flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${theme.rowBorder} ${theme.rowShadow}`}>
                <div className="flex items-center gap-2 md:gap-4">
                  <div className={`text-base font-extrabold w-10 text-center ${theme.dateAccent}`} style={{ fontFamily: "var(--font-future)" }}>
                    #{p.rank}
                  </div>
                  {p.prize > 0 && (
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${theme.podiumWagerBadge}`}
                      style={{ fontFamily: "var(--font-future)" }}
                    >
                      ${p.prize.toLocaleString()}
                    </span>
                  )}
                  <div className="text-white text-base md:text-xl font-bold" style={{ fontFamily: "var(--font-future)" }}>
                    {maskUsername(p.username)}
                  </div>
                </div>
                <div className="flex items-center gap-4 md:gap-8 self-end md:self-auto">
                  <div className="text-white/70 text-sm">Wagered</div>
                  <div className="text-white text-base md:text-xl font-bold" style={{ fontFamily: "var(--font-future)" }}>
                    ${currency(p.wagered)}
                  </div>
                  <div className={`text-base md:text-xl font-black min-w-[4ch] text-right ${p.prize > 0 ? theme.prizeAmount : "text-white/40"}`} style={{ fontFamily: "var(--font-future)" }}>
                    {p.prize > 0 ? `$${p.prize.toLocaleString()}` : "—"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
