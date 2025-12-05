"use client"

import { useEffect, useRef } from "react"

interface Sparkle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseAlpha: number
  twinkleSpeed: number
  twinkleOffset: number
}

interface CloudBubble {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseAlpha: number
  driftSpeed: number
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

    let sparkles: Sparkle[] = []
    let clouds: CloudBubble[] = []
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

      // Create pink sparkles
      const sparkleCount = Math.min(150, Math.max(60, Math.floor((width * height) / 35000)))
      sparkles = new Array(sparkleCount).fill(0).map(() => {
        const speed = 0.3 + Math.random() * 0.5
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() * 2 - 1) * speed,
          vy: (Math.random() * 2 - 1) * speed,
          size: 1 + Math.random() * 2.5,
          baseAlpha: 0.4 + Math.random() * 0.5,
          twinkleSpeed: 0.003 + Math.random() * 0.004,
          twinkleOffset: Math.random() * Math.PI * 2,
        } as Sparkle
      })

      // Create clouds/bubbles
      const cloudCount = Math.min(25, Math.max(10, Math.floor((width * height) / 80000)))
      clouds = new Array(cloudCount).fill(0).map(() => {
        const speed = 0.1 + Math.random() * 0.2
        const size = 40 + Math.random() * 80
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() * 2 - 1) * speed,
          vy: (Math.random() * 2 - 1) * speed - 0.05, // Slight upward drift
          size: size,
          baseAlpha: 0.15 + Math.random() * 0.2,
          driftSpeed: 0.0005 + Math.random() * 0.001,
        } as CloudBubble
      })
    }

    const draw = (t: number) => {
      // Clear with light blue background (semi-transparent for smooth animation)
      ctx.fillStyle = "rgba(173, 216, 230, 0.3)"
      ctx.fillRect(0, 0, width, height)

      // Draw clouds/bubbles first (behind sparkles)
      for (const cloud of clouds) {
        cloud.x += cloud.vx
        cloud.y += cloud.vy

        // Wrap around edges
        if (cloud.x < -cloud.size) cloud.x = width + cloud.size
        if (cloud.x > width + cloud.size) cloud.x = -cloud.size
        if (cloud.y < -cloud.size) cloud.y = height + cloud.size
        if (cloud.y > height + cloud.size) cloud.y = -cloud.size

        // Gentle floating motion
        const floatX = Math.sin(t * cloud.driftSpeed + cloud.x * 0.01) * 2
        const floatY = Math.cos(t * cloud.driftSpeed + cloud.y * 0.01) * 2

        ctx.save()
        ctx.globalAlpha = cloud.baseAlpha
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
        
        // Draw soft cloud/bubble with gradient
        const gradient = ctx.createRadialGradient(
          cloud.x + floatX,
          cloud.y + floatY,
          0,
          cloud.x + floatX,
          cloud.y + floatY,
          cloud.size
        )
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)")
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.4)")
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)")
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(cloud.x + floatX, cloud.y + floatY, cloud.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Draw pink sparkles
      for (const sparkle of sparkles) {
        sparkle.x += sparkle.vx
        sparkle.y += sparkle.vy

        // Wrap around edges
        if (sparkle.x < -10) sparkle.x = width + 10
        if (sparkle.x > width + 10) sparkle.x = -10
        if (sparkle.y < -10) sparkle.y = height + 10
        if (sparkle.y > height + 10) sparkle.y = -10

        // Twinkling effect
        const twinkle = (Math.sin(t * sparkle.twinkleSpeed + sparkle.twinkleOffset) + 1) * 0.5
        const alpha = sparkle.baseAlpha * (0.3 + 0.7 * twinkle)
        const currentSize = sparkle.size * (0.7 + 0.3 * twinkle)

        ctx.save()
        ctx.globalAlpha = alpha
        
        // Pink colors - various shades
        const pinkShades = [
          "#FF69B4", // Hot pink
          "#FF1493", // Deep pink
          "#FFB6C1", // Light pink
          "#FFC0CB", // Pink
          "#FF91A4", // Pink
        ]
        const pinkColor = pinkShades[Math.floor((sparkle.x + sparkle.y) % pinkShades.length)]
        
        ctx.shadowColor = pinkColor
        ctx.shadowBlur = 8
        ctx.fillStyle = pinkColor
        ctx.beginPath()
        ctx.arc(sparkle.x, sparkle.y, currentSize, 0, Math.PI * 2)
        ctx.fill()
        
        // Add a small bright center
        ctx.globalAlpha = alpha * 1.5
        ctx.fillStyle = "#FFFFFF"
        ctx.beginPath()
        ctx.arc(sparkle.x, sparkle.y, currentSize * 0.3, 0, Math.PI * 2)
        ctx.fill()
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
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
