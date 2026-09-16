import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Sparkles, CheckCircle, Circle, Lock, Clock, ChevronRight,
  Target, Zap, Loader2, AlertCircle, RefreshCw, Info, ExternalLink, PlayCircle,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { roadmapApi, type RoadmapResponse, type MilestoneResponse } from "../lib/api/roadmap";
import { ApiError, userMessage } from "../lib/api/errors";
import { useAuth } from "../context/AuthContext";

// ── Types ────────────────────────────────────────────────────────────────────

type PageState =
  | { kind: "loading" }
  | { kind: "no_roadmap" }
  | { kind: "generating" }
  | { kind: "success"; roadmap: RoadmapResponse }
  | { kind: "error"; message: string };

// ── Sub-components ────────────────────────────────────────────────────────────

function MilestoneRow({
  m,
  onToggle,
  locked,
}: {
  m: MilestoneResponse;
  onToggle: (id: string, current: MilestoneResponse["status"]) => void;
  locked: boolean;
}) {
  const isDone = m.status === "completed";
  const isInProgress = m.status === "in_progress";

  return (
    <button
      onClick={() => !locked && onToggle(m.id, m.status)}
      disabled={locked}
      className="flex items-center gap-2.5 py-1.5 w-full text-left hover:bg-[#F7F9FC] rounded-lg px-1 transition-colors disabled:cursor-default"
    >
      {isDone ? (
        <CheckCircle size={14} className="text-[#22A06B] shrink-0" />
      ) : isInProgress ? (
        <Clock size={14} className="text-[#4F7CFF] shrink-0" />
      ) : (
        <Circle size={14} className="text-[#D0D5DD] shrink-0" />
      )}
      <span
        className={`text-[13px] flex-1 text-left ${
          isDone
            ? "text-[#344054] line-through decoration-[#98A2B3]"
            : isInProgress
            ? "text-[#101828] font-medium"
            : "text-[#667085]"
        }`}
      >
        {m.title}
        {m.description && (
          <span className="block text-[11px] text-[#98A2B3] font-normal mt-0.5 no-underline">
            {m.description}
          </span>
        )}
      </span>
      {isInProgress && (
        <span className="ml-auto text-[10px] font-semibold text-[#4F7CFF] bg-[#4F7CFF]/8 border border-[#4F7CFF]/20 px-1.5 py-0.5 rounded-full shrink-0">
          In Progress
        </span>
      )}
    </button>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const { accessToken } = useAuth();

  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [paceHours, setPaceHours] = useState(10);
  const [updatingMilestones, setUpdatingMilestones] = useState<Set<string>>(new Set());
  const [isTwinStale, setIsTwinStale] = useState(false);

  const loadLatest = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      if (!accessToken) return;
      const roadmap = await roadmapApi.getLatestRoadmap(accessToken);
      if (roadmap) {
        setState({ kind: "success", roadmap });
      } else {
        setState({ kind: "no_roadmap" });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? userMessage(err) : "Could not load roadmap.";
      setState({ kind: "error", message: msg });
    }
  }, [accessToken]);

  useEffect(() => { loadLatest(); }, [loadLatest]);

  async function handleGenerate() {
    setState({ kind: "generating" });
    try {
      if (!accessToken) return;
      const roadmap = await roadmapApi.generateRoadmap(accessToken, paceHours);
      setState({ kind: "success", roadmap });
      setIsTwinStale(true);
      toastSuccess("Roadmap generated!");
    } catch (err) {
      const msg = err instanceof ApiError ? userMessage(err) : "Roadmap generation failed.";
      setState({ kind: "error", message: msg });
      toastError(msg);
    }
  }

  async function handleMilestoneToggle(milestoneId: string, currentStatus: MilestoneResponse["status"]) {
    if (updatingMilestones.has(milestoneId)) return;

    const newStatus: MilestoneResponse["status"] =
      currentStatus === "completed" ? "pending" : "completed";

    setUpdatingMilestones((s) => new Set(s).add(milestoneId));

    try {
      if (!accessToken) return;
      const updated = await roadmapApi.updateMilestoneStatus(accessToken, milestoneId, newStatus);
      setState((prev) => {
        if (prev.kind !== "success") return prev;
        return {
          ...prev,
          roadmap: {
            ...prev.roadmap,
            milestones: prev.roadmap.milestones.map((m) =>
              m.id === milestoneId ? updated : m
            ),
          },
        };
      });
      if (newStatus === "completed") {
        toastSuccess("Milestone completed!");
        setIsTwinStale(true);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? userMessage(err) : "Could not update milestone.";
      toastError(msg);
    } finally {
      setUpdatingMilestones((s) => {
        const next = new Set(s);
        next.delete(milestoneId);
        return next;
      });
    }
  }

  // ── Render states ─────────────────────────────────────────────────────────

  if (state.kind === "loading") {
    return (
      <div className="p-7 max-w-[780px] flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 size={32} className="text-[#4F7CFF] animate-spin" />
        <p className="text-[#667085] text-sm">Loading your roadmap…</p>
      </div>
    );
  }

  if (state.kind === "generating") {
    return (
      <div className="p-7 max-w-[780px] flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center">
          <Sparkles size={24} className="text-white animate-pulse" />
        </div>
        <p className="font-display font-bold text-[#101828] text-lg">Generating your roadmap…</p>
        <p className="text-[#667085] text-sm text-center max-w-xs">
          AI is analysing your skill gaps and building a personalised learning plan.
        </p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="p-7 max-w-[780px] space-y-4">
        <h1 className="font-display font-bold text-[#101828] text-xl">Career Roadmap</h1>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-700">Roadmap unavailable</p>
            <p className="text-sm text-red-600 mt-1">{state.message}</p>
          </div>
          <button
            onClick={loadLatest}
            className="btn-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (state.kind === "no_roadmap") {
    return (
      <div className="p-7 max-w-[780px] space-y-6">
        <div>
          <h1 className="font-display font-bold text-[#101828] text-xl mb-1">Career Roadmap</h1>
          <p className="text-[#667085] text-[13px]">Generate an AI-powered weekly learning plan</p>
        </div>

        <div className="bg-[#F1F5F9] border border-[#E4E7EC] rounded-2xl p-6 flex items-start gap-3">
          <Info size={20} className="text-[#667085] shrink-0 mt-0.5" />
          <p className="text-sm text-[#667085]">
            You don't have a roadmap yet. Generate one based on your skill gaps and target role.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#344054] mb-1">
              Available hours per week
            </label>
            <div className="flex items-center gap-3">
              <input
                id="pace-hours-input"
                type="range"
                min={2}
                max={40}
                step={2}
                value={paceHours}
                onChange={(e) => setPaceHours(Number(e.target.value))}
                className="flex-1 accent-[#4F7CFF]"
              />
              <span className="font-display font-bold text-[#4F7CFF] w-14 text-right">
                {paceHours}h/wk
              </span>
            </div>
          </div>
          <button
            id="generate-roadmap-btn"
            onClick={handleGenerate}
            className="btn-primary text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <Sparkles size={15} /> Generate My Roadmap
          </button>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  const { roadmap } = state;
  const planWeeks = (roadmap.plan as { weeks?: { week: number; theme: string; objectives: string[] }[] }).weeks ?? [];
  const milestones = roadmap.milestones;
  const totalMilestones = milestones.length;
  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const overallPct = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

  return (
    <div className="p-7 max-w-[780px] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-[#101828] text-xl mb-1">Career Roadmap</h1>
          <p className="text-[#667085] text-[13px]">
            Your AI-generated path to{" "}
            <span className="text-[#4F7CFF] font-semibold">{roadmap.target_role}</span>
          </p>
        </div>
        <button
          id="regenerate-roadmap-btn"
          onClick={handleGenerate}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#4F7CFF] border border-[#4F7CFF]/30 bg-[#EEF3FF] px-3 py-1.5 rounded-lg hover:bg-[#4F7CFF]/10 transition-colors"
          title="Regenerate roadmap"
        >
          <RefreshCw size={12} /> Regenerate
        </button>
      </div>

      {/* Career Twin stale banner */}
      {isTwinStale && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FEF9C3] border border-[#F59E0B]/30">
          <Info size={16} className="text-[#F59E0B] shrink-0" />
          <p className="text-xs text-[#92400E] flex-1">
            Your career data changed — refresh Career Twin to get updated insights.
          </p>
          <button
            onClick={() => navigate("/career-twin")}
            className="text-xs font-semibold text-[#92400E] underline shrink-0"
          >
            Refresh
          </button>
        </div>
      )}

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
        <p className="text-xs text-[#98A2B3] mt-2">
          {completedCount} of {totalMilestones} weeks completed · {roadmap.pace_hours_per_week}h/week pace
        </p>
      </div>

      {/* ARIA insight */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-[#4F7CFF]/6 to-[#8B7CFF]/6 border border-[#4F7CFF]/15">
        <div className="w-7 h-7 rounded-lg bg-[#4F7CFF]/10 flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-[#4F7CFF]" />
        </div>
        <p className="text-[13px] text-[#475467] leading-relaxed">
          <strong className="text-[#4F7CFF]">ARIA says:</strong>{" "}
          {overallPct === 0
            ? `Start with Week 1 to begin your journey toward ${roadmap.target_role}. Mark milestones complete as you finish them.`
            : overallPct === 100
            ? `Excellent work — you've completed all roadmap milestones! Consider generating a new roadmap or focusing on your job search.`
            : `You're ${overallPct}% through your roadmap. Keep the momentum — complete the next week to maintain progress toward ${roadmap.target_role}.`}
        </p>
      </div>

      {/* Week cards (milestones mapped to plan weeks) */}
      <div className="space-y-4">
        {milestones.map((milestone, idx) => {
          const week = planWeeks.find((w) => w.week === milestone.week_number);
          const isDone = milestone.status === "completed";
          const isUpdating = updatingMilestones.has(milestone.id);

          return (
            <div
              key={milestone.id}
              className="relative bg-white rounded-2xl border shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden"
              style={{ borderColor: isDone ? "#22A06B30" : "#E4E7EC" }}
            >
              {isDone && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#22A06B]" />}
              {!isDone && idx === completedCount && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#4F7CFF]" />
              )}

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: isDone ? "#E3F9EE" : idx === completedCount ? "#EEF3FF" : "#F4F6F8" }}
                    >
                      {isDone ? (
                        <CheckCircle size={18} className="text-[#22A06B]" />
                      ) : idx === completedCount ? (
                        <div className="w-5 h-5 rounded-full border-2 border-[#4F7CFF] flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#4F7CFF]" />
                        </div>
                      ) : (
                        <Lock size={16} className="text-[#D0D5DD]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#98A2B3]">
                          Week {milestone.week_number}
                        </span>
                        {!isDone && idx === completedCount && (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-[#4F7CFF] bg-[#EEF3FF] px-1.5 py-0.5 rounded-full border border-[#4F7CFF]/20">
                            Active
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-[#22A06B] bg-[#E3F9EE] px-1.5 py-0.5 rounded-full border border-[#22A06B]/20">
                            Complete
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-[#101828] text-[15px] leading-tight">
                        {milestone.title}
                      </h3>
                      {milestone.description && (
                        <p className="text-[12px] text-[#667085] mt-0.5">{milestone.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Toggle button */}
                  <button
                    id={`milestone-toggle-${milestone.id}`}
                    onClick={() => handleMilestoneToggle(milestone.id, milestone.status)}
                    disabled={isUpdating}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                    style={
                      isDone
                        ? { color: "#22A06B", borderColor: "#22A06B30", background: "#E3F9EE" }
                        : { color: "#4F7CFF", borderColor: "#4F7CFF30", background: "#EEF3FF" }
                    }
                  >
                    {isUpdating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : isDone ? (
                      <CheckCircle size={12} />
                    ) : (
                      <Circle size={12} />
                    )}
                    {isDone ? "Completed" : "Mark Done"}
                  </button>
                </div>

                {/* Week plan tasks (from plan JSONB) */}
                {week && week.objectives.length > 0 && (
                  <div className="mt-3 space-y-1 pl-12">
                    {week.objectives.slice(0, 3).map((obj, oi) => (
                      <div key={oi} className="flex items-start gap-2 text-[12px] text-[#667085]">
                        <span className="text-[#D0D5DD] mt-0.5">·</span>
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active footer */}
              {!isDone && idx === completedCount && (
                <div className="px-5 py-3 border-t border-[#F1F5F9] bg-[#F7F9FC] flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Zap size={13} className="text-[#4F7CFF]" />
                    <span className="text-[12px] text-[#475467]">
                      Next: <strong>{milestone.title}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://swayam.gov.in/explorer?searchText=${encodeURIComponent(week?.theme ?? milestone.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] font-semibold text-violet hover:underline flex items-center gap-1"
                    >
                      <PlayCircle size={12} /> Free Courses
                    </a>
                    <button
                      onClick={() => navigate("/skills")}
                      className="text-[12px] font-semibold text-[#4F7CFF] hover:underline flex items-center gap-1"
                    >
                      View Gaps <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom CTA row */}
      <div className="pt-2 flex gap-3 flex-wrap">
        <button
          onClick={() => navigate("/skills")}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#667085] border border-[#E4E7EC] px-4 py-2.5 rounded-xl hover:bg-[#F9FAFB] transition-colors"
        >
          View Skill Gaps <ChevronRight size={14} />
        </button>
        <a
          href={`https://swayam.gov.in/explorer?searchText=${encodeURIComponent(roadmap.target_role)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-semibold text-violet border border-violet/20 bg-violet/5 px-4 py-2.5 rounded-xl hover:bg-violet/10 transition-colors"
        >
          <PlayCircle size={14} /> Free Courses (SWAYAM)
        </a>
        <button
          onClick={() => navigate("/career-twin")}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#667085] border border-[#E4E7EC] px-4 py-2.5 rounded-xl hover:bg-[#F9FAFB] transition-colors"
        >
          Career Twin <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
