'use client'

// Arjun Vashishtha — Premium 3D Portfolio
// Last updated: EDITION 2026 — splash screen, horizontal agents scroll, red/black theme shift

import { useRef, useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sphere, MeshDistortMaterial, Stars, OrbitControls, Torus, Icosahedron, Text3D, Center } from '@react-three/drei'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Github, Mail, MapPin, Phone, ExternalLink, Download, Sparkles, Zap, Code2, Brain, Database, Cpu, Rocket, ArrowDown, X, Volume2, VolumeX } from 'lucide-react'

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
  const playWarp = useCallback(() => {
    // Cool warp/zoom sound — descending sweep
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
  const playPop = useCallback(() => {
    playTone(1047, 0.04, 'sine', 0.04)
    setTimeout(() => playTone(1319, 0.06, 'sine', 0.03), 30)
  }, [playTone])
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
  { name: 'SmartAgro', desc: 'AI plant disease detection using CNN/Random Forest', longDesc: 'AI system that helps farmers detect plant diseases and get remedies from image or text input. Uses CNN/Random Forest for image classification and NLP for remedy queries, with a web interface and recent-query history.', tech: ['Python', 'ML', 'CNN', 'Random Forest', 'NLP'], category: 'AI/ML', icon: '🌱', repo: 'https://github.com/arjundroid12/SmartAgro-A-disease-detection-model-with-Human-Interaction', demo: null, features: ['Image-based disease detection', 'NLP remedy queries', 'Web interface', 'Query history'] },
  { name: 'FIOLA', desc: 'AI voice assistant with LLMs and speech recognition', longDesc: 'Custom voice assistant built with LLMs and Python for speech recognition and task automation. Handles natural language commands and executes tasks.', tech: ['Python', 'LLM', 'Speech Recognition'], category: 'AI/ML', icon: '🎤', repo: null, demo: null, features: ['Voice command processing', 'LLM-powered responses', 'Task automation', 'Natural language understanding'] },
  { name: 'Realtime Chat', desc: 'Multi-room chat with Socket.io and typing indicators', longDesc: 'Real-time chat application with multiple rooms, nicknames, typing indicators, and online user list. Built with Node.js, Express, and Socket.io for instant WebSocket-based messaging.', tech: ['Node.js', 'Express', 'Socket.io', 'WebSockets'], category: 'Full-stack', icon: '💬', repo: 'https://github.com/arjundroid12/realtime-chat', demo: 'https://github.com/arjundroid12/realtime-chat#-live-demo', features: ['Multiple chat rooms', 'Real-time messaging', 'Typing indicators', 'Online user list', 'Auto-reconnect'] },
  { name: 'Calculator', desc: 'Calculator with custom expression parser and history', longDesc: 'Clean modern calculator with keyboard support, history panel, and dark mode. Uses a custom shunting-yard expression parser (no eval) for safe evaluation.', tech: ['Vanilla JS', 'HTML5', 'CSS3'], category: 'Frontend', icon: '🧮', repo: 'https://github.com/arjundroid12/calculator-app', demo: 'https://arjun-calculator.surge.sh', features: ['Custom expression parser', 'Calculation history', 'Keyboard support', 'Dark/light theme'] },
  { name: 'Notes App', desc: 'Markdown notes with tags, search, and custom parser', longDesc: 'Markdown notes app with tags, search, and dark mode. Custom zero-dependency markdown parser. All notes stored in localStorage — no backend required.', tech: ['Vanilla JS', 'Markdown', 'localStorage'], category: 'Frontend', icon: '📝', repo: 'https://github.com/arjundroid12/notes-app', demo: 'https://arjun-notes.surge.sh', features: ['Custom markdown parser', 'Tag system', 'Full-text search', 'Export/import JSON', 'Auto-save'] },
  { name: 'Weather App', desc: 'Weather with geolocation and 5-day forecast', longDesc: 'Weather app with city search, 5-day forecast, geolocation, and recent searches. Uses free Open-Meteo API (no key needed).', tech: ['Vanilla JS', 'Open-Meteo API', 'Geolocation'], category: 'Frontend', icon: '⛅', repo: 'https://github.com/arjundroid12/weather-app', demo: 'https://arjun-weather.surge.sh', features: ['City search with autocomplete', '5-day forecast', 'Geolocation support', 'Recent searches', 'WMO weather codes'] },
  { name: 'Kanban Todo', desc: 'Drag & drop kanban with priorities and due dates', longDesc: 'Kanban-style todo app with drag & drop between columns, priorities, due dates, and stats. Built with HTML5 Drag and Drop API.', tech: ['Vanilla JS', 'HTML5 DnD', 'localStorage'], category: 'Frontend', icon: '📋', repo: 'https://github.com/arjundroid12/todo-drag-drop', demo: 'https://arjun-kanban.surge.sh', features: ['Drag & drop between columns', 'Priority levels', 'Due dates with overdue warnings', 'Stats bar', 'localStorage persistence'] },
  { name: 'Movie Explorer', desc: 'Movie search with filters and detail modal', longDesc: 'Movie explorer with search, genre filters, sort, favorites, and detail modal. 30 mock movies included, easy to swap for live TMDB API.', tech: ['Vanilla JS', 'TMDB API (optional)'], category: 'Frontend', icon: '🎬', repo: 'https://github.com/arjundroid12/movie-explorer', demo: 'https://arjun-movies.surge.sh', features: ['Search with debounce', 'Genre filters', 'Favorites (localStorage)', 'Detail modal', 'Trending row'] },
  { name: 'Pomodoro Timer', desc: 'Timer with charts and desktop notifications', longDesc: 'Pomodoro timer with custom durations, daily/weekly stats charts, and desktop notifications. Chart.js visualization.', tech: ['Vanilla JS', 'Chart.js', 'Web Notifications'], category: 'Frontend', icon: '🍅', repo: 'https://github.com/arjundroid12/pomodoro-timer', demo: 'https://arjun-pomodoro.surge.sh', features: ['3 modes (work/short/long break)', '7-day stats chart', 'Desktop notifications', 'Custom durations', 'Progress bar'] },
  { name: 'GitHub Search', desc: 'Search GitHub users with profile details', longDesc: 'Search GitHub users, view profile details and top repositories sorted by stars. Uses free GitHub REST API.', tech: ['Vanilla JS', 'GitHub API'], category: 'Frontend', icon: '🐙', repo: 'https://github.com/arjundroid12/github-user-search', demo: 'https://arjun-gh-search.surge.sh', features: ['User profile search', 'Top repos by stars', 'Rate limit indicator', 'Recent searches', 'Stats display'] },
  { name: 'URL Shortener', desc: 'REST API with click analytics and custom aliases', longDesc: 'REST API for shortening URLs with click analytics, custom aliases, and optional expiry. Node.js + Express + LowDB (JSON file storage).', tech: ['Node.js', 'Express', 'LowDB'], category: 'Backend', icon: '🔗', repo: 'https://github.com/arjundroid12/url-shortener-api', demo: 'https://github.com/arjundroid12/url-shortener-api#-live-demo', features: ['Custom aliases', 'Click analytics', 'Expiry support', 'REST API design', 'JSON file storage'] },
  { name: 'JWT Auth Demo', desc: 'Auth with refresh tokens and password hashing', longDesc: 'JWT authentication demo with signup/login, hashed passwords (bcrypt), refresh tokens, and protected routes. Production-style security.', tech: ['Node.js', 'Express', 'JWT', 'bcrypt'], category: 'Backend', icon: '🔐', repo: 'https://github.com/arjundroid12/jwt-auth-demo', demo: 'https://github.com/arjundroid12/jwt-auth-demo#-live-demo', features: ['bcrypt password hashing', 'JWT access tokens (15 min)', 'Refresh tokens (7 days, httpOnly cookie)', 'Token rotation', 'Protected routes'] },
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
  { text: "Nice scrolling! 👀", emoji: "👀" },
  { text: "You're crushing it! 💪", emoji: "💪" },
  { text: "Check out my AI agents! 🤖", emoji: "🤖" },
  { text: "Did you know I built 4 AI agents? 😎", emoji: "😎" },
  { text: "Love that you're exploring! ✨", emoji: "✨" },
  { text: "Almost there... 🔥", emoji: "🔥" },
  { text: "Pro tip: Click the cards! 👆", emoji: "👆" },
  { text: "I see you scrolling 🎢", emoji: "🎢" },
  { text: "Nice taste in portfolios! 😏", emoji: "😏" },
  { text: "Don't forget to say hi! 👋", emoji: "👋" },
  { text: "Built with Three.js + Framer Motion ⚡", emoji: "⚡" },
  { text: "Sound on? 🔊", emoji: "🔊" },
  { text: "Scroll to the bottom for a surprise! 🎁", emoji: "🎁" },
  { text: "You found me! 🎉", emoji: "🎉" },
  { text: "Keep going, you're doing great! 🚀", emoji: "🚀" },
]

function FunPopups({ enabled }: { enabled: boolean }) {
  const [popups, setPopups] = useState<Array<{ id: number; text: string; emoji: string; x: number; y: number }>>([])
  const idRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!enabled) return
      const msg = FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]
      const id = idRef.current++
      const x = 10 + Math.random() * 80
      const y = 15 + Math.random() * 60
      setPopups((prev) => [...prev, { id, ...msg, x, y }])
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id))
      }, 4000)
    }, 12000) // Every 12 seconds

    return () => clearInterval(interval)
  }, [enabled])

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <AnimatePresence>
        {popups.map((popup) => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, scale: 0, rotate: -10, y: 20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0, rotate: 10, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'absolute',
              left: `${popup.x}%`,
              top: `${popup.y}%`,
            }}
            className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
          >
            <span className="text-lg mr-1">{popup.emoji}</span>
            <span className="text-sm font-medium text-white">{popup.text}</span>
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
      <Card className="h-full overflow-hidden group relative bg-white border border-gray-200 shadow-lg hover:shadow-2xl transition-shadow duration-300">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/5 group-hover:to-pink-500/10 transition-all duration-500 pointer-events-none" />
        
        <CardHeader style={{ transform: 'translateZ(40px)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">{project.icon}</span>
              <div>
                <CardTitle className="text-base text-gray-900">{project.name}</CardTitle>
                <Badge variant="outline" className="mt-1 text-xs border-gray-300 text-gray-500">{project.category}</Badge>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </CardHeader>
        <CardContent style={{ transform: 'translateZ(30px)' }}>
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">{project.desc}</p>
          <div className="flex flex-wrap gap-1">
            {project.tech.slice(0, 4).map((t: string) => (
              <span key={t} className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">{t}</span>
            ))}
            {project.tech.length > 4 && (
              <span className="text-xs px-2 py-0.5 text-gray-400 font-mono">+{project.tech.length - 4}</span>
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
    // Wait for the super-zoom exit to peak, then reveal hero
    setTimeout(onEnter, 1100)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[500] flex items-center justify-center cursor-pointer overflow-hidden"
      onClick={handleClick}
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      // Hold opacity at 1 through the zoom, then fade out at the very end
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: leaving ? 0.9 : 0 }}
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
            ? // EXIT: super zoom into the text — scale way up and fade
              { opacity: 0, y: 0, scale: 18 }
            : // ENTER: slide up from below
              { opacity: 1, y: 0, scale: 1 }
        }
        transition={
          leaving
            ? { duration: 1.0, ease: [0.7, 0, 0.84, 0], opacity: { duration: 0.9, delay: 0.1 } }
            : { duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.15 }
        }
      >
        <motion.h1
          className="select-none"
          style={{
            fontFamily: '"TrenchSlab", "Merinda", sans-serif',
            color: '#ffffff',
            fontSize: 'clamp(56px, 10vw, 140px)',
            fontWeight: 400,
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
  const sectionHeight = measured && trackWidth > 0
    ? `calc(100vh + ${trackWidth}px)`
    : '100vh'

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
      {/* Sticky container — pinned while track scrolls horizontally */}
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center pt-40 pb-8">
        {/* Section heading — positioned at top with clear gap above cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="absolute top-6 left-0 right-0 text-center z-20 pointer-events-none px-6"
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
        {/* Padding centers the first and last card in the viewport */}
        <motion.div
          ref={trackRef}
          style={{ x, width: 'max-content' }}
          className="agents-track flex gap-10 will-change-transform"
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
                className="relative shrink-0 w-[85vw] md:w-[55vw] lg:w-[42vw] h-[56vh] rounded-3xl overflow-hidden flex flex-col"
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

// ============ PROJECTS TRANSITION (zoom + theme change) ============
// Cinematic transition inspired by Lenis website:
// Phase 1 (0 → 0.25): "Liked my agents?" moves from center → upper-left corner
// Phase 2 (0.15 → 0.40): "Here's some more" fades in at bottom-right corner
// Phase 3 (0.30 → 0.55): Corner text fades out
// Phase 4 (0.40 → 0.90): "PROJECTS" zooms slowly from tiny to massive (bold TBJ font)
// Phase 5 (0.70 → 0.95): Background transitions dark → white
// Whole section is 400vh for very slow, cinematic scrolling

function ProjectsTransition() {
  const sectionRef = useRef<HTMLElement>(null)
  const [whiteTheme, setWhiteTheme] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 25,
    restDelta: 0.001,
  })

  // Phase 1: "Liked my agents?" — center → upper-LEFT corner, big/bold
  // Stays visible until 0.55, then fades out
  // X stops at 12% (with padding) so text doesn't go off-screen when scaled up
  const likedX = useTransform(smoothProgress, [0, 0.30], ['50%', '12%'])
  const likedY = useTransform(smoothProgress, [0, 0.30], ['50%', '15%'])
  const likedScale = useTransform(smoothProgress, [0, 0.30], [1, 1.5])
  const likedOpacity = useTransform(smoothProgress, [0, 0.25, 0.50, 0.60], [1, 1, 1, 0])

  // Phase 2: "Here's more" — fades in at bottom-RIGHT corner, stays visible
  // Fades in at 0.20, stays until 0.65, then fades out
  const moreOpacity = useTransform(smoothProgress, [0.20, 0.35, 0.60, 0.70], [0, 1, 1, 0])
  const moreY = useTransform(smoothProgress, [0.20, 0.35], [20, 0])

  // Phase 3: "PROJECTS" — very slow fade + zoom in
  // Initial scaling is VERY slow (0.55 → 0.75 only goes from 0.05 to 0.5)
  // Then accelerates (0.75 → 0.95 goes from 0.5 to 30)
  const projectsScale = useTransform(
    smoothProgress,
    [0.55, 0.75, 0.95],
    [0.05, 0.5, 30]
  )
  const projectsOpacity = useTransform(smoothProgress, [0.55, 0.75, 0.90, 0.96], [0, 1, 1, 0])

  // Phase 4: Background dark → white (gradual fade for smooth merge)
  // Starts earlier (50%) and completes later (95%) for a slow blend
  const bgOpacity = useTransform(smoothProgress, [0.50, 0.95], [0, 1])

  // Gradient blend overlay — fades from dark at top to transparent at bottom
  // Creates a smooth merge between the dark transition and white projects section
  const blendOpacity = useTransform(smoothProgress, [0.60, 0.95], [1, 0])

  useEffect(() => {
    return smoothProgress.on('change', (v) => {
      setWhiteTheme(v > 0.9)
    })
  }, [smoothProgress])

  const tbjFont = '"TBJ Epic Cube", "Anton", sans-serif'

  return (
    <>
      <section
        ref={sectionRef}
        className="relative z-10"
        style={{ height: '500vh' }}
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Dark background */}
          <motion.div
            className="absolute inset-0 z-0"
            style={{ background: '#0a0a0f' }}
          />

          {/* White background (fades in slowly) */}
          <motion.div
            className="absolute inset-0 z-0"
            style={{ background: '#ffffff', opacity: bgOpacity }}
          />

          {/* Phase 1: "Liked my agents?" — moves from center to upper-LEFT, big/bold */}
          <motion.div
            style={{
              left: likedX,
              top: likedY,
              transform: 'translate(0, -50%)',
              scale: likedScale,
              opacity: likedOpacity,
            }}
            className="absolute z-20 pointer-events-none text-left"
          >
            <p style={{
              fontFamily: tbjFont,
              fontSize: 'clamp(36px, 6vw, 80px)',
              fontWeight: 800,
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
              fontFamily: tbjFont,
              fontSize: 'clamp(36px, 6vw, 80px)',
              fontWeight: 800,
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

      {/* White theme overlay for projects section */}
      {whiteTheme && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[-1] pointer-events-none"
          style={{ background: '#ffffff' }}
        />
      )}
    </>
  )
}

// ============ MAIN PAGE ============

export default function Home() {
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [activeFilter, setActiveFilter] = useState('All')
  const [mounted, setMounted] = useState(false)
  const [selectedProject, setSelectedProject] = useState<typeof PROJECTS[0] | null>(null)
  const [entered, setEntered] = useState(false)
  const [redTheme, setRedTheme] = useState(false)
  const redThemeRef = useRef<HTMLElement>(null)
  const sound = useSoundEffects()
  const heroRef = useRef<HTMLElement>(null)
  const heroInView = useInView(heroRef, { once: true })

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
  }, [sound])

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

  const filteredProjects = activeFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.category === activeFilter)

  return (
    <SmoothScroll>
    <div className="min-h-screen bg-[#0a0a0f] text-white" style={{ overflowX: 'clip' }}>
      {/* ============ SPLASH SCREEN (white + purple, click to enter) ============ */}
      <AnimatePresence>
        {!entered && (
          <SplashScreen onEnter={() => { setEntered(true); sound.playPop() }} />
        )}
      </AnimatePresence>

      {/* ============ FUN POPUPS ============ */}
      <FunPopups enabled={sound.enabled} />

      {/* ============ SCROLL WARP OVERLAY ============ */}
      <AnimatePresence>
        <MorphTransition onMorph={(type) => { if (type === 'warp') sound.playWarp(); else sound.playPop() }} />
      </AnimatePresence>

      {/* ============ STARRY SPACE BACKGROUND ============ */}
      {/* Deep dark background matching the original #0a0a0f + scattered star specks */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: '#0a0a0f',
        }}
      />
      {/* Star field — generated via box-shadow for performance */}
      <StarField />

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

      {/* ============ NAV ============ */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 liquid-glass-nav"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.a
            href="#hero"
            whileHover={{ scale: 1.05 }}
            className="font-mono text-lg font-bold"
            style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            &lt;arjun/&gt;
          </motion.a>
          <div className="hidden md:flex items-center gap-2">
            {['Agents', 'Projects', 'About', 'Contact'].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                whileHover={{ scale: 1.05, y: -2 }}
                onMouseEnter={() => sound.playNavHover()}
                onClick={() => sound.playClick()}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                {item}
              </motion.a>
            ))}
            <Button size="sm" variant="outline" className="ml-2 border-white/20 bg-white/5 text-white hover:bg-white/10" asChild onMouseEnter={() => sound.playNavHover()} onClick={() => sound.playClick()}>
              <a href="https://github.com/arjundroid12" target="_blank" rel="noopener">
                <Github className="w-4 h-4 mr-2" /> GitHub
              </a>
            </Button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (!sound.enabled) {
                  sound.setEnabled(true)
                  setTimeout(() => sound.playClick(), 100)
                } else {
                  sound.setEnabled(false)
                }
              }}
              className="ml-2 p-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors"
              title={sound.enabled ? "Sound is ON — click to mute" : "Sound is muted — click to enable"}
            >
              {sound.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ============ HERO SECTION ============ */}
      <motion.section
        ref={heroRef}
        id="hero"
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-32 pb-20"
      >
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
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-indigo-500/10 border border-indigo-500/30"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-mono text-indigo-400">Available for opportunities</span>
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
            4th-year B.Tech CSE student at VIT Bhopal, currently at Techify Inc.
            Building autonomous AI agents, full-stack apps, and data-driven solutions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-wrap gap-4 justify-center mb-16"
          >
            <MagneticButton
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
              asChild
              onClick={() => sound.playClick()}
            >
              <a href="#agents"><Brain className="w-4 h-4 mr-2" /> Explore AI Agents</a>
            </MagneticButton>
            <MagneticButton
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              asChild
              onClick={() => sound.playClick()}
            >
              <a href="#projects"><Rocket className="w-4 h-4 mr-2" /> View Projects</a>
            </MagneticButton>
            <MagneticButton
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              asChild
              onClick={() => sound.playClick()}
            >
              <a href="/resume.pdf" download><Download className="w-4 h-4 mr-2" /> Resume</a>
            </MagneticButton>
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
                className="px-3 py-1 text-xs font-mono text-white/60 bg-white/5 backdrop-blur-md border border-white/10 rounded-full shadow-sm cursor-pointer"
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
      <ProjectsTransition />

      {/* ============ PROJECTS SECTION ============ */}
      <section id="projects" className="relative z-10 py-24 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4 bg-purple-100 text-purple-700 border-purple-300 font-mono">{"// portfolio"}</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent" style={{ fontFamily: '"TrenchSlab", sans-serif' }}>
              Projects
            </h2>
            <p className="text-gray-500">{PROJECTS.length}+ projects built</p>
          </motion.div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {['All', 'AI/ML', 'Frontend', 'Full-stack', 'Backend'].map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveFilter(cat); sound.playFilter() }}
                onMouseEnter={() => sound.playNavHover()}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === cat
                    ? 'bg-teal-500 text-white border border-teal-600'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {cat}
                <span className="ml-1.5 opacity-60">
                  {cat === 'All' ? PROJECTS.length : PROJECTS.filter(p => p.category === cat).length}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Projects grid with 3D tilt */}
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <TiltCard project={project} onClick={() => handleProjectClick(project)} onHover={() => sound.playHover()} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ============ ABOUT SECTION ============ */}
      <section id="about" className="relative z-10 py-24 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-cyan-100 text-cyan-700 border-cyan-300 font-mono">{"// about me"}</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent" style={{ fontFamily: '"TrenchSlab", sans-serif' }}>
              About Me
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-6">👋 Hey, I'm Arjun</h3>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  I'm a 4th-year B.Tech Computer Science & Engineering student at{' '}
                  <span className="text-indigo-600 font-semibold">VIT Bhopal University</span>,
                  currently working in Software Management & Marketing at{' '}
                  <span className="text-indigo-600 font-semibold">Techify Inc.</span>
                </p>
                <p>
                  My foundation is in <span className="text-indigo-600 font-semibold">Python, machine learning, and data analytics</span>,
                  with hands-on experience building AI/ML projects. Recently, I've been diving deep into{' '}
                  <span className="text-indigo-600 font-semibold">AI engineering</span> — building 4 production-ready AI agents.
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
              <h3 className="text-2xl font-bold mb-6">🛠️ Skills</h3>
              <div className="space-y-5">
                {Object.entries(SKILLS).map(([category, skills]) => (
                  <div key={category}>
                    <div className="text-xs font-mono text-indigo-600 mb-2 uppercase tracking-wider">{category}</div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <motion.span
                          key={skill}
                          whileHover={{ scale: 1.1, y: -2 }}
                          onMouseEnter={() => sound.playPop()}
                          className="px-3 py-1 text-sm bg-gray-100 border border-gray-200 rounded-lg font-mono text-gray-700 cursor-default"
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

      {/* ============ CONTACT SECTION ============ */}
      <section id="contact" className="relative z-10 py-24 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-purple-100 text-purple-700 border-purple-300 font-mono">{"// let's connect"}</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent" style={{ fontFamily: '"TrenchSlab", sans-serif' }}>
              Get In Touch
            </h2>
            <p className="text-gray-500">Open to opportunities, collaborations, and AI conversations</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
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
                <Card className="bg-white border border-gray-200 shadow-lg text-center h-full">
                  <CardContent className="pt-6 pb-4">
                    <contact.icon className="w-6 h-6 mx-auto mb-3 text-indigo-600" />
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{contact.label}</div>
                    <div className="text-sm text-gray-700 font-mono truncate">{contact.value}</div>
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
            <Card className="bg-white border border-gray-200 shadow-lg text-center p-8">
              <Sparkles className="w-8 h-8 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-bold mb-3">Have a project in mind?</h3>
              <p className="text-gray-500 mb-6">I'm always interested in hearing about new ideas and AI collaborations.</p>
              <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0" asChild onClick={() => sound.playSuccess()}>
                <a href="mailto:arjunvashishtha2004@gmail.com" onMouseEnter={() => sound.playHover()}>
                  <Mail className="w-4 h-4 mr-2" /> Send me an email
                </a>
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 border-t border-gray-200 py-8 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 text-sm font-mono">
            Built with Next.js · Three.js · Framer Motion · Lenis · © {new Date().getFullYear()} Arjun Vashishtha
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-teal-400/60 text-xs font-mono mt-2"
          >
            💡 Scroll past the bottom to fly back to the top...
          </motion.p>
        </div>
      </footer>

      {/* ============ PROJECT DETAIL MODAL ============ */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-[#0f0f1e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Gradient top bar */}
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              {/* Close button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>

              {/* Content */}
              <div className="p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl">{selectedProject.icon}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedProject.name}</h3>
                    <Badge variant="outline" className="mt-1 border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                      {selectedProject.category}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/60 leading-relaxed mb-6">{selectedProject.longDesc}</p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-mono text-indigo-400 mb-3 uppercase tracking-wider">Key Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProject.features.map((f: string, i: number) => (
                      <motion.div
                        key={f}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="flex items-center gap-2 text-sm text-white/70"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        {f}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Tech stack */}
                <div className="mb-6">
                  <h4 className="text-sm font-mono text-indigo-400 mb-3 uppercase tracking-wider">Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tech.map((t: string) => (
                      <span key={t} className="px-3 py-1 text-sm bg-white/5 border border-white/10 rounded-lg text-white/70 font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="flex gap-3 pt-4 border-t border-white/5">
                  {selectedProject.demo && (
                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0" asChild>
                      <a href={selectedProject.demo} target="_blank" rel="noopener">
                        <ExternalLink className="w-4 h-4 mr-2" /> Live Demo
                      </a>
                    </Button>
                  )}
                  {selectedProject.repo && (
                    <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
                      <a href={selectedProject.repo} target="_blank" rel="noopener">
                        <Github className="w-4 h-4 mr-2" /> View Code
                      </a>
                    </Button>
                  )}
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
