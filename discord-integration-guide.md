# Discord Leaderboard Integration Guide

Follow these steps to add the "Push to Discord" functionality to your leaderboard project.

## 1. Environment Variable
Add the Discord Webhook URL to your `.env.local` file.

```bash
# .env.local
DISCORD_WEBHOOK_URL=https://discordapp.com/api/webhooks/YOUR_WEBHOOK_URL_HERE
```

## 2. Create the API Route
Create a new file at `app/api/admin/discord/route.ts`. This handles the server-side logic of fetching the leaderboard, masking usernames, and sending the data to Discord.

```typescript
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
    const snapshotResponse = await fetch(`${baseUrl}/api/admin/snapshot`, {
      headers: { Cookie: `admin-auth=authenticated` }
    })
    
    if (!snapshotResponse.ok) {
      throw new Error("Failed to fetch leaderboard snapshot")
    }

    const data = await snapshotResponse.json()
    const { leaderboard, dateRange } = data

    // 3. Format the Discord Message
    let discordMessage = `🏆 **Leaderboard Update** 🏆\n\n`
    discordMessage += `📅 **Period:** ${dateRange.start} → ${dateRange.end}\n\n`
    discordMessage += `**Current Standings:**\n\n`
    
    leaderboard.slice(0, 20).forEach((player: any) => {
      const medal = player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : ""
      const rankStr = medal ? `${medal} **${player.rank}.**` : `${player.rank}.`
      
      if (player.username === "Awaiting player" || player.wagered === 0) {
        discordMessage += `${rankStr} *Awaiting player*\n`
      } else {
        // Wrap masked username in backticks to prevent Discord markdown issues
        const masked = maskUsername(player.username)
        const wagered = player.wagered.toLocaleString(undefined, { minimumFractionDigits: 2 })
        discordMessage += `${rankStr} \`${masked}\` - $${wagered} | Prize: **$${player.prize}**\n`
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
```

## 3. Add Button to Admin Dashboard
In `app/admin/page.tsx`, add the state and the function to handle the click.

### Add States:
```typescript
const [discordLoading, setDiscordLoading] = useState(false)
const [discordSuccess, setDiscordSuccess] = useState(false)
```

### Add Handler Function:
```typescript
const handlePushToDiscord = async () => {
  setDiscordLoading(true)
  setDiscordSuccess(false)
  try {
    const response = await fetch("/api/admin/discord", { method: "POST" })
    if (!response.ok) throw new Error("Failed to send")
    setDiscordSuccess(true)
    setTimeout(() => setDiscordSuccess(false), 3000)
  } catch (err) {
    alert("Error sending to Discord")
  } finally {
    setDiscordLoading(false)
  }
}
```

### Add the Button to your JSX:
```tsx
<button
  onClick={handlePushToDiscord}
  disabled={discordLoading}
  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
>
  {discordLoading ? "Sending..." : discordSuccess ? "✓ Sent to Discord!" : "💬 Push to Discord"}
</button>
```

