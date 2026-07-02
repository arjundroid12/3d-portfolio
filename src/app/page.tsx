'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Camera, Hand, Sparkles, Zap, X, RefreshCw } from 'lucide-react'

// ============ GESTURE-CONTROLLED PARTICLE PAINTER ============
// Uses MediaPipe Hands for real-time hand tracking
// Gestures: index finger = draw, pinch = dense mode, open palm = clear, fist = change color

// Helper function (module-level to avoid lint issues)
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [handDetected, setHandDetected] = useState(false)
  const [currentGesture, setCurrentGesture] = useState('none')
  const [colorIndex, setColorIndex] = useState(0)
  const [particleCount, setParticleCount] = useState(0)
  const handRef = useRef<any>(null)
  const particlesRef = useRef<any[]>([])
  const animFrameRef = useRef<number>(0)
  const landmarksRef = useRef<any[]>([])

  const COLORS = [
    ['#14b8a6', '#0d9488', '#5eead4'], // Teal
    ['#fbbf24', '#f59e0b', '#fde68a'], // Amber
    ['#a855f7', '#9333ea', '#d8b4fe'], // Purple
    ['#f97316', '#ea580c', '#fdba74'], // Orange
    ['#ec4899', '#db2777', '#f9a8d4'], // Pink
  ]

  const colorNames = ['Teal', 'Amber', 'Purple', 'Orange', 'Pink']

  // Load MediaPipe Hands script
  useEffect(() => {
    if (!started) return

    const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.crossOrigin = 'anonymous'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load ${src}`))
      document.head.appendChild(script)
    })

    const initMediaPipe = async () => {
      try {
        // Load MediaPipe scripts
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')

        const Hands = (window as any).Hands
        const Camera = (window as any).Camera

        const hands = new Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        })

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        })

        hands.onResults((results: any) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const lms = results.multiHandLandmarks[0]
            landmarksRef.current = lms
            setHandDetected(true)

            // Inline gesture detection
            const thumbTip = lms[4], indexTip = lms[8], middleTip = lms[12], ringTip = lms[16], pinkyTip = lms[20]
            const indexMcp = lms[5], middleMcp = lms[9], ringMcp = lms[13], pinkyMcp = lms[17]
            const d = (a: any, b: any) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
            const iE = indexTip.y < indexMcp.y - 0.02, mE = middleTip.y < middleMcp.y - 0.02
            const rE = ringTip.y < ringMcp.y - 0.02, pE = pinkyTip.y < pinkyMcp.y - 0.02
            const pinch = d(thumbTip, indexTip) < 0.05
            const ext = [iE, mE, rE, pE].filter(Boolean).length

            if (pinch) setCurrentGesture('pinch')
            else if (ext >= 4) { setCurrentGesture('open'); particlesRef.current = []; setParticleCount(0) }
            else if (ext === 0) { setCurrentGesture('fist'); if (!fistTriggeredRef.current) { fistTriggeredRef.current = true; setColorIndex((p) => (p + 1) % 5) } }
            else if (iE && !mE && !rE && !pE) setCurrentGesture('point')
            else setCurrentGesture('idle')
            if (ext > 0) fistTriggeredRef.current = false
          } else {
            landmarksRef.current = []
            setHandDetected(false)
            setCurrentGesture('none')
          }
        })

        handRef.current = hands

        // Start camera
        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (handRef.current) {
                await handRef.current.send({ image: videoRef.current })
              }
            },
            width: 640,
            height: 480,
          })
          camera.start()
        }

        // Start particle animation loop
        startAnimationRef.current()
      } catch (err) {
        
        console.error('MediaPipe init error:', err)
      }
    }

    initMediaPipe()
    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [started])

  const fistTriggeredRef = useRef(false)

  // Particle animation loop
  const startAnimation = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const animate = () => {
      const { width, height } = canvas
      const colors = COLORS[colorIndex]

      // Fade trail effect
      ctx.fillStyle = 'rgba(10, 10, 15, 0.08)'
      ctx.fillRect(0, 0, width, height)

      // Draw webcam feed (mirrored, faded)
      if (videoRef.current && videoRef.current.readyState >= 2) {
        ctx.save()
        ctx.globalAlpha = 0.15
        ctx.translate(width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(videoRef.current, 0, 0, width, height)
        ctx.restore()
      }

      // Draw hand landmarks if detected
      const landmarks = landmarksRef.current
      if (landmarks.length >= 21) {
        const indexTip = landmarks[8]
        const x = (1 - indexTip.x) * width // Mirror x
        const y = indexTip.y * height

        // Draw hand skeleton (simplified)
        const rgb = hexToRgb(colors[0])
        ctx.strokeStyle = `rgba(${rgb}, 0.3)`
        ctx.lineWidth = 2
        const connections = [
          [0,1],[1,2],[2,3],[3,4], // thumb
          [0,5],[5,6],[6,7],[7,8], // index
          [5,9],[9,10],[10,11],[11,12], // middle
          [9,13],[13,14],[14,15],[15,16], // ring
          [13,17],[17,18],[18,19],[19,20], // pinky
          [0,17], // palm
        ]
        for (const [a, b] of connections) {
          const la = landmarks[a]
          const lb = landmarks[b]
          ctx.beginPath()
          ctx.moveTo((1 - la.x) * width, la.y * height)
          ctx.lineTo((1 - lb.x) * width, lb.y * height)
          ctx.stroke()
        }

        // Draw landmarks
        for (const lm of landmarks) {
          ctx.fillStyle = `rgba(${hexToRgb(colors[1])}, 0.6)`
          ctx.beginPath()
          ctx.arc((1 - lm.x) * width, lm.y * height, 3, 0, Math.PI * 2)
          ctx.fill()
        }

        // Index finger glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40)
        gradient.addColorStop(0, `rgba(${hexToRgb(colors[0])}, 0.8)`)
        gradient.addColorStop(1, `rgba(${hexToRgb(colors[0])}, 0)`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, 40, 0, Math.PI * 2)
        ctx.fill()

        // Spawn particles based on gesture
        const gesture = currentGestureRef.current
        let spawnCount = 0
        if (gesture === 'pinch') spawnCount = 8
        else if (gesture === 'point') spawnCount = 4
        else if (gesture === 'idle') spawnCount = 2

        for (let i = 0; i < spawnCount; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 0.5 + Math.random() * 2
          particlesRef.current.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5, // Slight upward bias
            life: 1,
            size: 2 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
          })
        }

        // Limit particles
        if (particlesRef.current.length > 800) {
          particlesRef.current = particlesRef.current.slice(-800)
        }
      }

      // Update and draw particles
      const aliveParticles: any[] = []
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.02 // Gravity
        p.vx *= 0.99 // Air resistance
        p.life -= 0.008

        if (p.life > 0) {
          ctx.globalAlpha = p.life
          ctx.fillStyle = p.color
          ctx.shadowBlur = 10
          ctx.shadowColor = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
          ctx.fill()
          aliveParticles.push(p)
        }
      }
      particlesRef.current = aliveParticles
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      setParticleCount(aliveParticles.length)
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()
  }, [colorIndex])

  // Keep refs in sync via useEffect
  const currentGestureRef = useRef('none')
  const startAnimationRef = useRef<() => void>(() => {})
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    currentGestureRef.current = currentGesture
  }, [currentGesture])
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    startAnimationRef.current = startAnimation
  }, [startAnimation])

  const handleClear = () => {
    particlesRef.current = []
    setParticleCount(0)
  }

  // Landing screen
  if (!started) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl mb-6"
          >
            ✋
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span style={{ background: 'linear-gradient(90deg, #14b8a6, #fbbf24, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Gesture Particle Painter
            </span>
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Control particles in the air with your hand. Your webcam tracks your hand in real-time using Google MediaPipe.
          </p>

          {/* Gesture guide */}
          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl mb-1">☝️</div>
              <p className="text-xs text-gray-400">Point — Draw particles</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl mb-1">🤏</div>
              <p className="text-xs text-gray-400">Pinch — Dense burst</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl mb-1">✊</div>
              <p className="text-xs text-gray-400">Fist — Change color</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl mb-1">🖐️</div>
              <p className="text-xs text-gray-400">Open palm — Clear all</p>
            </div>
          </div>

          <Button
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-amber-500 hover:from-teal-600 hover:to-amber-600 border-0 text-white"
            onClick={() => setStarted(true)}
          >
            <Camera className="w-5 h-5 mr-2" /> Enable Camera & Start
          </Button>
          <p className="text-gray-600 text-xs mt-4">Your camera feed stays in your browser — nothing is uploaded</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] text-white overflow-hidden">
      {/* Hidden video element for webcam */}
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">
              <span style={{ background: 'linear-gradient(90deg, #14b8a6, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Gesture Particle Painter
              </span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {/* Hand status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono ${handDetected ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                <span className={`w-2 h-2 rounded-full ${handDetected ? 'bg-teal-400 animate-pulse' : 'bg-red-400'}`} />
                {handDetected ? 'Hand detected' : 'Show your hand'}
              </div>
              {/* Gesture */}
              <div className="px-3 py-1.5 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-gray-400">
                Gesture: <span className="text-white capitalize">{currentGesture}</span>
              </div>
              {/* Color */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono bg-white/5 border border-white/10">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[colorIndex][0] }} />
                <span className="text-gray-400">{colorNames[colorIndex]}</span>
              </div>
              {/* Particles */}
              <div className="px-3 py-1.5 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-gray-400">
                {particleCount} particles
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 pointer-events-auto">
            <Button size="sm" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={handleClear}>
              <RefreshCw className="w-4 h-4 mr-1" /> Clear
            </Button>
            <Button size="sm" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => setStarted(false)}>
              <X className="w-4 h-4 mr-1" /> Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom gesture guide */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="flex gap-4 px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
          {[
            { icon: '☝️', label: 'Point', desc: 'Draw' },
            { icon: '🤏', label: 'Pinch', desc: 'Burst' },
            { icon: '✊', label: 'Fist', desc: 'Color' },
            { icon: '🖐️', label: 'Open', desc: 'Clear' },
          ].map((g) => (
            <div key={g.label} className={`flex flex-col items-center transition-opacity ${currentGesture === g.label.toLowerCase() || (g.label === 'Point' && currentGesture === 'point') || (g.label === 'Pinch' && currentGesture === 'pinch') || (g.label === 'Fist' && currentGesture === 'fist') || (g.label === 'Open' && currentGesture === 'open') ? 'opacity-100' : 'opacity-40'}`}>
              <span className="text-2xl">{g.icon}</span>
              <span className="text-[10px] text-gray-400 mt-1">{g.label}</span>
              <span className="text-[9px] text-gray-600">{g.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
