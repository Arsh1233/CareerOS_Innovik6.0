import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Sparkles, BookOpen, Loader2, AlertCircle, Info } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useToast } from "../context/ToastContext";
import { skillsApi, type SkillGapResponse } from "../lib/api/skills";
import { ApiError, userMessage } from "../lib/api/errors";
import { useAuth } from "../context/AuthContext";

const priorityColors: Record<string, string> = {
  critical: "#E5484D",
  recommended: "#F59E0B",
  optional: "#22A06B",
};

const priorityLabel: Record<string, string> = {
  critical: "Critical",
  recommended: "Recommended",
  optional: "Optional",
};

/** Build radar data from real API response. Falls back to empty if no gaps. */
function buildRadarData(data: SkillGapResponse) {
  const matched = data.matched_skills.map((m) => ({
    skill: m.skill.length > 14 ? m.skill.slice(0, 13) + "…" : m.skill,
    current: 80,
    target: 90,
  }));
  const gaps = data.gaps.slice(0, 5).map((g) => ({
    skill: g.skill.length > 14 ? g.skill.slice(0, 13) + "…" : g.skill,
    current: g.priority === "critical" ? 25 : g.priority === "recommended" ? 45 : 60,
    target: 85,
  }));
  return [...matched.slice(0, 3), ...gaps].slice(0, 7);
}

function qualityBadge(q: string) {
  if (q === "sufficient") return { label: "Sufficient Evidence", color: "#22A06B", bg: "#E3F9EE" };
  if (q === "partial") return { label: "Partial Evidence", color: "#F59E0B", bg: "#FEF9C3" };
  if (q === "insufficient") return { label: "Insufficient Evidence", color: "#E5484D", bg: "#FFE4E6" };
  if (q === "no_requirements") return { label: "No requirements found", color: "#667085", bg: "#F1F5F9" };
  return { label: "No target role set", color: "#667085", bg: "#F1F5F9" };
}

export default function SkillsPage() {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [data, setData] = useState<SkillGapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    if (!accessToken) return;

    skillsApi.getGapAnalysis(accessToken)
      .then((resp) => {
        if (!cancelled) setData(resp);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof ApiError ? userMessage(err) : "Could not load skill gap data.";
        setErrorMsg(msg);
        toastError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [accessToken]);

  if (loading) {
    return (
      <div className="p-6 max-w-[1100px] mx-auto flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <Loader2 size={32} className="text-[#4F7CFF] animate-spin" />
        <p className="text-[#667085] text-sm">Analysing your skills…</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-6 max-w-[1100px] mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">Could not load skill analysis</p>
            <p className="text-sm text-red-600 mt-1">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { target_role, current_skills, matched_skills, gaps, total_required, matched_count, gap_count, evidence_quality } = data;
  const badge = qualityBadge(evidence_quality);
  const radarData = buildRadarData(data);
  const criticalGaps = gaps.filter((g) => g.priority === "critical").length;

  // No-role / no-requirements states
  if (evidence_quality === "no_role") {
    return (
      <div className="p-6 max-w-[1100px] mx-auto space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#101828]">Skill Gap Intelligence</h1>
        <div className="bg-[#FEF9C3] border border-[#F59E0B]/30 rounded-2xl p-6 flex items-start gap-3">
          <Info size={20} className="text-[#F59E0B] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#92400E]">No target role set</p>
            <p className="text-sm text-[#92400E] mt-1">
              Set a target role in your profile to see your personalised skill gap analysis.
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="mt-3 btn-primary text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              Go to Profile <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (evidence_quality === "no_requirements") {
    return (
      <div className="p-6 max-w-[1100px] mx-auto space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#101828]">Skill Gap Intelligence</h1>
        <div className="bg-[#F1F5F9] border border-[#E4E7EC] rounded-2xl p-6 flex items-start gap-3">
          <Info size={20} className="text-[#667085] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#344054]">No role requirements available</p>
            <p className="text-sm text-[#667085] mt-1">
              CareerOS does not yet have curated requirements for <strong>{target_role}</strong>.
              Upload your resume — we can still analyse your skills from evidence.
            </p>
            <button
              onClick={() => navigate("/resume")}
              className="mt-3 btn-primary text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              Upload Resume <ArrowRight size={13} />
            </button>
          </div>
        </div>
        {current_skills.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
            <h3 className="font-display font-semibold text-[#101828] mb-3">Your Skills ({current_skills.length} found)</h3>
            <div className="flex flex-wrap gap-2">
              {current_skills.map((s) => (
                <span key={s.normalized_key} className="px-3 py-1 text-xs font-medium bg-[#EEF3FF] text-[#4F7CFF] rounded-full border border-[#4F7CFF]/20">
                  {s.skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="fade-up">
        <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">Skill Gap Intelligence</h1>
        <p className="text-[#667085] text-sm">What are you missing for your target role?</p>
      </div>

      {/* Hero metrics */}
      <div className="grid sm:grid-cols-3 gap-4 fade-up-1">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
          <p className="text-xs text-[#667085] mb-1">Target Role</p>
          <p className="font-display text-xl font-bold text-[#4F7CFF]">{target_role}</p>
          <span
            className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
          <p className="text-xs text-[#667085] mb-1">Skills Matched</p>
          <div className="flex items-end gap-2">
            <p className="font-display text-3xl font-bold text-[#101828]">
              {total_required > 0
                ? Math.round((matched_count / total_required) * 100)
                : 0}
              <span className="text-lg text-[#98A2B3]">%</span>
            </p>
            <span className="text-xs text-[#667085] font-medium mb-1">{matched_count}/{total_required} required</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
          <p className="text-xs text-[#667085] mb-1">Critical Skill Gaps</p>
          <div className="flex items-end gap-2">
            <p className="font-display text-3xl font-bold text-[#E5484D]">{criticalGaps}</p>
            <span className="text-xs text-[#667085] mb-1">of {gap_count} total gaps</span>
          </div>
        </div>
      </div>

      {/* Chart + Gaps */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-5 fade-up-2">
        {/* Radar */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Skill Map</h3>
          <p className="text-xs text-[#667085] mb-3">Evidence vs. required for {target_role}</p>
          {radarData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#E4E7EC" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#667085" }} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
                  <Radar name="Required" dataKey="target" stroke="#E4E7EC" fill="#F1F5F9" fillOpacity={0.7} />
                  <Radar name="Current" dataKey="current" stroke="#4F7CFF" fill="#4F7CFF" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 justify-center mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded-full bg-[#4F7CFF]/50" />
                  <span className="text-xs text-[#667085]">Evidence</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded-full bg-[#E4E7EC]" />
                  <span className="text-xs text-[#667085]">Required</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-[#98A2B3] text-sm">
              Upload your resume to see skill evidence
            </div>
          )}
        </div>

        {/* Top skill gaps */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[#101828]">Top Skill Gaps</h3>
            <span className="text-xs text-[#98A2B3]">Prioritized by impact</span>
          </div>
          {gaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="w-10 h-10 rounded-full bg-[#E3F9EE] flex items-center justify-center mb-2">
                <span className="text-[#22A06B] text-xl">✓</span>
              </div>
              <p className="font-semibold text-[#344054] text-sm">No gaps found!</p>
              <p className="text-xs text-[#667085] mt-1">
                Your skills match all requirements for {target_role}.
              </p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1">
              {gaps.map((g) => {
                const color = priorityColors[g.priority] ?? "#667085";
                return (
                  <div key={g.normalized_key} className="p-3.5 rounded-xl border border-[#E4E7EC] card-hover">
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div>
                        <p className="font-semibold text-sm text-[#101828] font-display">{g.skill}</p>
                        {g.required_level && (
                          <p className="text-xs text-[#98A2B3] mt-0.5">Min level: {g.required_level}</p>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: `${color}14`, color }}
                      >
                        {priorityLabel[g.priority] ?? g.priority}
                      </span>
                    </div>

                    <p className="text-xs text-[#667085] mb-3 leading-relaxed">{g.reason}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={11} className="text-[#98A2B3]" />
                        <span className="text-xs text-[#667085] line-clamp-1">{g.recommended_action}</span>
                      </div>
                      <button
                        onClick={() => navigate("/roadmap")}
                        className="text-xs font-semibold text-[#4F7CFF] flex items-center gap-0.5 hover:gap-1.5 transition-all shrink-0 ml-2"
                      >
                        Close Gap <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Matched skills section */}
      {matched_skills.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 fade-up-3">
          <h3 className="font-display font-semibold text-[#101828] mb-3">
            Matched Skills ({matched_skills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {matched_skills.map((m) => (
              <div
                key={m.normalized_key}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E3F9EE] border border-[#22A06B]/20 rounded-full"
                title={m.evidence_summary ?? undefined}
              >
                <span className="text-[#22A06B] text-xs">✓</span>
                <span className="text-xs font-medium text-[#15803D]">{m.skill}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ARIA insight — static guidance based on evidence quality */}
      <div className="bg-gradient-to-r from-[#4F7CFF]/6 to-[#8B7CFF]/6 rounded-2xl border border-[#4F7CFF]/15 p-5 flex items-start gap-4 fade-up-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center shrink-0">
          <Sparkles size={15} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-[#4F7CFF] mb-1">ARIA Recommendation</p>
          <p className="text-sm text-[#475467] leading-relaxed">
            {gaps.length > 0
              ? `Start with the ${criticalGaps > 0 ? criticalGaps + " critical" : "highest-priority"} skill gap${criticalGaps !== 1 ? "s" : ""} first — ${gaps[0]?.skill} is the recommended first step. Build a roadmap to close them systematically.`
              : `Your skills are well-matched to ${target_role}. Consider generating a roadmap to deepen expertise and prepare for interviews.`}
          </p>
        </div>
        <button
          onClick={() => navigate("/mentor")}
          className="btn-primary text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shrink-0"
        >
          Ask ARIA <ArrowRight size={12} />
        </button>
      </div>

      {/* CTA */}
      <div className="fade-up-4">
        <button
          onClick={() => navigate("/roadmap")}
          className="btn-primary text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
        >
          Build My Learning Roadmap <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
