import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Orbitron } from 'next/font/google'
import './globals.css'
import FuturisticBackground from '@/components/futuristic-background'

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-future', weight: ['400','500','600','700','800','900'] })

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
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
