import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Upload, FileText, CheckCircle, AlertCircle, Info, ArrowRight, Star, X, RefreshCw, Sparkles,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { resumesApi } from "../lib/api";
import { isApiError, userMessage } from "../lib/api/errors";
import type { Resume } from "../lib/api/types";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Returns an error message, or null when the file is acceptable. */
function validateResumeFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return "Only PDF and DOCX resumes can be analysed.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "That file is larger than the 10MB limit.";
  }
  return null;
}

function ScoreArc({ value }: { value: number }) {
  const size = 120;
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 80 ? "#22A06B" : value >= 65 ? "#F59E0B" : "#E5484D";
  return (
    <div className="relative w-[120px] h-[120px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={60} cy={60} r={r} fill="none" stroke="#F1F5F9" strokeWidth={10} />
        <circle cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1) 0.3s" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold" style={{ color }}>{value}</span>
        <span className="text-[10px] text-[#667085]">/ 100</span>
      </div>
    </div>
  );
}

export default function ResumePage() {
  const navigate = useNavigate();
  const { success, error: errorToast } = useToast();
  const { accessToken } = useAuth();

  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      setResume(await resumesApi.latest(accessToken));
    } catch (err) {
      if (isApiError(err) && err.code === "resume_not_found") {
        setResume(null);
      } else {
        setError(userMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  // Opens the picker without letting the programmatic click bubble back into
  // the dropzone handler, and clears the value so the same file can be picked
  // again (an unchanged file input fires no change event).
  function openFilePicker() {
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  async function handleFile(file: File | undefined) {
    if (!file || !accessToken) return;

    const problem = validateResumeFile(file);
    if (problem) {
      errorToast(problem);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const saved = await resumesApi.upload(accessToken, file);
      setResume(saved);
      success(`"${saved.filename}" analysed successfully.`);
    } catch (err) {
      const message = userMessage(err);
      setError(message);
      errorToast(message);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!resume || !accessToken) return;
    try {
      await resumesApi.remove(accessToken, resume.id);
      setResume(null);
      success("Resume removed.");
    } catch (err) {
      errorToast(userMessage(err));
    }
  }

  // ── upload state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 max-w-[700px] mx-auto">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-10 flex items-center gap-3 text-[#667085] text-sm">
          <div className="w-4 h-4 border-2 border-[#4F7CFF] border-t-transparent rounded-full animate-spin" />
          Loading your resume…
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="p-6 max-w-[700px] mx-auto">
        <div className="fade-up mb-6">
          <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">Resume Intelligence</h1>
          <p className="text-[#667085] text-sm">Upload your resume to extract skills and see real gaps.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3.5 flex items-start gap-2.5">
            <AlertCircle size={15} className="text-[#E5484D] mt-0.5" />
            <p className="text-[13px] text-[#7F1D1D]">{error}</p>
          </div>
        )}

        {/* The input is a sibling of the dropzone, not a child: a child file
            input would re-enter this click handler when clicked. */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={openFilePicker}
          className={`fade-up-1 border-2 border-dashed rounded-2xl p-14 text-center transition-all cursor-pointer ${
            dragging ? "border-[#4F7CFF] bg-[#4F7CFF]/4" : "border-[#D0D5DD] hover:border-[#4F7CFF]/50 hover:bg-[#4F7CFF]/2"
          } ${uploading ? "pointer-events-none opacity-70" : ""}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F7CFF]/10 to-[#8B7CFF]/10 flex items-center justify-center mx-auto mb-4">
            {uploading ? <div className="w-5 h-5 border-2 border-[#4F7CFF] border-t-transparent rounded-full animate-spin" /> : <Upload size={24} className="text-[#4F7CFF]" />}
          </div>
          <h3 className="font-display font-semibold text-[#101828] mb-1">{uploading ? "Analysing…" : "Drop your resume here"}</h3>
          <p className="text-sm text-[#667085] mb-1">{uploading ? "Extracting skills and computing scores" : "or click to browse"}</p>
          {!uploading && <p className="text-xs text-[#98A2B3]">Supports PDF, DOCX · Max 10MB</p>}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 fade-up-2">
          {[
            { icon: FileText, label: "ATS Score", desc: "Compatibility check" },
            { icon: Star, label: "Role Fit", desc: "Target job alignment" },
            { icon: CheckCircle, label: "Improvements", desc: "Prioritized suggestions" },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-xl bg-white border border-[#E4E7EC] text-center">
              <item.icon size={18} className="text-[#4F7CFF] mx-auto mb-2" />
              <p className="font-semibold text-sm text-[#101828] font-display">{item.label}</p>
              <p className="text-xs text-[#98A2B3]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── analysed state ──────────────────────────────────────────────────────
  const analysis = resume.analysis;
  const improvements = analysis?.improvements ?? { critical: [], recommended: [], optional: [] };
  const tiers: { key: "critical" | "recommended" | "optional"; color: string; icon: typeof AlertCircle }[] = [
    { key: "critical", color: "#E5484D", icon: AlertCircle },
    { key: "recommended", color: "#F59E0B", icon: Info },
    { key: "optional", color: "#22A06B", icon: CheckCircle },
  ];

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="fade-up flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">Resume Intelligence</h1>
          <div className="flex items-center gap-2">
            <FileText size={13} className="text-[#667085]" />
            <span className="text-sm text-[#667085]">{resume.filename}</span>
            <span className="text-xs text-[#98A2B3]">v{resume.version}</span>
            <button onClick={handleRemove} className="text-[#98A2B3] hover:text-[#E5484D] ml-1 transition-colors" title="Remove resume">
              <X size={13} />
            </button>
            <button onClick={openFilePicker} className="flex items-center gap-1 text-xs text-[#4F7CFF] hover:underline ml-2">
              <RefreshCw size={11} /> Replace
            </button>
          </div>
          {resume.storage_path === null && (
            <p className="text-[11px] text-[#98A2B3] mt-1">
              File storage is not configured — analysis is saved, the original file is not.
            </p>
          )}
        </div>
        <button
          onClick={openFilePicker}
          disabled={uploading}
          className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-70"
        >
          {uploading ? <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Analysing…</> : <><Sparkles size={14} /> Re-analyse</>}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3.5 flex items-start gap-2.5">
          <AlertCircle size={15} className="text-[#E5484D] mt-0.5" />
          <p className="text-[13px] text-[#7F1D1D]">{error}</p>
        </div>
      )}

      {!analysis ? (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-8 text-center text-sm text-[#667085]">
          This resume has no stored analysis yet.
        </div>
      ) : (
        <>
          {/* Hero scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-up-1">
            <ScoreCard label="ATS Score" value={analysis.ats_score} />
            <ScoreCard label="Resume Quality" value={analysis.quality_score} />
            {analysis.role_fit_score !== null ? (
              <ScoreCard label={`Role Fit${analysis.target_role ? ` (${analysis.target_role})` : ""}`} value={analysis.role_fit_score} />
            ) : (
              <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 flex items-center card-hover">
                <p className="text-sm text-[#667085]">
                  Set a target role and upload a resume to see role fit.
                </p>
              </div>
            )}
          </div>

          {/* Section breakdown + improvements */}
          <div className="grid lg:grid-cols-2 gap-5 fade-up-2">
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
              <h3 className="font-display font-semibold text-[#101828] mb-4">Section Breakdown</h3>
              <div className="space-y-3">
                {analysis.sections.map((section) => (
                  <div key={section.label} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-[#475467]">{section.label}</span>
                        <span className="text-xs font-semibold text-[#101828]">{section.score}%</span>
                      </div>
                      <div className="h-1.5 bg-[#F1F5F9] rounded-full">
                        <div className="h-1.5 rounded-full" style={{
                          width: `${section.score}%`,
                          background: section.status === "good" ? "#22A06B" : section.status === "warn" ? "#F59E0B" : "#E5484D",
                          transition: "width 0.8s ease 0.2s",
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
              <h3 className="font-display font-semibold text-[#101828] mb-4">Priority Improvements</h3>
              <div className="space-y-5">
                {tiers.map((tier) => {
                  const items = improvements[tier.key];
                  if (items.length === 0) return null;
                  const Icon = tier.icon;
                  return (
                    <div key={tier.key}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={13} style={{ color: tier.color }} />
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: tier.color }}>
                          {tier.key}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div key={index} className="flex gap-2.5 p-2.5 rounded-lg bg-[#F7F9FC] border border-[#F1F5F9]">
                            <div className="w-1 rounded-full shrink-0 mt-0.5" style={{ background: tier.color }} />
                            <p className="text-xs text-[#475467] leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {Object.values(improvements).every((items) => items.length === 0) && (
                  <p className="text-sm text-[#667085]">No improvements suggested.</p>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 fade-up-3">
            <h3 className="font-display font-semibold text-[#101828] mb-3">Skills Detected</h3>
            {analysis.detected_skills.length === 0 ? (
              <p className="text-sm text-[#667085]">
                No known skills were matched in this resume's text.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {analysis.detected_skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-full bg-[#4F7CFF]/8 text-[#4F7CFF] text-xs font-medium border border-[#4F7CFF]/15">
                    {skill}
                  </span>
                ))}
                {analysis.missing_skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-full bg-[#E5484D]/8 text-[#E5484D] text-xs font-medium border border-[#E5484D]/15">
                    {skill} — Missing
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate("/skills")}
              className="mt-4 text-xs font-semibold text-[#4F7CFF] flex items-center gap-1"
            >
              View skill gap analysis <ArrowRight size={11} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const desc = value >= 80 ? "Strong" : value >= 65 ? "Above average" : "Needs work";
  return (
    <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 flex items-center gap-5 card-hover">
      <ScoreArc value={value} />
      <div>
        <p className="font-display font-semibold text-[#101828]">{label}</p>
        <p className="text-xs text-[#667085] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
