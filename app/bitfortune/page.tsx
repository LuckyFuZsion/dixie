"use client"

import Image from "next/image"
import FuturisticBackground from "@/components/futuristic-background"
import BitfortuneLeaderboard from "@/components/bitfortune-leaderboard"

export default function BitfortunePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
      <FuturisticBackground variant="bitfortune" />
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
                "drop-shadow(0 0 14px rgba(247, 187, 38, 0.55)) drop-shadow(0 0 32px rgba(247, 187, 38, 0.35)) drop-shadow(0 0 56px rgba(200, 148, 26, 0.2))",
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
          <div className="bg-black border border-[#F7BB26]/25 rounded-3xl shadow-2xl shadow-[#F7BB26]/10 p-6 md:p-8 overflow-visible">
            <BitfortuneLeaderboard />
          </div>
        </div>
      </div>

      <footer className="relative z-10 mt-auto w-full">
        <div className="bg-black border-t border-[#F7BB26]/20 shadow-2xl shadow-[#F7BB26]/5 py-4 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12">
            <a
              href="https://streamingshack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F7BB26] hover:text-[#FFD666] transition-colors duration-300 font-black tracking-widest text-xl md:text-2xl uppercase"
              style={{
                fontFamily: "var(--font-future)",
                textShadow:
                  "0 0 10px rgba(247, 187, 38, 0.5), 0 0 20px rgba(247, 187, 38, 0.3), 2px 2px 4px rgba(0,0,0,0.5)",
                letterSpacing: "0.2em",
              }}
            >
              STREAMINGSHACK.COM
            </a>

            <a
              href="https://bitfortune.com/ref/sutchy"
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
