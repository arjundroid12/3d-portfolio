'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sphere, MeshDistortMaterial, Stars, OrbitControls, Torus, Icosahedron, Text3D, Center } from '@react-three/drei'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Github, Mail, MapPin, Phone, ExternalLink, Download, Sparkles, Zap, Code2, Brain, Database, Cpu, Rocket, ArrowDown, X } from 'lucide-react'

// ============ 3D SCENE COMPONENTS ============

function FloatingShape({ position, geometry, color, speed = 1, scale = 1 }) {
  const meshRef = useRef<any>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3
    }
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {geometry === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
        {geometry === 'torus' && <torusGeometry args={[0.8, 0.3, 16, 32]} />}
        {geometry === 'box' && <boxGeometry args={[1.2, 1.2, 1.2]} />}
        {geometry === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
        <MeshDistortMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          distort={0.3}
          speed={2}
        />
      </mesh>
    </Float>
  )
}

function AnimatedSphere() {
  const meshRef = useRef<any>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[2.5, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.5}
          speed={1.5}
          roughness={0.1}
          metalness={0.9}
        />
      </Sphere>
    </Float>
  )
}

function ParticleField() {
  const points = useRef<any>(null)
  
  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = clock.getElapsedTime() * 0.05
      points.current.rotation.x = clock.getElapsedTime() * 0.02
    }
  })

  const particleCount = 2000
  const positions = new Float32Array(particleCount * 3)
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30
    positions[i * 3 + 1] = (Math.random() - 0.5) * 30
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30
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
        size={0.03}
        color="#a855f7"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#6366f1" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#a855f7" />
      <pointLight position={[5, -5, 5]} intensity={0.3} color="#06b6d4" />
      
      <AnimatedSphere />
      
      <FloatingShape position={[-4, 2, -2]} geometry="icosahedron" color="#a855f7" speed={0.8} scale={0.8} />
      <FloatingShape position={[4, -1, -1]} geometry="torus" color="#06b6d4" speed={1.2} scale={0.7} />
      <FloatingShape position={[-3, -2, 1]} geometry="octahedron" color="#10b981" speed={0.9} scale={0.6} />
      <FloatingShape position={[3, 2, 0]} geometry="box" color="#f59e0b" speed={1.1} scale={0.5} />
      
      <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
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

// ============ 3D TILT CARD COMPONENT ============

function TiltCard({ project, onClick }: { project: any; onClick: () => void }) {
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
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [activeFilter, setActiveFilter] = useState('All')
  const [mounted, setMounted] = useState(false)
  const [selectedProject, setSelectedProject] = useState<typeof PROJECTS[0] | null>(null)

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
          background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.12), transparent 70%)',
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
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {item}
              </motion.a>
            ))}
            <Button size="sm" variant="outline" className="ml-2 border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
              <a href="https://github.com/arjundroid12" target="_blank" rel="noopener">
                <Github className="w-4 h-4 mr-2" /> GitHub
              </a>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* ============ HERO SECTION ============ */}
      <motion.section
        id="hero"
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-indigo-500/10 border border-indigo-500/30"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-mono text-indigo-400">Available for opportunities</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6"
            style={{
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Arjun Vashishtha
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-xl md:text-2xl text-indigo-400 mb-4 font-mono"
          >
            Software Management · Data Science · AI Builder
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto mb-10"
          >
            4th-year B.Tech CSE student at VIT Bhopal, currently at Techify Inc.
            Building autonomous AI agents, full-stack apps, and data-driven solutions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-wrap gap-4 justify-center mb-16"
          >
            <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0" asChild>
              <a href="#agents"><Brain className="w-4 h-4 mr-2" /> Explore AI Agents</a>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
              <a href="#projects"><Rocket className="w-4 h-4 mr-2" /> View Projects</a>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
              <a href="/resume.pdf" download><Download className="w-4 h-4 mr-2" /> Resume</a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            {['Python', 'React', 'Next.js', 'Cerebras', 'Power BI', 'MySQL', 'Three.js'].map((tech, i) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1 }}
                whileHover={{ scale: 1.1, y: -3 }}
                className="px-3 py-1 text-xs font-mono text-gray-400 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full"
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
                onClick={() => setActiveFilter(cat)}
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
                  <TiltCard project={project} onClick={() => setSelectedProject(project)} />
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
              <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0" asChild>
                <a href="mailto:arjunvashishtha2004@gmail.com">
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
        </div>
      </footer>

      {/* ============ PROJECT DETAIL MODAL ============ */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProject(null)}
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
                onClick={() => setSelectedProject(null)}
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
