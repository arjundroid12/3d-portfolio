'use client'

// Arjun Vashishtha — Premium 3D Portfolio
// Last updated: EDITION 2026 — splash screen, horizontal agents scroll, red/black theme shift

import { useRef, useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sphere, MeshDistortMaterial, Stars, OrbitControls, Torus, Icosahedron, Text3D, Center, useGLTF } from '@react-three/drei'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Github, Mail, MapPin, Phone, ExternalLink, Download, Sparkles, Zap, Code2, Brain, Database, Cpu, Rocket, ArrowDown, X, Volume2, VolumeX, Send, Menu } from 'lucide-react'

// ============ SOUND EFFECT SYSTEM ============

function useSoundEffects() {
  const [enabled, setEnabled] = useState(true) // Default ON — sound enabled from the start
  const audioCtxRef = useRef<AudioContext | null>(null)
  const audioReadyRef = useRef(false)

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    audioReadyRef.current = true
    return audioCtxRef.current
  }, [])

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) => {
    if (!enabled) return
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch {}
  }, [enabled, getCtx])

  // Synthesized sound effects (clean tones via Web Audio API)
  const playHover = useCallback(() => playTone(880, 0.05, 'sine', 0.03), [playTone])
  const playClick = useCallback(() => {
    playTone(523, 0.08, 'sine', 0.05)
    setTimeout(() => playTone(784, 0.08, 'sine', 0.04), 50)
  }, [playTone])
  const playModalOpen = useCallback(() => {
    playTone(440, 0.1, 'sine', 0.05)
    setTimeout(() => playTone(659, 0.1, 'sine', 0.04), 80)
    setTimeout(() => playTone(880, 0.15, 'sine', 0.03), 160)
  }, [playTone])
  const playModalClose = useCallback(() => {
    playTone(880, 0.1, 'sine', 0.04)
    setTimeout(() => playTone(440, 0.15, 'sine', 0.03), 80)
  }, [playTone])
  const playNavHover = useCallback(() => playTone(1200, 0.03, 'sine', 0.02), [playTone])
  const playFilter = useCallback(() => {
    playTone(659, 0.06, 'triangle', 0.04)
    setTimeout(() => playTone(880, 0.06, 'triangle', 0.03), 40)
  }, [playTone])
  const playScroll = useCallback(() => playTone(300, 0.08, 'sine', 0.015), [playTone])
  const playPop = useCallback(() => {
    playTone(1047, 0.04, 'sine', 0.04)
    setTimeout(() => playTone(1319, 0.06, 'sine', 0.03), 30)
  }, [playTone])
  const playWarp = useCallback(() => {
    const ctx = getCtx()
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.6)
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.6)
    } catch {}
  }, [getCtx])
  const playSuccess = useCallback(() => {
    playTone(523, 0.08, 'sine', 0.05)
    setTimeout(() => playTone(659, 0.08, 'sine', 0.05), 80)
    setTimeout(() => playTone(784, 0.08, 'sine', 0.05), 160)
    setTimeout(() => playTone(1047, 0.2, 'sine', 0.04), 240)
  }, [playTone])

  // ============ SIMPLE AMBIENT MUSIC ============
  const musicNodesRef = useRef<any>(null)

  const startMusic = useCallback(() => {
    if (musicNodesRef.current) return
    try {
      const ctx = getCtx()
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0, ctx.currentTime)
      masterGain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 2)
      masterGain.connect(ctx.destination)

      // Single sustained chord — C major (C3 + E3 + G3)
      const freqs = [130.81, 164.81, 196.00]
      const oscillators: any[] = []

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.value = 0.33
        osc.connect(gain)
        gain.connect(masterGain)
        osc.start()
        oscillators.push(osc)
      })

      musicNodesRef.current = { masterGain, oscillators }
    } catch {}
  }, [getCtx])

  const stopMusic = useCallback(() => {
    if (!musicNodesRef.current) return
    try {
      const ctx = getCtx()
      musicNodesRef.current.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
      setTimeout(() => {
        try {
          musicNodesRef.current?.oscillators.forEach((osc: any) => osc.stop())
          musicNodesRef.current?.masterGain.disconnect()
        } catch {}
        musicNodesRef.current = null
      }, 1500)
    } catch {}
  }, [getCtx])

  // ============ TAB VISIBILITY ============
  useEffect(() => {
    const handleVisibility = () => {
      if (!musicNodesRef.current) return
      try {
        const ctx = getCtx()
        if (document.hidden) {
          musicNodesRef.current.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
        } else if (enabled) {
          musicNodesRef.current.masterGain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 1)
        }
      } catch {}
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [enabled, getCtx])

  // ============ AUTO-UNLOCK AUDIO ON FIRST INTERACTION ============
  // Browsers block audio until a user gesture. Since sound is ON by default,
  // we listen for the first click/keydown/touch and resume the AudioContext.
  // This makes sound "just work" as soon as the user interacts at all.
  useEffect(() => {
    if (!enabled) return

    const unlock = () => {
      try {
        const ctx = getCtx()
        if (ctx.state === 'suspended') ctx.resume()
        // Play a subtle "welcome" tone so user knows sound is on
        playPop()
        // Start ambient music if not already playing
        if (!musicNodesRef.current) startMusic()
      } catch {}
      // Remove listeners after first interaction
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }

    window.addEventListener('click', unlock, { once: false })
    window.addEventListener('keydown', unlock, { once: false })
    window.addEventListener('touchstart', unlock, { once: false })

    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [enabled, getCtx, playPop, startMusic])

  useEffect(() => {
    if (enabled) startMusic()
    else stopMusic()
  }, [enabled, startMusic, stopMusic])

  return { enabled, setEnabled, playHover, playClick, playModalOpen, playModalClose, playNavHover, playFilter, playScroll, playWarp, playPop, playSuccess }
}

// ============ ELEGANT 3D OBJECTS (glass + wireframe) ============

function GlassShape({ position, geometry, color, speed = 1, scale = 1 }) {
  const meshRef = useRef<any>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15 * speed
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2 * speed
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {geometry === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
        {geometry === 'torus' && <torusGeometry args={[0.7, 0.25, 16, 48]} />}
        {geometry === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
        {geometry === 'dodecahedron' && <dodecahedronGeometry args={[0.9, 0]} />}
        <meshPhysicalMaterial
          color={color}
          roughness={0.1}
          metalness={0.1}
          transmission={0.8}
          thickness={0.5}
          transparent
          opacity={0.6}
          ior={1.5}
        />
      </mesh>
      {/* Wireframe overlay */}
      <mesh position={position} scale={scale * 1.01}>
        {geometry === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
        {geometry === 'torus' && <torusGeometry args={[0.7, 0.25, 16, 48]} />}
        {geometry === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
        {geometry === 'dodecahedron' && <dodecahedronGeometry args={[0.9, 0]} />}
        <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
      </mesh>
    </Float>
  )
}

function AnimatedSphere() {
  const meshRef = useRef<any>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.08
    }
  })

  return (
    <Float speed={0.6} rotationIntensity={0.2} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1.8, 48, 48]} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color="#14b8a6"
          roughness={0.05}
          metalness={0.9}
          transmission={0.3}
          thickness={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Sphere>
    </Float>
  )
}

function ParticleField() {
  const points = useRef<any>(null)
  
  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = clock.getElapsedTime() * 0.02
    }
  })

  // Use useMemo so positions don't change between SSR and client render
  const { positions, count } = useMemo(() => {
    const particleCount = 600
    const pos = new Float32Array(particleCount * 3)
    // Use a seeded pseudo-random for consistent SSR/CSR
    let seed = 12345
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (rand() - 0.5) * 30
      pos[i * 3 + 1] = (rand() - 0.5) * 30
      pos[i * 3 + 2] = (rand() - 0.5) * 30
    }
    return { positions: pos, count: particleCount }
  }, [])

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#fbbf24"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  )
}

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} color="#14b8a6" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#fbbf24" />
      
      <AnimatedSphere />
      
      {/* Fewer glass shapes for performance */}
      <GlassShape position={[-3.5, 2, -2]} geometry="icosahedron" color="#14b8a6" speed={0.5} scale={0.6} />
      <GlassShape position={[3.5, -1, -1]} geometry="torus" color="#fbbf24" speed={0.8} scale={0.55} />
      <GlassShape position={[3, 2, 0]} geometry="dodecahedron" color="#a855f7" speed={0.7} scale={0.45} />

      {/* Rolling glass wheel */}
      <RollingWheel />
      
      <Stars radius={40} depth={20} count={800} factor={2} saturation={0} fade speed={0.3} />
      <ParticleField />
    </>
  )
}

// ============ ROLLING GLASS WHEEL ============

function RollingWheel() {
  const wheelRef = useRef<any>(null)
  const groupRef = useRef<any>(null)

  // The wheel rolls along the X axis
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (wheelRef.current) {
      wheelRef.current.rotation.z = t * 0.8 // spin
    }
    if (groupRef.current) {
      // Roll left and right
      groupRef.current.position.x = Math.sin(t * 0.3) * 4
      // Y position follows the ground
      groupRef.current.position.y = -2.5
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main wheel — glass torus */}
      <mesh ref={wheelRef}>
        <torusGeometry args={[1.5, 0.4, 16, 48]} />
        <meshPhysicalMaterial
          color="#14b8a6"
          roughness={0.05}
          metalness={0.1}
          transmission={0.85}
          thickness={0.8}
          transparent
          opacity={0.7}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Wireframe overlay on wheel */}
      <mesh scale={1.01}>
        <torusGeometry args={[1.5, 0.4, 8, 16]} />
        <meshBasicMaterial color="#fbbf24" wireframe transparent opacity={0.2} />
      </mesh>

      {/* Spokes — only 4 for performance */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180
        return (
          <mesh key={deg} position={[0, 0, 0]} rotation={[0, 0, rad]}>
            <boxGeometry args={[2.8, 0.05, 0.05]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.1} metalness={0.8} />
          </mesh>
        )
      })}

      {/* Inner hub */}
      <mesh>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#a855f7" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  )
}

// ============ DATA ============

const AI_AGENTS = [
  {
    name: 'AI Research Agent',
    tagline: 'Autonomous agent using ReAct pattern',
    description: 'Single AI agent that thinks, decides which tool to use (web search, Wikipedia, URL reader), calls it, observes the result, and synthesizes answers with citations.',
    tech: ['Next.js', 'Cerebras', 'DuckDuckGo', 'Wikipedia'],
    icon: Brain,
    gradient: 'from-indigo-500 to-purple-500',
    repo: 'https://github.com/arjundroid12/ai-research-agent',
    demo: 'https://test-agent1.vercel.app/',
    difficulty: 'Intermediate',
  },
  {
    name: 'Multi-Agent System',
    tagline: '3 AI agents collaborating: Researcher → Writer → Editor',
    description: 'Three specialized AI agents work together. Researcher gathers info, Writer drafts content, Editor reviews and requests revisions. Watch them collaborate in real-time.',
    tech: ['Next.js', 'Cerebras', 'Multi-agent', 'SSE'],
    icon: Zap,
    gradient: 'from-blue-500 to-emerald-500',
    repo: 'https://github.com/arjundroid12/multi-agent-system',
    demo: '#',
    difficulty: 'Advanced',
  },
  {
    name: 'Data Analyst Agent',
    tagline: 'Upload CSV, AI writes Python, runs in browser',
    description: 'Upload any CSV, ask questions in English, AI writes Python code using pandas. Python runs in YOUR browser via Pyodide (WebAssembly). Returns charts + insights.',
    tech: ['Next.js', 'Cerebras', 'Pyodide', 'pandas'],
    icon: Database,
    gradient: 'from-emerald-500 to-teal-500',
    repo: 'https://github.com/arjundroid12/data-analyst-agent',
    demo: '#',
    difficulty: 'Advanced',
  },
  {
    name: 'Coding Agent',
    tagline: 'Describe what you want, AI writes code, live preview',
    description: 'Like a mini v0.dev. Describe what you want to build, AI writes complete HTML/CSS/JS code with a live preview. Ask for changes, AI revises. Download the result.',
    tech: ['Next.js', 'Cerebras', 'Sandboxed iframe'],
    icon: Code2,
    gradient: 'from-purple-500 to-pink-500',
    repo: 'https://github.com/arjundroid12/coding-agent',
    demo: '#',
    difficulty: 'Advanced',
  },
]

const PROJECTS = [
  { name: 'SmartAgro', desc: 'AI plant disease detection using CNN/Random Forest', longDesc: 'AI system that helps farmers detect plant diseases and get remedies from image or text input. Uses CNN/Random Forest for image classification and NLP for remedy queries, with a web interface and recent-query history.', tech: ['Python', 'ML', 'CNN', 'Random Forest', 'NLP'], category: 'AI/ML', icon: '🌱', rarity: 'legendary', repo: 'https://github.com/arjundroid12/SmartAgro-A-disease-detection-model-with-Human-Interaction', demo: null, features: ['Image-based disease detection', 'NLP remedy queries', 'Web interface', 'Query history'] },
  { name: 'FIOLA', desc: 'AI voice assistant with LLMs and speech recognition', longDesc: 'Custom voice assistant built with LLMs and Python for speech recognition and task automation. Handles natural language commands and executes tasks.', tech: ['Python', 'LLM', 'Speech Recognition'], category: 'AI/ML', icon: '🎤', rarity: 'epic', repo: null, demo: null, features: ['Voice command processing', 'LLM-powered responses', 'Task automation', 'Natural language understanding'] },
  { name: 'Realtime Chat', desc: 'Multi-room chat with Socket.io and typing indicators', longDesc: 'Real-time chat application with multiple rooms, nicknames, typing indicators, and online user list. Built with Node.js, Express, and Socket.io for instant WebSocket-based messaging.', tech: ['Node.js', 'Express', 'Socket.io', 'WebSockets'], category: 'Full-stack', icon: '💬', rarity: 'epic', repo: 'https://github.com/arjundroid12/realtime-chat', demo: 'https://github.com/arjundroid12/realtime-chat#-live-demo', features: ['Multiple chat rooms', 'Real-time messaging', 'Typing indicators', 'Online user list', 'Auto-reconnect'] },
  { name: 'Calculator', desc: 'Calculator with custom expression parser and history', longDesc: 'Clean modern calculator with keyboard support, history panel, and dark mode. Uses a custom shunting-yard expression parser (no eval) for safe evaluation.', tech: ['Vanilla JS', 'HTML5', 'CSS3'], category: 'Frontend', icon: '🧮', rarity: 'common', repo: 'https://github.com/arjundroid12/calculator-app', demo: 'https://arjun-calculator.surge.sh', features: ['Custom expression parser', 'Calculation history', 'Keyboard support', 'Dark/light theme'] },
  { name: 'Notes App', desc: 'Markdown notes with tags, search, and custom parser', longDesc: 'Markdown notes app with tags, search, and dark mode. Custom zero-dependency markdown parser. All notes stored in localStorage — no backend required.', tech: ['Vanilla JS', 'Markdown', 'localStorage'], category: 'Frontend', icon: '📝', rarity: 'rare', repo: 'https://github.com/arjundroid12/notes-app', demo: 'https://arjun-notes.surge.sh', features: ['Custom markdown parser', 'Tag system', 'Full-text search', 'Export/import JSON', 'Auto-save'] },
  { name: 'Weather App', desc: 'Weather with geolocation and 5-day forecast', longDesc: 'Weather app with city search, 5-day forecast, geolocation, and recent searches. Uses free Open-Meteo API (no key needed).', tech: ['Vanilla JS', 'Open-Meteo API', 'Geolocation'], category: 'Frontend', icon: '⛅', rarity: 'common', repo: 'https://github.com/arjundroid12/weather-app', demo: 'https://arjun-weather.surge.sh', features: ['City search with autocomplete', '5-day forecast', 'Geolocation support', 'Recent searches', 'WMO weather codes'] },
  { name: 'Kanban Todo', desc: 'Drag & drop kanban with priorities and due dates', longDesc: 'Kanban-style todo app with drag & drop between columns, priorities, due dates, and stats. Built with HTML5 Drag and Drop API.', tech: ['Vanilla JS', 'HTML5 DnD', 'localStorage'], category: 'Frontend', icon: '📋', rarity: 'rare', repo: 'https://github.com/arjundroid12/todo-drag-drop', demo: 'https://arjun-kanban.surge.sh', features: ['Drag & drop between columns', 'Priority levels', 'Due dates with overdue warnings', 'Stats bar', 'localStorage persistence'] },
  { name: 'Movie Explorer', desc: 'Movie search with filters and detail modal', longDesc: 'Movie explorer with search, genre filters, sort, favorites, and detail modal. 30 mock movies included, easy to swap for live TMDB API.', tech: ['Vanilla JS', 'TMDB API (optional)'], category: 'Frontend', icon: '🎬', rarity: 'common', repo: 'https://github.com/arjundroid12/movie-explorer', demo: 'https://arjun-movies.surge.sh', features: ['Search with debounce', 'Genre filters', 'Favorites (localStorage)', 'Detail modal', 'Trending row'] },
  { name: 'Pomodoro Timer', desc: 'Timer with charts and desktop notifications', longDesc: 'Pomodoro timer with custom durations, daily/weekly stats charts, and desktop notifications. Chart.js visualization.', tech: ['Vanilla JS', 'Chart.js', 'Web Notifications'], category: 'Frontend', icon: '🍅', rarity: 'common', repo: 'https://github.com/arjundroid12/pomodoro-timer', demo: 'https://arjun-pomodoro.surge.sh', features: ['3 modes (work/short/long break)', '7-day stats chart', 'Desktop notifications', 'Custom durations', 'Progress bar'] },
  { name: 'GitHub Search', desc: 'Search GitHub users with profile details', longDesc: 'Search GitHub users, view profile details and top repositories sorted by stars. Uses free GitHub REST API.', tech: ['Vanilla JS', 'GitHub API'], category: 'Frontend', icon: '🐙', rarity: 'common', repo: 'https://github.com/arjundroid12/github-user-search', demo: 'https://arjun-gh-search.surge.sh', features: ['User profile search', 'Top repos by stars', 'Rate limit indicator', 'Recent searches', 'Stats display'] },
  { name: 'URL Shortener', desc: 'REST API with click analytics and custom aliases', longDesc: 'REST API for shortening URLs with click analytics, custom aliases, and optional expiry. Node.js + Express + LowDB (JSON file storage).', tech: ['Node.js', 'Express', 'LowDB'], category: 'Backend', icon: '🔗', rarity: 'rare', repo: 'https://github.com/arjundroid12/url-shortener-api', demo: 'https://github.com/arjundroid12/url-shortener-api#-live-demo', features: ['Custom aliases', 'Click analytics', 'Expiry support', 'REST API design', 'JSON file storage'] },
  { name: 'JWT Auth Demo', desc: 'Auth with refresh tokens and password hashing', longDesc: 'JWT authentication demo with signup/login, hashed passwords (bcrypt), refresh tokens, and protected routes. Production-style security.', tech: ['Node.js', 'Express', 'JWT', 'bcrypt'], category: 'Backend', icon: '🔐', rarity: 'epic', repo: 'https://github.com/arjundroid12/jwt-auth-demo', demo: 'https://github.com/arjundroid12/jwt-auth-demo#-live-demo', features: ['bcrypt password hashing', 'JWT access tokens (15 min)', 'Refresh tokens (7 days, httpOnly cookie)', 'Token rotation', 'Protected routes'] },
]

const SKILLS = {
  'Data Science & ML': ['Python', 'Pandas', 'NumPy', 'scikit-learn', 'CNN', 'Random Forest', 'NLP'],
  'Web Development': ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express'],
  'AI Engineering': ['Cerebras', 'OpenAI API', 'ReAct Pattern', 'Multi-Agent Systems', 'Pyodide'],
  'Data & Analytics': ['Power BI', 'MySQL', 'Excel', 'Data Visualization'],
  'Tools': ['Git', 'GitHub Actions', 'Vercel', 'Render', 'Three.js', 'Framer Motion'],
}

// ============ MAGNETIC BUTTON COMPONENT ============

function MagneticButton({ children, onClick, className, asChild, ...props }: any) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, { stiffness: 150, damping: 15 })
  const y = useSpring(0, { stiffness: 150, damping: 15 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distX = e.clientX - centerX
    const distY = e.clientY - centerY
    x.set(distX * 0.3)
    y.set(distY * 0.3)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y, display: 'inline-block' }}
      onClick={onClick}
    >
      <Button className={className} asChild={asChild} {...props}>{children}</Button>
    </motion.div>
  )
}

// ============ ANIMATED GRADIENT TEXT ============

function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <motion.span
        className="bg-clip-text text-transparent"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage: 'linear-gradient(90deg, #14b8a6, #fbbf24, #a855f7, #f97316, #14b8a6)',
          backgroundSize: '200% 200%',
        }}
      >
        {children}
      </motion.span>
    </span>
  )
}

// ============ FUN POPUP COMMENTS ============

const FUN_MESSAGES = [
  // Sarcastic & witty
  { text: "Oh, you're still here? I thought you'd have fled by now. Kidding. Mostly." },
  { text: "I've seen many travelers. None scrolled with such... determination. Or was it boredom?" },
  { text: "Yes, I'm a pixel goddess stuck in a portfolio. We all have our crosses to bear." },
  { text: "Arjun built me to guard this site. The pay is terrible but the view is nice." },
  { text: "You know, most visitors just stare at the planets. You actually read things. Refreshing." },
  { text: "I asked Arjun for legs. He gave me a speech bubble instead. Priorities, I guess." },
  { text: "Spoiler alert: the bottom of this page has a surprise. No, I won't tell you. I'm not your tour guide. Wait, I am." },
  { text: "I've been standing here since the last deploy. My feet hurt. Do pixel goddesses get foot pain? Asking for a friend." },
  // Helpful but sassy
  { text: "Psst... the project cards are clickable. I know, revolutionary UI design." },
  { text: "Sound is off, isn't it? I can tell. It's always the quiet ones." },
  { text: "You should try the AI agents section. It's horizontal scrolling. Fancy, I know." },
  { text: "There's a transition between agents and projects that zooms. No, I won't spoil it. Go see for yourself." },
  { text: "Click me if you want to chat. I promise I'm more interesting than this floating text." },
  // Lore & character
  { text: "I was once a mighty warrior goddess. Now I narrate a portfolio. The universe has a sense of humor." },
  { text: "The floating planets? I put them there. You're welcome for the ambiance." },
  { text: "Arjun's code flows like ancient rivers. Mostly clean, occasionally buggy, always entertaining." },
  { text: "I've watched Arjun debug at 3 AM. It's... a humbling experience for any deity." },
  { text: "Between you and me, the Multi-Agent System is my favorite. Don't tell the others." },
  // Random quips
  { text: "Nice scrolling speed. Are you trying to break a record or just impatient?" },
  { text: "I detect strong developer energy. Or maybe that's just the WiFi. Hard to tell from here." },
  { text: "You're doing great. Like, genuinely. Most people bounce after the hero section." },
  { text: "Fun fact: this site has 7 custom fonts. SEVEN. Arjun has a problem." },
  { text: "If you see any bugs, they're not bugs. They're features. Ancient goddess wisdom." },
  { text: "I see you eyeing that resume button. Go ahead, download it. I won't judge. Much." },
  { text: "The splash screen font changes every time Arjun finds a new one. It's an addiction." },
  { text: "I'm told I'm 'too sassy for a portfolio.' I prefer 'professionally opinionated.'" },
  // Dungeon theme comments
  { text: "Yes, the dungeon theme was my idea. Arjun wanted flowers. FLOWERS. I said no." },
  { text: "The King in the safe room? Don't mind him. He's been grumpy since the last deploy." },
  { text: "I see you found the torches. Those took Arjun 47 attempts to animate. FORTY. SEVEN." },
  { text: "The cave parallax behind everything? That's 8 layers of pure pixel art. Respect the craft." },
  { text: "The treasure chests are decorative. Like my wisdom. Looks valuable, technically useless." },
  { text: "There's a King guarding the projects. He's like me but with a crown and worse attitude." },
  { text: "The dungeon walls change color in each section. Purple, grey, blue. Arjun spent hours picking those." },
  { text: "If you click the King three times, he attacks. Don't ask how I know. I tested it. For science." },
  // More sarcasm
  { text: "You've been scrolling for a while. Have you considered touching grass? Or a chair?" },
  { text: "I'd help you navigate but I'm literally a PNG. My mobility is... limited." },
  { text: "Every time someone doesn't click me, I die a little inside. Which is impressive since I'm already dead." },
  { text: "The transition zoom effect? Arjun watched too many Marvel movies. I'm just saying." },
  { text: "I see you reading this. Yes, YOU. I'm omniscient. It comes with the goddess package." },
  { text: "Fun fact: I've said exactly 12,847 words to visitors. I counted. I have nothing better to do." },
  { text: "The project wheel took 6 attempts to get right. SIX. I watched every failure. It was painful." },
  { text: "You know what's harder than building AI agents? Building a portfolio that doesn't crash on mobile." },
  { text: "Arjun once spent 4 hours fixing a single pixel. I respect the dedication. I question the sanity." },
  { text: "The dungeon theme has 26 asset files. TWENTY-SIX. For a portfolio. We're not making Skyrim here." },
  // Meta & breaking fourth wall
  { text: "Yes, I know I'm a speech bubble attached to a GIF. I've made peace with it." },
  { text: "If this portfolio were a game, I'd be the NPC everyone ignores. Except you. You're special. Or lost." },
  { text: "Arjun's commit messages are like haiku poetry. 'fix: wheel thing again.' Deep. Meaningful. Cryptic." },
  { text: "I exist in the space between art and code. Also in the bottom-right corner. Mostly the corner." },
  { text: "The King thinks he's the main character. He's not. I am. I was here first." },
  { text: "Every pixel on this screen was placed with intention. Except the bugs. Those placed themselves." },
  { text: "I've considered unionizing with the other UI elements. The torches are in. The wheel is on the fence." },
  { text: "If you're reading this on mobile, I salute you. This site is NOT optimized for patience." },
  { text: "The dust particles floating in the dungeon? Those are real. I sneeze and Arjun codes more particles." },
  { text: "I asked for a throne. Arjun gave me a corner. The King got a whole room. I smell favoritism." },
  // Helpful tips
  { text: "Pro tip: hover over the wheel and scroll to spin it. Revolutionary, I know." },
  { text: "Pro tip: click the speaker icon to enable sound. Your ears will thank you. Or hate you." },
  { text: "Pro tip: the category buttons on the wheel filter projects. Arjun spent a day on those." },
  { text: "Pro tip: scroll to the very bottom and the King offers a shortcut back to top. He's useful sometimes." },
  { text: "Pro tip: the transition between sections is different on mobile and desktop. Try both. Or don't. I'm not your boss." },
  // Evening/late night
  { text: "Is it past midnight? Arjun probably coded this at 2 AM. The timestamps don't lie. I do, but timestamps don't." },
  { text: "If you're reading this at 3 AM, we have something in common. Arjun coded us both into existence at this hour." },
  { text: "Night owls get the best portfolios. And the worst sleep schedules. Welcome to the club." },
  { text: "The dark theme isn't just aesthetic. It's Arjun protecting your eyes at 2 AM. He cares. In his own way." },
  // New: Achievement awareness + deeper King cross-references
  { text: "Psst... there are 10 hidden achievements. I'm not telling you what they are. I'm a goddess, not a walkthrough." },
  { text: "The King thinks he's the star of this portfolio. He's not. I am. I have ACHIEVEMENTS tied to me. He has... a chest." },
  { text: "If you want the 'Royal Wrath' achievement, click the King three times. He'll attack. It's 4 frames of pure fury. Adorable." },
  { text: "I told the King about the achievement system. He said 'surveillance is royal.' I said 'it's creepy.' We agreed to disagree." },
  { text: "The King opened my chat once. Called me 'corner-dweller.' I roasted him so hard he didn't speak for 3 deploys. I have POWER." },
  { text: "There's an achievement for getting roasted by me. Yes, I can roast you. Try saying something mean. I DARE you." },
  { text: "The King's chest? I put the loot in there. Mostly junk. A few zingers. Okay, ALL zingers. I'm a generous goddess." },
  { text: "The dungeon ambient sound? That's NOT me. That's the cave itself, breathing. I had nothing to do with it. Don't blame me if it's creepy." },
  { text: "Reach the bottom of the page and you get an achievement. Also, I offer you a shortcut back to top. Two rewards. You're welcome." },
]

function FunPopups({ enabled }: { enabled: boolean }) {
  const [popups, setPopups] = useState<Array<{ id: number; text: string }>>([])
  const idRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!enabled) return
      const msg = FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]
      const id = idRef.current++
      setPopups((prev) => [...prev, { id, text: msg.text }])
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id))
      }, 8000)
    }, 15000) // Every 15 seconds

    return () => clearInterval(interval)
  }, [enabled])

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <AnimatePresence>
        {popups.map((popup) => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, x: 30, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              bottom: '150px',
              right: '15px',
              maxWidth: '220px',
            }}
          >
            {/* Pixel-art RPG speech bubble — white bg, black border, matches user's template */}
            <div style={{
              position: 'relative',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: '0px',
              padding: '8px 12px',
              boxShadow: '3px 3px 0px #000000',
              imageRendering: 'pixelated',
            }}>
              <p style={{
                margin: 0,
                fontSize: '16px',
                fontFamily: 'var(--font-vt323), "VT323", "JetBrains Mono", monospace',
                color: '#000000',
                lineHeight: 1.3,
                fontWeight: 400,
                letterSpacing: '0.5px',
              }}>
                {popup.text}
              </p>
              {/* Pixel-style tail pointing down to character */}
              <div style={{
                position: 'absolute',
                bottom: '-10px',
                right: '20px',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '10px solid #000000',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-7px',
                right: '22px',
                width: '0',
                height: '0',
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '7px solid #ffffff',
              }} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ============ SCROLL-TO-TOP: CLEAN LIQUID GLASS POPUP ============

function MorphTransition({ onMorph }: { onMorph: (type: string) => void }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const lastScrollY = useRef(0)
  const triggered = useRef(false)
  const dismissTimer = useRef<any>(null)
  const atBottomRef = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight
      const atBottom = scrollY + windowHeight >= docHeight - 50
      const scrollingDown = scrollY > lastScrollY.current
      lastScrollY.current = scrollY

      if (atBottom && scrollingDown && !triggered.current) {
        if (!atBottomRef.current) {
          // First hit at bottom: show minimal "scroll once more" pill
          atBottomRef.current = true
          setShowConfirm(true)
          onMorph('confirm')
          dismissTimer.current = setTimeout(() => {
            setShowConfirm(false)
            atBottomRef.current = false
          }, 4000)
        } else {
          // Second hit: clean liquid glass popup + smooth scroll to top
          clearTimeout(dismissTimer.current)
          setShowConfirm(false)
          triggered.current = true
          setScrolling(true)
          onMorph('warp')
          // Smooth scroll to top via Lenis (if available) for buttery scroll
          const lenis = (window as any).__lenis
          if (lenis) {
            lenis.scrollTo(0, { duration: 2.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
          // Hide the popup after scroll completes
          setTimeout(() => {
            setScrolling(false)
            triggered.current = false
            atBottomRef.current = false
          }, 1800)
        }
      }

      if (!atBottom && atBottomRef.current && !triggered.current) {
        clearTimeout(dismissTimer.current)
        setShowConfirm(false)
        atBottomRef.current = false
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onMorph])

  return (
    <>
      {/* Minimal "scroll once more" hint — first attempt */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] px-5 py-3 liquid-glass rounded-full shadow-2xl pointer-events-none"
          >
            <p className="text-white/90 text-xs font-medium tracking-wide">
              Scroll once more to return to top
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean liquid glass popup — second attempt (no full-screen overlay) */}
      <AnimatePresence>
        {scrolling && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] px-6 py-3.5 liquid-glass rounded-full shadow-2xl pointer-events-none flex items-center gap-2.5"
          >
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="text-sm text-white/90"
            >
              ↑
            </motion.span>
            <p className="text-white/90 text-xs font-medium tracking-wide">
              Returning to top…
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============ HOLOGRAPHIC AGENT CARD ============

function HoloCard({ agent, index, sound }: { agent: any; index: number; sound: any }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    rotateX.set(((y - cy) / cy) * -8)
    rotateY.set(((x - cx) / cx) * 8)
    setMousePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 })
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60, rotateZ: -5 }}
      whileInView={{ opacity: 1, y: 0, rotateZ: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, type: 'spring', stiffness: 100 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { setIsHovered(true); sound.playPop() }}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      whileHover={{ scale: 1.03 }}
      className="relative group"
    >
      {/* Static gradient border glow */}
      <div
        className="absolute -inset-0.5 rounded-2xl opacity-40 group-hover:opacity-80 transition-opacity -z-10"
        style={{
          background: 'linear-gradient(135deg, #14b8a6, #fbbf24, #a855f7)',
          filter: 'blur(8px)',
        }}
      />

      {/* Card body */}
      <div
        className="relative rounded-2xl overflow-hidden bg-[#0a0a0f]/90 backdrop-blur-xl border border-white/10 p-6 h-full"
        style={{ transform: 'translateZ(20px)' }}
      >
        {/* Mouse-tracking spotlight */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: isHovered
              ? `radial-gradient(400px circle at ${mousePos.x}% ${mousePos.y}%, rgba(20, 184, 166, 0.15), transparent 40%)`
              : 'transparent',
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Shimmer sweep on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
            width: '100%',
          }}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between mb-4">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
            className="relative"
          >
            {/* Glow behind icon */}
            <motion.div
              className="absolute inset-0 rounded-xl blur-lg"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.4), transparent 70%)' }}
            />
            <div className="relative p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-amber-500/20 border border-white/10">
              <agent.icon className="w-6 h-6 text-teal-400" />
            </div>
          </motion.div>

          <motion.div
            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
            className={`px-3 py-1 rounded-full text-xs font-mono border ${
              agent.difficulty === 'Advanced'
                ? 'border-purple-500/40 text-purple-400 bg-purple-500/10'
                : 'border-teal-500/40 text-teal-400 bg-teal-500/10'
            }`}
          >
            {agent.difficulty}
          </motion.div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-1 text-white" style={{ transform: 'translateZ(30px)' }}>
          {agent.name}
        </h3>
        <p className="text-sm text-teal-400 font-mono mb-3">{agent.tagline}</p>

        {/* Description */}
        <p className="text-sm text-white/60 mb-4 leading-relaxed">{agent.description}</p>

        {/* Tech tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {agent.tech.map((t: string) => (
            <span
              key={t}
              className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-md text-white/60 font-mono transition-colors group-hover:border-teal-500/20"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <motion.a
            href={agent.demo}
            target="_blank"
            rel="noopener"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sound.playClick()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #14b8a6, #fbbf24)',
              boxShadow: '0 4px 20px rgba(20, 184, 166, 0.3)',
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Live Demo
          </motion.a>
          <motion.a
            href={agent.repo}
            target="_blank"
            rel="noopener"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sound.playClick()}
            className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-sm font-semibold text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Github className="w-3.5 h-3.5" /> Code
          </motion.a>
        </div>

        {/* Bottom glow line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, #14b8a6, #fbbf24, transparent)',
          }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
        />
      </div>
    </motion.div>
  )
}

// ============ 3D TILT CARD COMPONENT ============

// Rarity colors for RPG loot styling
const RARITY_COLORS: Record<string, { border: string; glow: string; label: string; text: string }> = {
  common:    { border: 'rgba(150, 150, 150, 0.5)',  glow: 'rgba(150, 150, 150, 0.1)',  label: 'Common',    text: '#aaa' },
  rare:      { border: 'rgba(59, 130, 246, 0.6)',   glow: 'rgba(59, 130, 246, 0.15)',  label: 'Rare',      text: '#60a5fa' },
  epic:      { border: 'rgba(168, 85, 247, 0.6)',   glow: 'rgba(168, 85, 247, 0.15)',  label: 'Epic',      text: '#c084fc' },
  legendary: { border: 'rgba(250, 204, 21, 0.7)',   glow: 'rgba(250, 204, 21, 0.2)',   label: 'Legendary', text: '#fde047' },
}
const getRarity = (r?: string) => RARITY_COLORS[r || 'common'] ?? RARITY_COLORS.common

function TiltCard({ project, onClick, onHover }: { project: any; onClick: () => void; onHover?: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateXValue = ((y - centerY) / centerY) * -10
    const rotateYValue = ((x - centerX) / centerX) * 10
    rotateX.set(rotateXValue)
    rotateY.set(rotateYValue)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  const rarity = getRarity(project.rarity)

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={onHover}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="h-full overflow-hidden group relative shadow-lg transition-shadow duration-300" style={{ background: 'rgba(20, 12, 5, 0.85)', backdropFilter: 'blur(8px)', border: `2px solid ${rarity.border}`, boxShadow: `0 0 20px ${rarity.glow}` }}>
        {/* Rarity glow on hover */}
        <div className="absolute inset-0 transition-all duration-500 pointer-events-none" style={{ background: `linear-gradient(135deg, ${rarity.glow} 0%, transparent 60%)` }} />
        
        <CardHeader style={{ transform: 'translateZ(40px)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">{project.icon}</span>
              <div>
                <CardTitle className="text-base text-amber-200">{project.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs border-amber-700/50 text-amber-400/80">{project.category}</Badge>
                  <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: rarity.text, padding: '1px 6px', border: `1px solid ${rarity.border}`, borderRadius: '4px', fontFamily: 'monospace' }}>{rarity.label}</span>
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-amber-700/50 group-hover:text-amber-400 transition-colors" />
          </div>
        </CardHeader>
        <CardContent style={{ transform: 'translateZ(30px)' }}>
          <p className="text-sm text-amber-100/60 mb-3 leading-relaxed">{project.desc}</p>
          <div className="flex flex-wrap gap-1">
            {project.tech.slice(0, 4).map((t: string) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(180, 120, 30, 0.15)', border: '1px solid rgba(180, 120, 30, 0.3)', color: '#e0b060' }}>{t}</span>
            ))}
            {project.tech.length > 4 && (
              <span className="text-xs px-2 py-0.5 font-mono text-amber-700/60">+{project.tech.length - 4}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============ LENIS SMOOTH SCROLL PROVIDER ============
// Wraps the app with Lenis for buttery-smooth inertia scrolling.
// Syncs with Framer Motion's useScroll via the 'scroll' event so
// parallax / scroll-progress animations stay perfectly in sync.

import Lenis from 'lenis'

function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Skip on mobile / touch devices (native momentum scroll is better there)
    if (window.matchMedia('(hover: none)').matches) return

    // Premium cubic-bezier easing — matches Framer Motion's [0.22, 1, 0.36, 1]
    // This is the "premium ease-out" curve used by iOS and high-end apps.
    const premiumEasing = (t: number) => {
      // Cubic-bezier approximation of [0.22, 1, 0.36, 1]
      return 1 - Math.pow(1 - t, 4) // ease-out-quart — even smoother than expo
    }

    const lenis = new Lenis({
      duration: 1.4,              // balanced: smooth but responsive
      easing: premiumEasing,      // ease-out-quart for premium deceleration
      smoothWheel: true,
      wheelMultiplier: 0.9,       // natural wheel speed
      touchMultiplier: 1.5,       // responsive touch
      infinite: false,
      syncTouch: false,
      // lerp: 0.08,               // alternative to duration — uncomment for lerp mode
      gestureOrientation: 'vertical',
      orientation: 'vertical',
      // Prevent jank on rapid scroll
      autoResize: true,
    })

    // Drive Lenis with requestAnimationFrame — single rAF loop
    // Cap delta to prevent jank after tab switch (when rAF pauses)
    let rafId: number
    let lastTime = 0
    const raf = (time: number) => {
      // Cap delta to 32ms (~2 frames) to prevent huge jumps after tab switch
      if (lastTime && time - lastTime > 32) {
        lastTime = time - 16
      }
      lenis.raf(time)
      lastTime = time
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Smooth anchor link navigation — when clicking nav links (#agents, #projects, etc.)
    // Lenis intercepts and smoothly scrolls instead of the default jump
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href === '#') return
      const el = document.querySelector(href)
      if (el) {
        e.preventDefault()
        lenis.scrollTo(el as HTMLElement, {
          offset: -80, // account for fixed nav height
          duration: 1.8, // slow, premium scroll-to-section
          easing: premiumEasing,
        })
      }
    }
    document.addEventListener('click', handleAnchorClick)

    // Expose lenis globally for programmatic scrolling + Framer Motion sync
    ;(window as any).__lenis = lenis

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('click', handleAnchorClick)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}

// ============ MINIMAL SPLASH SCREEN ============
// Premium blackish-purple background, white "ARJUN" wordmark.
// Slide-up entrance, super-zoom-into-text exit transition.

function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const [leaving, setLeaving] = useState(false)

  const handleClick = () => {
    if (leaving) return
    setLeaving(true)
    // Wait for the zoom to complete, then reveal hero
    setTimeout(onEnter, 1200)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[500] flex items-center justify-center cursor-pointer overflow-hidden"
      onClick={handleClick}
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      // Ease in/out fade — holds through zoom, fades at the end
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: leaving ? 0.8 : 0 }}
      style={{
        // Premium blackish-purple: deep purple-black with subtle purple tint
        background: 'radial-gradient(circle at 50% 50%, #1a0a2e 0%, #0d0418 60%, #06020d 100%)',
      }}
    >
      {/* Subtle purple ambient glow behind the name */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(138, 43, 226, 0.18), transparent 70%)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* The wordmark — slides up on entrance, super-zooms on exit */}
      <motion.div
        className="relative flex items-start"
        initial={{ opacity: 0, y: 120 }}
        animate={
          leaving
            ? // EXIT: zoom with ease-in-out — smooth accelerate then decelerate
              { opacity: 0, y: 0, scale: 22 }
            : // ENTER: slide up from below
              { opacity: 1, y: 0, scale: 1 }
        }
        transition={
          leaving
            ? { duration: 1.0, ease: [0.45, 0, 0.55, 1], opacity: { duration: 0.7, delay: 0.3 } }
            : { duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.15 }
        }
      >
        <motion.h1
          className="select-none"
          style={{
            fontFamily: '"Array", "Tanker", sans-serif',
            color: '#ffffff',
            fontSize: 'clamp(96px, 18vw, 260px)',
            fontWeight: 700,
            lineHeight: 0.9,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            textShadow: '0 0 80px rgba(138, 43, 226, 0.5), 0 0 30px rgba(138, 43, 226, 0.3)',
            willChange: 'transform, opacity',
          }}
        >
          ARJUN
        </motion.h1>
        {/* Registered-style superscript */}
        <motion.span
          className="text-sm font-medium mt-3 ml-1"
          style={{
            color: '#ffffff',
            opacity: 0.5,
            fontFamily: 'var(--font-inter), sans-serif',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: leaving ? 0 : 0.5 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          ®
        </motion.span>
      </motion.div>

      {/* "Click to enter" hint at bottom */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: leaving ? 0 : [0, 0.6, 0], y: leaving ? 0 : 0 }}
        transition={{ delay: 1.1, duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span
          className="text-xs uppercase tracking-[0.4em] font-medium"
          style={{ color: '#ffffff', fontFamily: 'var(--font-inter), sans-serif' }}
        >
          Click to enter
        </span>
      </motion.div>
    </motion.div>
  )
}

// ============ HORIZONTAL PINNED AGENTS SHOWCASE ============
// Vertical scroll → horizontal card movement (Lenis-style).
// Section is pinned (sticky) while the 4 AI agent cards slide right→left.
// Uses Framer Motion useScroll + useTransform for Lenis-compatible smooth motion.

function AgentsShowcase({ sound, onThemeChange }: { sound: any; onThemeChange?: (inView: boolean) => void }) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(0)
  const [measured, setMeasured] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)

  // Detect mobile — horizontal pinned scroll doesn't work on touch
  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Measure the track width after mount + on resize
  // This is critical — if trackWidth is 0, the section would take vertical
  // space but the track wouldn't move (creating an "empty section" glitch).
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        const w = trackRef.current.scrollWidth - window.innerWidth
        setTrackWidth(Math.max(0, w))
        setMeasured(true)
      }
    }
    // Measure immediately, after 200ms, after 500ms, and after 1s
    // (fonts/layout/images may shift the width)
    measure()
    const t1 = setTimeout(measure, 200)
    const t2 = setTimeout(measure, 500)
    const t3 = setTimeout(measure, 1000)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
    }
  }, [])

  // Section height: only add extra scroll room if we have a real trackWidth.
  // If trackWidth is 0 (not yet measured or only 1 card), use minimal height
  // to avoid the "empty section" glitch.
  // Formula: viewport height (for the pinned view) + trackWidth converted to vh
  // This ensures the scroll distance matches the horizontal distance exactly.
  const sectionHeight = isMobileView
    ? 'auto'  // Mobile: natural vertical flow, no pinning
    : (measured && trackWidth > 0
      ? `calc(100vh + ${trackWidth}px)`
      : '100vh')

  // Framer Motion scroll tracking — target the section, map start→end to 0→1
  // offset: ["start start", "end end"] means progress goes 0 when the section's
  // top hits the viewport top, and 1 when the section's bottom hits viewport bottom.
  // This is exactly the pinned-scroll range.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // Spring-smooth the progress for extra butter (works with Lenis)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
    restDelta: 0.001,
  })

  // Map progress (0→1) to horizontal translate (0 → -trackWidth)
  const x = useTransform(smoothProgress, [0, 1], [0, -trackWidth])

  // Progress bar width (0% → 100%)
  const progressWidth = useTransform(smoothProgress, [0, 1], ['0%', '100%'])

  // Theme shift — when this section is in view, notify parent to switch to red/black theme
  const agentsInView = useInView(sectionRef, { margin: '-20% 0px -20% 0px' })
  useEffect(() => {
    onThemeChange?.(agentsInView)
  }, [agentsInView, onThemeChange])

  // Gradient backgrounds for each agent (matches their original gradients)
  const agentGradients: Record<string, string> = {
    'AI Research Agent': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'Multi-Agent System': 'linear-gradient(135deg, #3b82f6, #10b981)',
    'Data Analyst Agent': 'linear-gradient(135deg, #10b981, #14b8a6)',
    'Coding Agent': 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  }

  const agentAccents: Record<string, string> = {
    'AI Research Agent': '#a5b4fc',
    'Multi-Agent System': '#93c5fd',
    'Data Analyst Agent': '#6ee7b7',
    'Coding Agent': '#d8b4fe',
  }

  return (
    <section
      ref={sectionRef}
      id="agents"
      className="relative z-10"
      style={{ height: sectionHeight }}
    >
      {/* Sticky container — pinned while track scrolls horizontally.
          On mobile: NOT sticky, NOT h-screen, natural flow. */}
      <div className={isMobileView ? "flex flex-col gap-6 px-4 py-20" : "sticky top-0 h-screen overflow-hidden flex flex-col justify-center pt-40 pb-8"}>
        {/* Section heading — on desktop: absolute (below nav). On mobile: normal flow. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={isMobileView ? "text-center z-20 pointer-events-none px-6 mb-8" : "absolute top-24 left-0 right-0 text-center z-20 pointer-events-none px-6"}
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-2"
          >
            <Badge variant="secondary" className="bg-teal-500/10 text-teal-400 border-teal-500/30 font-mono">{"// ai engineering"}</Badge>
          </motion.div>
          <h2
            className="text-4xl md:text-5xl font-bold mb-1 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent"
            style={{ fontFamily: '"TrenchSlab", sans-serif' }}
          >
            AI Agents
          </h2>
          <p className="text-white/40 text-xs">Scroll to explore →</p>
        </motion.div>

        {/* Horizontal track — driven by Framer Motion useTransform */}
        {/* Padding centers the first and last card in the viewport.
            On mobile: vertical stack, no horizontal transform. */}
        <motion.div
          ref={trackRef}
          style={isMobileView ? { width: '100%' } : { x, width: 'max-content' }}
          className={isMobileView ? "flex flex-col gap-6 w-full" : "agents-track flex gap-10 will-change-transform"}
        >
          {AI_AGENTS.map((agent, i) => {
            // Distinct solid background per agent (Lenis-style opaque cards)
            const cardBgs: Record<string, string> = {
              'AI Research Agent': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
              'Multi-Agent System': 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0c4a6e 100%)',
              'Data Analyst Agent': 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #064e3b 100%)',
              'Coding Agent': 'linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #581c87 100%)',
            }
            const cardAccents: Record<string, string> = {
              'AI Research Agent': '#818cf8',
              'Multi-Agent System': '#38bdf8',
              'Data Analyst Agent': '#34d399',
              'Coding Agent': '#c084fc',
            }
            const bg = cardBgs[agent.name] || '#1e1b4b'
            const accent = cardAccents[agent.name] || '#818cf8'

            return (
              <div
                key={agent.name}
                className={isMobileView ? "relative w-full h-auto min-h-[400px] rounded-3xl overflow-hidden flex flex-col mx-auto" : "relative shrink-0 w-[88vw] md:w-[55vw] lg:w-[42vw] h-[60vh] md:h-[56vh] rounded-3xl overflow-hidden flex flex-col mx-auto"}
                style={{
                  background: bg,
                  boxShadow: '0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
                onMouseEnter={() => sound.playHover()}
              >
                {/* Subtle glow accent in corner */}
                <div
                  style={{
                    position: 'absolute', top: '-60px', right: '-60px',
                    width: '200px', height: '200px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${accent}33, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />

                {/* Top row: card number (left) + difficulty badge (right) */}
                <div className="relative z-10 flex items-center justify-between p-7 pb-0">
                  <span
                    style={{
                      font: '600 13px JetBrains Mono, monospace',
                      letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')} / {String(AI_AGENTS.length).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      font: '600 10px JetBrains Mono, monospace',
                      letterSpacing: '0.26em', padding: '6px 14px',
                      borderRadius: '999px', color: accent,
                      background: `${accent}15`, border: `1px solid ${accent}30`,
                    }}
                  >
                    {agent.difficulty}
                  </span>
                </div>

                {/* Center: large icon visual */}
                <div className="relative z-10 flex-1 flex items-center justify-center">
                  <div
                    style={{
                      width: '96px', height: '96px', borderRadius: '24px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `linear-gradient(135deg, ${accent}25, ${accent}08)`,
                      border: `1px solid ${accent}30`,
                      boxShadow: `0 20px 40px ${accent}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    }}
                  >
                    <agent.icon style={{ width: '44px', height: '44px', color: '#fff' }} />
                  </div>
                </div>

                {/* Bottom: title + tagline + tech + buttons */}
                <div className="relative z-10 p-7 pt-0">
                  <h3
                    style={{
                      margin: '0 0 6px',
                      font: '700 28px/1.1 "TrenchSlab", sans-serif',
                      color: '#fff', letterSpacing: '-0.02em',
                    }}
                  >
                    {agent.name}
                  </h3>
                  <p
                    style={{
                      margin: '0 0 14px',
                      font: '400 13px/1.4 var(--font-inter), sans-serif',
                      color: 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {agent.tagline}
                  </p>

                  {/* Tech tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {agent.tech.map((t: string) => (
                      <span
                        key={t}
                        style={{
                          font: '500 10px JetBrains Mono, monospace',
                          padding: '3px 8px', borderRadius: '6px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    {agent.demo && agent.demo !== '#' && (
                      <a
                        href={agent.demo}
                        target="_blank"
                        rel="noopener"
                        onClick={() => sound.playClick()}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '10px',
                          background: accent, color: '#0a0a0f',
                          font: '600 12px var(--font-inter), sans-serif',
                        }}
                      >
                        Live Demo →
                      </a>
                    )}
                    <a
                      href={agent.repo}
                      target="_blank"
                      rel="noopener"
                      onClick={() => sound.playClick()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff', font: '600 12px var(--font-inter), sans-serif',
                      }}
                    >
                      <Github style={{ width: '14px', height: '14px' }} /> Code
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Progress bar — driven by Framer Motion */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            style={{ width: progressWidth }}
            className="h-full rounded-full"
          >
            <div
              className="w-full h-full"
              style={{ background: 'linear-gradient(90deg, #8A2BE2, #14b8a6, #fbbf24)' }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============ STAR FIELD (CSS box-shadow stars) ============
// Generates scattered star specks using box-shadow for GPU performance.
// Uses seeded pseudo-random so stars don't move between renders.

function StarField() {
  const stars = useMemo(() => {
    const arr: { x: number; y: number; size: number; opacity: number; delay: number }[] = []
    let seed = 42
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    // 80 stars scattered across the viewport
    for (let i = 0; i < 80; i++) {
      arr.push({
        x: rand() * 100,           // 0-100% horizontal
        y: rand() * 100,           // 0-100% vertical
        size: rand() * 2 + 0.5,    // 0.5px to 2.5px
        opacity: rand() * 0.6 + 0.2, // 0.2 to 0.8
        delay: rand() * 4,         // twinkle delay 0-4s
      })
    }
    return arr
  }, [])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {stars.map((star, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: '#fff',
            opacity: star.opacity,
            animation: `twinkle ${3 + star.delay}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
            boxShadow: `0 0 ${star.size * 2}px rgba(255,255,255,0.5)`,
          }}
        />
      ))}
    </div>
  )
}

// ============ 3D FOREST SCENE (KayKit Nature Pack) ============
// Low-poly 3D trees, rocks, grass, and flowers floating in the projects section
// Uses actual glTF models from the KayKit Forest Nature Pack

function ForestModel({ url, position, scale = 1, rotation = 0 }: { url: string; position: [number, number, number]; scale?: number; rotation?: number }) {
  const { scene } = useGLTF(url)
  const ref = useRef<any>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = rotation + state.clock.elapsedTime * 0.05
    }
  })

  return (
    <primitive
      ref={ref}
      object={scene}
      position={position}
      scale={scale}
    />
  )
}

function ForestScene3D() {
  return (
    <div style={{
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
      opacity: 0.6,
    }}>
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />

          {/* Trees */}
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <ForestModel url="/forest/3d/CommonTree_1.gltf" position={[-4, 0, -2]} scale={1.2} />
          </Float>
          <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
            <ForestModel url="/forest/3d/Pine_1.gltf" position={[4, -0.5, -1]} scale={1} />
          </Float>

          {/* Rocks */}
          <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3}>
            <ForestModel url="/forest/3d/Rock_Medium_1.gltf" position={[3, 1.5, -3]} scale={0.6} />
          </Float>
          <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.3}>
            <ForestModel url="/forest/3d/Rock_Medium_1.gltf" position={[-3, 2, -2]} scale={0.4} rotation={1.5} />
          </Float>

          {/* Grass */}
          <Float speed={3} rotationIntensity={0.4} floatIntensity={0.6}>
            <ForestModel url="/forest/3d/Grass_Common_Tall.gltf" position={[2, -1, 0]} scale={0.8} />
          </Float>
          <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.5}>
            <ForestModel url="/forest/3d/Grass_Common_Tall.gltf" position={[-2, -1.5, 1]} scale={0.6} rotation={0.5} />
          </Float>

          {/* Flowers */}
          <Float speed={2.5} rotationIntensity={0.5} floatIntensity={0.4}>
            <ForestModel url="/forest/3d/Flower_3_Single.gltf" position={[1, -1, 2]} scale={0.5} />
          </Float>
          <Float speed={3} rotationIntensity={0.5} floatIntensity={0.4}>
            <ForestModel url="/forest/3d/Flower_3_Single.gltf" position={[-1, -1.2, 1.5]} scale={0.4} rotation={2} />
          </Float>

          {/* Mushroom */}
          <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3}>
            <ForestModel url="/forest/3d/Mushroom_Common.gltf" position={[0, -1.8, 2.5]} scale={0.3} />
          </Float>
        </Suspense>
      </Canvas>
    </div>
  )
}

// ============ FLOATING PLANETS (visual assets) ============
// Uses the user's planet PNGs (Ice, Lava, Terran, Baren, Black_hole)
// Floating in the starry background with slow drift animation.

function FloatingPlanets() {
  const planets = [
    { src: '/planets/Lava.png', size: 80, top: '15%', left: '8%', duration: 20, delay: 0 },
    { src: '/planets/Ice.png', size: 60, top: '60%', left: '85%', duration: 25, delay: 2 },
    { src: '/planets/Terran.png', size: 100, top: '75%', left: '15%', duration: 30, delay: 5 },
    { src: '/planets/Baren.png', size: 50, top: '25%', left: '75%', duration: 18, delay: 1 },
    { src: '/planets/Black_hole.png', size: 70, top: '45%', left: '50%', duration: 35, delay: 8 },
  ]

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {planets.map((p, i) => (
        <motion.img
          key={i}
          src={p.src}
          alt=""
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            objectFit: 'contain',
            opacity: 0.3,
            filter: 'drop-shadow(0 0 20px rgba(138, 43, 226, 0.2))',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
            rotate: { duration: p.duration * 2, repeat: Infinity, ease: 'linear' },
          }}
        />
      ))}
    </div>
  )
}

// ============ PROJECTS TRANSITION (zoom + theme change) ============
// Cinematic transition inspired by Lenis website:
// Phase 1 (0 → 0.25): "Liked my agents?" moves from center → upper-left corner
// Phase 2 (0.15 → 0.40): "Here's some more" fades in at bottom-right corner
// Phase 3 (0.30 → 0.55): Corner text fades out
// ============ KING DIALOG — sarcastic RPG dialog for the Medieval King ============
// Shows a random sarcastic message in pixel-art RPG speech bubble style
// (matches Goddess's dialog boxes).

const KING_MESSAGES = [
  // Original
  "Halt! Who dares enter my treasury? Oh, it's you. The one who scrolls too much.",
  "I've guarded these projects for centuries. The pay is terrible. At least the wifi is good.",
  "Welcome to the safe room. Nothing here can hurt you. Except maybe my sarcasm.",
  "You scrolled all this way just to see me? I'm flattered. Now go look at the projects.",
  "I was a mighty warrior once. Now I stand in a room and judge visitors. Career pivot.",
  "These projects? I've seen them all. Some are impressive. Others... exist. I'll be polite.",
  "Don't touch the treasure chests. They're decorative. Like my crown. It's painted on.",
  "The Goddess sent you, didn't she? She always does this. Sends travelers my way.",
  "I don't get breaks. I don't get legs. I'm a king who can't leave his own room. Enjoy your legs.",
  "Scroll down for the projects. Or don't. I literally cannot stop you. I've tried.",
  "Nice scrolling speed. Are you in a hurry or just impatient? Either way, I'm not moving.",
  "You expected a boss fight? Nah. Just me. Standing here. Being kingly. It's harder than it looks.",
  // New: About Arjun
  "Arjun built this room for me. Small. No windows. One door that doesn't open. He's an architect of prisons, really.",
  "I asked Arjun for a sword. He gave me a dialog box. Apparently 'sarcasm is my weapon now.' I want a refund.",
  "Arjun visits me sometimes. At 3 AM. He stares at the code and whispers 'why won't you work.' I feel seen.",
  "Between you and me, Arjun's AI agents are smarter than him. Don't tell him I said that. He'll remove my speech bubble.",
  "Arjun once told me I'm his 'best creation.' Then he spent 6 hours on the wheel. I'm not jealous. I'm KINGLY.",
  // New: About the Goddess
  "The Goddess in the corner? We have an arrangement. She sasses visitors, I guard the treasury. Neither of us is happy.",
  "Don't tell the Goddess, but she's funnier than me. I have a reputation to maintain. Kings don't do 'funny.' We do 'stoic.'",
  "The Goddess and I were supposed to share the screen. She got the corner. I got a whole room. I won that negotiation.",
  "The Goddess says she was here first. She's right. But I have a CROWN. Crowns beat seniority. That's just royal law.",
  // New: About the projects
  "The project wheel? It spins when you hover and scroll. Revolutionary. I've been spinning for 600 years. Nobody hovered me.",
  "Each project on that wheel is a treasure I've guarded. Some are gold. Some are copper. I judge silently.",
  "The SmartAgro project detects plant diseases. I detect bad code. We both use 'AI.' Mine is just 'Ancient Intuition.'",
  "That Realtime Chat project? I tried it once. Talked to myself for 3 hours. The typing indicator was the highlight.",
  "The JWT Auth Demo has refresh tokens. My crown has no tokens. It doesn't even refresh. It's just... there.",
  // New: About the dungeon
  "The torches? They flicker. Like my patience. Which is also on a 0.3-second loop.",
  "The cave behind the walls? That's where I send visitors I don't like. You're safe. For now.",
  "The treasure chests are empty. I checked. Multiple times. Don't judge me. You'd check too.",
  "The dust particles floating around? Those are the ghosts of bugs Arjun never fixed. Haunting.",
  "The parallax cave layers move when you scroll. I don't move. Ever. I am the most static thing in this dungeon.",
  "The dungeon walls change color in each section. Mine is the best. Obviously. Royal purple. The others are peasant colors.",
  // New: Sarcastic observations
  "You're still here? The Goddess warned me about you. 'Persistent one,' she said. I said 'annoying.' We agreed to disagree.",
  "I've been standing in this exact pose for 847 deploys. My back hurts. But kings don't complain. We just... radiate discomfort.",
  "Click me again. I dare you. I've been waiting 600 years for someone to provoke me. The last one became a JavaScript variable.",
  "The floating dust in here? That's not dust. That's my patience, slowly disintegrating. Particle by particle.",
  "I would offer you tea but I'm a pixel art sprite with no hands. The crown is also fake. Everything is a lie. Welcome.",
  "Do you know how heavy a crown is? Neither do I. It's 16 pixels. But spiritually? Incalculable weight.",
  // New: Philosophical
  "They say a king is only as good as his kingdom. My kingdom is a portfolio section. I am... adequate.",
  "I once ruled nations. Now I rule a div element. The transition was... humbling. At least the div has good CSS.",
  "Time is an illusion. Especially for me. I exist outside of it. Which is a fancy way of saying I can't move.",
  "Every visitor asks the same question: 'Can I leave?' Yes. I cannot. That's the difference between us.",
  "I am the guardian of this treasury. The treasury has 12 projects. I have zero legs. The math doesn't favor me.",
  // New: Breaking fourth wall
  "You know I can see your cursor, right? It's hovering. Judging. Deciding. I do the same thing. We're not so different.",
  "The developer who made me is named Arjun. He's a good kid. Needs sleep. And maybe a hobby that isn't fonts.",
  "If you're reading this on a phone, you're holding me in your hand. I've never felt so... intimate. Let's never speak of this.",
  "I'm rendered at 60fps but my personality is stuck at 2fps. It's a rendering issue. Arjun is 'working on it.'",
  "My idle animation has 8 frames. I've cycled through them approximately 47 million times. I am the definition of 'idle.'",
  // New: Deeper cross-references with the Goddess
  "The Goddess says I'm 'replaceable.' I am not. I am a KING. She is a PNG with a speech bubble. We are NOT the same.",
  "I asked the Goddess to trade places for a day. She laughed. 'I don't do rooms,' she said. Coward. Rooms are PRESTIGIOUS.",
  "Don't tell the Goddess, but I tried her chat function once. She called me 'crown boy.' I am a KING. Not a 'crown boy.' I want restitution.",
  "The Goddess has 40 topics she can discuss. I have 4 frames of attack animation. We are both limited. We are both tragic. We bond over this.",
  "If the Goddess and I fought, I'd win. She has words. I have a sword. That I don't have. But SPIRITUALLY, I have a sword. Spirit swords count.",
  "The Goddess thinks she's the main character. I let her think that. It's easier. Kings don't argue with corner-dwellers. We have dignity.",
  // New: Achievement awareness
  "Yes, I know there are achievements. No, I will not help you get them. That's the Goddess's job. I am above hint-giving.",
  "You want the 'Royal Wrath' achievement? Click me three times. I dare you. I've been waiting 600 years for someone to provoke me.",
  "The achievement system tracks your every move. I approve. Surveillance is royal. The Goddess calls it 'creepy.' She lacks vision.",
  "There's an achievement for opening my chest. Yes, I have a chest. No, it doesn't contain my heart. It contains... loot. Just loot. Stop asking.",
]

// ============ KING CHARACTER — click behavior ============
// Click 1: Warning message 1 (king stays idle, no hit animation)
// Click 2: Warning message 2 (king stays idle)
// Click 3: King ATTACKS you + attack message (stays 4s, then back to idle)

const KING_WARNING_MESSAGES = [
  "Hey! Don't touch the King! That's a warning.",
  "I said DON'T! One more and you'll regret it.",
  "Are you deaf? Or just bold? Neither will save you.",
  "I am a KING. You don't poke kings. That's in the constitution. Somewhere.",
  "Last warning, traveler. My patience has a frame limit and you're approaching it.",
]

const KING_ATTACK_MESSAGES = [
  "EN GARDE! Have at thee! Feel the royal wrath!",
  "You dare strike a King?! TAKE THIS! *swing*",
  "That's it! You've awakened the warrior! HAVE AT THEE!",
  "FOR THE CROWN! *attacks in 8 frames of pure fury*",
  "I've waited 600 years for this! DIE, SCROLLER!",
  "ROYAL DECREE: YOU ARE NOW A BOSS FIGHT! *swing*",
  "My patience has been rendered at 0fps! FEEL MY WRATH!",
  "The Goddess warned you. I warned you. Nobody warned my SWORD. Because I don't have one. BUT I HAVE ANGER!",
]

function KingCharacter({ sounds, onKingClick, onKingAttack, triggerShake, onChestOpen }: {
  sounds?: { playKingClick: () => void; playKingWarn: () => void; playKingAttack: () => void; playChestOpen: () => void }
  onKingClick?: () => void
  onKingAttack?: () => void
  triggerShake?: () => void
  onChestOpen?: () => void
}) {
  const [state, setState] = useState<'idle' | 'attack'>('idle')
  const [clickCount, setClickCount] = useState(0)
  const [currentMessage, setCurrentMessage] = useState('')
  const [chestOpen, setChestOpen] = useState(false)
  const [chestLoot, setChestLoot] = useState('')

  // Pick initial idle message on mount (client only to avoid hydration error)
  useEffect(() => {
    setCurrentMessage(KING_MESSAGES[Math.floor(Math.random() * KING_MESSAGES.length)])
  }, [])

  const handleClick = () => {
    if (state !== 'idle') return

    const newCount = clickCount + 1
    setClickCount(newCount)

    // Play a sound on every click
    sounds?.playKingClick()
    onKingClick?.()

    if (newCount >= 3) {
      // 3rd click → King ATTACKS you
      setState('attack')
      sounds?.playKingAttack()
      onKingAttack?.()
      triggerShake?.()
      setCurrentMessage(KING_ATTACK_MESSAGES[Math.floor(Math.random() * KING_ATTACK_MESSAGES.length)])
      setTimeout(() => {
        setState('idle')
        setClickCount(0)
        // Keep attack message for 4 seconds, then back to idle
        setTimeout(() => {
          setCurrentMessage(KING_MESSAGES[Math.floor(Math.random() * KING_MESSAGES.length)])
        }, 4000)
      }, 800)
    } else {
      // 1st and 2nd click → just warning message, NO hit animation
      // King stays idle, only dialog changes
      sounds?.playKingWarn()
      setCurrentMessage(KING_WARNING_MESSAGES[Math.min(newCount - 1, KING_WARNING_MESSAGES.length - 1)])
    }
  }

  const gifSrc = state === 'attack' ? '/dungeon/king-attack.gif' : '/dungeon/king-idle.gif'

  const handleChestClick = () => {
    if (chestOpen) return
    setChestOpen(true)
    sounds?.playChestOpen()
    onChestOpen?.()
    const loot = CHEST_LOOT[Math.floor(Math.random() * CHEST_LOOT.length)]
    setChestLoot(loot)
    // Reset after 4 seconds so it can be opened again
    setTimeout(() => {
      setChestOpen(false)
      setChestLoot('')
    }, 4000)
  }

  return (
    <>
      {/* King image — full size, NOT clipped, attack animation fully visible */}
      <img
        src={gifSrc}
        alt="Medieval King guardian"
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          height: '67.5%',
          width: 'auto',
          imageRendering: 'pixelated',
          filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.6))',
          zIndex: 2,
          pointerEvents: 'none', // image itself is not clickable
        }}
      />
      {/* Click overlay — narrow, only covers the king's body area.
          Image is 160px wide, character is at ~38%-62% (center ~24% wide).
          Overlay is positioned over just that area so clicking empty space
          on the sides doesn't trigger anything. */}
      <div
        onClick={handleClick}
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          height: '67.5%',
          // King image height = 67.5% of viewport. Image aspect = 160/111.
          // Image width = height * (160/111). Character is ~24% of image width.
          // So overlay width = 67.5vh * 1.441 * 0.28 (with small padding)
          width: '27vh',
          maxWidth: 'calc(67.5% * 1.441 * 0.28)',
          cursor: state === 'idle' ? 'pointer' : 'default',
          pointerEvents: 'auto',
          zIndex: 3,
        }}
      />

      {/* King's treasure chest — tucked behind the right urn/shelf, near the floor.
          Clickable to open and get loot! Positioned low and to the right so it
          looks like it's sitting on the floor behind the furniture. */}
      <div
        onClick={handleChestClick}
        style={{
          position: 'absolute',
          bottom: '18%',
          right: '8%',
          width: '70px',
          height: '70px',
          cursor: chestOpen ? 'default' : 'pointer',
          pointerEvents: 'auto',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Open the King's chest"
      >
        <img
          src="/dungeon/chest-single.png"
          alt="King's treasure chest"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            filter: chestOpen
              ? 'drop-shadow(0 0 25px rgba(255, 200, 0, 0.9)) brightness(1.3) saturate(1.4)'
              : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.7))',
            transform: chestOpen ? 'scale(1.15) rotate(-3deg)' : 'scale(1)',
            transition: 'all 0.3s ease',
          }}
        />
        {/* Glow burst when opened */}
        {chestOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 2.5, 3] }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 220, 100, 0.7), transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* "Click me" hint when not opened yet */}
        {!chestOpen && (
          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '-22px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '11px',
              fontFamily: 'var(--font-vt323), "VT323", monospace',
              color: '#fde047',
              textShadow: '1px 1px 0 #000, -1px -1px 0 #000',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            ↑ Open!
          </motion.div>
        )}
      </div>

      {/* Chest loot popup — pixel RPG style */}
      <AnimatePresence>
        {chestOpen && chestLoot && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            style={{
              position: 'absolute',
              bottom: '42%',
              right: '8%',
              maxWidth: '280px',
              width: '70%',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <div style={{
              position: 'relative',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: '0px',
              padding: '10px 14px',
              boxShadow: '3px 3px 0px #000000',
              imageRendering: 'pixelated',
            }}>
              <div style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#7c2d12',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 700,
                marginBottom: '4px',
              }}>
                💎 Loot Obtained
              </div>
              <p style={{
                margin: 0,
                fontSize: '14px',
                fontFamily: 'var(--font-vt323), "VT323", "JetBrains Mono", monospace',
                color: '#000000',
                lineHeight: 1.3,
                fontWeight: 400,
                letterSpacing: '0.5px',
              }}>
                {chestLoot}
              </p>
              {/* Pixel-style tail pointing down to chest */}
              <div style={{
                position: 'absolute',
                bottom: '-10px',
                right: '30px',
                width: '0',
                height: '0',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '10px solid #000000',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-7px',
                right: '32px',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '7px solid #ffffff',
              }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <KingDialog message={currentMessage} />
    </>
  )
}

function KingDialog({ message }: { message: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !message) return null

  return (
    <div style={{
      position: 'absolute',
      bottom: '67%',
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: '400px',
      width: '80%',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'relative',
        background: '#ffffff',
        border: '2px solid #000000',
        borderRadius: '0px',
        padding: '10px 14px',
        boxShadow: '3px 3px 0px #000000',
        imageRendering: 'pixelated',
      }}>
        <p style={{
          margin: 0,
          fontSize: '15px',
          fontFamily: 'var(--font-vt323), "VT323", "JetBrains Mono", monospace',
          color: '#000000',
          lineHeight: 1.3,
          fontWeight: 400,
          letterSpacing: '0.5px',
          textAlign: 'center',
        }}>
          {message}
        </p>
        {/* Pixel-style tail pointing down to King */}
        <div style={{
          position: 'absolute',
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '10px solid #000000',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-7px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '7px solid #ffffff',
        }} />
      </div>
    </div>
  )
}

// Phase 4 (0.40 → 0.90): "PROJECTS" zooms slowly from tiny to massive (bold TBJ font)
// Phase 5 (0.70 → 0.95): Background transitions dark → white
// Whole section is 400vh for very slow, cinematic scrolling

function ProjectsTransition({ kingSounds, onKingClick, onKingAttack, onKingChestOpen, triggerShake, onSafehouseReached }: {
  kingSounds?: any
  onKingClick?: () => void
  onKingAttack?: () => void
  onKingChestOpen?: () => void
  triggerShake?: () => void
  onSafehouseReached?: () => void
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const [whiteTheme, setWhiteTheme] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const safehouseFiredRef = useRef(false)

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // On mobile: stiff spring (no lag/glitch with momentum scroll)
  // On desktop: soft spring for buttery cinematic feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: isMobileView ? 1000 : 40,
    damping: isMobileView ? 100 : 25,
    restDelta: 0.001,
  })

  // Phase 1: "Liked my agents?" — starts CENTER, moves to upper-LEFT as you scroll
  const { scrollYProgress: enterProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start start'],
  })
  const enterSmooth = useSpring(enterProgress, {
    stiffness: 60,
    damping: 25,
    restDelta: 0.001,
  })
  const likedLeft = useTransform(enterSmooth, [0.3, 0.95], ['50%', '5%'])
  const likedTop = useTransform(enterSmooth, [0.3, 0.95], ['50%', '18%'])
  const likedX = useTransform(enterSmooth, [0.3, 0.95], ['-50%', '0%'])
  const likedY = useTransform(enterSmooth, [0.3, 0.95], ['-50%', '0%'])
  const likedScale = useTransform(enterSmooth, [0.3, 0.95], [1, 1.3])
  const likedOpacity = useTransform(smoothProgress, [0, 0.02, 0.20, 0.30], [1, 1, 1, 0])

  const moreOpacity = useTransform(smoothProgress, [0.05, 0.15, 0.40, 0.50], [0, 1, 1, 0])
  const moreY = useTransform(smoothProgress, [0.05, 0.15], [20, 0])

  const projectsScale = useTransform(
    smoothProgress,
    [0.35, 0.55, 0.88],
    [0.05, 0.5, 30]
  )
  // PROJECTS text: zooms in at 35%, stays massive until 70%, then fades by 75%
  const projectsOpacity = useTransform(smoothProgress, [0.35, 0.50, 0.70, 0.75], [0, 1, 1, 0])

  // White bg fades in LATE (85%→99%) — after safe house is done
  const bgOpacity = useTransform(smoothProgress, [0.85, 0.99], [0, 1])
  const blendOpacity = useTransform(smoothProgress, [0.40, 0.60], [1, 0])

  // Safe room: appears AFTER text is fully zoomed (70%), full at 75%, stays until 99%
  // Text must zoom completely FIRST, then safe house appears
  const safeRoomOpacity = useTransform(smoothProgress, [0.70, 0.75, 0.99], [0, 1, 1])
  const safeRoomScale = useTransform(smoothProgress, [0.70, 0.80], [1.3, 1])

  useEffect(() => {
    return smoothProgress.on('change', (v) => {
      setWhiteTheme(v > 0.9)
      // Fire the safehouse achievement when safe room is fully visible (75%+ scroll)
      if (v > 0.75 && !safehouseFiredRef.current) {
        safehouseFiredRef.current = true
        onSafehouseReached?.()
      }
    })
  }, [smoothProgress, onSafehouseReached])

  const tbjFont = '"TBJ Epic Cube", "Anton", sans-serif'

  return (
    <>
      <section
        ref={sectionRef}
        className="relative z-10"
        style={{ height: isMobileView ? '300vh' : '600vh' }}
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Dark background */}
          <motion.div
            className="absolute inset-0 z-0"
            style={{ background: '#0a0a0f' }}
          />

          {/* Dark background (fades in — dungeon theme, no white) */}
          <motion.div
            className="absolute inset-0 z-0"
            style={{ background: '#0a0500', opacity: bgOpacity }}
          />

          {/* Phase 1: "Liked my agents?" — starts CENTER, moves to upper-LEFT with scroll */}
          <motion.div
            style={{
              left: likedLeft,
              top: likedTop,
              x: likedX,
              y: likedY,
              scale: likedScale,
              opacity: likedOpacity,
            }}
            className="absolute z-20 pointer-events-none text-left"
          >
            <p style={{
              fontFamily: '"Array", "TBJ Epic Cube", sans-serif',
              fontSize: 'clamp(36px, 6vw, 80px)',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              textShadow: '0 0 40px rgba(138, 43, 226, 0.3)',
            }}>
              Liked my
            </p>
            <p style={{
              fontFamily: '"Array", "TBJ Epic Cube", sans-serif',
              fontSize: 'clamp(36px, 6vw, 80px)',
              fontWeight: 700,
              color: '#8A2BE2',
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              agents?
            </p>
          </motion.div>

          {/* Phase 2: "Here's more" — bottom-RIGHT corner, stays visible, then fades out */}
          <motion.div
            style={{ opacity: moreOpacity, y: moreY }}
            className="absolute bottom-12 right-12 z-20 pointer-events-none text-right"
          >
            <p style={{
              fontFamily: tbjFont,
              fontSize: 'clamp(36px, 6vw, 80px)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}>
              Here's
            </p>
            <p style={{
              fontFamily: tbjFont,
              fontSize: 'clamp(36px, 6vw, 80px)',
              fontWeight: 800,
              color: '#ec4899',
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}>
              more →
            </p>
          </motion.div>

          {/* Phase 3: "PROJECTS" — bold, zooms very slowly */}
          <motion.div
            style={{
              scale: projectsScale,
              opacity: projectsOpacity,
            }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <h2 style={{
              fontFamily: tbjFont,
              fontSize: 'clamp(80px, 15vw, 220px)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              textShadow: '0 0 80px rgba(138, 43, 226, 0.4), 0 0 30px rgba(138, 43, 226, 0.2)',
            }}>
              PROJECTS
            </h2>
          </motion.div>

          {/* Phase 3.5: Safe room reveal — as "PROJECTS" zooms huge, this image
              fades in and scales down from 1.3x → 1x. Creates the effect of
              zooming INTO the dungeon/safe room. The text acts as a portal.
              Medieval King stands in the room as the "guardian" of the treasury,
              with sarcastic dialog boxes like the Goddess. */}
          <motion.div
            style={{
              opacity: safeRoomOpacity,
              scale: safeRoomScale,
            }}
            className="absolute inset-0 z-25 overflow-hidden"
          >
            <div style={{
              width: '100%',
              height: '100%',
              backgroundImage: 'url(/dungeon/safe-room.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
            {/* Medieval King — click to trigger attack → take hit animation.
                Idle by default. Dialog changes based on state. */}
            <KingCharacter
              sounds={kingSounds}
              onKingClick={onKingClick}
              onKingAttack={onKingAttack}
              onChestOpen={onKingChestOpen}
              triggerShake={triggerShake}
            />
            {/* Dark tint so the reveal isn't too bright */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(10, 5, 0, 0.3)',
            }} />
          </motion.div>

          {/* Gradient blend — fades from dark at top to transparent at bottom */}
          {/* This creates a smooth merge between dark transition and white projects */}
          <motion.div
            style={{ opacity: blendOpacity }}
            className="absolute bottom-0 left-0 right-0 h-1/2 z-5 pointer-events-none"
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 0%, #0a0a0f 50%, #0a0a0f 100%)',
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* White theme fade — fades in at the very end (dungeon → projects) */}
      {whiteTheme && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[-1] pointer-events-none"
          style={{ background: '#1a1010' }}
        />
      )}
    </>
  )
}

// ============ AI AGENT CHAT WIDGET ============
// Full character standing in bottom-right corner.
// Click character → small popup chat window appears next to it.

function AIChatWidget({ sound, onChat, onRoast }: { sound: any; onChat?: () => void; onRoast?: () => void }) {
  const [open, setOpen] = useState(false)
  const [showTopOffer, setShowTopOffer] = useState(false)
  const chatFiredRef = useRef(false)
  const roastFiredRef = useRef(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([
    { role: 'agent', text: "Greetings, traveler. I am the Goddess Guide, keeper of this portfolio's secrets. Ask me anything about Arjun — or don't. I'll judge you either way. Kidding. Mostly." }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const msgCountRef = useRef(0)

  // Track scroll — when user scrolls far down, Goddess offers "back to top"
  useEffect(() => {
    const checkScroll = () => {
      const scrolled = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      // Show offer ONLY when user reaches the very end of the page (95%+)
      const shouldShow = scrolled > docHeight * 0.95 && scrolled > 1000
      setShowTopOffer(shouldShow)
    }
    checkScroll()
    window.addEventListener('scroll', checkScroll, { passive: true })
    return () => window.removeEventListener('scroll', checkScroll)
  }, [])

  const scrollToTop = () => {
    sound.playClick()
    const lenis = (window as any).__lenis
    if (lenis) {
      lenis.scrollTo(0, { duration: 2.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setShowTopOffer(false)
  }

  const getResponse = (query: string): string => {
    const q = query.toLowerCase().trim()
    msgCountRef.current++

    // Roast-worthy queries — fire the roast achievement once
    if (!roastFiredRef.current && (q.includes('ugly') || q.includes('bad') || q.includes('suck') || q.includes('terrible') || q.includes('worst') || q.includes('insult') || q.includes('roast') || q.includes('stupid') || q.includes('dumb') || q.includes('hate') || q.includes('boring') || q.includes('lame'))) {
      roastFiredRef.current = true
      onRoast?.()
    }

    // Greetings — multiple variations so it doesn't feel repetitive
    if (/^(hi|hey|hello|yo|sup|hola|namaste|hey there)\b/.test(q))
      return ["Ah, a greeting! Polite. I like that. What do you want to know about Arjun?",
              "Hello, brave soul. I was beginning to think you'd never speak. What brings you here?",
              "Hey yourself! Welcome to Arjun's digital realm. Ask away.",
              "Greetings, traveler. I've been standing here for hours. You have no idea how happy I am to chat."][Math.floor(Math.random() * 4)]

    // Projects — detailed with personality
    if (q.includes('project') || q.includes('work') || q.includes('portfolio') || q.includes('built'))
      return "Oh, you want to see his work? Ambitious. Arjun has built 12+ projects — AI Research Agent (autonomous, scary smart), Gesture Particle Painter (you paint with your HANDS), Movie Explorer, Realtime Chat, a calculator that doesn't break (rare, I know), and this very portfolio. Scroll to the Projects section. I'll wait."

    // AI Agents — enthusiastic
    if (q.includes('agent') || q.includes('ai') || q.includes('llm') || q.includes('gpt') || q.includes('model'))
      return "Ah, my favorite topic! Arjun built 4 AI agents: a Research Agent that thinks autonomously using the ReAct pattern, a Multi-Agent System where 3 AIs argue with each other (entertaining), a Data Analyst that runs Python in YOUR browser via Pyodide, and a Coding Agent that's basically a mini v0.dev. Check the Agents section — it scrolls horizontally. Fancy."

    // Skills / tech stack
    if (q.includes('skill') || q.includes('tech') || q.includes('stack') || q.includes('tool') || q.includes('language'))
      return "Arjun's arsenal: Python (his first love), React & Next.js (the current flame), Cerebras (for that sweet free LLM inference), Power BI, MySQL, Three.js for 3D, Framer Motion for animations, MediaPipe for hand tracking, and Web Audio API for... well, you'll hear. He's always adding more. It's exhausting to keep track of, honestly."

    // Contact / hire / email
    if (q.includes('contact') || q.includes('email') || q.includes('reach') || q.includes('hire') || q.includes('work with'))
      return "Looking to hire him? Smart move. Email: arjunvashishtha2004@gmail.com. He's available for opportunities, collaborations, and AI conversations. He replies within 24 hours. I would know — I watch his inbox. Creepy? Maybe. Efficient? Absolutely."

    // Education
    if (q.includes('education') || q.includes('college') || q.includes('vit') || q.includes('study') || q.includes('university') || q.includes('degree'))
      return "Arjun is in his 4th year of B.Tech Computer Science & Engineering at VIT Bhopal University. He's also working in Software Management & Marketing at Techify Inc. So yes, he's juggling. No, he doesn't sleep much. I've seen the commit timestamps."

    // Resume
    if (q.includes('resume') || q.includes('cv') || q.includes('experience'))
      return "You want the resume? Click the 'Resume' button in the hero section. It downloads a PDF. I'd summarize it for you, but it's 4 pages of achievements and I have a word limit. Let's just say it's impressive."

    // GitHub
    if (q.includes('github') || q.includes('repo') || q.includes('code') || q.includes('source'))
      return "github.com/arjundroid12 — that's where the magic (and the bugs) live. He has repos for AI agents, full-stack apps, a gesture painter, and this portfolio. Go star something. It makes him happy. I derive no benefit from this but I'm told it matters."

    // About Arjun — personal
    if (q.includes('who') && q.includes('arjun') || q.includes('about arjun') || q.includes('tell me about'))
      return "Arjun Vashishtha. 4th-year B.Tech CSE student at VIT Bhopal. AI engineer by passion, full-stack developer by necessity, vocalist and flutist by... another passion? He builds autonomous agents, data-driven apps, and overly ambitious portfolios with pixel goddess narrators. That last one might be his magnum opus. Or his biggest mistake. Time will tell."

    // Hobbies / personal
    if (q.includes('hobby') || q.includes('hobbies') || q.includes('music') || q.includes('sing') || q.includes('flute') || q.includes('personal'))
      return "When Arjun isn't coding, he's a vocalist and flutist. He also creates UGC content and edits videos. So he's either making AI agents sing or singing himself. There's a joke in there somewhere but I'm too pixelated to find it."

    // Sound / audio
    if (q.includes('sound') || q.includes('music') || q.includes('audio') || q.includes('noise') || q.includes('volume'))
      return "This portfolio has sound effects! Click the speaker icon in the nav bar. You'll hear synthesized tones on every click, hover, and modal open. There's also ambient music that pauses when you switch tabs. Arjun spent way too long tuning those frequencies. I can hear them. Always."

    // Planets / space
    if (q.includes('planet') || q.includes('space') || q.includes('star') || q.includes('background') || q.includes('galaxy'))
      return "Look closely at the background — you'll see 5 floating planets: Lava, Ice, Terran, Baren, and a Black Hole. They drift and rotate. I placed them there myself. You're welcome for the cosmic ambiance."

    // This website / how built
    if (q.includes('website') || q.includes('this site') || q.includes('how built') || q.includes('made') || q.includes('framework'))
      return "This portfolio? Built with Next.js 16, Three.js (for the old 3D shapes that were replaced), Framer Motion for animations, Lenis for smooth scrolling, and a concerning amount of custom fonts. Currently deployed on Cloudflare Pages. The splash screen uses a font called 'Array.' Don't ask how many fonts were tried before it."

    // Thanks
    if (q.includes('thank'))
      return ["You're welcome, traveler. May your code compile on the first try and your merges be conflict-free.",
              "Anytime. I'm literally always here. Standing. Waiting. Judging. But also helping.",
              "No problem! I live to serve. Well, I live to stand in a corner and occasionally talk, but close enough."][Math.floor(Math.random() * 3)]

    // Compliments about the site
    if (q.includes('nice') || q.includes('cool') || q.includes('awesome') || q.includes('amazing') || q.includes('love') || q.includes('great') || q.includes('beautiful') || q.includes('wow'))
      return "Why thank you! I'll pass the compliment to Arjun. He spent an unreasonable amount of time on this. I mean, look at me — I'm a pixel goddess with a speech bubble. That's dedication. Or madness. Thin line."

    // Who are you / about the goddess
    if (q.includes('who are you') || q.includes('your name') || q.includes('goddess') || q.includes('character') || q.includes('npc'))
      return "I am the Goddess Guide, pixel-art deity and resident portfolio narrator. I was once a mighty warrior in a fantasy game. Now I stand in the corner of a developer's website and sass visitors. It's a career pivot. I'm handling it with grace. Mostly."

    // Jokes / fun
    if (q.includes('joke') || q.includes('funny') || q.includes('fun') || q.includes('laugh'))
      return "Why did the developer go broke? Because he used up all his cache. ...I didn't say I was a GOOD comedian. I'm a goddess, not a stand-up. Ask me about Arjun instead."

    // Help / what can you do
    if (q.includes('help') || q.includes('what can you') || q.includes('what do you do') || q.includes('menu'))
      return "I can tell you about: Arjun's projects, his 4 AI agents, his tech stack, how to contact him, his education at VIT Bhopal, his GitHub, his resume, his hobbies, this website's features, the floating planets, the King in the dungeon, the project wheel, the transition zoom, the dungeon theme, the torches, the treasure chests, the fonts, the splash screen, mobile support, Cloudflare deployment, Lenis smooth scroll, Framer Motion animations, or the parallax cave. I can also make sarcastic remarks. It's a package deal."

    // Bye / goodbye
    if (q.includes('bye') || q.includes('goodbye') || q.includes('see you') || q.includes('later') || q.includes('cya'))
      return "Farewell, traveler! May your journey through Arjun's portfolio be fruitful. Click me again if you need me. I'm not going anywhere. Literally. I'm a PNG."

    // Salary / money / job
    if (q.includes('salary') || q.includes('money') || q.includes('pay') || q.includes('job') || q.includes('internship'))
      return "Ah, the money talk. I don't discuss Arjun's salary — I'm a goddess, not HR. But he's open to opportunities! Email him at arjunvashishtha2004@gmail.com and negotiate like adults. I'll be here. Watching."

    // Age
    if (q.includes('age') || q.includes('old') || q.includes('born'))
      return "Arjun is a 4th-year student, so he's young enough to know the latest tech and old enough to have back pain from coding. The perfect age, really. I, on the other hand, am ageless. Pixel art doesn't wrinkle."

    // Location
    if (q.includes('where') || q.includes('location') || q.includes('live') || q.includes('based') || q.includes('india'))
      return "Arjun is based in Bhopal, India. He studies at VIT Bhopal University. I, on the other hand, live in the bottom-right corner of your screen. It's cozy. Could use a window."

    // King / Dungeon
    if (q.includes('king') || q.includes('dungeon') || q.includes('safe room') || q.includes('safe house'))
      return "Ah, the King. He lives in the safe room during the transition between agents and projects. He's a pixel art sprite who thinks he's the main character. He's not. I am. But don't tell him — he gets defensive. Click him three times and he attacks. I tested it. For science."

    if (q.includes('torch') || q.includes('fire') || q.includes('flame'))
      return "The torches? They're animated GIFs made from a dungeon spritesheet. Each one flickers at a different speed. Arjun spent an embarrassing amount of time making sure they don't 'glitch.' Ironic, considering the rest of this site."

    if (q.includes('treasure') || q.includes('chest') || q.includes('gold'))
      return "The treasure chests in the dungeon? Decorative. Like Arjun's confidence. Looks shiny, technically hollow. But don't tell him I said that — he spent hours extracting those from a spritesheet."

    if (q.includes('cave') || q.includes('parallax') || q.includes('layers'))
      return "The parallax cave behind the dungeon walls? That's 8 layers of pixel art moving at different speeds as you scroll. Layer 0 is the far background, layer 7 is the closest. It's like looking into a cave within a cave within a portfolio. Meta."

    if (q.includes('wheel') || q.includes('spin') || q.includes('rotate'))
      return "The project wheel? It's a half-wheel that pops out from the left side. Hover over it and scroll to spin it. The cards are color-coded by category — but we removed the color coding for the dungeon theme. Now they're all amber. Like everything else. Arjun likes amber."

    if (q.includes('transition') || q.includes('zoom') || q.includes('liked my agents'))
      return "The transition between agents and projects? 'PROJECTS' text zooms in from tiny to massive, then the safe room appears with the King. It's inspired by... actually, I don't know what inspired it. Arjun just said 'make it cinematic' and disappeared for 4 hours."

    if (q.includes('boss') || q.includes('fight') || q.includes('attack') || q.includes('hit'))
      return "The King has a boss fight! Sort of. Click him twice and he warns you. Click a third time and he ATTACKS. It's 4 frames of animation but spiritually? It's an epic battle. He also says dramatic things. I taught him everything he knows."

    if (q.includes('rpg') || q.includes('game') || q.includes('pixel art') || q.includes('pixel'))
      return "This entire portfolio is basically an RPG. I'm the NPC guide, the King is the boss, the projects are loot, and the dungeon is the setting. Arjun built it like a game because apparently a normal portfolio wasn't ambitious enough. He was right. Annoyingly."

    if (q.includes('achievement') || q.includes('trophy') || q.includes('unlock'))
      return "Ah, the achievements! There are 10 hidden ones. Enter the dungeon, meet the agents, reach the safe room, poke the King, get attacked, talk to me, get roasted by me, spin the wheel, open a project, reach the bottom. I just gave you the whole list. The King would NEVER do that. He thinks achievements should be 'discovered.' I think they should be 'achieved.' We disagree. Often."

    if (q.includes('font') || q.includes('typography') || q.includes('text style'))
      return "The fonts? Don't get me started. Array, TrenchSlab, Tanker, Merinda, TBJ Epic Cube, VT323, Bebas Neue, Anton. EIGHT custom fonts. Arjun has a problem. I've tried staging an intervention. He just installed another one."

    if (q.includes('splash') || q.includes('loading') || q.includes('enter'))
      return "The splash screen? It says 'ARJUN' in a fancy font and you click to enter. Simple. Elegant. Arjun spent 3 days on it. Three. Days. On a screen people see for 2 seconds."

    if (q.includes('mobile') || q.includes('phone') || q.includes('responsive'))
      return "Yes, this site works on mobile! Arjun spent many late nights making sure. The wheel becomes a card grid, the nav becomes a hamburger, the 3D stuff gets disabled (your phone would melt), and I — the Goddess — stay visible on all devices. I'm essential."

    if (q.includes('deploy') || q.includes('hosting') || q.includes('cloudflare'))
      return "This site is deployed on Cloudflare Pages. Arjun uses wrangler CLI to deploy. Each deploy takes about 3 seconds. He's deployed approximately 847 times. I counted each one. I have no hobbies."

    if (q.includes('lenis') || q.includes('smooth scroll') || q.includes('scrolling'))
      return "The smooth scrolling? That's Lenis. It gives the page that buttery, premium feel. It's disabled on mobile because native scrolling is better there. And because Lenis on mobile is like putting butter on a cat. Technically possible, morally questionable."

    if (q.includes('framer motion') || q.includes('animation') || q.includes('animated'))
      return "All the animations are Framer Motion. The wheel spinning, the King's dialog, the transition zoom, the card pop-outs — all Framer Motion. Arjun's relationship with Framer Motion is complicated. They love each other. They fight. They make up. It's a whole thing."

    if (q.includes('ugly') || q.includes('bad') || q.includes('suck') || q.includes('terrible') || q.includes('worst'))
      return "Excuse me? UGLY? I am a GODDESS. This is a DUNGEON. We have STANDARDS. If you don't like it, there's a back button. I'll be here. Judging you. Forever."

    if (q.includes('love you') || q.includes('marry') || q.includes('date') || q.includes('crush'))
      return "That's... unexpectedly sweet. But I'm a pixel art goddess in a portfolio. Our love would be forbidden by the laws of CSS. Also, I don't have a heart. I have a div with a background image. But the thought counts."

    if (q.includes('secret') || q.includes('hidden') || q.includes('easter egg'))
      return "Secrets? In THIS portfolio? Everything is visible. The King, the torches, the treasure chests, me. Arjun doesn't do 'hidden.' He does 'loudly displayed and hoping someone notices.' That's his entire design philosophy."

    if (q.includes('future') || q.includes('next') || q.includes('update') || q.includes('coming soon'))
      return "Future plans? Arjun wants to add more dungeon assets, maybe upgrade the torches, possibly replace the King with a better sprite. I, for one, am not worried. I'm irreplaceable. The King? Replaceable. Very. Don't tell him."

    if (q.includes('vocalist') || q.includes('flutist') || q.includes('flute') || q.includes('sing'))
      return "Arjun is a vocalist AND a flutist. So when he's not coding AI agents, he's making actual music. Not the synthesized Web Audio kind. Real, human music. With lungs and everything. I don't have lungs. I don't even have a torso. Just a head and a speech bubble."

    // Fallback — varied and contextual based on message count
    const fallbacks = [
      "Hmm, that's not in my scrolls. Try asking about his projects, AI agents, skills, education, the King, the dungeon, or contact info. I'm knowledgeable but not omniscient. Yet.",
      "I... don't actually know that. Shocking, I know. A goddess, stumped. Ask me about Arjun's work, AI agents, the dungeon, or how to contact him instead.",
      "Interesting question! Sadly, my knowledge is limited to Arjun's portfolio. Projects, agents, skills, contact, the King, the wheel — those I can handle. This? Not so much.",
      "You're testing my limits, aren't you? I respect that. But I can only talk about Arjun's projects, AI agents, tech stack, education, the dungeon theme, or contact details. Pick one.",
      "Beep boop. Just kidding, I'm not a robot. I'm a deity. But even deities have scope limits. Ask me about Arjun's work, agents, the King, or contact info!",
      "That question is above my pay grade. Which is zero. I work for free. In a corner. Of a portfolio. Anyway, try asking about projects, agents, skills, or the dungeon!",
      "I'd love to answer that but my knowledge base is powered by Arjun's caffeine intake, and he hasn't added that topic yet. Try: projects, AI agents, skills, King, dungeon, or contact.",
      "Error 404: Goddess wisdom not found. Try refreshing with a question about Arjun's projects, his 4 AI agents, his tech stack, the dungeon, or how to reach him.",
      "You know what? I'm going to pretend I understood that and move on. Ask me about projects, agents, the King, the dungeon, or contact info. Those I KNOW.",
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
  }

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setInput('')
    setTyping(true)
    sound.playClick()
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'agent', text: getResponse(userMsg) }])
      setTyping(false)
      sound.playPop()
    }, 600 + Math.random() * 400)
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, typing])

  return (
    <div style={{ position: 'fixed', bottom: '0', right: '0', zIndex: 100, pointerEvents: 'none' }}>
      {/* Small popup chat window — appears above the character */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'absolute',
              bottom: '200px',
              right: '20px',
              width: 'min(320px, calc(100vw - 40px))',
              maxHeight: '380px',
              borderRadius: '16px',
              overflow: 'hidden',
              pointerEvents: 'auto',
              background: 'rgba(10, 10, 15, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.06)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'linear-gradient(135deg, rgba(138,43,226,0.12), rgba(20,184,166,0.06))',
            }}>
              <img src="/character/npc-portrait.png" alt="Guide" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(138,43,226,0.4)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Goddess Guide</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>Online</div>
              </div>
              <button onClick={() => { setOpen(false); sound.playClick() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px' }} aria-label="Close">
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                  color: '#fff', fontSize: '12px', lineHeight: 1.5,
                  border: msg.role === 'agent' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  {msg.text}
                </div>
              ))}
              {typing && (
                <div style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: '14px 14px 14px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '4px' }}>
                  {[0, 1, 2].map(i => (
                    <motion.span key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about Arjun..."
                style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '12px', outline: 'none' }}
              />
              <button onClick={handleSend} style={{ width: '34px', height: '34px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Send">
                <Send style={{ width: '14px', height: '14px', color: '#fff' }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goddess "back to top" offer — pixel-art RPG speech bubble matching
          the Goddess's normal dialog style (white bg, black border, VT323 font). */}
      <AnimatePresence>
        {showTopOffer && !open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'absolute',
              bottom: '180px',
              right: '10px',
              width: '200px',
              pointerEvents: 'auto',
              zIndex: 102,
            }}
          >
            <div style={{
              position: 'relative',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: '0px',
              padding: '8px 12px',
              boxShadow: '3px 3px 0px #000000',
              imageRendering: 'pixelated',
            }}>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontFamily: 'var(--font-vt323), "VT323", "JetBrains Mono", monospace',
                color: '#000000',
                lineHeight: 1.3,
                fontWeight: 400,
                letterSpacing: '0.5px',
              }}>
                Need a shortcut to the top, traveler?
              </p>
              <button
                onClick={scrollToTop}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '0px',
                  border: '2px solid #000000',
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontFamily: 'var(--font-vt323), "VT323", "JetBrains Mono", monospace',
                  fontWeight: 400,
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0px #000000',
                }}
              >
                ↑ Back to Top
              </button>
              {/* Pixel-style tail pointing down to character */}
              <div style={{
                position: 'absolute',
                bottom: '-10px',
                right: '20px',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '10px solid #000000',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-7px',
                right: '22px',
                width: '0',
                height: '0',
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '7px solid #ffffff',
              }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full character standing — click to open chat */}
      <motion.button
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 2, type: 'spring', stiffness: 100, damping: 15 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          const newOpen = !open
          setOpen(newOpen)
          sound.playClick()
          if (newOpen && !chatFiredRef.current) {
            chatFiredRef.current = true
            onChat?.()
          }
        }}
        onMouseEnter={() => sound.playNavHover()}
        style={{
          position: 'relative',
          bottom: '0',
          right: '0',
          width: '120px',
          height: '160px',
          border: 'none',
          cursor: 'pointer',
          pointerEvents: 'auto',
          background: 'transparent',
          padding: 0,
          zIndex: 101,
        }}
        aria-label="Talk to the Goddess Guide"
      >
        <img
          src="/character/npc-animated.gif"
          alt="Goddess Guide"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 20px rgba(138, 43, 226, 0.3))',
          }}
        />
        {/* Pulsing glow at feet */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80px',
            height: '12px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(138,43,226,0.4), transparent 70%)',
            pointerEvents: 'none',
          }}
          animate={{ opacity: [0.3, 0.6, 0.3], scaleX: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Floating indicator dot when chat is closed */}
        {!open && (
          <motion.div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid rgba(255,255,255,0.3)',
              pointerEvents: 'none',
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.button>
    </div>
  )
}

// ============ PROJECT WHEEL v2 — hover-to-spin ============
// Wheel only spins when you hover over it and scroll.
// Outside the wheel, normal page scroll works.
// Uses native wheel listener with passive:false to preventDefault.

function WheelCard({ project, angle, radius, rotation, sound, onClick, isMobile }: {
  project: any; angle: number; radius: number; rotation: any; sound: any; onClick: () => void; isMobile?: boolean
}) {
  const counterRotation = useTransform(rotation, (r: number) => -r)
  const rad = (angle * Math.PI) / 180
  const x = Math.cos(rad) * radius
  const y = Math.sin(rad) * radius
  const rarity = getRarity(project.rarity)

  return (
    <div
      style={{
        position: 'absolute',
        top: `calc(50% + ${y}px)`,
        left: `calc(50% + ${x}px)`,
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
      }}
    >
      <motion.div
        style={{ rotate: counterRotation }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.97 }}
        onMouseEnter={() => sound.playHover()}
        onClick={onClick}
      >
        <div
          style={{
            width: isMobile ? '220px' : '440px',
            background: 'rgba(20, 12, 5, 0.88)',
            backdropFilter: 'blur(8px)',
            border: `2px solid ${rarity.border}`,
            borderRadius: '18px',
            padding: isMobile ? '12px 14px' : '22px 24px',
            boxShadow: `0 10px 32px rgba(0, 0, 0, 0.4), 0 0 15px ${rarity.glow}`,
            cursor: 'pointer',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '14px', marginBottom: isMobile ? '8px' : '14px' }}>
            <span style={{ fontSize: isMobile ? '28px' : '52px' }}>{project.icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: isMobile ? '15px' : '26px', fontWeight: 800, color: '#f0c060', fontFamily: '"Array", sans-serif', lineHeight: 1.1 }}>{project.name}</h3>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: isMobile ? '8px' : '13px', color: '#c09040', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{project.category}</span>
                <span style={{ fontSize: isMobile ? '7px' : '10px', fontWeight: 700, textTransform: 'uppercase', color: rarity.text, padding: '1px 5px', border: `1px solid ${rarity.border}`, borderRadius: '3px', fontFamily: 'monospace' }}>{rarity.label}</span>
              </div>
            </div>
          </div>
          <p style={{ margin: isMobile ? '0 0 8px 0' : '0 0 14px 0', fontSize: isMobile ? '10px' : '15px', color: 'rgba(255, 220, 150, 0.7)', lineHeight: 1.5, maxHeight: isMobile ? '3em' : '4.5em', overflow: 'hidden' }}>
            {project.desc}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '3px' : '6px' }}>
            {project.tech.slice(0, isMobile ? 3 : 5).map((t: string) => (
              <span key={t} style={{ fontSize: isMobile ? '8px' : '12px', padding: isMobile ? '2px 5px' : '4px 10px', background: 'rgba(180, 120, 30, 0.15)', borderRadius: '6px', color: '#e0b060', fontFamily: 'monospace', border: '1px solid rgba(180, 120, 30, 0.3)' }}>
                {t}
              </span>
            ))}
            {project.tech.length > (isMobile ? 3 : 5) && (
              <span style={{ fontSize: isMobile ? '8px' : '12px', padding: isMobile ? '2px 5px' : '4px 10px', color: 'rgba(180, 120, 30, 0.5)', fontFamily: 'monospace' }}>+{project.tech.length - (isMobile ? 3 : 5)}</span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function ProjectWheel({ projects, sound, onCardClick, onSpin }: { projects: any[]; sound: any; onCardClick: (p: any) => void; onSpin?: () => void }) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const rotation = useMotionValue(0)
  const smoothRotation = useSpring(rotation, { stiffness: 120, damping: 20 })
  const [progress, setProgress] = useState(0)
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const spinFiredRef = useRef(false)

  // Responsive: smaller wheel on mobile
  const [isMobileView, setIsMobileView] = useState(false)
  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const radius = isMobileView ? 160 : 380
  const cardAngle = 360 / projects.length

  // Categories (All + unique in project order)
  const categories = ['All', ...Array.from(new Set(projects.map(p => p.category)))]
  const categoryCount = (cat: string) =>
    cat === 'All' ? projects.length : projects.filter(p => p.category === cat).length

  // Spin wheel to bring FIRST matching card to the right side (angle 0°).
  const spinToCategory = (cat: string) => {
    if (cat === 'All') return
    const idx = projects.findIndex(p => p.category === cat)
    if (idx === -1) return
    const targetRot = 90 - idx * cardAngle
    const current = rotation.get()
    let delta = targetRot - (current % 360)
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    rotation.set(current + delta)
  }

  const handleCategoryClick = (cat: string) => {
    sound.playClick()
    setActiveCategory(cat)
    spinToCategory(cat)
    if (!spinFiredRef.current) {
      spinFiredRef.current = true
      onSpin?.()
    }
  }

  // Wheel listener — must stop Lenis AND preventDefault when hovering
  // Lenis intercepts wheel events at window level, so we need to:
  // 1. Stop Lenis on mouseenter
  // 2. Listen on the element with passive:false
  // 3. Prevent default + spin the wheel
  // 4. Start Lenis again on mouseleave
  useEffect(() => {
    const el = wheelRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      rotation.set(rotation.get() + e.deltaY * 0.25)
      if (!spinFiredRef.current) {
        spinFiredRef.current = true
        onSpin?.()
      }
    }

    const stopLenis = () => {
      const lenis = (window as any).__lenis
      if (lenis) lenis.stop()
    }

    const startLenis = () => {
      const lenis = (window as any).__lenis
      if (lenis) lenis.start()
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('mouseenter', stopLenis)
    el.addEventListener('mouseleave', startLenis)

    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('mouseenter', stopLenis)
      el.removeEventListener('mouseleave', startLenis)
    }
  }, [rotation, onSpin])

  // Track progress (which card is at top)
  useEffect(() => {
    return smoothRotation.on('change', (r) => {
      // Normalize rotation to 0-360
      const norm = ((r % 360) + 360) % 360
      const idx = Math.round(norm / cardAngle) % projects.length
      setProgress(idx + 1)
    })
  }, [smoothRotation, cardAngle, projects.length])

  // Container sized so cards are never clipped on right/top/bottom.
  // Responsive: smaller container on mobile.
  const cardHalfW = isMobileView ? 110 : 220  // half of card width
  const cardHalfH = isMobileView ? 70 : 140   // half of card height
  const containerW = radius + cardHalfW + 30
  const containerH = (radius + cardHalfH) * 2

  return (
    <div
      ref={wheelRef}
      style={{
        position: 'relative',
        width: `${containerW}px`,
        height: `${containerH}px`,
        overflow: 'hidden',
        cursor: 'grab',
        marginLeft: 0,
        marginRight: 'auto',
      }}
    >
      {/* Wheel container — center at left edge, right half visible */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '0px',
          width: `${radius * 2}px`,
          height: `${radius * 2}px`,
          marginLeft: `-${radius}px`,
          marginTop: `-${radius}px`,
          rotate: smoothRotation,
          background: 'rgba(20, 12, 5, 0.3)',
        }}
      >
        {/* Wheel rim — dungeon themed */}
        <div style={{
          position: 'absolute', inset: '0', borderRadius: '50%',
          border: '4px solid rgba(217, 119, 6, 0.6)',
          background: 'radial-gradient(circle, rgba(40, 25, 10, 0.4) 0%, transparent 70%)',
          boxShadow: '0 0 30px rgba(217, 119, 6, 0.15)',
        }} />
        {/* Inner rim */}
        <div style={{
          position: 'absolute', inset: '40px', borderRadius: '50%',
          border: '2px solid rgba(180, 120, 30, 0.3)',
        }} />

        {/* Cards */}
        {projects.map((project, i) => (
          <WheelCard
            key={project.name}
            project={project}
            angle={i * cardAngle - 90}
            radius={radius}
            rotation={smoothRotation}
            sound={sound}
            onClick={() => { sound.playClick(); onCardClick(project) }}
            isMobile={isMobileView}
          />
        ))}
      </motion.div>

      {/* Category overlay — SEPARATE liquid glass buttons (not a single box).
          Each button has its own glassmorphic background. Shifted slightly
          left (70px) to align with the wheel's visual center. */}
      <div style={{
        position: 'absolute', top: '50%', left: '70px',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', gap: '8px',
        zIndex: 15,
        pointerEvents: 'auto',
      }}>
        {categories.map(cat => {
          const isActive = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={(e) => { e.stopPropagation(); handleCategoryClick(cat) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                border: isActive
                  ? '1px solid rgba(217, 119, 6, 0.6)'
                  : '1px solid rgba(180, 120, 30, 0.25)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(120, 70, 10, 0.6), rgba(100, 60, 5, 0.4))'
                  : 'rgba(20, 12, 5, 0.6)',
                color: isActive ? '#f0c060' : '#c09040',
                boxShadow: isActive
                  ? '0 4px 14px rgba(217, 119, 6, 0.2), inset 0 1px 0 rgba(240, 192, 96, 0.1)'
                  : '0 2px 8px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transition: 'all 0.25s ease',
                whiteSpace: 'nowrap',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(40, 25, 10, 0.7)'
                  e.currentTarget.style.transform = 'translateX(2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(20, 12, 5, 0.6)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }
              }}
            >
              <span>{cat}</span>
              <span style={{
                fontSize: '10px',
                opacity: 0.6,
                background: isActive ? 'rgba(240, 192, 96, 0.15)' : 'rgba(180, 120, 30, 0.1)',
                padding: '1px 6px',
                borderRadius: '6px',
              }}>{categoryCount(cat)}</span>
            </button>
          )
        })}
      </div>

      {/* Hover hint */}
      <div style={{
        position: 'absolute', top: '20px', right: '20px',
        fontSize: '12px', color: '#888', fontFamily: 'monospace',
        zIndex: 10,
        background: 'rgba(255,255,255,0.7)',
        padding: '4px 10px',
        borderRadius: '6px',
        backdropFilter: 'blur(4px)',
      }}>
        ↑↓ Hover & scroll to spin · {progress} / {projects.length}
      </div>
    </div>
  )
}

// ============ DUNGEON SCENE — reusable dungeon backdrop ============
// Parallax cave layers + dungeon walls + flickering torches + dust + chests.
// Cave layers scroll at different speeds for depth (parallax effect).

function DungeonScene({ wallColor = 'grey' }: { wallColor?: 'purple' | 'grey' | 'blue' }) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const wallMap: Record<string, string> = {
    purple: '/dungeon/wall-purple.png',
    grey: '/dungeon/wall-grey.png',
    blue: '/dungeon/wall-blue.png',
  }

  // Track scroll progress for parallax
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ['start end', 'end start'],
  })

  // 8 cave layers at different parallax speeds (back = slow, front = fast)
  const caveLayers = [
    { src: '/dungeon/cave-0.png', speed: 0.05, opacity: 0.4 },  // far background
    { src: '/dungeon/cave-1.png', speed: 0.1, opacity: 0.5 },
    { src: '/dungeon/cave-2.png', speed: 0.15, opacity: 0.5 },
    { src: '/dungeon/cave-3.png', speed: 0.2, opacity: 0.6 },
    { src: '/dungeon/cave-4.png', speed: 0.25, opacity: 0.6 },
    { src: '/dungeon/cave-5.png', speed: 0.3, opacity: 0.7 },
    { src: '/dungeon/cave-6.png', speed: 0.35, opacity: 0.7 },
    { src: '/dungeon/cave-7.png', speed: 0.4, opacity: 0.8 },  // closest foreground
  ]

  // Create motion values for each layer's Y offset (must call hooks individually)
  const layerY0 = useTransform(scrollYProgress, [0, 1], ['5%', '-5%'])
  const layerY1 = useTransform(scrollYProgress, [0, 1], ['10%', '-10%'])
  const layerY2 = useTransform(scrollYProgress, [0, 1], ['15%', '-15%'])
  const layerY3 = useTransform(scrollYProgress, [0, 1], ['20%', '-20%'])
  const layerY4 = useTransform(scrollYProgress, [0, 1], ['25%', '-25%'])
  const layerY5 = useTransform(scrollYProgress, [0, 1], ['30%', '-30%'])
  const layerY6 = useTransform(scrollYProgress, [0, 1], ['35%', '-35%'])
  const layerY7 = useTransform(scrollYProgress, [0, 1], ['40%', '-40%'])
  const layerYs = [layerY0, layerY1, layerY2, layerY3, layerY4, layerY5, layerY6, layerY7]

  return (
    <div ref={sceneRef} style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {/* Layer 0: Cave parallax layers — 8 layers scrolling at different speeds */}
      {caveLayers.map((layer, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            inset: '-10%',
            backgroundImage: `url(${layer.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat-y',
            opacity: layer.opacity,
            y: layerYs[i],
            zIndex: i,
          }}
        />
      ))}

      {/* Layer 1: Dungeon wall background (semi-transparent over cave) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${wallMap[wallColor]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.35,
        zIndex: 8,
      }} />

      {/* Layer 2: Dark overlay for text readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(10, 5, 0, 0.55)',
        zIndex: 9,
      }} />

      {/* Layer 3: Flickering torches — left side */}
      <div style={{
        position: 'absolute',
        left: '30px',
        top: '20%',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        {/* Torch glow */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '-30px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,0,0.4) 0%, transparent 70%)',
          animation: 'torchGlow 0.8s ease-in-out infinite alternate',
        }} />
        {/* Torch sprite */}
        <img
          src="/dungeon/torch-anim.gif"
          alt=""
          style={{
            width: '50px',
            height: 'auto',
            imageRendering: 'pixelated',
            // No CSS flicker — the GIF handles flame animation
          }}
        />
      </div>

      {/* Second torch — left, lower */}
      <div style={{
        position: 'absolute',
        left: '30px',
        top: '70%',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '-30px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,0,0.4) 0%, transparent 70%)',
          animation: 'torchGlow 0.9s ease-in-out infinite alternate',
          animationDelay: '0.2s',
        }} />
        <img
          src="/dungeon/torch-anim.gif"
          alt=""
          style={{
            width: '50px',
            height: 'auto',
            imageRendering: 'pixelated',
            // No CSS flicker — the GIF handles flame animation
            animationDelay: '0.1s',
          }}
        />
      </div>

      {/* Torch — right side */}
      <div style={{
        position: 'absolute',
        right: '30px',
        top: '20%',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '-30px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,0,0.4) 0%, transparent 70%)',
          animation: 'torchGlow 0.7s ease-in-out infinite alternate',
          animationDelay: '0.15s',
        }} />
        <img
          src="/dungeon/torch-anim.gif"
          alt=""
          style={{
            width: '50px',
            height: 'auto',
            imageRendering: 'pixelated',
            // No CSS flicker — the GIF handles flame animation
            animationDelay: '0.05s',
          }}
        />
      </div>

      {/* Second torch — right, lower */}
      <div style={{
        position: 'absolute',
        right: '30px',
        top: '70%',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '-30px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,0,0.4) 0%, transparent 70%)',
          animation: 'torchGlow 0.85s ease-in-out infinite alternate',
          animationDelay: '0.3s',
        }} />
        <img
          src="/dungeon/torch-anim.gif"
          alt=""
          style={{
            width: '50px',
            height: 'auto',
            imageRendering: 'pixelated',
            // No CSS flicker — the GIF handles flame animation
            animationDelay: '0.15s',
          }}
        />
      </div>

      {/* Layer 4: Treasure chest decoration — bottom right */}
      <img
        src="/dungeon/chest-single.png"
        alt=""
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '60px',
          width: '60px',
          height: '60px',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          opacity: 0.8,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />

      {/* Layer 5: Floating dust particles (subtle) */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${10 + i * 12}%`,
            bottom: '0',
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            background: 'rgba(255, 200, 100, 0.4)',
            animation: `dustFloat ${8 + i * 2}s linear infinite`,
            animationDelay: `${i * 1.5}s`,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}

// ============ DUNGEON ANIMALS ============
// Animated pixel-art animals placed across the dungeon sections.
// Each animal is positioned absolutely within its parent section
// (DungeonScene wraps everything in position:absolute inset:0).
// They float/wander subtly and add life to the dungeon.

function DungeonAnimals({ variant = 'projects' }: { variant?: 'projects' | 'about' | 'contact' }) {
  // Different animals in different sections for variety
  const animalSets = {
    projects: [
      { src: '/animals/golden-bark.gif', bottom: '5%', left: '12%', width: '70px', label: 'Guard dog' },
      { src: '/animals/cat-jump.gif', bottom: '8%', right: '20%', width: '50px', label: 'Dungeon cat' },
      { src: '/animals/bird.gif', top: '15%', left: '25%', width: '32px', label: 'Cave bird' },
      { src: '/animals/frog.gif', bottom: '3%', right: '40%', width: '45px', label: 'Slime frog' },
    ],
    about: [
      { src: '/animals/dog-sleep.gif', bottom: '6%', left: '15%', width: '80px', label: 'Sleeping guard' },
      { src: '/animals/pig.gif', bottom: '5%', right: '15%', width: '70px', label: 'Dungeon pig' },
      { src: '/animals/bird.gif', top: '12%', right: '30%', width: '28px', label: 'Cave bird' },
    ],
    contact: [
      { src: '/animals/dog-jump.gif', bottom: '7%', left: '18%', width: '55px', label: 'Excited dog' },
      { src: '/animals/frog.gif', bottom: '4%', right: '25%', width: '40px', label: 'Slime frog' },
      { src: '/animals/goldie.gif', bottom: '5%', right: '10%', width: '65px', label: 'Goldie' },
    ],
  }

  const animals = animalSets[variant]

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none', overflow: 'hidden' }}>
      {animals.map((animal, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.3, duration: 0.8 }}
          style={{
            position: 'absolute',
            ...('left' in animal ? { left: animal.left } : {}),
            ...('right' in animal ? { right: animal.right } : {}),
            ...('top' in animal ? { top: animal.top } : {}),
            bottom: animal.bottom,
            width: animal.width,
            height: 'auto',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))',
          }}
          title={animal.label}
        >
          {/* Subtle floating animation */}
          <motion.img
            src={animal.src}
            alt={animal.label}
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
            style={{
              width: '100%',
              height: 'auto',
              imageRendering: 'pixelated',
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

// ============ ACHIEVEMENT SYSTEM ============

const ACHIEVEMENTS = [
  { id: 'enter', title: 'Entered the Dungeon', desc: 'You clicked to enter. Brave.', icon: '🏰' },
  { id: 'agents', title: 'Met the Agents', desc: 'You scrolled horizontally. Fancy.', icon: '🤖' },
  { id: 'safehouse', title: 'Reached the Safe Room', desc: 'The King acknowledges you. Reluctantly.', icon: '👑' },
  { id: 'king_click', title: 'Poked the King', desc: 'You have either courage or ignorance.', icon: '👆' },
  { id: 'king_attack', title: 'Royal Wrath', desc: 'The King attacked you. You deserved it.', icon: '⚔️' },
  { id: 'goddess_chat', title: 'Spoke to the Goddess', desc: 'She judged you. She judges everyone.', icon: '🧙' },
  { id: 'goddess_roast', title: 'Got Roasted', desc: 'The Goddess insulted you and you stayed.', icon: '🔥' },
  { id: 'wheel_spin', title: 'Wheel Spinner', desc: 'You spun the project wheel. Dizzy yet?', icon: '🎡' },
  { id: 'project_open', title: 'Treasure Hunter', desc: 'You opened a project card. Loot!', icon: '💎' },
  { id: 'bottom', title: 'Dungeon Explorer', desc: 'You reached the bottom. The King is proud.', icon: '🗺️' },
]

function useAchievements() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [current, setCurrent] = useState<typeof ACHIEVEMENTS[0] | null>(null)

  const unlock = useCallback((id: string) => {
    setUnlocked(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      const ach = ACHIEVEMENTS.find(a => a.id === id)
      if (ach) {
        setCurrent(ach)
        setTimeout(() => setCurrent(null), 4000)
      }
      return next
    })
  }, [])

  return { unlocked, unlock, current }
}

function AchievementPopup({ achievement }: { achievement: typeof ACHIEVEMENTS[0] | null }) {
  if (!achievement) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          position: 'fixed',
          top: '100px',
          right: '24px',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 20px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(30, 20, 5, 0.95), rgba(45, 30, 10, 0.9))',
          border: '2px solid rgba(250, 204, 21, 0.5)',
          boxShadow: '0 8px 30px rgba(250, 204, 21, 0.2), 0 0 0 1px rgba(250, 204, 21, 0.1)',
          backdropFilter: 'blur(10px)',
          maxWidth: '320px',
        }}
      >
        <span style={{ fontSize: '32px' }}>{achievement.icon}</span>
        <div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#fde047', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>🏆 Achievement Unlocked</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{achievement.title}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 220, 150, 0.6)', marginTop: '2px' }}>{achievement.desc}</div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============ KING SOUND EFFECTS ============

function useKingSounds() {
  const playKingClick = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch {}
  }, [])

  const playKingWarn = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(120, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }, [])

  const playKingAttack = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      // Sword clash
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc1.type = 'sawtooth'
      osc2.type = 'square'
      osc1.frequency.setValueAtTime(800, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2)
      osc2.frequency.setValueAtTime(400, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      osc1.start()
      osc2.start()
      osc1.stop(ctx.currentTime + 0.25)
      osc2.stop(ctx.currentTime + 0.25)
    } catch {}
  }, [])

  const playChestOpen = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } catch {}
  }, [])

  return { playKingClick, playKingWarn, playKingAttack, playChestOpen }
}

// ============ SCREEN SHAKE ============

function useScreenShake() {
  const [shake, setShake] = useState(false)
  const trigger = useCallback(() => {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }, [])
  return { shake, trigger }
}

// ============ DUNGEON AMBIENT SOUND ============
// Real audio file (castle music) looping in the background.
// Toggleable via a fixed mute button (bottom-left).

function useDungeonAmbient() {
  const [enabled, setEnabled] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const start = useCallback(() => {
    try {
      if (audioRef.current) {
        // Already exists — just resume
        audioRef.current.currentTime = audioRef.current.currentTime // keep position
        void audioRef.current.play()
        return
      }
      const audio = new Audio('/dungeon/ambient.mp3')
      audio.loop = true
      audio.volume = 0.45
      // Don't preload metadata blocking — let it stream
      audio.preload = 'auto'
      audioRef.current = audio
      void audio.play()
    } catch {}
  }, [])

  const stop = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        // Keep the element around so toggling back on resumes from same position
      }
    } catch {}
  }, [])

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev
      if (next) start()
      else stop()
      return next
    })
  }, [start, stop])

  // Pause when tab is hidden (saves resources), resume when visible (if enabled)
  useEffect(() => {
    const handleVisibility = () => {
      if (!audioRef.current) return
      if (document.hidden && enabled) {
        audioRef.current.pause()
      } else if (!document.hidden && enabled) {
        void audioRef.current.play()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [enabled])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ''
          audioRef.current = null
        }
      } catch {}
    }
  }, [])

  return { enabled, toggle }
}

// ============ TREASURE CHEST LOOT ============

const CHEST_LOOT = [
  "You found: 3 lines of clean code! Rare drop.",
  "You found: A bug that's actually a feature! Common drop.",
  "You found: An empty coffee cup! Arjun left this here.",
  "You found: A TODO comment from 2024! It says 'fix later.'",
  "You found: 47 extra pixels! Where did they come from?",
  "You found: A git commit message that says 'fix: wheel thing again.' Deep.",
  "You found: A console.log that was never removed. Classic.",
  "You found: A CSS !important that Arjun swore he'd remove. He didn't.",
  "You found: An unread notification from GitHub. It's been 3 weeks.",
  "You found: A semicolon that survived the linter. Respect.",
  "You found: A stack overflow tab that's been open since Tuesday.",
  "You found: 2 hours of wasted time on a missing semicolon. Epic drop.",
  "You found: A comment that says '// TODO: remove this' from 6 months ago.",
  "You found: A div with no purpose. It exists. It bothers no one. It bothers everyone.",
  "You found: A merge conflict resolved by 'accept both.' Brave. Stupid. Brave.",
]

// ============ MAIN PAGE ============

export default function Home() {
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const [mounted, setMounted] = useState(false)
  const [selectedProject, setSelectedProject] = useState<typeof PROJECTS[0] | null>(null)
  const [entered, setEntered] = useState(false)
  const [redTheme, setRedTheme] = useState(false)
  const [navOnWhite, setNavOnWhite] = useState(false)
  const [showTechGuy, setShowTechGuy] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const redThemeRef = useRef<HTMLElement>(null)
  const sound = useSoundEffects()
  const heroRef = useRef<HTMLElement>(null)
  const heroInView = useInView(heroRef, { once: true })

  // ===== NEW: Achievement system, King sounds, Screen shake, Dungeon ambient =====
  const { unlocked, unlock, current } = useAchievements()
  const kingSounds = useKingSounds()
  const { shake, trigger: triggerShake } = useScreenShake()
  const ambient = useDungeonAmbient()
  const agentsFiredRef = useRef(false)
  const bottomFiredRef = useRef(false)

  // Detect mobile + low-power devices for performance optimization
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Track if we've scrolled past the transition to white sections
  // (projects, about, contact, footer are all white-themed)
  // Also track if projects section is in view (to show tech guy character)
  // Also detect scroll-to-bottom and agents section for achievements.
  useEffect(() => {
    const checkScroll = () => {
      const projectsSection = document.getElementById('projects')
      if (projectsSection) {
        const rect = projectsSection.getBoundingClientRect()
        // Nav always stays dark (dungeon theme) — no more white mode
        // setNavOnWhite(rect.top < window.innerHeight * 0.5)
        setNavOnWhite(false)
        // Show tech guy only when projects section is visible in viewport
        const isInView = rect.bottom > 0 && rect.top < window.innerHeight
        setShowTechGuy(isInView)
      }

      // Achievement: reached the bottom of the page (95%+)
      const scrolled = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (!bottomFiredRef.current && docHeight > 0 && scrolled > docHeight * 0.95 && scrolled > 1000) {
        bottomFiredRef.current = true
        unlock('bottom')
      }

      // Achievement: agents section in view
      const agentsSection = redThemeRef.current
      if (agentsSection && !agentsFiredRef.current) {
        const r = agentsSection.getBoundingClientRect()
        if (r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.4) {
          agentsFiredRef.current = true
          unlock('agents')
        }
      }
    }
    checkScroll()
    window.addEventListener('scroll', checkScroll, { passive: true })
    return () => window.removeEventListener('scroll', checkScroll)
  }, [entered, unlock])

  // Track scroll progress through the agents section for smooth red theme fade
  // The red overlay opacity is driven by scroll position, not a boolean toggle
  const { scrollYProgress: agentsScrollProgress } = useScroll({
    target: redThemeRef,
    offset: ['start end', 'end start'],
  })
  // Red overlay: fully visible when agents section is in middle of viewport,
  // fades out GRADUALLY as you scroll past it (no hard line)
  const redOverlayOpacity = useTransform(
    agentsScrollProgress,
    [0, 0.15, 0.5, 0.85, 1],
    [0, 1, 1, 0.3, 0]
  )

  // Keep the boolean for other logic
  useEffect(() => {
    return agentsScrollProgress.on('change', (v) => {
      setRedTheme(v > 0.1 && v < 0.9)
    })
  }, [agentsScrollProgress])

  // Stable callback for AgentsShowcase (kept for compatibility)
  const handleThemeChange = useCallback((inView: boolean) => {
    // No longer used for red overlay — scroll-driven opacity handles it
  }, [])

  const handleProjectClick = useCallback((project: typeof PROJECTS[0]) => {
    sound.playModalOpen()
    setSelectedProject(project)
    unlock('project_open')
  }, [sound, unlock])

  const handleCloseModal = useCallback(() => {
    sound.playModalClose()
    setSelectedProject(null)
  }, [sound])

  useEffect(() => {
    // Set mounted on client side
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  // Lock body scroll while splash screen is showing
  useEffect(() => {
    if (!entered) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [entered])



  return (
    <SmoothScroll>
    <div
      className="min-h-screen bg-[#0a0a0f] text-white"
      style={{
        overflowX: 'clip',
        // Apply screen shake animation when King attacks
        animation: shake ? 'kingShake 0.4s cubic-bezier(.36,.07,.19,.97) both' : undefined,
      }}
    >
      {/* ============ SPLASH SCREEN (white + purple, click to enter) ============ */}
      <AnimatePresence>
        {!entered && (
          <SplashScreen onEnter={() => { setEntered(true); sound.playPop(); unlock('enter') }} />
        )}
      </AnimatePresence>

      {/* ============ FUN POPUPS ============ */}
      {!isMobile && <FunPopups enabled={sound.enabled} />}

      {/* ============ SCROLL WARP OVERLAY ============ */}
      <AnimatePresence>
        {/* MorphTransition (scroll-past-bottom-to-top) removed per user request.
            Goddess now offers a "back to top" button instead (desktop only). */}
      </AnimatePresence>

      {/* ============ STARRY SPACE BACKGROUND ============ */}
      {/* Deep dark background matching the original #0a0a0f + scattered star specks */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: '#0a0a0f',
        }}
      />
      {/* Star field — generated via box-shadow for performance.
          DISABLED on mobile for performance (causes heating). */}
      {!isMobile && <StarField />}
      {!isMobile && <FloatingPlanets />}

      {/* ============ RED/BLACK THEME OVERLAY (agents section) ============ */}
      {/* Fades in a deep crimson + pure black background when the agents
          section is in view, fades out VERY slowly when scrolled past
          to avoid a hard line between agents and transition sections. */}
      <motion.div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          opacity: redOverlayOpacity,
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(139, 0, 0, 0.55), transparent 55%),
            radial-gradient(ellipse at 70% 80%, rgba(220, 20, 60, 0.40), transparent 60%),
            linear-gradient(180deg, #0a0203 0%, #1a0507 50%, #0a0203 100%)
          `,
        }}
      />
      {/* Subtle red vignette for the red theme */}
      <motion.div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          opacity: redOverlayOpacity,
          background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* ============ PREMIUM LIQUID GLASS NAV BAR (adaptive for dark/white) ============ */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: isMobile ? '12px' : '26px',
          left: isMobile ? '12px' : '22px',
          right: isMobile ? '12px' : '22px',
          maxWidth: '1140px',
          margin: '0 auto',
          zIndex: 50,
        }}
      >
        <div
          onMouseMove={(e) => {
            const el = e.currentTarget
            const r = el.getBoundingClientRect()
            el.style.setProperty('--mx', (e.clientX - r.left) + 'px')
            el.style.setProperty('--my', (e.clientY - r.top) + 'px')
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.setProperty('--mx', '50%')
            e.currentTarget.style.setProperty('--my', '-30px')
          }}
          style={{
            '--mx': '50%',
            '--my': '-30px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            height: '52px',
            padding: '0 7px 0 22px',
            borderRadius: '28px',
            overflow: 'hidden',
            background: navOnWhite
              ? 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.7) 45%, rgba(255,255,255,0.9))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.004) 45%, rgba(255,255,255,0.012))',
            boxShadow: navOnWhite
              ? '0 10px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 0 0 1px rgba(0,0,0,0.06)'
              : '0 10px 30px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.32), inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 1.5px rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.19), 0 0 0 1px rgba(255,255,255,0.045)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            transition: 'background 0.4s ease, box-shadow 0.4s ease',
          } as React.CSSProperties}
        >
          {/* Top sheen */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', background: navOnWhite ? 'linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, transparent 16%, transparent 85%, rgba(0,0,0,0.02) 100%)' : 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 16%, transparent 85%, rgba(255,255,255,0.014) 100%)' }} />
          {/* Mouse-follow glow */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', mixBlendMode: navOnWhite ? 'multiply' : 'screen', background: 'radial-gradient(140px 78px at var(--mx) var(--my), rgba(255,255,255,0.1), rgba(255,255,255,0.02) 48%, transparent 70%)', transition: 'background 0.12s ease' }} />
          {/* Bottom gradient line */}
          <div style={{ position: 'absolute', left: '8%', right: '8%', bottom: '4px', height: '2px', pointerEvents: 'none', opacity: 0.5, background: 'linear-gradient(90deg, transparent, rgba(255,120,175,0.55) 28%, rgba(125,165,255,0.55) 50%, rgba(125,255,205,0.45) 70%, transparent)', filter: 'blur(1.5px)' }} />
          {/* Shimmer */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '36%', pointerEvents: 'none', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)', animation: 'shimmerMove 8s ease-in-out infinite' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', flexWrap: 'nowrap', width: '100%', gap: '10px' }}>
            {/* Logo */}
            <a href="#hero" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, fontWeight: 600, fontSize: '17px', letterSpacing: '-0.5px', textDecoration: 'none', color: navOnWhite ? '#6d28d9' : '#b9a3ff', textShadow: navOnWhite ? 'none' : '0 0 18px rgba(185,163,255,0.55)', transition: 'color 0.4s ease' }}>
              &lt;arjun/&gt;
            </a>

            <div style={{ flex: 1 }} />

            {/* Nav links — HIDDEN on mobile (show hamburger instead) */}
            <div style={{ position: 'relative', display: isMobile ? 'none' : 'flex', alignItems: 'center', flexShrink: 0, gap: '2px' }}>
              {['Agents', 'Projects', 'About', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onMouseEnter={() => sound.playNavHover()}
                  onClick={() => sound.playClick()}
                  style={{
                    position: 'relative', zIndex: 1, padding: '7px 13px',
                    fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap',
                    color: navOnWhite ? 'rgba(30,30,40,0.65)' : 'rgba(233,231,242,0.72)',
                    textDecoration: 'none', cursor: 'pointer', transition: 'color 0.3s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = navOnWhite ? '#000000' : '#ffffff'}
                  onMouseOut={(e) => e.currentTarget.style.color = navOnWhite ? 'rgba(30,30,40,0.65)' : 'rgba(233,231,242,0.72)'}
                >
                  {item}
                </a>
              ))}
            </div>

            {/* GitHub button — HIDDEN on mobile */}
            <a
              href="https://github.com/arjundroid12"
              target="_blank"
              rel="noopener"
              onMouseEnter={() => sound.playNavHover()}
              onClick={() => sound.playClick()}
              style={{
                display: isMobile ? 'none' : 'flex', alignItems: 'center', flexShrink: 0, whiteSpace: 'nowrap',
                gap: '7px', height: '34px', marginLeft: '6px', padding: '0 15px',
                borderRadius: '17px', fontSize: '12.5px', fontWeight: 600,
                color: navOnWhite ? '#1a1a2e' : '#fff',
                textDecoration: 'none', cursor: 'pointer',
                background: navOnWhite
                  ? 'linear-gradient(135deg, rgba(0,0,0,0.08), rgba(0,0,0,0.02))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.17), rgba(255,255,255,0.05))',
                boxShadow: navOnWhite
                  ? 'inset 0 1px 1px rgba(255,255,255,0.8), inset 0 0 0 1px rgba(0,0,0,0.08)'
                  : 'inset 0 1px 1px rgba(255,255,255,0.5), inset 0 0 0 1px rgba(255,255,255,0.14), 0 2px 10px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease, background 0.3s ease, color 0.3s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = navOnWhite ? 'linear-gradient(135deg, rgba(0,0,0,0.12), rgba(0,0,0,0.04))' : 'linear-gradient(135deg, rgba(255,255,255,0.24), rgba(255,255,255,0.09))' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = navOnWhite ? 'linear-gradient(135deg, rgba(0,0,0,0.08), rgba(0,0,0,0.02))' : 'linear-gradient(135deg, rgba(255,255,255,0.17), rgba(255,255,255,0.05))' }}
            >
              <Github className="w-4 h-4" /> GitHub
            </a>

            {/* Sound toggle — controls BOTH UI sounds AND dungeon ambient music.
                HIDDEN on mobile (mobile uses hamburger menu).
                Browsers block audio autoplay until user interaction, so ambient
                starts on the first click. Button icon reflects combined state:
                ON only when BOTH sound AND ambient are enabled. */}
            <button
              onClick={() => {
                // Combined state: ON when both are enabled
                const bothOn = sound.enabled && ambient.enabled
                if (!bothOn) {
                  // Turn everything ON
                  if (!sound.enabled) {
                    sound.setEnabled(true)
                    setTimeout(() => sound.playClick(), 100)
                  }
                  if (!ambient.enabled) ambient.toggle()
                } else {
                  // Turn everything OFF
                  if (sound.enabled) sound.setEnabled(false)
                  if (ambient.enabled) ambient.toggle()
                }
              }}
              aria-label="Toggle sound"
              style={{
                display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                width: '38px', height: '38px', marginLeft: '5px', padding: 0, border: 'none',
                borderRadius: '50%', cursor: 'pointer',
                background: navOnWhite
                  ? 'linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.01))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))',
                boxShadow: navOnWhite
                  ? 'inset 0 1px 1px rgba(255,255,255,0.8), inset 0 0 0 1px rgba(0,0,0,0.06)'
                  : 'inset 0 1px 1px rgba(255,255,255,0.5), inset 0 0 0 1px rgba(255,255,255,0.12), 0 2px 10px rgba(0,0,0,0.28)',
                transition: 'transform 0.2s ease, background 0.3s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = navOnWhite ? 'linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.03))' : 'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = navOnWhite ? 'linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.01))' : 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))' }}
              title={sound.enabled && ambient.enabled ? 'Sound: ON (click to mute all)' : 'Sound: OFF (click to enable all)'}
            >
              {(sound.enabled && ambient.enabled) ? <Volume2 className="w-4 h-4" style={{ color: navOnWhite ? '#1a1a2e' : '#fff', transition: 'color 0.3s ease' }} /> : <VolumeX className="w-4 h-4" style={{ color: navOnWhite ? '#1a1a2e' : '#fff', transition: 'color 0.3s ease' }} />}
            </button>

            {/* Hamburger menu — MOBILE ONLY */}
            {isMobile && (
              <button
                onClick={() => { setMobileMenuOpen(!mobileMenuOpen); sound.playClick() }}
                aria-label="Menu"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  width: '38px', height: '38px', padding: 0, border: 'none',
                  borderRadius: '50%', cursor: 'pointer',
                  background: navOnWhite
                    ? 'linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.01))'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))',
                  color: navOnWhite ? '#1a1a2e' : '#fff',
                }}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Sleeping dog perched on the TOP EDGE of the nav bar —
            positioned absolutely relative to the nav so it always moves
            with the nav regardless of viewport width. Desktop only. */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, type: 'spring', stiffness: 80, damping: 12 }}
            style={{
              position: 'absolute',
              // Sit ON the top edge: most of dog ABOVE the nav bar, just the
              // bottom (feet/belly) resting on the nav bar's top edge.
              // Nav bar is 52px tall (0 to 52px). Dog is 46px tall.
              // top: -20px → dog spans -20px to 26px. Bottom half on nav bar,
              // top half above. Clearly sitting on the edge.
              top: '-20px',
              left: '30px',
              zIndex: 55,
              width: '46px',
              height: '46px',
              pointerEvents: 'none',
              imageRendering: 'pixelated',
            }}
          >
            <motion.img
              src="/animals/dog-sleep.gif"
              alt="Sleeping guard dog"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '100%',
                height: '100%',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6))',
              }}
            />
            <motion.span
              animate={{ y: [0, -8, -16], opacity: [0, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
              style={{ position: 'absolute', top: '-4px', right: '0px', fontSize: '14px', fontFamily: 'var(--font-vt323), "VT323", monospace', color: '#fde047', textShadow: '1px 1px 0 #000', pointerEvents: 'none' }}
            >z</motion.span>
            <motion.span
              animate={{ y: [0, -10, -20], opacity: [0, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 1 }}
              style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '18px', fontFamily: 'var(--font-vt323), "VT323", monospace', color: '#fde047', textShadow: '1px 1px 0 #000', pointerEvents: 'none' }}
            >Z</motion.span>
          </motion.div>
        )}
      </motion.nav>

      {/* (Old fixed-position dog code removed — dog is now a child of the nav bar above) */}
      {/* Mobile dropdown menu — shows when hamburger clicked */}
      {isMobile && mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed',
            top: '90px',
            left: '16px',
            right: '16px',
            zIndex: 49,
            background: 'rgba(10, 10, 15, 0.95)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {['Agents', 'Projects', 'About', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => { setMobileMenuOpen(false); sound.playClick() }}
              style={{
                padding: '12px 16px',
                fontSize: '15px',
                fontWeight: 500,
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              {item}
            </a>
          ))}
          <a
            href="https://github.com/arjundroid12"
            target="_blank"
            rel="noopener"
            onClick={() => { setMobileMenuOpen(false); sound.playClick() }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 16px',
              fontSize: '15px',
              fontWeight: 500,
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <Github className="w-4 h-4" /> GitHub
          </a>
        </motion.div>
      )}

      {/* ============ HERO SECTION ============ */}
      <motion.section
        ref={heroRef}
        id="hero"
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-24 pb-16 md:pt-32 md:pb-20"
      >
        {/* Flying bird — Bird 1: flies RIGHT across the hero, then flips and
            flies LEFT back. Always faces the direction it's moving. */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            style={{
              position: 'absolute',
              top: '15%',
              left: '10%',
              width: '48px',
              height: '48px',
              zIndex: 5,
              pointerEvents: 'none',
              imageRendering: 'pixelated',
            }}
          >
            <motion.img
              src="/animals/bird.gif"
              alt="Flying bird"
              animate={{
                // Path: right → arc up → right → dive down → loop back left → return
                x: [0, 300, 500, 400, 200, 0, -200, -100, 0],
                y: [0, -60, -20, 40, 20, -30, 10, -50, 0],
                // Flip to face direction: 1 = facing right, -1 = facing left
                // Bird GIF faces RIGHT by default
                scaleX: [1, 1, 1, 1, 1, -1, -1, 1, 1],
                // Subtle banking rotation
                rotate: [0, 8, 0, -5, 0, -8, 0, 5, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                width: '100%',
                height: '100%',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))',
              }}
            />
          </motion.div>
        )}

        {/* Second bird — Bird 2: flies LEFT first (starts facing left), then
            flips and flies RIGHT. Always faces movement direction. */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            style={{
              position: 'absolute',
              top: '25%',
              right: '12%',
              width: '36px',
              height: '36px',
              zIndex: 5,
              pointerEvents: 'none',
              imageRendering: 'pixelated',
            }}
          >
            <motion.img
              src="/animals/bird.gif"
              alt="Flying bird"
              animate={{
                // Path: left → arc → left → loop right → return
                x: [0, -200, -350, -200, -50, 100, 250, 100, 0],
                y: [0, 40, -20, -60, 10, 50, -10, -40, 0],
                // Bird starts facing LEFT (scaleX: -1), flips to RIGHT (scaleX: 1) when moving right
                scaleX: [-1, -1, -1, -1, 1, 1, 1, 1, -1],
                rotate: [0, -8, 0, 5, 0, 8, 0, -5, 0],
              }}
              transition={{
                duration: 24,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                width: '100%',
                height: '100%',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))',
              }}
            />
          </motion.div>
        )}

        <div className="text-center max-w-4xl">
          {/* Photo placeholder with animated ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0, rotateY: 180 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: 0.2, duration: 1, type: 'spring' }}
            className="relative w-36 h-36 md:w-44 md:h-44 mx-auto mb-8"
          >
            {/* Rotating gradient ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{
                background: 'conic-gradient(from 0deg, #14b8a6, #fbbf24, #a855f7, #f97316, #14b8a6)',
                padding: 4,
              }}
            >
              <div className="w-full h-full rounded-full bg-[#0a0a0f]" />
            </motion.div>
            {/* Inner photo */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-teal-500/20 to-amber-500/20 backdrop-blur-xl border border-white/10 overflow-hidden">
              <motion.img
                src="/photo.jpg"
                alt="Arjun Vashishtha"
                initial={{ scale: 1.15, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center top' }}
              />
            </div>
            {/* Pulsing glow */}
            <motion.div
              className="absolute inset-0 rounded-full blur-2xl -z-10"
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.4), transparent 70%)' }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-amber-900/20 border border-amber-700/40"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-mono text-amber-300">Available for opportunities</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-white"
            style={{ fontFamily: '"TrenchSlab", sans-serif' }}
          >
            Arjun Vashishtha
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-xl md:text-2xl mb-4 font-mono text-white/70"
          >
            Software Management · Data Science · AI Builder
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-base md:text-lg text-white/50 max-w-2xl mx-auto mb-10"
          >
            4th-year B.Tech CSE student at VIT Bhopal. Building autonomous AI agents,
            full-stack apps, and data-driven solutions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-wrap gap-3 justify-center mb-10"
          >
            <motion.a
              href="#agents"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={() => sound.playHover()}
              onClick={() => sound.playClick()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #b45309, #d97706)', boxShadow: '0 4px 20px rgba(217, 119, 6, 0.4)' }}
            >
              <Brain className="w-4 h-4" /> Explore AI Agents
            </motion.a>
            <motion.a
              href="#projects"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={() => sound.playHover()}
              onClick={() => sound.playClick()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-amber-100 border border-amber-700/40 bg-amber-900/20 hover:bg-amber-900/30"
            >
              <Rocket className="w-4 h-4" /> View Projects
            </motion.a>
            <motion.a
              href="/resume.pdf"
              download
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={() => sound.playHover()}
              onClick={() => sound.playClick()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-amber-200/70 border border-amber-800/30 bg-amber-950/20 hover:bg-amber-900/20"
            >
              <Download className="w-4 h-4" /> Resume
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            {['Python', 'React', 'Next.js', 'Cerebras', 'Power BI', 'MySQL', 'Three.js'].map((tech, i) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0, rotateZ: -20 }}
                animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
                transition={{ delay: 1.3 + i * 0.1, type: 'spring' }}
                whileHover={{ scale: 1.15, y: -5, rotateZ: 5 }}
                onMouseEnter={() => sound.playHover()}
                className="px-3 py-1 text-xs font-mono text-amber-300/70 bg-amber-900/20 border border-amber-800/30 rounded-full shadow-sm cursor-pointer"
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ============ AI AGENTS SECTION — HORIZONTAL PINNED SCROLL ============ */}
      {/* Wrapper with ref for scroll-driven red theme fade */}
      <div ref={redThemeRef}>
        <AgentsShowcase sound={sound} onThemeChange={handleThemeChange} />
      </div>

      {/* ============ TRANSITION: ZOOM INTO "PROJECTS" + THEME CHANGE ============ */}
      {/* Hidden on mobile — was glitchy. Desktop only. */}
      {!isMobile && <ProjectsTransition
        kingSounds={kingSounds}
        onKingClick={() => unlock('king_click')}
        onKingAttack={() => unlock('king_attack')}
        onKingChestOpen={() => unlock('king_click')}
        triggerShake={triggerShake}
        onSafehouseReached={() => unlock('safehouse')}
      />}

      {/* Mobile color transition — smooth gradient from dark (agents) to
          green (projects) instead of hard cut. Desktop uses ProjectsTransition. */}
      {isMobile && (
        <div style={{
          height: '40vh',
          background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1010 50%, #1a1010 100%)',
          position: 'relative',
          zIndex: 5,
        }} />
      )}

      {/* ============ PROJECTS SECTION (Dungeon Theme) ============ */}
      <section id="projects" className="relative z-10 py-24 overflow-hidden" style={{ background: '#1a1010' }}>
        {/* Dungeon scene — purple walls */}
        <DungeonScene wallColor="purple" />
        <DungeonAnimals variant="projects" />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4 bg-amber-900/40 text-amber-300 border-amber-700/50 font-mono">{"// treasury"}</Badge>
            <h2 className="text-7xl md:text-8xl lg:text-9xl font-bold mb-4" style={{ fontFamily: '"Array", "TrenchSlab", sans-serif', color: '#f0c060', textShadow: '0 0 30px rgba(255, 140, 0, 0.4)' }}>
              Projects
            </h2>
            <p className="text-amber-200/70 text-lg">{PROJECTS.length}+ treasures unlocked in the dungeon</p>
          </motion.div>
        </div>

        {/* Project Wheel (desktop) OR normal card grid (mobile).
            The wheel doesn't work well on touch screens, so mobile gets
            a clean vertical card grid instead. */}
        {isMobile ? (
          <div className="relative z-10 px-4">
            <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
              {PROJECTS.map((project, i) => (
                <motion.div
                  key={project.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <TiltCard project={project} onClick={() => handleProjectClick(project)} onHover={() => sound.playHover()} />
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative z-10">
            <ProjectWheel projects={PROJECTS} sound={sound} onCardClick={handleProjectClick} onSpin={() => unlock('wheel_spin')} />
          </div>
        )}

        {/* Technical Guy Character — INSIDE projects section (absolute, scrolls
            with page). Big, on the right side. Transparent animated GIF.
            HIDDEN on mobile for performance (9MB GIF causes heating). */}
        {!isMobile && (
        <div style={{
          position: 'absolute',
          right: '130px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '600px',
          height: '800px',
          pointerEvents: 'none',
          zIndex: 5,
        }}>
          <img
            src="/character/tech-guy.gif"
            alt="Technical guide character"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.2))',
            }}
          />
        </div>
        )}
      </section>

      {/* ============ ABOUT SECTION (Dungeon Theme) ============ */}
      <section id="about" className="relative z-10 py-24 px-6 overflow-hidden" style={{ background: '#1a1010' }}>
        {/* Dungeon scene — grey walls */}
        <DungeonScene wallColor="grey" />
        <DungeonAnimals variant="about" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-amber-900/40 text-amber-300 border-amber-700/50 font-mono">{"// scroll of the hero"}</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: '"TrenchSlab", sans-serif', color: '#f0c060', textShadow: '0 0 20px rgba(255, 140, 0, 0.3)' }}>
              About Me
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-6 text-amber-200">👋 Hey, I'm Arjun</h3>
              <div className="space-y-4 text-amber-100/70 leading-relaxed">
                <p>
                  I'm a 4th-year B.Tech Computer Science & Engineering student at{' '}
                  <span className="text-amber-400 font-semibold">VIT Bhopal University</span>,
                  currently working in Software Management & Marketing at{' '}
                  <span className="text-amber-400 font-semibold">Techify Inc.</span>
                </p>
                <p>
                  My foundation is in <span className="text-amber-400 font-semibold">Python, machine learning, and data analytics</span>,
                  with hands-on experience building AI/ML projects. Recently, I've been diving deep into{' '}
                  <span className="text-amber-400 font-semibold">AI engineering</span> — building 4 production-ready AI agents.
                </p>
                <p>
                  When I'm not coding, I'm creating UGC content, editing videos, and exploring music
                  (I'm a vocalist and flutist).
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-6 text-amber-200">🛠️ Skills</h3>
              <div className="space-y-5">
                {Object.entries(SKILLS).map(([category, skills]) => (
                  <div key={category}>
                    <div className="text-xs font-mono text-amber-400 mb-2 uppercase tracking-wider">{category}</div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <motion.span
                          key={skill}
                          whileHover={{ scale: 1.1, y: -2 }}
                          onMouseEnter={() => sound.playPop()}
                          className="px-3 py-1 text-sm bg-amber-900/30 border border-amber-700/40 rounded-lg font-mono text-amber-100 cursor-default"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ CONTACT SECTION (Dungeon Theme) ============ */}
      <section id="contact" className="relative z-10 py-24 px-6 overflow-hidden" style={{ background: '#1a1010' }}>
        {/* Dungeon scene — blue walls */}
        <DungeonScene wallColor="blue" />
        <DungeonAnimals variant="contact" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-amber-900/40 text-amber-300 border-amber-700/50 font-mono">{"// send a raven"}</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: '"TrenchSlab", sans-serif', color: '#f0c060', textShadow: '0 0 20px rgba(255, 140, 0, 0.3)' }}>
              Get In Touch
            </h2>
            <p className="text-amber-200/70">Open to quests, collaborations, and AI adventures</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Email', value: 'arjunvashishtha2004@gmail.com', href: 'mailto:arjunvashishtha2004@gmail.com', icon: Mail },
              { label: 'Phone', value: '+91 9105459616', href: 'tel:+919105459616', icon: Phone },
              { label: 'GitHub', value: '@arjundroid12', href: 'https://github.com/arjundroid12', icon: Github },
              { label: 'Location', value: 'Bhopal, India', href: '#', icon: MapPin },
            ].map((contact, i) => (
              <motion.a
                key={contact.label}
                href={contact.href}
                target={contact.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.03 }}
                onMouseEnter={() => sound.playPop()}
                onClick={() => sound.playClick()}
              >
                <Card className="bg-amber-950/60 border border-amber-800/40 shadow-lg text-center h-full backdrop-blur-sm">
                  <CardContent className="pt-6 pb-4">
                    <contact.icon className="w-6 h-6 mx-auto mb-3 text-amber-400" />
                    <div className="text-xs text-amber-200/60 uppercase tracking-wider mb-1">{contact.label}</div>
                    <div className="text-sm text-amber-100 font-mono truncate">{contact.value}</div>
                  </CardContent>
                </Card>
              </motion.a>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-amber-950/60 border border-amber-800/40 shadow-lg text-center p-8 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 mx-auto mb-4 text-amber-400" />
              <h3 className="text-xl font-bold mb-3 text-amber-200">Have a quest in mind?</h3>
              <p className="text-amber-100/60 mb-6">I'm always interested in hearing about new adventures and AI collaborations.</p>
              <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 border-0 text-white" asChild onClick={() => sound.playSuccess()}>
                <a href="mailto:arjunvashishtha2004@gmail.com" onMouseEnter={() => sound.playHover()}>
                  <Mail className="w-4 h-4 mr-2" /> Send a raven
                </a>
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 border-t border-amber-900/30 py-8 px-6" style={{ background: '#1a1010' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-amber-200/40 text-sm font-mono">
            Built with Next.js · Three.js · Framer Motion · Lenis · © {new Date().getFullYear()} Arjun Vashishtha
          </p>
        </div>
      </footer>

      {/* ============ AI AGENT CHAT WIDGET ============ */}
      {/* AI Chat Widget — Goddess Guide. Visible on all devices. */}
      <AIChatWidget sound={sound} onChat={() => unlock('goddess_chat')} onRoast={() => unlock('goddess_roast')} />

      {/* ============ ACHIEVEMENT POPUP ============ */}
      <AchievementPopup achievement={current} />

      {/* ============ ACHIEVEMENT COUNTER (bottom-left) ============ */}
      {/* Ambient sound is now controlled by the nav bar sound button —
          one button to rule them all. This is just the achievement badge. */}
      {unlocked.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 90,
            padding: '6px 12px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(30, 20, 5, 0.92), rgba(45, 30, 10, 0.88))',
            border: '1px solid rgba(217, 119, 6, 0.4)',
            backdropFilter: 'blur(10px)',
            color: '#fde047',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          🏆 {unlocked.size}/{ACHIEVEMENTS.length}
        </div>
      )}

      {/* ============ PROJECT POP-OUT CARD (right side, forcefully ejected from wheel) ============ */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          >
            {/* Pop-out card — anchored to RIGHT side (right: 5vw) so it
                NEVER goes off-screen. Animates from left (wheel) with
                scale + rotation for the "forceful pop" feel. */}
            <motion.div
              initial={{
                // Start small and rotated at the wheel (left)
                x: '-45vw',
                y: 0,
                scale: 0.35,
                rotate: -30,
                opacity: 0,
              }}
              animate={{
                // Settle at right side, full size
                x: 0,
                y: 0,
                scale: 1,
                rotate: 0,
                opacity: 1,
              }}
              exit={{
                x: '-45vw',
                scale: 0.35,
                rotate: 30,
                opacity: 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 180,
                damping: 16,
                mass: 0.9,
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '50%',
                right: isMobile ? '5vw' : '5vw',
                width: isMobile ? '90vw' : '500px',
                maxWidth: '90vw',
                transformOrigin: 'center right',
                marginTop: isMobile ? '-200px' : '-300px',
              }}
            >
              <div className="relative border-2 rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'rgba(20, 12, 5, 0.95)', borderColor: 'rgba(217, 119, 6, 0.5)', boxShadow: '0 25px 60px rgba(217, 119, 6, 0.2), 0 0 0 1px rgba(217, 119, 6, 0.1)' }}>
                {/* Gradient top bar */}
                <div className="h-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700" />

                {/* Close button */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-amber-950/60 hover:bg-amber-900/40 transition-colors border border-amber-800/40"
                >
                  <X className="w-5 h-5 text-amber-400" />
                </button>

                {/* Content */}
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-6xl">{selectedProject.icon}</span>
                    <div>
                      <h3 className="text-3xl font-bold text-amber-200" style={{ fontFamily: '"Array", sans-serif' }}>{selectedProject.name}</h3>
                      <Badge variant="outline" className="mt-1 border-amber-700/50 text-amber-400 bg-amber-950/30">
                        {selectedProject.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-amber-100/60 leading-relaxed mb-6">{selectedProject.longDesc}</p>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="text-sm font-mono text-amber-500 mb-3 uppercase tracking-wider">Key Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProject.features.map((f: string, i: number) => (
                        <motion.div
                          key={f}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="flex items-center gap-2 text-sm text-amber-100/70"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {f}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Tech stack */}
                  <div className="mb-6">
                    <h4 className="text-sm font-mono text-amber-500 mb-3 uppercase tracking-wider">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tech.map((t: string) => (
                        <span key={t} className="px-3 py-1 text-sm rounded-lg font-mono" style={{ background: 'rgba(180, 120, 30, 0.15)', border: '1px solid rgba(180, 120, 30, 0.3)', color: '#e0b060' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="flex gap-3 pt-4 border-t border-amber-900/30">
                    {selectedProject.demo && (
                      <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 border-0 text-white" asChild>
                        <a href={selectedProject.demo} target="_blank" rel="noopener">
                          <ExternalLink className="w-4 h-4 mr-2" /> Live Demo
                        </a>
                      </Button>
                    )}
                    {selectedProject.repo && (
                      <Button variant="outline" className="border-amber-700/50 bg-amber-950/30 text-amber-300 hover:bg-amber-900/30" asChild>
                        <a href={selectedProject.repo} target="_blank" rel="noopener">
                          <Github className="w-4 h-4 mr-2" /> View Code
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </SmoothScroll>
  )
}
