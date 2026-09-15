import { useState } from "react";
import { useNavigate } from "react-router";
import { Sparkles, CheckCircle, Circle, Lock, Clock, ChevronRight, Target, Zap } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { roadmapService } from "../services/index";

type MilestoneStatus = { title: string; done: boolean; inProgress?: boolean };

const INITIAL_PHASES = [
  {
    phase: 1, title: "Foundation", subtitle: "Profile · Goals · Baseline skills",
    status: "complete" as const, doneCount: 4, total: 4,
    milestones: [
      { title: "Complete your CareerOS profile", done: true },
      { title: "Set your target role and industry", done: true },
      { title: "Map your baseline skill set", done: true },
      { title: "Upload and analyse your resume", done: true },
    ],
  },
  {
    phase: 2, title: "Skill Building", subtitle: "Close your AI-identified skill gaps",
    status: "active" as const, doneCount: 1, total: 4,
    milestones: [
      { title: "Complete Python Advanced module", done: true },
      { title: "Finish System Design course", done: false, inProgress: true },
      { title: "Complete ML Fundamentals", done: false },
      { title: "Build 2 portfolio projects", done: false },
    ],
  },
  {
    phase: 3, title: "Career Readiness", subtitle: "Interview prep · Resume polish · ARIA mentoring",
    status: "locked" as const, doneCount: 0, total: 4,
    milestones: [
      { title: "Achieve 80%+ career readiness score", done: false },
      { title: "Complete 5 ECHO mock interviews", done: false },
      { title: "Optimise resume to ATS 90+", done: false },
      { title: "Complete 3 ARIA mentor sessions", done: false },
    ],
  },
  {
    phase: 4, title: "Job Search", subtitle: "Apply · Interview · Offer",
    status: "locked" as const, doneCount: 0, total: 3,
    milestones: [
      { title: "Apply to 10 AI-matched positions", done: false },
      { title: "Complete company research sessions", done: false },
      { title: "Negotiate and accept your offer", done: false },
    ],
  },
];

const STATUS_COLORS = {
  complete: "#22A06B",
  active:   "#4F7CFF",
  locked:   "#D0D5DD",
};

function PhaseIcon({ status }: { status: "complete" | "active" | "locked" }) {
  if (status === "complete") return <CheckCircle size={20} className="text-[#22A06B]" />;
  if (status === "active")   return <div className="w-5 h-5 rounded-full border-2 border-[#4F7CFF] flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-[#4F7CFF]" /></div>;
  return <Lock size={16} className="text-[#D0D5DD]" />;
}

function MilestoneRow({
  m, phaseIdx, milestoneIdx, onToggle,
}: {
  m: MilestoneStatus;
  phaseIdx: number;
  milestoneIdx: number;
  onToggle: (ph: number, mi: number) => void;
}) {
  return (
    <button
      onClick={() => !m.inProgress && onToggle(phaseIdx, milestoneIdx)}
      className="flex items-center gap-2.5 py-1.5 w-full text-left hover:bg-[#F7F9FC] rounded-lg px-1 transition-colors"
    >
      {m.done ? (
        <CheckCircle size={14} className="text-[#22A06B] shrink-0" />
      ) : m.inProgress ? (
        <Clock size={14} className="text-[#4F7CFF] shrink-0" />
      ) : (
        <Circle size={14} className="text-[#D0D5DD] shrink-0" />
      )}
      <span className={`text-[13px] flex-1 ${m.done ? "text-[#344054] line-through decoration-[#98A2B3]" : m.inProgress ? "text-[#101828] font-medium" : "text-[#667085]"}`}>
        {m.title}
      </span>
      {m.inProgress && (
        <span className="ml-auto text-[10px] font-semibold text-[#4F7CFF] bg-[#4F7CFF]/8 border border-[#4F7CFF]/20 px-1.5 py-0.5 rounded-full shrink-0">
          In Progress
        </span>
      )}
      {!m.done && !m.inProgress && (
        <span className="ml-auto text-[10px] text-[#D0D5DD] opacity-0 group-hover:opacity-100">Mark done</span>
      )}
    </button>
  );
}

export default function RoadmapPage() {
  const navigate = useNavigate();
  const { success } = useToast();
  const [phases, setPhases] = useState(INITIAL_PHASES);

  const overallPct = Math.round(
    phases.reduce((s, p) => s + p.doneCount, 0) /
    phases.reduce((s, p) => s + p.total, 0) * 100
  );

  async function toggleMilestone(phaseIdx: number, milestoneIdx: number) {
    const phase = phases[phaseIdx];
    if (phase.status === "locked") return;
    const m = phase.milestones[milestoneIdx];
    const newDone = !m.done;
    await roadmapService[newDone ? "markComplete" : "markIncomplete"](
      `p${phaseIdx}-m${milestoneIdx}`
    );
    setPhases((prev) =>
      prev.map((p, pi) => {
        if (pi !== phaseIdx) return p;
        const newMilestones = p.milestones.map((mi, mii) =>
          mii === milestoneIdx ? { ...mi, done: newDone, inProgress: false } : mi
        );
        const doneCount = newMilestones.filter((mi) => mi.done).length;
        return { ...p, milestones: newMilestones, doneCount };
      })
    );
    if (newDone) success("Milestone completed!");
  }

  return (
    <div className="p-7 max-w-[780px] space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-[#101828] text-xl mb-1">Career Roadmap</h1>
        <p className="text-[#667085] text-[13px]">Your AI-generated path to{" "}<span className="text-[#4F7CFF] font-semibold">AI Engineer</span></p>
      </div>

      {/* Overall progress bar */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-[#4F7CFF]" />
            <span className="font-display font-semibold text-[#101828] text-[14px]">Overall Progress</span>
          </div>
          <span className="font-display font-bold text-[#4F7CFF] text-lg">{overallPct}%</span>
        </div>
        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${overallPct}%`, background: "linear-gradient(90deg, #4F7CFF, #8B7CFF)" }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {phases.map((p) => (
            <span key={p.phase} className="text-[11px]" style={{ color: STATUS_COLORS[p.status] }}>
              Phase {p.phase}
            </span>
          ))}
        </div>
      </div>

      {/* ARIA insight */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-[#4F7CFF]/6 to-[#8B7CFF]/6 border border-[#4F7CFF]/15">
        <div className="w-7 h-7 rounded-lg bg-[#4F7CFF]/10 flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-[#4F7CFF]" />
        </div>
        <p className="text-[13px] text-[#475467] leading-relaxed">
          <strong className="text-[#4F7CFF]">ARIA says:</strong> You're ahead of 68% of students targeting AI Engineering. Completing System Design will unlock Phase 3 and increase your match score with top-tier companies by 22%.
        </p>
      </div>

      {/* Phase cards */}
      <div className="space-y-4">
        {phases.map((phase, phaseIdx) => {
          const isLocked = phase.status === "locked";
          const isActive = phase.status === "active";
          const isComplete = phase.status === "complete";
          const pct = Math.round((phase.doneCount / phase.total) * 100);

          return (
            <div
              key={phase.phase}
              className="relative bg-white rounded-2xl border shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden"
              style={{ borderColor: isActive ? "#4F7CFF30" : "#E4E7EC", opacity: isLocked ? 0.65 : 1 }}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#4F7CFF]" />}
              {isComplete && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#22A06B]" />}

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: isComplete ? "#E3F9EE" : isActive ? "#EEF3FF" : "#F4F6F8" }}>
                      <PhaseIcon status={phase.status} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#98A2B3]">Phase {phase.phase}</span>
                        {isActive && <span className="text-[9px] font-bold uppercase tracking-wide text-[#4F7CFF] bg-[#EEF3FF] px-1.5 py-0.5 rounded-full border border-[#4F7CFF]/20">Active</span>}
                        {isComplete && <span className="text-[9px] font-bold uppercase tracking-wide text-[#22A06B] bg-[#E3F9EE] px-1.5 py-0.5 rounded-full border border-[#22A06B]/20">Complete</span>}
                      </div>
                      <h3 className="font-display font-bold text-[#101828] text-[15px] leading-tight">{phase.title}</h3>
                      <p className="text-[12px] text-[#667085] mt-0.5">{phase.subtitle}</p>
                    </div>
                  </div>
                  {!isLocked && (
                    <div className="text-right shrink-0">
                      <span className="font-display font-bold text-[16px]" style={{ color: isComplete ? "#22A06B" : "#4F7CFF" }}>{pct}%</span>
                      <p className="text-[11px] text-[#98A2B3]">{phase.doneCount}/{phase.total} done</p>
                    </div>
                  )}
                </div>

                {!isLocked && (
                  <div className="h-1 bg-[#F1F5F9] rounded-full mb-4 overflow-hidden">
                    <div className="h-1 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: isComplete ? "#22A06B" : "linear-gradient(90deg, #4F7CFF, #8B7CFF)" }} />
                  </div>
                )}

                {!isLocked && (
                  <div className="space-y-0.5 divide-y divide-[#F7F9FC]">
                    {phase.milestones.map((m, mi) => (
                      <MilestoneRow key={mi} m={m} phaseIdx={phaseIdx} milestoneIdx={mi} onToggle={toggleMilestone} />
                    ))}
                  </div>
                )}

                {isLocked && (
                  <div className="flex items-center gap-2 text-[13px] text-[#98A2B3]">
                    <Lock size={13} />
                    Complete Phase {phase.phase - 1} to unlock
                    <ChevronRight size={13} />
                  </div>
                )}
              </div>

              {isActive && (
                <div className="px-5 py-3 border-t border-[#F1F5F9] bg-[#F7F9FC] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={13} className="text-[#4F7CFF]" />
                    <span className="text-[12px] text-[#475467]">Next up: <strong>System Design fundamentals</strong></span>
                  </div>
                  <button
                    onClick={() => navigate("/skills")}
                    className="text-[12px] font-semibold text-[#4F7CFF] hover:underline flex items-center gap-1"
                  >
                    Continue <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
