"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
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

function createPlaceholders(): LeaderboardEntry[] {
  const prizeForRank = (rank: number): number => {
    const map: Record<number, number> = { 1: 2000, 2: 1000, 3: 500, 4: 175, 5: 100, 6: 75, 7: 50, 8: 50, 9: 25, 10: 25 }
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

  function computeRolling12thRange() {
    const now = new Date()
    const currentMonth12th = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 12))
    let startUTC: Date
    let endUTC: Date
    if (now >= currentMonth12th) {
      startUTC = currentMonth12th
      endUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 12))
    } else {
      startUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 12))
      endUTC = currentMonth12th
    }
    endUTC.setUTCHours(23, 59, 59, 999)
    return { startAt: formatYYYYMMDDUTC(startUTC), endAt: formatYYYYMMDDUTC(endUTC), endTimeMs: endUTC.getTime() }
  }

  function computeActiveRange() {
    const LEADERBOARD_DURATION_DAYS = 28
    
    // Helper to calculate end date from start date (exactly 28 days later)
    // Calculates: start date + exactly 28 days = end of day 28
    const calculateEndDate = (startUnix: number) => {
      const startDate = new Date(startUnix * 1000)
      // Normalize start to beginning of day (00:00:00.000) for consistent calculation
      const startOfDay = new Date(Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
        0, 0, 0, 0
      ))
      // Add exactly 28 days worth of milliseconds, then subtract 1ms to get end of day 28
      // This gives us: day 1 00:00:00.000 to day 28 23:59:59.999 = exactly 28 days
      const endDate = new Date(startOfDay.getTime() + (LEADERBOARD_DURATION_DAYS * 24 * 60 * 60 * 1000) - 1)
      return {
        endDate,
        endUnix: Math.floor(endDate.getTime() / 1000),
        endTimeMs: endDate.getTime()
      }
    }

    // 1) URL overrides (Unix timestamp - only "from" needed, "to" is optional for backwards compatibility)
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const fromParam = sp.get("from")
      const toParam = sp.get("to")
      if (fromParam) {
        const fromUnix = parseInt(fromParam, 10)
        // If "to" is provided, use it (backwards compatibility), otherwise calculate from start + 28 days
        let toUnix: number
        if (toParam) {
          toUnix = parseInt(toParam, 10)
        } else {
          toUnix = calculateEndDate(fromUnix).endUnix
        }
        const startDate = new Date(fromUnix * 1000)
        const endDate = new Date(toUnix * 1000)
        return { 
          startAt: formatYYYYMMDDUTC(startDate), 
          endAt: formatYYYYMMDDUTC(endDate), 
          endTimeMs: endDate.getTime(),
          fromUnix,
          toUnix
        }
      }
    }
    // 2) Public env overrides (Unix timestamp - only "from" needed)
    const envFrom = process.env.NEXT_PUBLIC_BITFORTUNE_FROM
    const envTo = process.env.NEXT_PUBLIC_BITFORTUNE_TO || process.env.NEXT_PUBLIC_BITFORTUNE_END_AT
    if (envFrom) {
      const fromUnix = parseInt(envFrom, 10)
      // If "to" is provided, use it (backwards compatibility), otherwise calculate from start + 28 days
      let toUnix: number
      if (envTo) {
        toUnix = parseInt(envTo, 10)
      } else {
        toUnix = calculateEndDate(fromUnix).endUnix
      }
      const startDate = new Date(fromUnix * 1000)
      const endDate = new Date(toUnix * 1000)
      return { 
        startAt: formatYYYYMMDDUTC(startDate), 
        endAt: formatYYYYMMDDUTC(endDate), 
        endTimeMs: endDate.getTime(),
        fromUnix,
        toUnix
      }
    }
    // 3) Fallback rolling 12th
    const rolling = computeRolling12thRange()
    return { 
      ...rolling, 
      fromUnix: Math.floor(new Date(rolling.startAt + "T00:00:00Z").getTime() / 1000),
      toUnix: Math.floor(rolling.endTimeMs / 1000)
    }
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
      wagered: Number(entry.wagered ?? entry.wagered_amount ?? entry.totalWagered ?? 0),
      prize: 0,
      rank: index + 1,
    }))

    const sorted = [...base].sort((a, b) => b.wagered - a.wagered)
    const prizeForRank = (rank: number): number => {
      const map: Record<number, number> = { 1: 2000, 2: 1000, 3: 500, 4: 175, 5: 100, 6: 75, 7: 50, 8: 50, 9: 25, 10: 25 }
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

    if (!fromUnix || !toUnix) {
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
    if (!range.fromUnix || !range.toUnix) return
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

  const formatPretty = (isoDate: string, unixTimestamp?: number) => {
    // If Unix timestamp is provided, use it for accurate time; otherwise parse the date string
    const date = unixTimestamp ? new Date(unixTimestamp * 1000) : new Date(isoDate + "T00:00:00Z")
    const dateStr = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    const timeStr = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    })
    return { date: dateStr, time: timeStr }
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
              <Image src="/images/bitfortune-logo.svg" alt="BitFortune" width={390} height={56} className="opacity-90" />
            </a>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-wider drop-shadow-lg" style={{ fontFamily: 'var(--font-future)', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>4k Race</h1>
          <p className="text-white text-sm italic drop-shadow-sm mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>The leaderboard updates every 15 minutes.</p>
          <p className="text-orange-400 text-xs font-semibold drop-shadow-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>Note: No originals can be used at 1.01x for wagering</p>
        </div>

        {/* Podium (mobile: stacked; desktop: 2-1-3 row) */}
        {/* Mobile: show 1st → 2nd → 3rd */}
        <div className="flex flex-col md:hidden justify-center items-stretch gap-4 mb-8">
          {[0, 1, 2].map((idx) => {
            const p = topThree[idx]
            if (!p) return <div key={`empty-m-${idx}`} className="w-full max-w-[18rem] mx-auto" />
            const isFirst = idx === 0
            const sizeClass = isFirst ? "h-72" : "h-64"
            const ringClass = isFirst ? "ring-2 ring-yellow-400" : idx === 1 ? "ring-2 ring-gray-300" : "ring-2 ring-amber-500"
            const prizeClass = "text-white"
            return (
              <div key={`m-${p.id}`} className={`relative group w-full max-w-[18rem] mx-auto ${sizeClass}`}>
                <div className={`absolute inset-0 rounded-2xl ${ringClass} opacity-80`} />
                <div className="relative h-full bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-600/30 flex flex-col items-center justify-center text-center px-6 shadow-[0_0_20px_rgba(0,255,255,0.10)]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/20 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow" style={{ fontFamily: 'var(--font-future)' }}>{p.rank}</div>
                  <div className="mb-1 text-white text-2xl font-extrabold flex items-center gap-2" style={{ fontFamily: 'var(--font-future)' }}>
                    {isFirst && <span className="text-white">🏆</span>}
                    <span>{maskUsername(p.username)}</span>
                  </div>
                  <div className="mb-4 mt-1 bg-white/10 text-white font-bold px-4 py-2 rounded-full border border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.25)]" style={{ fontFamily: 'var(--font-future)' }}>${currency(p.wagered)}</div>
                  <div className="text-white text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-future)' }}>Prize</div>
                  <div className={`text-2xl font-black ${prizeClass}`} style={{ fontFamily: 'var(--font-future)' }}>${p.prize}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop: keep 2nd (left), 1st (center), 3rd (right) - FORCE VISIBLE */}
        <div className="desktop-podium-container justify-center items-end gap-4 md:gap-6 lg:gap-8 mb-12 min-h-[320px] w-full px-4 relative z-10">
          {[1, 0, 2].map((idx) => {
            const p = topThree[idx] || {
              id: `fallback-${idx}`,
              username: "Awaiting player",
              wagered: 0,
              prize: idx === 0 ? 1000 : idx === 1 ? 2000 : 500,
              rank: idx === 0 ? 2 : idx === 1 ? 1 : 3,
            }
            const isFirst = p.rank === 1
            const sizeClass = isFirst ? "h-72 md:h-80 lg:h-80" : "h-64 md:h-72 lg:h-72"
            const ringClass = isFirst ? "ring-2 ring-yellow-400" : p.rank === 2 ? "ring-2 ring-gray-300" : "ring-2 ring-amber-500"
            const prizeClass = "text-white"
            return (
              <div key={`d-${p.id}`} className={`relative group w-64 md:w-72 lg:w-80 flex-shrink-0 ${sizeClass}`}>
                <div className={`absolute inset-0 rounded-2xl ${ringClass} opacity-80`} />
                <div className="relative h-full bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-600/30 flex flex-col items-center justify-center text-center px-4 md:px-6 shadow-[0_0_20px_rgba(0,255,255,0.10)]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/20 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow" style={{ fontFamily: 'var(--font-future)' }}>{p.rank}</div>
                  <div className="mb-1 text-white text-xl md:text-2xl font-extrabold flex items-center gap-2" style={{ fontFamily: 'var(--font-future)' }}>
                    {isFirst && <span className="text-white">🏆</span>}
                    <span>{maskUsername(p.username)}</span>
                  </div>
                  <div className="mb-4 mt-1 bg-white/10 text-white font-bold px-3 md:px-4 py-2 rounded-full border border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.25)] text-sm md:text-base" style={{ fontFamily: 'var(--font-future)' }}>${currency(p.wagered)}</div>
                  <div className="text-white text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-future)' }}>Prize</div>
                  <div className={`text-2xl md:text-3xl font-black ${prizeClass}`} style={{ fontFamily: 'var(--font-future)' }}>${p.prize}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Date range and countdown */}
        {range.startAt && range.endAt && (
          <div className="text-center mb-8">
            <div className="text-white text-lg md:text-xl mb-3 drop-shadow-md" style={{ fontFamily: 'var(--font-future)', textShadow: '1px 1px 2px rgba(0,0,0,0.15)' }}>
              {/* Mobile: Stack on 2 rows, Desktop: Single row */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-3 md:gap-2">
                <div className="flex flex-col md:flex-row md:items-center">
                  <span className="text-sm md:hidden mb-1 opacity-80">From:</span>
                  <span className="font-bold">{formatPretty(range.startAt, range.fromUnix).date}</span>
                  <span className="italic md:ml-2">{formatPretty(range.startAt, range.fromUnix).time}</span>
                </div>
                <span className="mx-2 text-white hidden md:inline">→</span>
                <div className="flex flex-col md:flex-row md:items-center">
                  <span className="text-sm md:hidden mb-1 opacity-80">To:</span>
                  <span className="font-bold">{formatPretty(range.endAt, range.toUnix).date}</span>
                  <span className="italic md:ml-2">{formatPretty(range.endAt, range.toUnix).time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-white font-semibold mb-2 drop-shadow-sm" style={{ fontFamily: 'var(--font-future)', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
              <span>⏱️</span>
              <span>Time Remaining:</span>
            </div>
            <div className="grid grid-cols-4 gap-4 md:gap-6 max-w-xl mx-auto">
              {([
                { label: "days", value: timeLeft.days },
                { label: "hours", value: timeLeft.hours },
                { label: "mins", value: timeLeft.minutes },
                { label: "secs", value: timeLeft.seconds },
              ] as const).map((t) => (
                <div key={t.label} className="text-center">
                  <div className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg" style={{ fontFamily: 'var(--font-future)', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>{t.value}</div>
                  <div className="text-xs uppercase tracking-widest text-white drop-shadow-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

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
              <div className="relative bg-slate-800/60 backdrop-blur-md rounded-2xl px-4 md:px-6 py-4 md:py-5 border border-slate-600/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-[0_0_20px_rgba(251,146,60,0.10)]">
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
