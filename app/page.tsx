"use client"

import Image from "next/image"
import FuturisticBackground from "@/components/futuristic-background"
import SlotStreamerLeaderboard from "@/components/slot-streamer-leaderboard"

export default function GamerPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
      <FuturisticBackground />
      <div className="relative z-10 flex-1">
        <div className="flex justify-center px-4 pt-8 pb-6 md:pt-10 md:pb-8">
          <div
            className="w-full max-w-full md:w-1/2"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 118% 112% at 50% 50%, #000 48%, transparent 92%)",
              maskImage:
                "radial-gradient(ellipse 118% 112% at 50% 50%, #000 48%, transparent 92%)",
              filter:
                "drop-shadow(0 0 14px rgba(251, 146, 60, 0.55)) drop-shadow(0 0 32px rgba(249, 115, 22, 0.35)) drop-shadow(0 0 56px rgba(234, 88, 12, 0.2))",
            }}
          >
            <Image
              src="/streamingshack-hero-banner.png"
              alt="Streaming Shack — Play. Win. Stream. Repeat."
              width={1200}
              height={400}
              className="h-auto w-full object-contain object-center"
              priority
              sizes="(max-width: 767px) 100vw, 50vw"
            />
          </div>
        </div>

        <div className="animate-slide-up w-full max-w-6xl mx-auto px-4 mb-16">
          <div className="bg-black border border-zinc-800/90 rounded-3xl shadow-2xl shadow-black/40 p-6 md:p-8 overflow-visible">
            <SlotStreamerLeaderboard />
          </div>
        </div>
      </div>

      <footer className="relative z-10 mt-auto w-full">
        <div className="bg-black border-t border-zinc-800/90 shadow-2xl shadow-black/30 py-4 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12">
            <a
              href="https://streamingshack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-400 transition-colors duration-300 font-black tracking-widest text-xl md:text-2xl uppercase"
              style={{
                fontFamily: "var(--font-future)",
                textShadow:
                  "0 0 10px rgba(251, 146, 60, 0.5), 0 0 20px rgba(251, 146, 60, 0.3), 2px 2px 4px rgba(0,0,0,0.5)",
                letterSpacing: "0.2em",
              }}
            >
              STREAMINGSHACK.COM
            </a>

            <a
              href="https://affiliates.bitfortune.com/workspaces/api/tracking-links/record?trackingLinkId=11&affiliateId=271"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100 transition-opacity"
            >
              <Image
                src="/bombastic-logo.png"
                alt="Bombastic"
                width={260}
                height={52}
                className="opacity-90"
              />
            </a>

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
