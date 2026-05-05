"use client"

import { useState, useEffect, useMemo } from "react"
import {
  DEFAULT_LEADERBOARD_END_DATE,
  DEFAULT_LEADERBOARD_START_DATE,
  isIsoDateString,
  rangeFromIsoDates,
} from "@/lib/leaderboard-dates"

export interface LeaderboardEntry {
  id: string
  username: string
  wagered: number
  prize: number
  rank: number
}

interface CachedLeaderboard {
  data: LeaderboardEntry[]
  updatedAt: number
}

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
    return JSON.parse(raw) as CachedLeaderboard
  } catch {
    return null
  }
}

export function maskUsername(name: string): string {
  if (name.length <= 3) return name
  const start = name.slice(0, 3)
  const end = name.slice(-3)
  return `${start}***${end}`
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

function formatYYYYMMDDUTC(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function useLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(createPlaceholders())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [range, setRange] = useState<{
    startAt: string
    endAt: string
    fromUnix?: number
    toUnix?: number
  }>({ startAt: "", endAt: "" })
  const [endTimeMs, setEndTimeMs] = useState<number>(0)
  const [manualCooldownMs, setManualCooldownMs] = useState<number>(0)
  const [lastManualAt, setLastManualAt] = useState<number>(0)

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
      process.env.NEXT_PUBLIC_LEADERBOARD_FROM_DATE || process.env.NEXT_PUBLIC_LEADERBOARD_DATE_FROM
    const dateTo = process.env.NEXT_PUBLIC_LEADERBOARD_TO_DATE || process.env.NEXT_PUBLIC_LEADERBOARD_DATE_TO
    if (dateFrom && dateTo && isIsoDateString(dateFrom) && isIsoDateString(dateTo)) {
      return rangeFromIsoDates(dateFrom, dateTo)
    }

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

      const cacheBust = Date.now()
      const response = await fetch(`/api/leaderboard?from=${fromUnix}&to=${toUnix}&cb=${cacheBust}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      const data = await response.json()

      const sourceArray = Array.isArray(data)
        ? data
        : Array.isArray((data as { leaderboard?: unknown }).leaderboard)
          ? (data as { leaderboard: unknown[] }).leaderboard
          : []

      const base: LeaderboardEntry[] = sourceArray.map((entry: Record<string, unknown>, index: number) => ({
        id: String(entry.id ?? `${index + 1}`),
        username: String(entry.username ?? entry.name ?? `Player${index + 1}`),
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

      setLeaderboardData(padded.slice(0, 20))
      saveCache(fromUnix.toString(), toUnix.toString(), padded.slice(0, 10))
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err)
      setError("Failed to load leaderboard data")
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
    const { startAt, endAt, endTimeMs: etm, fromUnix, toUnix } = computeActiveRange()
    setRange({ startAt, endAt, fromUnix, toUnix })
    setEndTimeMs(etm ?? 0)

    if (!Number.isFinite(fromUnix) || !Number.isFinite(toUnix)) {
      setLeaderboardData(createPlaceholders())
      return
    }

    // Always fetch fresh data on page load; localStorage cache is only used as an error fallback.
    setLeaderboardData(createPlaceholders())

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

  useEffect(() => {
    if (!range.startAt || !range.endAt) return
    const id = setInterval(() => {
      setManualCooldownMs(() => {
        const nextAllowed = lastManualAt + MANUAL_COOLDOWN_MS
        return Math.max(0, nextAllowed - Date.now())
      })
    }, 1000)
    return () => clearInterval(id)
  }, [lastManualAt, range.startAt, range.endAt])

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
    try {
      localStorage.setItem(makeManualKey(range.fromUnix.toString(), range.toUnix.toString()), String(now))
    } catch {}
    reload(range.fromUnix, range.toUnix)
  }

  const formatCalendarDate = (isoYYYYMMDD: string) => {
    const d = new Date(isoYYYYMMDD + "T12:00:00Z")
    if (Number.isNaN(d.getTime())) return isoYYYYMMDD
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  }

  const currency = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const topThree = useMemo(() => {
    return leaderboardData.length >= 3
      ? leaderboardData.slice(0, 3)
      : [...leaderboardData, ...createPlaceholders().slice(0, 3 - leaderboardData.length)].slice(0, 3)
  }, [leaderboardData])

  const rest = useMemo(() => leaderboardData.slice(3, 20), [leaderboardData])

  return {
    leaderboardData,
    loading,
    error,
    timeLeft,
    range,
    endTimeMs,
    manualCooldownMs,
    handleManualRefresh,
    formatCooldown,
    formatCalendarDate,
    currency,
    topThree,
    rest,
  }
}
