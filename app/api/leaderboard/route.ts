import { NextResponse } from "next/server"

// This is where you would integrate with your actual API
export async function GET() {
  try {
    // Replace this with your actual API call
    // const response = await fetch('YOUR_API_ENDPOINT')
    // const data = await response.json()

    // Mock data for demonstration
    const mockData = [
      { id: "1", username: "SlotKing99", wagered: 25420.5, prize: 2500, rank: 1 },
      { id: "2", username: "SpinMaster", wagered: 22305.0, prize: 1500, rank: 2 },
      { id: "3", username: "LuckyStreamer", wagered: 19876.25, prize: 1000, rank: 3 },
      // Add more entries as needed
    ]

    return NextResponse.json(mockData)
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
