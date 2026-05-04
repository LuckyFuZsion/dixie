"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Trophy } from "lucide-react"
import {
  DEFAULT_LEADERBOARD_END_DATE,
  DEFAULT_LEADERBOARD_START_DATE,
  isIsoDateString,
  rangeFromIsoDates,
} from "@/lib/leaderboard-dates"
// removed local FuturisticBackground import; now global

interface LeaderboardEntry {
  id: string
  username: string
  wagered: number
  prize: number
  rank: number
}

// Local cache helpers
interface CachedLeaderboard {
  data: LeaderboardEntry[]
  updatedAt: number
}

const CACHE_TTL_MS = 15 * 60 * 1000
const MANUAL_COOLDOWN_MS = 10 * 60 * 1000

function makeCacheKey(startAt: string, endAt: string): string {
  return `leaderboard:${startAt}:${endAt}`
}

function makeManualKey(startAt: string, endAt: string): string {
  return `leaderboard:manualRefreshAt:${startAt}:${endAt}`
}

function saveCache(startAt: string, endAt: string, data: LeaderboardEntry[]) {
  try {
    const payload: CachedLeaderboard = { data, updatedAt: Date.now() }
    localStorage.setItem(makeCacheKey(startAt, endAt), JSON.stringify(payload))
  } catch {}
}

function readCache(startAt: string, endAt: string): CachedLeaderboard | null {
  try {
    const raw = localStorage.getItem(makeCacheKey(startAt, endAt))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedLeaderboard
    return parsed
  } catch {
    return null
  }
}

function isFresh(cache: CachedLeaderboard | null): boolean {
  if (!cache) return false
  return Date.now() - cache.updatedAt < CACHE_TTL_MS
}

function maskUsername(name: string): string {
  if (name.length <= 3) return name
  const start = name.slice(0, 3)
  const end = name.slice(-3)
  return `${start}***${end}`
}

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

function createPlaceholders(): LeaderboardEntry[] {
  const prizeForRank = (rank: number): number => {
    const map: Record<number, number> = { 1: 1500, 2: 800, 3: 450, 4: 250 }
    return map[rank] ?? 0
  }
  return Array.from({ length: 20 }, (_, i) => ({
    id: `placeholder-${i + 1}`,
    username: "Awaiting player",
    wagered: 0,
    prize: prizeForRank(i + 1),
    rank: i + 1,
  }))
}

export default function SlotStreamerLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(createPlaceholders())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [range, setRange] = useState<{ startAt: string; endAt: string; fromUnix?: number; toUnix?: number }>({ startAt: "", endAt: "" })
  const [endTimeMs, setEndTimeMs] = useState<number>(0)
  const [manualCooldownMs, setManualCooldownMs] = useState<number>(0)
  const [lastManualAt, setLastManualAt] = useState<number>(0)

  function formatYYYYMMDDUTC(date: Date): string {
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, "0")
    const d = String(date.getUTCDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  function computeActiveRange() {
    const LEADERBOARD_DURATION_DAYS = 28

    const calculateEndDateUnix = (startUnix: number) => {
      const startDate = new Date(startUnix * 1000)
      const startOfDay = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 0, 0, 0, 0)
      )
      const endDate = new Date(startOfDay.getTime() + LEADERBOARD_DURATION_DAYS * 24 * 60 * 60 * 1000 - 1)
      return Math.floor(endDate.getTime() / 1000)
    }

    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)

      const startQ = sp.get("start")
      const endQ = sp.get("end")
      if (startQ && endQ && isIsoDateString(startQ) && isIsoDateString(endQ)) {
        return rangeFromIsoDates(startQ, endQ)
      }

      const fromParam = sp.get("from")
      const toParam = sp.get("to")
      if (fromParam && /^\d+$/.test(fromParam.trim())) {
        const fromUnix = parseInt(fromParam, 10)
        let toUnix: number
        if (toParam && /^\d+$/.test(toParam.trim())) {
          toUnix = parseInt(toParam, 10)
        } else {
          toUnix = calculateEndDateUnix(fromUnix)
        }
        const startDate = new Date(fromUnix * 1000)
        const endDate = new Date(toUnix * 1000)
        return {
          startAt: formatYYYYMMDDUTC(startDate),
          endAt: formatYYYYMMDDUTC(endDate),
          endTimeMs: endDate.getTime(),
          fromUnix,
          toUnix,
        }
      }
    }

    const dateFrom =
      process.env.NEXT_PUBLIC_LEADERBOARD_FROM_DATE ||
      process.env.NEXT_PUBLIC_LEADERBOARD_DATE_FROM
    const dateTo =
      process.env.NEXT_PUBLIC_LEADERBOARD_TO_DATE || process.env.NEXT_PUBLIC_LEADERBOARD_DATE_TO
    if (dateFrom && dateTo && isIsoDateString(dateFrom) && isIsoDateString(dateTo)) {
      return rangeFromIsoDates(dateFrom, dateTo)
    }

    // Legacy: numeric Unix in env (optional)
    const envFrom = process.env.NEXT_PUBLIC_BITFORTUNE_FROM
    const envTo = process.env.NEXT_PUBLIC_BITFORTUNE_TO || process.env.NEXT_PUBLIC_BITFORTUNE_END_AT
    if (envFrom && /^\d+$/.test(envFrom.trim())) {
      const fromUnix = parseInt(envFrom, 10)
      let toUnix: number
      if (envTo && /^\d+$/.test(envTo.trim())) {
        toUnix = parseInt(envTo, 10)
      } else {
        toUnix = calculateEndDateUnix(fromUnix)
      }
      const startDate = new Date(fromUnix * 1000)
      const endDate = new Date(toUnix * 1000)
      return {
        startAt: formatYYYYMMDDUTC(startDate),
        endAt: formatYYYYMMDDUTC(endDate),
        endTimeMs: endDate.getTime(),
        fromUnix,
        toUnix,
      }
    }

    return rangeFromIsoDates(DEFAULT_LEADERBOARD_START_DATE, DEFAULT_LEADERBOARD_END_DATE)
  }

async function reload(fromUnix: number, toUnix: number) {
  try {
    setLoading(true)
    setError(null)

    const response = await fetch(`/api/leaderboard?from=${fromUnix}&to=${toUnix}`, { cache: "no-store" })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    const data = await response.json()

    const sourceArray = Array.isArray(data)
      ? data
      : Array.isArray((data as any).leaderboard)
        ? (data as any).leaderboard
        : []

    const base: LeaderboardEntry[] = sourceArray.map((entry: any, index: number) => ({
      id: entry.id ?? `${index + 1}`,
      username: entry.username ?? entry.name ?? `Player${index + 1}`,
      wagered: Number(
        entry.total_wager_usd ??
          entry.wagered ??
          entry.bets ??
          entry.wagered_amount ??
          entry.totalWagered ??
          0
      ),
      prize: 0,
      rank: index + 1,
    }))

    const sorted = [...base].sort((a, b) => b.wagered - a.wagered)
    const prizeForRank = (rank: number): number => {
      const map: Record<number, number> = { 1: 1500, 2: 800, 3: 450, 4: 250 }
      return map[rank] ?? 0
    }

    const ranked: LeaderboardEntry[] = sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      prize: prizeForRank(idx + 1),
    }))

    // Ensure we always display 20 places
    const padded: LeaderboardEntry[] = [...ranked]
    for (let i = padded.length + 1; i <= 20; i++) {
      padded.push({
        id: `placeholder-${i}`,
        username: "Awaiting player",
        wagered: 0,
        prize: prizeForRank(i),
        rank: i,
      })
    }

    // Update state and cache
    setLeaderboardData(padded.slice(0, 20))
    // Use Unix timestamps for cache key
    saveCache(fromUnix.toString(), toUnix.toString(), padded.slice(0, 10))
  } catch (err) {
    console.error("Failed to fetch leaderboard:", err)
    setError("Failed to load leaderboard data")
    // Fallback to cached data if present, otherwise use placeholders
    try {
      const cached = readCache(fromUnix.toString(), toUnix.toString())
      if (cached && cached.data.length > 0) {
        setLeaderboardData(cached.data)
      } else {
        setLeaderboardData(createPlaceholders())
      }
    } catch {
      setLeaderboardData(createPlaceholders())
    }
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    const { startAt, endAt, endTimeMs, fromUnix, toUnix } = computeActiveRange()
    setRange({ startAt, endAt, fromUnix, toUnix })
    setEndTimeMs(endTimeMs)

    if (!Number.isFinite(fromUnix) || !Number.isFinite(toUnix)) {
      setLeaderboardData(createPlaceholders())
      return
    }

    // Hydrate from cache immediately if fresh, otherwise show placeholders
    const cached = readCache(fromUnix.toString(), toUnix.toString())
    if (isFresh(cached) && cached!.data.length > 0) {
      setLeaderboardData(cached!.data)
      setLoading(false)
    } else {
      // Show placeholders while loading or if no cached data
      setLeaderboardData(createPlaceholders())
    }

    // Restore manual cooldown from storage
    try {
      const raw = localStorage.getItem(makeManualKey(fromUnix.toString(), toUnix.toString()))
      if (raw) {
        const ts = Number(raw)
        if (Number.isFinite(ts)) {
          setLastManualAt(ts)
          const remaining = Math.max(0, ts + MANUAL_COOLDOWN_MS - Date.now())
          setManualCooldownMs(remaining)
        }
      }
    } catch {}

    reload(fromUnix, toUnix)
    const refreshInterval = setInterval(() => reload(fromUnix, toUnix), 900000)
    return () => clearInterval(refreshInterval)
  }, [])

  // Tick down the manual cooldown every second
  useEffect(() => {
    if (!range.startAt || !range.endAt) return
    const id = setInterval(() => {
      setManualCooldownMs((prev) => {
        const nextAllowed = lastManualAt + MANUAL_COOLDOWN_MS
        const remaining = Math.max(0, nextAllowed - Date.now())
        return remaining
      })
    }, 1000)
    return () => clearInterval(id)
  }, [lastManualAt, range.startAt, range.endAt])

  function formatCooldown(ms: number): string {
    const total = Math.ceil(ms / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  function handleManualRefresh() {
    if (!Number.isFinite(range.fromUnix) || !Number.isFinite(range.toUnix)) return
    const now = Date.now()
    const nextAllowed = lastManualAt + MANUAL_COOLDOWN_MS
    if (now < nextAllowed) return
    setLastManualAt(now)
    setManualCooldownMs(MANUAL_COOLDOWN_MS)
    try { localStorage.setItem(makeManualKey(range.fromUnix.toString(), range.toUnix.toString()), String(now)) } catch {}
    reload(range.fromUnix, range.toUnix)
  }

  useEffect(() => {
    if (!endTimeMs) return
    const tick = () => {
      const now = Date.now()
      const diff = Math.max(0, endTimeMs - now)
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft({ days, hours, minutes, seconds })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endTimeMs])

  // Ensure we always have at least 3 entries for the podium
  const topThree = leaderboardData.length >= 3 
    ? leaderboardData.slice(0, 3) 
    : [...leaderboardData, ...createPlaceholders().slice(0, 3 - leaderboardData.length)].slice(0, 3)
  const rest = leaderboardData.slice(3, 20)

  /** Display-only calendar labels (YYYY-MM-DD from range state). No Unix shown in UI. */
  const formatCalendarDate = (isoYYYYMMDD: string) => {
    const d = new Date(isoYYYYMMDD + "T12:00:00Z")
    if (Number.isNaN(d.getTime())) return isoYYYYMMDD
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  }

  const currency = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
          <p className="text-cyan-100/90 text-sm md:text-base font-semibold tracking-wide mb-2" style={{ fontFamily: 'var(--font-future)' }}>
            Fortnightly leaderboard
          </p>
          <p className="text-white text-sm italic drop-shadow-sm mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>The leaderboard updates every 15 minutes.</p>
          <p className="text-orange-400 text-xs font-semibold drop-shadow-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>Note: No originals can be used at 1.01x for wagering</p>
        </div>

        {/* Date range + countdown (above podium so always visible) */}
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

        {/* Phone: stack 1 → 2 → 3 */}
        <div className="flex flex-col md:hidden justify-center items-stretch gap-4 mb-8 px-1">
          {[0, 1, 2].map((idx) => {
            const p = topThree[idx]
            if (!p) return <div key={`empty-m-${idx}`} className="w-full max-w-[18rem] mx-auto" />
            return <PodiumPlaceCard key={`m-${p.id}`} p={p} currency={currency} />
          })}
        </div>

        {/* Tablet: 1st row = winner; 2nd row = 2nd + 3rd side by side */}
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
                  <div className="mb-1 text-white text-lg lg:text-xl xl:text-2xl font-extrabold flex items-center justify-center gap-1 sm:gap-2 flex-wrap px-1" style={{ fontFamily: 'var(--font-future)' }}>
                    <span className="max-w-full break-words">{maskUsername(p.username)}</span>
                  </div>
                  <div className="mb-4 mt-1 bg-white/10 text-white font-bold px-2 sm:px-4 py-2 rounded-full border border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.25)] text-xs sm:text-sm lg:text-base max-w-[min(100%,11rem)] mx-auto" style={{ fontFamily: 'var(--font-future)' }}>${currency(p.wagered)}</div>
                  <div className="text-white text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-future)' }}>Prize</div>
                  <div className={`text-xl lg:text-2xl xl:text-3xl font-black ${prizeClass}`} style={{ fontFamily: 'var(--font-future)' }}>${p.prize}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Header row with refresh */}
        <div className="flex items-center justify-end mb-4 pr-0 md:pr-2 gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={loading || manualCooldownMs > 0}
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-white/30 text-white hover:bg-white/20 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-future)' }}
            title={manualCooldownMs > 0 ? `Available in ${formatCooldown(manualCooldownMs)}` : "Refresh leaderboard"}
          >
            <span className="text-white">↻</span>
            <span>{manualCooldownMs > 0 ? `Refresh (${formatCooldown(manualCooldownMs)})` : "Refresh"}</span>
          </button>
        </div>

        {/* Remaining ranks (mobile safe widths) */}
        <div className="flex flex-col items-center gap-3 md:gap-4 mb-16">
          {rest.map((p) => (
            <div key={p.id} className="relative group w-full max-w-[64rem] mx-2 md:mx-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 rounded-2xl blur-sm opacity-20 group-hover:opacity-40 transition" />
              <div className="relative bg-black rounded-2xl px-4 md:px-6 py-4 md:py-5 border border-zinc-800/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-[0_0_20px_rgba(251,146,60,0.08)]">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="text-white text-base font-extrabold w-10 text-center" style={{ fontFamily: 'var(--font-future)' }}>#{p.rank}</div>
                  {p.prize > 0 && (
                    <span className="text-white text-xs font-extrabold px-2 py-0.5 rounded-full border border-white/30 bg-white/10" style={{ fontFamily: 'var(--font-future)' }}>
                      ${p.prize}
                    </span>
                  )}
                  <div className="text-white text-base md:text-xl font-bold" style={{ fontFamily: 'var(--font-future)' }}>{maskUsername(p.username)}</div>
                </div>
                <div className="flex items-center gap-4 md:gap-8 self-end md:self-auto">
                  <div className="text-white text-sm">Wagered</div>
                  <div className="text-white text-base md:text-xl font-bold" style={{ fontFamily: 'var(--font-future)' }}>${currency(p.wagered)}</div>
                  <div className={`text-white text-base md:text-xl font-black min-w-[4ch] text-right`} style={{ fontFamily: 'var(--font-future)' }}>
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
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }
      `}</style>
    </div>
  )
}
