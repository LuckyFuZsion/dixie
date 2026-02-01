"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [snapshotSuccess, setSnapshotSuccess] = useState(false)
  const [discordLoading, setDiscordLoading] = useState(false)
  const [discordSuccess, setDiscordSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check")
      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    } catch {
      setIsAuthenticated(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsAuthenticated(true)
        router.refresh()
      } else {
        setError(data.error || "Invalid credentials")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      setIsAuthenticated(false)
      setUsername("")
      setPassword("")
      router.refresh()
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  const formatSnapshot = (data: any): string => {
    const { leaderboard, dateRange, prizes } = data
    
    let output = `🏆 **4k Race** 🏆\n\n`
    output += `📅 **Period:** ${dateRange.start} ${dateRange.startTime} → ${dateRange.end} ${dateRange.endTime}\n\n`
    output += `💰 **Prize Pool:**\n`
    output += `🥇 1st: $${prizes[1]}\n`
    output += `🥈 2nd: $${prizes[2]}\n`
    output += `🥉 3rd: $${prizes[3]}\n`
    output += `4th: $${prizes[4]}\n`
    output += `5th: $${prizes[5]}\n`
    output += `6th: $${prizes[6]}\n`
    output += `7th: $${prizes[7]}\n`
    output += `8th: $${prizes[8]}\n`
    output += `9th: $${prizes[9]}\n`
    output += `10th: $${prizes[10]}\n\n`
    output += `**Current Leaderboard:**\n\n`
    
    // Show top 20 or available players
    const topPlayers = leaderboard.slice(0, 20)
    
    topPlayers.forEach((player: any) => {
      const medal = player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : ""
      const rankStr = medal ? `${medal} **${player.rank}.**` : `${player.rank}.`
      const prizeStr = player.prize > 0 ? ` | Prize: **$${player.prize}**` : ""
      const wageredStr = player.wagered > 0 ? `$${player.wagered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"
      
      if (player.username === "Awaiting player" || player.wagered === 0) {
        output += `${rankStr} *Awaiting player*${prizeStr}\n`
      } else {
        output += `${rankStr} ${player.username} - ${wageredStr}${prizeStr}\n`
      }
    })
    
    output += `\n---\n`
    output += `*Updated: ${new Date().toLocaleString()}*\n`
    
    return output
  }

  const getSnapshotUrl = () => {
    // Get date parameters from current URL if present
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const from = params.get("from")
      const to = params.get("to")
      
      if (from) {
        const url = new URL("/api/admin/snapshot", window.location.origin)
        url.searchParams.set("from", from)
        if (to) {
          url.searchParams.set("to", to)
        }
        return url.toString()
      }
    }
    return "/api/admin/snapshot"
  }

  const handleCopySnapshot = async () => {
    setSnapshotLoading(true)
    setSnapshotSuccess(false)
    setError("")

    try {
      const url = getSnapshotUrl()
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch snapshot")
      }

      const data = await response.json()
      const formatted = formatSnapshot(data)

      // Copy to clipboard
      await navigator.clipboard.writeText(formatted)
      setSnapshotSuccess(true)
      setTimeout(() => setSnapshotSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to copy snapshot")
    } finally {
      setSnapshotLoading(false)
    }
  }

  const handleDownloadSnapshot = async () => {
    setSnapshotLoading(true)
    setError("")

    try {
      const snapshotUrl = getSnapshotUrl()
      const response = await fetch(snapshotUrl)
      if (!response.ok) {
        throw new Error("Failed to fetch snapshot")
      }

      const data = await response.json()
      const formatted = formatSnapshot(data)

      // Create and download file
      const blob = new Blob([formatted], { type: "text/plain" })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `leaderboard-snapshot-${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      setSnapshotSuccess(true)
      setTimeout(() => setSnapshotSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to download snapshot")
    } finally {
      setSnapshotLoading(false)
    }
  }

  const handlePushToDiscord = async () => {
    setDiscordLoading(true)
    setDiscordSuccess(false)
    setError("")
    try {
      const response = await fetch("/api/admin/discord", { method: "POST" })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send")
      }
      setDiscordSuccess(true)
      setTimeout(() => setDiscordSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Error sending to Discord")
    } finally {
      setDiscordLoading(false)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-600/50 shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-black text-white mb-6 text-center tracking-wider">
            Admin Login
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-white mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter username"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-600/50 shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black text-white tracking-wider">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-700/50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Welcome to Admin Dashboard</h2>
              <p className="text-slate-300">
                You are successfully authenticated. This is the admin area.
              </p>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Leaderboard Snapshot</h2>
              <p className="text-slate-300 mb-4">
                Take a snapshot of the current leaderboard with dates and prizes. Perfect for sharing in Discord or elsewhere.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopySnapshot}
                  disabled={snapshotLoading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {snapshotLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Loading...</span>
                    </>
                  ) : snapshotSuccess ? (
                    <>
                      <span>✓</span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleDownloadSnapshot}
                  disabled={snapshotLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {snapshotLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Download as File</span>
                    </>
                  )}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="bg-slate-700/50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Discord Integration</h2>
              <p className="text-slate-300 mb-4">
                Push the current leaderboard directly to Discord. Usernames will be masked for privacy.
              </p>
              
              <button
                onClick={handlePushToDiscord}
                disabled={discordLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {discordLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Sending...</span>
                  </>
                ) : discordSuccess ? (
                  <>
                    <span>✓</span>
                    <span>Sent to Discord!</span>
                  </>
                ) : (
                  <>
                    <span>💬</span>
                    <span>Push to Discord</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

