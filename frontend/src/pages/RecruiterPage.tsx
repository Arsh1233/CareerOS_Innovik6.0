import { useState } from "react";
import { useLocation } from "react-router";
import {
  Search, Filter, Star, ChevronRight, Download, Briefcase, Users, TrendingUp,
  Target, Clock, CheckCircle, ArrowUpRight, Sparkles, BarChart2, MapPin,
  Building2, MessageCircle, X,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

// ── Data ──────────────────────────────────────────────────────────────────

const CANDIDATES = [
  { name: "Rohan Kumar",   college: "IIT Bombay",  role: "SWE",    match: 96, readiness: 92, status: "shortlisted", skills: ["Python", "ML", "System Design"], location: "Mumbai" },
  { name: "Ananya Singh",  college: "BITS Pilani",  role: "SWE",    match: 91, readiness: 88, status: "interviewed", skills: ["React", "Node", "AWS"],          location: "Pune" },
  { name: "Vikram Mehta",  college: "NIT Trichy",   role: "Data",   match: 87, readiness: 84, status: "shortlisted", skills: ["Python", "SQL", "Tableau"],      location: "Chennai" },
  { name: "Pooja Nair",    college: "IIT Delhi",    role: "SWE",    match: 83, readiness: 79, status: "reviewing",  skills: ["Java", "Spring", "Docker"],       location: "Delhi" },
  { name: "Arun Sharma",   college: "SRM Chennai",  role: "DevOps", match: 78, readiness: 72, status: "reviewing",  skills: ["AWS", "Terraform", "CI/CD"],      location: "Chennai" },
  { name: "Divya Rao",     college: "VIT Vellore",  role: "Data",   match: 71, readiness: 65, status: "new",        skills: ["R", "Python", "Statistics"],      location: "Bangalore" },
  { name: "Kiran Patel",   college: "DAIICT",       role: "SWE",    match: 68, readiness: 61, status: "new",        skills: ["C++", "DSA", "Git"],              location: "Ahmedabad" },
];

const PIPELINE = [
  { stage: "Talent Pool",  count: 340, color: "#6E72E8" },
  { stage: "Reviewed",     count: 124, color: "#4F7CFF" },
  { stage: "Shortlisted",  count: 31,  color: "#8B7CFF" },
  { stage: "Interviewed",  count: 12,  color: "#22A06B" },
  { stage: "Offers Sent",  count: 4,   color: "#12B76A" },
];

const JOBS = [
  { title: "Senior Software Engineer", dept: "Engineering", location: "Bangalore · Remote", applicants: 84, shortlisted: 12, deadline: "Sep 30, 2026", status: "active",  match: 96 },
  { title: "ML Engineer",              dept: "AI Team",     location: "Hyderabad",          applicants: 62, shortlisted: 8,  deadline: "Oct 15, 2026", status: "active",  match: 91 },
  { title: "Data Analyst",             dept: "Analytics",   location: "Remote",             applicants: 45, shortlisted: 6,  deadline: "Oct 5, 2026",  status: "active",  match: 87 },
  { title: "DevOps Engineer",          dept: "Infra",       location: "Pune",               applicants: 38, shortlisted: 4,  deadline: "Sep 28, 2026", status: "paused",  match: 78 },
  { title: "PM – Intern",              dept: "Product",     location: "Delhi · Hybrid",     applicants: 110,shortlisted: 15, deadline: "Sep 15, 2026", status: "active",  match: 73 },
];

const analyticsData = [
  { month: "Apr", apps: 64,  hires: 2, views: 240 },
  { month: "May", apps: 88,  hires: 3, views: 310 },
  { month: "Jun", apps: 76,  hires: 2, views: 280 },
  { month: "Jul", apps: 102, hires: 4, views: 390 },
  { month: "Aug", apps: 124, hires: 3, views: 450 },
  { month: "Sep", apps: 148, hires: 4, views: 520 },
];

// ── Shared helpers ────────────────────────────────────────────────────────

const matchColor = (m: number) => m >= 90 ? "#22A06B" : m >= 75 ? "#4F7CFF" : "#F59E0B";

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  shortlisted: { bg: "#EEF3FF", color: "#4F7CFF", label: "Shortlisted" },
  interviewed: { bg: "#E3F9EE", color: "#22A06B", label: "Interviewed" },
  reviewing:   { bg: "#FEF3D0", color: "#F59E0B", label: "Reviewing" },
  new:         { bg: "#F4F6F8", color: "#667085", label: "New" },
};

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
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B7CFF] text-white text-[13px] font-semibold hover:bg-[#7B6CEF] transition-colors">
          {cta}
        </button>
      )}
    </div>
  );
}

// ── Talent Search ─────────────────────────────────────────────────────────

function TalentSearch() {
  const [query, setQuery] = useState("");
  const [chips, setChips] = useState(["Python", "ML"]);
  const suggestions = ["Cloud", "System Design", "React", "Java", "SQL", "DevOps"];

  return (
    <div className="p-6 space-y-5 max-w-[900px]">
      <SectionHeader title="Talent Search" sub="AI-powered natural language candidate discovery" />

      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-[#8B7CFF]" />
          <span className="text-[13px] font-medium text-[#344054]">Describe your ideal candidate</span>
        </div>
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. fresher with strong Python and ML background from a top-tier college, comfortable with system design"
          rows={3}
          className="w-full rounded-xl border border-[#E4E7EC] p-3 text-[13px] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#8B7CFF]/25 focus:border-[#8B7CFF] transition-all resize-none bg-[#FAFAFA]"
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {chips.map(c => (
            <span key={c} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B7CFF]/10 border border-[#8B7CFF]/20 text-[12px] font-semibold text-[#8B7CFF]">
              {c}
              <button onClick={() => setChips(chips.filter(x => x !== c))}><X size={11} /></button>
            </span>
          ))}
          {suggestions.filter(s => !chips.includes(s)).slice(0, 4).map(s => (
            <button key={s} onClick={() => setChips([...chips, s])}
              className="px-3 py-1 rounded-full bg-[#F4F6F8] border border-[#E4E7EC] text-[12px] text-[#667085] hover:border-[#8B7CFF]/30 transition-colors">
              + {s}
            </button>
          ))}
        </div>
        <button className="mt-4 w-full py-2.5 rounded-xl bg-[#8B7CFF] text-white text-[13px] font-semibold hover:bg-[#7B6CEF] transition-colors flex items-center justify-center gap-2">
          <Search size={14} /> Search Talent Pool
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-[12px] font-semibold text-[#98A2B3] uppercase tracking-widest">{CANDIDATES.length} matches found</p>
        {CANDIDATES.slice(0, 4).map(c => (
          <div key={c.name} className="bg-white rounded-xl border border-[#E4E7EC] px-5 py-4 flex items-center gap-4 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B7CFF] to-[#6E72E8] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-[#101828] text-[13px]">{c.name}</p>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${matchColor(c.match)}14`, color: matchColor(c.match) }}>
                  {c.match}% match
                </span>
              </div>
              <p className="text-[12px] text-[#667085] mt-0.5">{c.college} · {c.role} · {c.location}</p>
              <div className="flex gap-1.5 mt-2">
                {c.skills.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4F6F8] text-[#667085] font-medium">{s}</span>)}
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-[#8B7CFF] text-white text-[12px] font-semibold hover:bg-[#7B6CEF] transition-colors shrink-0">
              Shortlist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Candidates ────────────────────────────────────────────────────────────

function CandidatesSection() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const shown = CANDIDATES.filter(c =>
    (filter === "all" || c.status === filter) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Candidates" sub="All candidates across active job roles" cta="+ Add Candidate" />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Pool", value: "340", color: "#475467" },
          { label: "Shortlisted", value: "31", color: "#4F7CFF" },
          { label: "Interviewed", value: "12", color: "#22A06B" },
          { label: "Offers Sent", value: "4", color: "#8B7CFF" },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E4E7EC] text-[13px] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#8B7CFF]/25 focus:border-[#8B7CFF] transition-all bg-white" />
        </div>
        <div className="flex gap-1">
          {["all", "shortlisted", "interviewed", "reviewing", "new"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all"
              style={filter === f ? { background: "#8B7CFF", color: "#fff" } : { background: "#F4F6F8", color: "#667085" }}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_100px_120px_80px] px-5 py-3 border-b border-[#F1F5F9] text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">
          <span>Candidate</span><span>College</span><span>Match</span><span>Readiness</span><span>Status</span><span>Action</span>
        </div>
        {shown.map(c => {
          const badge = statusBadge[c.status];
          return (
            <div key={c.name} className="grid grid-cols-[1fr_120px_100px_100px_120px_80px] px-5 py-3.5 border-b border-[#F9FAFB] items-center hover:bg-[#F9FAFB] transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B7CFF] to-[#6E72E8] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {c.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[#101828] text-[13px] truncate">{c.name}</p>
                  <p className="text-[11px] text-[#98A2B3]">{c.location}</p>
                </div>
              </div>
              <span className="text-[12px] text-[#667085] truncate">{c.college}</span>
              <span className="text-[13px] font-bold" style={{ color: matchColor(c.match) }}>{c.match}%</span>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-12 bg-[#F1F5F9] rounded-full">
                  <div className="h-1.5 rounded-full" style={{ width: `${c.readiness}%`, background: "#8B7CFF" }} />
                </div>
                <span className="text-[11px] font-semibold text-[#8B7CFF]">{c.readiness}%</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit" style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
              <button className="text-[11px] font-semibold text-[#8B7CFF] flex items-center gap-0.5 hover:underline">
                View <ArrowUpRight size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AI Matches ────────────────────────────────────────────────────────────

function MatchesSection() {
  return (
    <div className="p-6 space-y-5 max-w-[960px]">
      <SectionHeader title="AI Matches" sub="CareerOS matching engine · Updated 2h ago" />

      <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-[#8B7CFF]/6 to-[#6E72E8]/6 border border-[#8B7CFF]/15">
        <Sparkles size={14} className="text-[#8B7CFF] mt-0.5 shrink-0" />
        <p className="text-[13px] text-[#475467] leading-relaxed">
          <strong className="text-[#8B7CFF]">AI Insight:</strong> CareerOS analyzed 340 candidates against your 5 active roles. Below are the strongest semantic skill-role matches, ranked by readiness and fit.
        </p>
      </div>

      {JOBS.slice(0, 3).map(job => {
        const matched = CANDIDATES.filter(c => c.match > 75).slice(0, 3);
        return (
          <div key={job.title} className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-display font-semibold text-[#101828]">{job.title}</p>
                <p className="text-[12px] text-[#667085] mt-0.5">{job.dept} · {job.location}</p>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#22A06B]/10 text-[#22A06B]">
                {matched.length} strong matches
              </span>
            </div>
            <div className="space-y-2.5">
              {matched.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl bg-[#F9FAFB] border border-[#F1F5F9]">
                  <span className="text-[11px] font-bold text-[#D0D5DD] w-4 shrink-0">#{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B7CFF] to-[#6E72E8] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#101828]">{c.name}</p>
                    <p className="text-[11px] text-[#98A2B3]">{c.college}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.skills.slice(0, 2).map(s => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#8B7CFF]/10 text-[#8B7CFF] font-medium">{s}</span>)}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[13px]" style={{ color: matchColor(c.match) }}>{c.match}%</p>
                    <p className="text-[10px] text-[#98A2B3]">match</p>
                  </div>
                  <button className="px-2.5 py-1 rounded-lg bg-[#8B7CFF] text-white text-[11px] font-semibold hover:bg-[#7B6CEF] transition-colors shrink-0">
                    Shortlist
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Pipeline ──────────────────────────────────────────────────────────────

function PipelineSection() {
  return (
    <div className="p-6 space-y-5 max-w-[1050px]">
      <SectionHeader title="Hiring Pipeline" sub="End-to-end candidate flow across all active roles" cta="Export" />

      <div className="grid grid-cols-5 gap-3">
        {PIPELINE.map((p, i) => (
          <div key={p.stage} className="bg-white rounded-xl border border-[#E4E7EC] p-4 text-center">
            <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center font-display font-bold text-base text-white" style={{ background: p.color }}>
              {p.count}
            </div>
            <p className="text-[12px] font-semibold text-[#344054]">{p.stage}</p>
            {i > 0 && <p className="text-[10px] text-[#98A2B3] mt-0.5">{Math.round((p.count / PIPELINE[i - 1].count) * 100)}% conv.</p>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
        <h3 className="font-display font-semibold text-[#101828] mb-5">Conversion Funnel</h3>
        <div className="space-y-3">
          {PIPELINE.map(p => (
            <div key={p.stage}>
              <div className="flex items-center justify-between mb-1.5 text-[12px]">
                <span className="text-[#475467] font-medium">{p.stage}</span>
                <span className="font-bold text-[#101828]">{p.count}</span>
              </div>
              <div className="h-8 bg-[#F4F6F8] rounded-lg overflow-hidden">
                <div className="h-full rounded-lg flex items-center px-3 text-white text-[11px] font-bold"
                  style={{ width: `${(p.count / PIPELINE[0].count) * 100}%`, background: p.color }}>
                  {Math.round((p.count / PIPELINE[0].count) * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[12px] font-bold uppercase tracking-widest text-[#98A2B3] mb-3">Candidate Board</p>
        <div className="grid grid-cols-3 gap-4">
          {["reviewing", "shortlisted", "interviewed"].map(stage => {
            const group = CANDIDATES.filter(c => c.status === stage);
            const badge = statusBadge[stage];
            return (
              <div key={stage} className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between" style={{ background: `${badge.color}08` }}>
                  <span className="text-[12px] font-bold" style={{ color: badge.color }}>{badge.label}</span>
                  <span className="text-[11px] font-semibold text-[#98A2B3]">{group.length}</span>
                </div>
                <div className="p-3 space-y-2 min-h-[90px]">
                  {group.map(c => (
                    <div key={c.name} className="p-3 rounded-lg bg-[#F9FAFB] border border-[#F1F5F9]">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8B7CFF] to-[#6E72E8] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {c.name[0]}
                        </div>
                        <span className="text-[12px] font-medium text-[#101828]">{c.name}</span>
                      </div>
                      <p className="text-[10px] text-[#98A2B3] ml-8">{c.college} · {c.match}% match</p>
                    </div>
                  ))}
                  {group.length === 0 && <p className="text-[12px] text-[#D0D5DD] text-center py-4">No candidates</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Jobs ──────────────────────────────────────────────────────────────────

function JobsSection() {
  const statusStyle: Record<string, { bg: string; color: string }> = {
    active: { bg: "#E3F9EE", color: "#22A06B" },
    paused: { bg: "#FEF3D0", color: "#F59E0B" },
  };

  return (
    <div className="p-6 space-y-5 max-w-[1050px]">
      <SectionHeader title="Job Roles" sub="Active and paused job postings" cta="+ Post New Role" />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Roles", value: "4", color: "#22A06B", icon: Briefcase },
          { label: "Total Applicants", value: "339", color: "#4F7CFF", icon: Users },
          { label: "Avg Match Score", value: "85%", color: "#8B7CFF", icon: Target },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-[#E4E7EC] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}12` }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="font-display font-bold text-2xl text-[#101828] leading-none">{s.value}</p>
                <p className="text-[12px] text-[#667085] mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {JOBS.map(job => {
          const ss = statusStyle[job.status];
          return (
            <div key={job.title} className="bg-white rounded-2xl border border-[#E4E7EC] p-5 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B7CFF]/10 flex items-center justify-center shrink-0">
                    <Briefcase size={16} className="text-[#8B7CFF]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-semibold text-[#101828] text-[14px]">{job.title}</p>
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.color }}>{job.status}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[12px] text-[#667085] flex items-center gap-1"><Building2 size={11} />{job.dept}</span>
                      <span className="text-[12px] text-[#667085] flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                      <span className="text-[12px] text-[#667085] flex items-center gap-1"><Clock size={11} />{job.deadline}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <p className="font-display font-bold text-[#101828] text-xl leading-none">{job.applicants}</p>
                    <p className="text-[10px] text-[#98A2B3] mt-0.5">Applicants</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-[#4F7CFF] text-xl leading-none">{job.shortlisted}</p>
                    <p className="text-[10px] text-[#98A2B3] mt-0.5">Shortlisted</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[13px]" style={{ color: matchColor(job.match) }}>{job.match}%</p>
                    <p className="text-[10px] text-[#98A2B3]">Top Match</p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E7EC] text-[12px] font-medium text-[#475467] hover:border-[#8B7CFF]/30 transition-colors">
                    Manage <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────

function AnalyticsSection() {
  const PIE_DATA = [
    { name: "CS / IT", value: 48, color: "#6E72E8" },
    { name: "Engineering", value: 28, color: "#4F7CFF" },
    { name: "MBA", value: 14, color: "#8B7CFF" },
    { name: "Other", value: 10, color: "#D0D5DD" },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Analytics" sub="Recruiting performance and funnel insights · Sep 2026" cta="Export Report" />

      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Users} label="Profiles Reviewed" value="520" sub="↑ 70 from Aug" color="#4F7CFF" />
        <KPI icon={Target} label="Avg Match Score" value="84%" sub="↑ 3pts" color="#8B7CFF" />
        <KPI icon={CheckCircle} label="Offers Accepted" value="4/4" sub="100% accept rate" color="#22A06B" />
        <KPI icon={Clock} label="Avg Time to Hire" value="16d" sub="↓ 2d faster" color="#F59E0B" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Applications Over Time</h3>
          <p className="text-xs text-[#667085] mb-4">Monthly applications vs. hires</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <YAxis tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="apps" fill="#8B7CFF" radius={[4, 4, 0, 0]} name="Applications" />
              <Bar dataKey="hires" fill="#22A06B" radius={[4, 4, 0, 0]} name="Hires" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Candidate Source Mix</h3>
          <p className="text-xs text-[#667085] mb-4">By educational background</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                  {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {PIE_DATA.map(d => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-[12px] text-[#475467]">{d.name}</span>
                  <span className="ml-auto text-[12px] font-semibold text-[#101828]">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Profile View Trend</h3>
          <p className="text-xs text-[#667085] mb-4">Monthly candidate profile views from CareerOS</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <YAxis tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="views" stroke="#8B7CFF" strokeWidth={2.5} dot={{ fill: "#8B7CFF", r: 4 }} name="Profile Views" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────

function OverviewSection() {
  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Recruiter Dashboard" sub="Infosys Talent Acquisition · September 2026" />

      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Users} label="Talent Pool" value="340" sub="8 new today" color="#8B7CFF" />
        <KPI icon={TrendingUp} label="Avg Match Score" value="84%" sub="↑ 3% this week" color="#4F7CFF" />
        <KPI icon={Briefcase} label="Open Roles" value="5" sub="1 expiring soon" color="#F59E0B" />
        <KPI icon={CheckCircle} label="Offers This Month" value="4" sub="100% accepted" color="#22A06B" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Hiring Activity</h3>
          <p className="text-xs text-[#667085] mb-4">Applications vs. hires · last 6 months</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analyticsData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <YAxis tick={{ fontSize: 11, fill: "#98A2B3" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="apps" fill="#8B7CFF" radius={[4, 4, 0, 0]} name="Applications" />
              <Bar dataKey="hires" fill="#22A06B" radius={[4, 4, 0, 0]} name="Hires" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-4">Top Candidates</h3>
          <div className="space-y-3">
            {CANDIDATES.slice(0, 4).map(c => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B7CFF] to-[#6E72E8] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#101828] truncate">{c.name}</p>
                  <p className="text-[10px] text-[#98A2B3]">{c.college}</p>
                </div>
                <span className="text-[12px] font-bold" style={{ color: matchColor(c.match) }}>{c.match}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 lg:col-span-3">
          <h3 className="font-display font-semibold text-[#101828] mb-4">Pipeline at a Glance</h3>
          <div className="grid grid-cols-5 gap-3">
            {PIPELINE.map((p, i) => (
              <div key={p.stage} className="text-center">
                <div className="h-20 bg-[#F4F6F8] rounded-xl flex flex-col items-center justify-center mb-2 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 rounded-xl" style={{ height: `${(p.count / PIPELINE[0].count) * 100}%`, background: `${p.color}20`, borderTop: `2px solid ${p.color}` }} />
                  <span className="font-display font-bold text-xl text-[#101828] relative z-10">{p.count}</span>
                </div>
                <p className="text-[11px] text-[#667085] font-medium">{p.stage}</p>
                {i > 0 && <p className="text-[10px] text-[#98A2B3]">{Math.round((p.count / PIPELINE[i - 1].count) * 100)}%</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────

export default function RecruiterPage() {
  const { pathname } = useLocation();

  if (pathname.startsWith("/recruiter/talent"))                                    return <TalentSearch />;
  if (pathname.startsWith("/recruiter/candidates") || pathname.startsWith("/recruiter/shortlist"))
    return <CandidatesSection />;
  if (pathname.startsWith("/recruiter/matches"))                                  return <MatchesSection />;
  if (pathname.startsWith("/recruiter/pipeline"))                                 return <PipelineSection />;
  if (pathname.startsWith("/recruiter/jobs"))                                     return <JobsSection />;
  if (pathname.startsWith("/recruiter/analytics"))                                return <AnalyticsSection />;
  return <OverviewSection />;
}
