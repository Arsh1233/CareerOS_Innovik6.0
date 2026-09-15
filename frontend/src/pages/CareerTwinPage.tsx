import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Sparkles, TrendingUp, ArrowRight, Target, AlertCircle, RefreshCw,
  Loader2, AlertTriangle, BookOpen, FileText, MessageSquare, Briefcase,
  CheckCircle2, XCircle,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import {
  generateCareerTwin,
  getLatestCareerTwin,
  type CareerTwinResponse,
  type CareerTwinResult,
  type Strength,
  type Gap,
  type TrajectoryStage,
  type NextAction,
} from "../lib/api/careerTwin";

// ── Page States ───────────────────────────────────────────────────────────

type PageState =
  | "loading"       // Initial load — checking for existing twin
  | "no_twin"       // No twin exists — show CTA
  | "generating"    // AI generation in progress
  | "success"       // Twin loaded or just generated
  | "stale"         // Twin exists but evidence changed
  | "error";        // AI error or network error

// ── Route map for next actions ────────────────────────────────────────────

const ROUTE_MAP: Record<string, string> = {
  "/skills": "/skills",
  "/roadmap": "/roadmap",
  "/mentor": "/mentor",
  "/resume": "/resume",
  "/jobs": "/jobs",
};

// ── TwinOrb ───────────────────────────────────────────────────────────────

function TwinOrb({ targetRole }: { targetRole?: string | null }) {
  const displayRole = targetRole || "Your Twin";
  return (
    <div className="relative flex items-center justify-center w-[200px] h-[200px] mx-auto">
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#4F7CFF]/20 animate-spin" style={{ animationDuration: "20s" }} />
      <div className="absolute inset-4 rounded-full border border-[#8B7CFF]/25 animate-spin" style={{ animationDuration: "14s", animationDirection: "reverse" }} />
      <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#4F7CFF]/15 to-[#8B7CFF]/15 backdrop-blur-sm" />
      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex flex-col items-center justify-center ai-glow">
        <Sparkles size={20} className="text-white mb-0.5" />
        <span className="text-white text-[10px] font-semibold text-center px-2 leading-tight">{displayRole}</span>
      </div>
      <div className="absolute inset-0">
        {[0, 120, 240].map((deg, i) => (
          <div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              background: ["#4F7CFF", "#8B7CFF", "#55C7F3"][i],
              transform: `rotate(${deg}deg) translateX(86px)`,
              animation: `orbit ${8 + i * 2}s linear infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Evidence Coverage Bar ─────────────────────────────────────────────────

function EvidenceCoverageBar({ coverage }: { coverage: number | null }) {
  if (coverage === null) return null;
  const pct = Math.round(coverage * 100);
  const color = pct >= 70 ? "#22A06B" : pct >= 40 ? "#F59E0B" : "#E5484D";
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[#667085]">Evidence Coverage</span>
        <span className="text-xs font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="fade-up">
        <div className="h-8 w-48 bg-[#F2F4F7] rounded-lg animate-pulse" />
        <div className="h-4 w-80 bg-[#F2F4F7] rounded mt-2 animate-pulse" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5 fade-up-1">
        <div className="bg-[#F2F4F7] rounded-2xl h-[400px] animate-pulse" />
        <div className="bg-[#F2F4F7] rounded-2xl h-[400px] animate-pulse" />
        <div className="space-y-4">
          <div className="bg-[#F2F4F7] rounded-2xl h-[200px] animate-pulse" />
          <div className="bg-[#F2F4F7] rounded-2xl h-[120px] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ── Empty State (No Twin) ────────────────────────────────────────────────

function EmptyState({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="fade-up">
        <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">Career Twin</h1>
        <p className="text-[#667085] text-sm">Your AI-projected career identity. Where are you heading?</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 fade-up-1">
        <div className="relative flex items-center justify-center w-[180px] h-[180px] mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#4F7CFF]/20 animate-spin" style={{ animationDuration: "20s" }} />
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#4F7CFF]/10 to-[#8B7CFF]/10" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#4F7CFF]/30 to-[#8B7CFF]/30 flex items-center justify-center">
            <Sparkles size={28} className="text-[#4F7CFF]" />
          </div>
        </div>

        <h2 className="font-display text-xl font-bold text-[#101828] mb-2">Generate Your Career Twin</h2>
        <p className="text-[#667085] text-sm text-center max-w-md mb-6">
          Your Career Twin analyses your profile evidence to identify strengths,
          gaps, and a realistic career trajectory. No fabricated predictions —
          just honest, evidence-based guidance.
        </p>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="btn-primary text-white text-sm font-semibold py-3 px-8 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate My Career Twin
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function CareerTwinPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [twinData, setTwinData] = useState<CareerTwinResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Load existing twin on mount.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadLatest() {
      try {
        const result = await getLatestCareerTwin(user!.access_token);
        if (cancelled) return;

        if (result) {
          setTwinData(result);
          setPageState(result.is_stale ? "stale" : "success");
        } else {
          setPageState("no_twin");
        }
      } catch {
        if (cancelled) return;
        setErrorMessage("Failed to load Career Twin. Please try again.");
        setPageState("error");
      }
    }

    loadLatest();
    return () => { cancelled = true; };
  }, [user]);

  // Generate new twin.
  const handleGenerate = useCallback(async () => {
    if (!user || isGenerating) return;

    setIsGenerating(true);
    setPageState("generating");
    setErrorMessage("");

    try {
      const result = await generateCareerTwin(user.access_token);
      setTwinData(result);
      setPageState(result.is_stale ? "stale" : "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Career Twin generation failed.";
      setErrorMessage(msg);
      setPageState("error");
    } finally {
      setIsGenerating(false);
    }
  }, [user, isGenerating]);

  // Handle next action clicks.
  const handleNextAction = useCallback((action: NextAction) => {
    const route = ROUTE_MAP[action.destination];
    if (route) {
      navigate(route);
    }
  }, [navigate]);

  // ── Render states ─────────────────────────────────────────────────────

  if (!user) {
    navigate("/landing");
    return null;
  }

  if (pageState === "loading") {
    return <LoadingSkeleton />;
  }

  if (pageState === "no_twin" || pageState === "generating") {
    return <EmptyState onGenerate={handleGenerate} isGenerating={isGenerating} />;
  }

  const result: CareerTwinResult | null = twinData?.result ?? null;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="fade-up">
        <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">Career Twin</h1>
        <p className="text-[#667085] text-sm">
          {result?.target_role
            ? `Your AI-projected career identity for ${result.target_role}`
            : "Your AI-projected career identity. Where are you heading?"}
        </p>
      </div>

      {/* Error banner */}
      {pageState === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Generation Failed</p>
            <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
          </div>
          <button
            onClick={handleGenerate}
            className="ml-auto text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Stale banner */}
      {pageState === "stale" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Career Twin May Be Outdated</p>
            <p className="text-xs text-amber-600 mt-1">
              Your profile has changed since this Twin was generated. Consider regenerating for updated insights.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Refresh
          </button>
        </div>
      )}

      {/* Main content */}
      {result && (
        <>
          <div className="grid lg:grid-cols-3 gap-5 fade-up-1">
            {/* Twin Visualization + Evidence */}
            <div className="bg-gradient-to-br from-[#EEF2FF] via-[#F0F4FF] to-[#EEF2FF] dark:from-[#1a1f3e] dark:via-[#1e2455] dark:to-[#1a1f3e] rounded-2xl p-6 flex flex-col items-center ai-glow">
              <p className="text-[#4F7CFF] dark:text-[#55C7F3] text-xs font-semibold mb-5 uppercase tracking-widest">Your Career Twin</p>
              <TwinOrb targetRole={result.target_role} />

              <div className="mt-6 w-full space-y-3">
                <EvidenceCoverageBar coverage={result.evidence_coverage} />

                <div className="bg-[#4F7CFF]/8 dark:bg-white/5 rounded-xl p-3 text-center border border-[#C7D7FF] dark:border-white/8">
                  <p className="text-xs font-semibold text-[#101828] dark:text-white uppercase tracking-wider">
                    {result.evidence_quality === "sufficient" && "Good Evidence Base"}
                    {result.evidence_quality === "partial" && "More Evidence Recommended"}
                    {result.evidence_quality === "insufficient" && "Insufficient Data"}
                  </p>
                  <p className="text-[10px] text-[#667085] dark:text-white/40 mt-1">
                    {result.evidence_quality === "insufficient"
                      ? "Complete your profile for a richer Career Twin analysis."
                      : "Based on your current profile evidence."}
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-4 w-full btn-primary text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <><Loader2 size={14} className="animate-spin" /> Generating...</>
                ) : (
                  <><RefreshCw size={14} /> Improve My Twin</>
                )}
              </button>
            </div>

            {/* Radar Chart — from trajectory strengths/gaps if available */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
              <h3 className="font-display font-semibold text-[#101828] mb-1">Strengths & Gaps</h3>
              <p className="text-xs text-[#667085] mb-4">
                {result.strengths.length} strengths · {result.gaps.length} gaps identified
              </p>

              {result.strengths.length > 0 ? (
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {result.strengths.map((s: Strength, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-green-50 border border-green-100">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={13} className="text-green-600" />
                        <span className="text-xs font-semibold text-green-800">{s.title}</span>
                      </div>
                      <p className="text-[11px] text-green-700">{s.evidence}</p>
                      <p className="text-[10px] text-green-600 mt-1 italic">{s.relevance}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertCircle size={24} className="text-[#D0D5DD] mb-2" />
                  <p className="text-xs text-[#98A2B3]">Insufficient evidence to identify strengths.</p>
                  <p className="text-[10px] text-[#D0D5DD] mt-1">Add education, experience, or skills to your profile.</p>
                </div>
              )}

              {result.gaps.length > 0 && (
                <div className="mt-3 space-y-2">
                  {result.gaps.map((g: Gap, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-[#101828]">{g.skill_or_capability}</span>
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: g.priority === "critical" ? "#E5484D14" : g.priority === "recommended" ? "#F59E0B14" : "#66708514",
                            color: g.priority === "critical" ? "#E5484D" : g.priority === "recommended" ? "#F59E0B" : "#667085",
                          }}
                        >
                          {g.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#667085]">{g.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trajectory + Evidence Summary */}
            <div className="space-y-4">
              {/* Career Trajectory */}
              {result.trajectory.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={15} className="text-[#22A06B]" />
                    <span className="font-semibold text-sm text-[#101828] font-display">Career Trajectory</span>
                  </div>
                  <div className="space-y-2">
                    {result.trajectory.map((stage: TrajectoryStage, i: number) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-2.5 rounded-lg ${i === 0 ? "bg-[#4F7CFF]/6 border border-[#4F7CFF]/20" : "bg-[#F9FAFB]"}`}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? "bg-[#4F7CFF]" : "bg-[#D0D5DD]"}`} />
                        <div className="min-w-0">
                          <span className={`text-xs font-medium ${i === 0 ? "text-[#4F7CFF]" : "text-[#667085]"}`}>
                            {stage.stage}
                          </span>
                          <p className="text-[10px] text-[#98A2B3] truncate">{stage.goal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Summary */}
              <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={15} className="text-[#8B7CFF]" />
                  <span className="font-semibold text-sm text-[#101828] font-display">Your Profile</span>
                </div>
                <div className="space-y-2 text-xs text-[#667085]">
                  {result.current_position.education_context && (
                    <p><span className="font-medium text-[#101828]">Education:</span> {result.current_position.education_context}</p>
                  )}
                  {result.current_position.relevant_experience && (
                    <p><span className="font-medium text-[#101828]">Experience:</span> {result.current_position.relevant_experience}</p>
                  )}
                  {result.current_position.known_skills && (
                    <p><span className="font-medium text-[#101828]">Skills:</span> {result.current_position.known_skills}</p>
                  )}
                  {!result.current_position.education_context && !result.current_position.relevant_experience && !result.current_position.known_skills && (
                    <p className="text-[#98A2B3] italic">No profile evidence available. Complete your profile for richer analysis.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Next Actions */}
          {result.next_actions.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 fade-up-2">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight size={15} className="text-[#4F7CFF]" />
                <h3 className="font-display font-semibold text-[#101828]">Recommended Next Steps</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.next_actions.map((action: NextAction, i: number) => {
                  const route = ROUTE_MAP[action.destination];
                  const icon = ACTION_ICONS[action.destination] || <ArrowRight size={14} />;
                  return (
                    <div key={i} className="p-3.5 rounded-xl border border-[#E4E7EC] card-hover">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-[#4F7CFF]/10 flex items-center justify-center text-[#4F7CFF]">
                          {icon}
                        </div>
                        <span className="font-semibold text-sm text-[#101828] font-display">{action.title}</span>
                      </div>
                      <p className="text-[11px] text-[#667085] mb-2">{action.reason}</p>
                      {route && (
                        <button
                          onClick={() => navigate(route)}
                          className="text-xs font-semibold text-[#4F7CFF] flex items-center gap-1 hover:gap-2 transition-all"
                        >
                          Go <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {result.summary && (
            <div className="bg-[#F9FAFB] rounded-2xl border border-[#E4E7EC] p-5 fade-up-3">
              <p className="text-sm text-[#344054] leading-relaxed">{result.summary}</p>
              <div className="mt-3 flex items-center gap-3 text-[10px] text-[#98A2B3]">
                {result.model && <span>Model: {result.model}</span>}
                {result.generated_at && <span>Generated: {new Date(result.generated_at).toLocaleString()}</span>}
                <span>Version: {result.version}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Action icons ──────────────────────────────────────────────────────────

const ACTION_ICONS: Record<string, React.ReactNode> = {
  "/skills": <Target size={14} />,
  "/roadmap": <BookOpen size={14} />,
  "/mentor": <MessageSquare size={14} />,
  "/resume": <FileText size={14} />,
  "/jobs": <Briefcase size={14} />,
};
