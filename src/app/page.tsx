'use client'

import { useRef, useState, useEffect, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Stars, Text, Sphere, Box, Cylinder, Cone, Torus, Octahedron, Dodecahedron, Icosahedron, ContactShadows } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Github, Mail, ExternalLink, Brain, Code2, Rocket, Sparkles, ArrowLeft } from 'lucide-react'
import * as THREE from 'three'

// ============ TYPES ============
type Zone = {
  id: string
  position: [number, number, number]
  color: string
  title: string
  subtitle: string
  icon: string
  content?: string
  items?: { name: string; desc: string; tech: string[]; link?: string }[]
}

// ============ ZONES DATA ============
const ZONES: Zone[] = [
  {
    id: 'about',
    position: [-12, 0, -8],
    color: '#14b8a6',
    title: 'About Me',
    subtitle: '4th-year B.Tech CSE @ VIT Bhopal',
    icon: '👋',
    content: "I'm Arjun Vashishtha, a 4th-year B.Tech CSE student at VIT Bhopal, currently working in Software Management & Marketing at Techify Inc. I build AI agents, full-stack apps, and data-driven solutions. My foundation is in Python, ML, and data analytics.",
  },
  {
    id: 'agents',
    position: [12, 0, -8],
    color: '#fbbf24',
    title: 'AI Agents',
    subtitle: '4 autonomous AI agents built',
    icon: '🤖',
    items: [
      { name: 'Research Agent', desc: 'ReAct pattern with web search, Wikipedia, URL reader', tech: ['Next.js', 'Cerebras'], link: 'https://test-agent1.vercel.app/' },
      { name: 'Multi-Agent System', desc: '3 agents: Researcher → Writer → Editor', tech: ['Next.js', 'Cerebras'], link: 'https://github.com/arjundroid12/multi-agent-system' },
      { name: 'Data Analyst Agent', desc: 'Upload CSV → AI writes Python → Pyodide executes → charts', tech: ['Next.js', 'Pyodide'], link: 'https://github.com/arjundroid12/data-analyst-agent' },
      { name: 'Coding Agent', desc: 'Describe what you want → AI writes code → live preview', tech: ['Next.js', 'Cerebras'], link: 'https://github.com/arjundroid12/coding-agent' },
    ],
  },
  {
    id: 'projects',
    position: [-12, 0, 12],
    color: '#a855f7',
    title: 'Projects',
    subtitle: '16+ projects on GitHub',
    icon: '🚀',
    items: [
      { name: 'Realtime Chat', desc: 'Multi-room chat with Socket.io', tech: ['Node.js', 'Socket.io'], link: 'https://github.com/arjundroid12/realtime-chat' },
      { name: 'SmartAgro', desc: 'AI plant disease detection with CNN', tech: ['Python', 'ML'], link: 'https://github.com/arjundroid12/SmartAgro-A-disease-detection-model-with-Human-Interaction' },
      { name: 'Calculator', desc: 'Custom expression parser, no eval', tech: ['Vanilla JS'], link: 'https://arjun-calculator.surge.sh' },
      { name: 'Notes App', desc: 'Markdown notes with custom parser', tech: ['Vanilla JS'], link: 'https://arjun-notes.surge.sh' },
      { name: 'Weather App', desc: 'Open-Meteo API, 5-day forecast', tech: ['Vanilla JS'], link: 'https://arjun-weather.surge.sh' },
      { name: 'JWT Auth Demo', desc: 'bcrypt + refresh tokens + protected routes', tech: ['Node.js', 'JWT'], link: 'https://github.com/arjundroid12/jwt-auth-demo' },
    ],
  },
  {
    id: 'contact',
    position: [12, 0, 12],
    color: '#f97316',
    title: 'Contact',
    subtitle: 'Let\'s build something together',
    icon: '📧',
    content: "arjunvashishtha2004@gmail.com\n+91 9105459616\nBhopal, India\nGitHub: @arjundroid12",
  },
]

// ============ PLAYER (drivable shape) ============
function Player({ onNearZone, controlsRef }: { onNearZone: (zone: Zone | null) => void; controlsRef: any }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const trailRef = useRef<THREE.Group>(null)
  const velocity = useRef(new THREE.Vector3())
  const position = useRef(new THREE.Vector3(0, 0.5, 0))
  const rotation = useRef(0)
  const keys = useRef<Record<string, boolean>>({})
  const { camera } = useThree()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent, down: boolean) => {
      const key = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        keys.current[key] = down
        e.preventDefault()
      }
    }
    const onKeyDown = (e: KeyboardEvent) => handleKey(e, true)
    const onKeyUp = (e: KeyboardEvent) => handleKey(e, false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Expose controls for mobile
  useEffect(() => {
    if (controlsRef) {
      controlsRef.current = {
        setKey: (key: string, val: boolean) => { keys.current[key] = val }
      }
    }
  }, [controlsRef])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const dt = Math.min(delta, 0.1)
    const speed = 8
    const turnSpeed = 2.5
    const friction = 0.92

    // Input
    let forward = 0
    let turn = 0
    if (keys.current['w'] || keys.current['arrowup']) forward = 1
    if (keys.current['s'] || keys.current['arrowdown']) forward = -0.6
    if (keys.current['a'] || keys.current['arrowleft']) turn = 1
    if (keys.current['d'] || keys.current['arrowright']) turn = -1

    // Rotate
    rotation.current += turn * turnSpeed * dt

    // Move forward/backward
    const dir = new THREE.Vector3(
      Math.sin(rotation.current) * forward * speed * dt,
      0,
      Math.cos(rotation.current) * forward * speed * dt
    )
    velocity.current.add(dir)
    velocity.current.multiplyScalar(friction)

    // Jump
    if (keys.current[' ']) {
      velocity.current.y = Math.max(velocity.current.y, 0.15)
    }

    // Apply velocity
    position.current.add(velocity.current)
    position.current.y = Math.max(0.5, position.current.y - 0.02)

    // Boundary
    const bound = 22
    position.current.x = Math.max(-bound, Math.min(bound, position.current.x))
    position.current.z = Math.max(-bound, Math.min(bound, position.current.z))

    // Apply to mesh
    meshRef.current.position.copy(position.current)
    meshRef.current.rotation.y = rotation.current

    // Bounce effect
    meshRef.current.position.y = position.current.y + Math.abs(velocity.current.length()) * 0.05

    // Camera follow
    const camTarget = new THREE.Vector3(
      position.current.x - Math.sin(rotation.current) * 8,
      position.current.y + 5,
      position.current.z - Math.cos(rotation.current) * 8
    )
    camera.position.lerp(camTarget, 0.05)
    camera.lookAt(position.current)

    // Check nearby zones
    let nearest: Zone | null = null
    let nearestDist = 5
    for (const zone of ZONES) {
      const dist = position.current.distanceTo(new THREE.Vector3(...zone.position))
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = zone
      }
    }
    onNearZone(nearest)
  })

  return (
    <group>
      {/* Player body — glowing crystal */}
      <mesh ref={meshRef} position={[0, 0.5, 0]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          color="#14b8a6"
          emissive="#14b8a6"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* Glow */}
      <pointLight position={[0, 0.5, 0]} intensity={1} distance={6} color="#14b8a6" />
    </group>
  )
}

// ============ ZONE OBJECT ============
function ZoneObject({ zone }: { zone: Zone }) {
  const ref = useRef<THREE.Group>(null)
  const [pos] = useState(zone.position)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.3
      ref.current.position.y = pos[1] + 1 + Math.sin(state.clock.elapsedTime + pos[0]) * 0.3
    }
  })

  return (
    <group position={pos}>
      {/* Base platform */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 0.1, 32]} />
        <meshStandardMaterial color={zone.color} transparent opacity={0.2} />
      </mesh>
      {/* Glow ring */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.5, 32]} />
        <meshBasicMaterial color={zone.color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Floating icon object */}
      <group ref={ref} position={[0, 1.5, 0]}>
        <mesh>
          <dodecahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial
            color={zone.color}
            emissive={zone.color}
            emissiveIntensity={0.3}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Wireframe overlay */}
        <mesh scale={1.02}>
          <dodecahedronGeometry args={[0.8, 0]} />
          <meshBasicMaterial color={zone.color} wireframe transparent opacity={0.3} />
        </mesh>
      </group>
      {/* Label */}
      <Text
        position={[0, 3.2, 0]}
        fontSize={0.4}
        color={zone.color}
        anchorX="center"
        anchorY="middle"
      >
        {zone.title}
      </Text>
      <Text
        position={[0, 2.7, 0]}
        fontSize={0.2}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {zone.subtitle}
      </Text>
      {/* Point light */}
      <pointLight position={[0, 2, 0]} intensity={0.5} distance={8} color={zone.color} />
    </group>
  )
}

// ============ DECORATIVE OBJECTS ============
function DecorObjects() {
  const objects = useMemo(() => {
    const items = []
    const colors = ['#14b8a6', '#fbbf24', '#a855f7', '#f97316']
    const shapes = ['icosahedron', 'torus', 'cone', 'box']
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const radius = 18 + Math.random() * 4
      items.push({
        position: [
          Math.cos(angle) * radius,
          1 + (i % 3) * 0.5,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        color: colors[i % 4],
        shape: shapes[i % 4],
        speed: 0.3 + (i % 3) * 0.2,
        scale: 0.3 + (i % 3) * 0.15,
      })
    }
    return items
  }, [])

  return (
    <>
      {objects.map((obj, i) => (
        <DecorObject key={i} {...obj} />
      ))}
    </>
  )
}

function DecorObject({ position, color, shape, speed, scale }: any) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * speed * 0.5
      ref.current.rotation.y = state.clock.elapsedTime * speed
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3
    }
  })
  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={ref} position={position} scale={scale}>
        {shape === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
        {shape === 'torus' && <torusGeometry args={[0.6, 0.2, 12, 32]} />}
        {shape === 'cone' && <coneGeometry args={[0.7, 1.2, 8]} />}
        {shape === 'box' && <boxGeometry args={[1, 1, 1]} />}
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} transparent opacity={0.6} />
      </mesh>
    </Float>
  )
}

// ============ GROUND ============
function Ground() {
  return (
    <>
      {/* Main ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60, 1, 1]} />
        <meshStandardMaterial color="#0f0f1e" metalness={0.3} roughness={0.8} />
      </mesh>
      {/* Grid lines */}
      <gridHelper args={[60, 30, '#14b8a6', '#1a1a2e']} position={[0, 0.01, 0]} />
      {/* Boundary walls (invisible) */}
      <mesh position={[0, 0, 24]}>
        <boxGeometry args={[50, 0.5, 0.5]} />
        <meshBasicMaterial color="#14b8a6" transparent opacity={0.1} />
      </mesh>
      <mesh position={[0, 0, -24]}>
        <boxGeometry args={[50, 0.5, 0.5]} />
        <meshBasicMaterial color="#14b8a6" transparent opacity={0.1} />
      </mesh>
      <mesh position={[24, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 50]} />
        <meshBasicMaterial color="#14b8a6" transparent opacity={0.1} />
      </mesh>
      <mesh position={[-24, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 50]} />
        <meshBasicMaterial color="#14b8a6" transparent opacity={0.1} />
      </mesh>
    </>
  )
}

// ============ SCENE ============
function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.6} color="#14b8a6" castShadow />
      <pointLight position={[-10, 5, -10]} intensity={0.3} color="#fbbf24" />
      <pointLight position={[10, 5, 10]} intensity={0.3} color="#a855f7" />

      <Ground />

      {ZONES.map((zone) => (
        <ZoneObject key={zone.id} zone={zone} />
      ))}

      <DecorObjects />

      <Stars radius={80} depth={40} count={1000} factor={3} saturation={0} fade speed={0.5} />
    </>
  )
}

// ============ INFO PANEL ============
function InfoPanel({ zone, onClose }: { zone: Zone | null; onClose: () => void }) {
  if (!zone) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
      >
        <div className="liquid-glass-strong rounded-2xl overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1" style={{ background: zone.color }} />
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{zone.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{zone.title}</h3>
                  <p className="text-sm font-mono" style={{ color: zone.color }}>{zone.subtitle}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            {zone.content && (
              <p className="text-sm text-gray-400 leading-relaxed mb-4 whitespace-pre-line">{zone.content}</p>
            )}

            {/* Items */}
            {zone.items && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {zone.items.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                        <div className="flex gap-1 mt-1">
                          {item.tech.map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-gray-500 font-mono">{t}</span>
                          ))}
                        </div>
                      </div>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener"
                          className="ml-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" style={{ color: zone.color }} />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============ MAIN PAGE ============

export default function Home() {
  const [nearZone, setNearZone] = useState<Zone | null>(null)
  
  const [mounted, setMounted] = useState(false)
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Show info when near a zone — derive from state
  const showInfo = !!nearZone

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden">
      {/* 3D Canvas */}
      {mounted && (
        <Canvas
          shadows
          camera={{ position: [0, 6, 10], fov: 55 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <Scene />
            <Player onNearZone={setNearZone} controlsRef={controlsRef} />
          </Suspense>
        </Canvas>
      )}

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        {/* Title */}
        <div className="text-center pt-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl md:text-3xl font-bold"
          >
            <span style={{ background: 'linear-gradient(90deg, #14b8a6, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Arjun Vashishtha
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-gray-500 font-mono mt-1"
          >
            Drive around to explore my portfolio
          </motion.p>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-6 right-6 z-30 pointer-events-none">
        <div className="liquid-glass rounded-xl p-3 text-xs font-mono text-gray-400 space-y-1">
          <p><span className="text-teal-400">WASD</span> / <span className="text-teal-400">Arrows</span> — Move</p>
          <p><span className="text-teal-400">Space</span> — Jump</p>
          <p className="text-amber-400/60">Drive near zones to explore</p>
        </div>
      </div>

      {/* Mobile controls */}
      <div className="md:hidden absolute bottom-6 left-6 z-30">
        <div className="grid grid-cols-3 gap-2 w-36">
          <div></div>
          <button
            className="h-12 rounded-xl liquid-glass flex items-center justify-center text-white text-xl"
            onTouchStart={() => controlsRef.current?.setKey('w', true)}
            onTouchEnd={() => controlsRef.current?.setKey('w', false)}
          >↑</button>
          <div></div>
          <button
            className="h-12 rounded-xl liquid-glass flex items-center justify-center text-white text-xl"
            onTouchStart={() => controlsRef.current?.setKey('a', true)}
            onTouchEnd={() => controlsRef.current?.setKey('a', false)}
          >←</button>
          <button
            className="h-12 rounded-xl liquid-glass flex items-center justify-center text-white text-xl"
            onTouchStart={() => controlsRef.current?.setKey('s', true)}
            onTouchEnd={() => controlsRef.current?.setKey('s', false)}
          >↓</button>
          <button
            className="h-12 rounded-xl liquid-glass flex items-center justify-center text-white text-xl"
            onTouchStart={() => controlsRef.current?.setKey('d', true)}
            onTouchEnd={() => controlsRef.current?.setKey('d', false)}
          >→</button>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && nearZone && (
        <InfoPanel zone={nearZone} onClose={() => { setShowInfo(false); setNearZone(null) }} />
      )}

      {/* GitHub link */}
      <a
        href="https://github.com/arjundroid12"
        target="_blank"
        rel="noopener"
        className="absolute top-6 right-6 z-30 liquid-glass rounded-xl p-3 hover:scale-105 transition-transform pointer-events-auto"
      >
        <Github className="w-5 h-5 text-white" />
      </a>
    </div>
  )
}
