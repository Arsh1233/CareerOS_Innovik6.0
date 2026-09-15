import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Outlet, NavLink, useLocation, Navigate, useNavigate } from "react-router";
import {
  LayoutDashboard, Sparkles, MessageCircle, FileText, Zap, Mic2, Briefcase,
  GraduationCap, Users, User, HelpCircle, Bell, Search, ChevronRight,
  Building2, BarChart2, TrendingUp, UserSearch, GitBranch,
  ShieldCheck, LogOut, Map, Target, Activity, FileBarChart, Sun, Moon,
  Settings, CreditCard, MessageSquare, Monitor, X, Check,
  CheckCheck, Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { notificationService, supportService, type Notification } from "../services/index";
import type { Theme } from "../context/ThemeContext";
import type { Role } from "../context/AuthContext";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  circular?: boolean;
}

// ── Per-role navs ─────────────────────────────────────────────────────────

const studentNav: NavItem[] = [
  { to: "/dashboard",   icon: LayoutDashboard, label: "HOME",     end: true },
  { to: "/career-twin", icon: Sparkles,        label: "CAREER TWIN"               },
  { to: "/mentor",      icon: MessageCircle,   label: "ARIA"             },
  { to: "/resume",      icon: FileText,        label: "RESUME"             },
  { to: "/skills",      icon: Zap,             label: "SKILLS"             },
  { to: "/roadmap",     icon: Map,             label: "ROADMAP"            },
  { to: "/echo",        icon: Mic2,            label: "ECHO AI"               },
  { to: "/jobs",        icon: Briefcase,       label: "JOBS"               },
  { to: "/progress",    icon: TrendingUp,      label: "PROGRESS", circular: true },
];

const collegeNav: NavItem[] = [
  { to: "/college",               icon: BarChart2,    label: "HOME",       end: true },
  { to: "/college/students",      icon: Users,        label: "STUDENTS"              },
  { to: "/college/readiness",     icon: TrendingUp,   label: "READINESS"             },
  { to: "/college/skills",        icon: Zap,          label: "SKILLS"                },
  { to: "/college/departments",   icon: Building2,    label: "DEPTS"                 },
  { to: "/college/recruiters",    icon: Briefcase,    label: "RECRUITERS"            },
  { to: "/college/reports",       icon: FileBarChart, label: "REPORTS"               },
  { to: "/college/progress",      icon: Activity,     label: "PROGRESS", circular: true },
];

const recruiterNav: NavItem[] = [
  { to: "/recruiter",              icon: LayoutDashboard, label: "HOME",       end: true },
  { to: "/recruiter/talent",       icon: UserSearch,      label: "TALENT"               },
  { to: "/recruiter/candidates",   icon: Users,           label: "CANDIDATES"           },
  { to: "/recruiter/matches",      icon: Target,          label: "MATCHES"              },
  { to: "/recruiter/pipeline",     icon: GitBranch,       label: "PIPELINE"             },
  { to: "/recruiter/jobs",         icon: Briefcase,       label: "JOBS"                 },
  { to: "/recruiter/analytics",    icon: BarChart2,       label: "ANALYTICS"            },
  { to: "/recruiter/progress",     icon: Activity,        label: "PROGRESS", circular: true },
];

const adminNav: NavItem[] = [
  { to: "/admin",            icon: LayoutDashboard, label: "HOME",       end: true },
  { to: "/admin/users",      icon: Users,           label: "USERS"                },
  { to: "/admin/colleges",   icon: GraduationCap,   label: "COLLEGES"             },
  { to: "/admin/recruiters", icon: Briefcase,       label: "RECRUITERS"           },
  { to: "/admin/analytics",  icon: BarChart2,       label: "ANALYTICS"            },
  { to: "/admin/ai-usage",   icon: Sparkles,        label: "AI USAGE"             },
  { to: "/admin/logs",       icon: FileText,        label: "LOGS"                 },
  { to: "/admin/control",    icon: ShieldCheck,     label: "CONTROL"              },
];

// ── Role config ───────────────────────────────────────────────────────────

interface RoleConfig {
  nav:          NavItem[];
  accent:       string;
  accentSoft:   string;
  aiLabel:      string;
  avatarGrad:   string;
  homeRoute:    string;
  allowedPaths: string[];
  progressPct:  number;
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  student: {
    nav: studentNav, accent: "#4F7CFF", accentSoft: "rgba(79,124,255,0.12)",
    aiLabel: "ARIA Active", avatarGrad: "from-[#4F7CFF] to-[#8B7CFF]",
    homeRoute: "/dashboard", progressPct: 78,
    allowedPaths: ["/dashboard", "/career-twin", "/mentor", "/resume", "/skills", "/roadmap", "/echo", "/interview", "/jobs", "/progress", "/profile"],
  },
  college: {
    nav: collegeNav, accent: "#6E72E8", accentSoft: "rgba(110,114,232,0.12)",
    aiLabel: "AI Analytics", avatarGrad: "from-[#6E72E8] to-[#8B7CFF]",
    homeRoute: "/college", progressPct: 83,
    allowedPaths: ["/college", "/profile"],
  },
  recruiter: {
    nav: recruiterNav, accent: "#8B7CFF", accentSoft: "rgba(139,124,255,0.12)",
    aiLabel: "AI Matching", avatarGrad: "from-[#8B7CFF] to-[#55C7F3]",
    homeRoute: "/recruiter", progressPct: 25,
    allowedPaths: ["/recruiter", "/profile"],
  },
  admin: {
    nav: adminNav, accent: "#344054", accentSoft: "rgba(52,64,84,0.12)",
    aiLabel: "System Active", avatarGrad: "from-[#344054] to-[#475467]",
    homeRoute: "/admin", progressPct: 99,
    allowedPaths: ["/admin", "/profile"],
  },
};

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":               "Home",
  "/career-twin":             "Career Twin",
  "/mentor":                  "ARIA Mentor",
  "/resume":                  "Resume Intelligence",
  "/skills":                  "Skill Gap",
  "/roadmap":                 "Career Roadmap",
  "/echo":                    "ECHO Interview",
  "/interview":               "ECHO Interview",
  "/jobs":                    "Job Matches",
  "/progress":                "Progress",
  "/college":                 "Overview",
  "/college/students":        "Students",
  "/college/readiness":       "Placement Readiness",
  "/college/skills":          "Skill Analytics",
  "/college/departments":     "Departments",
  "/college/recruiters":      "Recruiter Partners",
  "/college/reports":         "Reports",
  "/college/settings":        "Settings",
  "/college/progress":        "Progress",
  "/recruiter":               "Home",
  "/recruiter/talent":        "Talent Search",
  "/recruiter/candidates":    "Candidates",
  "/recruiter/matches":       "AI Matches",
  "/recruiter/jobs":          "Jobs / Roles",
  "/recruiter/pipeline":      "Hiring Pipeline",
  "/recruiter/analytics":     "Analytics",
  "/recruiter/progress":      "Progress",
  "/recruiter/settings":      "Settings",
  "/admin":                   "System Overview",
  "/admin/users":             "User Management",
  "/admin/colleges":          "College Management",
  "/admin/recruiters":        "Recruiter Management",
  "/admin/analytics":         "Platform Analytics",
  "/admin/ai-usage":          "AI Usage",
  "/admin/logs":              "Audit Logs",
  "/admin/control":           "Access Control",
  "/admin/settings":          "Settings",
  "/profile":                 "My Profile",
};

// ── Role-specific search suggestions ─────────────────────────────────────

const SEARCH_ITEMS: Record<Role, { label: string; sub: string; route: string }[]> = {
  student: [
    { label: "My Jobs", sub: "Job Matches", route: "/jobs" },
    { label: "Skill Gap", sub: "Skill intelligence", route: "/skills" },
    { label: "Career Roadmap", sub: "Your learning path", route: "/roadmap" },
    { label: "ARIA Mentor", sub: "Ask ARIA anything", route: "/mentor" },
    { label: "Resume Intelligence", sub: "Upload & analyse", route: "/resume" },
    { label: "ECHO Interview", sub: "Mock interview", route: "/echo" },
    { label: "Career Twin", sub: "AI career profile", route: "/career-twin" },
    { label: "Progress", sub: "Track your growth", route: "/progress" },
  ],
  college: [
    { label: "Students", sub: "Student management", route: "/college/students" },
    { label: "Departments", sub: "View departments", route: "/college/departments" },
    { label: "Recruiters", sub: "Partner recruiters", route: "/college/recruiters" },
    { label: "Reports", sub: "Generate reports", route: "/college/reports" },
    { label: "Readiness", sub: "Placement readiness", route: "/college/readiness" },
    { label: "Skill Analytics", sub: "Skill heatmap", route: "/college/skills" },
  ],
  recruiter: [
    { label: "Talent Search", sub: "Discover candidates", route: "/recruiter/talent" },
    { label: "Candidates", sub: "Your pipeline", route: "/recruiter/candidates" },
    { label: "AI Matches", sub: "Role fit matches", route: "/recruiter/matches" },
    { label: "Pipeline", sub: "Hiring kanban", route: "/recruiter/pipeline" },
    { label: "Jobs", sub: "Posted roles", route: "/recruiter/jobs" },
    { label: "Analytics", sub: "Hiring analytics", route: "/recruiter/analytics" },
  ],
  admin: [
    { label: "Users", sub: "User management", route: "/admin/users" },
    { label: "Colleges", sub: "Manage colleges", route: "/admin/colleges" },
    { label: "Recruiters", sub: "Partner recruiters", route: "/admin/recruiters" },
    { label: "Analytics", sub: "Platform analytics", route: "/admin/analytics" },
    { label: "AI Usage", sub: "Model consumption", route: "/admin/ai-usage" },
    { label: "Audit Logs", sub: "System logs", route: "/admin/logs" },
  ],
};

// ── Circular progress ─────────────────────────────────────────────────────

function CircularProgress({ pct, accent, inactive }: { pct: number; accent: string; inactive: boolean }) {
  const r = 11;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const color = inactive ? "#C8CCDA" : accent;
  return (
    <svg width="30" height="30" viewBox="0 0 30 30">
      <circle cx="15" cy="15" r={r} fill="none" stroke={inactive ? "#ECEEF2" : `${accent}22`} strokeWidth="2.5" />
      <circle cx="15" cy="15" r={r} fill="none" stroke={color} strokeWidth="2.5"
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
        transform="rotate(-90 15 15)" />
      <text x="15" y="19" textAnchor="middle" fontSize="7.5" fontWeight="800" fill={color} fontFamily="'Manrope', sans-serif">
        {pct}%
      </text>
    </svg>
  );
}

// ── Sidebar item ──────────────────────────────────────────────────────────

function SidebarItem({
  to, icon: Icon, label, accent, accentSoft, end, circular, progressPct,
}: NavItem & { accent: string; accentSoft: string; progressPct: number }) {
  return (
    <NavLink to={to} end={end} className="block w-full select-none">
      {({ isActive }) => (
        <div className="relative flex flex-col items-center w-full pt-2 pb-2.5 gap-1.5">
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-9 rounded-r-full"
              style={{ background: accent }} />
          )}
          <div className="w-[52px] h-[38px] flex items-center justify-center rounded-xl transition-all duration-150"
            style={isActive ? { background: accentSoft } : {}}>
            {circular ? (
              <CircularProgress pct={progressPct} accent={accent} inactive={!isActive} />
            ) : (
              <Icon size={20} strokeWidth={1.8} style={{ color: isActive ? accent : "#9DA5B4" }} />
            )}
          </div>
          <span className="text-[8.5px] font-bold uppercase leading-none tracking-[0.07em] text-center"
            style={{ color: isActive ? accent : "#9DA5B4" }}>
            {label}
          </span>
        </div>
      )}
    </NavLink>
  );
}

// ── Profile menu item ─────────────────────────────────────────────────────

function PMenuItem({
  icon: Icon, label, onClick, ink, hover, sub,
}: {
  icon: React.ElementType; label: string; onClick: () => void;
  ink: string; hover: string; sub: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "0 14px", height: 42, background: "none", border: "none", cursor: "pointer",
        transition: "background 130ms",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hover; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      <div style={{ width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={14} style={{ color: sub }} />
      </div>
      <span style={{ fontSize: 13, color: ink, fontWeight: 500, textAlign: "left", flex: 1 }}>{label}</span>
    </button>
  );
}

// ── Notification popover ──────────────────────────────────────────────────

function NotificationPopover({
  pos, isDark, accent, onClose,
}: {
  pos: { top: number; right: number };
  isDark: boolean;
  accent: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { success } = useToast();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    notificationService.getAll().then((data) => {
      setNotifs(data);
      setLoading(false);
    });
  }, []);

  const surf   = isDark ? "#1C2035" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.09)" : "#E4E7EC";
  const ink    = isDark ? "#F0F2FA" : "#101828";
  const sub    = isDark ? "#9199B2" : "#667085";
  const hov    = isDark ? "rgba(255,255,255,0.05)" : "#F7F9FC";

  function markRead(id: string) {
    setNotifs((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));
    notificationService.markRead(id);
  }

  function markAll() {
    setNotifs((n) => n.map((x) => ({ ...x, read: true })));
    notificationService.markAllRead();
    success("All notifications marked as read");
  }

  function openNotif(n: Notification) {
    markRead(n.id);
    if (n.route) { navigate(n.route); onClose(); }
  }

  return (
    <div style={{
      position: "fixed", top: pos.top, right: pos.right,
      width: 340, maxHeight: "min(480px, calc(100vh - 80px))",
      overflowY: "auto",
      background: surf, border: `1px solid ${border}`, borderRadius: 14,
      boxShadow: isDark
        ? "0 20px 60px rgba(0,0,0,0.55)"
        : "0 12px 40px rgba(16,24,40,0.13), 0 2px 8px rgba(16,24,40,0.06)",
      zIndex: 50,
      opacity: visible ? 1 : 0,
      transform: visible ? "scale(1) translateY(0)" : "scale(0.97) translateY(-4px)",
      transition: "opacity 180ms ease-out, transform 180ms ease-out",
    }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#F1F5F9"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: ink, fontFamily: "Manrope, sans-serif" }}>Notifications</span>
        <button onClick={markAll} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: accent, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
          <CheckCheck size={12} /> Mark all read
        </button>
      </div>
      <div>
        {loading ? (
          <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
            <Loader2 size={18} style={{ color: accent, animation: "spin 1s linear infinite" }} />
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: sub, fontSize: 13 }}>No notifications</div>
        ) : notifs.map((n) => (
          <button
            key={n.id}
            onClick={() => openNotif(n)}
            style={{
              width: "100%", display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 16px", background: n.read ? "transparent" : `${accent}08`,
              border: "none", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F7F9FC"}`,
              cursor: "pointer", textAlign: "left", transition: "background 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hov; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = n.read ? "transparent" : `${accent}08`; }}
          >
            {!n.read && (
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0, marginTop: 5 }} />
            )}
            {n.read && <div style={{ width: 6, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: ink, margin: 0, lineHeight: 1.4 }}>{n.title}</p>
              <p style={{ fontSize: 11, color: sub, margin: "2px 0 0", lineHeight: 1.4 }}>{n.body}</p>
              <p style={{ fontSize: 10, color: isDark ? "#444E66" : "#C8CCDA", margin: "4px 0 0" }}>{n.time}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Search overlay ────────────────────────────────────────────────────────

function SearchOverlay({
  role, accent, isDark, onClose,
}: {
  role: Role; accent: string; isDark: boolean; onClose: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const allItems = SEARCH_ITEMS[role];
  const filtered = query
    ? allItems.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.sub.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  function goTo(route: string) {
    navigate(route);
    onClose();
  }

  const surf   = isDark ? "#1C2035" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.09)" : "#E4E7EC";
  const ink    = isDark ? "#F0F2FA" : "#101828";
  const sub    = isDark ? "#9199B2" : "#667085";
  const hov    = isDark ? "rgba(255,255,255,0.05)" : "#F7F9FC";

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "10vh" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "min(520px, calc(100vw - 32px))",
        background: surf, border: `1px solid ${border}`, borderRadius: 16,
        boxShadow: isDark
          ? "0 24px 80px rgba(0,0,0,0.7)"
          : "0 24px 80px rgba(16,24,40,0.2)",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(-8px)",
        transition: "opacity 180ms ease-out, transform 180ms ease-out",
      }}>
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${border}` }}>
          <Search size={16} style={{ color: sub, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
            placeholder={`Search ${role} workspace...`}
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontSize: 15, color: ink, fontFamily: "inherit",
            }}
          />
          <kbd style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, border: `1px solid ${border}`, color: sub, background: isDark ? "rgba(255,255,255,0.05)" : "#F7F9FC" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: sub, fontSize: 13 }}>No results for "{query}"</div>
          ) : (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, color: sub, letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 16px 4px" }}>
                {query ? "Results" : "Quick Navigation"}
              </p>
              {filtered.map((item) => (
                <button
                  key={item.route}
                  onClick={() => goTo(item.route)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
                    textAlign: "left", transition: "background 120ms",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hov; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Search size={13} style={{ color: accent }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: ink, margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: 11, color: sub, margin: 0 }}>{item.sub}</p>
                  </div>
                  <ChevronRight size={13} style={{ color: sub, marginLeft: "auto" }} />
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Profile dropdown content ──────────────────────────────────────────────

function ProfileDropdown({
  user, role, cfg, theme, setTheme, isDark, onClose, onSignOut,
}: {
  user: { name: string; email: string; role: Role };
  role: Role;
  cfg: RoleConfig;
  theme: Theme;
  setTheme: (t: Theme) => void;
  isDark: boolean;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [confirmSignout, setConfirmSignout] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("Suggestion");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const surf  = isDark ? "#1C2035" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.09)" : "#E4E7EC";
  const ink   = isDark ? "#F0F2FA" : "#101828";
  const sub   = isDark ? "#9199B2" : "#475467";
  const muted = isDark ? "#555E77" : "#98A2B3";
  const hover = isDark ? "rgba(255,255,255,0.06)" : "#F4F6FB";
  const div   = isDark ? "rgba(255,255,255,0.07)" : "#F1F5F9";

  const initials = (user.name || "U")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const routes = {
    profile:  { student: "/profile", college: "/college/settings", recruiter: "/recruiter/settings", admin: "/admin/settings" }[role],
    settings: { student: "/profile", college: "/college/settings", recruiter: "/recruiter/settings", admin: "/admin/settings" }[role],
    billing:  { student: "/subscription?plan=student-pro", college: "/subscription?plan=college", recruiter: "/subscription?plan=recruiter-starter", admin: "" }[role],
  };

  function go(to: string) { if (to) { navigate(to); onClose(); } }

  const profileLabel  = { student: "My Profile", college: "Institution Profile", recruiter: "My Profile", admin: "Admin Profile" }[role];
  const settingsLabel = { student: "Account Settings", college: "College Settings", recruiter: "Company Settings", admin: "Admin Settings" }[role];

  async function handleSendFeedback() {
    setFeedbackLoading(true);
    const result = await supportService.sendFeedback(feedbackType, feedbackMsg);
    setFeedbackLoading(false);
    if (result.success) {
      setFeedbackOpen(false);
      setFeedbackMsg("");
      onClose();
      success("Feedback sent — thank you!");
    } else {
      showError(result.message ?? "Please write your feedback first.");
    }
  }

  const menuSurf: React.CSSProperties = {
    background: surf,
    border: `1px solid ${border}`,
    borderRadius: 14,
    boxShadow: isDark
      ? "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)"
      : "0 12px 40px rgba(16,24,40,0.13), 0 2px 8px rgba(16,24,40,0.06)",
    overflow: "hidden",
    opacity: visible ? 1 : 0,
    transform: visible ? "scale(1) translateY(0)" : "scale(0.97) translateY(-4px)",
    transition: "opacity 180ms ease-out, transform 180ms ease-out",
  };

  return (
    <>
      {/* Feedback modal */}
      {feedbackOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setFeedbackOpen(false); }}
        >
          <div style={{ ...menuSurf, width: "min(380px, calc(100vw - 32px))", opacity: 1, transform: "none" }}>
            <div style={{ padding: "16px 18px", borderBottom: `1px solid ${div}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: ink }}>Send Feedback</span>
              <button onClick={() => setFeedbackOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}>
                <X size={16} style={{ color: sub }} />
              </button>
            </div>
            <div style={{ padding: "16px 18px" }}>
              <p style={{ fontSize: 10, color: muted, marginBottom: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Type</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {["Suggestion", "Bug", "UI Issue", "Other"].map((t) => (
                  <button key={t} onClick={() => setFeedbackType(t)} style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: feedbackType === t ? cfg.accent : "transparent",
                    color: feedbackType === t ? "#fff" : sub,
                    border: `1px solid ${feedbackType === t ? cfg.accent : border}`,
                    transition: "all 130ms",
                  }}>{t}</button>
                ))}
              </div>
              <p style={{ fontSize: 10, color: muted, marginBottom: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Message</p>
              <textarea
                value={feedbackMsg}
                onChange={(e) => setFeedbackMsg(e.target.value)}
                placeholder="Tell us what you think..."
                rows={4}
                style={{
                  width: "100%", boxSizing: "border-box", borderRadius: 10,
                  border: `1px solid ${border}`, padding: "10px 12px",
                  fontSize: 13, color: ink, background: isDark ? "rgba(255,255,255,0.04)" : "#F8F9FC",
                  resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.6,
                }}
              />
              <button
                onClick={handleSendFeedback}
                disabled={feedbackLoading}
                style={{
                  width: "100%", marginTop: 12, padding: 10, borderRadius: 10,
                  background: feedbackLoading ? `${cfg.accent}80` : cfg.accent,
                  border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: feedbackLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {feedbackLoading ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Sending…</> : "Send Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <div style={menuSurf}>
        {/* Identity header */}
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${div}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}AA)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0, letterSpacing: "-0.5px",
            }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: ink, lineHeight: 1.3 }}>{user.name || "CareerOS User"}</p>
              <p style={{ fontSize: 11, color: muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email || `${role}@careeros.ai`}
              </p>
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 5, background: `${cfg.accent}18`, color: cfg.accent,
            }}>{role}</span>
            {role !== "admin" && (
              <button onClick={() => go(routes.billing!)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: muted, padding: 0, marginLeft: "auto", fontWeight: 500 }}>
                {role === "student" ? "Free Plan ›" : "Active ›"}
              </button>
            )}
          </div>
        </div>

        {/* Nav items */}
        <div style={{ padding: "4px 0" }}>
          <PMenuItem icon={role === "college" ? Building2 : User} label={profileLabel}
            onClick={() => go(routes.profile!)} ink={ink} hover={hover} sub={sub} />
          <PMenuItem icon={Settings} label={settingsLabel}
            onClick={() => go(routes.settings!)} ink={ink} hover={hover} sub={sub} />
          {role !== "admin" && (
            <PMenuItem icon={CreditCard} label="Billing & Plan"
              onClick={() => go(routes.billing!)} ink={ink} hover={hover} sub={sub} />
          )}

          {/* Appearance */}
          <button
            onClick={() => setAppearanceOpen((v) => !v)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", height: 42, background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {theme === "dark" ? <Moon size={14} style={{ color: sub }} />
                : theme === "system" ? <Monitor size={14} style={{ color: sub }} />
                : <Sun size={14} style={{ color: sub }} />}
            </div>
            <span style={{ fontSize: 13, color: ink, fontWeight: 500, flex: 1, textAlign: "left" }}>Appearance</span>
            <span style={{ fontSize: 11, color: muted, marginRight: 4 }}>
              {theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System"}
            </span>
            <ChevronRight size={12} style={{ color: muted, flexShrink: 0, transition: "transform 160ms", transform: appearanceOpen ? "rotate(90deg)" : "none" }} />
          </button>

          {appearanceOpen && (
            <div style={{ background: isDark ? "rgba(255,255,255,0.025)" : "#F8F9FC", borderTop: `1px solid ${div}`, borderBottom: `1px solid ${div}`, padding: "3px 10px" }}>
              {([
                { value: "light" as Theme, icon: Sun, label: "Light" },
                { value: "dark"  as Theme, icon: Moon, label: "Dark" },
                { value: "system" as Theme, icon: Monitor, label: "System" },
              ] as const).map((opt) => (
                <button key={opt.value}
                  onClick={() => { setTheme(opt.value); setAppearanceOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 6px", background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <opt.icon size={13} style={{ color: theme === opt.value ? cfg.accent : sub }} />
                  <span style={{ fontSize: 12, color: theme === opt.value ? cfg.accent : ink, fontWeight: theme === opt.value ? 600 : 400, flex: 1, textAlign: "left" }}>{opt.label}</span>
                  {theme === opt.value && <Check size={12} style={{ color: cfg.accent }} />}
                </button>
              ))}
            </div>
          )}

          <PMenuItem icon={HelpCircle} label="Help & Support"
            onClick={() => go("/mentor")} ink={ink} hover={hover} sub={sub} />
          {role !== "admin" && (
            <PMenuItem icon={MessageSquare} label="Send Feedback"
              onClick={() => setFeedbackOpen(true)} ink={ink} hover={hover} sub={sub} />
          )}
        </div>

        {/* Sign out */}
        <div style={{ borderTop: `1px solid ${div}`, padding: "4px 0" }}>
          {!confirmSignout ? (
            <button
              onClick={() => setConfirmSignout(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", height: 42, background: "none", border: "none", cursor: "pointer", transition: "background 130ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? "rgba(229,72,77,0.08)" : "#FEF2F2"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 6, background: isDark ? "rgba(229,72,77,0.1)" : "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <LogOut size={13} style={{ color: "#E5484D" }} />
              </div>
              <span style={{ fontSize: 13, color: isDark ? sub : "#667085", fontWeight: 500 }}>Sign Out</span>
            </button>
          ) : (
            <div style={{ padding: "12px 16px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: ink, marginBottom: 4 }}>Sign out of CareerOS?</p>
              <p style={{ fontSize: 11, color: muted, marginBottom: 12, lineHeight: 1.6 }}>
                {"You'll need to sign in again to access your workspace."}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirmSignout(false)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1px solid ${border}`, background: "none", fontSize: 12, fontWeight: 600, color: sub, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={onSignOut}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", background: "#E5484D", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main AppShell ─────────────────────────────────────────────────────────

export default function AppShell() {
  // All hooks unconditionally before early returns
  const { user, signOut } = useAuth();
  const { isDark, theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const loc = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const avatarRef = useRef<HTMLButtonElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPos, setNotifPos] = useState({ top: 0, right: 0 });
  const notifRef = useRef<HTMLButtonElement>(null);
  const [unreadCount, setUnreadCount] = useState(2);

  const [searchOpen, setSearchOpen] = useState(false);

  function calcPos() {
    if (!avatarRef.current) return;
    const rect = avatarRef.current.getBoundingClientRect();
    setPopupPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    setIsMobile(window.innerWidth < 640);
  }

  function calcNotifPos() {
    if (!notifRef.current) return;
    const rect = notifRef.current.getBoundingClientRect();
    setNotifPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }

  // Close profile on outside click
  useEffect(() => {
    if (!profileOpen) return;
    function handler(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  // Close profile on Escape
  useEffect(() => {
    if (!profileOpen) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") { setProfileOpen(false); avatarRef.current?.focus(); }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [profileOpen]);

  // Recalculate profile position on resize/scroll
  useEffect(() => {
    if (!profileOpen) return;
    function recalc() { calcPos(); }
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
  }, [profileOpen]);

  // Close notif on outside click
  useEffect(() => {
    if (!notifOpen) return;
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  // Keyboard shortcut ⌘K / Ctrl+K for search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Early returns after all hooks
  if (!user) return <Navigate to="/landing" replace />;

  const role: Role = user.role;
  const cfg = ROLE_CONFIG[role];

  const isAllowed = cfg.allowedPaths.some(
    (p) => loc.pathname === p || loc.pathname.startsWith(p + "/")
  );
  if (!isAllowed) return <Navigate to={cfg.homeRoute} replace />;

  const initials = user.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : role[0].toUpperCase();

  function openProfile() {
    if (notifOpen) setNotifOpen(false);
    calcPos();
    setProfileOpen((v) => !v);
  }

  function openNotifs() {
    if (profileOpen) setProfileOpen(false);
    calcNotifPos();
    setNotifOpen((v) => {
      if (!v) setUnreadCount(0);
      return !v;
    });
  }

  function handleSignOut() {
    setProfileOpen(false);
    signOut();
    navigate("/landing");
  }

  // Profile portal
  const dropdownPortal = profileOpen
    ? createPortal(
        <>
          {isMobile && (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 49 }}
              onClick={() => setProfileOpen(false)}
            />
          )}
          <div
            style={isMobile
              ? { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50 }
              : {
                  position: "fixed",
                  top: popupPos.top,
                  right: popupPos.right,
                  width: 280,
                  minWidth: 260,
                  maxWidth: 300,
                  maxHeight: "min(520px, calc(100vh - 80px))",
                  overflowY: "auto",
                  zIndex: 50,
                  borderRadius: 14,
                }}
          >
            {isMobile && (
              <div style={{ borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
                <ProfileDropdown
                  user={user} role={role} cfg={cfg}
                  theme={theme} setTheme={setTheme} isDark={isDark}
                  onClose={() => setProfileOpen(false)} onSignOut={handleSignOut}
                />
              </div>
            )}
            {!isMobile && (
              <ProfileDropdown
                user={user} role={role} cfg={cfg}
                theme={theme} setTheme={setTheme} isDark={isDark}
                onClose={() => setProfileOpen(false)} onSignOut={handleSignOut}
              />
            )}
          </div>
        </>,
        document.body
      )
    : null;

  // Notification portal
  const notifPortal = notifOpen
    ? createPortal(
        <NotificationPopover
          pos={notifPos}
          isDark={isDark}
          accent={cfg.accent}
          onClose={() => setNotifOpen(false)}
        />,
        document.body
      )
    : null;

  // Search portal
  const searchPortal = searchOpen
    ? createPortal(
        <SearchOverlay
          role={role}
          accent={cfg.accent}
          isDark={isDark}
          onClose={() => setSearchOpen(false)}
        />,
        document.body
      )
    : null;

  return (
    <div className="flex h-full bg-[#F7F9FC] dark:bg-[#0F1117]">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-[76px] shrink-0 flex flex-col border-r border-[#E4E7EC] dark:border-[#272B3A] bg-[#F4F6F8] dark:bg-[#1A1D28] h-full overflow-hidden">
        <div className="flex flex-col items-center pt-4 pb-2 gap-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}BB)` }}>
            <Sparkles size={17} className="text-white" strokeWidth={1.8} />
          </div>
          <span className="text-[7.5px] font-bold uppercase tracking-[0.1em]" style={{ color: cfg.accent }}>
            {role}
          </span>
        </div>
        <div className="h-px bg-[#E4E7EC] dark:bg-[#272B3A] mx-3 mb-1" />
        <nav className="flex-1 overflow-y-auto py-0.5">
          {cfg.nav.map((item) => (
            <SidebarItem key={item.to} {...item}
              accent={cfg.accent} accentSoft={cfg.accentSoft} progressPct={cfg.progressPct} />
          ))}
        </nav>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar — z-30 */}
        <header className="relative z-30 h-14 shrink-0 flex items-center justify-between px-6 border-b border-[#E4E7EC] dark:border-[#272B3A] bg-white/80 dark:bg-[#1A1D28]/90 backdrop-blur-sm">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] text-[#667085]">
            <span className="font-medium text-[#98A2B3] capitalize">{role}</span>
            <ChevronRight size={13} className="text-[#D0D5DD]" />
            <span className="font-display font-semibold text-[#101828] dark:text-[#F0F2FA]">
              {PAGE_TITLES[loc.pathname] ?? "CareerOS"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search — opens overlay on click */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F4F6F8] dark:bg-[#272B3A] border border-[#E4E7EC] dark:border-[#333747] text-[13px] text-[#98A2B3] hover:border-[#D0D5DD] dark:hover:border-[#444B5E] transition-colors"
            >
              <Search size={12} />
              <span>Search</span>
              <kbd className="ml-4 text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-[#1A1D28] border border-[#E4E7EC] dark:border-[#333747]">⌘K</kbd>
            </button>

            {/* ARIA status — click to open ARIA Mentor */}
            <button
              onClick={() => navigate("/mentor")}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: `${cfg.accent}0D`, borderColor: `${cfg.accent}25`, color: cfg.accent }}
              title="Open ARIA Mentor"
            >
              <div className="w-1.5 h-1.5 rounded-full ai-pulse" style={{ background: cfg.accent }} />
              {cfg.aiLabel}
            </button>

            {/* Notifications */}
            <button
              ref={notifRef}
              onClick={openNotifs}
              aria-label="Notifications"
              aria-expanded={notifOpen}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#272B3A] transition-colors"
            >
              <Bell size={15} className="text-[#667085] dark:text-[#9199B2]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: cfg.accent, padding: "0 3px" }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Avatar — account menu */}
            <button
              ref={avatarRef}
              onClick={openProfile}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className={`w-[38px] h-[38px] rounded-full bg-gradient-to-br ${cfg.avatarGrad} flex items-center justify-center text-white text-[12px] font-bold font-display cursor-pointer border-2 transition-all duration-150 select-none`}
              style={{ borderColor: profileOpen ? `${cfg.accent}55` : "transparent" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)";
                if (!profileOpen) (e.currentTarget as HTMLButtonElement).style.borderColor = `${cfg.accent}35`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                if (!profileOpen) (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
              }}
            >
              {initials}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Portals */}
      {dropdownPortal}
      {notifPortal}
      {searchPortal}
    </div>
  );
}

export function RoleIndex() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/landing" replace />;
  return <Navigate to={ROLE_CONFIG[user.role].homeRoute} replace />;
}
