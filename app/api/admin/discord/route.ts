import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Helper to mask usernames: "Username" -> `US****me` (maintains original length)
const maskUsername = (username: string): string => {
  if (username === "Awaiting player" || username.length <= 4) {
    return username
  }
  const originalLength = username.length
  const firstTwo = username.slice(0, 2).toUpperCase()
  const lastTwo = username.slice(-2)
  const asterisks = "*".repeat(Math.max(0, originalLength - 4))
  return `${firstTwo}${asterisks}${lastTwo}`
}

export async function POST(request: Request) {
  try {
    // 1. Check Authentication (Matches your existing admin auth)
    const cookieStore = await cookies()
    const authCookie = cookieStore.get("admin-auth")
    if (authCookie?.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Fetch Leaderboard Data
    // We call the existing snapshot API to get the current data
    const reqUrl = new URL(request.url)
    const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`
    // Forward the auth cookie to the internal API call
    const cookieValue = authCookie.value
    const snapshotResponse = await fetch(`${baseUrl}/api/admin/snapshot`, {
      headers: { Cookie: `admin-auth=${cookieValue}` }
    })
    
    if (!snapshotResponse.ok) {
      throw new Error("Failed to fetch leaderboard snapshot")
    }

    const data = await snapshotResponse.json()
    const { leaderboard, dateRange, prizes } = data

    // 3. Format the Discord Message
    let discordMessage = `🏆 **4k Race** 🏆\n\n`
    discordMessage += `📅 **Period:** ${dateRange.start} ${dateRange.startTime} → ${dateRange.end} ${dateRange.endTime}\n\n`
    discordMessage += `💰 **Prize Pool:**\n`
    discordMessage += `🥇 1st: $${prizes[1]}\n`
    discordMessage += `🥈 2nd: $${prizes[2]}\n`
    discordMessage += `🥉 3rd: $${prizes[3]}\n`
    discordMessage += `4th: $${prizes[4]}\n`
    discordMessage += `5th: $${prizes[5]}\n`
    discordMessage += `6th: $${prizes[6]}\n`
    discordMessage += `7th: $${prizes[7]}\n`
    discordMessage += `8th: $${prizes[8]}\n`
    discordMessage += `9th: $${prizes[9]}\n`
    discordMessage += `10th: $${prizes[10]}\n\n`
    discordMessage += `**Current Standings:**\n\n`
    
    leaderboard.slice(0, 20).forEach((player: any) => {
      const medal = player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : ""
      const rankStr = medal ? `${medal} **${player.rank}.**` : `${player.rank}.`
      
      if (player.username === "Awaiting player" || player.wagered === 0) {
        discordMessage += `${rankStr} *Awaiting player*${player.prize > 0 ? ` | Prize: **$${player.prize}**` : ""}\n`
      } else {
        // Wrap masked username in backticks to prevent Discord markdown issues
        const masked = maskUsername(player.username)
        const wagered = player.wagered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        discordMessage += `${rankStr} \`${masked}\` - $${wagered}${player.prize > 0 ? ` | Prize: **$${player.prize}**` : ""}\n`
      }
    })
    
    discordMessage += `\n---\n*Updated: ${new Date().toLocaleString()}*`

    // 4. Send to Webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: "Discord webhook URL not configured" }, { status: 500 })
    }
    
    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: discordMessage }),
    })

    if (!discordResponse.ok) {
      throw new Error("Discord API returned an error")
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Discord Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

