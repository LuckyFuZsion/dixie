import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { buildLeaderboardSocialMetadata } from "@/lib/leaderboard-metadata"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dixie-leaderboard.vercel.app"

export const dynamic = "force-dynamic"

export const viewport: Viewport = {
  themeColor: "#000000",
}

export async function generateMetadata(): Promise<Metadata> {
  const social = buildLeaderboardSocialMetadata("bombastic")

  return {
    metadataBase: new URL(siteUrl),
    ...social,
    keywords: [
      "Bombastic",
      "Streaming Shack",
      "Diamond Dixie",
      "leaderboard",
      "3K Wager Race",
      "wager race",
      "prizes",
      "Twitch",
      "gaming",
      "slots",
    ],
    authors: [{ name: "Streaming Shack" }, { name: "Diamond Dixie" }],
    openGraph: {
      ...social.openGraph,
      siteName: "Streaming Shack and Diamond Dixie",
    },
    manifest: "/favicon_io/site.webmanifest",
    icons: {
      icon: [
        {
          url: "/favicon_io/favicon.ico",
          type: "image/x-icon",
        },
        {
          url: "/favicon_io/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
        },
        {
          url: "/favicon_io/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/favicon_io/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/favicon_io/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      shortcut: "/favicon_io/favicon.ico",
      apple: [
        {
          url: "/favicon_io/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
