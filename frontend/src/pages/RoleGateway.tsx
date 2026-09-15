import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import {
  GraduationCap,
  Building2,
  Users,
  ShieldCheck,
  Check,
  Sparkles,
  FileText,
  Zap,
  Map,
  Mic2,
  Briefcase,
  TrendingUp,
  MessageCircle,
  ArrowRight,
  ChevronRight,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import type { Theme } from "../context/ThemeContext"

type PricingTab = "student" | "college" | "recruiter"
type ModalType = "login" | "signup" | null

interface Tok {
  bg: string
  surface: string
  surfaceAlt: string
  border: string
  text: string
  textSub: string
  textMuted: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const A = {
  blue: "#4F7CFF",
  violet: "#8B7CFF",
  cyan: "#06B6D4",
  green: "#22A06B",
}

const FEATURES = [
  {
    icon: Sparkles,
    label: "Career Twin",
    desc: "Understand readiness and future career trajectory.",
  },
  {
    icon: MessageCircle,
    label: "ARIA Mentor",
    desc: "Personalized AI guidance based on your goals.",
  },
  {
    icon: FileText,
    label: "Resume Intelligence",
    desc: "Analyze ATS score, skills, and improvements.",
  },
  {
    icon: Zap,
    label: "Skill Gap Intelligence",
    desc: "Identify exactly what your target role requires.",
  },
  {
    icon: Map,
    label: "Adaptive Roadmap",
    desc: "Convert skill gaps into structured learning actions.",
  },
  {
    icon: Mic2,
    label: "ECHO",
    desc: "Practice interviews with real-time AI feedback.",
  },
  {
    icon: Briefcase,
    label: "Smart Job Matching",
    desc: "Find opportunities aligned with your live profile.",
  },
  {
    icon: TrendingUp,
    label: "Progress Intelligence",
    desc: "Track every improvement across your journey.",
  },
]

const ROLES = [
  {
    id: "student",
    icon: GraduationCap,
    label: "Student",
    headline: "Build your career with AI.",
    loginDesc: "Continue your career journey.",
    signupDesc: "Build your career with AI.",
    features: [
      "Career Twin",
      "ARIA Mentor",
      "Resume Intelligence",
      "Skill Gaps",
      "Roadmap",
      "ECHO",
      "Jobs",
    ],
    cta: "Continue as Student",
    route: "/auth/student",
    accent: A.blue,
    accentBg: "#EEF3FF",
  },
  {
    id: "college",
    icon: Building2,
    label: "College",
    headline: "Turn student progress into placement intelligence.",
    loginDesc: "Access placement intelligence.",
    signupDesc: "Turn student progress into placement intelligence.",
    features: [
      "Placement Readiness",
      "Student Monitoring",
      "Skill Analytics",
      "Department Insights",
      "At-Risk Students",
      "Recruiter Engagement",
    ],
    cta: "Continue as College",
    route: "/auth/college",
    accent: A.green,
    accentBg: "#E3F9EE",
  },
  {
    id: "recruiter",
    icon: Users,
    label: "Recruiter",
    headline: "Discover job-ready talent faster.",
    loginDesc: "Return to your talent workspace.",
    signupDesc: "Discover job-ready talent faster.",
    features: [
      "AI Talent Search",
      "Candidate Match Score",
      "Candidate Ranking",
      "Talent Pipeline",
      "Hiring Analytics",
      "Candidate Intelligence",
    ],
    cta: "Continue as Recruiter",
    route: "/auth/recruiter",
    accent: A.violet,
    accentBg: "#F0EFFE",
  },
  {
    id: "admin",
    icon: ShieldCheck,
    label: "Admin",
    headline: "Manage the CareerOS ecosystem.",
    loginDesc: "Manage the CareerOS platform.",
    signupDesc: "Admin accounts are provisioned internally.",
    features: [
      "User Management",
      "Institution Management",
      "Recruiter Management",
      "Platform Analytics",
      "System Monitoring",
      "Access Control",
    ],
    cta: "Admin Login",
    route: "/auth/admin",
    accent: "#344054",
    accentBg: "#F4F6F8",
    isAdmin: true,
  },
]

// ── Hero Visual SVG ────────────────────────────────────────────────────────

function HeroVisual({ isDark }: { isDark: boolean }) {
  const lineColor = isDark ? "#2A2D3A" : "#E0E4EF"
  const labelBg = isDark ? "#1E2130" : "#FFFFFF"
  const labelBorder = isDark ? "#2A2D3A" : "#E4E7EC"
  const labelText = isDark ? "#9199B2" : "#475467"
  const nodeBg = isDark ? "#1A1D28" : "#FFFFFF"
  const labels = [
    { text: "Career Twin", cx: 46, cy: 58, w: 82 },
    { text: "ARIA Mentor", cx: 14, cy: 108, w: 86 },
    { text: "Resume", cx: 20, cy: 185, w: 66 },
    { text: "Skills", cx: 85, cy: 224, w: 56 },
    { text: "Roadmap", cx: 168, cy: 218, w: 72 },
    { text: "ECHO", cx: 172, cy: 76, w: 54 },
    { text: "Jobs", cx: 148, cy: 46, w: 48 },
  ]

  return (
    <svg
      viewBox="0 0 560 280"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[560px] h-auto"
    >
      {/* Connecting lines */}
      <line
        x1="244"
        y1="140"
        x2="118"
        y2="140"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="300"
        y1="121"
        x2="432"
        y2="74"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="300"
        y1="159"
        x2="432"
        y2="208"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      {labels.map((l) => (
        <line
          key={l.text}
          x1="90"
          y1="140"
          x2={l.cx}
          y2={l.cy}
          stroke={lineColor}
          strokeWidth="0.75"
          opacity="0.6"
        />
      ))}
      {/* Feature labels */}
      {labels.map((l) => (
        <g key={l.text}>
          <rect
            x={l.cx - l.w / 2}
            y={l.cy - 11}
            width={l.w}
            height={22}
            rx="11"
            fill={labelBg}
            stroke={labelBorder}
            strokeWidth="1"
          />
          <text
            x={l.cx}
            y={l.cy + 4}
            textAnchor="middle"
            fontSize="10.5"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="500"
            fill={labelText}
          >
            {l.text}
          </text>
        </g>
      ))}
      {/* Student node */}
      <circle
        cx="90"
        cy="140"
        r="28"
        fill={nodeBg}
        stroke={A.blue}
        strokeWidth="1.5"
      />
      <text
        x="90"
        y="137"
        textAnchor="middle"
        fontSize="9"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="600"
        fill={A.blue}
      >
        Student
      </text>
      <text
        x="90"
        y="150"
        textAnchor="middle"
        fontSize="7.5"
        fontFamily="Inter, system-ui, sans-serif"
        fill={labelText}
      >
        Profile
      </text>
      {/* College node */}
      <circle
        cx="450"
        cy="68"
        r="22"
        fill={nodeBg}
        stroke={A.green}
        strokeWidth="1.5"
      />
      <text
        x="450"
        y="65"
        textAnchor="middle"
        fontSize="8.5"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="600"
        fill={A.green}
      >
        College
      </text>
      <text
        x="450"
        y="77"
        textAnchor="middle"
        fontSize="7"
        fontFamily="Inter, system-ui, sans-serif"
        fill={labelText}
      >
        Institution
      </text>
      {/* Recruiter node */}
      <circle
        cx="450"
        cy="212"
        r="22"
        fill={nodeBg}
        stroke={A.violet}
        strokeWidth="1.5"
      />
      <text
        x="450"
        y="209"
        textAnchor="middle"
        fontSize="8.5"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="600"
        fill={A.violet}
      >
        Recruiter
      </text>
      <text
        x="450"
        y="221"
        textAnchor="middle"
        fontSize="7"
        fontFamily="Inter, system-ui, sans-serif"
        fill={labelText}
      >
        Company
      </text>
      {/* AI Core — floating group */}
      <defs>
        <radialGradient id="coreGrad" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#6E8FFF" />
          <stop offset="100%" stopColor="#7B6CEF" />
        </radialGradient>
      </defs>
      <g
        style={{
          animation: "float 5s ease-in-out infinite",
          transformOrigin: "280px 140px",
        }}
      >
        <circle
          cx="280"
          cy="140"
          r="48"
          fill="none"
          stroke={A.blue}
          strokeWidth="1"
          opacity="0.15"
          className="ai-pulse"
        />
        <circle cx="280" cy="140" r="38" fill="url(#coreGrad)" />
        <text
          x="280"
          y="135"
          textAnchor="middle"
          fontSize="9"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="700"
          fill="#FFFFFF"
          opacity="0.9"
        >
          CareerOS
        </text>
        <text
          x="280"
          y="149"
          textAnchor="middle"
          fontSize="9.5"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="700"
          fill="#FFFFFF"
        >
          AI Core
        </text>
      </g>
    </svg>
  )
}

// ── Ecosystem SVG ──────────────────────────────────────────────────────────

function EcosystemVisual({ isDark }: { isDark: boolean }) {
  const nodeBg = isDark ? "#1A1D28" : "#FFFFFF"

  return (
    <svg
      viewBox="0 0 480 310"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[420px] h-auto mx-auto"
    >
      <defs>
        <linearGradient id="ecBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={A.blue} />
          <stop offset="100%" stopColor={A.violet} />
        </linearGradient>
        <marker
          id="arrowBlue"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={A.blue} opacity="0.5" />
        </marker>
        <marker
          id="arrowGreen"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={A.green} opacity="0.5" />
        </marker>
        <marker
          id="arrowViolet"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={A.violet} opacity="0.5" />
        </marker>
      </defs>
      <line
        x1="108"
        y1="248"
        x2="216"
        y2="185"
        stroke={A.blue}
        strokeWidth="1.5"
        strokeDasharray="6 4"
        opacity="0.4"
        markerEnd="url(#arrowBlue)"
        className="eco-line"
        style={{ animationDuration: "2.4s" }}
      />
      <line
        x1="240"
        y1="66"
        x2="240"
        y2="152"
        stroke={A.green}
        strokeWidth="1.5"
        strokeDasharray="6 4"
        opacity="0.4"
        markerEnd="url(#arrowGreen)"
        className="eco-line"
        style={{ animationDuration: "2.8s" }}
      />
      <line
        x1="372"
        y1="248"
        x2="264"
        y2="185"
        stroke={A.violet}
        strokeWidth="1.5"
        strokeDasharray="6 4"
        opacity="0.4"
        markerEnd="url(#arrowViolet)"
        className="eco-line"
        style={{ animationDuration: "2s" }}
      />
      <line
        x1="216"
        y1="172"
        x2="108"
        y2="255"
        stroke={A.blue}
        strokeWidth="1"
        strokeDasharray="4 6"
        opacity="0.2"
        className="eco-line-rev"
        style={{ animationDuration: "3.2s" }}
      />
      <line
        x1="240"
        y1="152"
        x2="240"
        y2="74"
        stroke={A.green}
        strokeWidth="1"
        strokeDasharray="4 6"
        opacity="0.2"
        className="eco-line-rev"
        style={{ animationDuration: "3.6s" }}
      />
      <line
        x1="264"
        y1="172"
        x2="372"
        y2="255"
        stroke={A.violet}
        strokeWidth="1"
        strokeDasharray="4 6"
        opacity="0.2"
        className="eco-line-rev"
        style={{ animationDuration: "2.8s" }}
      />
      <circle
        cx="90"
        cy="262"
        r="32"
        fill={nodeBg}
        stroke={A.blue}
        strokeWidth="1.5"
      />
      <text
        x="90"
        y="258"
        textAnchor="middle"
        fontSize="9"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fill={A.blue}
      >
        STUDENTS
      </text>
      <text
        x="90"
        y="271"
        textAnchor="middle"
        fontSize="7.5"
        fontFamily="Inter, system-ui, sans-serif"
        fill={isDark ? "#555E77" : "#98A2B3"}
      >
        Learn • Build
      </text>
      <circle
        cx="240"
        cy="48"
        r="32"
        fill={nodeBg}
        stroke={A.green}
        strokeWidth="1.5"
      />
      <text
        x="240"
        y="44"
        textAnchor="middle"
        fontSize="9"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fill={A.green}
      >
        COLLEGES
      </text>
      <text
        x="240"
        y="57"
        textAnchor="middle"
        fontSize="7.5"
        fontFamily="Inter, system-ui, sans-serif"
        fill={isDark ? "#555E77" : "#98A2B3"}
      >
        Monitor • Support
      </text>
      <circle
        cx="390"
        cy="262"
        r="32"
        fill={nodeBg}
        stroke={A.violet}
        strokeWidth="1.5"
      />
      <text
        x="390"
        y="258"
        textAnchor="middle"
        fontSize="9"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fill={A.violet}
      >
        RECRUITERS
      </text>
      <text
        x="390"
        y="271"
        textAnchor="middle"
        fontSize="7.5"
        fontFamily="Inter, system-ui, sans-serif"
        fill={isDark ? "#555E77" : "#98A2B3"}
      >
        Discover • Hire
      </text>
      <circle
        cx="240"
        cy="168"
        r="42"
        fill="url(#ecBlue)"
        opacity="0.12"
        className="ai-pulse"
        style={{ animationDuration: "4s" }}
      />
      <circle cx="240" cy="168" r="34" fill="url(#ecBlue)" />
      <text
        x="240"
        y="163"
        textAnchor="middle"
        fontSize="8.5"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fill="#FFFFFF"
        opacity="0.85"
      >
        CareerOS
      </text>
      <text
        x="240"
        y="177"
        textAnchor="middle"
        fontSize="8.5"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fill="#FFFFFF"
      >
        AI
      </text>
    </svg>
  )
}

// ── Role Modal ─────────────────────────────────────────────────────────────

function RoleModal({
  type,
  tok,
  isDark,
  onClose,
  onSelect,
}: {
  type: ModalType
  tok: Tok
  isDark: boolean
  onClose: () => void
  onSelect: (roleId: string) => void
}) {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null)
  const [adminMsg, setAdminMsg] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  if (!type) return null

  const isLogin = type === "login"
  const heading = isLogin ? "Welcome back" : "How will you use CareerOS?"
  const subheading = isLogin
    ? "Choose how you use CareerOS."
    : "Select your role to get started."

  const modalBg = isDark ? "#1A1D28" : "#FFFFFF"
  const backdropBg = isDark ? "rgba(0,0,0,0.7)" : "rgba(15,17,23,0.5)"

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: backdropBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backdropFilter: "blur(4px)",
        animation: "backdropIn 200ms ease both",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: modalBg,
          border: `1px solid ${tok.border}`,
          borderRadius: 24,
          padding: "36px 36px 32px",
          maxWidth: 800,
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          animation: "modalIn 220ms cubic-bezier(0.16,1,0.3,1) both",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: tok.surfaceAlt,
            border: `1px solid ${tok.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 150ms",
          }}
        >
          <X size={14} color={tok.textMuted} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontFamily: "Manrope, Inter, sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: tok.text,
              marginBottom: 4,
            }}
          >
            {heading}
          </h2>
          <p style={{ fontSize: 14, color: tok.textSub }}>{subheading}</p>
        </div>

        {/* Admin message */}
        {adminMsg && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 12,
              background: isDark ? "#1E2130" : "#F8F9FC",
              border: `1px solid ${tok.border}`,
            }}
          >
            <p style={{ fontSize: 13, color: tok.textSub, marginBottom: 8 }}>
              Admin accounts are provisioned internally. Please use the admin
              login instead.
            </p>
            <button
              onClick={() => {
                setAdminMsg(false)
                onSelect("admin-login")
              }}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: A.blue,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Go to Admin Login →
            </button>
          </div>
        )}

        {/* Role cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {ROLES.map((role) => {
            const Icon = role.icon
            const isHovered = hoveredRole === role.id
            const desc = isLogin ? role.loginDesc : role.signupDesc

            return (
              <button
                key={role.id}
                onMouseEnter={() => setHoveredRole(role.id)}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => {
                  if (role.isAdmin && !isLogin) {
                    setAdminMsg(true)
                  } else {
                    onSelect(role.id)
                  }
                }}
                style={{
                  background: isHovered
                    ? isDark
                      ? "#222838"
                      : role.accentBg
                    : isDark
                      ? "#141720"
                      : tok.surfaceAlt,
                  border: `1.5px solid ${isHovered ? role.accent : tok.border}`,
                  borderRadius: 16,
                  padding: "20px 16px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 200ms cubic-bezier(0.16,1,0.3,1)",
                  transform: isHovered ? "translateY(-5px)" : "translateY(0)",
                  boxShadow: isHovered
                    ? `0 8px 28px ${role.accent}22`
                    : "0 2px 8px rgba(0,0,0,0.04)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    marginBottom: 12,
                    background: isHovered
                      ? `${role.accent}18`
                      : isDark
                        ? "#222838"
                        : "#FFFFFF",
                    border: `1px solid ${
                      isHovered ? `${role.accent}30` : tok.border
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 200ms",
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <Icon
                    size={18}
                    color={isHovered ? role.accent : tok.textSub}
                    strokeWidth={1.6}
                  />
                </div>

                <p
                  style={{
                    fontFamily: "Manrope, Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    color: tok.text,
                    marginBottom: 4,
                  }}
                >
                  {role.label}
                </p>
                <p
                  style={{ fontSize: 12, color: tok.textSub, lineHeight: 1.4 }}
                >
                  {desc}
                </p>

                {/* Arrow on hover */}
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 14,
                      right: 14,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: role.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: "arrowIn 180ms ease both",
                    }}
                  >
                    <ArrowRight size={11} color="#fff" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function RoleGateway() {
  const navigate = useNavigate()
  const { theme, isDark, setTheme } = useTheme()
  const [pricingTab, setPricingTab] = useState<PricingTab>("student")
  const [modalType, setModalType] = useState<ModalType>(null)
  const [scrolled, setScrolled] = useState(false)

  const tok: Tok = isDark
    ? {
        bg: "#0F1117",
        surface: "#1A1D28",
        surfaceAlt: "#141720",
        border: "#272B3A",
        text: "#F0F2FA",
        textSub: "#9199B2",
        textMuted: "#555E77",
      }
    : {
        bg: "#F8F9FC",
        surface: "#FFFFFF",
        surfaceAlt: "#F4F6F8",
        border: "#E4E7EC",
        text: "#101828",
        textSub: "#475467",
        textMuted: "#98A2B3",
      }

  const scrollTo = useCallback(
    (id: string) =>
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
    [],
  )

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function handleRoleSelect(roleId: string) {
    setModalType(null)
    const mode = modalType === "login" ? "login" : "signup"
    if (roleId === "admin-login") {
      navigate("/auth/admin?mode=login")
      return
    }
    const roleMap: Record<string, string> = {
      student: "/auth/student",
      college: "/auth/college",
      recruiter: "/auth/recruiter",
      admin: "/auth/admin",
    }
    navigate(`${roleMap[roleId]}?mode=${mode}`)
  }

  // ── Theme switcher icons ────────────────────────────────────────────────
  const themeOptions: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ]

  const headerBg = isDark
    ? scrolled
      ? "rgba(26,29,40,0.96)"
      : "rgba(26,29,40,0.8)"
    : scrolled
      ? "rgba(255,255,255,0.96)"
      : "rgba(248,249,252,0.85)"

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        background: tok.bg,
        color: tok.text,
        minHeight: "100vh",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes dash {
          from { stroke-dashoffset: 200; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes pulse-ring {
          0%,100% { opacity: 0.25; transform: scale(1); }
          50%     { opacity: 0.55; transform: scale(1.07); }
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes arrowIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        .fade-up   { animation: fadeUp 0.55s 0.05s ease both; }
        .fade-up-1 { animation: fadeUp 0.55s 0.15s ease both; }
        .fade-up-2 { animation: fadeUp 0.55s 0.25s ease both; }
        .fade-up-3 { animation: fadeUp 0.55s 0.38s ease both; }
        .fade-up-4 { animation: fadeUp 0.55s 0.50s ease both; }
        .eco-line     { animation: dash 2.4s linear infinite; }
        .eco-line-rev { animation: dash 3s linear infinite reverse; }
        .ai-pulse     { animation: pulse-ring 3.5s ease-in-out infinite; transform-origin: center; }
        .feature-card { transition: transform 220ms ease, box-shadow 220ms ease; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(0,0,0,0.09); }
        .role-card { transition: border-color 200ms, box-shadow 200ms, transform 200ms; }
        .role-card:hover { transform: translateY(-5px); }
        .pricing-tab { transition: background 160ms, color 160ms; }
        .hero-cta-btn { transition: transform 150ms, box-shadow 150ms, opacity 150ms; }
        .hero-cta-btn:hover { transform: translateY(-2px); }
        .hero-cta-btn:active { transform: scale(0.97); }
      `}</style>

      {/* Role Modal */}
      {modalType && (
        <RoleModal
          type={modalType}
          tok={tok}
          isDark={isDark}
          onClose={() => setModalType(null)}
          onSelect={handleRoleSelect}
        />
      )}

      {/* ── STICKY HEADER ─────────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: headerBg,
          borderBottom: `1px solid ${scrolled ? tok.border : "transparent"}`,
          backdropFilter: "blur(12px)",
          transition: "background 200ms, border-color 200ms, box-shadow 200ms",
          boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "linear-gradient(135deg, #4F7CFF, #8B7CFF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={14} color="#fff" />
            </div>
            <span
              style={{
                fontFamily: "Manrope, Inter, sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: tok.text,
                letterSpacing: "-0.02em",
              }}
            >
              CareerOS
            </span>
          </div>

          {/* Nav links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginLeft: 8,
              flex: 1,
            }}
          >
            {[
              { label: "How It Works", id: "how-it-works" },
              { label: "Features", id: "features" },
              { label: "Ecosystem", id: "ecosystem" },
              { label: "Pricing", id: "pricing" },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: tok.textSub,
                  transition: "color 150ms, background 150ms",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = tok.text
                  ;(e.currentTarget as HTMLButtonElement).style.background =
                    tok.surfaceAlt
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color =
                    tok.textSub
                  ;(e.currentTarget as HTMLButtonElement).style.background =
                    "transparent"
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right: theme switcher + auth buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {/* 3-way theme switcher */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: tok.surfaceAlt,
                border: `1px solid ${tok.border}`,
                borderRadius: 10,
                padding: "3px",
              }}
            >
              {themeOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  title={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 26,
                    borderRadius: 7,
                    background:
                      theme === value
                        ? isDark
                          ? "#272B3A"
                          : "#FFFFFF"
                        : "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 150ms",
                    boxShadow:
                      theme === value ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <Icon
                    size={12}
                    color={
                      theme === value
                        ? value === "dark"
                          ? "#F59E0B"
                          : A.blue
                        : tok.textMuted
                    }
                  />
                </button>
              ))}
            </div>

            {/* Login */}
            <button
              onClick={() => setModalType("login")}
              style={{
                background: "none",
                border: `1px solid ${tok.border}`,
                borderRadius: 10,
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: tok.text,
                cursor: "pointer",
                transition: "all 150ms",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  tok.surfaceAlt)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "transparent")
              }
            >
              Login
            </button>

            {/* Sign Up */}
            <button
              onClick={() => setModalType("signup")}
              style={{
                background: "linear-gradient(135deg, #4F7CFF, #8B7CFF)",
                border: "none",
                borderRadius: 10,
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                transition: "opacity 150ms",
                boxShadow: "0 2px 12px rgba(79,124,255,0.25)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
              }
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — HERO                                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        style={{ maxWidth: 1140, margin: "0 auto", padding: "88px 24px 80px" }}
      >
        <div className="text-center">
          <div
            className="fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold mb-6"
            style={{
              background: `${A.blue}12`,
              border: `1px solid ${A.blue}22`,
              color: A.blue,
            }}
          >
            <Sparkles size={12} />
            AI-Powered Career Intelligence
          </div>
          <h1
            className="fade-up-1 font-display font-bold leading-tight mb-5"
            style={{
              fontSize: "clamp(32px, 5vw, 58px)",
              color: tok.text,
              letterSpacing: "-0.02em",
            }}
          >
            Your Entire Career Journey.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #4F7CFF 0%, #8B7CFF 60%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              One Intelligent System.
            </span>
          </h1>
          <p
            className="fade-up-2 mx-auto mb-9 leading-relaxed"
            style={{ maxWidth: 560, fontSize: 17, color: tok.textSub }}
          >
            CareerOS brings career guidance, skill development, resume
            intelligence, interview preparation, placement insights, and hiring
            into one connected AI-powered ecosystem.
          </p>
          <div className="fade-up-3 flex flex-wrap items-center justify-center gap-3 mb-14">
            <button
              onClick={() => setModalType("signup")}
              className="hero-cta-btn flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[15px] text-white"
              style={{
                background: "linear-gradient(135deg, #4F7CFF, #8B7CFF)",
                boxShadow: `0 4px 20px ${A.blue}30`,
              }}
            >
              Get Started <ArrowRight size={15} />
            </button>
            <button
              onClick={() => scrollTo("features")}
              className="hero-cta-btn flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[15px]"
              style={{
                background: tok.surfaceAlt,
                border: `1px solid ${tok.border}`,
                color: tok.text,
              }}
            >
              Explore CareerOS <ChevronRight size={15} />
            </button>
          </div>
          <div
            className="fade-up-4 mx-auto rounded-2xl overflow-hidden p-8 md:p-10"
            style={{
              background: tok.surface,
              border: `1px solid ${tok.border}`,
              maxWidth: 600,
              boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
            }}
          >
            <HeroVisual isDark={isDark} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — FRAGMENTED vs CAREEROS                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        style={{
          background: tok.surfaceAlt,
          borderTop: `1px solid ${tok.border}`,
          borderBottom: `1px solid ${tok.border}`,
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <h2
            className="text-center font-display font-bold mb-3"
            style={{
              fontSize: "clamp(22px, 3.5vw, 36px)",
              color: tok.text,
              letterSpacing: "-0.02em",
            }}
          >
            Your Career Shouldn&apos;t Require Six Different Platforms.
          </h2>
          <p
            className="text-center mb-12"
            style={{ color: tok.textSub, fontSize: 16 }}
          >
            See how CareerOS replaces the scattered approach.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: tok.surface,
                border: `1px solid ${tok.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-[#E5484D]" />
                <span
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: tok.textMuted }}
                >
                  TODAY
                </span>
              </div>
              <p
                className="font-display font-semibold mb-1"
                style={{ fontSize: 17, color: tok.text }}
              >
                Fragmented Career Journey
              </p>
              <p className="text-[13px] mb-6" style={{ color: tok.textSub }}>
                Students switch between multiple disconnected tools with no
                shared context.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Networking",
                  "Learning Platforms",
                  "AI Guidance",
                  "Resume Tools",
                  "Interview Practice",
                  "Job Portals",
                ].map((t, i) => (
                  <span
                    key={t}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                    style={{
                      background: tok.surfaceAlt,
                      border: `1px solid ${tok.border}`,
                      color: tok.textSub,
                      transform: `rotate(${[-2, 1, -1, 2, -2, 1][i]}deg)`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-5 flex items-center gap-2 text-[12px]"
                style={{ color: "#E5484D" }}
              >
                <div className="h-px flex-1 bg-[#E5484D]/20" />
                <span className="font-semibold">
                  No shared context. No continuity.
                </span>
                <div className="h-px flex-1 bg-[#E5484D]/20" />
              </div>
            </div>
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${A.blue}10, ${A.violet}10)`
                  : `linear-gradient(135deg, ${A.blue}08, ${A.violet}08)`,
                border: `1px solid ${A.blue}22`,
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-[#22A06B]" />
                <span
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: A.blue }}
                >
                  CAREEROS
                </span>
              </div>
              <p
                className="font-display font-semibold mb-1"
                style={{ fontSize: 17, color: tok.text }}
              >
                One Connected Career System
              </p>
              <p className="text-[13px] mb-6" style={{ color: tok.textSub }}>
                CareerOS unifies the entire journey into one continuously
                evolving AI-powered experience.
              </p>
              <div className="space-y-2">
                {[
                  { step: "Understand", color: A.blue },
                  { step: "Learn", color: A.violet },
                  { step: "Prepare", color: A.cyan },
                  { step: "Practice", color: A.green },
                  { step: "Apply", color: A.blue },
                  { step: "Grow", color: A.violet },
                ].map((s, i) => (
                  <div key={s.step} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: s.color }}
                    >
                      {i + 1}
                    </div>
                    <div
                      className="flex-1 py-2 px-3 rounded-lg text-[13px] font-medium"
                      style={{ background: `${s.color}10`, color: s.color }}
                    >
                      {s.step}
                    </div>
                    {i < 5 && (
                      <ArrowRight size={12} style={{ color: tok.textMuted }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 3 — CORE FEATURES                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        id="features"
        style={{ maxWidth: 1080, margin: "0 auto", padding: "80px 24px" }}
      >
        <h2
          className="text-center font-display font-bold mb-3"
          style={{
            fontSize: "clamp(22px, 3.5vw, 34px)",
            color: tok.text,
            letterSpacing: "-0.02em",
          }}
        >
          Everything You Need to Become Career-Ready
        </h2>
        <p
          className="text-center mb-12"
          style={{ color: tok.textSub, fontSize: 16 }}
        >
          Eight AI-powered capabilities, one unified system.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.label}
                className="feature-card rounded-2xl p-5"
                style={{
                  background: tok.surface,
                  border: `1px solid ${tok.border}`,
                  cursor: "default",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: `${A.blue}10`,
                    border: `1px solid ${A.blue}18`,
                  }}
                >
                  <Icon size={16} style={{ color: A.blue }} strokeWidth={1.6} />
                </div>
                <p
                  className="font-display font-semibold text-[14px] mb-1"
                  style={{ color: tok.text }}
                >
                  {f.label}
                </p>
                <p
                  className="text-[12px] leading-relaxed"
                  style={{ color: tok.textSub }}
                >
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 4 — CLOSED-LOOP USP / ECOSYSTEM                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        id="ecosystem"
        style={{
          background: tok.surfaceAlt,
          borderTop: `1px solid ${tok.border}`,
          borderBottom: `1px solid ${tok.border}`,
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="text-center mb-2">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: `${A.violet}12`, color: A.violet }}
            >
              Closed-Loop Intelligence
            </span>
          </div>
          <h2
            className="text-center font-display font-bold mb-3"
            style={{
              fontSize: "clamp(22px, 3.5vw, 34px)",
              color: tok.text,
              letterSpacing: "-0.02em",
            }}
          >
            Career Growth Doesn&apos;t Happen in Isolation.
          </h2>
          <p
            className="text-center mb-14"
            style={{
              color: tok.textSub,
              fontSize: 16,
              maxWidth: 520,
              margin: "0 auto 56px",
            }}
          >
            CareerOS connects the three stakeholders that shape employment into
            one continuously learning ecosystem.
          </p>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <EcosystemVisual isDark={isDark} />
            <div className="space-y-5">
              {[
                {
                  icon: GraduationCap,
                  accent: A.blue,
                  label: "Students",
                  desc: "Get more relevant guidance and opportunities tailored to real market demand.",
                },
                {
                  icon: Building2,
                  accent: A.green,
                  label: "Colleges",
                  desc: "Gain real-time placement and employability intelligence across every department.",
                },
                {
                  icon: Users,
                  accent: A.violet,
                  label: "Recruiters",
                  desc: "Discover verified, job-ready talent faster with AI-driven match scoring.",
                },
              ].map(({ icon: Icon, accent, label, desc }) => (
                <div
                  key={label}
                  className="rounded-2xl p-5"
                  style={{
                    background: tok.surface,
                    border: `1px solid ${tok.border}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${accent}12` }}
                    >
                      <Icon size={15} style={{ color: accent }} />
                    </div>
                    <div>
                      <p
                        className="font-display font-semibold text-[14px] mb-0.5"
                        style={{ color: tok.text }}
                      >
                        {label}
                      </p>
                      <p className="text-[13px]" style={{ color: tok.textSub }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div
                className="rounded-2xl p-4 text-center"
                style={{
                  background: isDark
                    ? `linear-gradient(135deg, ${A.blue}15, ${A.violet}15)`
                    : `linear-gradient(135deg, ${A.blue}10, ${A.violet}10)`,
                  border: `1px solid ${A.blue}20`,
                }}
              >
                <p
                  className="font-display font-semibold text-[14px]"
                  style={{
                    background: "linear-gradient(135deg, #4F7CFF, #8B7CFF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  A Closed-Loop Career Intelligence Ecosystem
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 5 — ROLE SELECTION                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        id="roles"
        style={{ maxWidth: 1140, margin: "0 auto", padding: "80px 24px" }}
      >
        <h2
          className="text-center font-display font-bold mb-3"
          style={{
            fontSize: "clamp(22px, 3.5vw, 34px)",
            color: tok.text,
            letterSpacing: "-0.02em",
          }}
        >
          Choose How You&apos;ll Use CareerOS
        </h2>
        <p
          className="text-center mb-12"
          style={{ color: tok.textSub, fontSize: 16 }}
        >
          Each role has a tailored experience built for its specific needs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ROLES.map((role) => {
            const Icon = role.icon
            return (
              <div
                key={role.id}
                className="role-card rounded-2xl p-6 flex flex-col"
                style={{
                  background: tok.surface,
                  border: `1.5px solid ${tok.border}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.borderColor =
                    role.accent
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${role.accent}18`
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.borderColor =
                    tok.border
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 2px 12px rgba(0,0,0,0.04)"
                }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: role.accentBg }}
                  >
                    <Icon
                      size={17}
                      style={{ color: role.accent }}
                      strokeWidth={1.6}
                    />
                  </div>
                  <span
                    className="font-display font-bold text-[15px]"
                    style={{ color: tok.text }}
                  >
                    {role.label}
                  </span>
                </div>
                <p
                  className="text-[13px] leading-snug mb-5 font-medium"
                  style={{ color: tok.textSub }}
                >
                  {role.headline}
                </p>
                <div className="flex-1 space-y-1.5 mb-6">
                  {role.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-[12px]"
                      style={{ color: tok.textSub }}
                    >
                      <Check
                        size={11}
                        style={{ color: role.accent, flexShrink: 0 }}
                      />
                      {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(role.route)}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
                  style={
                    role.isAdmin
                      ? {
                          background: tok.surfaceAlt,
                          border: `1px solid ${tok.border}`,
                          color: tok.textSub,
                        }
                      : { background: role.accent, color: "#ffffff" }
                  }
                  onMouseEnter={(e) => {
                    if (!role.isAdmin)
                      (e.currentTarget as HTMLButtonElement).style.opacity =
                        "0.88"
                  }}
                  onMouseLeave={(e) => {
                    if (!role.isAdmin)
                      (e.currentTarget as HTMLButtonElement).style.opacity = "1"
                  }}
                >
                  {role.cta}
                  <ArrowRight size={13} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 6 — PRICING                                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        id="pricing"
        style={{
          background: tok.surfaceAlt,
          borderTop: `1px solid ${tok.border}`,
          borderBottom: `1px solid ${tok.border}`,
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2
            className="text-center font-display font-bold mb-3"
            style={{
              fontSize: "clamp(22px, 3.5vw, 34px)",
              color: tok.text,
              letterSpacing: "-0.02em",
            }}
          >
            Start Free. Upgrade When You Need More.
          </h2>
          <p
            className="text-center mb-10"
            style={{ color: tok.textSub, fontSize: 16 }}
          >
            Simple, role-aware pricing with no hidden fees.
          </p>
          <div className="flex justify-center mb-10">
            <div
              className="flex rounded-xl p-1 gap-0.5"
              style={{
                background: tok.surface,
                border: `1px solid ${tok.border}`,
              }}
            >
              {(["student", "college", "recruiter"] as PricingTab[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setPricingTab(t)}
                    className="pricing-tab px-5 py-2 rounded-lg text-[13px] font-semibold capitalize"
                    style={
                      pricingTab === t
                        ? { background: A.blue, color: "#fff" }
                        : { background: "transparent", color: tok.textSub }
                    }
                  >
                    {t}
                  </button>
                ),
              )}
            </div>
          </div>

          {pricingTab === "student" && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div
                className="rounded-2xl p-6"
                style={{
                  background: tok.surface,
                  border: `1px solid ${tok.border}`,
                  transition: "transform 200ms, box-shadow 200ms",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(-2px)"
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 6px 24px rgba(0,0,0,0.08)"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = ""
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = ""
                }}
              >
                <p
                  className="font-display font-bold text-[13px] uppercase tracking-widest mb-1"
                  style={{ color: tok.textMuted }}
                >
                  Free
                </p>
                <p
                  className="font-display font-bold text-[36px] mb-1"
                  style={{ color: tok.text }}
                >
                  ₹0
                </p>
                <p
                  className="text-[12px] mb-6"
                  style={{ color: tok.textMuted }}
                >
                  Forever free. No card required.
                </p>
                <div className="space-y-2 mb-8">
                  {[
                    "Career Dashboard",
                    "Basic Career Twin",
                    "Basic Skill Analysis",
                    "Limited ARIA usage",
                    "Job Discovery",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-[13px]"
                      style={{ color: tok.textSub }}
                    >
                      <Check size={12} style={{ color: A.blue }} /> {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/auth/student")}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{
                    background: tok.surfaceAlt,
                    border: `1px solid ${tok.border}`,
                    color: tok.text,
                  }}
                >
                  Start Free
                </button>
              </div>
              <div
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: tok.surface,
                  border: `2px solid ${A.blue}`,
                  transition: "transform 200ms, box-shadow 200ms",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(-2px)"
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${A.blue}22`
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = ""
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = ""
                }}
              >
                <div
                  className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${A.blue}, ${A.violet})`,
                  }}
                >
                  Most Popular
                </div>
                <p
                  className="font-display font-bold text-[13px] uppercase tracking-widest mb-1"
                  style={{ color: A.blue }}
                >
                  Pro
                </p>
                <div className="mb-1">
                  <span
                    className="font-display font-bold text-[36px]"
                    style={{ color: tok.text }}
                  >
                    ₹200
                  </span>
                  <span
                    className="text-[13px] ml-1"
                    style={{ color: tok.textMuted }}
                  >
                    /month
                  </span>
                </div>
                <p
                  className="text-[12px] mb-6"
                  style={{ color: tok.textMuted }}
                >
                  or ₹2,000/year · Save 17%
                </p>
                <div className="space-y-2 mb-8">
                  {[
                    "Advanced Career Twin",
                    "Unlimited ARIA",
                    "Deep Resume Intelligence",
                    "Full Skill Gap Analysis",
                    "Adaptive Roadmaps",
                    "ECHO Interview Sessions",
                    "Advanced Job Matching",
                    "Progress Analytics",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-[13px]"
                      style={{ color: tok.textSub }}
                    >
                      <Check size={12} style={{ color: A.blue }} /> {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() =>
                    navigate("/subscription?plan=student-pro&billing=annual")
                  }
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${A.blue}, ${A.violet})`,
                  }}
                >
                  Go Pro
                </button>
              </div>
            </div>
          )}

          {pricingTab === "college" && (
            <div className="max-w-lg">
              <div
                className="rounded-2xl p-6"
                style={{
                  background: tok.surface,
                  border: `2px solid ${A.green}`,
                  transition: "transform 200ms, box-shadow 200ms",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${A.green}22`
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = ""
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = ""
                }}
              >
                <p
                  className="font-display font-bold text-[13px] uppercase tracking-widest mb-1"
                  style={{ color: A.green }}
                >
                  Institution Plan
                </p>
                <div className="mb-1">
                  <span
                    className="font-display font-bold text-[36px]"
                    style={{ color: tok.text }}
                  >
                    ₹5,00,000
                  </span>
                  <span
                    className="text-[13px] ml-1"
                    style={{ color: tok.textMuted }}
                  >
                    /year
                  </span>
                </div>
                <p
                  className="text-[12px] mb-6"
                  style={{ color: tok.textMuted }}
                >
                  For up to 5,000 students. Billed annually per institution.
                </p>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-8">
                  {[
                    "Up to 5,000 student accounts",
                    "Placement Dashboard",
                    "Student Readiness Monitoring",
                    "Skill Gap Analytics",
                    "Department Analytics",
                    "Recruiter Engagement Insights",
                    "Multi-department Intelligence",
                    "Reports & Exports",
                    "Dedicated Account Manager",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-[13px]"
                      style={{ color: tok.textSub }}
                    >
                      <Check size={12} style={{ color: A.green }} /> {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() =>
                    navigate("/subscription?plan=college&billing=annual")
                  }
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white"
                  style={{ background: A.green }}
                >
                  Talk to Us
                </button>
              </div>
            </div>
          )}

          {pricingTab === "recruiter" && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div
                className="rounded-2xl p-6"
                style={{
                  background: tok.surface,
                  border: `1px solid ${tok.border}`,
                  transition: "transform 200ms",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.transform = "")
                }
              >
                <p
                  className="font-display font-bold text-[13px] uppercase tracking-widest mb-1"
                  style={{ color: tok.textMuted }}
                >
                  Starter
                </p>
                <div className="mb-1">
                  <span
                    className="font-display font-bold text-[36px]"
                    style={{ color: tok.text }}
                  >
                    ₹25,000
                  </span>
                  <span
                    className="text-[13px] ml-1"
                    style={{ color: tok.textMuted }}
                  >
                    /year
                  </span>
                </div>
                <p
                  className="text-[12px] mb-6"
                  style={{ color: tok.textMuted }}
                >
                  Per recruiter account. Billed annually.
                </p>
                <div className="space-y-2 mb-8">
                  {[
                    "AI Talent Search",
                    "Candidate Profiles",
                    "Match Scores",
                    "Shortlisting",
                    "Basic Hiring Analytics",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-[13px]"
                      style={{ color: tok.textSub }}
                    >
                      <Check size={12} style={{ color: A.violet }} /> {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() =>
                    navigate(
                      "/subscription?plan=recruiter-starter&billing=annual",
                    )
                  }
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{
                    background: tok.surfaceAlt,
                    border: `1px solid ${tok.border}`,
                    color: tok.text,
                  }}
                >
                  Talk to Us
                </button>
              </div>
              <div
                className="rounded-2xl p-6"
                style={{
                  background: tok.surface,
                  border: `2px solid ${A.violet}`,
                  transition: "transform 200ms",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.transform = "")
                }
              >
                <p
                  className="font-display font-bold text-[13px] uppercase tracking-widest mb-1"
                  style={{ color: A.violet }}
                >
                  Enterprise
                </p>
                <div className="mb-1">
                  <span
                    className="font-display font-bold text-[36px]"
                    style={{ color: tok.text }}
                  >
                    ₹1,50,000
                  </span>
                  <span
                    className="text-[13px] ml-1"
                    style={{ color: tok.textMuted }}
                  >
                    /year
                  </span>
                </div>
                <p
                  className="text-[12px] mb-6"
                  style={{ color: tok.textMuted }}
                >
                  Full platform access for talent teams. Billing period to be confirmed.
                </p>
                <div className="space-y-2 mb-8">
                  {[
                    "Everything in Starter",
                    "Advanced Talent Intelligence",
                    "Hiring Pipeline",
                    "Bulk Candidate Discovery",
                    "Advanced Analytics",
                    "Institutional Talent Access",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-[13px]"
                      style={{ color: tok.textSub }}
                    >
                      <Check size={12} style={{ color: A.violet }} /> {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() =>
                    navigate(
                      "/subscription?plan=recruiter-enterprise&billing=annual",
                    )
                  }
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white"
                  style={{ background: A.violet }}
                >
                  Talk to Us
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 7 — FINAL CTA                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "96px 24px",
          textAlign: "center",
        }}
      >
        <h2
          className="font-display font-bold mb-4"
          style={{
            fontSize: "clamp(26px, 4vw, 42px)",
            color: tok.text,
            letterSpacing: "-0.02em",
          }}
        >
          Ready to Build What&apos;s Next?
        </h2>
        <p className="mb-10 text-[16px]" style={{ color: tok.textSub }}>
          Choose your role and start using CareerOS.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setModalType("signup")}
            className="hero-cta-btn flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[15px] text-white"
            style={{
              background: "linear-gradient(135deg, #4F7CFF, #8B7CFF)",
              boxShadow: `0 4px 20px ${A.blue}30`,
            }}
          >
            Get Started <ArrowRight size={15} />
          </button>
          <button
            onClick={() => scrollTo("roles")}
            className="hero-cta-btn flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[15px]"
            style={{
              background: tok.surfaceAlt,
              border: `1px solid ${tok.border}`,
              color: tok.text,
            }}
          >
            Choose Your Role
          </button>
        </div>
        <p className="text-[13px]" style={{ color: tok.textMuted }}>
          Already have an account?{" "}
          <button
            onClick={() => setModalType("login")}
            className="font-semibold hover:underline"
            style={{
              color: A.blue,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </p>
      </section>

      {/* Footer */}
      <div
        style={{
          borderTop: `1px solid ${tok.border}`,
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p className="text-[12px]" style={{ color: tok.textMuted }}>
          © 2026 CareerOS. AI-powered career intelligence for students,
          colleges, and recruiters.
        </p>
      </div>
    </div>
  )
}
