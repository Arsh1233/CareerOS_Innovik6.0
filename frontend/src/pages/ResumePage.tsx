import { useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Info, RefreshCw, Star, Sparkles, X } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { resumesApi, ResumeUploadResponse } from "../lib/api";

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
  const { success, error: showError, info } = useToast();
  const [resumeData, setResumeData] = useState<ResumeUploadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { session } = useAuth();

  useEffect(() => {
    loadLatest();
  }, [session?.access_token]);

  async function loadLatest() {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const latest = await resumesApi.getLatestResume(session.access_token);
      setResumeData(latest);
    } catch (err: any) {
      // Don't show error toast on initial load, just fail silently to empty state
      console.error("Failed to load resume", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    
    // Quick frontend validation to match backend rules
    if (file.type !== "application/pdf") {
      showError("Only PDF files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError("File size must be under 10MB.");
      return;
    }

    setUploading(true);
    try {
      if (!session?.access_token) throw new Error("Not authenticated");
      const res = await resumesApi.uploadResume(session.access_token, file);
      setResumeData(res);
      
      if (res.pipeline.analysis_status === "ok") {
        success(`"${file.name}" analysed successfully.`);
      } else if (res.pipeline.analysis_status === "failed") {
        showError(res.status_message || "AI Analysis failed.");
      } else if (res.pipeline.parse_status === "insufficient_text") {
        showError(res.status_message || "PDF does not contain extractable text.");
      }
    } catch (err: any) {
      showError(err.message || "Failed to upload resume.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!resumeData || !session?.access_token) return;
    
    try {
      await resumesApi.deleteResume(session.access_token, resumeData.resume_id);
      setResumeData(null);
      success("Resume removed.");
    } catch (err: any) {
      showError("Failed to remove resume.");
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-[700px] mx-auto flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-[#4F7CFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const analysisOk = resumeData?.pipeline.analysis_status === "ok";
  const analysis = resumeData?.analysis;
  const scoreBreakdown = resumeData?.score_breakdown;

  if (!resumeData || !analysisOk || !analysis || !scoreBreakdown) {
    return (
      <div className="p-6 max-w-[700px] mx-auto">
        <div className="fade-up mb-6">
          <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">Resume Intelligence</h1>
          <p className="text-[#667085] text-sm">Is your resume helping or hurting you? Upload to find out.</p>
        </div>

        {resumeData && resumeData.pipeline.analysis_status === "failed" && (
          <div className="mb-6 p-4 rounded-xl bg-[#FEF3F2] border border-[#FEE4E2] flex items-start gap-3">
            <AlertCircle size={18} className="text-[#D92D20] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#B42318]">Analysis Failed</p>
              <p className="text-sm text-[#D92D20]">{resumeData.status_message || "We couldn't analyse your resume. Please try replacing it."}</p>
            </div>
          </div>
        )}
        
        {resumeData && resumeData.pipeline.parse_status === "insufficient_text" && (
          <div className="mb-6 p-4 rounded-xl bg-[#FEF3F2] border border-[#FEE4E2] flex items-start gap-3">
            <AlertCircle size={18} className="text-[#D92D20] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#B42318]">Unparseable PDF</p>
              <p className="text-sm text-[#D92D20]">{resumeData.status_message || "Please ensure your PDF has extractable text and is not just a scanned image."}</p>
            </div>
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
          className={`fade-up-1 border-2 border-dashed rounded-2xl p-14 text-center transition-all cursor-pointer ${
            dragging ? "border-[#4F7CFF] bg-[#4F7CFF]/4" : "border-[#D0D5DD] hover:border-[#4F7CFF]/50 hover:bg-[#4F7CFF]/2"
          } ${uploading ? "pointer-events-none opacity-70" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F7CFF]/10 to-[#8B7CFF]/10 flex items-center justify-center mx-auto mb-4">
            {uploading ? <div className="w-5 h-5 border-2 border-[#4F7CFF] border-t-transparent rounded-full animate-spin" /> : <Upload size={24} className="text-[#4F7CFF]" />}
          </div>
          <h3 className="font-display font-semibold text-[#101828] mb-1">{uploading ? "Analysing…" : "Drop your resume here"}</h3>
          <p className="text-sm text-[#667085] mb-1">{uploading ? "Extracting text, running AI checks and embedding…" : "or click to browse"}</p>
          {!uploading && <p className="text-xs text-[#98A2B3]">Supports PDF only · Max 10MB</p>}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 fade-up-2">
          {[
            { icon: FileText, label: "ATS Check", desc: "Compatibility check" },
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

  // Helper to map score components
  const sections = [
    { label: "Parseability & Format", score: (scoreBreakdown.parseability / 10) * 100, status: scoreBreakdown.parseability === 10 ? "good" : "bad" as const },
    { label: "Contact & Identity", score: (scoreBreakdown.contact_completeness / 10) * 100, status: scoreBreakdown.contact_completeness === 10 ? "good" : "bad" as const },
    { label: "Education Details", score: (scoreBreakdown.education_present / 10) * 100, status: scoreBreakdown.education_present >= 8 ? "good" : scoreBreakdown.education_present > 0 ? "warn" : "bad" as const },
    { label: "Experience & Projects", score: (scoreBreakdown.experience_clarity / 15) * 100, status: scoreBreakdown.experience_clarity >= 12 ? "good" : scoreBreakdown.experience_clarity >= 8 ? "warn" : "bad" as const },
    { label: "Action Verbs & Metrics", score: (scoreBreakdown.quantified_impact / 15) * 100, status: scoreBreakdown.quantified_impact >= 12 ? "good" : scoreBreakdown.quantified_impact >= 8 ? "warn" : "bad" as const },
    { label: "Skill Evidence", score: (scoreBreakdown.skill_evidence_coverage / 15) * 100, status: scoreBreakdown.skill_evidence_coverage >= 10 ? "good" : scoreBreakdown.skill_evidence_coverage > 0 ? "warn" : "bad" as const },
  ];

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="fade-up flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">Resume Intelligence</h1>
          <div className="flex items-center gap-2">
            <FileText size={13} className="text-[#667085]" />
            <span className="text-sm text-[#667085]">{resumeData.original_filename}</span>
            <button onClick={handleRemove} className="text-[#98A2B3] hover:text-[#E5484D] ml-1 transition-colors" title="Remove resume">
              <X size={13} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs text-[#4F7CFF] hover:underline ml-2">
              <RefreshCw size={11} /> Replace
            </button>
          </div>
          {resumeData.pipeline.embedding_status === "failed" && (
            <p className="text-xs text-[#F59E0B] mt-1 flex items-center gap-1">
              <Info size={11}/> Note: Search indexing is pending. Analysis is preserved.
            </p>
          )}
        </div>
      </div>

      {/* Hero scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-up-1">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 flex items-center gap-5 card-hover relative group">
          <ScoreArc value={resumeData.resume_quality_score || 0} />
          <div>
            <div className="flex items-center gap-1">
              <p className="font-display font-semibold text-[#101828]">Resume Quality</p>
              <Info size={14} className="text-[#98A2B3] cursor-help" />
            </div>
            <p className="text-xs text-[#667085] mt-0.5">{analysis.summary.substring(0, 50)}...</p>
          </div>
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs p-2 rounded -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-10">
            CareerOS internal assessment — NOT an employer ATS prediction.
          </div>
        </div>
        
        {analysis.detected_role && (
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 flex items-center gap-5 card-hover">
            <div className="w-[120px] h-[120px] rounded-full border-[10px] border-[#F1F5F9] flex flex-col items-center justify-center shrink-0">
               <Star size={32} className="text-[#4F7CFF] mb-1" />
            </div>
            <div>
              <p className="font-display font-semibold text-[#101828]">Inferred Profile</p>
              <p className="text-xs font-semibold text-[#4F7CFF] mt-1">{analysis.detected_role}</p>
            </div>
          </div>
        )}
      </div>

      {/* Section breakdown + improvements */}
      <div className="grid lg:grid-cols-2 gap-5 fade-up-2">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-4">Quality Breakdown</h3>
          <div className="space-y-3">
            {sections.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-[#475467]">{s.label}</span>
                    <span className="text-xs font-semibold text-[#101828]">{Math.round(s.score)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${s.score}%`,
                      background: s.status === "good" ? "#22A06B" : s.status === "warn" ? "#F59E0B" : "#E5484D",
                      transition: "width 0.8s ease 0.2s",
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-4">Actionable Feedback</h3>
          <div className="space-y-5">
            {(["critical", "recommended", "optional"] as const).map((tier) => (
              analysis.recommendations[tier] && analysis.recommendations[tier].length > 0 && (
                <div key={tier}>
                  <div className="flex items-center gap-2 mb-2">
                    {tier === "critical" && <AlertCircle size={13} className="text-[#E5484D]" />}
                    {tier === "recommended" && <Info size={13} className="text-[#F59E0B]" />}
                    {tier === "optional" && <CheckCircle size={13} className="text-[#22A06B]" />}
                    <span className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: tier === "critical" ? "#E5484D" : tier === "recommended" ? "#F59E0B" : "#22A06B" }}>
                      {tier}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {analysis.recommendations[tier].map((item, i) => (
                      <div key={i} className="flex gap-2.5 p-2.5 rounded-lg bg-[#F7F9FC] border border-[#F1F5F9]">
                        <div className="w-1 rounded-full shrink-0 mt-0.5"
                          style={{ background: tier === "critical" ? "#E5484D" : tier === "recommended" ? "#F59E0B" : "#22A06B" }} />
                        <p className="text-xs text-[#475467] leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Detected skills */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 fade-up-3">
        <h3 className="font-display font-semibold text-[#101828] mb-3">Skills Detected (with evidence)</h3>
        {analysis.skills.length === 0 ? (
          <p className="text-sm text-[#667085]">No specific skills detected in the resume text.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {analysis.skills.map((skill, index) => (
              <div key={index} className="group relative">
                <span className="px-2.5 py-1 rounded-full bg-[#4F7CFF]/8 text-[#4F7CFF] text-xs font-medium border border-[#4F7CFF]/15 cursor-help inline-block">
                  {skill.name}
                </span>
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs p-2 rounded bottom-full mb-1 left-1/2 -translate-x-1/2 w-48 text-center pointer-events-none z-10 hidden sm:block">
                  <span className="font-semibold block mb-1">From {skill.source_section || "resume"}:</span>
                  {skill.evidence}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Missing Role Keywords (if any) */}
      {analysis.role_keywords_missing && analysis.role_keywords_missing.length > 0 && (
         <div className="bg-[#FEF3F2] rounded-2xl border border-[#FEE4E2] p-5 fade-up-3">
           <h3 className="font-display font-semibold text-[#B42318] mb-3">Missing Target Keywords</h3>
           <div className="flex flex-wrap gap-2">
             {analysis.role_keywords_missing.map((keyword, index) => (
               <span key={index} className="px-2.5 py-1 rounded-full bg-[#E5484D]/8 text-[#E5484D] text-xs font-medium border border-[#E5484D]/15">
                 {keyword}
               </span>
             ))}
           </div>
         </div>
      )}
    </div>
  );
}
