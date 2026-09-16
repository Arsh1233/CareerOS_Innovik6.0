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
import type { RecruiterDashboard, JobApplication, RecruiterPipelineMetric, RecruiterJobMetric } from "../lib/api/types";

// ── Hardcoded demo data ───────────────────────────────────────────────────
const FALLBACK_RECRUITER: RecruiterDashboard = {
  pipeline: [
    { stage: "Talent Pool",   count: 1240, color: "#6E72E8" },
    { stage: "Applied",       count: 384,  color: "#4F7CFF" },
    { stage: "Shortlisted",   count: 127,  color: "#8B7CFF" },
    { stage: "Interviewed",   count: 61,   color: "#22A06B" },
    { stage: "Offers Sent",   count: 18,   color: "#F59E0B" },
    { stage: "Hired",         count: 11,   color: "#22C55E" },
  ],
  job_metrics: [
    {
      job: { id: "j1", recruiter_id: "r1", company_name: "Infosys", title: "Software Engineer – Cloud", department: "Engineering", location: "Bengaluru", salary_range: "₹8–14 LPA", employment_type: "Full-time", description: null, required_skills: ["AWS", "Docker", "Python"] },
      applicants_count: 98, shortlisted_count: 22, avg_match_score: 81,
    },
    {
      job: { id: "j2", recruiter_id: "r1", company_name: "Infosys", title: "Data Analyst", department: "Analytics", location: "Hyderabad", salary_range: "₹6–10 LPA", employment_type: "Full-time", description: null, required_skills: ["SQL", "Python", "Tableau"] },
      applicants_count: 74, shortlisted_count: 18, avg_match_score: 76,
    },
    {
      job: { id: "j3", recruiter_id: "r1", company_name: "Infosys", title: "Frontend Developer", department: "Product", location: "Pune", salary_range: "₹7–12 LPA", employment_type: "Full-time", description: null, required_skills: ["React", "TypeScript", "CSS"] },
      applicants_count: 62, shortlisted_count: 14, avg_match_score: 79,
    },
    {
      job: { id: "j4", recruiter_id: "r1", company_name: "Infosys", title: "DevOps Engineer", department: "Infrastructure", location: "Chennai", salary_range: "₹9–15 LPA", employment_type: "Full-time", description: null, required_skills: ["Kubernetes", "CI/CD", "Linux"] },
      applicants_count: 45, shortlisted_count: 10, avg_match_score: 84,
    },
  ],
  recent_applications: [
    { id: "a1",  job_id: "j1", student_id: "s1",  status: "shortlisted", match_score: 94, student_name: "Aarav Shah",    college: "SRM Institute",    department: "CS",   skills: ["AWS", "Docker", "Python"] },
    { id: "a2",  job_id: "j1", student_id: "s2",  status: "reviewing",   match_score: 88, student_name: "Priya Nair",    college: "VIT Vellore",     department: "IT",   skills: ["AWS", "Python"] },
    { id: "a3",  job_id: "j2", student_id: "s3",  status: "interviewed", match_score: 91, student_name: "Diya Iyer",     college: "BITS Pilani",     department: "CS",   skills: ["SQL", "Python", "Tableau"] },
    { id: "a4",  job_id: "j3", student_id: "s4",  status: "new",         match_score: 77, student_name: "Rohan Mehta",   college: "NIT Trichy",      department: "ECE",  skills: ["React", "JavaScript"] },
    { id: "a5",  job_id: "j1", student_id: "s5",  status: "offered",     match_score: 96, student_name: "Nikhil Rao",    college: "IIT Bombay",      department: "CS",   skills: ["AWS", "Docker", "Python", "Kubernetes"] },
    { id: "a6",  job_id: "j4", student_id: "s6",  status: "shortlisted", match_score: 85, student_name: "Sneha Reddy",   college: "SRM Institute",   department: "IT",   skills: ["Kubernetes", "Linux"] },
    { id: "a7",  job_id: "j2", student_id: "s7",  status: "reviewing",   match_score: 72, student_name: "Vivek Singh",   college: "Amity University", department: "CS",   skills: ["SQL", "Excel"] },
    { id: "a8",  job_id: "j3", student_id: "s8",  status: "rejected",    match_score: 58, student_name: "Tanya Bose",    college: "Manipal",         department: "ECE",  skills: ["HTML", "CSS"] },
    { id: "a9",  job_id: "j1", student_id: "s9",  status: "shortlisted", match_score: 89, student_name: "Ishaan Verma",  college: "VIT Vellore",     department: "CS",   skills: ["AWS", "Python"] },
    { id: "a10", job_id: "j4", student_id: "s10", status: "new",         match_score: 80, student_name: "Meera Joshi",   college: "NIT Warangal",    department: "CS",   skills: ["CI/CD", "Docker"] },
  ] as any,
};

// ── Shared helpers ────────────────────────────────────────────────────────

const matchColor = (m: number | null) => {
  if (m === null) return "#667085";
  return m >= 90 ? "#22A06B" : m >= 75 ? "#4F7CFF" : "#F59E0B";
};

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  shortlisted: { bg: "#EEF3FF", color: "#4F7CFF", label: "Shortlisted" },
  interviewed: { bg: "#E3F9EE", color: "#22A06B", label: "Interviewed" },
  offered:     { bg: "#E3F9EE", color: "#22A06B", label: "Offered" },
  reviewing:   { bg: "#FEF3D0", color: "#F59E0B", label: "Reviewing" },
  new:         { bg: "#F4F6F8", color: "#667085", label: "New" },
  rejected:    { bg: "#FEE4E2", color: "#D92D20", label: "Rejected" },
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

// ── Overview ──────────────────────────────────────────────────────────────

function OverviewSection({ dashboard }: { dashboard: RecruiterDashboard }) {
  const analyticsData = [
    { month: "Apr", apps: 64,  hires: 2, views: 240 },
    { month: "May", apps: 88,  hires: 3, views: 310 },
    { month: "Jun", apps: 76,  hires: 2, views: 280 },
    { month: "Jul", apps: 102, hires: 4, views: 390 },
    { month: "Aug", apps: 124, hires: 3, views: 450 },
    { month: "Sep", apps: dashboard.recent_applications.length + 100, hires: 4, views: 520 },
  ];

  const pipeline = dashboard.pipeline;
  const poolSize = pipeline.find(p => p.stage === "Talent Pool")?.count || 0;
  const offers = pipeline.find(p => p.stage === "Offers Sent")?.count || 0;
  
  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Recruiter Dashboard" sub="Talent Acquisition · September 2026" />

      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Users} label="Talent Pool" value={poolSize.toString()} sub="Live candidates" color="#8B7CFF" />
        <KPI icon={TrendingUp} label="Avg Match Score" value="84%" sub="Across shortlists" color="#4F7CFF" />
        <KPI icon={Briefcase} label="Open Roles" value={dashboard.job_metrics.length.toString()} sub="Active postings" color="#F59E0B" />
        <KPI icon={CheckCircle} label="Offers Sent" value={offers.toString()} sub="Total across roles" color="#22A06B" />
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
          <h3 className="font-display font-semibold text-[#101828] mb-4">Recent Applicants</h3>
          <div className="space-y-3">
            {dashboard.recent_applications.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B7CFF] to-[#6E72E8] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {(c.student_name || "C")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#101828] truncate">{c.student_name || "Unknown Candidate"}</p>
                  <p className="text-[10px] text-[#98A2B3]">{c.student_college || "CareerOS Student"}</p>
                </div>
                {c.match_score !== null && (
                   <span className="text-[12px] font-bold" style={{ color: matchColor(c.match_score) }}>{c.match_score}%</span>
                )}
              </div>
            ))}
            {dashboard.recent_applications.length === 0 && (
               <p className="text-xs text-[#667085]">No recent applicants.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 lg:col-span-3">
          <h3 className="font-display font-semibold text-[#101828] mb-4">Pipeline at a Glance</h3>
          <div className="grid grid-cols-5 gap-3">
            {pipeline.map((p, i) => {
               const maxCount = Math.max(...pipeline.map(x => x.count), 1);
               return (
              <div key={p.stage} className="text-center">
                <div className="h-20 bg-[#F4F6F8] rounded-xl flex flex-col items-center justify-center mb-2 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 rounded-xl" style={{ height: `${(p.count / maxCount) * 100}%`, background: `${p.color}20`, borderTop: `2px solid ${p.color}` }} />
                  <span className="font-display font-bold text-xl text-[#101828] relative z-10">{p.count}</span>
                </div>
                <p className="text-[11px] text-[#667085] font-medium">{p.stage}</p>
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Jobs Section ──────────────────────────────────────────────────────────

function JobsSection({ dashboard }: { dashboard: RecruiterDashboard }) {
  const statusStyle: Record<string, { bg: string; color: string }> = {
    active: { bg: "#E3F9EE", color: "#22A06B" },
    paused: { bg: "#FEF3D0", color: "#F59E0B" },
    closed: { bg: "#F1F5F9", color: "#667085" },
  };

  return (
    <div className="p-6 space-y-5 max-w-[1050px]">
      <SectionHeader title="Job Roles" sub="Active and paused job postings" cta="+ Post New Role" />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Roles", value: dashboard.job_metrics.length, color: "#22A06B", icon: Briefcase },
          { label: "Total Applicants", value: dashboard.recent_applications.length, color: "#4F7CFF", icon: Users },
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
        {dashboard.job_metrics.map(metric => {
          const job = metric.job;
          const ss = statusStyle[job.status] || statusStyle.active;
          return (
            <div key={job.id} className="bg-white rounded-2xl border border-[#E4E7EC] p-5 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow">
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
                      <span className="text-[12px] text-[#667085] flex items-center gap-1"><Building2 size={11} />{job.department || job.company_name}</span>
                      <span className="text-[12px] text-[#667085] flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <p className="font-display font-bold text-[#101828] text-xl leading-none">{metric.applicants_count}</p>
                    <p className="text-[10px] text-[#98A2B3] mt-0.5">Applicants</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-[#4F7CFF] text-xl leading-none">{metric.shortlisted_count}</p>
                    <p className="text-[10px] text-[#98A2B3] mt-0.5">Shortlisted</p>
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

// ── Candidates & Board ────────────────────────────────────────────────────

function CandidatesSection({ dashboard, refresh }: { dashboard: RecruiterDashboard, refresh: () => void }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  
  const shown = dashboard.recent_applications.filter(c =>
    (filter === "all" || c.status === filter) &&
    (c.student_name?.toLowerCase().includes(search.toLowerCase()) || c.student_college?.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleStatusChange(appId: string, status: string) {
    // Demo behavior: Update the object in memory and force a re-render
    const app = dashboard.recent_applications.find(a => a.id === appId);
    if (app) app.status = status;
    
    // In a real app we'd call updateApplicationStatus here
    console.log(`Status updated for ${appId} to ${status}`);
    
    // We don't have a strict refresh for static data, but we can trigger a re-render if needed
    // The select box handles its own visual state, or we could lift state up.
  }


  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      <SectionHeader title="Candidates" sub="All candidates across active job roles" />

      <div className="flex items-center gap-3">
        <div className="relative max-w-[280px] flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E4E7EC] text-[13px] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#8B7CFF]/25 focus:border-[#8B7CFF] transition-all bg-white" />
        </div>
        <div className="flex gap-1">
          {["all", "new", "reviewing", "shortlisted", "interviewed", "offered", "rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all"
              style={filter === f ? { background: "#8B7CFF", color: "#fff" } : { background: "#F4F6F8", color: "#667085" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_120px_120px] px-5 py-3 border-b border-[#F1F5F9] text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">
          <span>Candidate</span><span>College</span><span>Match</span><span>Status</span><span>Action</span>
        </div>
        {shown.map(c => {
          const badge = statusBadge[c.status] || statusBadge.new;
          return (
            <div key={c.id} className="grid grid-cols-[1fr_120px_100px_120px_120px] px-5 py-3.5 border-b border-[#F9FAFB] items-center hover:bg-[#F9FAFB] transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B7CFF] to-[#6E72E8] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {(c.student_name || "U")[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[#101828] text-[13px] truncate">{c.student_name || "Unknown"}</p>
                </div>
              </div>
              <span className="text-[12px] text-[#667085] truncate">{c.student_college || "N/A"}</span>
              <span className="text-[13px] font-bold" style={{ color: matchColor(c.match_score) }}>{c.match_score ?? "-"}%</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit" style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
              <div className="flex items-center gap-2">
                 <select 
                    className="text-[11px] bg-[#F4F6F8] rounded-md border border-[#E4E7EC] px-1 py-0.5 outline-none"
                    value={c.status}
                    onChange={(e) => handleStatusChange(c.id, e.target.value)}
                 >
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                 </select>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && (
           <p className="p-4 text-center text-[#667085] text-sm">No applications found.</p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function RecruiterPage() {
  const { pathname } = useLocation();
  // Use hardcoded demo data — always renders instantly, no API needed
  const dashboard = FALLBACK_RECRUITER;

  if (pathname.startsWith("/recruiter/candidates") || pathname.startsWith("/recruiter/shortlist")) {
    return <CandidatesSection dashboard={dashboard} refresh={() => {}} />;
  }
  if (pathname.startsWith("/recruiter/jobs")) {
    return <JobsSection dashboard={dashboard} />;
  }
  return <OverviewSection dashboard={dashboard} />;
}
