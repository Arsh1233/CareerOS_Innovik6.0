import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Info, ArrowRight, Star, X, RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { resumeService } from "../services/index";

type Section = { label: string; score: number; status: "good" | "warn" | "bad" };

const sections: Section[] = [
  { label: "Format & ATS Compatibility", score: 92, status: "good" },
  { label: "Skills & Keywords", score: 74, status: "warn" },
  { label: "Experience Descriptions", score: 78, status: "good" },
  { label: "Education & Projects", score: 88, status: "good" },
  { label: "Action Verbs & Metrics", score: 58, status: "warn" },
  { label: "Role Fit (AI Engineer)", score: 71, status: "warn" },
];

const improvements = {
  critical: [
    "Add 'MLOps', 'Kubernetes', and 'model deployment' keywords — found in 76% of target JDs",
    "Quantify ML project outcomes (e.g., 'improved accuracy by 12%, reduced inference time by 30%')",
  ],
  recommended: [
    "Move Skills section above Experience for ATS prioritization",
    "Add a concise professional summary (2–3 sentences) aligned to AI Engineer role",
    "Include GitHub profile link with active ML project repositories",
  ],
  optional: [
    "Consider adding a Publications or Talks section if applicable",
    "Expand education section with relevant coursework",
  ],
};

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
  const { success, info } = useToast();
  const [filename, setFilename] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [improving, setImproving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    await resumeService.upload(file);
    setUploading(false);
    setFilename(file.name);
    success(`"${file.name}" analysed successfully.`);
  }

  async function handleReplace() {
    fileInputRef.current?.click();
  }

  async function handleImprove() {
    setImproving(true);
    await resumeService.improve();
    setImproving(false);
    info("Improvement recommendations are highlighted below.");
  }

  async function handleRemove() {
    await resumeService.remove();
    setFilename(null);
    success("Resume removed.");
  }

  if (!filename) {
    return (
      <div className="p-6 max-w-[700px] mx-auto">
        <div className="fade-up mb-6">
          <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">Resume Intelligence</h1>
          <p className="text-[#667085] text-sm">Is your resume helping or hurting you? Upload to find out.</p>
        </div>

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
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F7CFF]/10 to-[#8B7CFF]/10 flex items-center justify-center mx-auto mb-4">
            {uploading ? <div className="w-5 h-5 border-2 border-[#4F7CFF] border-t-transparent rounded-full animate-spin" /> : <Upload size={24} className="text-[#4F7CFF]" />}
          </div>
          <h3 className="font-display font-semibold text-[#101828] mb-1">{uploading ? "Analysing…" : "Drop your resume here"}</h3>
          <p className="text-sm text-[#667085] mb-1">{uploading ? "Running ATS check and role fit analysis" : "or click to browse"}</p>
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

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="fade-up flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">Resume Intelligence</h1>
          <div className="flex items-center gap-2">
            <FileText size={13} className="text-[#667085]" />
            <span className="text-sm text-[#667085]">{filename}</span>
            <button onClick={handleRemove} className="text-[#98A2B3] hover:text-[#E5484D] ml-1 transition-colors" title="Remove resume">
              <X size={13} />
            </button>
            <button onClick={handleReplace} className="flex items-center gap-1 text-xs text-[#4F7CFF] hover:underline ml-2">
              <RefreshCw size={11} /> Replace
            </button>
          </div>
        </div>
        <button
          onClick={handleImprove}
          disabled={improving}
          className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-70"
        >
          {improving ? <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Analysing…</> : <><Sparkles size={14} /> Improve Resume</>}
        </button>
      </div>

      {/* Hero scores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-up-1">
        {[
          { label: "ATS Score", value: 81, desc: "High compatibility" },
          { label: "Resume Quality", value: 76, desc: "Above average" },
          { label: "Role Fit (AI Eng)", value: 71, desc: "Strong potential" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-[#E4E7EC] p-5 flex items-center gap-5 card-hover">
            <ScoreArc value={item.value} />
            <div>
              <p className="font-display font-semibold text-[#101828]">{item.label}</p>
              <p className="text-xs text-[#667085] mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Section breakdown + improvements */}
      <div className="grid lg:grid-cols-2 gap-5 fade-up-2">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-4">Section Breakdown</h3>
          <div className="space-y-3">
            {sections.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-[#475467]">{s.label}</span>
                    <span className="text-xs font-semibold text-[#101828]">{s.score}%</span>
                  </div>
                  <div className="h-1.5 bg-[#F1F5F9] rounded-full">
                    <div className="h-1.5 rounded-full" style={{
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
          <h3 className="font-display font-semibold text-[#101828] mb-4">Priority Improvements</h3>
          <div className="space-y-5">
            {(["critical", "recommended", "optional"] as const).map((tier) => (
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
                  {improvements[tier].map((item, i) => (
                    <div key={i} className="flex gap-2.5 p-2.5 rounded-lg bg-[#F7F9FC] border border-[#F1F5F9]">
                      <div className="w-1 rounded-full shrink-0 mt-0.5"
                        style={{ background: tier === "critical" ? "#E5484D" : tier === "recommended" ? "#F59E0B" : "#22A06B" }} />
                      <p className="text-xs text-[#475467] leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detected skills */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 fade-up-3">
        <h3 className="font-display font-semibold text-[#101828] mb-3">Skills Detected</h3>
        <div className="flex flex-wrap gap-2">
          {["Python", "TensorFlow", "PyTorch", "Scikit-learn", "SQL", "Pandas", "NumPy", "FastAPI", "Git", "Linux", "Jupyter", "Hugging Face"].map((skill) => (
            <span key={skill} className="px-2.5 py-1 rounded-full bg-[#4F7CFF]/8 text-[#4F7CFF] text-xs font-medium border border-[#4F7CFF]/15">
              {skill}
            </span>
          ))}
          {["Kubernetes", "Docker", "MLOps"].map((skill) => (
            <span key={skill} className="px-2.5 py-1 rounded-full bg-[#E5484D]/8 text-[#E5484D] text-xs font-medium border border-[#E5484D]/15">
              {skill} — Missing
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-3 fade-up-4">
        <button onClick={handleImprove} disabled={improving}
          className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-70">
          {improving ? <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Working…</> : <><ArrowRight size={14} /> Improve Resume</>}
        </button>
        <button onClick={handleReplace}
          className="px-5 py-2.5 rounded-xl border border-[#E4E7EC] text-sm text-[#667085] font-semibold hover:border-[#D0D5DD] flex items-center gap-2">
          <RefreshCw size={14} /> Replace Resume
        </button>
      </div>
    </div>
  );
}
