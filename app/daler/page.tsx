"use client"

import Image from "next/image"
import FuturisticBackground from "@/components/futuristic-background"
import DalerLeaderboard from "@/components/daler-leaderboard"

export default function DalerPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <FuturisticBackground variant="daler" />

      <div className="relative z-10 flex-1">
        <div className="flex justify-center px-4 pt-8 pb-4 md:pt-10 md:pb-6">
          <div
            className="w-full max-w-full md:w-1/2"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 118% 112% at 50% 50%, #000 48%, transparent 92%)",
              maskImage:
                "radial-gradient(ellipse 118% 112% at 50% 50%, #000 48%, transparent 92%)",
              filter:
                "drop-shadow(0 0 14px rgba(168, 85, 247, 0.5)) drop-shadow(0 0 32px rgba(168, 85, 247, 0.3)) drop-shadow(0 0 56px rgba(124, 58, 237, 0.18))",
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

        <div className="flex justify-center px-4 pb-4 md:pb-6">
          <div className="group relative block">
            <div className="absolute -inset-6 rounded-full bg-[#A855F7]/10 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity" />
            <Image
              src="/daler_300-removebg-preview.svg"
              alt="Daler"
              width={300}
              height={80}
              className="relative h-auto w-[min(70vw,300px)] object-contain drop-shadow-[0_0_36px_rgba(168,85,247,0.4)]"
              priority
            />
          </div>
        </div>

        <div className="animate-slide-up w-full max-w-6xl mx-auto px-4 mb-16">
          <div className="relative overflow-visible rounded-[2rem] border border-[#A855F7]/28 bg-[#06050d]/95 p-6 md:p-8 shadow-[0_0_60px_rgba(168,85,247,0.07)]">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#A855F7]/65 to-transparent" />
            <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[#A855F7]/35 to-transparent" />
            <div className="pointer-events-none absolute left-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#A855F7]/28 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#A855F7]/28 to-transparent" />
            <DalerLeaderboard />
          </div>
        </div>
      </div>

      <footer className="relative z-10 mt-auto w-full">
        <div className="border-t border-[#A855F7]/18 bg-[#030208]/95 py-5 px-4 shadow-[0_-8px_40px_rgba(168,85,247,0.05)]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-5 md:gap-12">
            <a
              href="https://streamingshack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A855F7]/80 hover:text-[#A855F7] transition-colors duration-300 font-black tracking-[0.25em] text-sm md:text-base uppercase"
              style={{ fontFamily: "var(--font-future)" }}
            >
              STREAMINGSHACK.COM
            </a>

            <Image
              src="/daler_300-removebg-preview.svg"
              alt="Daler"
              width={160}
              height={42}
              className="opacity-90 drop-shadow-[0_0_16px_rgba(168,85,247,0.3)]"
            />

            <a
              href="https://webfuzsion.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 hover:opacity-90 transition-opacity grayscale hover:grayscale-0"
            >
              <Image src="/webfuzsion-logo.png" alt="WebFuzsion" width={160} height={48} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
