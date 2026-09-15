import { useState } from "react";
import { useLocation } from "react-router";
import {
  Users, TrendingUp, AlertTriangle, Briefcase, ChevronRight, Search,
  Download, Filter, CheckCircle, Clock, FileText, BarChart2, Building2,
  Sparkles, ArrowUpRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

// ── Shared data ───────────────────────────────────────────────────────────

const deptData = [
  { dept: "CS", readiness: 82, students: 320, placed: 248, atRisk: 22 },
  { dept: "IT", readiness: 74, students: 280, placed: 195, atRisk: 31 },
  { dept: "ECE", readiness: 67, students: 240, placed: 148, atRisk: 44 },
  { dept: "Mech", readiness: 53, students: 180, placed: 88, atRisk: 58 },
  { dept: "Civil", readiness: 41, students: 150, placed: 52, atRisk: 64 },
];

const trendData = [
  { month: "Apr", readiness: 61 },
  { month: "May", readiness: 65 },
  { month: "Jun", readiness: 68 },
  { month: "Jul", readiness: 71 },
  { month: "Aug", readiness: 74 },
  { month: "Sep", readiness: 77 },
];

const allStudents = [
  { name: "Rohan Kumar",   dept: "CS",   readiness: 92, status: "placed",   issue: "" },
  { name: "Ananya Singh",  dept: "CS",   readiness: 87, status: "placed",   issue: "" },
  { name: "Vikram Mehta",  dept: "IT",   readiness: 78, status: "active",   issue: "" },
  { name: "Pooja Nair",    dept: "CS",   readiness: 74, status: "active",   issue: "" },
  { name: "Arun Sharma",   dept: "IT",   readiness: 68, status: "active",   issue: "" },
  { name: "Divya Rao",     dept: "ECE",  readiness: 55, status: "at-risk",  issue: "Skill gap > 40%" },
  { name: "Kiran Patel",   dept: "IT",   readiness: 41, status: "at-risk",  issue: "Resume quality 38/100" },
  { name: "Priya Sharma",  dept: "ECE",  readiness: 32, status: "at-risk",  issue: "Low attendance" },
  { name: "Arun Mehta",    dept: "Mech", readiness: 28, status: "at-risk",  issue: "No projects" },
  { name: "Sneha Rao",     dept: "Civil",readiness: 35, status: "at-risk",  issue: "No activity 14d" },
];

const recruiterPartners = [
  { name: "Infosys",      roles: 12, applied: 84, shortlisted: 31, hired: 8,  logo: "IN" },
  { name: "TCS",          roles: 8,  applied: 62, shortlisted: 22, hired: 6,  logo: "TC" },
  { name: "Wipro",        roles: 6,  applied: 45, shortlisted: 18, hired: 4,  logo: "WI" },
  { name: "Cognizant",    roles: 5,  applied: 38, shortlisted: 14, hired: 3,  logo: "CG" },
  { name: "Amazon",       roles: 3,  applied: 29, shortlisted: 9,  hired: 2,  logo: "AM" },
];

// ── Shared components ─────────────────────────────────────────────────────

function KPI({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
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
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6E72E8] text-white text-[13px] font-semibold hover:bg-[#5A5FD8] transition-colors">
          <Download size={13} /> {cta}
        </button>
      )}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────

function OverviewSection() {
  return (
    <div className="p-6 space-y-5 max-w-[1200px]">
      <SectionHeader title="College Dashboard" sub="SRM Institute of Science & Technology · Batch 2026" cta="Download Report" />

      <div className="grid grid-cols-4 gap-4">
        <KPI icon={TrendingUp} label="Placement Readiness" value="77%" sub="↑ 6% from last month" color="#4F7CFF" />
        <KPI icon={Users} label="Job-Ready Students" value="612" sub="of 1,170 total" color="#22A06B" />
        <KPI icon={AlertTriangle} label="At-Risk Students" value="148" sub="Needs intervention" color="#E5484D" />
        <KPI icon={Briefcase} label="Active Recruiters" value="34" sub="8 new this week" color="#8B7CFF" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Placement Readiness Trend</h3>
          <p className="text-xs text-[#667085] mb-4">Average across all departments</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <YAxis domain={[50, 90]} tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="readiness" stroke="#6E72E8" strokeWidth={2.5} dot={{ fill: "#6E72E8", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Department Readiness</h3>
          <p className="text-xs text-[#667085] mb-4">Employability score by department</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={deptData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="dept" tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="readiness" fill="#6E72E8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[#101828]">Skill Gap Heatmap</h3>
            <span className="text-xs text-[#98A2B3]">Darker = higher proficiency</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left pb-2 text-[#98A2B3] font-medium w-28">Skill</th>
                  {deptData.map((d) => <th key={d.dept} className="text-center pb-2 text-[#98A2B3] font-medium px-2">{d.dept}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Cloud / DevOps", [72, 55, 38, 22, 18]],
                  ["ML / AI",        [68, 48, 30, 15, 10]],
                  ["System Design",  [60, 52, 42, 30, 22]],
                  ["Communication",  [78, 74, 70, 68, 65]],
                  ["Data Structures",[82, 72, 55, 40, 32]],
                ].map(([skill, vals]: any) => (
                  <tr key={skill}>
                    <td className="py-1.5 text-[#475467] font-medium pr-4">{skill}</td>
                    {vals.map((v: number, i: number) => (
                      <td key={i} className="py-1.5 px-2 text-center">
                        <div className="h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                          style={{
                            background: v >= 70 ? `rgba(34,160,107,${v/100})` : v >= 50 ? `rgba(245,158,11,${(80-v)/100})` : `rgba(229,72,77,${(80-v)/100})`,
                            color: v >= 60 ? "#fff" : "#101828",
                          }}>
                          {v}%
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Students ──────────────────────────────────────────────────────────────

function StudentsSection() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "at-risk" | "active" | "placed">("all");
  const filtered = allStudents.filter(s =>
    (filter === "all" || s.status === filter) &&
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const statusColor: Record<string, string> = { placed: "#22A06B", active: "#4F7CFF", "at-risk": "#E5484D" };
  const statusBg:    Record<string, string> = { placed: "#E3F9EE", active: "#EEF3FF", "at-risk": "#FFE8E8" };

  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Students" sub="All enrolled students · Batch 2026 · 1,170 total" cta="Export CSV" />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: "1,170", color: "#475467" },
          { label: "Job-Ready", value: "612", color: "#22A06B" },
          { label: "Active", value: "410", color: "#4F7CFF" },
          { label: "At-Risk", value: "148", color: "#E5484D" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E4E7EC] p-4">
            <p className="font-display font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[12px] text-[#667085]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-[300px] flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E4E7EC] text-[13px] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#6E72E8]/25 focus:border-[#6E72E8] transition-all bg-white" />
        </div>
        <div className="flex gap-1">
          {(["all", "at-risk", "active", "placed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all"
              style={filter === f ? { background: "#6E72E8", color: "#fff" } : { background: "#F4F6F8", color: "#667085" }}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
        <div className="grid grid-cols-[1fr_72px_110px_1fr_100px] px-5 py-3 border-b border-[#F1F5F9] text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">
          <span>Student</span><span>Dept</span><span>Readiness</span><span>Issue</span><span>Status</span>
        </div>
        {filtered.map(s => (
          <div key={s.name} className="grid grid-cols-[1fr_72px_110px_1fr_100px] px-5 py-3 border-b border-[#F9FAFB] items-center hover:bg-[#F9FAFB] transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6E72E8] to-[#8B7CFF] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {s.name[0]}
              </div>
              <span className="font-medium text-[13px] text-[#101828]">{s.name}</span>
            </div>
            <span className="text-[13px] text-[#667085]">{s.dept}</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 bg-[#F1F5F9] rounded-full">
                <div className="h-1.5 rounded-full" style={{ width: `${s.readiness}%`, background: statusColor[s.status] }} />
              </div>
              <span className="text-[12px] font-semibold" style={{ color: statusColor[s.status] }}>{s.readiness}%</span>
            </div>
            <span className="text-[12px] text-[#98A2B3]">{s.issue || "—"}</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize w-fit"
              style={{ background: statusBg[s.status], color: statusColor[s.status] }}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Placement Readiness ───────────────────────────────────────────────────

function PlacementSection() {
  const funnelData = [
    { stage: "Enrolled", count: 1170, color: "#6E72E8" },
    { stage: "Eligible",  count: 980,  color: "#4F7CFF" },
    { stage: "Applied",   count: 612,  color: "#8B7CFF" },
    { stage: "Shortlisted",count: 284, color: "#22A06B" },
    { stage: "Placed",    count: 148,  color: "#12B76A" },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Placement Readiness" sub="AI-driven placement intelligence · Sep 2026" cta="Export Report" />

      <div className="grid grid-cols-4 gap-4">
        <KPI icon={CheckCircle} label="Placement Rate" value="83%" sub="↑ 15pts YoY" color="#22A06B" />
        <KPI icon={TrendingUp} label="Avg Package" value="₹8.2L" sub="↑ ₹1.4L from last year" color="#4F7CFF" />
        <KPI icon={Briefcase} label="Offers Made" value="284" sub="from 34 recruiters" color="#8B7CFF" />
        <KPI icon={Clock} label="Avg Time to Hire" value="18d" sub="↓ 4d faster" color="#F59E0B" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Funnel */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-5">Placement Funnel</h3>
          <div className="space-y-3">
            {funnelData.map((f, i) => (
              <div key={f.stage}>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-[#475467] font-medium">{f.stage}</span>
                  <span className="font-bold text-[#101828]">{f.count.toLocaleString()}</span>
                </div>
                <div className="h-7 bg-[#F4F6F8] rounded-lg overflow-hidden">
                  <div className="h-full rounded-lg flex items-center px-3 text-white text-[11px] font-bold"
                    style={{ width: `${(f.count / 1170) * 100}%`, background: f.color }}>
                    {Math.round((f.count / 1170) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Package distribution */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Package Distribution</h3>
          <p className="text-xs text-[#667085] mb-4">Offers by salary range</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { range: "3–5L", count: 28 }, { range: "5–8L", count: 72 },
              { range: "8–12L", count: 88 }, { range: "12–18L", count: 54 },
              { range: "18L+", count: 42 },
            ]} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <YAxis tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" fill="#6E72E8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top recruiters */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-[#101828] mb-4">Recruiter Partners</h3>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {["Company", "Open Roles", "Applied", "Shortlisted", "Hired", "Conversion"].map(h => (
                  <th key={h} className="text-left py-2 text-[10px] uppercase tracking-widest text-[#98A2B3] font-semibold pb-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recruiterPartners.map(r => (
                <tr key={r.name} className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#6E72E8]/10 flex items-center justify-center text-[#6E72E8] text-[10px] font-bold shrink-0">{r.logo}</div>
                    <span className="font-medium text-[#344054]">{r.name}</span>
                  </td>
                  <td className="py-3 text-[#667085]">{r.roles}</td>
                  <td className="py-3 text-[#667085]">{r.applied}</td>
                  <td className="py-3 text-[#667085]">{r.shortlisted}</td>
                  <td className="py-3 font-semibold text-[#22A06B]">{r.hired}</td>
                  <td className="py-3">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#22A06B]/10 text-[#22A06B]">
                      {Math.round((r.hired / r.applied) * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Skill Analytics ───────────────────────────────────────────────────────

function SkillAnalyticsSection() {
  const gaps = [
    { skill: "Cloud / DevOps",   gap: 68, critical: true  },
    { skill: "ML / AI",          gap: 62, critical: true  },
    { skill: "System Design",    gap: 55, critical: true  },
    { skill: "Data Structures",  gap: 38, critical: false },
    { skill: "Communication",    gap: 24, critical: false },
    { skill: "SQL / Databases",  gap: 45, critical: false },
  ];
  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Skill Analytics" sub="AI-detected skill gaps across all departments" cta="Export" />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Critical Gaps", value: "3", sub: "Require immediate action", color: "#E5484D" },
          { label: "Avg Gap Score", value: "49%", sub: "Skill coverage", color: "#F59E0B" },
          { label: "Top Skill", value: "Python", sub: "Highest proficiency", color: "#22A06B" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E4E7EC] p-5">
            <p className="font-display font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[13px] font-medium text-[#475467] mt-0.5">{s.label}</p>
            <p className="text-[11px] text-[#98A2B3] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-[#6E72E8]" />
            <h3 className="font-display font-semibold text-[#101828]">Top Skill Gaps</h3>
          </div>
          <div className="space-y-4">
            {gaps.map(g => (
              <div key={g.skill}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#344054]">{g.skill}</span>
                    {g.critical && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#E5484D]/10 text-[#E5484D]">Critical</span>}
                  </div>
                  <span className="text-[12px] font-semibold text-[#475467]">{g.gap}% gap</span>
                </div>
                <div className="h-2 bg-[#F1F5F9] rounded-full">
                  <div className="h-2 rounded-full" style={{ width: `${g.gap}%`, background: g.critical ? "#E5484D" : "#F59E0B" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Skill Coverage by Department</h3>
          <p className="text-xs text-[#667085] mb-4">Average proficiency %</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} barSize={24} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <YAxis dataKey="dept" type="category" tick={{ fontSize: 11, fill: "#98A2B3" }} width={32} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="readiness" fill="#6E72E8" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Departments ───────────────────────────────────────────────────────────

function DepartmentsSection() {
  const COLORS = ["#6E72E8", "#4F7CFF", "#8B7CFF", "#F59E0B", "#E5484D"];
  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Departments" sub="Performance breakdown by department · Batch 2026" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {deptData.map((d, i) => (
          <div key={d.dept} className="bg-white rounded-2xl border border-[#E4E7EC] p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm text-white" style={{ background: COLORS[i] }}>
                  {d.dept}
                </div>
                <div>
                  <p className="font-display font-semibold text-[#101828] text-[14px]">{d.dept} Department</p>
                  <p className="text-[11px] text-[#98A2B3]">{d.students} students</p>
                </div>
              </div>
            </div>
            <div className="h-2 bg-[#F1F5F9] rounded-full mb-3">
              <div className="h-2 rounded-full" style={{ width: `${d.readiness}%`, background: d.readiness >= 75 ? "#22A06B" : d.readiness >= 60 ? COLORS[i] : "#F59E0B" }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#F4F6F8] rounded-lg p-2">
                <p className="font-bold text-[#101828] text-[13px]">{d.readiness}%</p>
                <p className="text-[9px] text-[#98A2B3] uppercase tracking-wide">Readiness</p>
              </div>
              <div className="bg-[#F4F6F8] rounded-lg p-2">
                <p className="font-bold text-[#22A06B] text-[13px]">{d.placed}</p>
                <p className="text-[9px] text-[#98A2B3] uppercase tracking-wide">Placed</p>
              </div>
              <div className="bg-[#F4F6F8] rounded-lg p-2">
                <p className="font-bold text-[#E5484D] text-[13px]">{d.atRisk}</p>
                <p className="text-[9px] text-[#98A2B3] uppercase tracking-wide">At-Risk</p>
              </div>
            </div>
            <button className="mt-3 text-[12px] font-semibold text-[#6E72E8] flex items-center gap-1">
              View analytics <ArrowUpRight size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────

function ReportsSection() {
  const reports = [
    { name: "Placement Summary Report",      desc: "Overall placement stats, funnel, and recruiter breakdown",       date: "Sep 1, 2026",  size: "2.4 MB", type: "PDF" },
    { name: "Department Skill Gap Analysis", desc: "AI-generated skill gaps per department with recommendations",    date: "Aug 25, 2026", size: "1.8 MB", type: "PDF" },
    { name: "At-Risk Student Report",        desc: "Full list of students requiring intervention with action items", date: "Aug 20, 2026", size: "980 KB", type: "XLSX" },
    { name: "Recruiter Engagement Report",   desc: "Partner recruiter activity, open roles, and conversion rates",  date: "Aug 15, 2026", size: "1.1 MB", type: "PDF" },
    { name: "Monthly Progress Report",       desc: "Month-over-month readiness trends and placement updates",        date: "Aug 1, 2026",  size: "3.2 MB", type: "PDF" },
  ];
  const typeColor: Record<string, string> = { PDF: "#E5484D", XLSX: "#22A06B", CSV: "#4F7CFF" };

  return (
    <div className="p-6 space-y-5 max-w-[860px]">
      <SectionHeader title="Reports" sub="Generated placement and analytics reports · Powered by AI" cta="Generate New" />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Reports This Month", value: "12", icon: FileText, color: "#6E72E8" },
          { label: "Auto-Generated", value: "8", icon: Sparkles, color: "#4F7CFF" },
          { label: "Pending Review", value: "2", icon: Clock, color: "#F59E0B" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-[#E4E7EC] p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}12` }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <p className="font-display font-bold text-[#101828] text-lg leading-none">{s.value}</p>
                <p className="text-[11px] text-[#667085] mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <p className="font-display font-semibold text-[#101828]">Recent Reports</p>
          <button className="text-[12px] text-[#6E72E8] font-semibold flex items-center gap-1">View all <ChevronRight size={12} /></button>
        </div>
        <div className="divide-y divide-[#F9FAFB]">
          {reports.map(r => (
            <div key={r.name} className="px-5 py-4 flex items-center gap-4 hover:bg-[#F9FAFB] transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${typeColor[r.type]}12` }}>
                <FileText size={16} style={{ color: typeColor[r.type] }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#101828] text-[13px]">{r.name}</p>
                <p className="text-[11px] text-[#98A2B3] mt-0.5">{r.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-[#98A2B3]">{r.date}</p>
                <p className="text-[10px] text-[#D0D5DD]">{r.size} · {r.type}</p>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E7EC] text-[12px] font-medium text-[#475467] hover:border-[#D0D5DD] transition-colors shrink-0">
                <Download size={12} /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Recruiters ────────────────────────────────────────────────────────────

function CollegeRecruitersSection() {
  const engagementColor = (score: number) =>
    score >= 80 ? "#22A06B" : score >= 60 ? "#4F7CFF" : "#F59E0B";

  const recruiters = [
    ...recruiterPartners,
    { name: "HCL Tech",   roles: 4, applied: 28, shortlisted: 10, hired: 2, logo: "HC", engScore: 72 },
    { name: "Accenture",  roles: 3, applied: 22, shortlisted: 8,  hired: 1, logo: "AC", engScore: 58 },
  ].map(r => ({ ...r, engScore: (r as any).engScore ?? Math.round(((r.hired ?? 0) / r.applied) * 100 + 40) }));

  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Recruiter Partners" sub="Companies actively engaging with your campus" cta="Invite Recruiter" />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Recruiters", value: "34",  color: "#4F7CFF" },
          { label: "Open Roles",        value: "41",  color: "#22A06B" },
          { label: "Applications",      value: "314", color: "#8B7CFF" },
          { label: "Hires This Year",   value: "26",  color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E4E7EC] p-4">
            <p className="font-display font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[12px] text-[#667085]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_100px_100px_110px_90px] px-5 py-3 border-b border-[#F1F5F9] text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">
          <span>Company</span><span>Roles</span><span>Applied</span><span>Shortlisted</span><span>Hired</span><span>Engagement</span><span>Action</span>
        </div>
        <div className="divide-y divide-[#F9FAFB]">
          {recruiters.map(r => {
            const score = r.engScore;
            return (
              <div key={r.name} className="grid grid-cols-[1fr_80px_80px_100px_100px_110px_90px] px-5 py-3.5 items-center hover:bg-[#F9FAFB] transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#6E72E8]/10 flex items-center justify-center text-[#6E72E8] text-[10px] font-bold shrink-0">
                    {r.logo}
                  </div>
                  <span className="font-medium text-[#101828] text-[13px]">{r.name}</span>
                </div>
                <span className="text-[13px] text-[#475467]">{r.roles}</span>
                <span className="text-[13px] text-[#475467]">{r.applied}</span>
                <span className="text-[13px] text-[#475467]">{r.shortlisted}</span>
                <span className="text-[13px] font-semibold text-[#22A06B]">{r.hired}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-14 bg-[#F1F5F9] rounded-full">
                    <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: engagementColor(score) }} />
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: engagementColor(score) }}>{score}%</span>
                </div>
                <button className="text-[11px] font-semibold text-[#6E72E8] flex items-center gap-0.5 hover:underline">
                  View <ArrowUpRight size={11} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────

export default function CollegePage() {
  const { pathname } = useLocation();

  if (pathname.startsWith("/college/students"))
    return <StudentsSection />;
  if (pathname.startsWith("/college/readiness"))
    return <PlacementSection />;
  if (pathname.startsWith("/college/skills"))
    return <SkillAnalyticsSection />;
  if (pathname.startsWith("/college/departments"))
    return <DepartmentsSection />;
  if (pathname.startsWith("/college/recruiters"))
    return <CollegeRecruitersSection />;
  if (pathname.startsWith("/college/reports"))
    return <ReportsSection />;
  return <OverviewSection />;
}
