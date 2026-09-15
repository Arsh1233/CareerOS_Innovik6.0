import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Users, ArrowRight, ArrowLeft, Plus, Trash2, Check, Sparkles } from "lucide-react";
import StepIndicator from "../../components/ui/StepIndicator";
import { FormField, TextInput, SelectField } from "../../components/ui/FormField";

type Phase = "steps" | "generating" | "result";

const STEPS = [
  { label: "ABOUT" }, { label: "COMPANY" }, { label: "HIRING" },
  { label: "CANDIDATES" }, { label: "PREFS" },
];

const GEN_STEPS = [
  "Building your Talent Workspace...",
  "Configuring candidate matching",
  "Setting up your talent pool",
  "Calibrating match algorithms",
  "Preparing your dashboard",
];

const TECH_SKILLS = [
  "Python","JavaScript","TypeScript","Java","C++","Go","React","Node.js",
  "TensorFlow","PyTorch","ML","LLMs","MLOps","AWS","GCP","Docker","Kubernetes",
  "SQL","FastAPI","System Design","REST APIs","CI/CD","Spark","NLP",
];
const SOFT_SKILLS = ["Communication","Leadership","Problem Solving","Teamwork","Critical Thinking","Adaptability"];

interface HiringRole { role: string; type: string; level: string; location: string; salary: string; }

const PRESET_ROLES = ["AI Engineer","ML Engineer","Data Scientist","Backend Engineer","Product Manager","Frontend Engineer","DevOps Engineer"];

function Chip({ label, selected, onClick, accent = "#8B7CFF" }: { label: string; selected: boolean; onClick: () => void; accent?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
        selected ? "text-white border-transparent" : "bg-white border-[#D0D5DD] text-[#475467]"
      }`}
      style={selected ? { background: accent } : {}}>
      {label}
    </button>
  );
}

export default function RecruiterOnboarding() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("steps");
  const [step, setStep] = useState(0);
  const [genIdx, setGenIdx] = useState(0);

  // Step 0 — About You
  const [personal, setPersonal] = useState({
    name: "", title: "", email: "", phone: "", linkedin: "",
  });

  // Step 1 — Company
  const [company, setCompany] = useState({
    name: "", industry: "", size: "", website: "", hq: "", hiringLocations: "",
  });

  // Step 2 — Hiring Needs
  const [notHiring, setNotHiring] = useState(false);
  const [roles, setRoles] = useState<HiringRole[]>([]);
  const [addingRole, setAddingRole] = useState(false);
  const [newRole, setNewRole] = useState<HiringRole>({ role: "", type: "Full-Time", level: "Fresher", location: "", salary: "" });

  // Step 3 — Candidate Requirements
  const [mustHave, setMustHave] = useState<string[]>([]);
  const [goodToHave, setGoodToHave] = useState<string[]>([]);
  const [requirements, setRequirements] = useState({
    gradYear: "", degree: "", minScore: "70", location: "", availability: "",
  });

  // Step 4 — Hiring Preferences
  const [prefs, setPrefs] = useState({
    monthlyVolume: "", campusInterest: "", preferredColleges: [] as string[],
    internshipHiring: "", discoveryPref: "",
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

  function toggleMustHave(s: string) {
    if (goodToHave.includes(s)) setGoodToHave(p => p.filter(x => x !== s));
    setMustHave(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  }

  function toggleGoodToHave(s: string) {
    if (mustHave.includes(s)) setMustHave(p => p.filter(x => x !== s));
    setGoodToHave(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  }

  function toggleCollege(c: string) {
    setPrefs(p => ({
      ...p,
      preferredColleges: p.preferredColleges.includes(c) ? p.preferredColleges.filter(x => x !== c) : [...p.preferredColleges, c],
    }));
  }

  function addPresetRole(name: string) {
    setRoles(p => [...p, { role: name, type: "Full-Time", level: "Fresher", location: "", salary: "" }]);
  }

  function addCustomRole() {
    if (!newRole.role.trim()) return;
    setRoles(p => [...p, { ...newRole }]);
    setNewRole({ role: "", type: "Full-Time", level: "Fresher", location: "", salary: "" });
    setAddingRole(false);
  }

  function removeRole(i: number) {
    setRoles(p => p.filter((_, idx) => idx !== i));
  }

  function updateRole(i: number, k: keyof HiringRole, v: string) {
    setRoles(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  }

  function canContinue() {
    if (step === 0) return !!(personal.name && personal.email);
    if (step === 1) return !!(company.name && company.industry);
    return true;
  }

  function handleContinue() {
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    setPhase("generating");
  }

  // ── Generating phase ───────────────────────────────────────────────────────
  if (phase === "generating") {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-6">
        <style>{`
          @keyframes co-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
          @keyframes co-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-8"
          style={{ background: "linear-gradient(135deg, #8B7CFF, #55C7F3)", boxShadow: "0 0 0 10px #8B7CFF18" }}>
          <Sparkles size={22} className="text-white" style={{ animation: "co-spin 2.5s linear infinite" }} />
        </div>
        <div className="h-9 flex items-center mb-2">
          <p key={genIdx} className="text-[#101828] text-xl font-semibold text-center"
            style={{ animation: "co-fade-up 0.4s ease" }}>
            {genIdx < GEN_STEPS.length ? GEN_STEPS[genIdx] : GEN_STEPS[GEN_STEPS.length - 1]}
          </p>
        </div>
        <p className="text-[#98A2B3] text-sm">Configuring your talent workspace...</p>
        <div className="flex gap-2 mt-10">
          {GEN_STEPS.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: i < genIdx ? "2.5rem" : "1.5rem", background: i < genIdx ? "#8B7CFF" : "#E4E7EC" }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Result phase ───────────────────────────────────────────────────────────
  if (phase === "result") {
    const priorityRole = roles[0]?.role || (notHiring ? "Talent Exploration" : "Not set");
    const metrics = [
      { label: "Active Hiring Roles", value: notHiring ? "Exploring" : `${roles.length}` },
      { label: "Priority Role",       value: priorityRole },
      { label: "Must-Have Skills",    value: mustHave.length > 0 ? mustHave.slice(0, 3).join(" · ") : "—" },
      { label: "Minimum Match Score", value: `${requirements.minScore}%` },
      { label: "Talent Search",       value: "Configured" },
    ];
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
              style={{ background: "linear-gradient(135deg, #8B7CFF, #55C7F3)", boxShadow: "0 0 0 10px #8B7CFF18" }}>
              <Check size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#101828] text-center">Your Talent Intelligence Workspace is Ready</h1>
            <p className="text-[#475467] text-sm mt-2 text-center max-w-sm">
              CareerOS has configured your recruiting workspace based on your hiring needs.
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
            CareerOS will surface candidates matching your requirements. You can refine filters anytime from the Talent Search.
          </p>

          <button onClick={() => navigate("/recruiter")}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors mb-3"
            style={{ background: "linear-gradient(135deg, #8B7CFF, #55C7F3)" }}>
            Discover Candidates <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate("/recruiter/settings")} className="w-full py-3 rounded-xl border border-[#D0D5DD] text-[#475467] text-sm font-semibold hover:border-[#8B7CFF] hover:text-[#8B7CFF] transition-colors">
            Review Recruiter Profile
          </button>
        </div>
      </div>
    );
  }

  // ── Step content ───────────────────────────────────────────────────────────
  const stepTitles = [
    { title: "Tell us about yourself",               sub: "Set up your recruiter identity" },
    { title: "About your company",                   sub: "Help students understand where they are applying" },
    { title: "What roles are you hiring for?",       sub: "Define your current hiring needs" },
    { title: "What makes a great candidate?",        sub: "Set your candidate requirements and filters" },
    { title: "Calibrate your talent search",         sub: "Fine-tune how CareerOS discovers candidates for you" },
  ];

  function renderStep() {
    switch (step) {
      // ── Step 0: About You ──────────────────────────────────────────
      case 0: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full Name" required>
              <TextInput value={personal.name} onChange={e => setPersonal(p => ({ ...p, name: e.target.value }))}
                placeholder="Priya Sharma" />
            </FormField>
            <FormField label="Job Title">
              <TextInput value={personal.title} onChange={e => setPersonal(p => ({ ...p, title: e.target.value }))}
                placeholder="TA Lead / HR Manager" />
            </FormField>
          </div>
          <FormField label="Work Email" required>
            <TextInput type="email" value={personal.email} onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))}
              placeholder="priya@company.com" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone">
              <TextInput type="tel" value={personal.phone} onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="LinkedIn URL">
              <TextInput value={personal.linkedin} onChange={e => setPersonal(p => ({ ...p, linkedin: e.target.value }))}
                placeholder="linkedin.com/in/priya" />
            </FormField>
          </div>
        </div>
      );

      // ── Step 1: Company ────────────────────────────────────────────
      case 1: return (
        <div className="space-y-4">
          <FormField label="Company Name" required>
            <TextInput value={company.name} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))}
              placeholder="Flipkart Internet Pvt. Ltd." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Industry" required>
              <SelectField value={company.industry} onChange={e => setCompany(p => ({ ...p, industry: e.target.value }))}
                placeholder="Select" options={[
                  { value: "tech",    label: "Technology / Software" },
                  { value: "ai",      label: "AI / Machine Learning" },
                  { value: "fintech", label: "Fintech / Banking" },
                  { value: "ecom",    label: "E-Commerce / Retail" },
                  { value: "health",  label: "Healthcare / Biotech" },
                  { value: "consult", label: "Consulting / Services" },
                  { value: "edtech",  label: "EdTech" },
                  { value: "other",   label: "Other" },
                ]} />
            </FormField>
            <FormField label="Company Size">
              <SelectField value={company.size} onChange={e => setCompany(p => ({ ...p, size: e.target.value }))}
                placeholder="Select size" options={[
                  { value: "1-10",    label: "1–10 (Startup)" },
                  { value: "11-50",   label: "11–50" },
                  { value: "51-200",  label: "51–200" },
                  { value: "201-500", label: "201–500" },
                  { value: "500+",    label: "500+ (Enterprise)" },
                ]} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Website">
              <TextInput value={company.website} onChange={e => setCompany(p => ({ ...p, website: e.target.value }))}
                placeholder="www.flipkart.com" />
            </FormField>
            <FormField label="Headquarters">
              <TextInput value={company.hq} onChange={e => setCompany(p => ({ ...p, hq: e.target.value }))}
                placeholder="Bangalore, India" />
            </FormField>
          </div>
          <FormField label="Hiring Locations">
            <TextInput value={company.hiringLocations} onChange={e => setCompany(p => ({ ...p, hiringLocations: e.target.value }))}
              placeholder="Bangalore, Hyderabad, Remote" />
          </FormField>
        </div>
      );

      // ── Step 2: Hiring Needs ───────────────────────────────────────
      case 2: return (
        <div className="space-y-4">
          <button type="button"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#D0D5DD] hover:border-[#8B7CFF] transition-colors text-left"
            onClick={() => setNotHiring(p => !p)}>
            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all ${notHiring ? "border-transparent" : "border-[#D0D5DD]"}`}
              style={notHiring ? { background: "#8B7CFF" } : {}}>
              {notHiring && <Check size={11} className="text-white" />}
            </div>
            <div>
              <span className="text-sm font-medium text-[#344054]">{"Not hiring right now"}</span>
              <p className="text-xs text-[#98A2B3]">{"I'll explore the talent pool and search passively"}</p>
            </div>
          </button>

          {!notHiring && (
            <>
              <div>
                <p className="text-xs font-semibold text-[#475467] mb-2">Quick-add target roles</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ROLES.map(r => (
                    <button key={r} type="button" onClick={() => addPresetRole(r)}
                      className="px-2.5 py-1 rounded-full text-xs border border-[#E4E7EC] text-[#667085] hover:border-[#8B7CFF]/50 hover:text-[#8B7CFF] transition-colors">
                      + {r}
                    </button>
                  ))}
                </div>
              </div>

              {roles.length > 0 && (
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {roles.map((role, i) => (
                    <div key={i} className="p-3 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] space-y-2">
                      <div className="flex items-center gap-2">
                        <TextInput value={role.role} onChange={e => updateRole(i, "role", e.target.value)}
                          placeholder="Role title" className="flex-1" />
                        <button type="button" onClick={() => removeRole(i)} className="text-[#D0D5DD] hover:text-[#E5484D] transition-colors shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <SelectField value={role.type} onChange={e => updateRole(i, "type", e.target.value)}
                          options={["Full-Time","Internship","Contract"].map(v => ({ value: v, label: v }))} />
                        <SelectField value={role.level} onChange={e => updateRole(i, "level", e.target.value)}
                          options={["Fresher","0–1 yr","1–3 yrs","3–5 yrs","5+ yrs"].map(v => ({ value: v, label: v }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <TextInput value={role.location} onChange={e => updateRole(i, "location", e.target.value)} placeholder="Location" />
                        <TextInput value={role.salary} onChange={e => updateRole(i, "salary", e.target.value)} placeholder="Salary range" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {roles.length === 0 && !addingRole && (
                <div className="text-center py-5 border-2 border-dashed border-[#E4E7EC] rounded-xl text-[#98A2B3] text-sm">
                  Use presets above or add a custom role
                </div>
              )}

              {addingRole ? (
                <div className="p-3 bg-[#F5F3FF] rounded-xl border border-[#8B7CFF]/20 space-y-2">
                  <TextInput value={newRole.role} onChange={e => setNewRole(p => ({ ...p, role: e.target.value }))} placeholder="Role title" />
                  <div className="grid grid-cols-2 gap-2">
                    <SelectField value={newRole.type} onChange={e => setNewRole(p => ({ ...p, type: e.target.value }))}
                      options={["Full-Time","Internship","Contract"].map(v => ({ value: v, label: v }))} />
                    <SelectField value={newRole.level} onChange={e => setNewRole(p => ({ ...p, level: e.target.value }))}
                      options={["Fresher","0–1 yr","1–3 yrs","3–5 yrs"].map(v => ({ value: v, label: v }))} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={addCustomRole}
                      className="px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition-colors"
                      style={{ background: "#8B7CFF" }}>Add</button>
                    <button type="button" onClick={() => setAddingRole(false)}
                      className="px-3 py-1.5 border border-[#D0D5DD] text-[#475467] text-xs font-semibold rounded-lg hover:bg-white transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingRole(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#D0D5DD] text-xs text-[#667085] hover:border-[#8B7CFF]/40 hover:text-[#8B7CFF] transition-colors">
                  <Plus size={13} /> Add Custom Role
                </button>
              )}
            </>
          )}
        </div>
      );

      // ── Step 3: Candidate Requirements ────────────────────────────
      case 3: return (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-[#475467] mb-1">Must-Have Skills</p>
            <p className="text-[10px] text-[#98A2B3] mb-2">Candidates must have these to match your roles</p>
            <div className="flex flex-wrap gap-2">
              {[...TECH_SKILLS, ...SOFT_SKILLS].map(s => (
                <button key={s} type="button" onClick={() => toggleMustHave(s)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                  style={mustHave.includes(s)
                    ? { background: "#8B7CFF14", color: "#8B7CFF", borderColor: "#8B7CFF40" }
                    : { background: "#F7F9FC", color: "#667085", borderColor: "#E4E7EC" }}>
                  {mustHave.includes(s) ? "✓ " : ""}{s}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#F1F5F9]" />

          <div>
            <p className="text-xs font-semibold text-[#475467] mb-1">Good-to-Have Skills</p>
            <p className="text-[10px] text-[#98A2B3] mb-2">Nice to have but not a dealbreaker</p>
            <div className="flex flex-wrap gap-2">
              {TECH_SKILLS.filter(s => !mustHave.includes(s)).map(s => (
                <button key={s} type="button" onClick={() => toggleGoodToHave(s)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                  style={goodToHave.includes(s)
                    ? { background: "#4F7CFF14", color: "#4F7CFF", borderColor: "#4F7CFF40" }
                    : { background: "#F7F9FC", color: "#667085", borderColor: "#E4E7EC" }}>
                  {goodToHave.includes(s) ? "✓ " : ""}{s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Graduation Year">
              <SelectField value={requirements.gradYear} onChange={e => setRequirements(p => ({ ...p, gradYear: e.target.value }))}
                placeholder="Any" options={["2024","2025","2026","2027","2028"].map(v => ({ value: v, label: `Class of ${v}` }))} />
            </FormField>
            <FormField label="Degree Preference">
              <SelectField value={requirements.degree} onChange={e => setRequirements(p => ({ ...p, degree: e.target.value }))}
                placeholder="Any" options={["B.Tech","B.E.","BCA","MCA","M.Tech","MBA","Any"].map(v => ({ value: v, label: v }))} />
            </FormField>
            <FormField label="Min Readiness Score (%)">
              <SelectField value={requirements.minScore} onChange={e => setRequirements(p => ({ ...p, minScore: e.target.value }))}
                options={["60","70","75","80","85","90"].map(v => ({ value: v, label: `${v}%+` }))} />
            </FormField>
            <FormField label="Availability">
              <SelectField value={requirements.availability} onChange={e => setRequirements(p => ({ ...p, availability: e.target.value }))}
                placeholder="Select" options={["Immediate","Within 1 month","Within 3 months","Flexible"].map(v => ({ value: v, label: v }))} />
            </FormField>
          </div>
        </div>
      );

      // ── Step 4: Hiring Preferences ─────────────────────────────────
      case 4: return (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Monthly Hiring Volume">
              <SelectField value={prefs.monthlyVolume} onChange={e => setPrefs(p => ({ ...p, monthlyVolume: e.target.value }))}
                placeholder="Select" options={["1–5","6–20","21–50","50+"].map(v => ({ value: v, label: `${v} hires/mo` }))} />
            </FormField>
            <FormField label="Internship Hiring">
              <SelectField value={prefs.internshipHiring} onChange={e => setPrefs(p => ({ ...p, internshipHiring: e.target.value }))}
                placeholder="Select" options={[
                  { value: "yes",     label: "Yes, actively" },
                  { value: "maybe",   label: "Occasionally" },
                  { value: "no",      label: "No" },
                ]} />
            </FormField>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#475467] mb-2 block">Campus Hiring Interest</label>
            <div className="flex gap-2 flex-wrap">
              {["High — active campus drives","Medium — selective","Low — individual hires","None"].map(c => (
                <Chip key={c} label={c} selected={prefs.campusInterest === c}
                  onClick={() => setPrefs(p => ({ ...p, campusInterest: c }))} accent="#8B7CFF" />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#475467] mb-2 block">Preferred Colleges</label>
            <div className="flex flex-wrap gap-2">
              {["IITs","NITs","IIITs","Top Private","All Colleges"].map(c => (
                <Chip key={c} label={c} selected={prefs.preferredColleges.includes(c)}
                  onClick={() => toggleCollege(c)} accent="#8B7CFF" />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#475467] mb-2 block">Candidate Discovery Preference</label>
            <div className="flex gap-2 flex-wrap">
              {["AI-ranked feed","Manual search","Saved filters","All of the above"].map(d => (
                <Chip key={d} label={d} selected={prefs.discoveryPref === d}
                  onClick={() => setPrefs(p => ({ ...p, discoveryPref: d }))} accent="#8B7CFF" />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB]">
            <div>
              <p className="text-sm font-medium text-[#101828]">Auto-notify on strong matches</p>
              <p className="text-xs text-[#98A2B3]">Get notified when high-match candidates appear</p>
            </div>
            <div className="w-11 h-6 rounded-full relative cursor-pointer transition-all"
              style={{ background: "#8B7CFF" }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: "calc(100% - 22px)" }} />
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
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8B7CFF, #55C7F3)" }}>
            <Users size={12} className="text-white" />
          </div>
          <span className="font-bold text-sm text-[#101828]">CareerOS</span>
          <span className="text-[#E4E7EC] mx-1">·</span>
          <span className="text-xs text-[#98A2B3]">Recruiter Setup</span>
        </div>
        <button onClick={() => navigate("/recruiter")} className="text-xs text-[#98A2B3] hover:text-[#667085] transition-colors">
          Skip for now
        </button>
      </header>

      <div className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-[620px]">
          <div className="mb-8">
            <StepIndicator steps={STEPS} current={step} accentColor="#8B7CFF" />
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
            <div className="px-7 py-5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #8B7CFF, #55C7F3)" }}>
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
                style={{ background: "linear-gradient(135deg, #8B7CFF, #55C7F3)", boxShadow: "0 4px 14px rgba(139,124,255,0.3)" }}>
                {step === STEPS.length - 1 ? <><Sparkles size={14} /> Start Discovering Talent</> : <>Continue <ArrowRight size={14} /></>}
              </button>
            </div>
          </div>

          <div className="mt-4 h-1 bg-[#E4E7EC] rounded-full overflow-hidden">
            <div className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: "linear-gradient(90deg, #8B7CFF, #55C7F3)" }} />
          </div>
          <p className="text-center text-[10px] text-[#98A2B3] mt-2">
            {Math.round(((step + 1) / STEPS.length) * 100)}% complete · Progress auto-saved
          </p>
        </div>
      </div>
    </div>
  );
}
