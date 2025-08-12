"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface LeaderboardEntry {
  id: string
  username: string
  wagered: number
  prize: number
  rank: number
}

const mockLeaderboardData: LeaderboardEntry[] = [
  { id: "1", username: "DA***KE", wagered: 10586.0, prize: 200, rank: 1 },
  { id: "2", username: "Po***es", wagered: 22205.0, prize: 300, rank: 2 },
  { id: "3", username: "We***07", wagered: 9178.0, prize: 100, rank: 3 },
]

export default function SlotStreamerLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState({
    days: 19,
    hours: 3,
    minutes: 19,
    seconds: 42,
  })

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("https://services.rainbet.com/v1/external/affiliates", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()

        // Note: You may need to adjust this based on the actual API response structure
        const transformedData =
          data.leaderboard?.map((entry: any, index: number) => ({
            id: entry.id || `${index + 1}`,
            username: entry.username || entry.name || `Player${index + 1}`,
            wagered: entry.wagered || entry.totalWagered || 0,
            prize: entry.prize || entry.reward || 0,
            rank: index + 1,
          })) || []

        setLeaderboardData(transformedData.slice(0, 3)) // Only show top 3
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error)
        setError("Failed to load leaderboard data")
        setLeaderboardData(mockLeaderboardData)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 900000) // Refresh every 15 minutes (900000ms)

    return () => clearInterval(interval)
  }, [])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at center, #1e3a8a 0%, #1e1b4b 50%, #0f0f23 100%)",
      }}
    >
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large blue light effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Smaller accent lights */}
        <div
          className="absolute top-32 right-20 w-32 h-32 bg-cyan-400/30 rounded-full blur-2xl animate-bounce"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute bottom-32 left-20 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl animate-bounce"
          style={{ animationDuration: "4s", animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <Image src="/images/rainbet-logo.png" alt="Rainbet" width={300} height={120} className="opacity-90" />
          </div>

          <h1 className="text-5xl font-black text-white mb-4 tracking-wide">$600 MONTHLY CODE TDD LEADERBOARD!</h1>

          <p className="text-white/80 text-lg mb-2">
            Every <span className="font-bold">BET</span> on Rainbet under Code{" "}
            <span className="font-bold text-cyan-400">TDD</span> counts towards your score.
          </p>
          <p className="text-white/60 text-base mb-8 italic">The leaderboard updates every 15 minutes.</p>

          <div className="border-2 border-red-500 bg-red-500/10 backdrop-blur-sm text-red-400 px-8 py-4 rounded-lg inline-block mb-8 font-bold text-lg">
            Every Bet Counts!
          </div>

          <div className="flex justify-center gap-6 mb-12">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-orange-500/25">
              📋 RULES
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25">
              📊 PREVIOUS LEADERBOARD
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center text-white text-xl mb-8">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mr-3"></div>
            Loading leaderboard...
          </div>
        )}

        {error && (
          <div className="text-center text-red-400 text-lg mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
            {error}
          </div>
        )}

        <div className="flex justify-center items-center gap-8 mb-16">
          {leaderboardData.map((player, index) => (
            <div key={player.id} className="relative group">
              {/* Golden/Rainbow border effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>

              {/* Card content */}
              <div className="relative bg-gradient-to-br from-blue-800/90 to-blue-900/90 backdrop-blur-sm rounded-2xl p-8 w-80 h-64 flex flex-col items-center justify-center text-center border border-blue-600/30">
                {/* Rainbet R logo */}
                <div className="text-white text-6xl font-bold mb-4 opacity-90" style={{ fontFamily: "serif" }}>
                  R
                </div>

                {/* Username */}
                <div className="text-white text-2xl font-bold mb-6">{player.username}</div>

                {/* Wagered amount */}
                <div className="text-white/70 text-sm mb-2">Wagered:</div>
                <div className="text-white text-xl font-bold mb-4">${player.wagered.toLocaleString()}</div>

                {/* Prize amount */}
                <div className="text-cyan-400 text-3xl font-black">${player.prize}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="text-white text-2xl mb-4">ENDING IN</div>
          <div className="text-cyan-400 text-6xl font-black tracking-wider">
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </div>
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
