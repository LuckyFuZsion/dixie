"use client"

import Image from "next/image"
import { Trophy } from "lucide-react"
import { useLeaderboard, type LeaderboardEntry, maskUsername } from "@/hooks/use-leaderboard"

function PodiumPlaceCard({
  p,
  currency,
}: {
  p: LeaderboardEntry
  currency: (n: number) => string
}) {
  const ringClass =
    p.rank === 1 ? "ring-2 ring-yellow-400" : p.rank === 2 ? "ring-2 ring-gray-300" : "ring-2 ring-amber-500"
  const sizeClass = p.rank === 1 ? "h-72" : "h-64"
  const prizeClass = "text-white"
  return (
    <div className={`relative group w-full max-w-[18rem] mx-auto ${sizeClass}`}>
      <div className={`absolute inset-0 rounded-2xl ${ringClass} opacity-80`} />
      <div className="relative h-full bg-black border border-zinc-800/50 rounded-2xl flex flex-col items-center justify-center text-center px-6 shadow-[0_0_20px_rgba(0,255,255,0.06)]">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full bg-zinc-950/95 border border-white/15 px-2 py-1.5 shadow-lg ring-1 ring-white/10">
          <PodiumTrophy rank={p.rank} />
        </div>
        <div className="mb-1 text-white text-2xl font-extrabold flex items-center gap-2" style={{ fontFamily: "var(--font-future)" }}>
          <span>{maskUsername(p.username)}</span>
        </div>
        <div
          className="mb-4 mt-1 bg-white/10 text-white font-bold px-4 py-2 rounded-full border border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.25)]"
          style={{ fontFamily: "var(--font-future)" }}
        >
          ${currency(p.wagered)}
        </div>
        <div className="text-white text-xs uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-future)" }}>
          Prize
        </div>
        <div className={`text-2xl font-black ${prizeClass}`} style={{ fontFamily: "var(--font-future)" }}>
          ${p.prize}
        </div>
      </div>
    </div>
  )
}

function PodiumTrophy({ rank }: { rank: number }) {
  const trophyClass =
    rank === 1
      ? "w-8 h-8 sm:w-9 sm:h-9 text-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.7)]"
      : rank === 2
        ? "w-7 h-7 sm:w-8 sm:h-8 text-slate-200 drop-shadow-[0_0_12px_rgba(226,232,240,0.55)]"
        : "w-7 h-7 sm:w-8 sm:h-8 text-amber-600 drop-shadow-[0_0_12px_rgba(217,119,6,0.55)]"
  const label = rank === 1 ? "1st place" : rank === 2 ? "2nd place" : "3rd place"
  return (
    <span className="flex items-center justify-center" title={label}>
      <Trophy className={trophyClass} strokeWidth={1.75} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export default function SlotStreamerLeaderboard() {
  const {
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
  } = useLeaderboard()

  return (
    <div className="relative overflow-visible">
      <div className="relative z-10 overflow-visible">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <a
              href="https://affiliates.bitfortune.com/workspaces/api/tracking-links/record?trackingLinkId=11&affiliateId=271"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100 transition-opacity"
            >
              <Image src="/bombastic-logo.png" alt="Bombastic" width={390} height={78} className="opacity-90" />
            </a>
          </div>
          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 tracking-wide drop-shadow-lg max-w-4xl mx-auto leading-tight px-2"
            style={{ fontFamily: "var(--font-future)", textShadow: "2px 2px 4px rgba(0,0,0,0.2)" }}
          >
            Streaming Shack and Diamond Dixie 3K Wager Race
          </h1>
          <p className="text-cyan-100/90 text-sm md:text-base font-semibold tracking-wide mb-2" style={{ fontFamily: "var(--font-future)" }}>
            Fortnightly leaderboard
          </p>
          <p className="text-white text-sm italic drop-shadow-sm mb-2" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.1)" }}>
            The leaderboard updates every 15 minutes.
          </p>
          <p className="text-orange-400 text-xs font-semibold drop-shadow-sm" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.1)" }}>
            Note: No originals can be used at 1.01x for wagering
          </p>
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
                  <span className="font-bold text-white">{formatCalendarDate(range.startAt)}</span>
                </div>
                <span className="text-white/50 hidden sm:inline" aria-hidden>
                  →
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="text-white/70 text-sm">To</span>
                  <span className="font-bold text-white">{formatCalendarDate(range.endAt)}</span>
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
                    className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg"
                    style={{ fontFamily: "var(--font-future)", textShadow: "2px 2px 4px rgba(0,0,0,0.2)" }}
                  >
                    {t.value}
                  </div>
                  <div
                    className="text-[10px] sm:text-xs uppercase tracking-widest text-white drop-shadow-sm"
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
            return <PodiumPlaceCard key={`m-${p.id}`} p={p} currency={currency} />
          })}
        </div>

        <div className="hidden md:flex lg:hidden flex-col gap-4 mb-8 px-2 w-full max-w-3xl mx-auto">
          {topThree[0] && (
            <div className="flex justify-center w-full">
              <PodiumPlaceCard p={topThree[0]} currency={currency} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
            {topThree[1] && (
              <div className="min-w-0 flex justify-center">
                <PodiumPlaceCard p={topThree[1]} currency={currency} />
              </div>
            )}
            {topThree[2] && (
              <div className="min-w-0 flex justify-center">
                <PodiumPlaceCard p={topThree[2]} currency={currency} />
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
              prize: idx === 0 ? 800 : idx === 1 ? 1500 : 450,
              rank: idx === 0 ? 2 : idx === 1 ? 1 : 3,
            }
            const isFirst = p.rank === 1
            const sizeClass = isFirst ? "h-72 lg:h-80" : "h-64 lg:h-72"
            const ringClass = isFirst ? "ring-2 ring-yellow-400" : p.rank === 2 ? "ring-2 ring-gray-300" : "ring-2 ring-amber-500"
            const prizeClass = "text-white"
            return (
              <div
                key={`d-${p.id}`}
                className={`relative group w-52 flex-shrink-0 min-w-0 xl:w-64 2xl:w-72 ${sizeClass}`}
              >
                <div className={`absolute inset-0 rounded-2xl ${ringClass} opacity-80`} />
                <div className="relative h-full bg-black border border-zinc-800/50 rounded-2xl flex flex-col items-center justify-center text-center px-2 sm:px-4 lg:px-6 shadow-[0_0_20px_rgba(0,255,255,0.06)]">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full bg-zinc-950/95 border border-white/15 px-2 py-1.5 shadow-lg ring-1 ring-white/10">
                    <PodiumTrophy rank={p.rank} />
                  </div>
                  <div
                    className="mb-1 text-white text-lg lg:text-xl xl:text-2xl font-extrabold flex items-center justify-center gap-1 sm:gap-2 flex-wrap px-1"
                    style={{ fontFamily: "var(--font-future)" }}
                  >
                    <span className="max-w-full break-words">{maskUsername(p.username)}</span>
                  </div>
                  <div
                    className="mb-4 mt-1 bg-white/10 text-white font-bold px-2 sm:px-4 py-2 rounded-full border border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.25)] text-xs sm:text-sm lg:text-base max-w-[min(100%,11rem)] mx-auto"
                    style={{ fontFamily: "var(--font-future)" }}
                  >
                    ${currency(p.wagered)}
                  </div>
                  <div className="text-white text-xs uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-future)" }}>
                    Prize
                  </div>
                  <div className={`text-xl lg:text-2xl xl:text-3xl font-black ${prizeClass}`} style={{ fontFamily: "var(--font-future)" }}>
                    ${p.prize}
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
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-white/30 text-white hover:bg-white/20 disabled:opacity-50"
            style={{ fontFamily: "var(--font-future)" }}
            title={manualCooldownMs > 0 ? `Available in ${formatCooldown(manualCooldownMs)}` : "Refresh leaderboard"}
          >
            <span className="text-white">↻</span>
            <span>{manualCooldownMs > 0 ? `Refresh (${formatCooldown(manualCooldownMs)})` : "Refresh"}</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 md:gap-4 mb-16">
          {rest.map((p) => (
            <div key={p.id} className="relative group w-full max-w-[64rem] mx-2 md:mx-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 rounded-2xl blur-sm opacity-20 group-hover:opacity-40 transition" />
              <div className="relative bg-black rounded-2xl px-4 md:px-6 py-4 md:py-5 border border-zinc-800/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-[0_0_20px_rgba(251,146,60,0.08)]">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="text-white text-base font-extrabold w-10 text-center" style={{ fontFamily: "var(--font-future)" }}>
                    #{p.rank}
                  </div>
                  {p.prize > 0 && (
                    <span
                      className="text-white text-xs font-extrabold px-2 py-0.5 rounded-full border border-white/30 bg-white/10"
                      style={{ fontFamily: "var(--font-future)" }}
                    >
                      ${p.prize}
                    </span>
                  )}
                  <div className="text-white text-base md:text-xl font-bold" style={{ fontFamily: "var(--font-future)" }}>
                    {maskUsername(p.username)}
                  </div>
                </div>
                <div className="flex items-center gap-4 md:gap-8 self-end md:self-auto">
                  <div className="text-white text-sm">Wagered</div>
                  <div className="text-white text-base md:text-xl font-bold" style={{ fontFamily: "var(--font-future)" }}>
                    ${currency(p.wagered)}
                  </div>
                  <div className="text-white text-base md:text-xl font-black min-w-[4ch] text-right" style={{ fontFamily: "var(--font-future)" }}>
                    {p.prize > 0 ? `$${p.prize}` : "—"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
          }
        }
      `}</style>
    </div>
  )
}
