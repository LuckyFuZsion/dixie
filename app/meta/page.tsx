"use client"

import Image from "next/image"
import FuturisticBackground from "@/components/futuristic-background"
import MetaLeaderboard from "@/components/meta-leaderboard"

export default function MetaPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(120,255,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(120,255,0,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <FuturisticBackground variant="meta" />

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
                "drop-shadow(0 0 14px rgba(120, 255, 0, 0.55)) drop-shadow(0 0 32px rgba(120, 255, 0, 0.35)) drop-shadow(0 0 56px rgba(77, 184, 0, 0.2))",
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
          <a
            href="https://metaspins.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block"
          >
            <div className="absolute -inset-6 rounded-full bg-[#78FF00]/10 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity" />
            <Image
              src="/metaspins.png"
              alt="Metaspins"
              width={420}
              height={105}
              className="relative h-auto w-[min(85vw,420px)] object-contain drop-shadow-[0_0_40px_rgba(120,255,0,0.45)]"
            />
          </a>
        </div>

        <div className="animate-slide-up w-full max-w-6xl mx-auto px-4 mb-16">
          <div className="relative overflow-visible rounded-[2rem] border border-[#78FF00]/30 bg-[#030503]/95 p-6 md:p-8 shadow-[0_0_60px_rgba(120,255,0,0.08)]">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#78FF00]/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[#78FF00]/40 to-transparent" />
            <div className="pointer-events-none absolute left-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#78FF00]/30 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#78FF00]/30 to-transparent" />
            <MetaLeaderboard />
          </div>
        </div>
      </div>

      <footer className="relative z-10 mt-auto w-full">
        <div className="border-t border-[#78FF00]/20 bg-[#020402]/95 py-5 px-4 shadow-[0_-8px_40px_rgba(120,255,0,0.06)]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-5 md:gap-12">
            <a
              href="https://streamingshack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#78FF00]/80 hover:text-[#78FF00] transition-colors duration-300 font-black tracking-[0.25em] text-sm md:text-base uppercase"
              style={{ fontFamily: "var(--font-future)" }}
            >
              STREAMINGSHACK.COM
            </a>

            <a
              href="https://metaspins.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100 transition-opacity"
            >
              <Image
                src="/metaspins.png"
                alt="Metaspins"
                width={160}
                height={40}
                className="opacity-90 drop-shadow-[0_0_16px_rgba(120,255,0,0.35)]"
              />
            </a>

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
