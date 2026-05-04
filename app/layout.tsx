import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const SITE_TITLE = "Streaming Shack and Diamond Dixie 3K Wager Race"
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dixie-leaderboard.vercel.app"

export const viewport: Viewport = {
  themeColor: "#000000",
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: SITE_TITLE,
  description:
    "Streaming Shack and Diamond Dixie 3K Wager Race leaderboard: $3,000 prize pool, 4 winners. Leaderboard updates every 15 minutes. Watch live on Twitch!",
  keywords: [
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
    title: SITE_TITLE,
    description:
      "Streaming Shack and Diamond Dixie 3K Wager Race: climb the leaderboard for a share of $3,000. Updates every 15 minutes.",
    type: "website",
    siteName: "Streaming Shack and Diamond Dixie",
    images: [
      {
        url: "/og-image.png",
        alt: "Streaming Shack and Diamond Dixie 3K Wager Race — 3K wager race promotional banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description:
      "Streaming Shack and Diamond Dixie 3K Wager Race: climb the leaderboard for a share of $3,000. Updates every 15 minutes.",
    images: ["/og-image.png"],
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
