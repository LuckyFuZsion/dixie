"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseAlpha: number
  color: string
}

export default function FuturisticBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

    const palette = [
      "#22d3ee",
      "#a78bfa",
      "#f472b6",
      "#f59e0b",
      "#34d399",
    ]

    let particles: Particle[] = []
    let width = 0
    let height = 0

    const resize = () => {
      width = Math.floor(window.innerWidth)
      height = Math.floor(window.innerHeight)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.min(220, Math.max(90, Math.floor((width * height) / 28000)))
      particles = new Array(count).fill(0).map(() => {
        const speed = 0.2 + Math.random() * 0.6
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() * 2 - 1) * speed,
          vy: (Math.random() * 2 - 1) * speed,
          size: 0.8 + Math.random() * 2.2,
          baseAlpha: 0.25 + Math.random() * 0.35,
          color: palette[Math.floor(Math.random() * palette.length)],
        } as Particle
      })
    }

    const draw = (t: number) => {
      ctx.fillStyle = "rgba(10, 12, 26, 0.20)"
      ctx.fillRect(0, 0, width, height)

      const gridSpacing = 64
      ctx.save()
      ctx.globalAlpha = 0.035
      ctx.strokeStyle = "#22d3ee"
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = (t * 0.0006) % gridSpacing; x < width; x += gridSpacing) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      for (let y = (t * 0.0004) % gridSpacing; y < height; y += gridSpacing) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()
      ctx.restore()

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20

        const pulse = (Math.sin((t * 0.002) + p.x * 0.01 + p.y * 0.01) + 1) * 0.5
        const alpha = p.baseAlpha * (0.65 + 0.35 * pulse)

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.shadowColor = p.color
        ctx.shadowBlur = 14
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size + pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      ctx.save()
      ctx.lineWidth = 1
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist2 = dx * dx + dy * dy
          if (dist2 < 130 * 130) {
            const alpha = 0.08 * (1 - Math.sqrt(dist2) / 130)
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha.toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      ctx.restore()
    }

    const loop = (t: number) => {
      draw(t)
      rafRef.current = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener("resize", resize)
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener("resize", resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(56,189,248,.10),rgba(168,85,247,.06)_40%,rgba(0,0,0,0)_70%)]" />
    </div>
  )
} 