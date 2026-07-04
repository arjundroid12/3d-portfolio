'use client'

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

// ============ SCROLL-TO-TOP: MINIMAL HINT + FADE ZOOM TRANSITION ============

function MorphTransition({ onMorph }: { onMorph: (type: string) => void }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [active, setActive] = useState(false)
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
          // Second hit: trigger fade zoom transition + scroll to top
          clearTimeout(dismissTimer.current)
          setShowConfirm(false)
          triggered.current = true
          setActive(true)
          onMorph('warp')
          // Smooth scroll to top at the peak of the zoom (when overlay is fully opaque)
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 900)
          // Hide overlay after the transition completes
          setTimeout(() => {
            setActive(false)
            triggered.current = false
            atBottomRef.current = false
          }, 2200)
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

      {/* Fade zoom transition — second attempt */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, times: [0, 0.4, 0.6, 1], ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Dark blurred backdrop that fades in then out */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.15), rgba(10, 10, 15, 0.96) 60%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            />

            {/* Center logo/initial that zooms in then fades */}
            <motion.div
              className="relative z-10 flex flex-col items-center gap-6"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.1, 1, 0.8], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.2, times: [0, 0.4, 0.6, 1], ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Glowing avatar ring */}
              <motion.div
                className="relative w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'conic-gradient(from 0deg, #14b8a6, #fbbf24, #a855f7, #f97316, #14b8a6)',
                  padding: 3,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                  <motion.span
                    className="text-4xl font-bold"
                    style={{
                      fontFamily: 'var(--font-playfair), Georgia, serif',
                      background: 'linear-gradient(135deg, #14b8a6, #fbbf24, #a855f7)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    AV
                  </motion.span>
                </div>
              </motion.div>

              {/* Subtle loading dots */}
              <motion.div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/70"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </motion.div>
            </motion.div>

            {/* Soft radial glow pulse */}
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(20, 184, 166, 0.3), transparent 70%)',
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.5, 1.5, 0.5], opacity: [0, 0.6, 0.6, 0] }}
              transition={{ duration: 2.2, times: [0, 0.4, 0.6, 1], ease: 'easeInOut' }}
            />
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
      <Card className="liquid-glass h-full overflow-hidden group relative">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/5 group-hover:to-pink-500/10 transition-all duration-500 pointer-events-none" />
        
        <CardHeader style={{ transform: 'translateZ(40px)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">{project.icon}</span>
              <div>
                <CardTitle className="text-base text-white">{project.name}</CardTitle>
                <Badge variant="outline" className="mt-1 text-xs border-white/20 text-white/60">{project.category}</Badge>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-indigo-400 transition-colors" />
          </div>
        </CardHeader>
        <CardContent style={{ transform: 'translateZ(30px)' }}>
          <p className="text-sm text-white/60 mb-3 leading-relaxed">{project.desc}</p>
          <div className="flex flex-wrap gap-1">
            {project.tech.slice(0, 4).map((t: string) => (
              <span key={t} className="text-xs px-2 py-0.5 bg-white/5 rounded text-white/60 font-mono">{t}</span>
            ))}
            {project.tech.length > 4 && (
              <span className="text-xs px-2 py-0.5 text-white/40 font-mono">+{project.tech.length - 4}</span>
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

    const lenis = new Lenis({
      duration: 1.15,              // smoothness vs responsiveness (1.0–1.4 is the sweet spot)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
    })

    // Drive Lenis with requestAnimationFrame
    let rafId: number
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}

// ============ MINIMAL SPLASH SCREEN ============
// White background, purple "ARJUN" wordmark, click to enter.

function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const [leaving, setLeaving] = useState(false)

  const handleClick = () => {
    if (leaving) return
    setLeaving(true)
    // Wait for exit animation, then notify parent
    setTimeout(onEnter, 900)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[500] flex items-center justify-center cursor-pointer"
      onClick={handleClick}
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      style={{ background: '#ffffff' }}
    >
      {/* Subtle radial glow behind the name */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(138, 43, 226, 0.08), transparent 70%)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* The wordmark */}
      <motion.div
        className="relative flex items-start"
        initial={{ opacity: 0, y: 30, letterSpacing: '0.5em' }}
        animate={{
          opacity: leaving ? 0 : 1,
          y: leaving ? -20 : 0,
          letterSpacing: leaving ? '0.2em' : '0.05em',
        }}
        transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.h1
          className="font-bold select-none"
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            color: '#8A2BE2',
            fontSize: 'clamp(56px, 12vw, 160px)',
            lineHeight: 1,
            letterSpacing: '0.05em',
          }}
        >
          ARJUN
        </motion.h1>
        {/* Registered-style superscript */}
        <motion.span
          className="text-sm font-medium mt-3 ml-1"
          style={{
            color: '#8A2BE2',
            opacity: 0.6,
            fontFamily: 'var(--font-inter), sans-serif',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: leaving ? 0 : 0.6 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          ®
        </motion.span>
      </motion.div>

      {/* "Click to enter" hint at bottom */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: leaving ? 0 : [0, 0.5, 0] }}
        transition={{ delay: 1, duration: 2.5, repeat: Infinity }}
      >
        <span
          className="text-xs uppercase tracking-[0.4em] font-medium"
          style={{ color: '#8A2BE2', fontFamily: 'var(--font-inter), sans-serif' }}
        >
          Click to enter
        </span>
      </motion.div>
    </motion.div>
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
  const sound = useSoundEffects()
  const heroRef = useRef<HTMLElement>(null)
  const heroInView = useInView(heroRef, { once: true })

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
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
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

      {/* ============ DYNAMIC COLOR AURORA BACKGROUND ============ */}
      <motion.div
        className="fixed inset-0 z-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 20% 20%, rgba(20,184,166,0.12), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(251,191,36,0.10), transparent 50%)',
            'radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.10), transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(249,115,22,0.08), transparent 50%)',
            'radial-gradient(ellipse at 50% 50%, rgba(20,184,166,0.12), transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(251,191,36,0.08), transparent 50%)',
            'radial-gradient(ellipse at 20% 20%, rgba(20,184,166,0.12), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(251,191,36,0.10), transparent 50%)',
          ],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      {/* ============ 3D BACKGROUND CANVAS ============ */}
      <div className="fixed inset-0 z-0">
        {mounted && (
          <Canvas
            camera={{ position: [0, 0, 8], fov: 60 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
          >
            <Suspense fallback={null}>
              <Scene3D />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
                enableDamping
                dampingFactor={0.05}
              />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* ============ ANIMATED GRID OVERLAY ============ */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ============ GRADIENT GLOWS ============ */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(20,184,166,0.12), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.10), transparent 70%)',
          filter: 'blur(60px)',
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
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6"
          >
            <GradientText>Arjun Vashishtha</GradientText>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-xl md:text-2xl mb-4 font-mono"
          >
            <GradientText>Software Management · Data Science · AI Builder</GradientText>
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

      {/* ============ AI AGENTS SECTION — HOLOGRAPHIC ============ */}
      <section id="agents" className="relative z-10 py-24 px-6 overflow-hidden">
        {/* Floating background particles for this section */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => {
            const left = (i * 37) % 100
            const top = (i * 53) % 100
            const delay = (i * 0.7) % 3
            const duration = 3 + (i % 3)
            return (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-teal-400/30"
                style={{ left: `${left}%`, top: `${top}%` }}
                animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration, repeat: Infinity, delay }}
              />
            )
          })}
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <Badge variant="secondary" className="bg-teal-500/10 text-teal-400 border-teal-500/30 font-mono">{"// ai engineering"}</Badge>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              <GradientText>AI Agents</GradientText>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Autonomous AI systems — each demonstrating a different agent pattern
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {AI_AGENTS.map((agent, i) => (
              <HoloCard key={agent.name} agent={agent} index={i} sound={sound} />
            ))}
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'AI Agents Built', value: '4', color: 'text-teal-400' },
              { label: 'Agent Patterns', value: '3', color: 'text-amber-400' },
              { label: 'API Cost', value: '$0', color: 'text-purple-400' },
              { label: 'Free Stack', value: '100%', color: 'text-orange-400' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                onMouseEnter={() => sound.playPop()}
              >
                <Card className="liquid-glass text-center">
                  <CardContent className="pt-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + 0.3, type: 'spring' }}
                      className={`text-4xl font-bold ${stat.color} font-mono`}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-xs text-white/50 uppercase tracking-wider mt-1">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ PROJECTS SECTION ============ */}
      <section id="projects" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/30 font-mono">{"// portfolio"}</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Projects
            </h2>
            <p className="text-white/50">{PROJECTS.length}+ projects built</p>
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
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 backdrop-blur-md'
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
      <section id="about" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-mono">{"// about me"}</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
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
              <div className="space-y-4 text-white/60 leading-relaxed">
                <p>
                  I'm a 4th-year B.Tech Computer Science & Engineering student at{' '}
                  <span className="text-indigo-400 font-semibold">VIT Bhopal University</span>,
                  currently working in Software Management & Marketing at{' '}
                  <span className="text-indigo-400 font-semibold">Techify Inc.</span>
                </p>
                <p>
                  My foundation is in <span className="text-indigo-400 font-semibold">Python, machine learning, and data analytics</span>,
                  with hands-on experience building AI/ML projects. Recently, I've been diving deep into{' '}
                  <span className="text-indigo-400 font-semibold">AI engineering</span> — building 4 production-ready AI agents.
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
                    <div className="text-xs font-mono text-indigo-400 mb-2 uppercase tracking-wider">{category}</div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <motion.span
                          key={skill}
                          whileHover={{ scale: 1.1, y: -2 }}
                          onMouseEnter={() => sound.playPop()}
                          className="px-3 py-1 text-sm bg-white/5 border border-white/10 rounded-lg font-mono text-white/70 cursor-default"
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
      <section id="contact" className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/30 font-mono">{"// let's connect"}</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Get In Touch
            </h2>
            <p className="text-white/50">Open to opportunities, collaborations, and AI conversations</p>
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
                <Card className="liquid-glass text-center h-full">
                  <CardContent className="pt-6 pb-4">
                    <contact.icon className="w-6 h-6 mx-auto mb-3 text-indigo-400" />
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-1">{contact.label}</div>
                    <div className="text-sm text-white/70 font-mono truncate">{contact.value}</div>
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
            <Card className="liquid-glass text-center p-8">
              <Sparkles className="w-8 h-8 mx-auto mb-4 text-purple-400" />
              <h3 className="text-xl font-bold mb-3">Have a project in mind?</h3>
              <p className="text-white/50 mb-6">I'm always interested in hearing about new ideas and AI collaborations.</p>
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
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/40 text-sm font-mono">
            Built with Next.js · Three.js · Framer Motion · © {new Date().getFullYear()} Arjun Vashishtha
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
