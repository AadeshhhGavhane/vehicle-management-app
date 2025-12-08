"use client"

import React, { useEffect, useRef } from "react"

interface WaveformProps {
  analyser: AnalyserNode | null
  isActive: boolean
  color?: string
}

export function Waveform({ analyser, isActive, color = "#10b981" }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match display size for sharpness
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const bufferLength = analyser ? analyser.frequencyBinCount : 0
    const dataArray = analyser ? new Uint8Array(bufferLength) : new Uint8Array(0)

    const draw = () => {
      if (!isActive) {
        ctx.clearRect(0, 0, rect.width, rect.height)
        // Draw a flat line
        ctx.beginPath()
        ctx.moveTo(0, rect.height / 2)
        ctx.lineTo(rect.width, rect.height / 2)
        ctx.strokeStyle = "#cbd5e1" // slate-300
        ctx.lineWidth = 2
        ctx.stroke()
        return
      }

      if (analyser) {
        analyser.getByteTimeDomainData(dataArray)
      }

      ctx.clearRect(0, 0, rect.width, rect.height)
      ctx.lineWidth = 2
      ctx.strokeStyle = color
      ctx.beginPath()

      const sliceWidth = rect.width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * rect.height) / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.lineTo(rect.width, rect.height / 2)
      ctx.stroke()

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, isActive, color])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-24 rounded-lg bg-muted/50 backdrop-blur-sm shadow-inner"
    />
  )
}

