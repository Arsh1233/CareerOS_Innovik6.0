import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Sparkles, BookOpen, Loader2, AlertCircle, Info, ExternalLink, PlayCircle } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useToast } from "../context/ToastContext";
import { skillsApi, type SkillGapResponse } from "../lib/api/skills";
import { ApiError, userMessage } from "../lib/api/errors";
import { useAuth } from "../context/AuthContext";
import { getCourses } from "../lib/api/courses";
import type { DiscoveredCourse } from "../lib/api/types";

/** Returns the best matching course for a skill from the discovered list, or a fallback search URL. */
function courseForSkill(skill: string, courses: DiscoveredCourse[]): { title: string; url: string } | null {
  if (courses.length > 0) {
    const lower = skill.toLowerCase();
    const match = courses.find((c) =>
      c.skills_covered?.some((s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase()))
      || c.title.toLowerCase().includes(lower)
    );
    if (match) return { title: match.title, url: match.url };
  }
  // Fallback: SWAYAM search
  const query = encodeURIComponent(skill);
  return {
    title: `Search "${skill}" on SWAYAM`,
    url: `https://swayam.gov.in/explorer?searchText=${query}`,
  };
}

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
  const [courses, setCourses] = useState<DiscoveredCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
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

  useEffect(() => {
    if (!data || data.gaps.length === 0 || !accessToken) return;
    let cancelled = false;
    setCoursesLoading(true);
    getCourses()
      .then(res => {
        if (!cancelled) setCourses(res.courses);
      })
      .catch(err => {
        console.error("Failed to load courses", err);
      })
      .finally(() => {
        if (!cancelled) setCoursesLoading(false);
      });
    return () => { cancelled = true; };
  }, [data, accessToken]);

  if (loading) {
    return (
      <div className="p-6 max-w-275 mx-auto flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <Loader2 size={32} className="text-brand animate-spin" />
        <p className="text-text-3 text-sm">Analysing your skills…</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-6 max-w-275 mx-auto">
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
      <div className="p-6 max-w-275 mx-auto space-y-4">
        <h1 className="font-display text-2xl font-bold text-text-1">Skill Gap Intelligence</h1>
        <div className="bg-[#FEF9C3] border border-warning/30 rounded-2xl p-6 flex items-start gap-3">
          <Info size={20} className="text-warning shrink-0 mt-0.5" />
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
      <div className="p-6 max-w-275 mx-auto space-y-4">
        <h1 className="font-display text-2xl font-bold text-text-1">Skill Gap Intelligence</h1>
        <div className="bg-surface-2 border border-[#E4E7EC] rounded-2xl p-6 flex items-start gap-3">
          <Info size={20} className="text-text-3 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#344054]">No role requirements available</p>
            <p className="text-sm text-text-3 mt-1">
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
            <h3 className="font-display font-semibold text-text-1 mb-3">Your Skills ({current_skills.length} found)</h3>
            <div className="flex flex-wrap gap-2">
              {current_skills.map((s) => (
                <span key={s.normalized_key} className="px-3 py-1 text-xs font-medium bg-[#EEF3FF] text-brand rounded-full border border-brand/20">
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
    <div className="p-6 max-w-275 mx-auto space-y-6">
      {/* Header */}
      <div className="fade-up">
        <h1 className="font-display text-2xl font-bold text-text-1 mb-1">Skill Gap Intelligence</h1>
        <p className="text-text-3 text-sm">What are you missing for your target role?</p>
      </div>

      {/* Hero metrics */}
      <div className="grid sm:grid-cols-3 gap-4 fade-up-1">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
          <p className="text-xs text-text-3 mb-1">Target Role</p>
          <p className="font-display text-xl font-bold text-brand">{target_role}</p>
          <span
            className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
          <p className="text-xs text-text-3 mb-1">Skills Matched</p>
          <div className="flex items-end gap-2">
            <p className="font-display text-3xl font-bold text-text-1">
              {total_required > 0
                ? Math.round((matched_count / total_required) * 100)
                : 0}
              <span className="text-lg text-text-4">%</span>
            </p>
            <span className="text-xs text-text-3 font-medium mb-1">{matched_count}/{total_required} required</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
          <p className="text-xs text-text-3 mb-1">Critical Skill Gaps</p>
          <div className="flex items-end gap-2">
            <p className="font-display text-3xl font-bold text-error">{criticalGaps}</p>
            <span className="text-xs text-text-3 mb-1">of {gap_count} total gaps</span>
          </div>
        </div>
      </div>

      {/* Chart + Gaps */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-5 fade-up-2">
        {/* Radar */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-text-1 mb-1">Skill Map</h3>
          <p className="text-xs text-text-3 mb-3">Evidence vs. required for {target_role}</p>
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
                  <div className="w-3 h-1.5 rounded-full bg-brand/50" />
                  <span className="text-xs text-text-3">Evidence</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded-full bg-[#E4E7EC]" />
                  <span className="text-xs text-text-3">Required</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-65 flex items-center justify-center text-text-4 text-sm">
              Upload your resume to see skill evidence
            </div>
          )}
        </div>

        {/* Top skill gaps */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-text-1">Top Skill Gaps</h3>
            <span className="text-xs text-text-4">Prioritized by impact</span>
          </div>
          {gaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="w-10 h-10 rounded-full bg-[#E3F9EE] flex items-center justify-center mb-2">
                <span className="text-success text-xl">✓</span>
              </div>
              <p className="font-semibold text-[#344054] text-sm">No gaps found!</p>
              <p className="text-xs text-text-3 mt-1">
                Your skills match all requirements for {target_role}.
              </p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-105 pr-1">
              {gaps.map((g) => {
                const color = priorityColors[g.priority] ?? "#667085";
                return (
                  <div key={g.normalized_key} className="p-3.5 rounded-xl border border-[#E4E7EC] card-hover">
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div>
                        <p className="font-semibold text-sm text-text-1 font-display">{g.skill}</p>
                        {g.required_level && (
                          <p className="text-xs text-text-4 mt-0.5">Min level: {g.required_level}</p>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: `${color}14`, color }}
                      >
                        {priorityLabel[g.priority] ?? g.priority}
                      </span>
                    </div>

                    <p className="text-xs text-text-3 mb-3 leading-relaxed">{g.reason}</p>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <BookOpen size={11} className="text-text-4 shrink-0" />
                        <span className="text-xs text-text-3 line-clamp-1">{g.recommended_action}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {(() => {
                          const course = courseForSkill(g.skill, courses);
                          return course ? (
                            <a
                              href={course.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-violet flex items-center gap-0.5 hover:underline"
                            >
                              <PlayCircle size={11} /> Free Course
                            </a>
                          ) : null;
                        })()}
                        <button
                          onClick={() => navigate("/roadmap")}
                          className="text-xs font-semibold text-brand flex items-center gap-0.5 hover:gap-1.5 transition-all"
                        >
                          Close Gap <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Courses (SWAYAM/NPTEL) */}
      {coursesLoading && (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-8 text-center fade-up-3">
           <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet mb-3" />
           <p className="font-display font-semibold text-text-1">Hermes is finding free courses...</p>
           <p className="text-xs text-text-3 mt-1">Scanning SWAYAM and NPTEL for your skill gaps.</p>
        </div>
      )}

      {!coursesLoading && courses.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 fade-up-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-text-1">Recommended Free Courses</h3>
              <p className="text-xs text-text-3 mt-0.5">Curated from SWAYAM, NPTEL & Govt portals to close your gaps</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {courses.slice(0, 4).map((c) => (
              <div key={c.id} className="p-4 rounded-xl border border-[#E4E7EC] flex flex-col hover:border-[#D0D5DD] hover:shadow-sm transition-all bg-[#F8FAFC]">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-text-1 font-display line-clamp-2">{c.title}</h4>
                    <p className="text-xs text-text-3 mt-0.5 line-clamp-1">{c.instructor || c.provider}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E0E7FF] text-[#3730A3] shrink-0">
                    {c.provider}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3 mt-1">
                   {c.skills_covered.slice(0, 2).map(s => (
                     <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#E4E7EC] text-text-2">{s}</span>
                   ))}
                </div>

                <div className="mt-auto flex items-center justify-between pt-2 border-t border-[#E4E7EC]/50">
                  <div className="flex items-center gap-3 text-[10px] font-medium text-text-3">
                     <span>{c.duration || "Self-paced"}</span>
                     {c.has_certificate && <span className="text-success flex items-center gap-1"><Sparkles size={10}/> Certificate</span>}
                  </div>
                  <button 
                    onClick={() => window.open(c.url, '_blank')}
                    className="text-brand hover:text-[#3B82F6] flex items-center gap-1 text-xs font-semibold"
                  >
                    Enroll <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matched skills section */}
      {matched_skills.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 fade-up-3">
          <h3 className="font-display font-semibold text-text-1 mb-3">
            Matched Skills ({matched_skills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {matched_skills.map((m) => (
              <div
                key={m.normalized_key}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E3F9EE] border border-success/20 rounded-full"
                title={m.evidence_summary ?? undefined}
              >
                <span className="text-success text-xs">✓</span>
                <span className="text-xs font-medium text-[#15803D]">{m.skill}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ARIA insight — static guidance based on evidence quality */}
      <div className="bg-linear-to-r from-brand/6 to-violet/6 rounded-2xl border border-brand/15 p-5 flex items-start gap-4 fade-up-3">
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-brand to-violet flex items-center justify-center shrink-0">
          <Sparkles size={15} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-brand mb-1">ARIA Recommendation</p>
          <p className="text-sm text-text-2 leading-relaxed">
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
