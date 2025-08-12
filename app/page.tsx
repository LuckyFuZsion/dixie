import SlotStreamerLeaderboard from "@/components/slot-streamer-leaderboard"
import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1">
        <SlotStreamerLeaderboard />
      </div>
      <footer className="bg-slate-950/95 border-t border-white/10 py-4">
        <div className="container mx-auto px-4 flex flex-wrap justify-center items-center gap-6">
          <a href="https://rainbet.com/?r=tdd" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition">
            <Image src="/images/rainbet-logo.png" alt="Rainbet" width={120} height={48} />
          </a>
          <a href="https://kick.com/TheDaileyDepo" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition">
            <Image
              src="https://res.cloudinary.com/dce7ur4k0/image/upload/v1755034500/Kick-Logo-500x281_rqscae.png"
              alt="Kick"
              width={110}
              height={60}
              priority={false}
            />
          </a>
          <a href="https://webfuzsion.co.uk" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition">
            <Image
              src="https://res.cloudinary.com/dce7ur4k0/image/upload/v1755034046/WebFuZsion_4_vwxd5f.png"
              alt="WebFuZsion"
              width={140}
              height={40}
              priority
            />
          </a>
          <a href="https://discord.gg/KnnWbFkS" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 text-slate-100 border border-slate-600/50 hover:bg-slate-700 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-indigo-300">
              <path d="M20.317 4.369A19.791 19.791 0 0 0 16.558 3c-.2.36-.43.85-.59 1.23a18.27 18.27 0 0 0-7.937 0A8.258 8.258 0 0 0 7.44 3 19.736 19.736 0 0 0 3.68 4.369C1.275 8.102.64 11.726.915 15.31a19.93 19.93 0 0 0 6.087 2.992c.467-.64.883-1.316 1.239-2.02a12.81 12.81 0 0 1-1.955-.747c.165-.12.327-.246.483-.374a13.91 13.91 0 0 0 10.422 0c.158.13.32.255.483.374-.623.308-1.277.559-1.955.747.356.704.772 1.38 1.239 2.02a19.93 19.93 0 0 0 6.087-2.993c.368-4.61-.63-8.213-2.833-10.94ZM8.727 13.873c-1.04 0-1.894-.95-1.894-2.117 0-1.166.84-2.124 1.894-2.124 1.06 0 1.9.958 1.894 2.124 0 1.167-.834 2.117-1.894 2.117Zm6.546 0c-1.04 0-1.894-.95-1.894-2.117 0-1.166.84-2.124 1.894-2.124 1.06 0 1.9.958 1.894 2.124 0 1.167-.834 2.117-1.894 2.117Z"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-future)' }}>Join Discord</span>
          </a>
        </div>
      </footer>
    </main>
  )
}
