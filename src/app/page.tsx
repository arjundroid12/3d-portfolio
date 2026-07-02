'use client'

import { useRef, useState, useEffect, Suspense, useCallback } from 'react'
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
  const [enabled, setEnabled] = useState(true)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
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

  // ============ LOFI BACKGROUND MUSIC ============
  const musicNodesRef = useRef<any>(null)

  const startMusic = useCallback(() => {
    if (musicNodesRef.current) return
    try {
      const ctx = getCtx()
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0, ctx.currentTime)
      masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2)
      masterGain.connect(ctx.destination)

      // Lofi chord progression (Am - F - C - G in lofi style)
      const chords = [
        [220, 261.63, 329.63], // Am: A C E
        [174.61, 220, 261.63], // F: F A C
        [261.63, 329.63, 392], // C: C E G
        [196, 246.94, 293.66], // G: G B D
      ]

      let chordIndex = 0
      const playChord = () => {
        if (!musicNodesRef.current) return
        const chord = chords[chordIndex]
        const now = ctx.currentTime

        // Pad chord
        chord.forEach((freq) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0, now)
          gain.gain.linearRampToValueAtTime(0.3, now + 0.5)
          gain.gain.linearRampToValueAtTime(0, now + 3.5)
          osc.connect(gain)
          gain.connect(masterGain)
          osc.start(now)
          osc.stop(now + 4)
        })

        // Bass note
        const bassOsc = ctx.createOscillator()
        const bassGain = ctx.createGain()
        bassOsc.type = 'triangle'
        bassOsc.frequency.value = chord[0] / 2
        bassGain.gain.setValueAtTime(0, now)
        bassGain.gain.linearRampToValueAtTime(0.2, now + 0.3)
        bassGain.gain.linearRampToValueAtTime(0, now + 3.5)
        bassOsc.connect(bassGain)
        bassGain.connect(masterGain)
        bassOsc.start(now)
        bassOsc.stop(now + 4)

        // Melody note (random from chord)
        const melodyOsc = ctx.createOscillator()
        const melodyGain = ctx.createGain()
        melodyOsc.type = 'sine'
        melodyOsc.frequency.value = chord[Math.floor(Math.random() * chord.length)] * 2
        melodyGain.gain.setValueAtTime(0, now + 1)
        melodyGain.gain.linearRampToValueAtTime(0.1, now + 1.3)
        melodyGain.gain.linearRampToValueAtTime(0, now + 2.5)
        melodyOsc.connect(melodyGain)
        melodyGain.connect(masterGain)
        melodyOsc.start(now + 1)
        melodyOsc.stop(now + 3)

        chordIndex = (chordIndex + 1) % chords.length
      }

      playChord()
      const interval = setInterval(playChord, 4000)
      musicNodesRef.current = { masterGain, interval }
    } catch {}
  }, [getCtx])

  const stopMusic = useCallback(() => {
    if (!musicNodesRef.current) return
    try {
      const ctx = getCtx()
      musicNodesRef.current.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
      clearInterval(musicNodesRef.current.interval)
      setTimeout(() => {
        if (musicNodesRef.current) {
          musicNodesRef.current.masterGain.disconnect()
          musicNodesRef.current = null
        }
      }, 1500)
    } catch {}
  }, [getCtx])

  // Start/stop music based on enabled state
  useEffect(() => {
    if (enabled) {
      startMusic()
    } else {
      stopMusic()
    }
    
  }, [enabled])

  return { enabled, setEnabled, playHover, playClick, playModalOpen, playModalClose, playNavHover, playFilter, playScroll, playWarp, playPop, playSuccess }
}

// ============ 3D SCENE COMPONENTS ============

function FloatingShape({ position, geometry, color, speed = 1, scale = 1 }) {
  const meshRef = useRef<any>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15 * speed
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2 * speed
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {geometry === 'dodecahedron' && <dodecahedronGeometry args={[1, 0]} />}
        {geometry === 'tetrahedron' && <tetrahedronGeometry args={[1.2, 0]} />}
        {geometry === 'torus' && <torusGeometry args={[0.7, 0.28, 16, 48]} />}
        {geometry === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
        {geometry === 'cone' && <coneGeometry args={[0.9, 1.5, 8]} />}
        {geometry === 'capsule' && <capsuleGeometry args={[0.5, 1, 8, 16]} />}
        <MeshDistortMaterial
          color={color}
          roughness={0.1}
          metalness={0.9}
          distort={0.2}
          speed={1.5}
        />
      </mesh>
    </Float>
  )
}

function AnimatedSphere() {
  const meshRef = useRef<any>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.08
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.03
    }
  })

  return (
    <Float speed={0.8} rotationIntensity={0.3} floatIntensity={0.8}>
      <Sphere ref={meshRef} args={[2.2, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#14b8a6"
          attach="material"
          distort={0.35}
          speed={1.2}
          roughness={0.05}
          metalness={0.95}
        />
      </Sphere>
    </Float>
  )
}

function ParticleField() {
  const points = useRef<any>(null)
  
  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = clock.getElapsedTime() * 0.03
      points.current.rotation.x = clock.getElapsedTime() * 0.01
    }
  })

  const particleCount = 1500
  const positions = new Float32Array(particleCount * 3)
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 35
    positions[i * 3 + 1] = (Math.random() - 0.5) * 35
    positions[i * 3 + 2] = (Math.random() - 0.5) * 35
  }

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#fbbf24"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}

// ============ TECH 3D OBJECTS ============

function Monitor({ position, scale = 1 }) {
  const ref = useRef<any>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.2
    }
  })
  return (
    <Float speed={1} rotationIntensity={0.3} floatIntensity={1}>
      <group ref={ref} position={position} scale={scale}>
        {/* Monitor body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 0.8, 0.1]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Screen (glowing) */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[1.05, 0.65]} />
          <meshStandardMaterial color="#14b8a6" emissive="#14b8a6" emissiveIntensity={0.6} />
        </mesh>
        {/* Stand */}
        <mesh position={[0, -0.55, 0]}>
          <boxGeometry args={[0.15, 0.3, 0.1]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Base */}
        <mesh position={[0, -0.72, 0]}>
          <boxGeometry args={[0.5, 0.05, 0.3]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>
    </Float>
  )
}

function PCTower({ position, scale = 1 }) {
  const ref = useRef<any>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.15
      ref.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 0.4) * 0.2
    }
  })
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1.2}>
      <group ref={ref} position={position} scale={scale}>
        {/* Tower body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.6, 1.3, 0.8]} />
          <meshStandardMaterial color="#0f0f1e" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Power button (glowing) */}
        <mesh position={[0, 0.5, 0.41]}>
          <circleGeometry args={[0.06, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
        </mesh>
        {/* LED strip */}
        <mesh position={[0, 0.2, 0.41]}>
          <planeGeometry args={[0.4, 0.04]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.7} />
        </mesh>
        {/* Vent lines */}
        <mesh position={[0, -0.3, 0.41]}>
          <planeGeometry args={[0.4, 0.15]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      </group>
    </Float>
  )
}

function Laptop({ position, scale = 1 }) {
  const ref = useRef<any>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.2
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6) * 0.15
    }
  })
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={ref} position={position} scale={scale}>
        {/* Screen */}
        <mesh position={[0, 0.35, -0.2]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[1.1, 0.7, 0.06]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Screen display */}
        <mesh position={[0, 0.35, -0.17]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[0.95, 0.55]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
        </mesh>
        {/* Keyboard base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.1, 0.05, 0.7]} />
          <meshStandardMaterial color="#0f0f1e" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    </Float>
  )
}

function Phone3D({ position, scale = 1 }) {
  const ref = useRef<any>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.elapsedTime * 0.3
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.7) * 0.25
    }
  })
  return (
    <Float speed={2} rotationIntensity={0.8} floatIntensity={1.5}>
      <group ref={ref} position={position} scale={scale}>
        {/* Phone body */}
        <mesh>
          <boxGeometry args={[0.4, 0.8, 0.05]} />
          <meshStandardMaterial color="#0f0f1e" roughness={0.1} metalness={0.95} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.32, 0.7]} />
          <meshStandardMaterial color="#14b8a6" emissive="#14b8a6" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </Float>
  )
}

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#14b8a6" />
      <pointLight position={[-5, -5, -5]} intensity={0.4} color="#fbbf24" />
      <pointLight position={[5, -5, 5]} intensity={0.3} color="#a855f7" />
      <spotLight position={[0, 8, 0]} intensity={0.5} color="#14b8a6" angle={0.5} penumbra={1} />
      
      <AnimatedSphere />
      
      {/* Tech gadgets replacing geometric shapes */}
      <Monitor position={[-4.5, 2.5, -2]} scale={0.8} />
      <PCTower position={[4.5, -1, -1]} scale={0.7} />
      <Laptop position={[-3.5, -2.5, 1]} scale={0.7} />
      <Phone3D position={[4, 2.5, 0]} scale={0.6} />
      <Monitor position={[3, -2, 1.5]} scale={0.5} />
      
      <Stars radius={60} depth={50} count={2500} factor={4} saturation={0} fade speed={0.5} />
      <ParticleField />
    </>
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

// ============ SCROLL WARP (with confirmation popup) ============

function ScrollWarp({ onWarp, onConfirm }: { onWarp: () => void; onConfirm?: () => void }) {
  const [warping, setWarping] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const lastScrollY = useRef(0)
  const warpTriggered = useRef(false)
  const confirmDismissTimer = useRef<any>(null)
  const atBottomRef = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight
      const atBottom = scrollY + windowHeight >= docHeight - 50
      const scrollingDown = scrollY > lastScrollY.current
      lastScrollY.current = scrollY

      if (atBottom && scrollingDown && !warpTriggered.current) {
        if (!atBottomRef.current) {
          // First time reaching bottom — show confirmation
          atBottomRef.current = true
          setShowConfirm(true)
          onConfirm?.()

          // Auto-dismiss after 5 seconds if they don't scroll again
          confirmDismissTimer.current = setTimeout(() => {
            setShowConfirm(false)
            atBottomRef.current = false
          }, 5000)
        } else {
          // Second scroll at bottom — trigger warp!
          clearTimeout(confirmDismissTimer.current)
          setShowConfirm(false)
          warpTriggered.current = true
          setWarping(true)
          onWarp()
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }, 1500)
          setTimeout(() => {
            setWarping(false)
            warpTriggered.current = false
            atBottomRef.current = false
          }, 3500)
        }
      }

      // If user scrolls up, dismiss confirmation
      if (!atBottom && atBottomRef.current && !warpTriggered.current) {
        clearTimeout(confirmDismissTimer.current)
        setShowConfirm(false)
        atBottomRef.current = false
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onWarp])

  return (
    <>
      {/* Confirmation popup */}
      <AnimatePresence>
        {showConfirm && !warping && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] px-6 py-4 bg-white/10 backdrop-blur-xl border border-teal-500/30 rounded-2xl shadow-2xl pointer-events-none"
          >
            <div className="flex items-center gap-3">
              <motion.span
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-2xl"
              >
                🚀
              </motion.span>
              <div>
                <p className="text-white font-semibold text-sm">
                  Scroll one more time to fly to the top!
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Or scroll up to stay here
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warp overlay */}
      {warping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden"
        >
      {/* Dark backdrop that fades in */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.4 }}
      />
      
      {/* Expanding portal rings — staggered for depth */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full"
          initial={{ width: 0, height: 0, opacity: 0, borderWidth: 4 }}
          animate={{ width: [0, 2500], height: [0, 2500], opacity: [0, 0.6, 0] }}
          transition={{ duration: 2, delay: i * 0.2, ease: 'easeOut', repeat: 1 }}
          style={{
            borderStyle: 'solid',
            borderColor: i % 2 === 0 ? 'rgba(20, 184, 166, 0.5)' : 'rgba(251, 191, 36, 0.4)',
          }}
        />
      ))}

      {/* Starburst streaks emanating from center */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * 360
        return (
          <motion.div
            key={`streak-${i}`}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 1.5] }}
            transition={{ duration: 1.5, delay: 0.2 + i * 0.03, ease: 'easeOut' }}
            style={{
              width: '2px',
              height: '100vh',
              background: `linear-gradient(to bottom, transparent 0%, ${
                i % 3 === 0 ? 'rgba(20, 184, 166, 0.8)' : i % 3 === 1 ? 'rgba(251, 191, 36, 0.6)' : 'rgba(168, 85, 247, 0.5)'
              } 50%, transparent 100%)`,
              transformOrigin: 'center',
              transform: `rotate(${angle}deg)`,
            }}
          />
        )
      })}

      {/* Center portal glow */}
      <motion.div
        className="absolute rounded-full"
        initial={{ width: 0, height: 0 }}
        animate={{ width: [0, 400, 0], height: [0, 400, 0] }}
        transition={{ duration: 2, repeat: 1, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(20,184,166,0.6), rgba(251,191,36,0.3), transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Center content — spinning portal emoji */}
      <motion.div
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: [0, 1.2, 1, 1.2, 0], rotate: [0, 180, 360, 540, 720] }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
        className="relative z-10 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: 3, ease: 'linear' }}
          className="text-7xl mb-3"
        >
          🌌
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1] }}
          className="text-white font-bold text-lg font-mono tracking-widest"
        >
          WARPING TO TOP...
        </motion.p>
        <motion.div
          className="mt-2 flex gap-1 justify-center"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-teal-400"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
      )}
    </>
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
      <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-indigo-500/40 transition-colors duration-300 h-full overflow-hidden group relative">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/5 group-hover:to-pink-500/10 transition-all duration-500 pointer-events-none" />
        
        <CardHeader style={{ transform: 'translateZ(40px)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">{project.icon}</span>
              <div>
                <CardTitle className="text-base text-white">{project.name}</CardTitle>
                <Badge variant="outline" className="mt-1 text-xs border-white/20 text-gray-400">{project.category}</Badge>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
          </div>
        </CardHeader>
        <CardContent style={{ transform: 'translateZ(30px)' }}>
          <p className="text-sm text-gray-400 mb-3 leading-relaxed">{project.desc}</p>
          <div className="flex flex-wrap gap-1">
            {project.tech.slice(0, 4).map((t: string) => (
              <span key={t} className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400 font-mono">{t}</span>
            ))}
            {project.tech.length > 4 && (
              <span className="text-xs px-2 py-0.5 text-gray-600 font-mono">+{project.tech.length - 4}</span>
            )}
          </div>
        </CardContent>
      </Card>
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

  const filteredProjects = activeFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.category === activeFilter)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* ============ FUN POPUPS ============ */}
      <FunPopups enabled={sound.enabled} />

      {/* ============ SCROLL WARP OVERLAY ============ */}
      <AnimatePresence>
        <ScrollWarp onWarp={() => { sound.playWarp() }} onConfirm={() => sound.playPop()} />
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
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/5"
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
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
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
              onClick={() => { sound.setEnabled(!sound.enabled); sound.playClick() }}
              className="ml-2 p-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors"
              title={sound.enabled ? "Mute sounds" : "Enable sounds"}
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
            {/* Inner photo placeholder */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-teal-500/20 to-amber-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center overflow-hidden">
              {/* Replace this div with <img src="/photo.jpg" /> when you have your photo */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-5xl"
              >
                👨‍💻
              </motion.div>
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
            className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto mb-10"
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
                className="px-3 py-1 text-xs font-mono text-gray-400 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full cursor-pointer"
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 text-sm font-mono"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ============ AI AGENTS SECTION ============ */}
      <section id="agents" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-mono">{"// ai engineering"}</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              AI Agents
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Autonomous AI systems — each demonstrating a different agent pattern
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {AI_AGENTS.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onMouseEnter={() => sound.playPop()}
              >
                <Card className="relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300 h-full">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${agent.gradient}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${agent.gradient} bg-opacity-10`}>
                        <agent.icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="outline" className={
                        agent.difficulty === 'Advanced'
                          ? 'border-purple-500/30 text-purple-400 bg-purple-500/10'
                          : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
                      }>
                        {agent.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-4">{agent.name}</CardTitle>
                    <p className="text-sm text-indigo-400 font-mono">{agent.tagline}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">{agent.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {agent.tech.map((t) => (
                        <span key={t} className="text-xs px-2 py-1 bg-white/5 rounded-md text-gray-400 font-mono">{t}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className={`bg-gradient-to-r ${agent.gradient} border-0 text-white flex-1`} asChild>
                        <a href={agent.demo} target="_blank" rel="noopener"><ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Live Demo</a>
                      </Button>
                      <Button size="sm" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
                        <a href={agent.repo} target="_blank" rel="noopener"><Github className="w-3.5 h-3.5 mr-1.5" /> Code</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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
              { label: 'AI Agents Built', value: '4', color: 'text-indigo-400' },
              { label: 'Agent Patterns', value: '3', color: 'text-purple-400' },
              { label: 'API Cost', value: '$0', color: 'text-cyan-400' },
              { label: 'Free Stack', value: '100%', color: 'text-emerald-400' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 text-center">
                  <CardContent className="pt-6">
                    <div className={`text-3xl font-bold ${stat.color} font-mono`}>{stat.value}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{stat.label}</div>
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
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
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
              <div className="space-y-4 text-gray-400 leading-relaxed">
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
                          className="px-3 py-1 text-sm bg-white/5 border border-white/10 rounded-lg font-mono text-gray-300 cursor-default"
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
                <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-indigo-500/30 transition-all text-center h-full">
                  <CardContent className="pt-6 pb-4">
                    <contact.icon className="w-6 h-6 mx-auto mb-3 text-indigo-400" />
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{contact.label}</div>
                    <div className="text-sm text-gray-300 font-mono truncate">{contact.value}</div>
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
            <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 text-center p-8">
              <Sparkles className="w-8 h-8 mx-auto mb-4 text-purple-400" />
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
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 text-sm font-mono">
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
                <X className="w-5 h-5 text-gray-400" />
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
                <p className="text-gray-400 leading-relaxed mb-6">{selectedProject.longDesc}</p>

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
                        className="flex items-center gap-2 text-sm text-gray-300"
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
                      <span key={t} className="px-3 py-1 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-300 font-mono">
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
  )
}
