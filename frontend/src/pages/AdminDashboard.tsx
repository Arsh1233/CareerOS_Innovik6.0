import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Users, Building2, Briefcase, Activity, TrendingUp, AlertTriangle, CheckCircle,
  Clock, Sparkles, ShieldCheck, FileText, BarChart2, LogOut, Search, Filter,
  ChevronRight, Download, Eye, Lock, Unlock, Trash2, Settings, Database,
  Server, Cpu, Globe, ArrowUpRight, X, Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { getAdminDashboard } from "../lib/api/analytics";
import type { AdminDashboard } from "../lib/api/types";
import { useToast } from "../context/ToastContext";

// ── Shared static charts data (for Hackathon Demo) ────────────────────────

const platformTrend = [
  { month: "Apr", users: 8200,  sessions: 24000, ai: 18000 },
  { month: "May", users: 9100,  sessions: 28000, ai: 22000 },
  { month: "Jun", users: 10200, sessions: 32000, ai: 27000 },
  { month: "Jul", users: 11000, sessions: 37000, ai: 31000 },
  { month: "Aug", users: 11800, sessions: 43000, ai: 36000 },
  { month: "Sep", users: 12450, sessions: 49000, ai: 42000 },
];

const aiUsageData = [
  { feature: "Career Twin",   calls: 18420, tokens: 9200000,  cost: 184.2,  latency: "1.2s" },
  { feature: "ARIA Mentor",   calls: 12850, tokens: 7400000,  cost: 148.5,  latency: "0.9s" },
  { feature: "Resume AI",     calls: 9200,  tokens: 4100000,  cost: 92.0,   latency: "1.5s" },
  { feature: "Skill Gap",     calls: 7840,  tokens: 2800000,  cost: 78.4,   latency: "0.7s" },
  { feature: "ECHO Prep",     calls: 5120,  tokens: 3100000,  cost: 51.2,   latency: "2.1s" },
  { feature: "Job Matching",  calls: 4210,  tokens: 1600000,  cost: 42.1,   latency: "0.5s" },
];

const auditLogs = [
  { time: "09:42:18", user: "Admin",       action: "Suspended user kiran@iit.edu",             level: "warn"   },
  { time: "09:38:05", user: "System",      action: "Email Service latency spike detected",       level: "error"  },
  { time: "09:22:41", user: "Admin",       action: "Approved college Manipal University",         level: "info"   },
  { time: "08:55:12", user: "System",      action: "AI usage threshold 80% reached",             level: "warn"   },
  { time: "08:41:00", user: "vikram@infosys", action: "New job role posted: ML Engineer",         level: "info"   },
  { time: "08:30:00", user: "System",      action: "Daily backup completed (2.4 GB)",            level: "info"   },
  { time: "07:15:44", user: "priya@srm",   action: "Bulk student import: 240 records",           level: "info"   },
  { time: "06:00:01", user: "System",      action: "Scheduled maintenance window ended",          level: "info"   },
];

const SERVICES = [
  { name: "API Gateway",      status: "healthy",  latency: "24ms",  uptime: "99.98%" },
  { name: "Auth Service",     status: "healthy",  latency: "18ms",  uptime: "99.99%" },
  { name: "AI Engine",        status: "healthy",  latency: "380ms", uptime: "99.94%" },
  { name: "Email Service",    status: "degraded", latency: "1.8s",  uptime: "97.20%" },
  { name: "Database (RDS)",   status: "healthy",  latency: "11ms",  uptime: "99.99%" },
  { name: "File Storage",     status: "healthy",  latency: "42ms",  uptime: "99.95%" },
];

// ── Shared ────────────────────────────────────────────────────────────────

function KPI({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}14` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <ChevronRight size={13} className="text-[#D0D5DD]" />
      </div>
      <p className="font-display text-2xl font-bold text-[#101828]">{value}</p>
      <p className="text-[13px] font-medium text-[#475467] mt-0.5">{label}</p>
      <p className="text-[11px] text-[#98A2B3] mt-0.5">{sub}</p>
    </div>
  );
}

function SectionHeader({ title, sub, cta }: { title: string; sub: string; cta?: string }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="font-display text-xl font-bold text-[#101828] mb-0.5">{title}</h1>
        <p className="text-[#667085] text-[13px]">{sub}</p>
      </div>
      {cta && (
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#344054] text-white text-[13px] font-semibold hover:bg-[#1D2939] transition-colors">
          {cta}
        </button>
      )}
    </div>
  );
}

const roleChip: Record<string, { bg: string; color: string }> = {
  student:   { bg: "#EEF3FF", color: "#4F7CFF" },
  college:   { bg: "#E3F9EE", color: "#22A06B" },
  recruiter: { bg: "#F0EFFE", color: "#8B7CFF" },
  admin:     { bg: "#F4F6F8", color: "#344054" },
};

const statusDot: Record<string, string> = {
  active:    "#22A06B",
  verified:  "#22A06B",
  suspended: "#E5484D",
  pending:   "#F59E0B",
};

// ── Overview ──────────────────────────────────────────────────────────────

function OverviewSection({ dashboard, onSignOut }: { dashboard: AdminDashboard, onSignOut: () => void }) {
  return (
    <div className="p-6 space-y-5 max-w-[1200px]">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-[#101828] mb-0.5">Admin Control Center</h1>
          <p className="text-[#667085] text-[13px]">CareerOS Platform · September 2026</p>
        </div>
        <button onClick={onSignOut} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E4E7EC] text-[#475467] text-[13px] font-medium hover:bg-[#F4F6F8] transition-colors">
          <LogOut size={13} /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Users}       label="Total Users"      value={dashboard.total_users} sub="Live count" color="#4F7CFF" />
        <KPI icon={Building2}   label="Active Colleges"  value={dashboard.active_colleges}    sub="Platform-wide"  color="#22A06B" />
        <KPI icon={Briefcase}   label="Active Recruiters"value={dashboard.active_recruiters}     sub="Platform-wide"   color="#8B7CFF" />
        <KPI icon={Activity}    label="System Uptime"    value="99.8%"  sub="Email svc degraded" color="#F59E0B" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Platform Growth</h3>
          <p className="text-xs text-[#667085] mb-4">Total users over 6 months</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={platformTrend}>
              <defs>
                <linearGradient id="ugradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F7CFF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4F7CFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <YAxis tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="users" stroke="#4F7CFF" strokeWidth={2.5} fill="url(#ugradA)" name="Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-4">Service Health</h3>
          <div className="space-y-2.5">
            {SERVICES.map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.status === "healthy" ? "#22A06B" : "#E5484D" }} />
                <span className="text-[13px] text-[#344054] flex-1">{s.name}</span>
                <span className="text-[11px] text-[#98A2B3] font-mono">{s.latency}</span>
                <span className="text-[11px] font-semibold" style={{ color: s.status === "healthy" ? "#22A06B" : "#E5484D" }}>{s.uptime}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-4">AI Usage This Month</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={aiUsageData.slice(0, 5)} barSize={22} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#98A2B3" }} />
              <YAxis dataKey="feature" type="category" tick={{ fontSize: 10, fill: "#98A2B3" }} width={72} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="calls" fill="#344054" radius={[0, 6, 6, 0]} name="API Calls" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {auditLogs.slice(0, 5).map((l, i) => {
              const lc: Record<string, string> = { info: "#4F7CFF", warn: "#F59E0B", error: "#E5484D" };
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: lc[l.level] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#344054] truncate">{l.action}</p>
                    <p className="text-[10px] text-[#98A2B3]">{l.user} · {l.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────

function UsersSection({ dashboard }: { dashboard: AdminDashboard }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const shown = dashboard.users.filter(u =>
    (roleFilter === "all" || u.role === roleFilter) &&
    u.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const counts = {
    students: dashboard.users.filter(u => u.role === "student").length,
    colleges: dashboard.users.filter(u => u.role === "college").length,
    recruiters: dashboard.users.filter(u => u.role === "recruiter").length,
    suspended: dashboard.users.filter(u => u.status === "suspended").length,
  };

  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="User Management" sub={`All platform users · ${dashboard.total_users} total`} cta="+ Invite User" />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Students", value: counts.students, color: "#4F7CFF" },
          { label: "College Staff", value: counts.colleges, color: "#22A06B" },
          { label: "Recruiters", value: counts.recruiters, color: "#8B7CFF" },
          { label: "Suspended", value: counts.suspended, color: "#E5484D" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E4E7EC] p-4">
            <p className="font-display font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[12px] text-[#667085]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-[280px] flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E4E7EC] text-[13px] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#344054]/20 focus:border-[#344054] transition-all bg-white" />
        </div>
        <div className="flex gap-1">
          {["all", "student", "college", "recruiter"].map(f => (
            <button key={f} onClick={() => setRoleFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all"
              style={roleFilter === f ? { background: "#344054", color: "#fff" } : { background: "#F4F6F8", color: "#667085" }}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
        <div className="grid grid-cols-[1fr_180px_90px_100px_100px_90px] px-5 py-3 border-b border-[#F1F5F9] text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">
          <span>User</span><span>Email</span><span>Role</span><span>College</span><span>Status</span><span>Actions</span>
        </div>
        {shown.map(u => {
          const rc = roleChip[u.role] || roleChip.student;
          return (
            <div key={u.email} className="grid grid-cols-[1fr_180px_90px_100px_100px_90px] px-5 py-3.5 border-b border-[#F9FAFB] items-center hover:bg-[#F9FAFB] transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#344054] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {u.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[#101828] text-[13px] truncate">{u.name}</p>
                  <p className="text-[10px] text-[#98A2B3]">Joined {u.joined}</p>
                </div>
              </div>
              <span className="text-[12px] text-[#667085] truncate">{u.email}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit capitalize" style={{ background: rc.bg, color: rc.color }}>{u.role}</span>
              <span className="text-[12px] text-[#667085] truncate">{u.college || "—"}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusDot[u.status] || statusDot.pending }} />
                <span className="text-[12px] capitalize text-[#475467]">{u.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <button title="View"><Eye size={13} className="text-[#98A2B3] hover:text-[#344054] transition-colors" /></button>
                <button title={u.status === "suspended" ? "Unsuspend" : "Suspend"}>
                  {u.status === "suspended" ? <Unlock size={13} className="text-[#22A06B]" /> : <Lock size={13} className="text-[#F59E0B] hover:text-[#E5484D] transition-colors" />}
                </button>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && (
          <p className="p-4 text-center text-[#667085] text-sm">No users found.</p>
        )}
      </div>
    </div>
  );
}

// ── Colleges ──────────────────────────────────────────────────────────────

function CollegesSection({ dashboard }: { dashboard: AdminDashboard }) {
  const [search, setSearch] = useState("");
  const shown = dashboard.colleges.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="College Partners" sub="Registered institutions on CareerOS" cta="+ Add College" />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Colleges", value: dashboard.active_colleges, color: "#22A06B" },
          { label: "Total Students", value: dashboard.colleges.reduce((sum, c) => sum + c.students, 0).toLocaleString(), color: "#4F7CFF" },
          { label: "Pending Review", value: dashboard.colleges.filter(c => c.status === "pending").length, color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E4E7EC] p-5 flex items-center gap-4">
            <div>
              <p className="font-display font-bold text-2xl leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[12px] text-[#667085] mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative max-w-[280px]">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search colleges…"
          className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E4E7EC] text-[13px] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#344054]/20 transition-all bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_100px_110px_90px] px-5 py-3 border-b border-[#F1F5F9] text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">
          <span>Institution</span><span>Students</span><span>Active</span><span>Readiness</span><span>Status</span><span>Actions</span>
        </div>
        {shown.map(c => (
          <div key={c.name} className="grid grid-cols-[1fr_100px_100px_100px_110px_90px] px-5 py-3.5 border-b border-[#F9FAFB] items-center hover:bg-[#F9FAFB] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#22A06B]/10 flex items-center justify-center text-[#22A06B] text-[10px] font-bold shrink-0">
                {c.name[0]}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-[#101828] text-[13px] truncate">{c.name}</p>
                <p className="text-[10px] text-[#98A2B3]">{c.city || "—"} · Since {c.joinDate}</p>
              </div>
            </div>
            <span className="text-[13px] text-[#475467] font-medium">{c.students.toLocaleString()}</span>
            <span className="text-[13px] text-[#22A06B] font-medium">{c.active.toLocaleString()}</span>
            <div className="flex items-center gap-1.5">
              {c.readiness > 0 ? (
                <>
                  <div className="h-1.5 w-12 bg-[#F1F5F9] rounded-full">
                    <div className="h-1.5 rounded-full" style={{ width: `${c.readiness}%`, background: "#22A06B" }} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#22A06B]">{c.readiness}%</span>
                </>
              ) : <span className="text-[12px] text-[#98A2B3]">—</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusDot[c.status] ?? "#F59E0B" }} />
              <span className="text-[12px] capitalize text-[#475467]">{c.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <button title="View"><Eye size={13} className="text-[#98A2B3] hover:text-[#344054] transition-colors" /></button>
              {c.status === "pending" && <button title="Approve"><CheckCircle size={13} className="text-[#22A06B]" /></button>}
            </div>
          </div>
        ))}
        {shown.length === 0 && (
          <p className="p-4 text-center text-[#667085] text-sm">No colleges found.</p>
        )}
      </div>
    </div>
  );
}

// ── Recruiters ────────────────────────────────────────────────────────────

function RecruitersSection({ dashboard }: { dashboard: AdminDashboard }) {
  const planColor: Record<string, { bg: string; color: string }> = {
    Enterprise: { bg: "#EEF3FF", color: "#4F7CFF" },
    Growth:     { bg: "#F0EFFE", color: "#8B7CFF" },
    Startup:    { bg: "#E3F9EE", color: "#22A06B" },
  };

  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Recruiter Partners" sub="Companies using CareerOS talent discovery" cta="+ Add Partner" />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Companies", value: dashboard.active_recruiters, color: "#8B7CFF" },
          { label: "Open Roles", value: dashboard.recruiters.reduce((sum, r) => sum + r.roles, 0), color: "#4F7CFF" },
          { label: "Total Hires", value: dashboard.recruiters.reduce((sum, r) => sum + r.hires, 0), color: "#22A06B" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E4E7EC] p-5">
            <p className="font-display font-bold text-2xl leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[12px] text-[#667085] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
        <div className="grid grid-cols-[1fr_180px_80px_80px_100px_100px_80px] px-5 py-3 border-b border-[#F1F5F9] text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">
          <span>Company</span><span>Contact</span><span>Roles</span><span>Hires</span><span>Plan</span><span>Status</span><span>Actions</span>
        </div>
        {dashboard.recruiters.map(r => {
          const pc = planColor[r.plan] || planColor.Enterprise;
          return (
            <div key={r.name} className="grid grid-cols-[1fr_180px_80px_80px_100px_100px_80px] px-5 py-3.5 border-b border-[#F9FAFB] items-center hover:bg-[#F9FAFB] transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#8B7CFF]/10 flex items-center justify-center text-[#8B7CFF] text-[10px] font-bold shrink-0">
                  {r.name[0]}
                </div>
                <div>
                  <p className="font-medium text-[#101828] text-[13px]">{r.name}</p>
                  <p className="text-[10px] text-[#98A2B3]">Since {r.since}</p>
                </div>
              </div>
              <span className="text-[12px] text-[#667085] truncate">{r.contact || "—"}</span>
              <span className="text-[13px] text-[#475467] font-medium">{r.roles}</span>
              <span className="text-[13px] text-[#22A06B] font-semibold">{r.hires}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit" style={{ background: pc.bg, color: pc.color }}>{r.plan}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusDot[r.status] ?? "#F59E0B" }} />
                <span className="text-[12px] capitalize text-[#475467]">{r.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <button><Eye size={13} className="text-[#98A2B3] hover:text-[#344054] transition-colors" /></button>
                {r.status === "pending" && <button><CheckCircle size={13} className="text-[#22A06B]" /></button>}
              </div>
            </div>
          );
        })}
        {dashboard.recruiters.length === 0 && (
          <p className="p-4 text-center text-[#667085] text-sm">No recruiters found.</p>
        )}
      </div>
    </div>
  );
}

// ── Platform Analytics ────────────────────────────────────────────────────

function PlatformAnalytics({ dashboard }: { dashboard: AdminDashboard }) {
  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Platform Analytics" sub="Usage, growth, and engagement metrics · Sep 2026" cta="Export" />

      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Users}    label="Total Users"     value={dashboard.total_users} sub="Live count"  color="#4F7CFF" />
        <KPI icon={Activity} label="Daily Sessions"  value="6,200"  sub="↑ 12% WoW"         color="#22A06B" />
        <KPI icon={Sparkles} label="AI Calls / Day"  value="14,000" sub="↑ 8% WoW"          color="#8B7CFF" />
        <KPI icon={TrendingUp} label="Avg Session"   value="24min"  sub="↑ 3min from Aug"   color="#F59E0B" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">User Growth</h3>
          <p className="text-xs text-[#667085] mb-4">Monthly active users</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={platformTrend}>
              <defs>
                <linearGradient id="ugradB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F7CFF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4F7CFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <YAxis tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="users" stroke="#4F7CFF" strokeWidth={2.5} fill="url(#ugradB)" name="Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Sessions & AI Calls</h3>
          <p className="text-xs text-[#667085] mb-4">Monthly volume</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={platformTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <YAxis tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="sessions" stroke="#22A06B" strokeWidth={2.5} dot={false} name="Sessions" />
              <Line type="monotone" dataKey="ai" stroke="#8B7CFF" strokeWidth={2.5} dot={false} name="AI Calls" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── AI Usage ──────────────────────────────────────────────────────────────

function AIUsageSection() {
  const totalCalls = aiUsageData.reduce((sum, r) => sum + r.calls, 0);
  const totalCost = aiUsageData.reduce((sum, r) => sum + r.cost, 0).toFixed(1);

  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="AI Usage" sub="Feature-level AI consumption and cost tracking" cta="Export" />

      <div className="grid grid-cols-3 gap-4">
        <KPI icon={Sparkles} label="Total API Calls" value={totalCalls.toLocaleString()} sub="This month" color="#8B7CFF" />
        <KPI icon={BarChart2} label="Est. Cost" value={`$${totalCost}`} sub="Budget: $800" color="#F59E0B" />
        <KPI icon={Clock} label="Avg Latency" value="1.1s" sub="All features avg" color="#4F7CFF" />
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F1F5F9]">
          <p className="font-display font-semibold text-[#101828]">Feature Breakdown</p>
        </div>
        <div className="divide-y divide-[#F9FAFB]">
          <div className="grid grid-cols-[1fr_100px_120px_80px_80px] px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">
            <span>Feature</span><span>API Calls</span><span>Tokens Used</span><span>Cost</span><span>Latency</span>
          </div>
          {aiUsageData.map(r => (
            <div key={r.feature} className="grid grid-cols-[1fr_100px_120px_80px_80px] px-5 py-3.5 items-center hover:bg-[#F9FAFB] transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#8B7CFF]/10 flex items-center justify-center shrink-0">
                  <Sparkles size={12} className="text-[#8B7CFF]" />
                </div>
                <span className="font-medium text-[#101828] text-[13px]">{r.feature}</span>
              </div>
              <div>
                <span className="text-[13px] text-[#475467] font-medium">{r.calls.toLocaleString()}</span>
                <div className="h-1 bg-[#F1F5F9] rounded-full mt-1 w-16">
                  <div className="h-1 rounded-full bg-[#8B7CFF]" style={{ width: `${(r.calls / totalCalls) * 100}%` }} />
                </div>
              </div>
              <span className="text-[12px] text-[#667085]">{(r.tokens / 1_000_000).toFixed(1)}M</span>
              <span className="text-[13px] font-semibold text-[#344054]">${r.cost}</span>
              <span className="text-[12px] font-mono text-[#667085]">{r.latency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Logs ──────────────────────────────────────────────────────────────────

function LogsSection() {
  const [levelFilter, setLevelFilter] = useState("all");
  const lc: Record<string, string> = { info: "#4F7CFF", warn: "#F59E0B", error: "#E5484D" };
  const lb: Record<string, string> = { info: "#EEF3FF", warn: "#FEF3D0", error: "#FFE8E8" };
  const shown = auditLogs.filter(l => levelFilter === "all" || l.level === levelFilter);

  return (
    <div className="p-6 space-y-5 max-w-[1000px]">
      <SectionHeader title="Audit Logs" sub="Platform activity and system events · Real-time" cta="Export Logs" />

      <div className="flex gap-1">
        {["all", "info", "warn", "error"].map(f => (
          <button key={f} onClick={() => setLevelFilter(f)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all"
            style={levelFilter === f ? { background: f === "all" ? "#344054" : (lc[f] ?? "#344054"), color: "#fff" } : { background: "#F4F6F8", color: "#667085" }}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
        <div className="grid grid-cols-[90px_140px_1fr_60px] px-5 py-3 border-b border-[#F1F5F9] text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">
          <span>Time</span><span>Actor</span><span>Event</span><span>Level</span>
        </div>
        <div className="divide-y divide-[#F9FAFB]">
          {shown.map((l, i) => (
            <div key={i} className="grid grid-cols-[90px_140px_1fr_60px] px-5 py-3 items-center hover:bg-[#F9FAFB] transition-colors">
              <span className="text-[11px] font-mono text-[#98A2B3]">{l.time}</span>
              <span className="text-[12px] text-[#475467] truncate">{l.user}</span>
              <span className="text-[13px] text-[#344054]">{l.action}</span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full w-fit" style={{ background: lb[l.level], color: lc[l.level] }}>
                {l.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Access Control ────────────────────────────────────────────────────────

function AccessSection() {
  const perms = [
    { role: "Student",   can: ["View own profile", "Use AI features", "Apply to jobs", "View mentors"],        cannot: ["View other students", "Export data", "Manage users"] },
    { role: "College",   can: ["View own students", "Run placement analytics", "Manage departments", "Export reports"], cannot: ["View recruiter data", "Modify AI settings"] },
    { role: "Recruiter", can: ["Search talent pool", "View matched candidates", "Post job roles", "View analytics"],    cannot: ["View full profiles", "Access college data"] },
    { role: "Admin",     can: ["Full platform access", "User management", "System config", "AI usage & billing"],       cannot: [] },
  ];
  const roleColors: Record<string, string> = { Student: "#4F7CFF", College: "#22A06B", Recruiter: "#8B7CFF", Admin: "#344054" };

  return (
    <div className="p-6 space-y-5 max-w-[1000px]">
      <SectionHeader title="Access Control" sub="Role-based permission matrix for CareerOS" />

      <div className="grid grid-cols-2 gap-4">
        {perms.map(p => (
          <div key={p.role} className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <ShieldCheck size={15} style={{ color: roleColors[p.role] }} />
              <p className="font-display font-semibold text-[#101828]">{p.role}</p>
            </div>
            <div className="space-y-1.5 mb-3">
              {p.can.map(c => (
                <div key={c} className="flex items-center gap-2 text-[12px] text-[#344054]">
                  <CheckCircle size={11} className="text-[#22A06B] shrink-0" /> {c}
                </div>
              ))}
            </div>
            {p.cannot.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-[#F1F5F9]">
                {p.cannot.map(c => (
                  <div key={c} className="flex items-center gap-2 text-[12px] text-[#98A2B3]">
                    <X size={11} className="text-[#D0D5DD] shrink-0" /> {c}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAdminDashboard();
        setDashboard(data);
      } catch (err: any) {
        error(err.message || "Failed to load admin dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [error]);

  const handleSignOut = () => {
    signOut();
    navigate("/landing");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#344054]" />
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-8">Failed to load data.</div>;
  }

  if (pathname.startsWith("/admin/users"))       return <UsersSection dashboard={dashboard} />;
  if (pathname.startsWith("/admin/colleges"))    return <CollegesSection dashboard={dashboard} />;
  if (pathname.startsWith("/admin/recruiters"))  return <RecruitersSection dashboard={dashboard} />;
  if (pathname.startsWith("/admin/analytics"))   return <PlatformAnalytics dashboard={dashboard} />;
  if (pathname.startsWith("/admin/ai-usage"))    return <AIUsageSection />;
  if (pathname.startsWith("/admin/logs"))        return <LogsSection />;
  if (pathname.startsWith("/admin/control"))     return <AccessSection />;
  return <OverviewSection dashboard={dashboard} onSignOut={handleSignOut} />;
}

