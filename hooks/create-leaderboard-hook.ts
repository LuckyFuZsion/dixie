"use client"

import { useState, useEffect, useMemo } from "react"
import { isIsoDateString, rangeFromIsoDates } from "@/lib/leaderboard-dates"
import {
  prizeForRank,
  type LeaderboardVariantConfig,
} from "@/lib/leaderboard-variants"

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

function makeCacheKey(prefix: string, startAt: string, endAt: string): string {
  return `${prefix}:${startAt}:${endAt}`
}

function makeManualKey(prefix: string, startAt: string, endAt: string): string {
  return `${prefix}:manualRefreshAt:${startAt}:${endAt}`
}

function saveCache(prefix: string, startAt: string, endAt: string, data: LeaderboardEntry[]) {
  try {
    const payload: CachedLeaderboard = { data, updatedAt: Date.now() }
    localStorage.setItem(makeCacheKey(prefix, startAt, endAt), JSON.stringify(payload))
  } catch {}
}

function readCache(prefix: string, startAt: string, endAt: string): CachedLeaderboard | null {
  try {
    const raw = localStorage.getItem(makeCacheKey(prefix, startAt, endAt))
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

function formatYYYYMMDDUTC(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Next.js only inlines NEXT_PUBLIC_* when accessed as static property names.
 * Dynamic process.env[key] is always undefined in the browser, so we map them here.
 */
const PUBLIC_ENV: Record<string, string | undefined> = {
  NEXT_PUBLIC_LEADERBOARD_FROM_DATE: process.env.NEXT_PUBLIC_LEADERBOARD_FROM_DATE,
  NEXT_PUBLIC_LEADERBOARD_DATE_FROM: process.env.NEXT_PUBLIC_LEADERBOARD_DATE_FROM,
  NEXT_PUBLIC_LEADERBOARD_TO_DATE: process.env.NEXT_PUBLIC_LEADERBOARD_TO_DATE,
  NEXT_PUBLIC_LEADERBOARD_DATE_TO: process.env.NEXT_PUBLIC_LEADERBOARD_DATE_TO,
  NEXT_PUBLIC_BITFORTUNE_FROM: process.env.NEXT_PUBLIC_BITFORTUNE_FROM,
  NEXT_PUBLIC_BITFORTUNE_TO: process.env.NEXT_PUBLIC_BITFORTUNE_TO,
  NEXT_PUBLIC_BITFORTUNE_END_AT: process.env.NEXT_PUBLIC_BITFORTUNE_END_AT,
  NEXT_PUBLIC_BITFORTUNE_STREAMER_FROM: process.env.NEXT_PUBLIC_BITFORTUNE_STREAMER_FROM,
  NEXT_PUBLIC_BITFORTUNE_STREAMER_TO: process.env.NEXT_PUBLIC_BITFORTUNE_STREAMER_TO,
  NEXT_PUBLIC_BITFORTUNE_STREAMER_END_AT: process.env.NEXT_PUBLIC_BITFORTUNE_STREAMER_END_AT,
  NEXT_PUBLIC_BITFORTUNE_STREAMER_FROM_DATE: process.env.NEXT_PUBLIC_BITFORTUNE_STREAMER_FROM_DATE,
  NEXT_PUBLIC_BITFORTUNE_STREAMER_DATE_FROM: process.env.NEXT_PUBLIC_BITFORTUNE_STREAMER_DATE_FROM,
  NEXT_PUBLIC_BITFORTUNE_STREAMER_TO_DATE: process.env.NEXT_PUBLIC_BITFORTUNE_STREAMER_TO_DATE,
  NEXT_PUBLIC_BITFORTUNE_STREAMER_DATE_TO: process.env.NEXT_PUBLIC_BITFORTUNE_STREAMER_DATE_TO,
  NEXT_PUBLIC_METASPINS_FROM: process.env.NEXT_PUBLIC_METASPINS_FROM,
  NEXT_PUBLIC_METASPINS_TO: process.env.NEXT_PUBLIC_METASPINS_TO,
  NEXT_PUBLIC_METASPINS_END_AT: process.env.NEXT_PUBLIC_METASPINS_END_AT,
  NEXT_PUBLIC_METASPINS_FROM_DATE: process.env.NEXT_PUBLIC_METASPINS_FROM_DATE,
  NEXT_PUBLIC_METASPINS_DATE_FROM: process.env.NEXT_PUBLIC_METASPINS_DATE_FROM,
  NEXT_PUBLIC_METASPINS_TO_DATE: process.env.NEXT_PUBLIC_METASPINS_TO_DATE,
  NEXT_PUBLIC_METASPINS_DATE_TO: process.env.NEXT_PUBLIC_METASPINS_DATE_TO,
}

function readEnv(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = PUBLIC_ENV[key] ?? (typeof process !== "undefined" ? process.env[key] : undefined)
    if (value) return value
  }
  return undefined
}

function appendUrlRangeParams(params: URLSearchParams) {
  if (typeof window === "undefined") return
  const sp = new URLSearchParams(window.location.search)
  for (const key of ["start", "end", "from", "to"] as const) {
    const value = sp.get(key)
    if (value) params.set(key, value)
  }
}

export function createLeaderboardHook(config: LeaderboardVariantConfig) {
  function createPlaceholders(): LeaderboardEntry[] {
    return Array.from({ length: 20 }, (_, i) => ({
      id: `placeholder-${i + 1}`,
      username: "Awaiting player",
      wagered: 0,
      prize: prizeForRank(config.prizeMap, i + 1),
      rank: i + 1,
    }))
  }

  return function useLeaderboardVariant() {
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

      const dateFrom = readEnv(config.isoDateFromKeys)
      const dateTo = readEnv(config.isoDateToKeys)
      if (dateFrom && dateTo && isIsoDateString(dateFrom) && isIsoDateString(dateTo)) {
        return rangeFromIsoDates(dateFrom, dateTo)
      }

      const envFrom = readEnv(config.unixFromKeys)
      const envTo = readEnv(config.unixToKeys)
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

      return rangeFromIsoDates(config.defaultStartDate, config.defaultEndDate)
    }

    function restoreManualCooldown(fromUnix: number, toUnix: number) {
      try {
        const raw = localStorage.getItem(makeManualKey(config.cachePrefix, fromUnix.toString(), toUnix.toString()))
        if (raw) {
          const ts = Number(raw)
          if (Number.isFinite(ts)) {
            setLastManualAt(ts)
            const remaining = Math.max(0, ts + MANUAL_COOLDOWN_MS - Date.now())
            setManualCooldownMs(remaining)
          }
        }
      } catch {}
    }

    async function reload(fromUnix?: number, toUnix?: number) {
      let cacheFrom = fromUnix
      let cacheTo = toUnix

      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({ cb: String(Date.now()) })
        if (config.datesFromApi) {
          appendUrlRangeParams(params)
        } else if (Number.isFinite(fromUnix) && Number.isFinite(toUnix)) {
          params.set("from", String(fromUnix))
          params.set("to", String(toUnix))
        } else {
          throw new Error("from and to are required")
        }

        const response = await fetch(`${config.apiPath}?${params}`, {
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

        const apiRange = (data as { range?: { startAt: string; endAt: string; fromUnix: number; toUnix: number; endTimeMs: number } })
          .range
        if (config.datesFromApi && apiRange) {
          setRange({
            startAt: apiRange.startAt,
            endAt: apiRange.endAt,
            fromUnix: apiRange.fromUnix,
            toUnix: apiRange.toUnix,
          })
          setEndTimeMs(apiRange.endTimeMs ?? apiRange.toUnix * 1000)
          cacheFrom = apiRange.fromUnix
          cacheTo = apiRange.toUnix
          restoreManualCooldown(apiRange.fromUnix, apiRange.toUnix)
        }

        const sourceArray = Array.isArray(data)
          ? data
          : Array.isArray((data as { leaderboard?: unknown }).leaderboard)
            ? (data as { leaderboard: unknown[] }).leaderboard
            : []

        const base: LeaderboardEntry[] = sourceArray.map((entry: Record<string, unknown>, index: number) => ({
          id: String(entry.id ?? entry.user_id ?? `${index + 1}`),
          username: String(entry.username ?? entry.user_name ?? entry.name ?? `Player${index + 1}`),
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
        const ranked: LeaderboardEntry[] = sorted.map((item, idx) => ({
          ...item,
          rank: idx + 1,
          prize: prizeForRank(config.prizeMap, idx + 1),
        }))

        const padded: LeaderboardEntry[] = [...ranked]
        for (let i = padded.length + 1; i <= 20; i++) {
          padded.push({
            id: `placeholder-${i}`,
            username: "Awaiting player",
            wagered: 0,
            prize: prizeForRank(config.prizeMap, i),
            rank: i,
          })
        }

        setLeaderboardData(padded.slice(0, 20))
        if (Number.isFinite(cacheFrom) && Number.isFinite(cacheTo)) {
          saveCache(config.cachePrefix, cacheFrom!.toString(), cacheTo!.toString(), padded.slice(0, 10))
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err)
        setError("Failed to load leaderboard data")
        try {
          if (Number.isFinite(cacheFrom) && Number.isFinite(cacheTo)) {
            const cached = readCache(config.cachePrefix, cacheFrom!.toString(), cacheTo!.toString())
            if (cached && cached.data.length > 0) {
              setLeaderboardData(cached.data)
            } else {
              setLeaderboardData(createPlaceholders())
            }
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
      setLeaderboardData(createPlaceholders())

      if (config.datesFromApi) {
        reload()
        const refreshInterval = setInterval(() => reload(), 900000)
        return () => clearInterval(refreshInterval)
      }

      const { startAt, endAt, endTimeMs: etm, fromUnix, toUnix } = computeActiveRange()
      setRange({ startAt, endAt, fromUnix, toUnix })
      setEndTimeMs(etm ?? 0)

      if (!Number.isFinite(fromUnix) || !Number.isFinite(toUnix)) {
        return
      }

      restoreManualCooldown(fromUnix, toUnix)
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
      if (!config.datesFromApi && (!Number.isFinite(range.fromUnix) || !Number.isFinite(range.toUnix))) return
      const now = Date.now()
      const nextAllowed = lastManualAt + MANUAL_COOLDOWN_MS
      if (now < nextAllowed) return
      setLastManualAt(now)
      setManualCooldownMs(MANUAL_COOLDOWN_MS)
      const cacheFrom = range.fromUnix
      const cacheTo = range.toUnix
      if (typeof cacheFrom === "number" && typeof cacheTo === "number") {
        try {
          localStorage.setItem(
            makeManualKey(config.cachePrefix, cacheFrom.toString(), cacheTo.toString()),
            String(now)
          )
        } catch {}
      }
      if (config.datesFromApi) {
        reload()
      } else if (typeof cacheFrom === "number" && typeof cacheTo === "number") {
        reload(cacheFrom, cacheTo)
      }
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
      fallbackPodiumPrizes: {
        first: prizeForRank(config.prizeMap, 1),
        second: prizeForRank(config.prizeMap, 2),
        third: prizeForRank(config.prizeMap, 3),
      },
    }
  }
}
