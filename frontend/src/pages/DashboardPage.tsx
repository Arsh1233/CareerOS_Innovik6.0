import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight, Zap, BookOpen, Mic2, Briefcase,
  TrendingUp, Clock, Star, ChevronRight, Sparkles,
} from "lucide-react";

function CircularProgress({ value, size = 96 }: { value: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  const offset = circ - (progress / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="url(#grad)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
      />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4F7CFF" />
          <stop offset="100%" stopColor="#8B7CFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SkillBar({ label, value, required }: { label: string; value: number; required: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[#475467] font-medium">{label}</span>
        <span className="text-[#98A2B3]">{value}% / {required}% needed</span>
      </div>
      <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: value < required ? "linear-gradient(90deg, #F59E0B, #EF4444)" : "linear-gradient(90deg, #4F7CFF, #8B7CFF)",
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s",
          }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const skills = [
    { label: "MLOps & Model Deployment", value: 45, required: 80 },
    { label: "System Design", value: 60, required: 85 },
    { label: "LLM Fine-tuning", value: 30, required: 70 },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Greeting */}
      <div className="fade-up">
        <p className="text-[#667085] text-sm mb-0.5">Saturday, 5 Sep 2026</p>
        <h1 className="font-display text-2xl font-bold text-[#101828]">Good morning, Rohan 👋</h1>
      </div>

      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 fade-up-1">
        {/* Career Readiness Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4E7EC] p-6 card-hover relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[240px] h-[240px] rounded-full bg-gradient-to-br from-[#4F7CFF]/6 to-[#8B7CFF]/6 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="flex items-start gap-6 relative">
            <div className="relative shrink-0">
              <CircularProgress value={78} size={104} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold text-[#101828]">78%</span>
                <span className="text-[10px] text-[#667085]">Ready</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#4F7CFF]/8 text-[#4F7CFF]">AI Engineer</span>
                <span className="text-xs text-[#98A2B3]">Target Role</span>
              </div>
              <h2 className="font-display text-lg font-bold text-[#101828] mb-1">Career Readiness</h2>
              <p className="text-sm text-[#667085] leading-relaxed mb-4">
                You're <strong className="text-[#101828]">3 priority skills</strong> away from AI Engineer readiness. Strong foundation in Python and ML, gaps in deployment and system design.
              </p>
              <div className="space-y-2.5">
                {skills.map((s) => <SkillBar key={s.label} {...s} />)}
              </div>
              <button
                onClick={() => navigate("/skills")}
                className="mt-4 btn-primary text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 w-fit"
              >
                View Skill Gaps <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E8EDFF] dark:from-[#1a1f3e] dark:to-[#222a5a] rounded-2xl p-5 flex flex-col ai-glow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#4F7CFF]/20 flex items-center justify-center">
              <Sparkles size={13} className="text-[#4F7CFF] dark:text-[#55C7F3]" />
            </div>
            <span className="text-xs font-semibold text-[#4F7CFF] dark:text-[#55C7F3]">ARIA Insight</span>
          </div>
          <p className="text-[#344054] dark:text-white/90 text-sm leading-relaxed flex-1">
            {"Kubernetes is your highest-impact skill gap right now. Companies hiring AI Engineers require deployment proficiency in "}<strong className="text-[#4F7CFF] dark:text-[#55C7F3]">87% of job listings</strong>{" this quarter."}
          </p>
          <div className="mt-4 pt-4 border-t border-[#D5DEFF] dark:border-white/10">
            <p className="text-[#667085] dark:text-white/40 text-xs mb-3">Recommended next step</p>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/60 dark:bg-white/5 border border-[#D5DEFF] dark:border-white/10">
              <BookOpen size={13} className="text-[#8B7CFF] shrink-0" />
              <span className="text-[#344054] dark:text-white/80 text-xs">Docker &amp; K8s Fundamentals — 6h course</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/mentor")}
            className="mt-3 text-xs font-semibold text-[#4F7CFF] dark:text-[#55C7F3] flex items-center gap-1 hover:gap-2 transition-all"
          >
            Ask ARIA <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Continue CTA */}
      <div className="fade-up-2">
        <button
          onClick={() => navigate("/skills")}
          className="btn-primary text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <TrendingUp size={16} />
          Continue My Plan
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Supporting cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 fade-up-3">
        {/* Upcoming Goal */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-4 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
              <Star size={14} className="text-[#F59E0B]" />
            </div>
            <span className="text-xs text-[#98A2B3]">Due in 3 days</span>
          </div>
          <p className="font-semibold text-sm text-[#101828] font-display mb-1">Complete ML Project</p>
          <p className="text-xs text-[#667085]">Deploy a sentiment analysis model to Hugging Face</p>
          <div className="mt-3 h-1 bg-[#F1F5F9] rounded-full">
            <div className="h-1 w-[65%] rounded-full bg-[#F59E0B]" />
          </div>
          <p className="text-[10px] text-[#98A2B3] mt-1">65% complete</p>
        </div>

        {/* Next interview */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-4 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#4F7CFF]/10 flex items-center justify-center">
              <Mic2 size={14} className="text-[#4F7CFF]" />
            </div>
            <span className="text-xs text-[#98A2B3]">Tomorrow</span>
          </div>
          <p className="font-semibold text-sm text-[#101828] font-display mb-1">ECHO Interview</p>
          <p className="text-xs text-[#667085]">ML Engineer mock · 45 min · Medium difficulty</p>
          <button
            onClick={() => navigate("/interview")}
            className="mt-3 text-xs font-semibold text-[#4F7CFF] flex items-center gap-1 hover:gap-2 transition-all"
          >
            Prepare now <ChevronRight size={12} />
          </button>
        </div>

        {/* Job match */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-4 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#22A06B]/10 flex items-center justify-center">
              <Briefcase size={14} className="text-[#22A06B]" />
            </div>
            <span className="text-xs font-semibold text-[#22A06B] bg-[#22A06B]/8 px-1.5 py-0.5 rounded-full">12 new</span>
          </div>
          <p className="font-semibold text-sm text-[#101828] font-display mb-1">Strong Job Matches</p>
          <p className="text-xs text-[#667085]">Infosys, Flipkart, Zomato AI — 82–94% match</p>
          <button
            onClick={() => navigate("/jobs")}
            className="mt-3 text-xs font-semibold text-[#22A06B] flex items-center gap-1 hover:gap-2 transition-all"
          >
            View matches <ChevronRight size={12} />
          </button>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-4 card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#8B7CFF]/10 flex items-center justify-center">
              <Clock size={14} className="text-[#8B7CFF]" />
            </div>
            <span className="text-xs text-[#98A2B3]">Today</span>
          </div>
          <p className="font-semibold text-sm text-[#101828] font-display mb-2">Recent Activity</p>
          <div className="space-y-1.5">
            {[
              "Completed PyTorch module",
              "Resume scored: 81/100",
              "Skill gap updated",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#8B7CFF]" />
                <span className="text-xs text-[#667085]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
