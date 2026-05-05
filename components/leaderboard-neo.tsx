"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Sparkles, Trophy } from "lucide-react"
import { useLeaderboard, type LeaderboardEntry, maskUsername } from "@/hooks/use-leaderboard"

function NeoDigitBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="min-w-[3rem] px-2.5 py-2 md:py-2.5 border border-cyan-400/35 bg-[linear-gradient(180deg,rgba(6,40,50,0.9),rgba(2,12,18,0.95))] text-center text-xl md:text-2xl font-bold text-cyan-50 tabular-nums shadow-[inset_0_0_24px_rgba(34,211,238,0.12),0_0_20px_rgba(34,211,238,0.08)]"
        style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
      >
        {value}
      </div>
      <span
        className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-cyan-500/70"
        style={{ fontFamily: "var(--font-future)" }}
      >
        {label}
      </span>
    </div>
  )
}

function NeoRaceWindowAside({
  range,
  timeLeft,
  formatCalendarDate,
  className = "",
}: {
  range: { startAt: string; endAt: string }
  timeLeft: { days: number; hours: number; minutes: number; seconds: number }
  formatCalendarDate: (iso: string) => string
  className?: string
}) {
  return (
    <aside className={`relative z-10 rounded-xl border border-white/10 bg-black/50 p-5 backdrop-blur-md ${className}`}>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-400/80" style={{ fontFamily: "var(--font-mono)" }}>
        Race window
      </p>
      {range.startAt && range.endAt && (
        <p className="mb-6 text-sm text-white/90 leading-relaxed" style={{ fontFamily: "var(--font-future)" }}>
          <span className="text-white/45">From</span> {formatCalendarDate(range.startAt)}{" "}
          <span className="text-cyan-500/60">→</span> <span className="text-white/45">To</span>{" "}
          {formatCalendarDate(range.endAt)}
        </p>
      )}
      <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-fuchsia-400/70" style={{ fontFamily: "var(--font-future)" }}>
        Time to terminus
      </p>
      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
        <NeoDigitBox value={timeLeft.days} label="days" />
        <NeoDigitBox value={timeLeft.hours} label="hours" />
        <NeoDigitBox value={timeLeft.minutes} label="mins" />
        <NeoDigitBox value={timeLeft.seconds} label="secs" />
      </div>
    </aside>
  )
}

const accentMap = {
  1: {
    label: "PRIME",
    border: "from-amber-300/80 via-yellow-400/40 to-amber-600/80",
    glow: "shadow-[0_0_50px_rgba(251,191,36,0.2)]",
    icon: "text-amber-300",
  },
  2: {
    label: "SECOND",
    border: "from-slate-200/80 via-slate-400/35 to-slate-500/80",
    glow: "shadow-[0_0_40px_rgba(226,232,240,0.12)]",
    icon: "text-slate-200",
  },
  3: {
    label: "THIRD",
    border: "from-amber-700/80 via-orange-600/40 to-amber-800/80",
    glow: "shadow-[0_0_40px_rgba(180,83,9,0.15)]",
    icon: "text-amber-600",
  },
} as const

function NeoPodiumCard({
  entry,
  rank,
  currency,
}: {
  entry: LeaderboardEntry
  rank: 1 | 2 | 3
  currency: (n: number) => string
}) {
  const a = accentMap[rank]
  return (
    <div className={`relative flex flex-col min-h-[240px] md:min-h-[280px] ${a.glow}`}>
      <div
        className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${a.border} opacity-90 blur-[0.5px]`}
        aria-hidden
      />
      <div className="relative flex h-full flex-col rounded-2xl border border-white/10 bg-[#050a0d]/90 backdrop-blur-sm p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-bold tracking-[0.35em] text-cyan-400/90"
            style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
          >
            {a.label}
          </span>
          <Trophy className={`h-6 w-6 ${a.icon} drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]`} strokeWidth={1.5} />
        </div>
        <p
          className="text-lg md:text-xl font-black text-white tracking-tight break-words mb-1"
          style={{ fontFamily: "var(--font-future)" }}
        >
          {maskUsername(entry.username)}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-6" style={{ fontFamily: "var(--font-future)" }}>
          Player
        </p>
        <div className="mt-auto space-y-3">
          <div className="flex items-baseline justify-between gap-2 border-t border-white/10 pt-4">
            <span className="text-xs text-cyan-200/60" style={{ fontFamily: "var(--font-future)" }}>
              Wagered
            </span>
            <span
              className="text-base md:text-lg font-bold text-cyan-100 tabular-nums"
              style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
            >
              ${currency(entry.wagered)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 rounded-lg bg-fuchsia-950/30 px-3 py-2 border border-fuchsia-500/20">
            <span className="text-[10px] uppercase tracking-widest text-fuchsia-200/70" style={{ fontFamily: "var(--font-future)" }}>
              Prize alloc
            </span>
            <span className="text-lg font-black text-fuchsia-100 tabular-nums" style={{ fontFamily: "var(--font-future)" }}>
              ${entry.prize}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeaderboardNeo() {
  const {
    loading,
    error,
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

  const first = topThree[0]
  const second = topThree[1]
  const third = topThree[2]

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.45]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90 hover:text-cyan-300 transition-colors"
          style={{ fontFamily: "var(--font-future)" }}
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          Classic layout
        </Link>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
          <Sparkles className="h-3.5 w-3.5 text-fuchsia-400/80" aria-hidden />
          Neo interface
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#060f14]/95 via-[#030608]/98 to-[#0a0512]/95 p-6 md:p-10 shadow-[0_0_80px_rgba(34,211,238,0.06),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

        {/* Tablet / phone: logo + title row → badges → race window */}
        <div className="relative z-10 space-y-8 lg:hidden">
          <div className="pt-2">
            <div className="mb-8 flex flex-col items-center sm:flex-row sm:items-start sm:gap-8">
              <a
                href="https://bombastic.com/?ref=diamonddixie"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 transition-opacity hover:opacity-100"
              >
                <Image src="/bombastic-logo.png" alt="Bombastic" width={320} height={64} className="h-auto w-[min(100%,280px)] opacity-95" />
              </a>
              <div className="mt-6 text-center sm:mt-0 sm:text-left max-w-xl">
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-[1.15] tracking-tight"
                  style={{ fontFamily: "var(--font-future)" }}
                >
                  Streaming Shack and Diamond Dixie 3K Wager Race
                </h1>
                <p className="mt-2 text-sm text-cyan-200/80 font-semibold" style={{ fontFamily: "var(--font-future)" }}>
                  Fortnightly leaderboard
                </p>
                <p className="mt-3 max-w-xl text-sm text-white/70" style={{ fontFamily: "var(--font-future)" }}>
                  The leaderboard updates every 15 minutes.
                </p>
                <p className="mt-2 text-xs text-orange-400/90 font-semibold" style={{ fontFamily: "var(--font-future)" }}>
                  Note: No originals can be used at 1.01x for wagering
                </p>
              </div>
            </div>

            <div
              className="flex flex-wrap gap-3 text-[11px] uppercase tracking-widest text-white/40"
              style={{ fontFamily: "var(--font-future)" }}
            >
              <span className="rounded border border-white/15 bg-white/5 px-3 py-1.5">Pool · $3,000</span>
              <span className="rounded border border-white/15 bg-white/5 px-3 py-1.5">4 prize tiers</span>
              <span className="rounded border border-white/15 bg-white/5 px-3 py-1.5">Live ops</span>
            </div>
          </div>

          <NeoRaceWindowAside range={range} timeLeft={timeLeft} formatCalendarDate={formatCalendarDate} />
        </div>

        {/* Desktop: narrow column = logo + race window stacked; wide column = copy + badges */}
        <div className="relative z-10 hidden gap-10 lg:grid lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:items-start lg:gap-x-12 xl:gap-x-14">
          <div className="flex flex-col gap-8 pt-6">
            <a
              href="https://bombastic.com/?ref=diamonddixie"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 transition-opacity hover:opacity-100"
            >
              <Image src="/bombastic-logo.png" alt="Bombastic" width={320} height={64} className="h-auto w-full max-w-[280px] opacity-95" />
            </a>
            <NeoRaceWindowAside
              range={range}
              timeLeft={timeLeft}
              formatCalendarDate={formatCalendarDate}
              className="w-full"
            />
          </div>

          <div className="pt-6 pr-2 xl:pr-4">
            <div className="mb-10 max-w-2xl">
              <h1
                className="text-3xl md:text-4xl font-black text-white leading-[1.15] tracking-tight"
                style={{ fontFamily: "var(--font-future)" }}
              >
                Streaming Shack and Diamond Dixie 3K Wager Race
              </h1>
              <p className="mt-2 text-sm text-cyan-200/80 font-semibold" style={{ fontFamily: "var(--font-future)" }}>
                Fortnightly leaderboard
              </p>
              <p className="mt-3 text-sm text-white/70" style={{ fontFamily: "var(--font-future)" }}>
                The leaderboard updates every 15 minutes.
              </p>
              <p className="mt-2 text-xs text-orange-400/90 font-semibold" style={{ fontFamily: "var(--font-future)" }}>
                Note: No originals can be used at 1.01x for wagering
              </p>
            </div>

            <div
              className="flex flex-wrap gap-3 text-[11px] uppercase tracking-widest text-white/40"
              style={{ fontFamily: "var(--font-future)" }}
            >
              <span className="rounded border border-white/15 bg-white/5 px-3 py-1.5">Pool · $3,000</span>
              <span className="rounded border border-white/15 bg-white/5 px-3 py-1.5">4 prize tiers</span>
              <span className="rounded border border-white/15 bg-white/5 px-3 py-1.5">Live ops</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="mt-6 rounded-lg border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100"
          style={{ fontFamily: "var(--font-future)" }}
          role="status"
        >
          {error}
        </div>
      )}

      <section className="relative mt-12">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.5em] text-cyan-400/90"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Apex tier
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        </div>

        <div className="grid gap-5 md:grid-cols-3 md:items-stretch">
          {first && <NeoPodiumCard entry={first} rank={1} currency={currency} />}
          {second && <NeoPodiumCard entry={second} rank={2} currency={currency} />}
          {third && <NeoPodiumCard entry={third} rank={3} currency={currency} />}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h2
          className="text-xs font-bold uppercase tracking-[0.4em] text-white/50"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Extended standings · ranks 4–20
        </h2>
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={loading || manualCooldownMs > 0}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)] transition hover:border-cyan-400/60 hover:bg-cyan-900/50 disabled:opacity-45"
          style={{ fontFamily: "var(--font-future)" }}
          title={manualCooldownMs > 0 ? `Available in ${formatCooldown(manualCooldownMs)}` : "Refresh leaderboard"}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
          {manualCooldownMs > 0 ? `Sync · ${formatCooldown(manualCooldownMs)}` : "Sync feed"}
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#04080c]/80 backdrop-blur-sm">
        <div className="grid grid-cols-[48px_1fr_1fr_1fr] gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 md:grid-cols-[56px_1fr_120px_100px] md:px-5">
          <span style={{ fontFamily: "var(--font-mono)" }}>#</span>
          <span style={{ fontFamily: "var(--font-future)" }}>Player</span>
          <span className="text-right md:text-left" style={{ fontFamily: "var(--font-future)" }}>
            Wagered
          </span>
          <span className="text-right" style={{ fontFamily: "var(--font-future)" }}>
            Prize
          </span>
        </div>
        <ul className="divide-y divide-white/[0.06]">
          {rest.map((p) => (
            <li
              key={p.id}
              className="group grid grid-cols-[48px_1fr_1fr_1fr] items-center gap-2 px-4 py-3.5 transition-colors hover:bg-cyan-500/[0.04] md:grid-cols-[56px_1fr_120px_100px] md:px-5"
            >
              <span
                className="font-mono text-sm font-bold text-cyan-400/90 tabular-nums"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {String(p.rank).padStart(2, "0")}
              </span>
              <span className="min-w-0 truncate text-sm font-semibold text-white" style={{ fontFamily: "var(--font-future)" }}>
                {maskUsername(p.username)}
              </span>
              <span
                className="text-right text-sm tabular-nums text-cyan-100/90 md:text-left"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                ${currency(p.wagered)}
              </span>
              <span className="text-right text-sm font-bold tabular-nums text-fuchsia-200/90" style={{ fontFamily: "var(--font-future)" }}>
                {p.prize > 0 ? `$${p.prize}` : "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10 opacity-[0.03] mix-blend-overlay">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 3px)",
          }}
        />
      </div>
    </div>
  )
}
