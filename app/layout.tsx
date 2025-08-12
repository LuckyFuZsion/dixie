import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Orbitron } from "next/font/google"
import "./globals.css"
import FuturisticBackground from "@/components/futuristic-background"

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-future",
  weight: ["400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "The Dailey Depo - Rainbet Leaderboard",
  description: "Rainbet leaderboard for The Dailey Depo.",
  generator: "v0.app",
  metadataBase: new URL("https://tdd-leaderboard.vercel.app"),
  openGraph: {
    url: "https://tdd-leaderboard.vercel.app/",
    type: "website",
    title: "The Dailey Depo - Rainbet Leaderboard",
    description: "Rainbet leaderboard for The Dailey Depo.",
    images: [
      {
        url: "https://opengraph.b-cdn.net/production/images/2598b31d-905a-40e5-9a68-27a8ccf0d8d7.png?token=xY2oxYDHZ0KXkn2X6M9TMOGEl62Dhs4JxrhZbI2gi_c&height=471&width=900&expires=33291038084",
        width: 900,
        height: 471,
        alt: "The Dailey Depo - Rainbet Leaderboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@tdd-leaderboard",
    title: "The Dailey Depo - Rainbet Leaderboard",
    description: "Rainbet leaderboard for The Dailey Depo.",
    images: [
      "https://opengraph.b-cdn.net/production/images/2598b31d-905a-40e5-9a68-27a8ccf0d8d7.png?token=xY2oxYDHZ0KXkn2X6M9TMOGEl62Dhs4JxrhZbI2gi_c&height=471&width=900&expires=33291038084",
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${orbitron.variable}`}>
      <head>
        <style>{`
html {
  font-family: ${orbitron.style.fontFamily}, ${GeistSans.style.fontFamily}, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
  --font-future: ${orbitron.variable};
}
        `}</style>
      </head>
      <body className="bg-[#090b17] text-white">
        <FuturisticBackground />
        {children}
      </body>
    </html>
  )
}
