"use client"

import { Sparkles, Gamepad2, Twitch, Cloud } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import SlotStreamerLeaderboard from "@/components/slot-streamer-leaderboard"

export default function GamerPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const floatingParticles = mounted
    ? [...Array(40)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${15 + Math.random() * 10}s`,
        size: 12 + Math.random() * 20,
      }))
    : []

  const hearts = mounted
    ? [...Array(15)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 4}s`,
        duration: `${12 + Math.random() * 8}s`,
        size: 10 + Math.random() * 16,
      }))
    : []

  const stars = mounted
    ? [...Array(20)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 6}s`,
        duration: `${10 + Math.random() * 12}s`,
        size: 8 + Math.random() * 18,
      }))
    : []

  const bubbles = mounted
    ? [...Array(20)].map(() => ({
        left: `${Math.random() * 100}%`,
        size: 30 + Math.random() * 60,
        delay: `${Math.random() * 8}s`,
        duration: `${12 + Math.random() * 8}s`,
      }))
    : []

  const twinkles = mounted
    ? [...Array(30)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
      }))
    : []

  const clouds = mounted
    ? [...Array(8)].map(() => ({
        top: `${5 + Math.random() * 40}%`,
        delay: `${Math.random() * 10}s`,
        duration: `${30 + Math.random() * 20}s`,
        size: 80 + Math.random() * 120,
        opacity: 0.3 + Math.random() * 0.3,
      }))
    : []

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-pink-100 via-blue-100 to-pink-50 flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Clouds */}
        {clouds.map((cloud, i) => (
          <div
            key={`cloud-${i}`}
            className="absolute animate-cloud"
            style={{
              top: cloud.top,
              left: "-200px",
              animationDelay: cloud.delay,
              animationDuration: cloud.duration,
              opacity: cloud.opacity,
            }}
          >
            <Cloud
              className="text-white drop-shadow-lg"
              style={{ width: cloud.size, height: cloud.size }}
              fill="white"
              strokeWidth={0.5}
            />
          </div>
        ))}

        {/* Floating Particles */}
        {floatingParticles.map((particle, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          >
            <Sparkles className="text-pink-400/50" size={particle.size} />
          </div>
        ))}

        {hearts.map((heart, i) => (
          <div
            key={`heart-${i}`}
            className="absolute animate-float"
            style={{
              left: heart.left,
              top: heart.top,
              animationDelay: heart.delay,
              animationDuration: heart.duration,
            }}
          >
            <div className="text-pink-500/40" style={{ width: heart.size, height: heart.size }}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        ))}

        {stars.map((star, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-float"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          >
            <div className="text-pink-300/40" style={{ width: star.size, height: star.size }}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        ))}

        {bubbles.map((bubble, i) => (
          <div
            key={`bubble-${i}`}
            className="absolute rounded-full animate-bubble"
            style={{
              left: bubble.left,
              bottom: "-100px",
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              background:
                i % 2 === 0
                  ? `radial-gradient(circle at 30% 30%, rgba(244, 114, 182, 0.4), rgba(244, 114, 182, 0.1))`
                  : `radial-gradient(circle at 30% 30%, rgba(147, 197, 253, 0.4), rgba(191, 219, 254, 0.2))`,
              animationDelay: bubble.delay,
              animationDuration: bubble.duration,
            }}
          />
        ))}

        {/* Animated Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-80 h-80 bg-pink-200/25 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-fuchsia-200/25 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "6s" }}
        />

        {twinkles.map((dot, i) => (
          <div
            key={`dot-${i}`}
            className="absolute w-1 h-1 bg-pink-400 rounded-full animate-twinkle"
            style={{
              left: dot.left,
              top: dot.top,
              animationDelay: dot.delay,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1">
        {/* Header */}
        <div className="text-center pt-12 pb-8 px-4 animate-fade-in">
          <div className="flex justify-center mb-4">
            <Image 
              src="/images/dIXIE.png" 
              alt="Diamond Dixie" 
              width={600} 
              height={180} 
              className="drop-shadow-lg"
              priority
            />
          </div>
        </div>

        {/* Leaderboard Component */}
        <div className="animate-slide-up w-full max-w-6xl mx-auto px-4 mb-16">
          <div className="bg-pink-600/80 backdrop-blur-md rounded-3xl border-2 border-pink-300/30 shadow-2xl p-6 md:p-8 overflow-visible">
            <SlotStreamerLeaderboard />
          </div>
        </div>
      </div>

      <footer className="relative z-10 mt-auto w-full">
        <div className="bg-pink-600/80 backdrop-blur-md border-t-2 border-pink-300/30 shadow-2xl py-4 px-4">
          <div className="max-w-6xl mx-auto flex flex-row items-center justify-center gap-4 md:gap-12">
            {/* Twitch Section */}
            <a
              href="https://twitch.tv/diamonddixie_slots"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 bg-white/70 backdrop-blur-sm border-2 border-white/80 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 hover:bg-pink-100"
            >
              <Twitch className="text-pink-500" size={32} />
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
