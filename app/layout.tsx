import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DiamondDixie BitFortune - $1000 Wager Leaderboard",
  description: "Join DiamondDixie's $1000 Wager Leaderboard on BitFortune Casino. Compete for prizes up to $500. Leaderboard updates every 15 minutes. Watch live on Twitch!",
  keywords: ["DiamondDixie", "BitFortune", "leaderboard", "casino", "wager", "prizes", "Twitch", "gaming", "slots"],
  authors: [{ name: "DiamondDixie" }],
  openGraph: {
    title: "DiamondDixie BitFortune - $1000 Wager Leaderboard",
    description: "Join DiamondDixie's $1000 Wager Leaderboard on BitFortune Casino. Compete for prizes up to $500.",
    type: "website",
    siteName: "DiamondDixie BitFortune Leaderboard",
    images: [
      {
        url: "/Opengraph (1).png",
        width: 1200,
        height: 630,
        alt: "DiamondDixie BitFortune $1000 Wager Leaderboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DiamondDixie BitFortune - $1000 Wager Leaderboard",
    description: "Join DiamondDixie's $1000 Wager Leaderboard on BitFortune Casino. Compete for prizes up to $500.",
    images: ["/Opengraph (1).png"],
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
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
