import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Sparkles, ArrowRight, ArrowLeft, Upload, X, Plus, Trash2, Check,
} from "lucide-react";
import StepIndicator from "../../components/ui/StepIndicator";
import { FormField, TextInput, SelectField } from "../../components/ui/FormField";

type Phase = "steps" | "generating" | "result";
type Proficiency = "Beginner" | "Intermediate" | "Advanced";
type ExpCategory = "Projects" | "Internships" | "Certifications" | "Hackathons" | "Research" | "Open Source" | "Work Experience";

const STEPS = [
  { label: "ABOUT" }, { label: "DIRECTION" }, { label: "SKILLS" },
  { label: "EXPERIENCE" }, { label: "RESUME" }, { label: "PREFS" },
];

const GEN_STEPS = [
  "Building your CareerOS profile...",
  "Understanding your goals",
  "Mapping your skills",
  "Identifying priorities",
  "Preparing your dashboard",
];

const SKILL_CATS: Record<string, string[]> = {
  "Programming":  ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Swift", "Kotlin", "Rust"],
  "AI / ML":      ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch", "scikit-learn"],
  "Web":          ["React", "Next.js", "Node.js", "Vue.js", "HTML/CSS", "GraphQL", "Tailwind CSS"],
  "Cloud":        ["AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "Terraform"],
  "Databases":    ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Firebase", "Elasticsearch"],
  "Tools":        ["Git", "Figma", "Linux", "Postman", "Jira", "Excel", "Notion"],
  "Soft Skills":  ["Communication", "Leadership", "Problem Solving", "Teamwork", "Critical Thinking", "Time Management"],
};

const PROFS: Proficiency[] = ["Beginner", "Intermediate", "Advanced"];
const PROF_BG: Record<Proficiency, string> = {
  Beginner: "#F0A500",
  Intermediate: "#4F7CFF",
  Advanced: "#22A06B",
};

const EXP_CATS: ExpCategory[] = [
  "Projects", "Internships", "Certifications", "Hackathons", "Research", "Open Source", "Work Experience",
];

interface ExpEntry { title: string; description: string; }
type Experience = Record<ExpCategory, ExpEntry[]>;

function emptyExp(): Experience {
  return {
    "Projects": [], "Internships": [], "Certifications": [],
    "Hackathons": [], "Research": [], "Open Source": [], "Work Experience": [],
  };
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
        selected
          ? "bg-[#4F7CFF] border-[#4F7CFF] text-white"
          : "bg-white border-[#D0D5DD] text-[#475467] hover:border-[#4F7CFF] hover:text-[#4F7CFF]"
      }`}
    >{label}</button>
  );
}

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("steps");
  const [step, setStep] = useState(0);
  const [genIdx, setGenIdx] = useState(0);

  // Step 0 — About You
  const [about, setAbout] = useState({
    name: "", college: "", degree: "", branch: "", semester: "", gradYear: "", city: "",
  });

  // Step 1 — Career Direction
  const [direction, setDirection] = useState({
    targetRole: "", industry: "", workTypes: [] as string[], location: "", salary: "", timeline: "",
    notSure: false, interests: "", subjects: "", workStyle: "",
  });

  // Step 2 — Skills
  const [skills, setSkills] = useState<Record<string, Proficiency>>({});
  const [activeCategory, setActiveCategory] = useState("Programming");

  // Step 3 — Experience
  const [experience, setExperience] = useState<Experience>(emptyExp());
  const [addingTo, setAddingTo] = useState<ExpCategory | null>(null);
  const [newEntry, setNewEntry] = useState({ title: "", description: "" });

  // Step 4 — Resume
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeScanning, setResumeScanning] = useState(false);
  const [resumeScanned, setResumeScanned] = useState(false);

  // Step 5 — Preferences
  const [prefs, setPrefs] = useState({
    mainGoal: [] as string[], weeklyHours: "", pace: "", mentorFreq: "", notifications: "All",
  });

  // Generation animation
  useEffect(() => {
    if (phase !== "generating") return;
    if (genIdx >= GEN_STEPS.length) {
      const t = setTimeout(() => setPhase("result"), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setGenIdx(i => i + 1), 700);
    return () => clearTimeout(t);
  }, [phase, genIdx]);

  function toggleWorkType(wt: string) {
    setDirection(p => ({
      ...p,
      workTypes: p.workTypes.includes(wt) ? p.workTypes.filter(w => w !== wt) : [...p.workTypes, wt],
    }));
  }

  function toggleSkill(s: string) {
    setSkills(prev => {
      const next = { ...prev };
      if (next[s]) delete next[s]; else next[s] = "Intermediate";
      return next;
    });
  }

  function cycleProf(s: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSkills(prev => {
      const idx = PROFS.indexOf(prev[s]);
      return { ...prev, [s]: PROFS[(idx + 1) % PROFS.length] };
    });
  }

  function addExpEntry(cat: ExpCategory) {
    if (!newEntry.title.trim()) return;
    setExperience(prev => ({ ...prev, [cat]: [...prev[cat], { ...newEntry }] }));
    setNewEntry({ title: "", description: "" });
    setAddingTo(null);
  }

  function removeExpEntry(cat: ExpCategory, idx: number) {
    setExperience(prev => ({ ...prev, [cat]: prev[cat].filter((_, i) => i !== idx) }));
  }

  function handleResumeUpload(file: File) {
    setResumeFile(file);
    setResumeScanning(true);
    setResumeScanned(false);
    setTimeout(() => { setResumeScanning(false); setResumeScanned(true); }, 1800);
  }

  function toggleGoal(g: string) {
    setPrefs(p => ({
      ...p,
      mainGoal: p.mainGoal.includes(g) ? p.mainGoal.filter(x => x !== g) : [...p.mainGoal, g],
    }));
  }

  function canContinue() {
    if (step === 0) return !!(about.name && about.college && about.degree);
    if (step === 1) return direction.notSure || !!(direction.targetRole && direction.workTypes.length > 0);
    return true;
  }

  function handleContinue() {
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    setPhase("generating");
  }

  // Computed result metrics
  const skillCount = Object.keys(skills).length;
  const expCount = Object.values(experience).flat().length;
  const readiness = Math.min(95, 45 + skillCount * 5 + expCount * 3 + (resumeFile ? 10 : 0));
  const gapCount = Math.max(1, Math.min(4, 5 - Math.floor(skillCount / 3)));

  // ── Generating phase ───────────────────────────────────────────────────────
  if (phase === "generating") {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-6">
        <style>{`
          @keyframes co-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
          @keyframes co-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
        <div className="w-16 h-16 rounded-full bg-[#4F7CFF] flex items-center justify-center mb-8"
          style={{ boxShadow: "0 0 0 10px #4F7CFF18" }}>
          <Sparkles size={22} className="text-white" style={{ animation: "co-spin 2.5s linear infinite" }} />
        </div>
        <div className="h-9 flex items-center mb-2">
          <p key={genIdx} className="text-[#101828] text-xl font-semibold text-center"
            style={{ animation: "co-fade-up 0.4s ease" }}>
            {genIdx < GEN_STEPS.length ? GEN_STEPS[genIdx] : GEN_STEPS[GEN_STEPS.length - 1]}
          </p>
        </div>
        <p className="text-[#98A2B3] text-sm">Almost there...</p>
        <div className="flex gap-2 mt-10">
          {GEN_STEPS.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: i < genIdx ? "2.5rem" : "1.5rem", background: i < genIdx ? "#4F7CFF" : "#E4E7EC" }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Result phase ───────────────────────────────────────────────────────────
  if (phase === "result") {
    const targetCareer = direction.notSure ? "Exploring" : (direction.targetRole || "To be set");
    const metrics: { label: string; value: string }[] = [
      { label: "Target Career",           value: targetCareer },
      { label: "Skills Detected",         value: `${skillCount}` },
      { label: "Priority Skill Gaps",     value: `${gapCount}` },
      { label: "Career Readiness Baseline", value: `${readiness}%` },
      { label: "Recommended First Step",  value: prefs.mainGoal[0] || "Build your roadmap" },
    ];
    if (resumeFile) metrics.push({ label: "Resume ATS Baseline", value: "78%" });

    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#22A06B] flex items-center justify-center mb-5"
              style={{ boxShadow: "0 0 0 10px #22A06B18" }}>
              <Check size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#101828] text-center">Your CareerOS is Ready</h1>
            <p className="text-[#475467] text-sm mt-2 text-center max-w-sm">
              Here is what we built for you based on your goals and background.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {metrics.map(m => (
              <div key={m.label} className="bg-white rounded-2xl border border-[#E4E7EC] p-4">
                <p className="text-[10px] text-[#98A2B3] font-semibold uppercase tracking-wide mb-1">{m.label}</p>
                <p className="text-base font-bold text-[#101828] truncate">{m.value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-[#98A2B3] text-center mb-6 leading-relaxed">
            CareerOS has created your initial career profile using your goals, skills, experience, and preferences.
          </p>

          <button onClick={() => navigate("/dashboard")}
            className="w-full py-3 rounded-xl bg-[#4F7CFF] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#3D6AEF] transition-colors mb-3">
            Enter My Dashboard <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate("/profile")} className="w-full py-3 rounded-xl border border-[#D0D5DD] text-[#475467] text-sm font-semibold hover:border-[#4F7CFF] hover:text-[#4F7CFF] transition-colors">
            Review My Profile
          </button>
        </div>
      </div>
    );
  }

  // ── Step content ───────────────────────────────────────────────────────────
  const stepTitles = [
    { title: "Let's build your CareerOS profile",     sub: "Tell us about your academic background" },
    { title: "Where do you want to go?",              sub: "Define your career direction" },
    { title: "What do you already know?",             sub: "Select skills and proficiency levels" },
    { title: "What have you already built?",          sub: "Add experience — all fields are optional" },
    { title: "Let CareerOS understand you better",    sub: "Upload your resume for AI analysis (optional)" },
    { title: "How should CareerOS guide you?",        sub: "Set your learning and mentorship preferences" },
  ];

  function renderStep() {
    switch (step) {
      // ── Step 0: About You ──────────────────────────────────────────
      case 0: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full Name" required>
              <TextInput value={about.name} onChange={e => setAbout(p => ({ ...p, name: e.target.value }))} placeholder="Aditya Kumar" />
            </FormField>
            <FormField label="City / Location">
              <TextInput value={about.city} onChange={e => setAbout(p => ({ ...p, city: e.target.value }))} placeholder="Bangalore" />
            </FormField>
          </div>
          <FormField label="College / University" required>
            <TextInput value={about.college} onChange={e => setAbout(p => ({ ...p, college: e.target.value }))} placeholder="IIT Bombay" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Degree" required>
              <SelectField value={about.degree} onChange={e => setAbout(p => ({ ...p, degree: e.target.value }))}
                placeholder="Select degree" options={[
                  { value: "B.Tech", label: "B.Tech / B.E." }, { value: "BCA", label: "BCA" },
                  { value: "B.Sc", label: "B.Sc" }, { value: "MCA", label: "MCA" },
                  { value: "M.Tech", label: "M.Tech" }, { value: "MBA", label: "MBA" }, { value: "Ph.D", label: "Ph.D" },
                ]} />
            </FormField>
            <FormField label="Branch / Specialization" required>
              <TextInput value={about.branch} onChange={e => setAbout(p => ({ ...p, branch: e.target.value }))} placeholder="Computer Science" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Current Semester / Year">
              <SelectField value={about.semester} onChange={e => setAbout(p => ({ ...p, semester: e.target.value }))}
                placeholder="Select" options={[
                  "1st Sem","2nd Sem","3rd Sem","4th Sem","5th Sem","6th Sem","7th Sem","8th Sem",
                  "1st Year","2nd Year","3rd Year","4th Year",
                ].map(v => ({ value: v, label: v }))} />
            </FormField>
            <FormField label="Graduation Year">
              <SelectField value={about.gradYear} onChange={e => setAbout(p => ({ ...p, gradYear: e.target.value }))}
                placeholder="Year" options={["2024","2025","2026","2027","2028"].map(v => ({ value: v, label: v }))} />
            </FormField>
          </div>
        </div>
      );

      // ── Step 1: Career Direction ───────────────────────────────────
      case 1: return (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-[#475467] mb-2 block">Preferred Work Type</label>
            <div className="flex flex-wrap gap-2">
              {["Internship","Full-Time","Freelance","Exploring"].map(wt => (
                <Chip key={wt} label={wt} selected={direction.workTypes.includes(wt)} onClick={() => toggleWorkType(wt)} />
              ))}
            </div>
          </div>

          <button type="button"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#D0D5DD] hover:border-[#4F7CFF] transition-colors text-left"
            onClick={() => setDirection(p => ({ ...p, notSure: !p.notSure }))}>
            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all ${direction.notSure ? "bg-[#4F7CFF] border-[#4F7CFF]" : "border-[#D0D5DD]"}`}>
              {direction.notSure && <Check size={11} className="text-white" />}
            </div>
            <span className="text-sm text-[#475467]">{"I'm not sure yet — help me explore"}</span>
          </button>

          {direction.notSure ? (
            <div className="space-y-4 p-4 bg-[#F0F4FF] rounded-xl border border-[#C7D7FF]">
              <p className="text-xs text-[#4F7CFF] font-semibold">CareerOS will suggest career paths based on your interests</p>
              <FormField label="What interests you most?">
                <TextInput value={direction.interests} onChange={e => setDirection(p => ({ ...p, interests: e.target.value }))} placeholder="AI, design, finance, healthcare..." />
              </FormField>
              <FormField label="Favourite subjects in college">
                <TextInput value={direction.subjects} onChange={e => setDirection(p => ({ ...p, subjects: e.target.value }))} placeholder="Data structures, statistics, economics..." />
              </FormField>
              <div>
                <label className="text-xs font-semibold text-[#475467] mb-2 block">Preferred work style</label>
                <div className="flex gap-2 flex-wrap">
                  {["Remote","In-Office","Hybrid","Flexible"].map(ws => (
                    <Chip key={ws} label={ws} selected={direction.workStyle === ws} onClick={() => setDirection(p => ({ ...p, workStyle: ws }))} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Target Role">
                  <TextInput value={direction.targetRole} onChange={e => setDirection(p => ({ ...p, targetRole: e.target.value }))} placeholder="AI Engineer, Product Manager..." />
                </FormField>
                <FormField label="Preferred Industry">
                  <SelectField value={direction.industry} onChange={e => setDirection(p => ({ ...p, industry: e.target.value }))}
                    placeholder="Select" options={["Technology","Finance","Healthcare","E-commerce","Education","Consulting","Other"].map(v => ({ value: v, label: v }))} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Preferred Location">
                  <TextInput value={direction.location} onChange={e => setDirection(p => ({ ...p, location: e.target.value }))} placeholder="Bangalore, Remote..." />
                </FormField>
                <FormField label="Target Salary">
                  <SelectField value={direction.salary} onChange={e => setDirection(p => ({ ...p, salary: e.target.value }))}
                    placeholder="Select" options={["Any","₹5–10 LPA","₹10–20 LPA","₹20+ LPA","₹5K–15K/mo","₹15K–30K/mo"].map(v => ({ value: v, label: v }))} />
                </FormField>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#475467] mb-2 block">Career Timeline</label>
                <div className="flex gap-2 flex-wrap">
                  {["Next 1 month","Next 3 months","Next 6 months","1 year+"].map(t => (
                    <Chip key={t} label={t} selected={direction.timeline === t} onClick={() => setDirection(p => ({ ...p, timeline: t }))} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );

      // ── Step 2: Skills ─────────────────────────────────────────────
      case 2: return (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {Object.keys(SKILL_CATS).map(cat => (
              <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeCategory === cat ? "bg-[#4F7CFF] border-[#4F7CFF] text-white" : "border-[#D0D5DD] text-[#475467] hover:border-[#4F7CFF]"
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 min-h-[80px] p-3 bg-[#F8F9FC] rounded-xl border border-[#E4E7EC]">
            {SKILL_CATS[activeCategory].map(s => {
              const prof = skills[s];
              return (
                <button key={s} type="button" onClick={() => toggleSkill(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    prof ? "text-white border-transparent" : "border-[#D0D5DD] text-[#475467] bg-white hover:border-[#4F7CFF]"
                  }`}
                  style={prof ? { background: PROF_BG[prof] } : {}}>
                  {s}
                  {prof && (
                    <span className="bg-white/25 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none"
                      onClick={e => cycleProf(s, e)}>
                      {prof[0]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {Object.keys(skills).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#475467] mb-2">
                Selected ({Object.keys(skills).length}) — click proficiency badge to cycle B→I→A
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(skills).map(([s, p]) => (
                  <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ background: PROF_BG[p] }}>
                    {s}
                    <button type="button" onClick={() => toggleSkill(s)} className="hover:opacity-70 ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

      // ── Step 3: Experience ─────────────────────────────────────────
      case 3: return (
        <div className="space-y-3">
          <p className="text-xs text-[#98A2B3]">All sections are optional. Add what you have — even one project counts.</p>
          {EXP_CATS.map(cat => {
            const entries = experience[cat];
            const isAdding = addingTo === cat;
            return (
              <div key={cat} className="border border-[#E4E7EC] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-white">
                  <span className="text-sm font-semibold text-[#344054]">{cat}</span>
                  <div className="flex items-center gap-3">
                    {entries.length > 0 && <span className="text-xs text-[#98A2B3]">{entries.length}</span>}
                    <button type="button" onClick={() => setAddingTo(isAdding ? null : cat)}
                      className="text-xs text-[#4F7CFF] font-semibold hover:underline flex items-center gap-0.5">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                </div>
                {entries.length > 0 && (
                  <div className="px-4 pb-3 space-y-2 bg-[#F8F9FC]">
                    {entries.map((e, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 pt-2 border-t border-[#E4E7EC]">
                        <div>
                          <p className="text-sm font-medium text-[#101828]">{e.title}</p>
                          {e.description && <p className="text-xs text-[#98A2B3] mt-0.5">{e.description}</p>}
                        </div>
                        <button type="button" onClick={() => removeExpEntry(cat, i)}
                          className="text-[#D0D5DD] hover:text-[#E5484D] transition-colors shrink-0 mt-0.5">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {isAdding && (
                  <div className="px-4 py-3 bg-[#F0F4FF] border-t border-[#C7D7FF] space-y-2">
                    <TextInput value={newEntry.title} onChange={e => setNewEntry(p => ({ ...p, title: e.target.value }))}
                      placeholder={`${cat} title or name`} />
                    <TextInput value={newEntry.description} onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description (optional)" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => addExpEntry(cat)}
                        className="px-3 py-1.5 bg-[#4F7CFF] text-white text-xs font-semibold rounded-lg hover:bg-[#3D6AEF] transition-colors">
                        Add
                      </button>
                      <button type="button" onClick={() => { setAddingTo(null); setNewEntry({ title: "", description: "" }); }}
                        className="px-3 py-1.5 border border-[#D0D5DD] text-[#475467] text-xs font-semibold rounded-lg hover:bg-white transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );

      // ── Step 4: Resume ─────────────────────────────────────────────
      case 4: return (
        <div className="space-y-5">
          <p className="text-xs text-[#98A2B3]">Optional. CareerOS will detect skills and experience from your resume without overwriting what you entered.</p>
          {!resumeFile ? (
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#D0D5DD] rounded-2xl p-10 cursor-pointer hover:border-[#4F7CFF] hover:bg-[#F0F4FF] transition-all">
              <Upload size={28} className="text-[#98A2B3]" />
              <div className="text-center">
                <p className="text-sm font-semibold text-[#344054]">Drop your resume or click to upload</p>
                <p className="text-xs text-[#98A2B3] mt-1">PDF up to 10 MB</p>
              </div>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); }} />
            </label>
          ) : resumeScanning ? (
            <div className="border border-[#E4E7EC] rounded-2xl p-8 flex flex-col items-center gap-3 bg-white">
              <div className="w-10 h-10 rounded-full border-2 border-[#4F7CFF] border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-[#344054]">Scanning your resume...</p>
              <p className="text-xs text-[#98A2B3]">Detecting skills, experience, and education</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F0F4FF] rounded-xl border border-[#C7D7FF]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#4F7CFF] flex items-center justify-center shrink-0">
                    <Upload size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#101828]">{resumeFile.name}</p>
                    <p className="text-xs text-[#98A2B3]">{(resumeFile.size / 1024).toFixed(0)} KB · Scanned</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setResumeFile(null); setResumeScanned(false); }}
                  className="text-[#98A2B3] hover:text-[#E5484D] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {resumeScanned && (
                <div className="bg-white border border-[#E4E7EC] rounded-xl overflow-hidden">
                  <p className="text-xs font-semibold text-[#344054] px-4 pt-4 pb-2">We found these details in your resume</p>
                  {[
                    { label: "Skills detected", value: "Python, Machine Learning, React, SQL" },
                    { label: "Education", value: `${about.degree || "B.Tech"} — ${about.college || "University"}` },
                    { label: "Experience", value: "2 internships, 3 projects identified" },
                  ].map(item => (
                    <div key={item.label} className="flex items-start justify-between gap-4 px-4 py-3 border-t border-[#F1F5F9]">
                      <div>
                        <p className="text-[10px] text-[#98A2B3] uppercase tracking-wide">{item.label}</p>
                        <p className="text-sm text-[#101828] font-medium mt-0.5">{item.value}</p>
                      </div>
                      <div className="flex gap-2 shrink-0 mt-1">
                        <button type="button" className="text-xs text-[#22A06B] font-semibold border border-[#22A06B] px-2 py-1 rounded-lg hover:bg-[#F0FFF8] transition-colors">Add</button>
                        <button type="button" className="text-xs text-[#98A2B3] font-semibold border border-[#D0D5DD] px-2 py-1 rounded-lg hover:bg-[#F8F9FC] transition-colors">Ignore</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );

      // ── Step 5: Preferences ────────────────────────────────────────
      case 5: return (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-[#475467] mb-2 block">Main Goal <span className="text-[#98A2B3] font-normal">(pick all that apply)</span></label>
            <div className="flex flex-wrap gap-2">
              {["Get an Internship","Get Placed","Improve Resume","Prepare for Interviews","Build Skills","Explore Careers"].map(g => (
                <Chip key={g} label={g} selected={prefs.mainGoal.includes(g)} onClick={() => toggleGoal(g)} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#475467] mb-2 block">Weekly Learning Hours</label>
            <div className="flex flex-wrap gap-2">
              {["Less than 2h","2–5h","5–10h","10h+"].map(h => (
                <Chip key={h} label={h} selected={prefs.weeklyHours === h} onClick={() => setPrefs(p => ({ ...p, weeklyHours: h }))} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#475467] mb-2 block">Preferred Learning Pace</label>
            <div className="flex gap-2">
              {["Slow & Steady","Moderate","Intensive"].map(pace => (
                <Chip key={pace} label={pace} selected={prefs.pace === pace} onClick={() => setPrefs(p => ({ ...p, pace }))} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#475467] mb-2 block">Mentor Guidance</label>
            <div className="flex gap-2 flex-wrap">
              {["Weekly check-ins","On-demand","Monthly milestones","None for now"].map(mf => (
                <Chip key={mf} label={mf} selected={prefs.mentorFreq === mf} onClick={() => setPrefs(p => ({ ...p, mentorFreq: mf }))} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#475467] mb-2 block">Notifications</label>
            <div className="flex gap-2">
              {["All","Important only","None"].map(n => (
                <Chip key={n} label={n} selected={prefs.notifications === n} onClick={() => setPrefs(p => ({ ...p, notifications: n }))} />
              ))}
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[#E4E7EC] bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="font-bold text-sm text-[#101828]">CareerOS</span>
          <span className="text-[#E4E7EC] mx-1">·</span>
          <span className="text-xs text-[#98A2B3]">Student Onboarding</span>
        </div>
        <button onClick={() => navigate("/dashboard")} className="text-xs text-[#98A2B3] hover:text-[#667085] transition-colors">
          Skip for now
        </button>
      </header>

      <div className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-[600px]">
          <div className="mb-8">
            <StepIndicator steps={STEPS} current={step} accentColor="#4F7CFF" />
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
            <div className="px-7 py-5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#4F7CFF]/10 flex items-center justify-center text-[#4F7CFF] text-sm font-bold">
                  {step + 1}
                </div>
                <div>
                  <h2 className="font-bold text-[#101828]">{stepTitles[step].title}</h2>
                  <p className="text-xs text-[#98A2B3]">{stepTitles[step].sub}</p>
                </div>
                <span className="ml-auto text-xs text-[#98A2B3]">{step + 1} / {STEPS.length}</span>
              </div>
            </div>

            <div className="px-7 py-6">{renderStep()}</div>

            <div className="px-7 py-4 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
              <button type="button" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                className="flex items-center gap-1.5 text-sm text-[#667085] hover:text-[#475467] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
              <button type="button" onClick={handleContinue} disabled={!canContinue()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #4F7CFF, #8B7CFF)", boxShadow: "0 4px 14px rgba(79,124,255,0.3)" }}>
                {step === STEPS.length - 1 ? <><Sparkles size={14} /> Build My Profile</> : <>Continue <ArrowRight size={14} /></>}
              </button>
            </div>
          </div>

          <div className="mt-4 h-1 bg-[#E4E7EC] rounded-full overflow-hidden">
            <div className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: "linear-gradient(90deg, #4F7CFF, #8B7CFF)" }} />
          </div>
          <p className="text-center text-[10px] text-[#98A2B3] mt-2">
            {Math.round(((step + 1) / STEPS.length) * 100)}% complete · Progress auto-saved
          </p>
        </div>
      </div>
    </div>
  );
}
