import { useEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import { useNavigate } from "react-router"
import {
  ArrowRight,
  Play,
  Sparkles,
  Brain,
  BarChart3,
  Target,
  Check,
  Mic2,
  X,
  ChevronRight,
  GraduationCap,
  Building2,
  UserSearch,
  ArrowUpRight,
  Moon,
  Sun,
  Pause,
  Shield,
} from "lucide-react"

/**
 * Paste this entire file over your existing LandingPage.tsx.
 * Same imports/packages and authentication routes as the supplied component.
 * No Three.js, GSAP, Framer Motion, external images, or external scene required.
 * The orbital field is original procedural WebGL; product panels are labeled samples.
 * Cinematic landing site only: existing backend and application screens are not replaced.
 */

// ── Data ───────────────────────────────────────────────────────────────────

const KPIS = [
  { value: "50,000+", label: "Active Students", desc: "across 12 countries" },
  {
    value: "2,400+",
    label: "Partner Colleges",
    desc: "placement offices live",
  },
  {
    value: "87%",
    label: "Placement Rate",
    desc: "avg. across partner institutions",
  },
  { value: "4.9", label: "User Rating", desc: "from 12,000+ verified reviews" },
]

const TESTIMONIALS = [
  {
    name: "Priya Mehta",
    role: "Head of Placements",
    org: "IIT Bombay",
    quote:
      "What used to take three weeks of spreadsheet work now happens in a single dashboard. Our students get better matches, faster — and we finally have the data to prove it.",
    stars: 5,
  },
  {
    name: "Arjun Kapoor",
    role: "Engineering Hiring Lead",
    org: "Razorpay",
    quote:
      "Every match is contextualized. We see the skill gap, the trajectory, the intent — not just a keyword match. It changed how we source and evaluate candidates entirely.",
    stars: 5,
  },
  {
    name: "Meera Nair",
    role: "Software Engineer",
    org: "Zepto",
    quote:
      "I uploaded my resume on Monday. By Wednesday I had three interviews lined up with companies that actually matched where I was heading — not just where I'd been.",
    stars: 5,
  },
]

const ROLES = [
  {
    label: "Student",
    subtitle: "Build your next chapter.",
    detail: "A clear view of your skills, your gaps, and what to work on next.",
    icon: GraduationCap,
    route: "/auth/student",
  },
  {
    label: "College",
    subtitle: "See the bigger picture.",
    detail: "Connect student progress with more informed placement decisions.",
    icon: Building2,
    route: "/auth/college",
  },
  {
    label: "Recruiter",
    subtitle: "Look beyond the resume.",
    detail:
      "Understand the evidence, intent, and potential behind a candidate.",
    icon: UserSearch,
    route: "/auth/recruiter",
  },
] as const

const CHAPTERS = [
  {
    number: "01",
    label: "Understand",
    title: "A clearer picture\nof your potential.",
    description:
      "Your experience is more than a document. Bring your skills, projects, and goals into one career profile.",
    icon: Brain,
    color: "#6B92FF",
    note: "Your evidence, connected.",
  },
  {
    number: "02",
    label: "Build",
    title: "Turn the missing pieces\ninto your next steps.",
    description:
      "See the gaps that matter. Turn them into a focused learning roadmap with practical projects and milestones.",
    icon: BarChart3,
    color: "#6DD9B6",
    note: "Less guessing. More direction.",
  },
  {
    number: "03",
    label: "Practice",
    title: "Meet your next interview\nwith more confidence.",
    description:
      "Prepare with ARIA and ECHO. Practice your answers, understand your feedback, and keep getting better.",
    icon: Mic2,
    color: "#BEA3FF",
    note: "Preparation with purpose.",
  },
  {
    number: "04",
    label: "Connect",
    title: "Find the opportunity\nthat fits your direction.",
    description:
      "Connect preparation with opportunity. Students, colleges, and recruiters move forward through shared career intelligence.",
    icon: Target,
    color: "#F0C484",
    note: "One connected ecosystem.",
  },
] as const

function useReducedMotion() {
  const [reduced, setReduced] = useState(true)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  return reduced
}

function Reveal({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (
      !el ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("co-visible")
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    el.classList.add("co-reveal-ready")
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

// A true ray-marched 3D sculpture: intersecting metallic torus bands and a faceted core.
const VERTEX = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`

const FRAGMENT = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_scroll;

mat2 turn(float a) { float s = sin(a), c = cos(a); return mat2(c,-s,s,c); }
float torus(vec3 p, float radius, float tube) {
  return length(vec2(length(p.xz)-radius,p.y))-tube;
}
// Original repeating orbital field. Cell-contained shapes keep the SDF continuous.
float scene(vec3 p) {
  p.xy += vec2(u_pointer.x*0.28,u_pointer.y*0.22);
  p.y += u_scroll*0.38;
  vec2 cell = floor((p.xy+1.15)/2.3);
  vec3 q = vec3(mod(p.xy+1.15,2.3)-1.15,p.z);
  float seed = fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);
  q.z += seed*0.7;
  q.xy = turn(seed*6.28+u_time*0.12) * q.xy;
  q.yz = turn(0.6+seed*1.5+sin(u_time*.16+seed*6.0)*.24) * q.yz;
  q.xz = turn(seed*2.0) * q.xz;
  float ring = torus(q,.66,.21);
  vec3 core = q;
  core.xy = turn(.7) * core.xy;
  float diamond = (abs(core.x)+abs(core.y)+abs(core.z)-.42)*.57735;
  return min(ring,diamond);
}
vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.0015,0.0);
  return normalize(vec3(
    scene(p+e.xyy)-scene(p-e.xyy),
    scene(p+e.yxy)-scene(p-e.yxy),
    scene(p+e.yyx)-scene(p-e.yyx)
  ));
}
void main() {
  vec2 uv = (gl_FragCoord.xy*2.0-u_resolution)/u_resolution.y;
  vec3 background = vec3(0.03137,0.03529,0.05490);
  float halo = exp(-dot(uv,uv)*1.15);
  vec3 color = background + vec3(0.022,0.037,0.102)*halo;
  vec3 origin = vec3(u_pointer.x*0.13,u_pointer.y*0.09,4.8-u_scroll*0.35);
  vec3 ray = normalize(vec3(uv, -1.85));
  float distanceTravelled = 0.0;
  float distanceToSurface = 1.0;
  vec3 p = origin;
  for (int i = 0; i < 76; i++) {
    p = origin + ray*distanceTravelled;
    distanceToSurface = scene(p);
    if(distanceToSurface < 0.002 || distanceTravelled > 8.0) break;
    distanceTravelled += max(distanceToSurface*0.8,0.001);
  }
  if(distanceToSurface < 0.002) {
    vec3 n = normalAt(p);
    vec3 light = normalize(vec3(-2.0,3.0,4.0));
    vec3 second = normalize(vec3(3.0,-1.0,1.0));
    float diffuse = max(dot(n,light),0.0);
    float edgeLight = max(dot(n,second),0.0);
    float fresnel = pow(1.0-max(dot(n,-ray),0.0),2.6);
    vec2 materialCell=floor((p.xy+vec2(u_pointer.x*.28,u_pointer.y*.22+u_scroll*.38)+1.15)/2.3);
    float material=fract(sin(dot(materialCell,vec2(127.1,311.7)))*43758.5453);
    vec3 base=material<.38?vec3(.025,.075,.8):material<.72?vec3(.52,.56,.65):vec3(.035,.045,.075);
    float specular = pow(max(dot(reflect(-light,n),-ray),0.0),48.0);
    float strip = pow(max(dot(reflect(-second,n),-ray),0.0),16.0);
    vec3 reflected = reflect(ray,n);
    float softbox = pow(max(0.0,1.0-abs(reflected.y-0.42)),24.0);
    color = base*(0.25+diffuse*1.1)
      + vec3(0.78,0.87,1.0)*specular*1.15
      + vec3(0.29,0.48,1.0)*strip*0.8
      + vec3(0.28,0.44,0.9)*fresnel*0.7
      + vec3(0.09,0.12,0.32)*edgeLight
      + vec3(0.65,0.77,1.0)*softbox*0.52;
    color = mix(color,background,clamp((distanceTravelled-4.0)*0.055,0.0,0.25));
  }
  float vignette = 1.0-smoothstep(0.65,2.2,length(uv))*0.5;
  color = mix(background,color,vignette);
  gl_FragColor = vec4(color,1.0);
}
`

function CareerSculpture({ reduced }: { reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    })
    if (!gl) return
    let stopped = false
    let frame = 0
    let onScreen = true
    let time = 0
    let lastDraw = 0
    let px = 0,
      py = 0,
      tx = 0,
      ty = 0
    const shaders: WebGLShader[] = []
    let program: WebGLProgram | null = null
    let buffer: WebGLBuffer | null = null
    const release = () => {
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
      shaders.forEach((shader) => gl.deleteShader(shader))
    }
    try {
      const compile = (type: number, code: string) => {
        const shader = gl.createShader(type)
        if (!shader) throw new Error("Shader unavailable")
        shaders.push(shader)
        gl.shaderSource(shader, code)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new Error("Shader unsupported")
        return shader
      }
      program = gl.createProgram()
      if (!program) throw new Error("WebGL program unavailable")
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error("Program unsupported")
      gl.useProgram(program)
      buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      )
      const position = gl.getAttribLocation(program, "a_position")
      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    } catch {
      release()
      return
    }
    const resolution = gl.getUniformLocation(program, "u_resolution")
    const pointer = gl.getUniformLocation(program, "u_pointer")
    const clock = gl.getUniformLocation(program, "u_time")
    const scroll = gl.getUniformLocation(program, "u_scroll")
    const draw = () => {
      if (stopped || gl.isContextLost()) return
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        rect.width < 600 ? 0.85 : 1,
      )
      const width = Math.max(1, Math.round(rect.width * ratio))
      const height = Math.max(1, Math.round(rect.height * ratio))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, width, height)
      gl.uniform2f(resolution, width, height)
      gl.uniform2f(pointer, px, py)
      gl.uniform1f(clock, reduced ? 3.5 : time)
      gl.uniform1f(
        scroll,
        reduced
          ? 0
          : Math.min(1.5, Math.max(0, -rect.top / Math.max(rect.height, 1))),
      )
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
    const tick = (now: number) => {
      frame = 0
      if (stopped || reduced || !onScreen || document.hidden) return
      if (now - lastDraw >= 30) {
        time += Math.min((now - (lastDraw || now)) / 1000, 0.05)
        px += (tx - px) * 0.075
        py += (ty - py) * 0.075
        draw()
        lastDraw = now
      }
      frame = requestAnimationFrame(tick)
    }
    const resume = () => {
      if (stopped) return
      if (reduced) {
        draw()
        return
      }
      if (onScreen && !document.hidden && !frame) {
        frame = requestAnimationFrame(tick)
      }
    }
    const move = (event: PointerEvent) => {
      if (reduced || event.pointerType === "touch") return
      const rect = canvas.getBoundingClientRect()
      tx = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
      )
      ty = Math.max(
        -1,
        Math.min(1, 1 - ((event.clientY - rect.top) / rect.height) * 2),
      )
    }
    const leave = () => {
      tx = 0
      ty = 0
    }
    const resize = () => {
      draw()
      resume()
    }
    const lost = () => {
      stopped = true
      cancelAnimationFrame(frame)
      setAvailable(false)
    }
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              onScreen = entry.isIntersecting
              if (!onScreen) {
                cancelAnimationFrame(frame)
                frame = 0
              } else resume()
            },
            { rootMargin: "80px" },
          )
        : null
    observer?.observe(canvas)
    canvas.addEventListener("pointermove", move)
    canvas.addEventListener("pointerleave", leave)
    canvas.addEventListener("webglcontextlost", lost)
    window.addEventListener("resize", resize)
    document.addEventListener("visibilitychange", resume)
    draw()
    setAvailable(true)
    resume()
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      observer?.disconnect()
      canvas.removeEventListener("pointermove", move)
      canvas.removeEventListener("pointerleave", leave)
      canvas.removeEventListener("webglcontextlost", lost)
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", resume)
      release()
    }
  }, [reduced])
  return (
    <div className="co-sculpture" aria-hidden="true">
      <div className="co-orbit-fallback" style={{ opacity: available ? 0 : 1 }}>
        <i />
        <i />
        <i />
        <b />
      </div>
      <canvas ref={canvasRef} style={{ opacity: available ? 1 : 0 }} />
      <div className="co-scene-grain" />
    </div>
  )
}

function Tilt({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reset = () => {
    ref.current?.style.setProperty("--rx", "0deg")
    ref.current?.style.setProperty("--ry", "0deg")
  }
  return (
    <div
      ref={ref}
      className={`co-tilt ${className}`}
      onPointerMove={(e) => {
        if (
          e.pointerType === "touch" ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return
        const box = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty(
          "--rx",
          `${(-(e.clientY - box.top - box.height / 2) / box.height) * 7}deg`,
        )
        e.currentTarget.style.setProperty(
          "--ry",
          `${((e.clientX - box.left - box.width / 2) / box.width) * 7}deg`,
        )
      }}
      onPointerLeave={reset}
    >
      {children}
    </div>
  )
}

function ProductPreview({ chapter }: { chapter: number }) {
  const color = CHAPTERS[chapter].color
  return (
    <div
      className="co-preview"
      style={{ "--co-preview-accent": color } as CSSProperties}
    >
      <div className="co-browser">
        <span className="co-dots">
          <i />
          <i />
          <i />
        </span>
        <span>CareerOS / {CHAPTERS[chapter].label}</span>
        <span className="co-sample">Sample workspace</span>
      </div>
      <div className="co-preview-shell">
        <aside className="co-mini-rail" aria-hidden="true">
          {[Brain, BarChart3, Mic2, Target].map((Icon, i) => (
            <div className={i === chapter ? "active" : ""} key={i}>
              <Icon size={18} />
            </div>
          ))}
        </aside>
        <div className="co-preview-content" key={chapter}>
          {chapter === 0 && (
            <>
              <div className="co-preview-heading">
                <div>
                  <span className="co-eyebrow">CAREER TWIN</span>
                  <h3>Hello, Aanya.</h3>
                  <p>Your experience. A new perspective.</p>
                </div>
                <div className="co-avatar">AS</div>
              </div>
              <div className="co-profile-banner">
                <Brain size={22} />
                <div>
                  <small>YOUR TARGET ROLE</small>
                  <strong>AI Engineer</strong>
                </div>
                <span className="co-chip">In focus</span>
              </div>
              <p className="co-field-label">YOUR FOUNDATION</p>
              <div className="co-skill-chips">
                {["Python", "Git", "SQL", "Problem solving"].map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <div className="co-insight">
                <Sparkles size={17} />
                <p>
                  Your next step: turn your technical foundation into a
                  retrieval project.
                </p>
              </div>
              <div className="cin-evidence-grid">
                <div>
                  <span className="co-field-label">EVIDENCE CONNECTED</span>
                  <strong>Skills with a story.</strong>
                  <p>
                    <Check size={13} /> Python · Resume + projects
                  </p>
                  <p>
                    <Check size={13} /> SQL · Project experience
                  </p>
                  <p>
                    <Target size={13} /> Retrieval · Next learning focus
                  </p>
                </div>
                <div>
                  <span className="co-field-label">YOUR NEXT MILESTONE</span>
                  <strong>Build a retrieval prototype</strong>
                  <p>
                    Turn a collection of notes into a searchable knowledge base.
                  </p>
                  <span className="cin-evidence-tag">ROADMAP / WEEK 02</span>
                </div>
              </div>
              <div className="co-preview-bottom">
                <span>Profile → Skills → Roadmap</span>
                <ArrowRight size={16} />
              </div>
            </>
          )}
          {chapter === 1 && (
            <>
              <div className="co-preview-heading">
                <div>
                  <span className="co-eyebrow">YOUR LEARNING ROADMAP</span>
                  <h3>Small steps. Real progress.</h3>
                  <p>AI Engineer · 6 hours per week</p>
                </div>
              </div>
              <div className="co-progress-label">
                <span>2 of 8 milestones complete</span>
                <strong>25%</strong>
              </div>
              <div className="co-progress">
                <i />
              </div>
              {[
                ["01", "Strengthen your foundation", "Completed"],
                ["02", "Build a retrieval prototype", "Up next"],
                ["03", "Evaluate and improve", "Then"],
                ["04", "Deploy your project", "Then"],
              ].map(([n, t, s], i) => (
                <div className={`co-step ${i === 1 ? "current" : ""}`} key={n}>
                  <span>{i === 0 ? <Check size={13} /> : n}</span>
                  <strong>{t}</strong>
                  <small>{s}</small>
                </div>
              ))}
            </>
          )}
          {chapter === 2 && (
            <>
              <div className="co-preview-heading">
                <div>
                  <span className="co-eyebrow">ECHO / INTERVIEW PRACTICE</span>
                  <h3>Make your answer count.</h3>
                  <p>Technical interview · Sample session</p>
                </div>
              </div>
              <div className="co-wave" aria-hidden="true">
                {Array.from({ length: 32 }, (_, i) => (
                  <i
                    key={i}
                    style={{ height: `${12 + Math.sin(i * 0.6) ** 2 * 45}px` }}
                  />
                ))}
              </div>
              <div className="co-question">
                <span>QUESTION 01</span>
                <p>How would you make a collection of notes searchable?</p>
              </div>
              <div className="co-insight">
                <Mic2 size={17} />
                <p>
                  Practice explaining your approach, your trade-offs, and what
                  you would measure.
                </p>
              </div>
            </>
          )}
          {chapter === 3 && (
            <>
              <div className="co-preview-heading">
                <div>
                  <span className="co-eyebrow">OPPORTUNITY INTELLIGENCE</span>
                  <h3>More than a keyword match.</h3>
                  <p>Understand why a role fits.</p>
                </div>
              </div>
              <div className="co-job">
                <div className="co-company">L</div>
                <div>
                  <strong>AI Engineering Intern</strong>
                  <p>LatticeWorks · Sample company</p>
                </div>
              </div>
              <p className="co-field-label">THE CONNECTION</p>
              <div className="co-fit">
                <Check size={16} />
                <span>Python and Git evidence present</span>
              </div>
              <div className="co-fit">
                <Check size={16} />
                <span>Project-led learning journey</span>
              </div>
              <div className="co-fit muted">
                <Target size={16} />
                <span>Retrieval project in progress</span>
              </div>
              <div className="co-preview-bottom">
                <span>Prepare with a purpose.</span>
                <ArrowRight size={16} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function RoleModal({
  type,
  onClose,
  onSwitch,
}: {
  type: "login" | "signup"
  onClose: () => void
  onSwitch: () => void
}) {
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
      if (event.key !== "Tab") return
      const controls = ref.current?.querySelectorAll<HTMLElement>(
        'button, a[href], [tabindex="0"]',
      )
      if (!controls?.length) return
      const first = controls[0],
        last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = oldOverflow
      document.removeEventListener("keydown", onKey)
      previous?.focus()
    }
  }, []) // Close handler is the stable state setter wrapper captured when this dialog opens.
  return (
    <div className="co-modal-backdrop" onClick={onClose}>
      <div
        className="co-modal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="co-role-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="co-modal-top">
          <span className="co-brand-icon">
            <Sparkles size={21} />
          </span>
          <button
            className="co-icon-button"
            onClick={onClose}
            aria-label="Close role selection"
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="co-role-title">
          {type === "signup"
            ? "Your next chapter starts here."
            : "Welcome back."}
        </h2>
        <p>Choose your role to continue.</p>
        <div className="co-modal-roles">
          {ROLES.map((role) => (
            <button
              key={role.route}
              onClick={() => {
                onClose()
                navigate(role.route)
              }}
            >
              <role.icon size={22} />
              <span>
                <strong>{role.label}</strong>
                <small>{role.subtitle}</small>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
        <p className="co-modal-switch">
          {type === "signup" ? "Already have an account?" : "New to CareerOS?"}{" "}
          <button onClick={onSwitch}>
            {type === "signup" ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  )
}

type Module = {
  name: string
  category: string
  label: string
  description: string
  capabilities: string[]
  route: string
  chapter: number
  role: number
}
const MODULES: Module[] = [
  {
    name: "Career Twin",
    category: "Students",
    label: "See who you can become.",
    description:
      "A living view of your skills, evidence and ambitions, connected to the role you want next.",
    capabilities: [
      "Target-role alignment and readiness",
      "Career trajectory and skill deficiencies",
      "Recommendations grounded in your evidence",
    ],
    route: "/career-twin",
    chapter: 0,
    role: 0,
  },
  {
    name: "Resume Intelligence",
    category: "Students",
    label: "More than a document.",
    description:
      "Turn your resume into structured career evidence and clear improvements.",
    capabilities: [
      "PDF parsing and experience extraction",
      "ATS analysis and keyword gaps",
      "Optimization suggestions that feed your Twin",
    ],
    route: "/resume",
    chapter: 0,
    role: 0,
  },
  {
    name: "Skill Gap Intelligence",
    category: "Students",
    label: "Find your next advantage.",
    description:
      "Understand the difference between where you are and what your target role requires.",
    capabilities: [
      "Current versus required skills",
      "Prioritized gaps and readiness diagnosis",
      "Direct handoff to Roadmap and ARIA",
    ],
    route: "/skills",
    chapter: 1,
    role: 0,
  },
  {
    name: "Learning Roadmap",
    category: "Students",
    label: "Make ambition actionable.",
    description:
      "A dedicated learning journey shaped around your target, gaps and available time.",
    capabilities: [
      "Weekly plans and adjustable study pace",
      "Courses, projects and certifications",
      "Milestones, progress and saved plans",
    ],
    route: "/roadmap",
    chapter: 1,
    role: 0,
  },
  {
    name: "ARIA Mentor",
    category: "Students",
    label: "Guidance that knows your context.",
    description:
      "An AI career mentor that connects your questions with your goals, experience and learning journey.",
    capabilities: [
      "Contextual career conversations",
      "Personalized learning recommendations",
      "Goal planning and milestone coaching",
    ],
    route: "/mentor",
    chapter: 0,
    role: 0,
  },
  {
    name: "ECHO Interview",
    category: "Students",
    label: "Find your voice. Then your edge.",
    description: "Prepare for the conversation that opens your next door.",
    capabilities: [
      "Technical, HR and behavioral practice",
      "Voice conversation and transcripts",
      "Structured feedback and interview history",
    ],
    route: "/interview",
    chapter: 2,
    role: 0,
  },
  {
    name: "Career Dashboard",
    category: "Students",
    label: "Your progress, in perspective.",
    description:
      "One home for career readiness, goals and the work that moves you forward.",
    capabilities: [
      "Readiness and progress overview",
      "Activity timeline and goals",
      "Continue your active learning roadmap",
    ],
    route: "/dashboard",
    chapter: 1,
    role: 0,
  },
  {
    name: "Jobs & Applications",
    category: "Students",
    label: "Opportunity with a reason.",
    description:
      "Discover jobs and internships through meaningful alignment with your skills and direction.",
    capabilities: [
      "Semantic recommendations and filters",
      "Explanations of role fit",
      "Applications connected to recruiter pipelines",
    ],
    route: "/jobs",
    chapter: 3,
    role: 0,
  },
  {
    name: "Profile & Evidence",
    category: "Students",
    label: "The foundation is you.",
    description:
      "Bring education, experience, skills and achievements into one shared career profile.",
    capabilities: [
      "Education, experience and achievements",
      "Resume and skill evidence management",
      "Personal settings and account controls",
    ],
    route: "/profile",
    chapter: 0,
    role: 0,
  },
  {
    name: "College Intelligence",
    category: "Colleges",
    label: "A clearer view of every cohort.",
    description:
      "Help placement teams turn student progress into focused support and informed campus hiring.",
    capabilities: [
      "Readiness monitoring and student roster",
      "Department comparisons and skill-gap heatmaps",
      "Placement trends, reports and recruiter coordination",
    ],
    route: "/college",
    chapter: 1,
    role: 1,
  },
  {
    name: "Recruiter Intelligence",
    category: "Recruiters",
    label: "Discover potential beyond keywords.",
    description:
      "Connect hiring needs with evidence, intent and the trajectory behind each candidate.",
    capabilities: [
      "Natural-language candidate discovery",
      "Explainable profiles, alignment and shortlists",
      "Job management, hiring pipelines and feedback",
    ],
    route: "/recruiter",
    chapter: 3,
    role: 2,
  },
  {
    name: "Connected Platform",
    category: "Platform",
    label: "One system. Shared intelligence.",
    description:
      "Connect the student, institution and recruiter experience through a common product foundation.",
    capabilities: [
      "Role-aware navigation and access",
      "Notifications and conversation history",
      "Responsive layouts and switchable themes",
    ],
    route: "/dashboard",
    chapter: 0,
    role: 0,
  },
  {
    name: "Administration",
    category: "Platform",
    label: "Visibility behind the experience.",
    description: "An operational view for authorized platform administrators.",
    capabilities: [
      "Platform health and system logs",
      "Usage and operational telemetry",
      "Privileged, role-scoped administration",
    ],
    route: "/admin",
    chapter: 1,
    role: 0,
  },
]

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null)
  const story = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const chapterCurrent = useRef(0)
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return localStorage.getItem("careeros-landing-theme") === "dark"
        ? "dark"
        : "light"
    } catch {
      return "light"
    }
  })
  const [paused, setPaused] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalType, setModalType] = useState<"signup" | "login" | null>(null)
  const [chapter, setChapter] = useState(0)
  const [filter, setFilter] = useState("All")
  const [selected, setSelected] = useState(0)
  const active = MODULES[selected]
  const openRole = (type: "signup" | "login") => {
    setMenuOpen(false)
    setModalType(type)
  }
  useEffect(() => {
    try {
      localStorage.setItem("careeros-landing-theme", theme)
    } catch {
      /* Theme still works without storage. */
    }
  }, [theme])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    document.addEventListener("keydown", key)
    return () => document.removeEventListener("keydown", key)
  }, [menuOpen])
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const y = window.scrollY
      root.current?.style.setProperty(
        "--cin-scroll",
        `${reduced || paused ? 0 : Math.min(y, 1100) * 0.12}px`,
      )
      const section = story.current
      if (
        section &&
        !reduced &&
        !paused &&
        innerWidth >= 900 &&
        innerHeight > 580
      ) {
        const r = section.getBoundingClientRect()
        if (r.top <= 120 && r.bottom > innerHeight) {
          const progress = Math.max(
            0,
            Math.min(0.999, -r.top / (section.offsetHeight - innerHeight)),
          )
          const rawP = Math.min(3.999, progress * 4)
          const newChapter = Math.floor(rawP)
          const chapterFrac = rawP - newChapter
          if (newChapter !== chapterCurrent.current) {
            chapterCurrent.current = newChapter
            setChapter(newChapter)
          }
          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${(rawP / 4) * 100}%`
          }
          section.style.setProperty(
            "--cin-chapter-frac",
            chapterFrac.toFixed(3),
          )
        }
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    measure()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [reduced, paused])
  const selectChapter = (i: number) => {
    setChapter(i)
    const el = story.current
    if (!el) return
    if (!reduced && !paused && innerWidth >= 900 && innerHeight > 580) {
      const top = window.scrollY + el.getBoundingClientRect().top
      window.scrollTo({
        top: top + ((el.offsetHeight - innerHeight) * (i + 0.1)) / 4,
        behavior: "smooth",
      })
    }
  }
  return (
    <div
      ref={root}
      className={`co-landing cin-page ${theme} ${paused ? "cin-paused" : ""}`}
    >
      <style>
        {STYLES}
        {CINEMATIC_STYLES}
      </style>
      <a href="#co-main" className="cin-skip">
        Skip to content
      </a>
      {modalType && (
        <RoleModal
          type={modalType}
          onClose={() => setModalType(null)}
          onSwitch={() =>
            setModalType((t) => (t === "login" ? "signup" : "login"))
          }
        />
      )}
      <header className="cin-header" id="co-top">
        <a className="cin-wordmark" href="#co-top" aria-label="CareerOS home">
          CAREER<span>OS</span>
          <i />
        </a>
        <h1>
          We connect your potential
          <br className="cin-wide" /> to a world of opportunity.
          <br className="cin-wide" /> Your career, intelligently connected.
        </h1>
        <div className="cin-nav-controls">
          <button
            className="cin-round"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } theme`}
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <button
            className="cin-pill cin-solid"
            onClick={() => openRole("signup")}
          >
            GET STARTED <span>↗</span>
          </button>
          <button
            ref={menuButton}
            className="cin-pill"
            aria-expanded={menuOpen}
            aria-controls="cin-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {" "}
            {menuOpen ? "CLOSE" : "MENU"} <span>{menuOpen ? "×" : "••"}</span>
          </button>
        </div>
        {menuOpen && (
          <nav id="cin-menu" className="cin-menu" aria-label="Main navigation">
            {[
              ["Product", "#co-product"],
              ["All features", "#co-features"],
              ["Ecosystem", "#co-ecosystem"],
              ["Pricing", "#co-pricing"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
                <ArrowRight size={20} />
              </a>
            ))}
            <button onClick={() => openRole("login")}>
              Log in <ArrowRight size={20} />
            </button>
          </nav>
        )}
      </header>
      <main id="co-main">
        <section
          className="cin-hero"
          aria-label="Interactive CareerOS 3D scene"
        >
          <div className="cin-stage">
            <CareerSculpture reduced={reduced || paused} />
            <div className="cin-stage-shade" />
            <div className="cin-stage-top">
              <span>CAREER INTELLIGENCE / IN MOTION</span>
              <span>STUDENTS · COLLEGES · RECRUITERS</span>
            </div>
            <div className="cin-stage-title">
              <span>ONE CONNECTED FUTURE.</span>
              <h2>
                Potential.
                <br />
                <em>Unbound.</em>
              </h2>
            </div>
            <div className="cin-stage-bottom">
              <a href="#co-product" className="cin-explore">
                EXPLORE CAREEROS <ArrowRight size={21} />
              </a>
              <button
                onClick={() => setPaused(!paused)}
                aria-pressed={paused}
                aria-label={paused ? "Resume animation" : "Pause animation"}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}{" "}
                {paused ? "PLAY" : "PAUSE"}
              </button>
            </div>
          </div>
          <div className="cin-crossline">
            <span>+</span>
            <span>+</span>
            <a href="#co-product">SCROLL TO EXPLORE ↓</a>
            <span>+</span>
            <span>+</span>
          </div>
        </section>
        <div className="cin-trust">
          <span>ONE ECOSYSTEM FOR</span>
          <strong>Students</strong>
          <i>×</i>
          <strong>Colleges</strong>
          <i>×</i>
          <strong>Recruiters</strong>
        </div>
        <section className="cin-intro cin-wrap">
          <Reveal>
            <span className="cin-kicker">01 / THE BIGGER PICTURE</span>
            <h2>
              Hundreds of tools.
              <br />
              One missing <span>connection.</span>
            </h2>
            <div className="cin-intro-bottom">
              <span className="cin-asterisk" aria-hidden="true">
                ✳
              </span>
              <p>
                Learning on one platform. Resumes on another. Interviews, jobs
                and guidance somewhere else. CareerOS brings the whole journey
                together—so every step informs what comes next.
              </p>
              <a href="#co-features" className="cin-pill cin-outline">
                MEET YOUR CAREER OS <ArrowRight size={16} />
              </a>
            </div>
          </Reveal>
        </section>
        <section id="co-product" className="cin-story" ref={story}>
          <div className="cin-story-sticky cin-wrap">
            <div className="cin-section-heading">
              <span className="cin-kicker">02 / A CONNECTED JOURNEY</span>
              <span>FOUR MOVES. A NEW DIRECTION.</span>
            </div>
            <div className="cin-story-grid">
              <div className="cin-story-copy">
                <div className="cin-chapter-progress" aria-hidden="true">
                  <div
                    ref={progressBarRef}
                    className="cin-chapter-progress-fill"
                  />
                </div>
                <div key={chapter} className="cin-copy-anim">
                  <span className="cin-chapter-number">
                    0{chapter + 1}
                    <i>/ 04</i>
                  </span>
                  <h2>{CHAPTERS[chapter].title}</h2>
                  <p>{CHAPTERS[chapter].description}</p>
                </div>
                <div
                  className="cin-chapter-buttons"
                  aria-label="Product chapters"
                >
                  {CHAPTERS.map((c, i) => (
                    <button
                      key={c.number}
                      aria-pressed={chapter === i}
                      onClick={() => selectChapter(i)}
                    >
                      {c.number}
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Tilt className="cin-product-stage">
                <ProductPreview chapter={chapter} />
                <div className="cin-preview-caption">
                  <span>PRODUCT EXPERIENCE</span>
                  <span>ILLUSTRATIVE PREVIEW ↗</span>
                </div>
              </Tilt>
            </div>
          </div>
        </section>
        <section className="cin-wrap cin-features" id="co-features">
          <Reveal>
            <div className="cin-section-heading">
              <span className="cin-kicker">03 / EXPLORE THE SYSTEM</span>
              <span>
                {String(MODULES.length).padStart(2, "0")} CONNECTED MODULES
              </span>
            </div>
            <h2>
              Built for every
              <br />
              <span>next chapter.</span>
            </h2>
          </Reveal>
          <div className="cin-filters" aria-label="Filter features">
            {["All", "Students", "Colleges", "Recruiters", "Platform"].map(
              (c) => (
                <button
                  key={c}
                  aria-pressed={filter === c}
                  onClick={() => {
                    setFilter(c)
                    setSelected(
                      MODULES.findIndex((m) => c === "All" || m.category === c),
                    )
                  }}
                >
                  {c}
                  <span>
                    {c === "All"
                      ? MODULES.length
                      : MODULES.filter((m) => m.category === c).length}
                  </span>
                </button>
              ),
            )}
          </div>
          <div className="cin-catalog">
            <div className="cin-module-list">
              {MODULES.map(
                (m, i) =>
                  (filter === "All" || filter === m.category) && (
                    <button
                      key={m.name}
                      aria-pressed={selected === i}
                      onClick={() => setSelected(i)}
                    >
                      <small>{String(i + 1).padStart(2, "0")}</small>
                      <span>{m.name}</span>
                      <ArrowUpRight size={21} />
                    </button>
                  ),
              )}
            </div>
            <article className="cin-module-detail" aria-live="polite">
              <div
                className={`cin-module-art art-${active.chapter}`}
                aria-hidden="true"
              >
                <div className="cin-art-orbit" />
                <div className="cin-art-orbit second" />
                <div className="cin-art-core">
                  {active.chapter === 2 ? (
                    <Mic2 size={50} />
                  ) : active.chapter === 1 ? (
                    <BarChart3 size={50} />
                  ) : active.chapter === 3 ? (
                    <Target size={50} />
                  ) : (
                    <Brain size={50} />
                  )}
                </div>
                <span>
                  {active.category.toUpperCase()} /{" "}
                  {String(selected + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="cin-detail-copy">
                <span className="cin-kicker">{active.name}</span>
                <h3>{active.label}</h3>
                <p>{active.description}</p>
                <ul>
                  {active.capabilities.map((item) => (
                    <li key={item}>
                      <Check size={14} />
                      {item}
                    </li>
                  ))}
                </ul>
                {active.route === "/admin" ? (
                  <p className="cin-restricted">
                    <Shield size={14} /> Restricted to authorized
                    administrators.
                  </p>
                ) : (
                  <button
                    className="cin-pill cin-solid"
                    onClick={() => navigate(ROLES[active.role].route)}
                  >
                    EXPLORE AS A {ROLES[active.role].label.toUpperCase()}{" "}
                    <ArrowUpRight size={17} />
                  </button>
                )}
              </div>
            </article>
          </div>
        </section>
        <section className="cin-metrics cin-wrap">
          <div className="cin-section-heading">
            <span className="cin-kicker">04 / MOMENTUM</span>
            <span>THE CAREEROS COMMUNITY</span>
          </div>
          <div className="cin-metric-grid">
            {KPIS.map((k) => (
              <div key={k.label}>
                <strong>{k.value}</strong>
                <span>{k.label}</span>
                <small>{k.desc}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="cin-quotes cin-wrap">
          <div className="cin-section-heading">
            <span className="cin-kicker">05 / SHARED PERSPECTIVES</span>
            <span>FROM THE ECOSYSTEM</span>
          </div>
          <div className="cin-quote-grid">
            {TESTIMONIALS.map((t) => (
              <Reveal key={t.name}>
                <div className="cin-quote">
                  <span aria-hidden="true">“</span>
                  <blockquote>{t.quote}</blockquote>
                  <div>
                    <strong>{t.name}</strong>
                    <small>
                      {t.role} · {t.org}
                    </small>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="cin-wrap cin-roles" id="co-ecosystem">
          <div className="cin-section-heading">
            <span className="cin-kicker">06 / BETTER, TOGETHER</span>
            <span>THREE PERSPECTIVES. ONE PLATFORM.</span>
          </div>
          <h2>
            Your ambition.
            <br />
            Our common <span>ground.</span>
          </h2>
          <div className="cin-role-grid">
            {ROLES.map((role, i) => (
              <button
                key={role.route}
                id={
                  i === 1
                    ? "co-colleges"
                    : i === 2
                      ? "co-recruiters"
                      : "co-students"
                }
                className={`cin-role role-${i}`}
                onClick={() => navigate(role.route)}
              >
                <span className="cin-role-top">
                  0{i + 1} / {role.label.toUpperCase()}
                  <ArrowUpRight size={22} />
                </span>
                <span className="cin-role-object">
                  <role.icon size={68} />
                </span>
                <strong>{role.subtitle}</strong>
                <p>{role.detail}</p>
                <span className="cin-role-action">
                  ENTER YOUR WORKSPACE <ArrowRight size={18} />
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="cin-pricing cin-wrap" id="co-pricing">
          <div className="cin-section-heading">
            <span className="cin-kicker">07 / A CLEAR START</span>
            <span>NO SETUP FEES. NO LOCK-IN.</span>
          </div>
          <h2>
            Your next chapter.
            <br />
            <span>A plan that fits.</span>
          </h2>
          <p>
            Start your own career journey for free, or bring CareerOS to your
            institution or hiring team. Three ways to connect preparation with
            opportunity.
          </p>
          <div className="cin-price-grid cin-price-expanded">
            <div className="cin-price-student">
              <div className="cin-plan-label">
                <span>FOR STUDENTS</span>
                <span className="cin-plan-badge">YOUR STARTING POINT</span>
              </div>
              <h3>Free</h3>
              <p className="cin-plan-summary">
                For students turning their skills and ambitions into a clear
                next step.
              </p>
              <button
                className="cin-pill cin-solid"
                onClick={() => navigate("/auth/student")}
              >
                START FOR FREE <ArrowUpRight size={18} />
              </button>
              <div className="cin-plan-divider" />
              <h4>Your career workspace</h4>
              <ul>
                {[
                  "Career Twin to understand your profile and target-role alignment",
                  "Resume Intelligence and prioritized skill gaps",
                  "A personal Learning Roadmap with projects and milestones",
                  "ARIA career guidance and ECHO interview practice",
                  "Relevant jobs, internships and application tracking",
                ].map((t) => (
                  <li key={t}>
                    <Check size={15} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <p className="cin-plan-outcome">
                Build your foundation. Practice with purpose. Move toward the
                right opportunity.
              </p>
            </div>
            <div>
              <div className="cin-plan-label">
                <span>FOR COLLEGES</span>
                <Building2 size={19} />
              </div>
              <h3>
                ₹5,00,000
                <br />
                <span style={{ fontSize: "0.55em" }}>/ year</span>
              </h3>
              <p className="cin-plan-summary">
                For up to 5,000 students. One institution plan with full
                placement intelligence, department analytics, and a dedicated
                account manager.
              </p>
              <button
                className="cin-pill cin-outline"
                onClick={() => navigate("/auth/college")}
              >
                EXPLORE COLLEGE WORKSPACE <ArrowUpRight size={18} />
              </button>
              <div className="cin-plan-divider" />
              <h4>A connected placement office</h4>
              <ul>
                {[
                  "Student rosters and employability monitoring",
                  "Department and batch-level readiness comparisons",
                  "Skill-gap heatmaps to focus training and support",
                  "Learning, resume and interview progress visibility",
                  "Placement reports and recruiter coordination",
                ].map((t) => (
                  <li key={t}>
                    <Check size={15} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <p className="cin-plan-outcome">
                See where support is needed and connect student development with
                campus hiring.
              </p>
            </div>
            <div>
              <div className="cin-plan-label">
                <span>FOR RECRUITERS</span>
                <UserSearch size={19} />
              </div>
              <h3>
                ₹25,000
                <br />
                <span style={{ fontSize: "0.55em" }}>/ year</span>
              </h3>
              <p className="cin-plan-summary">
                Starter plan per recruiter account, billed annually. Enterprise
                from ₹1,50,000 — billing period to be confirmed for larger
                hiring teams.
              </p>
              <button
                className="cin-pill cin-outline"
                onClick={() => navigate("/auth/recruiter")}
              >
                EXPLORE HIRING WORKSPACE <ArrowUpRight size={18} />
              </button>
              <div className="cin-plan-divider" />
              <h4>A more informed hiring process</h4>
              <ul>
                {[
                  "Natural-language candidate discovery",
                  "Candidate profiles with skill and experience evidence",
                  "Resume-to-role alignment and fit explanations",
                  "Shortlists, applications and hiring-stage tracking",
                  "Job management, pipeline analytics and feedback",
                ].map((t) => (
                  <li key={t}>
                    <Check size={15} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <p className="cin-plan-outcome">
                Understand each candidate’s strengths and make your next
                conversation more informed.
              </p>
            </div>
          </div>
          <div className="cin-pricing-note">
            <Shield size={18} />
            <p>
              <strong>Simple to start. Clear about the details.</strong>{" "}
              Students start free. Pro is ₹200/month or ₹2,000/year. College
              plan is ₹5,00,000/year for up to 5,000 students. Recruiter Starter
              is ₹25,000/year; Enterprise from ₹1,50,000. No setup fees. No
              lock-in.
            </p>
          </div>
          <div className="cin-pricing-faq">
            <div>
              <span className="cin-kicker">A FEW THINGS TO KNOW</span>
              <h3>
                A clearer start,
                <br />
                from day one.
              </h3>
            </div>
            <div>
              {[
                [
                  "Which workspace should I choose?",
                  "Choose Student for your own career preparation, College for placement and student-development teams, or Recruiter for candidate discovery and hiring workflows.",
                ],
                [
                  "How much do college and recruiter plans cost?",
                  "College: ₹5,00,000/year for up to 5,000 students. Recruiter Starter: ₹25,000/year. Recruiter Enterprise: ₹1,50,000 (billing period to be confirmed). Enter the relevant workspace to proceed.",
                ],
                [
                  "Does free mean unlimited AI and voice usage?",
                  "Free describes student access. This page does not specify unlimited usage, AI credits, or voice-minute allowances. Any applicable limits should be confirmed in your workspace.",
                ],
                [
                  "What happens when I select a plan?",
                  "You continue to the existing sign-in or sign-up flow for your selected role. Selecting a workspace does not submit a payment or purchase a subscription.",
                ],
              ].map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="cin-outro">
          <span>YOUR NEXT CHAPTER IS WAITING.</span>
          <button onClick={() => openRole("signup")}>
            Let’s shape
            <br />
            <em>what’s next.</em>
            <ArrowUpRight />
          </button>
          <div>
            <span>LEARN. BUILD. PRACTICE. CONNECT.</span>
            <button className="cin-pill" onClick={() => openRole("login")}>
              LOG IN <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </main>
      <footer className="cin-footer">
        <a className="cin-wordmark" href="#co-top">
          CAREER<span>OS</span>
        </a>
        <nav aria-label="Footer">
          {[
            ["Product", "#co-product"],
            ["Features", "#co-features"],
            ["Ecosystem", "#co-ecosystem"],
            ["Pricing", "#co-pricing"],
          ].map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <span>© {new Date().getFullYear()} CareerOS</span>
      </footer>
    </div>
  )
}

const STYLES = `
.co-landing{--co-bg:#08090E;--co-surface:#0E0F18;--co-surface2:#141627;--co-border:rgba(255,255,255,.08);--co-text:#ECEFFE;--co-muted:#969DB8;--co-blue:#4F7CFF;--co-hero-shift:0px;--co-copy-shift:0px;--co-preview-tilt:0deg;--co-progress:0;background:var(--co-bg);color:var(--co-text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;isolation:isolate;overflow-x:clip;color-scheme:dark;-webkit-font-smoothing:antialiased}
.co-landing *{box-sizing:border-box}.co-landing h1,.co-landing h2,.co-landing h3,.co-landing p{margin:0}.co-landing a{color:inherit;text-decoration:none}.co-landing button{font:inherit;cursor:pointer;color:inherit}.co-landing button:disabled{cursor:default}.co-landing button,.co-landing a{-webkit-tap-highlight-color:transparent}.co-landing :focus-visible{outline:2px solid #9EB5FF;outline-offset:5px}.co-landing section[id],.co-landing [id^="co-col"],.co-landing [id^="co-recr"]{scroll-margin-top:92px}.co-container{width:min(1200px,calc(100% - 80px));margin-inline:auto}
.co-skip{position:fixed;top:-70px;left:20px;z-index:500;background:#4F7CFF;padding:14px 20px;border-radius:8px}.co-skip:focus{top:10px}.co-scroll-progress{position:fixed;top:0;left:0;height:2px;width:100%;background:linear-gradient(90deg,#4F7CFF,#B89EFF);transform:scaleX(var(--co-progress));transform-origin:left;z-index:160;pointer-events:none}
.co-nav{position:fixed;inset:0 0 auto;z-index:100;border-bottom:1px solid transparent;transition:background .25s,border-color .25s}.co-nav-scrolled{background:rgba(8,9,14,.88);backdrop-filter:blur(18px);border-color:var(--co-border)}.co-nav-inner{height:80px;display:flex;align-items:center;justify-content:space-between;gap:24px}.co-brand{display:inline-flex;align-items:center;font-family:Manrope,Inter,sans-serif;font-size:19px;font-weight:750;letter-spacing:-.6px;white-space:nowrap}.co-brand>span:not(.co-brand-icon):not(.co-brand-dot){color:#9CA8D2}.co-brand-icon{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#638BFF,#3656C8);border:1px solid #8AA6FF55;border-radius:10px;margin-right:10px;box-shadow:0 5px 18px #4F7CFF20;color:white}.co-brand-dot{height:5px;width:5px;border-radius:50%;background:#638BFF;margin:0 0 10px 4px}.co-desktop-links{display:flex;gap:29px;font-size:12px;color:var(--co-muted)}.co-desktop-links a{position:relative;padding:12px 0;transition:color .2s}.co-desktop-links a:after{content:"";position:absolute;bottom:5px;left:0;width:100%;height:1px;background:#7899FF;transform:scaleX(0);transform-origin:left;transition:transform .2s}.co-desktop-links a:hover{color:#fff}.co-desktop-links a:hover:after{transform:scaleX(1)}.co-nav-actions{display:flex;gap:10px;align-items:center}
.co-button{border:1px solid transparent;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:40px;padding:10px 17px;font-size:12px;font-weight:600;transition:transform .2s,background .2s,box-shadow .2s,border-color .2s;white-space:nowrap}.co-button svg{transition:transform .2s}.co-button:hover svg{transform:translateX(3px)}.co-primary{background:linear-gradient(180deg,#638BFF,#4672EF);color:#fff!important;border-color:#8DAAFF55;box-shadow:inset 0 1px 0 #FFFFFF21,0 5px 20px #4F7CFF20}.co-primary:hover{transform:translateY(-2px);box-shadow:inset 0 1px 0 #FFFFFF35,0 8px 35px #4F7CFF40;background:linear-gradient(180deg,#779AFF,#547DF5)}.co-secondary{background:#FFFFFF04;border-color:#FFFFFF21;color:#CFD5EB!important}.co-secondary:hover{background:#FFFFFF09;border-color:#FFFFFF40;transform:translateY(-2px)}.co-quiet{background:transparent;color:var(--co-muted)!important}.co-quiet:hover{color:#fff!important}.co-large{font-size:14px;padding:16px 24px;min-height:53px}.co-icon-button{height:36px;width:36px;display:flex;align-items:center;justify-content:center;background:#ffffff07;border:1px solid #ffffff14;border-radius:9px}.co-menu-toggle{display:none}.co-mobile-menu{padding:16px 24px 24px;background:#0E0F18;border-bottom:1px solid var(--co-border)}.co-mobile-menu a{display:flex;justify-content:space-between;padding:15px 2px;color:#BBC3DE;font-size:14px}.co-mobile-menu>.co-button{margin-top:12px;width:100%}.co-menu-lines{display:grid;gap:6px}.co-menu-lines i{display:block;width:16px;height:1px;background:#ECEFFE}
.co-hero{position:relative;min-height:850px;min-height:max(850px,100svh);padding-top:80px;display:flex;flex-direction:column;justify-content:center;overflow:hidden}.co-hero-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(#ffffff05 1px,transparent 1px),linear-gradient(90deg,#ffffff05 1px,transparent 1px);background-size:90px 90px;mask-image:linear-gradient(to bottom,transparent,#000 30%,transparent 95%);opacity:.28}.co-hero-layout{display:grid;grid-template-columns:1fr 1fr;align-items:center;position:relative;min-height:640px}.co-hero-copy{position:relative;z-index:3;transform:translateY(var(--co-copy-shift));padding:58px 0 74px}.co-announcement{display:flex;align-items:center;gap:10px;font-size:9px;letter-spacing:1.8px;color:#A0AFD7;font-weight:600;margin-bottom:30px}.co-announcement>span:first-child{width:6px;height:6px;background:#7D9CFF;border-radius:50%;box-shadow:0 0 12px #4F7CFF80}.co-announcement svg{margin-left:5px;opacity:.6}.co-hero h1{font-family:Manrope,Inter,sans-serif;font-size:clamp(54px,5.4vw,82px);line-height:1.075;letter-spacing:-4px;font-weight:750}.co-hero h1>span{background:linear-gradient(100deg,#608DFF 8%,#AC9AFF 90%);background-clip:text;-webkit-background-clip:text;color:transparent}.co-lead{font-size:19px;line-height:1.55;color:#C1C8E0;margin-top:30px!important;font-weight:450}.co-hero-description{max-width:425px;color:var(--co-muted);font-size:14px;line-height:1.8;margin-top:15px!important}.co-hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px}.co-hero-proof{display:flex;align-items:center;gap:15px;margin-top:29px;font-size:10px;color:#9AA4C5}.co-hero-proof span{display:inline-flex;align-items:center;gap:6px}.co-hero-proof>i{width:2px;height:2px;background:#526084;border-radius:50%}
.co-hero-visual{position:relative;height:660px;width:calc(100% + 90px);margin-left:-5px;transform:translateY(var(--co-hero-shift))}.co-sculpture{position:absolute;inset:-30px -50px 0 -40px}.co-sculpture canvas{width:100%;height:100%;display:block;transition:opacity .65s;mask-image:radial-gradient(ellipse 70% 65%,#000 45%,transparent 82%)}.co-scene-grain{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 98%,#4f7cff17,transparent 30%)}.co-orbit-fallback{position:absolute;inset:13% 12%;perspective:800px;transition:opacity .3s}.co-orbit-fallback i{position:absolute;inset:14%;border:18px solid #607CDD;border-radius:50%;transform:rotateX(64deg) rotateY(-20deg);box-shadow:inset 0 0 18px #a8bdff,0 0 22px #466BE644}.co-orbit-fallback i:nth-child(2){transform:rotateX(20deg) rotateY(65deg);border-color:#A18DEB}.co-orbit-fallback i:nth-child(3){transform:rotateX(60deg) rotateY(45deg) rotateZ(65deg);border-width:10px}.co-orbit-fallback b{position:absolute;width:90px;height:90px;left:calc(50% - 45px);top:calc(50% - 45px);transform:rotate(45deg);background:linear-gradient(135deg,#BBC6FF,#344AAC);box-shadow:15px 15px 60px #4F7CFF30}
.co-orbit-label{position:absolute;z-index:3;display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#171D30ED,#0E101BCC);backdrop-filter:blur(12px);border:1px solid #A9BDFF21;padding:13px 17px;border-radius:12px;box-shadow:0 16px 40px #00000040;pointer-events:none}.co-orbit-label-one{top:108px;left:2%;animation:co-label-drift 7s ease-in-out infinite}.co-orbit-label-two{right:0;bottom:126px;animation:co-label-drift 8s ease-in-out infinite reverse}.co-label-icon{display:grid;place-items:center;height:34px;width:34px;border:1px solid #638BFF30;background:#4F7CFF15;border-radius:10px;color:#91ABFF}.co-label-icon.violet{color:#C5AEFF;background:#A88AFF15;border-color:#A88AFF30}.co-orbit-label small{display:block;font-size:8px;letter-spacing:1.8px;color:#9AA8CD;margin-bottom:5px}.co-orbit-label strong{font-size:12px;font-weight:550;color:#E4EAFE}.co-orbit-coordinate{position:absolute;bottom:73px;left:10%;right:8%;display:flex;justify-content:space-between;font-size:8px;letter-spacing:3px;color:#7A89B4}.co-cross{font-size:18px;color:#69789D}.co-scene-note{position:absolute;bottom:43px;left:0;width:100%;text-align:center;font-size:10px;color:#7884A7}.co-hero-bottom{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;padding-bottom:32px;color:#7B87A9;font-size:9px;letter-spacing:1.6px}.co-hero-bottom a{display:flex;align-items:center;gap:11px;letter-spacing:.3px;font-size:11px}.co-scroll-line{width:1px;height:29px;background:linear-gradient(#8CA6FF,transparent);display:inline-block}.co-manifesto-strip{border-block:1px solid var(--co-border);background:#0B0D15;position:relative;z-index:4}.co-manifesto-strip>.co-container{display:flex;align-items:center;justify-content:space-between;padding-block:29px;gap:20px;color:#9AA4C2;font-size:16px;letter-spacing:-.25px}.co-manifesto-strip .co-blue{display:flex;gap:18px;align-items:center;color:#B9C9FF}
.co-journey{position:relative;height:290vh;background:var(--co-bg)}.co-journey-sticky{position:sticky;top:0;min-height:760px;height:100svh;display:flex;align-items:center;overflow:hidden}.co-section-kicker{display:flex;align-items:center;gap:12px;font-size:9px;letter-spacing:2px;color:#9AA5C5;margin-bottom:60px}.co-tiny-line{height:1px;width:23px;background:#638BFF}.co-chapter-count{margin-left:auto;font-size:10px;letter-spacing:3px}.co-journey-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:75px;align-items:center}.co-chapter-icon{width:50px;height:50px;background:#ffffff03;border:1px solid var(--co-border);border-radius:15px;display:grid;place-items:center;margin-bottom:28px}.co-chapter-copy h2{white-space:pre-line;font-family:Manrope,Inter,sans-serif;font-size:clamp(30px,3.15vw,46px);line-height:1.19;letter-spacing:-1.8px;font-weight:650;animation:co-copy-in .4s ease both}.co-chapter-copy>p{font-size:14px;line-height:1.85;color:var(--co-muted);max-width:365px;margin-top:22px}.co-text-link{display:inline-flex;align-items:center;gap:12px;font-size:12px;font-weight:600;background:none;border:0;padding:0;color:#A2B8FF!important}.co-text-link svg{transition:transform .2s}.co-text-link:hover svg{transform:translateX(5px)}.co-chapter-copy>.co-text-link{margin-top:29px}.co-chapter-tabs{display:flex;gap:18px;margin-top:52px;flex-wrap:wrap}.co-chapter-tabs button{border:none;border-top:2px solid #ffffff12;background:none;padding:14px 0 0;font-size:10px;color:#939DBA;display:flex;gap:7px;transition:color .2s,border-color .2s}.co-chapter-tabs button span{font-size:9px;color:#7885A9}.co-chapter-tabs button.active{border-color:#7396FF;color:#DFE7FF}.co-showcase-stage{position:relative;perspective:1300px}.co-stage-halo{position:absolute;inset:-160px;pointer-events:none;transition:background .5s}.co-tilt{transform:perspective(1200px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .25s ease-out;position:relative}.co-browser-tilt{transform:perspective(1300px) rotateX(var(--rx,0deg)) rotateY(calc(var(--ry,0deg) + var(--co-preview-tilt)));}.co-preview{position:relative;border:1px solid #A4B9FF28;border-radius:16px;background:#0D101B;box-shadow:0 40px 90px #00000060,0 1px 0 #ffffff0A inset;overflow:hidden;min-height:404px}.co-browser{height:42px;border-bottom:1px solid #ffffff09;background:#121625;display:flex;align-items:center;gap:18px;padding:0 17px;font-size:9px;color:#A5AFCD}.co-dots{display:flex;gap:5px}.co-dots i{display:block;height:5px;width:5px;border-radius:50%;background:#637096}.co-sample{margin-left:auto;color:#8794B6;font-size:8px}.co-preview-shell{display:flex;min-height:361px}.co-mini-rail{width:49px;flex-shrink:0;border-right:1px solid #ffffff08;display:flex;flex-direction:column;gap:13px;padding:18px 8px;background:#0A0D17}.co-mini-rail>div{display:grid;place-items:center;width:32px;height:35px;color:#647298;border-radius:9px}.co-mini-rail>div.active{background:color-mix(in srgb,var(--co-preview-accent) 12%,transparent);color:var(--co-preview-accent)}.co-preview-content{padding:28px;flex:1;min-width:0;animation:co-copy-in .35s ease}.co-preview-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:23px;gap:15px}.co-eyebrow{font-size:9px;letter-spacing:2px;color:#95A6D1;display:inline-block;font-weight:600}.co-preview-heading .co-eyebrow{font-size:8px;letter-spacing:1.5px;color:var(--co-preview-accent)}.co-preview-heading h3{font-size:20px;letter-spacing:-.65px;line-height:1.3;margin-top:8px}.co-preview-heading p{font-size:10px;color:#8B98BA;margin-top:6px}.co-avatar{height:38px;width:38px;flex-shrink:0;display:grid;place-items:center;border-radius:50%;background:linear-gradient(135deg,#4F7CFF40,#AA8EFF30);border:1px solid #9DB2FF30;color:#C1CFFF;font-size:11px}
.co-profile-banner{display:flex;align-items:center;gap:12px;background:#4F7CFF0D;border:1px solid #4F7CFF20;border-radius:11px;padding:16px;color:#9DB5FF}.co-profile-banner small{display:block;font-size:7px;letter-spacing:1.5px;color:#97A4C9;margin-bottom:6px}.co-profile-banner strong{font-size:14px;font-weight:550;color:#E1E8FF}.co-chip{font-size:8px;border:1px solid #7A9EFF25;border-radius:20px;padding:5px 8px;margin-left:auto}.co-field-label{font-size:8px;letter-spacing:1.5px;color:#8D9ABC;margin-top:21px!important;margin-bottom:12px!important}.co-skill-chips{display:flex;gap:6px;flex-wrap:wrap}.co-skill-chips span{font-size:9px;padding:6px 9px;border:1px solid #ffffff0E;background:#ffffff03;border-radius:6px;color:#B9C5E2}.co-insight{display:flex;align-items:flex-start;gap:9px;margin-top:20px;padding:12px;background:#ffffff02;border:1px solid #ffffff08;border-radius:9px;color:var(--co-preview-accent)}.co-insight svg{flex-shrink:0}.co-insight p{font-size:10px;line-height:1.7;color:#A3B0D1}.co-preview-bottom{display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#8DA4D8;margin-top:19px}.co-progress-label{display:flex;justify-content:space-between;font-size:9px;color:#A8B5D0}.co-progress-label strong{color:var(--co-preview-accent)}.co-progress{height:4px;border-radius:3px;background:#ffffff09;margin:9px 0 22px}.co-progress i{height:100%;width:25%;display:block;border-radius:3px;background:var(--co-preview-accent)}.co-step{display:flex;align-items:center;gap:10px;border:1px solid #ffffff07;border-radius:9px;padding:11px 10px;margin-top:7px}.co-step>span{font-size:8px;color:#8091B4;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#ffffff05}.co-step strong{font-size:10px;font-weight:500;color:#B5C2DE}.co-step small{margin-left:auto;font-size:8px;color:#91A0C3}.co-step.current{background:#6DD9B608;border-color:#6DD9B62A}.co-step.current>span,.co-step.current small{color:#6DD9B6}.co-wave{display:flex;align-items:center;justify-content:center;gap:4px;height:85px;border:1px solid #BA9BFF15;border-radius:11px;background:radial-gradient(ellipse,#AC81FF10,transparent)}.co-wave i{display:block;flex:0 1 4px;border-radius:3px;background:linear-gradient(#C1A6FF,#6B5C9D);opacity:.65}.co-question{margin-top:19px}.co-question>span{font-size:8px;letter-spacing:1.4px;color:#A28BCD}.co-question p{font-size:14px;line-height:1.6;margin-top:8px;color:#DADEF1}.co-job{display:flex;gap:13px;align-items:center;border:1px solid #F0C48420;background:#F0C48405;border-radius:10px;padding:16px}.co-company{width:35px;height:35px;background:#F0C48413;color:#E8C58F;border:1px solid #F0C48420;border-radius:9px;display:grid;place-items:center;font-size:18px}.co-job strong{font-size:13px}.co-job p{font-size:9px;color:#9AA6C4;margin-top:5px}.co-fit{display:flex;align-items:center;gap:10px;color:#D7C6A4;margin-top:12px;font-size:10px}.co-fit.muted{color:#9AA6C4}.co-showcase-caption{position:relative;display:flex;align-items:center;gap:9px;margin-top:27px;font-size:10px;color:#AFBBDD}.co-showcase-caption>span:last-child{font-size:7px;letter-spacing:1.5px;color:#7E8AA8;margin-left:auto}.co-status-dot{width:4px;height:4px;border-radius:50%;background:#789AFF}
.co-section{padding:120px 0}.co-ecosystem{position:relative;border-top:1px solid var(--co-border);background:linear-gradient(#0C0E17,#08090E);z-index:2}.co-ecosystem-heading{text-align:center;max-width:650px;margin:0 auto 60px}.co-ecosystem-heading h2{font-family:Manrope,Inter,sans-serif;font-size:clamp(35px,4.2vw,58px);letter-spacing:-2.5px;line-height:1.12;margin-top:21px;font-weight:650}.co-ecosystem-heading h2 span{color:#8995B8}.co-ecosystem-heading p{font-size:14px;line-height:1.8;color:var(--co-muted);margin-top:23px}.co-role-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.co-role-grid>.co-reveal-ready:nth-child(2){transition-delay:80ms}.co-role-grid>.co-reveal-ready:nth-child(3){transition-delay:160ms}.co-role-card{display:block;width:100%;padding:27px;text-align:left;background:linear-gradient(145deg,#15192A90,#0E101A);border:1px solid #9DADFF16;border-radius:17px;overflow:hidden;transition:border-color .25s,box-shadow .25s;min-height:380px}.co-role-card:hover{border-color:#7B9BFF65;box-shadow:0 20px 60px #00000038}.co-role-card-top{display:flex;justify-content:space-between;align-items:center;font-size:8px;letter-spacing:1.5px;color:#A0ADCD}.co-role-card-top svg{color:#788BAF;transition:transform .2s}.co-role-card:hover .co-role-card-top svg{transform:rotate(-35deg)}.co-role-art{height:158px;position:relative;perspective:800px;margin:12px 0 20px;--art:#6B92FF}.co-role-art-1{--art:#A599F8}.co-role-art-2{--art:#6DD9CA}.co-art-tile{position:absolute;left:calc(50% - 40px);top:calc(50% - 40px);width:80px;height:80px;display:grid;place-items:center;color:var(--art);background:linear-gradient(135deg,#2B365D,#101521);border:1px solid color-mix(in srgb,var(--art) 55%,transparent);border-radius:20px;transform:rotateX(18deg) rotateY(-24deg) rotateZ(-10deg);box-shadow:7px 7px 0 #0B0E19,8px 8px 0 #4F649155,20px 25px 40px #00000050;transition:transform .35s}.co-role-card:hover .co-art-tile{transform:rotateX(5deg) rotateY(-5deg) rotateZ(0deg) translateY(-6px)}.co-art-ring{position:absolute;width:160px;height:160px;border:1px solid color-mix(in srgb,var(--art) 25%,transparent);border-radius:50%;left:calc(50% - 80px);top:calc(50% - 80px);transform:rotateX(64deg) rotateZ(-25deg)}.co-art-satellite{position:absolute;width:10px;height:10px;border-radius:3px;top:34%;left:18%;background:var(--art);opacity:.6;transform:rotate(20deg);box-shadow:0 0 25px var(--art)}.co-art-satellite.second{width:6px;height:6px;left:80%;top:64%;opacity:.35}.co-role-card h3{font-size:21px;letter-spacing:-.7px;font-family:Manrope,Inter,sans-serif;line-height:1.3;margin-bottom:13px}.co-role-card>p{color:#97A2C0;font-size:12px;line-height:1.85;min-height:67px}.co-role-action{display:flex;align-items:center;gap:6px;font-size:11px;color:#A3B7EC;margin-top:22px}.co-feedback-line{display:flex;align-items:center;justify-content:center;gap:15px;margin-top:48px;color:#8A99BF}.co-feedback-line>span{height:1px;flex:1;background:linear-gradient(90deg,transparent,#ffffff16)}.co-feedback-line>span:last-child{transform:rotate(180deg)}.co-feedback-line p{font-size:10px}
.co-bridge{border-block:1px solid var(--co-border);background:#0A0C14;position:relative;overflow:hidden}.co-bridge-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px}.co-small-orbit{height:40px;width:70px;border:1px solid #6B8BDD;border-radius:50%;transform:rotate(-30deg);position:relative}.co-small-orbit:before{content:"";position:absolute;inset:7px -4px;border:1px solid #B49AFE88;border-radius:50%;transform:rotate(65deg)}.co-bridge h2{font-family:Manrope,Inter,sans-serif;font-size:clamp(38px,5.9vw,80px);letter-spacing:-3.5px;line-height:1.15;font-weight:600}.co-bridge h2 span{color:#91ABFF}.co-bridge-bottom{display:flex;justify-content:space-between;align-items:end;gap:35px;margin-top:35px}.co-bridge-bottom>p{max-width:450px;font-size:14px;line-height:1.85;color:var(--co-muted)}
.co-final{position:relative;text-align:center;padding:145px 0 110px;overflow:hidden}.co-final-glow{position:absolute;inset:auto -20% -500px;height:850px;border-radius:50%;background:radial-gradient(ellipse,#4F7CFF25,transparent 65%);pointer-events:none}.co-final>.co-container{position:relative}.co-final h2{font-family:Manrope,Inter,sans-serif;font-size:clamp(48px,7.2vw,96px);line-height:1.07;letter-spacing:-4.5px;font-weight:700;margin:25px 0 38px}.co-final h2 span{background:linear-gradient(90deg,#739AFF,#BB9BF1);color:transparent;background-clip:text;-webkit-background-clip:text}.co-final-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:12px}.co-final p{font-size:11px;color:#8A99BF;margin-top:24px}.co-footer{border-top:1px solid var(--co-border);position:relative;padding:32px 0;background:#08090E}.co-footer>.co-container{display:flex;align-items:center;justify-content:space-between;gap:25px}.co-footer .co-brand{font-size:16px}.co-footer .co-brand-icon{width:27px;height:27px;border-radius:8px}.co-footer>div>div{display:flex;gap:26px;font-size:11px;color:#A1ABCA}.co-footer button{background:transparent;border:0;padding:0;font-size:11px;color:#A1ABCA}.co-footer>div>span{font-size:10px;color:#8290B4}
.co-modal-backdrop{position:fixed;inset:0;z-index:300;background:#03050BBE;backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:24px;overflow-y:auto}.co-modal{width:420px;max-width:100%;max-height:calc(100dvh - 48px);overflow-y:auto;border-radius:22px;border:1px solid #9EB5FF30;background:linear-gradient(145deg,#181C2E,#0E0F18);padding:28px;box-shadow:0 40px 120px #00000090;animation:co-copy-in .2s ease}.co-modal-top{display:flex;justify-content:space-between;margin-bottom:24px}.co-modal h2{font-size:24px;line-height:1.25;letter-spacing:-.8px;font-family:Manrope,Inter,sans-serif}.co-modal>p{font-size:12px;color:#A0ADCC;margin-top:10px}.co-modal-roles{display:grid;gap:10px;margin-top:25px}.co-modal-roles button{display:flex;align-items:center;gap:13px;background:#ffffff03;border:1px solid #ffffff0F;border-radius:12px;padding:15px;text-align:left;transition:background .2s,border-color .2s}.co-modal-roles button:hover{background:#4F7CFF0C;border-color:#6F93FF55}.co-modal-roles button>svg{color:#8FA9F6;flex-shrink:0}.co-modal-roles button>svg:last-child{margin-left:auto}.co-modal-roles strong{font-size:13px;display:block}.co-modal-roles small{font-size:10px;color:#95A3C5;margin-top:5px;display:block}.co-modal .co-modal-switch{text-align:center;font-size:11px;margin-top:23px}.co-modal-switch button{background:none;border:0;color:#9EB7FF;font-size:11px;padding:4px}
.co-reveal-ready{opacity:0;transform:translateY(24px);transition:opacity .65s ease,transform .65s cubic-bezier(.2,.7,.2,1)}.co-reveal-ready.co-visible{opacity:1;transform:none}.co-static-journey{height:auto}.co-static-journey .co-journey-sticky{position:relative;height:auto;min-height:0;padding:95px 0}
@keyframes co-label-drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@keyframes co-copy-in{from{opacity:.3;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
@media(min-width:1500px){.co-hero-layout{min-height:730px}.co-hero-visual{height:730px}.co-hero h1{font-size:84px}}
@media(max-width:1100px){.co-container{width:calc(100% - 56px)}.co-desktop-links{gap:19px}.co-hero h1{font-size:61px;letter-spacing:-3px}.co-hero-visual{width:calc(100% + 45px);height:590px}.co-orbit-label-one{left:-5%;top:90px}.co-orbit-label-two{right:2%;bottom:100px}.co-journey-grid{gap:35px;grid-template-columns:.9fr 1.1fr}.co-preview-content{padding:22px}.co-role-card{padding:23px}.co-role-card h3{font-size:19px}}
@media(max-width:899px){.co-desktop-links{display:none}.co-menu-toggle{display:flex}.co-nav-inner{height:70px}.co-hero{min-height:0;padding-top:95px}.co-hero-layout{grid-template-columns:1fr;min-height:0}.co-hero-copy{text-align:center;padding:42px 0 0;transform:none}.co-announcement,.co-hero-actions,.co-hero-proof{justify-content:center}.co-hero h1{font-size:clamp(49px,8vw,72px);letter-spacing:-3px}.co-hero-description{margin-inline:auto;max-width:450px}.co-lead{margin-top:23px!important;font-size:18px}.co-desktop-break{display:none}.co-hero-visual{height:510px;width:min(660px,100%);margin:0 auto;transform:translateY(calc(var(--co-hero-shift)*.25))}.co-sculpture{inset:-25px -30px 0}.co-orbit-label-one{left:4%;top:70px}.co-orbit-label-two{right:4%;bottom:98px}.co-hero-bottom{margin-top:0}.co-hero-bottom>span{font-size:7px;letter-spacing:1px}.co-journey{height:auto}.co-journey-sticky{position:relative;height:auto;min-height:0;padding:85px 0}.co-journey-grid{grid-template-columns:1fr;gap:50px}.co-section-kicker{margin-bottom:35px}.co-chapter-copy{max-width:600px}.co-chapter-copy h2{font-size:40px}.co-chapter-copy>p{max-width:480px}.co-chapter-icon{margin-bottom:20px}.co-chapter-tabs{margin-top:30px}.co-showcase-stage{max-width:630px;width:100%;margin:auto}.co-browser-tilt{transform:perspective(1200px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))}.co-role-grid{gap:12px}.co-role-card{padding:20px;min-height:410px}.co-role-card h3{font-size:19px}.co-role-card>p{font-size:12px;min-height:92px}.co-role-art{height:135px}.co-art-ring{width:120px;height:120px;left:calc(50% - 60px);top:calc(50% - 60px)}.co-role-card-top{font-size:7px;letter-spacing:.6px}.co-section{padding:85px 0}.co-final{padding:105px 0 85px}}
@media(max-width:600px){.co-container{width:calc(100% - 40px)}.co-nav-inner{gap:12px}.co-brand{font-size:17px}.co-nav-actions{gap:4px}.co-nav-signup{display:none}.co-nav-actions .co-quiet{font-size:11px;padding:8px 12px}.co-announcement{font-size:7px;letter-spacing:1.3px;gap:7px;margin-bottom:24px}.co-hero-copy{padding-top:30px}.co-hero h1{font-size:clamp(44px,11vw,62px);letter-spacing:-2.8px}.co-lead{font-size:17px}.co-hero-description{font-size:12px;max-width:340px;line-height:1.8}.co-hero-actions{gap:9px;margin-top:25px}.co-large{font-size:12px;padding:14px 17px;min-height:49px}.co-hero-proof{gap:10px;font-size:8px;margin-top:23px}.co-hero-proof svg{width:13px}.co-hero-visual{height:390px;margin-top:12px}.co-orbit-label{padding:10px;gap:8px}.co-orbit-label small{font-size:6px;letter-spacing:1px}.co-orbit-label strong{font-size:9px}.co-label-icon{height:27px;width:27px;border-radius:7px}.co-label-icon svg{width:14px}.co-orbit-label-one{left:0;top:50px}.co-orbit-label-two{right:0;bottom:88px}.co-orbit-coordinate{bottom:50px;font-size:6px;letter-spacing:2px}.co-scene-note{bottom:30px;font-size:8px}.co-hero-bottom{padding-bottom:25px}.co-hero-bottom a{font-size:9px}.co-hero-bottom>span{max-width:130px;text-align:right;line-height:1.7;font-size:6px}.co-manifesto-strip>.co-container{font-size:11px;gap:10px;padding-block:23px}.co-manifesto-strip .co-blue{gap:7px}.co-manifesto-strip svg{width:13px}.co-section-kicker{font-size:7px;letter-spacing:1.2px;gap:9px}.co-chapter-count{font-size:8px}.co-chapter-copy h2{font-size:34px;letter-spacing:-1.3px}.co-chapter-copy>p{font-size:13px}.co-chapter-tabs{gap:19px}.co-chapter-tabs button{font-size:9px;gap:4px}.co-preview{min-height:390px}.co-preview-content{padding:20px 15px}.co-mini-rail{width:39px;padding:17px 5px}.co-mini-rail>div{width:28px;height:32px}.co-mini-rail svg{width:15px}.co-browser{padding:0 11px;gap:10px;font-size:8px}.co-sample{font-size:6px}.co-preview-heading h3{font-size:17px}.co-preview-heading p{font-size:9px}.co-preview-heading .co-eyebrow{font-size:6px}.co-avatar{width:30px;height:30px;font-size:9px}.co-profile-banner{padding:12px;gap:8px}.co-profile-banner strong{font-size:12px}.co-chip{font-size:7px;padding:4px 6px}.co-step{gap:7px;padding:10px 8px}.co-step strong{font-size:9px}.co-step small{font-size:7px}.co-showcase-caption{font-size:8px;margin-top:20px}.co-showcase-caption>span:last-child{font-size:6px;letter-spacing:.6px}.co-role-grid{grid-template-columns:1fr;gap:16px}.co-role-card{min-height:0;padding:26px}.co-role-card h3{font-size:24px}.co-role-card>p{min-height:0;font-size:13px;max-width:300px}.co-role-card-top{font-size:9px;letter-spacing:1.3px}.co-role-art{height:150px;margin-bottom:20px}.co-art-ring{width:170px;height:170px;left:calc(50% - 85px);top:calc(50% - 85px)}.co-ecosystem-heading{text-align:left;margin-bottom:38px}.co-ecosystem-heading h2{font-size:39px;letter-spacing:-1.9px}.co-ecosystem-heading p{font-size:12px}.co-feedback-line{gap:9px;margin-top:30px}.co-feedback-line>span{display:none}.co-feedback-line>svg{flex-shrink:0}.co-feedback-line p{font-size:10px;line-height:1.7}.co-bridge h2{font-size:42px;letter-spacing:-2px}.co-bridge-label .co-eyebrow{font-size:7px;letter-spacing:1px}.co-small-orbit{width:45px;height:25px}.co-bridge-bottom{align-items:start;flex-direction:column;gap:25px}.co-bridge-bottom>p{font-size:13px}.co-final h2{font-size:54px;letter-spacing:-2.8px}.co-final-actions{gap:9px}.co-footer>.co-container{flex-wrap:wrap;gap:25px}.co-footer>div>div{gap:20px}.co-footer>div>span{width:100%;font-size:9px}.co-modal{padding:23px}.co-modal h2{font-size:22px}}
@media(min-width:900px) and (max-height:759px){.co-journey{height:auto}.co-journey-sticky{position:relative;height:auto;min-height:0;padding:90px 0}.co-browser-tilt{transform:perspective(1200px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))}}
@media(prefers-reduced-motion:reduce){.co-landing *,.co-landing *:before,.co-landing *:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.co-hero-copy,.co-hero-visual,.co-tilt,.co-browser-tilt{transform:none!important}.co-reveal-ready{opacity:1;transform:none}.co-art-tile{transition:none}.co-journey{height:auto}.co-journey-sticky{position:relative;height:auto;min-height:0;padding:80px 0}}

.co-landing{--co-border:rgba(255,255,255,.12)}
.co-button{border-radius:6px}.co-brand-icon{border-radius:7px}
.co-hero h1{font-weight:800;letter-spacing:-3.8px}.co-hero-description{color:#A3ABC3}
.co-preview,.co-role-card{border-radius:10px}.co-preview{border-color:#A4B9FF3D;box-shadow:0 35px 90px #0009,0 1px 0 #ffffff14 inset}
.co-role-card{background:linear-gradient(145deg,#171C30,#0C101B);border-color:#9DADFF29}
.co-orbit-label{border-radius:8px;border-color:#A9BDFF35}.co-chapter-icon{border-radius:8px}
.co-restored-features,.co-restored-metrics,.co-restored-testimonials{position:relative}
.co-restored-features h2,.co-restored-metrics h2,.co-restored-testimonials h2{font-weight:750!important;letter-spacing:-1.6px!important}
.co-restored-features>div>div:last-child>div{border-radius:8px!important;border-color:#ffffff18!important;box-shadow:inset 0 1px 0 #ffffff05}
.co-restored-features>div>div:last-child>div:hover{border-color:#789AFF70!important;background:#101528!important}
.co-restored-metrics>div>div:last-child{border:1px solid #ffffff16;border-radius:8px;overflow:hidden}
.co-restored-metrics>div>div:last-child>div{border-radius:0!important;background:linear-gradient(150deg,#141A2D,#0D101A)!important}
.co-restored-testimonials>div>div:last-child>div{border-radius:9px!important;border-color:#ffffff18!important}
.co-restored-testimonials p{color:#AAB3CE}
.co-final .co-pricing-copy{font-size:15px;line-height:1.8;color:#B7C1DA;max-width:550px;margin:0 auto 28px}
.co-pricing-options{display:grid;grid-template-columns:1fr 1.4fr;max-width:620px;margin:0 auto 30px;text-align:left;border:1px solid #8FA9FF38;border-radius:10px;background:linear-gradient(120deg,#141A2B,#0C101B);overflow:hidden}
.co-pricing-options>div{padding:26px}.co-pricing-options>div+div{border-left:1px solid #ffffff12}
.co-pricing-options span{display:block;color:#95A8D5;font-size:9px;letter-spacing:1.5px}.co-pricing-options strong{display:block;font-size:25px;letter-spacing:-.8px;margin:13px 0;color:#ECF1FF}.co-pricing-options small{font-size:11px;color:#99A6C5;line-height:1.6;display:block}
@media(max-width:600px){.co-hero h1{letter-spacing:-2.6px}.co-pricing-options{grid-template-columns:1fr}.co-pricing-options>div+div{border-left:0;border-top:1px solid #ffffff12}.co-pricing-options>div{padding:22px}.co-final .co-pricing-copy{font-size:13px}.co-restored-metrics>div>div:last-child{grid-template-columns:1fr 1fr!important}.co-restored-metrics>div>div:last-child>div{padding:26px 13px!important}.co-restored-testimonials>div>div:last-child{grid-template-columns:1fr!important}.co-restored-features,.co-restored-metrics,.co-restored-testimonials{padding:70px 20px!important}}

/* Regenerated art direction: precision instrument, editorial type, cold metal. */
.co-hero{background:radial-gradient(ellipse at 77% 48%,#14224933,transparent 46%),#08090E}
.co-hero-layout{grid-template-columns:1.04fr 1fr;min-height:710px}
.co-hero-copy{padding-top:35px;padding-bottom:60px}
.co-hero h1{font-size:clamp(64px,6.45vw,98px);letter-spacing:-5.8px;line-height:1.01;font-weight:750}
.co-hero h1>span{background:linear-gradient(110deg,#689AFF,#446DF6 65%,#AABFFF);background-clip:text;-webkit-background-clip:text}
.co-announcement{font-family:ui-monospace,SFMono-Regular,monospace;letter-spacing:1.4px;border-left:2px solid #4F7CFF;padding:7px 0 7px 13px;margin-bottom:35px}
.co-announcement>span:first-child{display:none}
.co-lead{font-size:21px;letter-spacing:-.5px;margin-top:31px!important}
.co-hero-description{max-width:390px;font-size:13px}
.co-hero-grid{background-size:72px 72px;opacity:.38;transform:translateY(calc(var(--co-hero-shift)*-.3))}
.co-hero-visual{height:660px;width:calc(100% + 65px);margin-left:-20px}
.co-sculpture{inset:-15px -60px 0 -45px;z-index:1}
.co-instrument-scale{position:absolute;top:38px;left:10%;right:5%;display:flex;justify-content:space-between;font:8px ui-monospace,monospace;letter-spacing:1.7px;color:#7C8CA9;padding-block:12px;border-block:1px solid #8CA6FF20}
.co-orbital-track{position:absolute;inset:18% 7% 20%;border:1px dashed #749EFF22;border-radius:50%;transform:rotate(-20deg) scaleX(1.08);pointer-events:none}
.co-orbital-track:before,.co-orbital-track:after{content:'';position:absolute;width:5px;height:5px;border-radius:50%;background:#8EAFFF;box-shadow:0 0 14px #4F7CFF;left:17%;top:11%}
.co-orbital-track:after{left:83%;top:86%}
.co-orbit-label{pointer-events:auto;text-decoration:none;border-radius:4px!important;background:linear-gradient(110deg,#172139F5,#0E1422F0);padding:15px;gap:10px;transition:border-color .2s,box-shadow .2s;animation:none}
.co-orbit-label:hover,.co-orbit-label:focus-visible{border-color:#759DFF;box-shadow:0 12px 44px #3767FF25;outline:2px solid #608BFF;outline-offset:4px}
.co-orbit-label>svg{margin-left:9px;color:#8EA8E7;transition:transform .2s}
.co-orbit-label:hover>svg{transform:translateX(4px)}
.co-orbit-label-one{top:148px;left:-4%;transform:translateY(calc(var(--co-hero-shift)*-.32))}
.co-orbit-label-two{right:0;bottom:146px;transform:translateY(calc(var(--co-hero-shift)*.18))}
.co-label-icon{border-radius:4px;background:#4F7CFF1A}
.co-core-caption{position:absolute;bottom:108px;left:17%;z-index:2;display:flex;align-items:center;gap:9px;color:#8295BC;font:7px ui-monospace,monospace;letter-spacing:1px}
.co-core-caption i{height:4px;width:4px;border-radius:50%;background:#76A1FF}
.co-core-caption b{font-size:27px;font-weight:400;color:#B4C9F9;line-height:1;margin-left:18px}
.co-orbit-coordinate{bottom:72px;font-family:ui-monospace,monospace;font-size:7px}
.co-scene-note{font-size:9px;bottom:43px}
.co-primary{background:linear-gradient(145deg,#5786FF,#365FE3);border:1px solid #769BFF!important;box-shadow:inset 0 1px 0 #BDCEFF55,0 6px 24px #2E58D920;position:relative;overflow:hidden}
.co-primary:after{content:'';position:absolute;inset:-100% -50%;background:linear-gradient(110deg,transparent 40%,#FFFFFF24 50%,transparent 60%);transform:translateX(-70%);transition:transform .7s;pointer-events:none}
.co-primary:hover:after{transform:translateX(70%)}
.co-button svg{transition:transform .2s}.co-button:hover svg{transform:translateX(3px)}
.co-secondary{border-color:#A1B5EC35;background:#FFFFFF03}
.co-journey{background:radial-gradient(ellipse at 75% 42%,#263B7022,transparent 55%)}
.co-browser-tilt{box-shadow:0 45px 100px #00000075,0 0 0 1px #9FB6FF15}
.co-chapter-tabs button{transition:color .2s,border-color .2s}
.co-role-card{background:linear-gradient(155deg,#151C2E,#0C0F19 65%);border-color:#8DAAF42A}
.co-role-card:hover{border-color:#739DFF88;box-shadow:0 22px 60px #00000055}
.co-restored-features .feature-grid>div{transition:border-color .2s,transform .25s,box-shadow .25s!important}
.co-restored-features .feature-grid>div:hover{transform:translateY(-5px);border-color:#6D97FF66!important;box-shadow:0 24px 60px #0005}
.co-final{background:radial-gradient(ellipse at 50% 90%,#305CC02A,transparent 60%);border-top:1px solid #7A9FF51F}
@media(min-width:1500px){.co-hero-layout{min-height:760px}.co-hero h1{font-size:100px}}
@media(max-width:1100px) and (min-width:900px){.co-hero h1{font-size:73px;letter-spacing:-4.6px}.co-hero-visual{width:calc(100% + 40px)}.co-orbit-label-one{left:-10%;top:135px}}
@media(max-width:899px){.co-hero-layout{grid-template-columns:1fr;min-height:0}.co-hero-copy{padding:40px 0 0}.co-announcement{border-left:0;padding:0}.co-hero h1{font-size:clamp(60px,10vw,84px);letter-spacing:-4px}.co-hero-visual{width:min(650px,100%);height:560px;margin:15px auto 0}.co-instrument-scale{top:25px;left:8%;right:8%}.co-orbit-label-one{left:0;top:135px}.co-orbit-label-two{right:0;bottom:125px}.co-hero-description{margin-inline:auto}.co-core-caption{bottom:96px}}
@media(max-width:600px){.co-hero h1{font-size:clamp(49px,12.5vw,70px);letter-spacing:-3.3px}.co-announcement{font-size:7px;letter-spacing:.8px}.co-lead{font-size:17px;margin-top:24px!important}.co-hero-description{font-size:12px}.co-hero-visual{height:425px;margin-top:22px}.co-sculpture{inset:0 -40px -10px}.co-orbit-label{padding:10px;gap:7px}.co-orbit-label>svg{width:10px;margin-left:2px}.co-orbit-label-one{top:90px;left:-5px}.co-orbit-label-two{bottom:96px;right:-5px}.co-instrument-scale{top:9px;font-size:6px;letter-spacing:.8px}.co-core-caption{display:none}.co-orbit-coordinate{bottom:45px;font-size:6px}.co-scene-note{bottom:21px;font-size:8px}}
@media(prefers-reduced-motion:reduce){.co-orbit-label,.co-hero-grid{transform:none!important}.co-primary:after{display:none}}
`

const CINEMATIC_STYLES = `
.cin-page{--paper:#F0F0FA;--ink:#181A24;--muted:#636577;--line:#D3D4E1;--wash:#E5E6F0;--cin-scroll:0px;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif;color-scheme:light}
.cin-page.dark{--paper:#0B0C12;--ink:#ECEEF9;--muted:#A2A6BD;--line:#2C2E40;--wash:#181A28;color-scheme:dark}
.cin-page *{box-sizing:border-box}.cin-page h1,.cin-page h2,.cin-page h3{font-weight:500;letter-spacing:-.045em}.cin-page button{border:0}.cin-page section[id]{scroll-margin-top:30px}.cin-page :focus-visible{outline:2px solid #4F7CFF;outline-offset:5px}.cin-page button,.cin-page a{touch-action:manipulation}
.cin-skip{position:fixed;top:-100px;left:20px;z-index:200;background:var(--ink);color:var(--paper)!important;padding:15px}.cin-skip:focus{top:20px}
.cin-wrap{width:calc(100% - 128px);max-width:1600px;margin:auto}
.cin-header{display:grid;grid-template-columns:1fr 1.85fr auto;align-items:start;gap:30px;padding:48px 64px 34px;position:relative;z-index:30}
.cin-wordmark{font-size:24px;letter-spacing:-1px;font-weight:800;display:flex;align-items:center;white-space:nowrap;line-height:1.4}.cin-wordmark>span{font-weight:400}.cin-wordmark i{width:6px;height:6px;background:#4F7CFF;border-radius:50%;margin:0 0 15px 3px}
.cin-header h1{font-size:clamp(21px,2.05vw,33px);line-height:1.13;letter-spacing:-.035em;max-width:560px}
.cin-nav-controls{display:flex;align-items:center;gap:9px}.cin-pill{display:inline-flex;align-items:center;justify-content:center;gap:20px;min-height:44px;padding:0 21px;border-radius:30px;background:var(--wash);font-size:10px;font-weight:700;white-space:nowrap;transition:background .2s,transform .2s;letter-spacing:-.02em}.cin-pill:hover{transform:translateY(-2px);background:#CFD7F5}.dark .cin-pill:hover{background:#303C5F}.cin-pill>span{font-size:16px}.cin-solid{background:var(--ink);color:var(--paper)!important}.cin-solid:hover{background:#4F7CFF!important;color:white!important}.cin-outline{background:transparent;border:1px solid var(--line)!important}.cin-round{height:44px;width:44px;border-radius:50%;display:grid;place-items:center;background:var(--wash)}
.cin-menu{position:absolute;right:64px;top:105px;width:340px;background:var(--ink);color:var(--paper);padding:22px;border-radius:14px;box-shadow:0 25px 70px #0004}.cin-menu>a,.cin-menu>button{display:flex;justify-content:space-between;align-items:center;padding:15px 8px;width:100%;font-size:22px;background:none;border-bottom:1px solid #8885!important;text-align:left}.cin-menu>a:hover,.cin-menu>button:hover{color:#84A4FF}
.cin-hero{margin:0 64px}.cin-stage{position:relative;height:min(76vw,740px);min-height:520px;border-radius:24px;background:#12141E;overflow:hidden;isolation:isolate}.cin-stage .co-sculpture{inset:-8% -5%;transform:translateY(var(--cin-scroll)) scale(1.04);z-index:-2}.cin-stage .co-sculpture canvas{mask-image:none;transition:opacity .4s}.cin-stage .co-scene-grain{display:none}.cin-stage-shade{position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,#080B1B77,transparent 65%),linear-gradient(0deg,#060912A8,transparent 40%)}
.cin-stage-top{position:absolute;top:30px;left:32px;right:32px;display:flex;justify-content:space-between;color:#CED5EA;font:8px ui-monospace,monospace;letter-spacing:1.6px}.cin-stage-title{position:absolute;bottom:116px;left:44px;color:#F8F9FF;pointer-events:none;transform:translateY(calc(var(--cin-scroll)*-.5))}.cin-stage-title>span{font-size:9px;letter-spacing:2px}.cin-stage h2{font-size:clamp(80px,9vw,145px);line-height:.91;margin-top:23px;letter-spacing:-.055em}.cin-stage h2 em{font-style:normal;color:#B3C7FF}
.cin-stage-bottom{position:absolute;bottom:29px;left:34px;right:30px;display:flex;justify-content:space-between;align-items:center;color:white}.cin-explore{display:flex;align-items:center;gap:50px;font-size:10px;font-weight:700}.cin-explore svg{border-radius:50%;width:46px;height:46px;padding:12px;background:white;color:#171B2A;transition:transform .2s}.cin-explore:hover svg{transform:rotate(-35deg)}.cin-stage-bottom>button{display:flex;align-items:center;gap:9px;background:#11172E99;border:1px solid #BCCFFF45;color:white;border-radius:25px;padding:12px 16px;font-size:9px}.cin-crossline{display:flex;justify-content:space-between;align-items:center;padding-top:13px}.cin-crossline>span{font-size:23px;font-weight:300}.cin-crossline>a{font-size:9px;font-weight:600}
.cin-trust{margin:74px auto 0;display:flex;gap:37px;align-items:center;justify-content:center;flex-wrap:wrap;color:var(--muted)}.cin-trust>span{font-size:8px;letter-spacing:1px}.cin-trust>strong{font-size:20px;font-weight:500;color:var(--ink)}.cin-trust>i{font-style:normal;color:#4F7CFF}
.cin-intro{padding:145px 0 130px}.cin-kicker{font-size:9px;letter-spacing:1px;line-height:1.5;font-weight:600;text-transform:uppercase}.cin-intro h2,.cin-features>div>h2,.cin-roles>h2,.cin-pricing>h2{font-size:clamp(52px,6.7vw,102px);line-height:1.025;margin-top:35px}.cin-intro h2 span,.cin-features h2 span,.cin-roles h2 span,.cin-pricing h2 span{color:var(--muted)}.cin-intro-bottom{display:grid;grid-template-columns:1fr 1.25fr 1fr;align-items:end;gap:45px;margin-top:60px}.cin-asterisk{font-size:110px;line-height:1;color:#4F7CFF}.cin-intro-bottom p{font-size:18px;line-height:1.6;letter-spacing:-.025em;max-width:490px}.cin-intro-bottom a{justify-self:end}
.cin-story{height:500vh;background:var(--wash)}.cin-story-sticky{position:sticky;top:0;min-height:760px;height:100vh;padding-block:50px;display:flex;flex-direction:column;justify-content:center}.cin-section-heading{display:flex;justify-content:space-between;align-items:center;gap:20px}.cin-section-heading>span:last-child{font-size:8px;letter-spacing:.8px;color:var(--muted)}.cin-story-grid{display:grid;grid-template-columns:1fr 1.15fr;align-items:center;gap:7%;margin-top:40px}.cin-chapter-number{font-size:54px;font-weight:400;letter-spacing:-3px;color:#4F7CFF;display:flex;align-items:center;gap:18px}.cin-chapter-number i{font-size:10px;letter-spacing:0;color:var(--muted);font-style:normal}.cin-story-copy h2{font-size:clamp(37px,3.8vw,62px);line-height:1.05;white-space:pre-line;margin-top:22px}.cin-story-copy p{max-width:410px;font-size:15px;line-height:1.7;margin-top:24px;color:var(--muted)}.cin-chapter-buttons{display:flex;gap:24px;margin-top:40px}.cin-chapter-buttons>button{padding:15px 0;background:none;font-size:10px;display:flex;gap:7px;color:var(--muted);border-bottom:1px solid transparent}.cin-chapter-buttons>button[aria-pressed=true]{color:var(--ink);border-bottom:1px solid #4F7CFF}.cin-product-stage{transform:perspective(1000px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .25s}.cin-product-stage .co-preview{background:#0F1424;color:#EDF1FF;box-shadow:0 40px 80px #151F3C20;border:1px solid #5C6A8935;border-radius:12px;min-height:440px}.cin-preview-caption{display:flex;justify-content:space-between;font-size:7px;letter-spacing:1px;margin-top:24px;color:var(--muted)}.cin-chapter-progress{height:2px;background:var(--line);border-radius:4px;margin-bottom:28px;overflow:hidden;position:relative}.cin-chapter-progress-fill{height:100%;width:0%;background:#4F7CFF;border-radius:4px;will-change:width;transition:width .08s linear}.cin-copy-anim{animation:cin-copy-in .45s cubic-bezier(.22,.68,0,1) both}.cin-story-grid{transform:translateY(calc((var(--cin-chapter-frac,.5)-.5)*8px));transition:transform .18s linear}@keyframes cin-copy-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.cin-features{padding-block:130px}.cin-filters{display:flex;flex-wrap:wrap;gap:10px;margin-top:45px;padding-bottom:32px;border-bottom:1px solid var(--line)}.cin-filters button{display:flex;gap:15px;padding:12px 18px;border-radius:30px;background:var(--wash);font-size:11px}.cin-filters button>span{font-size:8px;opacity:.65}.cin-filters button[aria-pressed=true]{background:var(--ink);color:var(--paper)}.cin-catalog{display:grid;grid-template-columns:1fr 1fr;gap:7%;margin-top:35px;align-items:start}.cin-module-list button{display:flex;align-items:center;gap:25px;width:100%;text-align:left;background:none;border-bottom:1px solid var(--line);padding:23px 10px;transition:background .2s,color .2s}.cin-module-list button>small{font-size:9px;color:var(--muted)}.cin-module-list button>span{font-size:clamp(18px,1.75vw,28px);letter-spacing:-.04em;flex:1}.cin-module-list button svg{transition:transform .2s}.cin-module-list button:hover svg{transform:rotate(45deg)}.cin-module-list button[aria-pressed=true]{color:#3D68EC;background:var(--wash)}.dark .cin-module-list button[aria-pressed=true]{color:#A1B9FF}.cin-module-detail{position:sticky;top:30px;border:1px solid var(--line);border-radius:14px;overflow:hidden}.cin-module-art{height:280px;background:radial-gradient(ellipse at 60% 30%,#314E94,#101B3C 75%);position:relative;overflow:hidden;perspective:700px;color:white}.cin-module-art>span{position:absolute;top:24px;left:25px;font-size:8px;letter-spacing:1px}.cin-art-orbit{position:absolute;left:calc(50% - 115px);top:30px;width:230px;height:230px;border-radius:50%;border:23px solid #6785D1;box-shadow:inset 0 0 10px #E4EBFF,0 0 7px #BFCFFF,12px 10px 20px #030919A0;transform:rotateX(65deg) rotateZ(-25deg);animation:cin-orbit 15s ease-in-out infinite alternate}.cin-art-orbit.second{transform:rotateX(30deg) rotateY(65deg);border-width:12px;border-color:#A3B7ED;animation-direction:alternate-reverse}.cin-art-core{position:absolute;left:calc(50% - 49px);top:94px;width:98px;height:98px;background:linear-gradient(130deg,#7198FF,#254ACB);border-radius:22px;display:grid;place-items:center;box-shadow:inset 1px 1px 2px #D4DFFF,14px 18px 30px #0005;transform:rotate(-10deg)}.art-1{background:radial-gradient(ellipse at 60% 30%,#206F64,#0D2929 75%)}.art-2{background:radial-gradient(ellipse at 60% 30%,#5B428A,#231436 75%)}.art-3{background:radial-gradient(ellipse at 60% 30%,#5E6480,#1C2034 75%)}.cin-detail-copy{padding:30px}.cin-detail-copy h3{font-size:33px;line-height:1.08;margin-top:15px}.cin-detail-copy p{font-size:13px;line-height:1.7;color:var(--muted);margin-top:18px}.cin-detail-copy ul{list-style:none;padding:0;margin:23px 0 28px}.cin-detail-copy li{display:flex;align-items:start;gap:10px;font-size:11px;line-height:1.5;margin-top:12px}.cin-detail-copy li svg{color:#4F7CFF;flex-shrink:0}
.cin-metrics{padding:70px 0;border-block:1px solid var(--line)}.cin-metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:55px}.cin-metric-grid>div{display:flex;flex-direction:column;border-right:1px solid var(--line)}.cin-metric-grid>div:last-child{border:0}.cin-metric-grid strong{font-size:clamp(36px,4.5vw,70px);font-weight:400;letter-spacing:-.065em}.cin-metric-grid span{font-size:13px;margin-top:14px}.cin-metric-grid small{color:var(--muted);font-size:10px;margin-top:8px}.cin-quotes{padding:110px 0}.cin-quote-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:45px}.cin-quote>span{color:#4F7CFF;font-size:60px;line-height:1}.cin-quote blockquote{margin:0;font-size:18px;line-height:1.5;letter-spacing:-.02em;min-height:190px}.cin-quote>div{display:flex;flex-direction:column;gap:8px;margin-top:30px}.cin-quote strong{font-size:12px}.cin-quote small{font-size:10px;color:var(--muted)}
.cin-roles{padding:90px 0 130px;border-top:1px solid var(--line)}.cin-role-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:55px}.cin-role{padding:28px;background:#DDE4F7;text-align:left;border-radius:15px;color:#17213E!important;overflow:hidden;transition:transform .25s}.cin-role:hover{transform:translateY(-7px)}.cin-role-top{display:flex;justify-content:space-between;align-items:center;font-size:9px;letter-spacing:.7px}.cin-role-object{height:210px;display:grid;place-items:center;perspective:700px}.cin-role-object svg{width:120px;height:120px;padding:28px;box-sizing:content-box;border-radius:35px;background:linear-gradient(145deg,#769AFF,#375CCC);box-shadow:inset 2px 2px 2px #F6F8FFAA,16px 22px 30px #25438B40;transform:rotate(-13deg) rotateY(-20deg);color:#F1F4FF;stroke-width:1;transition:transform .5s}.cin-role:hover .cin-role-object svg{transform:rotate(5deg) rotateY(20deg)}.role-1{background:#DFEAE5}.role-1 .cin-role-object svg{background:linear-gradient(145deg,#8DC8B8,#3B7A73)}.role-2{background:#E8DFF3}.role-2 .cin-role-object svg{background:linear-gradient(145deg,#BFA5E5,#7450A4)}.cin-role>strong{display:block;font-size:27px;font-weight:500;letter-spacing:-1px;line-height:1.1}.cin-role>p{font-size:12px;line-height:1.7;color:#4E5871;margin-top:17px;min-height:64px}.cin-role-action{margin-top:30px;border-top:1px solid #17213E25;padding-top:20px;display:flex;align-items:center;justify-content:space-between;font-size:9px}
.cin-pricing{padding:85px 0 120px;border-top:1px solid var(--line)}.cin-pricing>p{font-size:15px;line-height:1.7;color:var(--muted);margin-top:35px;max-width:620px}.cin-price-grid{display:grid;grid-template-columns:1fr 1fr;margin-top:50px;border:1px solid var(--line);border-radius:15px;overflow:hidden}.cin-price-grid>div{padding:38px}.cin-price-grid>div+div{border-left:1px solid var(--line);background:var(--wash)}.cin-price-grid span{font-size:9px;letter-spacing:1px}.cin-price-grid h3{font-size:clamp(30px,3.5vw,52px);margin-top:27px}.cin-price-grid p{font-size:13px;color:var(--muted);margin-top:14px}.cin-price-grid button{margin-top:35px}
.cin-outro{margin:0 25px;padding:70px 40px 35px;background:#315FF4;color:white;border-radius:24px;overflow:hidden}.cin-outro>span{font-size:9px;letter-spacing:1.5px}.cin-outro>button{position:relative;display:block;text-align:left;background:none;color:white;font-size:clamp(70px,12vw,190px);line-height:.98;letter-spacing:-.065em;margin:60px 0 75px;width:100%;padding:0}.cin-outro>button>em{font-style:normal;color:#C9D5FF}.cin-outro>button>svg{position:absolute;right:1%;bottom:0;width:18%;height:auto;stroke-width:1;transition:transform .3s}.cin-outro>button:hover>svg{transform:translate(8px,-8px)}.cin-outro>div{display:flex;justify-content:space-between;align-items:center}.cin-outro>div>span{font-size:8px;letter-spacing:1px}.cin-outro .cin-pill{background:#FFFFFF22;color:white}.cin-footer{padding:45px 64px;display:flex;justify-content:space-between;align-items:center;gap:25px}.cin-footer nav{display:flex;gap:25px;font-size:11px}.cin-footer>span{font-size:9px;color:var(--muted)}
.cin-page .co-modal{background:var(--paper);color:var(--ink);border-color:var(--line)}.cin-page .co-modal>p,.cin-page .co-modal small{color:var(--muted)}.cin-page .co-modal-roles button{background:var(--wash);border-color:var(--line);color:var(--ink)}.cin-page .co-modal-top button{color:var(--ink)}.cin-page .co-modal-backdrop{z-index:100}
@keyframes cin-orbit{from{transform:rotateX(60deg) rotateY(-10deg) rotateZ(-25deg)}to{transform:rotateX(75deg) rotateY(40deg) rotateZ(25deg)}}
@media(min-width:1800px){.cin-header,.cin-footer{max-width:1728px;margin:auto}.cin-hero{max-width:1600px;margin:auto}}
@media(max-width:1150px){.cin-header{grid-template-columns:1fr 1.5fr;gap:25px;padding:32px}.cin-header h1{grid-column:1 / -1;grid-row:2;font-size:30px}.cin-nav-controls{justify-self:end}.cin-hero{margin:0 32px}.cin-wrap{width:calc(100% - 64px)}.cin-menu{right:32px;top:87px}.cin-intro-bottom{grid-template-columns:.5fr 1.4fr;gap:30px}.cin-intro-bottom>a{grid-column:2;justify-self:start}.cin-story-grid{gap:5%;grid-template-columns:1fr 1.1fr}.cin-story-copy h2{font-size:40px}.cin-chapter-buttons{gap:12px}.cin-quote blockquote{font-size:16px;min-height:210px}.cin-role{padding:23px}.cin-role>strong{font-size:24px}}
@media(max-width:899px){.cin-story{height:auto}.cin-story-sticky{position:relative;height:auto;min-height:0;padding-block:70px}.cin-story-grid{grid-template-columns:1fr;margin-top:40px;gap:45px;transform:none!important}.cin-chapter-progress{display:none}.cin-story-copy h2{font-size:45px;max-width:650px}.cin-story-copy p{max-width:550px}.cin-product-stage{width:min(620px,100%);margin:auto}.cin-catalog{gap:25px;grid-template-columns:.9fr 1.1fr}.cin-module-list button{gap:12px;padding:20px 5px}.cin-module-list button>span{font-size:18px}.cin-detail-copy{padding:24px}.cin-detail-copy h3{font-size:29px}.cin-detail-copy .cin-pill{font-size:8px;gap:9px;padding:0 14px}.cin-intro,.cin-features{padding-block:90px}.cin-quote-grid{gap:25px}.cin-quote blockquote{min-height:270px}.cin-role-grid{grid-template-columns:1fr}.cin-role{display:grid;grid-template-columns:1fr 1fr;column-gap:30px}.cin-role-top{grid-column:1 / -1}.cin-role-object{grid-row:2 / 5;height:220px}.cin-role>strong{align-self:end}.cin-role>p{min-height:0}.cin-role-action{grid-column:2;margin-top:10px}.cin-metric-grid strong{font-size:40px}.cin-footer{padding:40px 32px;flex-wrap:wrap}}
@media(max-width:600px){.cin-header{padding:24px 20px 26px;gap:25px 10px}.cin-wordmark{font-size:19px}.cin-nav-controls{gap:6px}.cin-nav-controls .cin-solid{display:none}.cin-round{height:36px;width:36px}.cin-nav-controls .cin-pill{min-height:36px;padding:0 15px;font-size:9px;gap:11px}.cin-header h1{font-size:25px;line-height:1.15}.cin-wide{display:none}.cin-menu{right:20px;left:20px;top:77px;width:auto}.cin-hero{margin:0 15px}.cin-stage{height:620px;min-height:0;max-height:85svh;border-radius:16px}.cin-stage .co-sculpture{inset:-2% -70%;transform:translateY(calc(var(--cin-scroll)*.25))}.cin-stage-top{top:23px;left:22px;right:22px;font-size:6px;letter-spacing:1px}.cin-stage-top>span:last-child{display:none}.cin-stage-title{left:22px;bottom:112px}.cin-stage h2{font-size:clamp(64px,18vw,100px)}.cin-stage-title>span{font-size:7px}.cin-stage-bottom{left:22px;right:17px;bottom:25px}.cin-explore{font-size:8px;gap:15px}.cin-explore svg{width:36px;height:36px;padding:10px}.cin-stage-bottom>button{font-size:7px;padding:10px;gap:5px}.cin-crossline{padding:10px 5px}.cin-crossline>a{font-size:7px}.cin-crossline>span:nth-child(2),.cin-crossline>span:nth-child(4){display:none}.cin-trust{gap:17px;margin:45px 20px 0}.cin-trust>span{width:100%;text-align:center}.cin-trust>strong{font-size:16px}.cin-wrap{width:calc(100% - 40px)}.cin-intro{padding:75px 0}.cin-intro h2,.cin-features>div>h2,.cin-roles>h2,.cin-pricing>h2{font-size:clamp(40px,11vw,62px);margin-top:25px}.cin-intro-bottom{grid-template-columns:1fr;margin-top:30px;gap:25px}.cin-asterisk{font-size:65px}.cin-intro-bottom p{font-size:16px}.cin-intro-bottom>a{grid-column:1}.cin-section-heading>span:last-child{display:none}.cin-kicker{font-size:8px}.cin-story-copy h2{font-size:36px}.cin-story-copy p{font-size:13px}.cin-chapter-buttons{gap:20px;flex-wrap:wrap}.cin-chapter-buttons button{font-size:9px}.cin-preview-caption{font-size:6px;letter-spacing:.5px}.cin-features{padding-block:75px}.cin-filters{gap:8px;margin-top:30px}.cin-filters button{font-size:10px;padding:10px 13px;gap:9px}.cin-catalog{grid-template-columns:1fr;gap:25px;margin-top:20px}.cin-module-list{display:flex;gap:9px;overflow-x:auto;padding:4px 0 12px}.cin-module-list button{width:auto;min-width:180px;border:1px solid var(--line);padding:16px 12px;border-radius:8px}.cin-module-list button>span{font-size:14px;min-width:110px}.cin-module-list button>small{font-size:7px}.cin-module-list svg{width:15px;flex-shrink:0}.cin-module-detail{position:relative;top:0}.cin-module-art{height:240px}.cin-art-core{top:76px}.cin-art-orbit{top:10px}.cin-detail-copy h3{font-size:32px}.cin-detail-copy li{font-size:12px}.cin-metrics{padding:50px 0}.cin-metric-grid{grid-template-columns:1fr 1fr;gap:32px 20px;margin-top:30px}.cin-metric-grid>div:nth-child(2){border:0}.cin-metric-grid strong{font-size:44px}.cin-metric-grid span{font-size:11px}.cin-metric-grid small{font-size:9px}.cin-quotes{padding:70px 0}.cin-quote-grid{grid-template-columns:1fr;gap:40px;margin-top:35px}.cin-quote blockquote{min-height:0;font-size:18px}.cin-quote>div{margin-top:20px}.cin-roles{padding:65px 0}.cin-role-grid{margin-top:35px;gap:16px}.cin-role{display:block;padding:25px}.cin-role-object{height:210px}.cin-role>strong{font-size:28px}.cin-role-action{margin-top:25px}.cin-pricing{padding:65px 0}.cin-pricing>p{font-size:13px;margin-top:25px}.cin-price-grid{grid-template-columns:1fr;margin-top:30px}.cin-price-grid>div{padding:27px}.cin-price-grid>div+div{border-left:0;border-top:1px solid var(--line)}.cin-price-grid h3{font-size:35px}.cin-outro{margin:0 10px;padding:40px 22px 25px;border-radius:17px}.cin-outro>span{font-size:7px}.cin-outro>button{font-size:clamp(55px,14vw,84px);margin:40px 0 50px}.cin-outro>button>svg{width:17%;bottom:-22px}.cin-outro>div>span{font-size:6px;letter-spacing:.5px;max-width:150px;line-height:1.6}.cin-outro>div>.cin-pill{font-size:8px;gap:12px;min-height:38px;padding:0 14px}.cin-footer{padding:35px 20px;gap:25px}.cin-footer nav{gap:20px;order:3;width:100%;font-size:10px}.cin-footer>span{font-size:8px}}
@media(prefers-reduced-motion:reduce){.cin-story{height:auto}.cin-story-sticky{position:relative;height:auto;min-height:0;padding-block:75px}.cin-stage .co-sculpture,.cin-stage-title,.cin-product-stage{transform:none!important}.cin-page *{animation:none!important;transition:none!important}}
.cin-paused *{animation-play-state:paused!important}.cin-paused .cin-story{height:auto}.cin-paused .cin-story-sticky{position:relative;height:auto;min-height:0;padding-block:75px}
.cin-page .cin-pill{font-size:10px;font-weight:700}.cin-restricted{display:flex;align-items:center;gap:8px}

/* Larger product canvas and descriptive pricing. */
.cin-story-sticky{width:calc(100% - 80px);padding-block:42px;min-height:810px}
.cin-story-grid{grid-template-columns:minmax(240px,.7fr) minmax(0,1.65fr);gap:4%;margin-top:36px}
.cin-story-copy h2{font-size:clamp(34px,3.3vw,52px);line-height:1.08}.cin-story-copy p{font-size:14px;line-height:1.75}
.cin-chapter-number{font-size:44px}.cin-chapter-buttons{display:grid;grid-template-columns:1fr 1fr;gap:8px 18px;margin-top:30px}.cin-chapter-buttons>button{font-size:11px;text-align:left;justify-content:flex-start;padding:13px 0}
.cin-product-stage{min-width:0;width:100%}.cin-product-stage .co-preview{min-height:580px;border-radius:16px;box-shadow:0 30px 90px #050A2030,0 0 0 7px #718BD608}
.cin-product-stage .co-browser{height:48px;font-size:11px;padding-inline:22px}.cin-product-stage .co-sample{font-size:8px}.cin-product-stage .co-preview-shell{min-height:530px}.cin-product-stage .co-preview-content{padding:32px;flex:1;min-width:0}
.cin-product-stage .co-mini-rail{width:62px;padding:22px 10px;flex-shrink:0}.cin-product-stage .co-mini-rail>div{width:39px;height:42px;margin-bottom:12px}.cin-product-stage .co-preview-heading h3{font-size:27px}.cin-product-stage .co-preview-heading p{font-size:12px;margin-top:8px}.cin-product-stage .co-eyebrow{font-size:9px}.cin-product-stage .co-profile-banner{padding:21px;margin-top:25px}.cin-product-stage .co-profile-banner strong{font-size:17px}.cin-product-stage .co-field-label{font-size:9px}.cin-product-stage .co-skill-chips>span{font-size:11px;padding:7px 10px}.cin-product-stage .co-insight{padding:15px;gap:11px}.cin-product-stage .co-insight p{font-size:11px;line-height:1.6}.cin-product-stage .co-step{padding:19px 15px}.cin-product-stage .co-step strong{font-size:13px}.cin-product-stage .co-step small{font-size:10px}.cin-product-stage .co-wave{height:135px}.cin-product-stage .co-question p{font-size:19px;line-height:1.5}.cin-product-stage .co-fit{font-size:13px;padding-block:16px}.cin-preview-caption{font-size:8px;margin-top:20px}
.cin-evidence-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:20px}.cin-evidence-grid>div{padding:17px;background:#171E3220;border:1px solid #B9CCFF16;border-radius:10px}.cin-evidence-grid strong{display:block;font-size:13px;line-height:1.5;margin:9px 0 12px;color:#DCE5FE}.cin-evidence-grid p{display:flex;align-items:center;gap:7px;font-size:10px;line-height:1.7;color:#9EADCB;margin-top:7px}.cin-evidence-grid svg{flex-shrink:0;color:#81A1FF}.cin-evidence-tag{display:inline-block;font:7px ui-monospace,monospace;color:#93B2FF;border:1px solid #4F7CFF30;padding:6px 8px;border-radius:4px;margin-top:13px}
.cin-price-expanded{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;border:0;border-radius:0;overflow:visible;align-items:stretch}.cin-price-expanded>div,.cin-price-expanded>div+div{border:1px solid var(--line);border-radius:18px;padding:29px;background:var(--paper);display:flex;flex-direction:column;min-width:0}.cin-price-expanded>.cin-price-student{background:var(--wash);border-color:#4F7CFF66;box-shadow:inset 0 3px 0 #4F7CFF}.cin-plan-label{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:26px}.cin-plan-label>span{font-size:9px;font-weight:600}.cin-plan-label .cin-plan-badge{font-size:7px;color:#4F7CFF;letter-spacing:.4px;background:#4F7CFF12;padding:7px 8px;border-radius:5px}.cin-price-expanded h3{font-size:clamp(29px,2.7vw,42px);line-height:1.05;min-height:90px;margin-top:28px}.cin-price-expanded .cin-plan-summary{font-size:13px;line-height:1.75;min-height:92px;margin-top:12px}.cin-price-expanded .cin-pill{width:100%;gap:12px;padding-inline:12px;min-height:48px;margin-top:24px;font-size:9px}.cin-plan-divider{height:1px;background:var(--line);margin:30px 0 24px}.cin-price-expanded h4{font-size:13px;font-weight:600;margin:0 0 19px}.cin-price-expanded ul{list-style:none;margin:0;padding:0;flex:1}.cin-price-expanded li{display:flex;gap:10px;align-items:start;margin:0 0 17px}.cin-price-expanded li>svg{flex-shrink:0;color:#4F7CFF;margin-top:2px}.cin-price-expanded li>span{font-size:12px;letter-spacing:0;line-height:1.6;color:var(--muted)}.cin-price-expanded .cin-plan-outcome{font-size:11px;line-height:1.7;margin-top:20px;padding-top:20px;border-top:1px solid var(--line)}
.cin-pricing-note{display:flex;align-items:start;gap:14px;margin-top:27px;padding:22px 25px;border-radius:12px;background:var(--wash)}.cin-pricing-note>svg{color:#4F7CFF;flex-shrink:0;margin-top:2px}.cin-pricing-note p{font-size:12px;line-height:1.8;color:var(--muted)}.cin-pricing-note strong{color:var(--ink);margin-right:5px}.cin-pricing-faq{display:grid;grid-template-columns:1fr 1.6fr;gap:8%;padding-top:80px}.cin-pricing-faq h3{font-size:38px;line-height:1.1;margin-top:22px}.cin-pricing-faq details{border-bottom:1px solid var(--line)}.cin-pricing-faq summary{cursor:pointer;list-style:none;display:flex;gap:22px;align-items:center;justify-content:space-between;font-size:15px;line-height:1.5;padding:23px 0}.cin-pricing-faq summary::-webkit-details-marker{display:none}.cin-pricing-faq summary>span{font-size:23px;transition:transform .2s}.cin-pricing-faq details[open] summary>span{transform:rotate(45deg)}.cin-pricing-faq details p{font-size:13px;line-height:1.8;color:var(--muted);padding:0 30px 23px 0}
@media(max-width:1100px){.cin-story-sticky{width:calc(100% - 48px)}.cin-story-grid{grid-template-columns:minmax(220px,.65fr) minmax(0,1.35fr);gap:25px}.cin-product-stage .co-preview-content{padding:24px}.cin-evidence-grid{grid-template-columns:1fr}.cin-price-expanded{gap:12px}.cin-price-expanded>div,.cin-price-expanded>div+div{padding:23px}.cin-plan-label .cin-plan-badge{display:none}.cin-price-expanded h3{font-size:31px}.cin-price-expanded .cin-plan-summary{min-height:112px}}
@media(max-width:899px){.cin-story-grid{grid-template-columns:1fr}.cin-story-sticky{min-height:0}.cin-story-copy{max-width:650px}.cin-chapter-buttons{display:flex;gap:25px;margin-top:20px}.cin-product-stage{width:100%;max-width:none}.cin-product-stage .co-preview{min-height:560px}.cin-evidence-grid{grid-template-columns:1fr 1fr}.cin-price-expanded{grid-template-columns:1fr}.cin-price-expanded h3{min-height:0;font-size:38px}.cin-price-expanded .cin-plan-summary{min-height:0;max-width:500px}.cin-price-expanded .cin-pill{width:max-content;padding-inline:22px}.cin-pricing-faq{grid-template-columns:1fr;gap:25px;padding-top:55px}}
@media(max-width:600px){.cin-story-sticky{width:calc(100% - 28px);padding-block:50px}.cin-story-copy{padding-inline:6px}.cin-story-copy h2{font-size:35px}.cin-story-grid{gap:30px;margin-top:27px}.cin-chapter-buttons{gap:16px;flex-wrap:wrap}.cin-chapter-buttons>button{font-size:9px}.cin-product-stage .co-browser{height:42px;font-size:8px;padding-inline:12px}.cin-product-stage .co-sample{font-size:6px}.cin-product-stage .co-preview-content{padding:22px 14px}.cin-product-stage .co-mini-rail{width:40px;padding:17px 5px}.cin-product-stage .co-mini-rail>div{width:29px;height:35px}.cin-product-stage .co-preview-heading h3{font-size:22px}.cin-product-stage .co-preview-heading p{font-size:10px}.cin-product-stage .co-profile-banner{padding:14px;gap:8px}.cin-product-stage .co-profile-banner strong{font-size:14px}.cin-product-stage .co-profile-banner>svg{width:18px}.cin-product-stage .co-field-label{font-size:8px}.cin-product-stage .co-skill-chips>span{font-size:9px;padding:6px 8px}.cin-evidence-grid{grid-template-columns:1fr;gap:10px}.cin-evidence-grid>div{padding:14px}.cin-product-stage .co-preview{min-height:540px}.cin-product-stage .co-preview-shell{min-height:490px}.cin-product-stage .co-step strong{font-size:10px}.cin-product-stage .co-step small{font-size:8px}.cin-product-stage .co-step{padding:16px 10px}.cin-preview-caption{font-size:6px;letter-spacing:.6px}.cin-price-expanded>div,.cin-price-expanded>div+div{padding:26px}.cin-price-expanded h3{font-size:38px}.cin-price-expanded .cin-plan-summary{font-size:13px}.cin-price-expanded .cin-pill{width:100%;font-size:9px}.cin-price-expanded li>span{font-size:13px}.cin-pricing-note{padding:19px;gap:10px}.cin-pricing-note p{font-size:11px}.cin-pricing-faq h3{font-size:34px}.cin-pricing-faq summary{font-size:14px}.cin-pricing-faq details p{font-size:12px}}
@media(min-width:900px) and (max-height:580px){.cin-story{height:auto}.cin-story-sticky{position:relative;height:auto;min-height:0;padding-block:55px}.cin-story-grid{transform:none!important}.cin-chapter-progress{display:none}}
`
