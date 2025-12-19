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

export default function FuturisticBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

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
      // Clear with dark background (more transparent to show through)
      ctx.fillStyle = "rgba(15, 23, 42, 0.05)"
      ctx.fillRect(0, 0, width, height)

      // Draw connecting lines between nearby particles - make more visible
      ctx.strokeStyle = "rgba(251, 146, 60, 0.3)"
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

        // Masculine colors - orange, amber, red shades
        const masculineShades = [
          "#F97316", // Orange
          "#FB923C", // Orange-400
          "#F59E0B", // Amber
          "#EF4444", // Red
          "#EA580C", // Orange-600
          "#DC2626", // Red-600
        ]
        const masculineColor = masculineShades[Math.floor((particle.x + particle.y + t * 0.1) % masculineShades.length)]

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
  }, [])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
