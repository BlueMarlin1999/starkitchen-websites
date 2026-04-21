'use client'

import { useEffect, useRef, type MutableRefObject } from 'react'

interface Star {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  twinkleSpeed: number
}

const STAR_DENSITY = 6000
const SHOOTING_STAR_CHANCE = 0.005

const createStar = (width: number, height: number): Star => ({
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 2 + 0.5,
  speedX: (Math.random() - 0.5) * 0.3,
  speedY: (Math.random() - 0.5) * 0.3,
  opacity: Math.random() * 0.8 + 0.2,
  twinkleSpeed: Math.random() * 0.02 + 0.005,
})

const buildStarField = (width: number, height: number): Star[] => {
  const starCount = Math.floor((width * height) / STAR_DENSITY)
  return Array.from({ length: starCount }, () => createStar(width, height))
}

const resizeCanvas = (canvas: HTMLCanvasElement) => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

const drawGradientBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#04102a')
  gradient.addColorStop(0.5, '#0b2450')
  gradient.addColorStop(1, '#123a74')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

const drawStarHalo = (ctx: CanvasRenderingContext2D, star: Star, opacity: number) => {
  const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3)
  gradient.addColorStop(0, `rgba(126, 167, 255, ${opacity})`)
  gradient.addColorStop(0.5, `rgba(126, 167, 255, ${opacity * 0.5})`)
  gradient.addColorStop(1, 'rgba(126, 167, 255, 0)')
  ctx.beginPath()
  ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
}

const drawStarCore = (ctx: CanvasRenderingContext2D, star: Star, opacity: number) => {
  ctx.beginPath()
  ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
  ctx.fill()
}

const updateStarPosition = (star: Star, width: number, height: number) => {
  star.x += star.speedX
  star.y += star.speedY
  if (star.x < 0) star.x = width
  if (star.x > width) star.x = 0
  if (star.y < 0) star.y = height
  if (star.y > height) star.y = 0
}

const drawStars = (
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  width: number,
  height: number,
  time: number
) => {
  for (const star of stars) {
    const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7
    const currentOpacity = star.opacity * twinkle
    drawStarHalo(ctx, star, currentOpacity)
    drawStarCore(ctx, star, currentOpacity)
    updateStarPosition(star, width, height)
  }
}

const drawShootingStar = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  if (Math.random() >= SHOOTING_STAR_CHANCE) return
  const startX = Math.random() * width
  const startY = Math.random() * height * 0.5
  const length = Math.random() * 80 + 50
  const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3
  const endX = startX + Math.cos(angle) * length
  const endY = startY + Math.sin(angle) * length
  const gradient = ctx.createLinearGradient(startX, startY, endX, endY)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.strokeStyle = gradient
  ctx.lineWidth = 2
  ctx.stroke()
}

const createAnimator = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  starsRef: MutableRefObject<Star[]>,
  animationRef: MutableRefObject<number | undefined>
) => {
  const animate = (currentTime: number) => {
    drawGradientBackground(ctx, canvas.width, canvas.height)
    drawStars(ctx, starsRef.current, canvas.width, canvas.height, currentTime)
    drawShootingStar(ctx, canvas.width, canvas.height)
    animationRef.current = requestAnimationFrame(animate)
  }
  return animate
}

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const syncViewport = () => {
      resizeCanvas(canvas)
      starsRef.current = buildStarField(canvas.width, canvas.height)
    }

    syncViewport()
    const animate = createAnimator(canvas, ctx, starsRef, animationRef)
    animationRef.current = requestAnimationFrame(animate)
    window.addEventListener('resize', syncViewport)

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', syncViewport)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10"
      style={{ background: 'linear-gradient(to bottom, #04102a, #0b2450, #123a74)' }}
    />
  )
}
