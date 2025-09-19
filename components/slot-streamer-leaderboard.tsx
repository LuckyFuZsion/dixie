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

export default function SlotStreamerLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [range, setRange] = useState<{ startAt: string; endAt: string }>({ startAt: "", endAt: "" })
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
    // 1) URL overrides
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const s = sp.get("start_at") || sp.get("start")
      const e = sp.get("end_at") || sp.get("end")
      if (s && e) {
        const endUTC = new Date(`${e}T23:59:59Z`)
        return { startAt: s, endAt: e, endTimeMs: endUTC.getTime() }
      }
    }
    // 2) Public env overrides
    const envStart = process.env.NEXT_PUBLIC_RAINBET_START_AT
    const envEnd = process.env.NEXT_PUBLIC_RAINBET_END_AT
    if (envStart && envEnd) {
      const endUTC = new Date(`${envEnd}T23:59:59Z`)
      return { startAt: envStart, endAt: envEnd, endTimeMs: endUTC.getTime() }
    }
    // 3) Fallback rolling 12th
    return computeRolling12thRange()
  }

async function reload(startAt: string, endAt: string) {
  try {
    setLoading(true)
    setError(null)

    const response = await fetch(`/api/leaderboard?start_at=${startAt}&end_at=${endAt}`, { cache: "no-store" })
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
      const map: Record<number, number> = { 1: 400, 2: 225, 3: 100, 4: 50, 5: 25 }
      return map[rank] ?? 0
    }

    const ranked: LeaderboardEntry[] = sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      prize: prizeForRank(idx + 1),
    }))

    // Ensure we always display 10 places
    const padded: LeaderboardEntry[] = [...ranked]
    for (let i = padded.length + 1; i <= 10; i++) {
      padded.push({
        id: `placeholder-${i}`,
        username: "Await***player",
        wagered: 0,
        prize: prizeForRank(i),
        rank: i,
      })
    }

    // Update state and cache
    setLeaderboardData(padded.slice(0, 10))
    saveCache(startAt, endAt, padded.slice(0, 10))
  } catch (err) {
    console.error("Failed to fetch leaderboard:", err)
    setError("Failed to load leaderboard data")
    // Fallback to cached data if present
    const cached = readCache(startAt, endAt)
    if (cached) {
      setLeaderboardData(cached.data)
    } else {
      setLeaderboardData([])
    }
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    const { startAt, endAt, endTimeMs } = computeActiveRange()
    setRange({ startAt, endAt })
    setEndTimeMs(endTimeMs)

    // Hydrate from cache immediately if fresh
    const cached = readCache(startAt, endAt)
    if (isFresh(cached)) {
      setLeaderboardData(cached!.data)
      setLoading(false)
    }

    // Restore manual cooldown from storage
    try {
      const raw = localStorage.getItem(makeManualKey(startAt, endAt))
      if (raw) {
        const ts = Number(raw)
        if (Number.isFinite(ts)) {
          setLastManualAt(ts)
          const remaining = Math.max(0, ts + MANUAL_COOLDOWN_MS - Date.now())
          setManualCooldownMs(remaining)
        }
      }
    } catch {}

    reload(startAt, endAt)
    const refreshInterval = setInterval(() => reload(startAt, endAt), 900000)
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
    if (!range.startAt || !range.endAt) return
    const now = Date.now()
    const nextAllowed = lastManualAt + MANUAL_COOLDOWN_MS
    if (now < nextAllowed) return
    setLastManualAt(now)
    setManualCooldownMs(MANUAL_COOLDOWN_MS)
    try { localStorage.setItem(makeManualKey(range.startAt, range.endAt), String(now)) } catch {}
    reload(range.startAt, range.endAt)
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

  const topThree = leaderboardData.slice(0, 3)
  const rest = leaderboardData.slice(3, 10)

  const formatPretty = (isoDate: string) =>
    new Date(isoDate + "T00:00:00Z").toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

  const currency = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="min-h-screen relative">
      {/* Solid header bar */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-slate-950/95 border-b border-white/10 backdrop-blur-none">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between relative">
          <span className="w-[120px] h-[40px]" />
          <div className="absolute left-1/2 -translate-x-1/2 text-slate-100 text-sm md:text-base tracking-widest" style={{ fontFamily: 'var(--font-future)' }}>
            The Dailey Depo
          </div>
          <span className="w-[120px]" />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-8 max-w-6xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Image src="/images/rainbet-logo.png" alt="Rainbet" width={260} height={96} className="opacity-90" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-wider" style={{ fontFamily: 'var(--font-future)' }}>$600 MONTHLY CODE TDD LEADERBOARD!</h1>
          <p className="text-white/70 text-base md:text-lg mb-2">
            Every <span className="font-bold">BET</span> on Rainbet under Code <span className="font-bold text-cyan-400">TDD</span> counts towards your score.
          </p>
          <p className="text-white/60 text-sm italic">The leaderboard updates every 15 minutes.</p>
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
            const prizeClass = isFirst ? "text-yellow-400" : idx === 1 ? "text-white" : "text-orange-400"
            return (
              <div key={`m-${p.id}`} className={`relative group w-full max-w-[18rem] mx-auto ${sizeClass}`}>
                <div className={`absolute inset-0 rounded-2xl ${ringClass} opacity-80`} />
                <div className="relative h-full bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-600/30 flex flex-col items-center justify-center text-center px-6 shadow-[0_0_20px_rgba(0,255,255,0.10)]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-900 text-xs font-extrabold px-3 py-1 rounded-full shadow" style={{ fontFamily: 'var(--font-future)' }}>{p.rank}</div>
                  <div className="mb-1 text-white text-2xl font-extrabold flex items-center gap-2" style={{ fontFamily: 'var(--font-future)' }}>
                    {isFirst && <span className="text-yellow-400">🏆</span>}
                    <span>{maskUsername(p.username)}</span>
                  </div>
                  <div className="mb-4 mt-1 bg-cyan-500/10 text-cyan-200 font-bold px-4 py-2 rounded-full border border-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.25)]" style={{ fontFamily: 'var(--font-future)' }}>${currency(p.wagered)}</div>
                  <div className="text-white/70 text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-future)' }}>Prize</div>
                  <div className={`text-2xl font-black ${prizeClass}`} style={{ fontFamily: 'var(--font-future)' }}>${p.prize}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop: keep 2nd (left), 1st (center), 3rd (right) */}
        <div className="hidden md:flex justify-center items-end gap-8 mb-12">
          {[1, 0, 2].map((idx) => {
            const p = topThree[idx]
            if (!p) return <div key={`empty-d-${idx}`} className="w-80" />
            const isFirst = idx === 0
            const sizeClass = isFirst ? "h-80" : "h-72"
            const ringClass = isFirst ? "ring-2 ring-yellow-400" : idx === 1 ? "ring-2 ring-gray-300" : "ring-2 ring-amber-500"
            const prizeClass = isFirst ? "text-yellow-400" : idx === 1 ? "text-white" : "text-orange-400"
            return (
              <div key={`d-${p.id}`} className={`relative group w-80 ${sizeClass}`}>
                <div className={`absolute inset-0 rounded-2xl ${ringClass} opacity-80`} />
                <div className="relative h-full bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-600/30 flex flex-col items-center justify-center text-center px-6 shadow-[0_0_20px_rgba(0,255,255,0.10)]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-900 text-xs font-extrabold px-3 py-1 rounded-full shadow" style={{ fontFamily: 'var(--font-future)' }}>{p.rank}</div>
                  <div className="mb-1 text-white text-2xl font-extrabold flex items-center gap-2" style={{ fontFamily: 'var(--font-future)' }}>
                    {isFirst && <span className="text-yellow-400">🏆</span>}
                    <span>{maskUsername(p.username)}</span>
                  </div>
                  <div className="mb-4 mt-1 bg-cyan-500/10 text-cyan-200 font-bold px-4 py-2 rounded-full border border-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.25)]" style={{ fontFamily: 'var(--font-future)' }}>${currency(p.wagered)}</div>
                  <div className="text-white/70 text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-future)' }}>Prize</div>
                  <div className={`text-3xl font-black ${prizeClass}`} style={{ fontFamily: 'var(--font-future)' }}>${p.prize}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Date range and countdown */}
        {range.startAt && range.endAt && (
          <div className="text-center mb-8">
            <div className="text-slate-200 text-lg md:text-xl mb-3" style={{ fontFamily: 'var(--font-future)' }}>
              {formatPretty(range.startAt)} <span className="mx-2 text-slate-400">→</span> {formatPretty(range.endAt)}
            </div>
            <div className="flex items-center justify-center gap-2 text-pink-300 font-semibold mb-2" style={{ fontFamily: 'var(--font-future)' }}>
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
                  <div className="text-3xl md:text-5xl font-extrabold text-pink-300" style={{ fontFamily: 'var(--font-future)' }}>{t.value}</div>
                  <div className="text-xs uppercase tracking-widest text-white/60">{t.label}</div>
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
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-slate-600/50 text-slate-200 hover:bg-slate-700/40 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-future)' }}
            title={manualCooldownMs > 0 ? `Available in ${formatCooldown(manualCooldownMs)}` : "Refresh leaderboard"}
          >
            <span className="text-slate-300">↻</span>
            <span>{manualCooldownMs > 0 ? `Refresh (${formatCooldown(manualCooldownMs)})` : "Refresh"}</span>
          </button>
        </div>

        {/* Remaining ranks (mobile safe widths) */}
        <div className="flex flex-col items-center gap-3 md:gap-4 mb-16">
          {rest.map((p) => (
            <div key={p.id} className="relative group w-full max-w-[64rem] mx-2 md:mx-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 rounded-2xl blur-sm opacity-30 group-hover:opacity-60 transition" />
              <div className="relative bg-slate-900/40 backdrop-blur-md rounded-2xl px-4 md:px-6 py-4 md:py-5 border border-slate-600/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-[0_0_20px_rgba(0,255,255,0.08)]">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="text-cyan-300 text-base font-extrabold w-10 text-center" style={{ fontFamily: 'var(--font-future)' }}>#{p.rank}</div>
                  {p.prize > 0 && (
                    <span className="text-amber-300 text-xs font-extrabold px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10" style={{ fontFamily: 'var(--font-future)' }}>
                      ${p.prize}
                    </span>
                  )}
                  <div className="text-white text-base md:text-xl font-bold" style={{ fontFamily: 'var(--font-future)' }}>{maskUsername(p.username)}</div>
                </div>
                <div className="flex items-center gap-4 md:gap-8 self-end md:self-auto">
                  <div className="text-white/70 text-sm">Wagered</div>
                  <div className="text-white text-base md:text-xl font-bold" style={{ fontFamily: 'var(--font-future)' }}>${currency(p.wagered)}</div>
                  <div className={`text-amber-300 text-base md:text-xl font-black min-w-[4ch] text-right`} style={{ fontFamily: 'var(--font-future)' }}>
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
