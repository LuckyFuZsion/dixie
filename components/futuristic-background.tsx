"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseAlpha: number
  twinkleSpeed: number
  twinkleOffset: number
}

type FuturisticBackgroundProps = {
  variant?: "default" | "bitfortune" | "meta" | "daler"
}

const DALER_STREAK_COLORS = ["#A855F7", "#C084FC", "#E879F9", "#7C3AED", "#818CF8", "#F0ABFC"]

type Streak = { x: number; y: number; len: number; speed: number; color: string; alpha: number }

export default function FuturisticBackground({ variant = "default" }: FuturisticBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

    if (variant === "daler") {
      // Distinct look: slanted neon streaks falling over slowly drifting aurora glows.
      let w = 0
      let h = 0
      let streaks: Streak[] = []
      const slant = 0.35
      const newStreak = (randomY: boolean): Streak => ({
        x: Math.random() * (w + h * slant) - h * slant,
        y: randomY ? Math.random() * h : -Math.random() * 200,
        len: 40 + Math.random() * 120,
        speed: 1.2 + Math.random() * 2.6,
        color: DALER_STREAK_COLORS[Math.floor(Math.random() * DALER_STREAK_COLORS.length)],
        alpha: 0.25 + Math.random() * 0.5,
      })
      const resizeDaler = () => {
        w = Math.floor(window.innerWidth)
        h = Math.floor(window.innerHeight)
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        const count = Math.min(90, Math.max(40, Math.floor((w * h) / 20000)))
        streaks = Array.from({ length: count }, () => newStreak(true))
      }
      const glow = (cx: number, cy: number, r: number, rgb: string, a: number) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, `rgba(${rgb}, ${a})`)
        g.addColorStop(1, `rgba(${rgb}, 0)`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }
      const drawDaler = (t: number) => {
        ctx.globalAlpha = 1
        ctx.fillStyle = "rgba(6, 5, 13, 0.22)"
        ctx.fillRect(0, 0, w, h)

        const s = t * 0.00025
        glow(w * (0.25 + 0.15 * Math.sin(s)), h * (0.3 + 0.1 * Math.cos(s * 1.3)), Math.max(w, h) * 0.45, "124, 58, 237", 0.05)
        glow(w * (0.75 + 0.12 * Math.cos(s * 0.8)), h * (0.7 + 0.12 * Math.sin(s)), Math.max(w, h) * 0.4, "232, 121, 249", 0.035)

        ctx.lineCap = "round"
        ctx.lineWidth = 1.6
        for (const st of streaks) {
          st.y += st.speed
          st.x += st.speed * slant
          if (st.y - st.len > h) Object.assign(st, newStreak(false))
          const tx = st.x - st.len * slant
          const ty = st.y - st.len
          const g = ctx.createLinearGradient(tx, ty, st.x, st.y)
          g.addColorStop(0, "rgba(0,0,0,0)")
          g.addColorStop(1, st.color)
          ctx.globalAlpha = st.alpha
          ctx.strokeStyle = g
          ctx.shadowColor = st.color
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.moveTo(tx, ty)
          ctx.lineTo(st.x, st.y)
          ctx.stroke()
        }
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }
      const loopDaler = (t: number) => {
        drawDaler(t)
        rafRef.current = requestAnimationFrame(loopDaler)
      }
      resizeDaler()
      window.addEventListener("resize", resizeDaler)
      rafRef.current = requestAnimationFrame(loopDaler)
      return () => {
        window.removeEventListener("resize", resizeDaler)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }

    let particles: Particle[] = []
    let width = 0
    let height = 0
    const gridSize = 100
    const connectionDistance = 150

    const resize = () => {
      width = Math.floor(window.innerWidth)
      height = Math.floor(window.innerHeight)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Create particles for futuristic effect - more particles and more visible
      const particleCount = Math.min(150, Math.max(80, Math.floor((width * height) / 30000)))
      particles = new Array(particleCount).fill(0).map(() => {
        const speed = 0.15 + Math.random() * 0.25
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() * 2 - 1) * speed,
          vy: (Math.random() * 2 - 1) * speed,
          size: 2 + Math.random() * 3,
          baseAlpha: 0.5 + Math.random() * 0.4,
          twinkleSpeed: 0.002 + Math.random() * 0.003,
          twinkleOffset: Math.random() * Math.PI * 2,
        } as Particle
      })
    }

    const draw = (t: number) => {
      ctx.fillStyle =
        variant === "meta" ? "rgba(0, 0, 0, 0.12)" : "rgba(15, 23, 42, 0.05)"
      ctx.fillRect(0, 0, width, height)

      const lineColor =
        variant === "bitfortune"
          ? "rgba(247, 187, 38, 0.3)"
          : variant === "meta"
            ? "rgba(120, 255, 0, 0.22)"
            : "rgba(251, 146, 60, 0.3)"

      // Draw connecting lines between nearby particles - make more visible
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.3

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            const alpha = (1 - distance / connectionDistance) * 0.5
            ctx.globalAlpha = alpha
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      for (const particle of particles) {
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around edges
        if (particle.x < -10) particle.x = width + 10
        if (particle.x > width + 10) particle.x = -10
        if (particle.y < -10) particle.y = height + 10
        if (particle.y > height + 10) particle.y = -10

        // Twinkling effect
        const twinkle = (Math.sin(t * particle.twinkleSpeed + particle.twinkleOffset) + 1) * 0.5
        const alpha = particle.baseAlpha * (0.4 + 0.6 * twinkle)
        const currentSize = particle.size * (0.8 + 0.2 * twinkle)

        ctx.save()
        ctx.globalAlpha = alpha

        const particleShades =
          variant === "bitfortune"
            ? ["#F7BB26", "#FFD666", "#E5A820", "#C8941A", "#FFF8E7", "#D4A017"]
            : variant === "meta"
              ? ["#78FF00", "#B8FF4D", "#5DFF00", "#4DB800", "#D4FF8A", "#A3FF00"]
              : ["#F97316", "#FB923C", "#F59E0B", "#EF4444", "#EA580C", "#DC2626"]
        const masculineColor = particleShades[Math.floor((particle.x + particle.y + t * 0.1) % particleShades.length)]

        // Outer glow - make brighter
        ctx.shadowColor = masculineColor
        ctx.shadowBlur = 12
        ctx.fillStyle = masculineColor
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2)
        ctx.fill()

        // Inner bright core - make more visible
        ctx.globalAlpha = Math.min(1, alpha * 1.8)
        ctx.shadowBlur = 0
        ctx.fillStyle = "#FFFFFF"
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, currentSize * 0.5, 0, Math.PI * 2)
        ctx.fill()

        // Draw geometric shape around particle (hexagon) - make more visible
        ctx.globalAlpha = alpha * 0.5
        ctx.strokeStyle = masculineColor
        ctx.lineWidth = 1.5
        const sides = 6
        const radius = currentSize * 1.5
        ctx.beginPath()
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides + t * 0.001
          const x = particle.x + radius * Math.cos(angle)
          const y = particle.y + radius * Math.sin(angle)
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()
        ctx.stroke()

        ctx.restore()
      }
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
  }, [variant])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
