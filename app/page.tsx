"use client"

import { Gamepad2 } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import SlotStreamerLeaderboard from "@/components/slot-streamer-leaderboard"
import FuturisticBackground from "@/components/futuristic-background"

export default function GamerPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Futuristic Animated Background */}
      <FuturisticBackground />
      
      {/* Subtle gradient orbs - dark masculine colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-80 h-80 bg-red-600/10 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-orange-700/10 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "6s" }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1">
        {/* Header */}
        <div className="text-center pt-12 pb-8 px-4 animate-fade-in">
          <div className="flex justify-center mb-4">
            <Image 
              src="/images/Streaming Shack.avif" 
              alt="Streaming Shack" 
              width={300} 
              height={90} 
              className="drop-shadow-lg"
              priority
            />
          </div>
        </div>

        {/* Leaderboard Component */}
        <div className="animate-slide-up w-full max-w-6xl mx-auto px-4 mb-16">
          <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl border-2 border-slate-600/50 shadow-2xl p-6 md:p-8 overflow-visible">
            <SlotStreamerLeaderboard />
          </div>
        </div>
      </div>

      <footer className="relative z-10 mt-auto w-full">
        <div className="bg-slate-800/90 backdrop-blur-md border-t-2 border-slate-600/50 shadow-2xl py-4 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12">
            {/* Streaming Shack Logo */}
            <a
              href="https://streamingshack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-400 transition-colors duration-300 font-black tracking-widest text-xl md:text-2xl uppercase"
              style={{ 
                fontFamily: 'var(--font-future)',
                textShadow: '0 0 10px rgba(251, 146, 60, 0.5), 0 0 20px rgba(251, 146, 60, 0.3), 2px 2px 4px rgba(0,0,0,0.5)',
                letterSpacing: '0.2em'
              }}
            >
              STREAMINGSHACK.COM
            </a>

            {/* BitFortune Section */}
            <a 
              href="https://affiliates.bitfortune.com/workspaces/api/tracking-links/record?trackingLinkId=11&affiliateId=271" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-100 transition-opacity"
            >
              <Image 
                src="/images/bitfortune-logo.svg" 
                alt="BitFortune" 
                width={260} 
                height={37} 
                className="opacity-90" 
              />
            </a>

            {/* WebFuzsion Section */}
            <a
              href="https://webfuzsion.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image 
                src="/webfuzsion-logo.png" 
                alt="WebFuzsion" 
                width={200} 
                height={60} 
                className="opacity-90" 
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
