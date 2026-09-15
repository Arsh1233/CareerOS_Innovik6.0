import { TrendingUp, Target, Zap, Mic2, Briefcase, Star, BarChart2, Users, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ── Student progress ──────────────────────────────────────────────────────

const STUDENT_WEEKS = [
  { week: "Aug 5", readiness: 54, skills: 12, interviews: 1 },
  { week: "Aug 12", readiness: 58, skills: 15, interviews: 2 },
  { week: "Aug 19", readiness: 63, skills: 19, interviews: 2 },
  { week: "Aug 26", readiness: 68, skills: 22, interviews: 3 },
  { week: "Sep 2", readiness: 74, skills: 25, interviews: 4 },
  { week: "Sep 5", readiness: 78, skills: 28, interviews: 5 },
];

const STUDENT_STATS = [
  { label: "Career Readiness", value: "78%", change: "+24pts", icon: Target, color: "#4F7CFF", bg: "#EEF3FF" },
  { label: "Skills Mapped", value: "28", change: "+16 added", icon: Zap, color: "#8B7CFF", bg: "#F0EFFE" },
  { label: "ECHO Interviews", value: "5", change: "+4 sessions", icon: Mic2, color: "#22A06B", bg: "#E3F9EE" },
  { label: "Job Matches", value: "14", change: "3 shortlisted", icon: Briefcase, color: "#F79009", bg: "#FEF3D0" },
];

const RECENT_WINS = [
  { text: "ATS score improved from 64 to 89", date: "Sep 3" },
  { text: "Advanced Python badge earned", date: "Sep 1" },
  { text: "System Design mock interview: 82%", date: "Aug 28" },
  { text: "Reached 75% career readiness", date: "Aug 25" },
  { text: "5 skills added from ARIA suggestion", date: "Aug 20" },
];

function StudentProgress() {
  const maxReadiness = Math.max(...STUDENT_WEEKS.map((w) => w.readiness));
  return (
    <div className="p-7 space-y-6 max-w-[820px]">
      <div>
        <h1 className="font-display font-bold text-[#101828] text-xl mb-1">Progress</h1>
        <p className="text-[#667085] text-[13px]">Your career readiness journey over the last 6 weeks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {STUDENT_STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-[#E4E7EC] p-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <p className="font-display font-bold text-[#101828] text-2xl leading-none">{s.value}</p>
              <p className="text-[12px] text-[#667085] mt-1">{s.label}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: s.color }}>{s.change}</p>
            </div>
          );
        })}
      </div>

      {/* Progress chart */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={15} className="text-[#475467]" />
          <span className="font-display font-semibold text-[#101828] text-[14px]">Readiness Trend</span>
          <span className="ml-auto text-[12px] text-[#98A2B3]">Last 6 weeks</span>
        </div>

        {/* CSS bar chart */}
        <div className="flex items-end gap-2 h-[120px]">
          {STUDENT_WEEKS.map((w) => {
            const h = (w.readiness / maxReadiness) * 100;
            return (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#475467]">{w.readiness}%</span>
                <div className="w-full rounded-t-lg relative overflow-hidden" style={{ height: `${h}%`, minHeight: 8, background: "linear-gradient(180deg, #4F7CFF, #8B7CFF)" }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/15" />
                </div>
                <span className="text-[10px] text-[#98A2B3] text-center leading-tight">{w.week}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent wins */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center gap-2">
          <Star size={15} className="text-[#F79009]" />
          <span className="font-display font-semibold text-[#101828] text-[14px]">Recent Wins</span>
        </div>
        <div className="divide-y divide-[#F7F9FC]">
          {RECENT_WINS.map((w, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#4F7CFF]/10 flex items-center justify-center shrink-0">
                  <Star size={11} className="text-[#4F7CFF]" />
                </div>
                <p className="text-[13px] text-[#344054]">{w.text}</p>
              </div>
              <span className="text-[11px] text-[#98A2B3] shrink-0">{w.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── College progress ──────────────────────────────────────────────────────

const COLLEGE_MONTHS = [
  { month: "Apr", rate: 68, students: 210 },
  { month: "May", rate: 71, students: 240 },
  { month: "Jun", rate: 75, students: 289 },
  { month: "Jul", rate: 78, students: 312 },
  { month: "Aug", rate: 81, students: 340 },
  { month: "Sep", rate: 83, students: 358 },
];

function CollegeProgress() {
  const max = Math.max(...COLLEGE_MONTHS.map((m) => m.students));
  return (
    <div className="p-7 space-y-6 max-w-[820px]">
      <div>
        <h1 className="font-display font-bold text-[#101828] text-xl mb-1">Progress</h1>
        <p className="text-[#667085] text-[13px]">Institution performance and placement trends</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Placement Rate", value: "83%", change: "+15pts", color: "#22A06B", bg: "#E3F9EE", icon: TrendingUp },
          { label: "Job-Ready Students", value: "358", change: "+148 this sem", color: "#4F7CFF", bg: "#EEF3FF", icon: Users },
          { label: "Active Recruiters", value: "89", change: "+21 new", color: "#8B7CFF", bg: "#F0EFFE", icon: Building2 },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-[#E4E7EC] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <p className="font-display font-bold text-[#101828] text-2xl">{s.value}</p>
              <p className="text-[12px] text-[#667085] mt-1">{s.label}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: s.color }}>{s.change}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 size={15} className="text-[#475467]" />
          <span className="font-display font-semibold text-[#101828] text-[14px]">Job-Ready Students by Month</span>
        </div>
        <div className="flex items-end gap-3 h-[120px]">
          {COLLEGE_MONTHS.map((m) => {
            const h = (m.students / max) * 100;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#475467]">{m.students}</span>
                <div className="w-full rounded-t-lg" style={{ height: `${h}%`, minHeight: 8, background: "linear-gradient(180deg, #6E72E8, #8B7CFF)" }} />
                <span className="text-[10px] text-[#98A2B3]">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Recruiter progress ────────────────────────────────────────────────────

function RecruiterProgress() {
  return (
    <div className="p-7 space-y-6 max-w-[820px]">
      <div>
        <h1 className="font-display font-bold text-[#101828] text-xl mb-1">Progress</h1>
        <p className="text-[#667085] text-[13px]">Your hiring pipeline performance and metrics</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Candidates Reviewed", value: "124", change: "+48 this week", color: "#4F7CFF", bg: "#EEF3FF", icon: Users },
          { label: "Shortlisted", value: "31", change: "25% rate", color: "#22A06B", bg: "#E3F9EE", icon: Star },
          { label: "Interviews Scheduled", value: "12", change: "4 this week", color: "#8B7CFF", bg: "#F0EFFE", icon: Mic2 },
          { label: "Offers Extended", value: "3", change: "100% accept", color: "#F79009", bg: "#FEF3D0", icon: Target },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-[#E4E7EC] p-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <p className="font-display font-bold text-[#101828] text-xl leading-none">{s.value}</p>
              <p className="text-[12px] text-[#667085] mt-1">{s.label}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: s.color }}>{s.change}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <p className="font-display font-semibold text-[#101828] text-[14px] mb-4">Pipeline Funnel</p>
        {[
          { label: "Talent Pool Reviewed", count: 124, color: "#4F7CFF", pct: 100 },
          { label: "Profiles Shortlisted", count: 31, color: "#8B7CFF", pct: 25 },
          { label: "Interviews Conducted", count: 12, color: "#22A06B", pct: 10 },
          { label: "Offers Extended", count: 3, color: "#F79009", pct: 2.4 },
        ].map((row) => (
          <div key={row.label} className="mb-3">
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-[#475467]">{row.label}</span>
              <span className="font-semibold text-[#101828]">{row.count}</span>
            </div>
            <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-2 rounded-full transition-all" style={{ width: `${row.pct}%`, background: row.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { user } = useAuth();
  const role = user?.role ?? "student";
  if (role === "college") return <CollegeProgress />;
  if (role === "recruiter") return <RecruiterProgress />;
  return <StudentProgress />;
}
