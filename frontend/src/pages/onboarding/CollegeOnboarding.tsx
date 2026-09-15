import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Building2, ArrowRight, ArrowLeft, Plus, Trash2, Check, Sparkles } from "lucide-react";
import StepIndicator from "../../components/ui/StepIndicator";
import { FormField, TextInput, SelectField } from "../../components/ui/FormField";

type Phase = "steps" | "generating" | "result";

const STEPS = [
  { label: "INSTITUTION" }, { label: "TEAM" }, { label: "STUDENTS" },
  { label: "CONTEXT" }, { label: "GOALS" },
];

const GEN_STEPS = [
  "Building your Intelligence Workspace...",
  "Configuring placement analytics",
  "Setting up department monitoring",
  "Mapping your student structure",
  "Preparing your dashboard",
];

const DEPT_PRESETS = ["CSE","IT","ECE","EEE","Mechanical","Civil","Chemical","MBA","MCA","Biotechnology","Data Science","AI & ML"];

const CHALLENGES = [
  "Skill Gaps","Interview Readiness","Student Tracking","Recruiter Engagement","Placement Reporting",
];

const GOAL_OPTIONS = [
  "Placement Readiness","Employability Monitoring","Skill Gap Tracking",
  "Department Performance","At-Risk Student Detection","Recruiter Engagement",
];

interface Department { name: string; count: string; year: string; }

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
        selected
          ? "bg-[#6E72E8] border-[#6E72E8] text-white"
          : "bg-white border-[#D0D5DD] text-[#475467] hover:border-[#6E72E8] hover:text-[#6E72E8]"
      }`}
    >{label}</button>
  );
}

export default function CollegeOnboarding() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("steps");
  const [step, setStep] = useState(0);
  const [genIdx, setGenIdx] = useState(0);

  // Step 0 — Institution
  const [inst, setInst] = useState({
    name: "", type: "", affiliation: "", email: "", website: "", city: "", state: "",
  });

  // Step 1 — Placement Team
  const [team, setTeam] = useState({
    officerName: "", designation: "", email: "", phone: "", coordinators: "",
  });

  // Step 2 — Student Structure
  const [structure, setStructure] = useState({
    totalStudents: "", eligibleStudents: "", batches: "",
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [addingDept, setAddingDept] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", count: "", year: "" });

  // Step 3 — Placement Context
  const [context, setContext] = useState({
    placementRate: "", avgPackage: "", highestPackage: "",
    activeRecruiters: "", season: "", challenges: [] as string[],
  });

  // Step 4 — Goals
  const [goals, setGoals] = useState<string[]>([]);

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

  function toggleChallenge(c: string) {
    setContext(p => ({
      ...p,
      challenges: p.challenges.includes(c) ? p.challenges.filter(x => x !== c) : [...p.challenges, c],
    }));
  }

  function toggleGoal(g: string) {
    setGoals(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);
  }

  function addDeptPreset(name: string) {
    if (departments.find(d => d.name === name)) return;
    setDepartments(p => [...p, { name, count: "", year: "" }]);
  }

  function addCustomDept() {
    if (!newDept.name.trim()) return;
    setDepartments(p => [...p, { ...newDept }]);
    setNewDept({ name: "", count: "", year: "" });
    setAddingDept(false);
  }

  function removeDept(i: number) {
    setDepartments(p => p.filter((_, idx) => idx !== i));
  }

  function updateDept(i: number, k: keyof Department, v: string) {
    setDepartments(p => p.map((d, idx) => idx === i ? { ...d, [k]: v } : d));
  }

  function canContinue() {
    if (step === 0) return !!(inst.name && inst.type);
    if (step === 1) return !!(team.officerName && team.email);
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
          style={{ background: "linear-gradient(135deg, #6E72E8, #8B7CFF)", boxShadow: "0 0 0 10px #6E72E818" }}>
          <Sparkles size={22} className="text-white" style={{ animation: "co-spin 2.5s linear infinite" }} />
        </div>
        <div className="h-9 flex items-center mb-2">
          <p key={genIdx} className="text-[#101828] text-xl font-semibold text-center"
            style={{ animation: "co-fade-up 0.4s ease" }}>
            {genIdx < GEN_STEPS.length ? GEN_STEPS[genIdx] : GEN_STEPS[GEN_STEPS.length - 1]}
          </p>
        </div>
        <p className="text-[#98A2B3] text-sm">Setting up your workspace...</p>
        <div className="flex gap-2 mt-10">
          {GEN_STEPS.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: i < genIdx ? "2.5rem" : "1.5rem", background: i < genIdx ? "#6E72E8" : "#E4E7EC" }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Result phase ───────────────────────────────────────────────────────────
  if (phase === "result") {
    const metrics = [
      { label: "Departments Configured", value: `${departments.length || "—"}` },
      { label: "Eligible Students",      value: structure.eligibleStudents || "—" },
      { label: "Primary Goal",           value: goals[0] || "Placement Intelligence" },
      { label: "Priority Focus",         value: context.challenges[0] || "Skill Gap Monitoring" },
      { label: "Dashboard Mode",         value: "Placement Intelligence" },
    ];
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
              style={{ background: "linear-gradient(135deg, #6E72E8, #8B7CFF)", boxShadow: "0 0 0 10px #6E72E818" }}>
              <Check size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#101828] text-center">Your College Intelligence Workspace is Ready</h1>
            <p className="text-[#475467] text-sm mt-2 text-center max-w-sm">
              CareerOS has configured your placement dashboard based on your institution profile.
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
            Your placement team has been configured. You can invite additional coordinators from Settings.
          </p>

          <button onClick={() => navigate("/college")}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors mb-3"
            style={{ background: "linear-gradient(135deg, #6E72E8, #8B7CFF)" }}>
            Open College Dashboard <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate("/college/settings")} className="w-full py-3 rounded-xl border border-[#D0D5DD] text-[#475467] text-sm font-semibold hover:border-[#6E72E8] hover:text-[#6E72E8] transition-colors">
            Review Institution Profile
          </button>
        </div>
      </div>
    );
  }

  // ── Step content ───────────────────────────────────────────────────────────
  const stepTitles = [
    { title: "Tell us about your institution",           sub: "Configure your institution identity" },
    { title: "Set up your placement team",               sub: "Who manages placement at your institution?" },
    { title: "Define your student structure",            sub: "Help CareerOS understand your student base" },
    { title: "Share your placement context",             sub: "Recent metrics and key challenges" },
    { title: "What should CareerOS help improve?",       sub: "Select your primary goals" },
  ];

  function renderStep() {
    switch (step) {
      // ── Step 0: Institution ────────────────────────────────────────
      case 0: return (
        <div className="space-y-4">
          <FormField label="Institution Full Name" required>
            <TextInput value={inst.name} onChange={e => setInst(p => ({ ...p, name: e.target.value }))}
              placeholder="SRM Institute of Science and Technology" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Institution Type" required>
              <SelectField value={inst.type} onChange={e => setInst(p => ({ ...p, type: e.target.value }))}
                placeholder="Select type" options={[
                  { value: "university",  label: "University" },
                  { value: "deemed",      label: "Deemed University" },
                  { value: "autonomous",  label: "Autonomous College" },
                  { value: "iit_nit",     label: "IIT / NIT / IIIT" },
                  { value: "private",     label: "Private Engineering" },
                  { value: "bschool",     label: "Business School" },
                ]} />
            </FormField>
            <FormField label="University Affiliation">
              <TextInput value={inst.affiliation} onChange={e => setInst(p => ({ ...p, affiliation: e.target.value }))}
                placeholder="Anna University / Autonomous" />
            </FormField>
          </div>
          <FormField label="Official Email">
            <TextInput type="email" value={inst.email} onChange={e => setInst(p => ({ ...p, email: e.target.value }))}
              placeholder="placement@srm.ac.in" />
          </FormField>
          <FormField label="Website">
            <TextInput value={inst.website} onChange={e => setInst(p => ({ ...p, website: e.target.value }))}
              placeholder="www.srm.edu.in" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="City">
              <TextInput value={inst.city} onChange={e => setInst(p => ({ ...p, city: e.target.value }))} placeholder="Chennai" />
            </FormField>
            <FormField label="State">
              <TextInput value={inst.state} onChange={e => setInst(p => ({ ...p, state: e.target.value }))} placeholder="Tamil Nadu" />
            </FormField>
          </div>
        </div>
      );

      // ── Step 1: Placement Team ─────────────────────────────────────
      case 1: return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#6E72E8]/6 border border-[#6E72E8]/20">
            <p className="text-xs text-[#6E72E8] font-semibold mb-0.5">Placement Intelligence Setup</p>
            <p className="text-xs text-[#667085]">This information helps CareerOS build accurate benchmarks and surface at-risk students early.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Placement Officer Name" required>
              <TextInput value={team.officerName} onChange={e => setTeam(p => ({ ...p, officerName: e.target.value }))}
                placeholder="Dr. Ramesh Kumar" />
            </FormField>
            <FormField label="Designation">
              <TextInput value={team.designation} onChange={e => setTeam(p => ({ ...p, designation: e.target.value }))}
                placeholder="Training & Placement Officer" />
            </FormField>
          </div>
          <FormField label="Official Contact Email" required>
            <TextInput type="email" value={team.email} onChange={e => setTeam(p => ({ ...p, email: e.target.value }))}
              placeholder="tpo@srm.ac.in" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone">
              <TextInput type="tel" value={team.phone} onChange={e => setTeam(p => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="Number of Coordinators">
              <TextInput type="number" value={team.coordinators} onChange={e => setTeam(p => ({ ...p, coordinators: e.target.value }))}
                placeholder="8" />
            </FormField>
          </div>
        </div>
      );

      // ── Step 2: Student Structure ──────────────────────────────────
      case 2: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Total Students">
              <TextInput type="number" value={structure.totalStudents} onChange={e => setStructure(p => ({ ...p, totalStudents: e.target.value }))}
                placeholder="5,000" />
            </FormField>
            <FormField label="Placement-Eligible Students">
              <TextInput type="number" value={structure.eligibleStudents} onChange={e => setStructure(p => ({ ...p, eligibleStudents: e.target.value }))}
                placeholder="1,200" />
            </FormField>
          </div>
          <FormField label="Graduation Batches" hint="e.g. 2025, 2026">
            <TextInput value={structure.batches} onChange={e => setStructure(p => ({ ...p, batches: e.target.value }))}
              placeholder="2025, 2026" />
          </FormField>

          <div>
            <p className="text-xs font-semibold text-[#475467] mb-2">Departments</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {DEPT_PRESETS.map(d => (
                <button key={d} type="button" onClick={() => addDeptPreset(d)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    departments.find(x => x.name === d)
                      ? "border-[#6E72E8] bg-[#6E72E8]/8 text-[#6E72E8]"
                      : "border-[#E4E7EC] text-[#667085] hover:border-[#6E72E8]/50"
                  }`}>
                  {departments.find(x => x.name === d) ? "✓ " : "+ "}{d}
                </button>
              ))}
            </div>

            {departments.length > 0 && (
              <div className="space-y-2 mb-3 max-h-[200px] overflow-y-auto">
                {departments.map((dept, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-[#F8F9FC] rounded-lg border border-[#E4E7EC]">
                    <span className="text-sm font-medium text-[#344054] min-w-[80px]">{dept.name}</span>
                    <TextInput className="flex-1" type="number" placeholder="Students" value={dept.count}
                      onChange={e => updateDept(i, "count", e.target.value)} />
                    <TextInput className="flex-1" placeholder="Batch year" value={dept.year}
                      onChange={e => updateDept(i, "year", e.target.value)} />
                    <button type="button" onClick={() => removeDept(i)} className="text-[#D0D5DD] hover:text-[#E5484D] transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {addingDept ? (
              <div className="p-3 bg-[#F0F0FF] rounded-xl border border-[#6E72E8]/20 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <TextInput placeholder="Department name" value={newDept.name} onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))} />
                  <TextInput type="number" placeholder="Students" value={newDept.count} onChange={e => setNewDept(p => ({ ...p, count: e.target.value }))} />
                  <TextInput placeholder="Grad year" value={newDept.year} onChange={e => setNewDept(p => ({ ...p, year: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={addCustomDept}
                    className="px-3 py-1.5 bg-[#6E72E8] text-white text-xs font-semibold rounded-lg hover:bg-[#5A5ECC] transition-colors">Add</button>
                  <button type="button" onClick={() => { setAddingDept(false); setNewDept({ name: "", count: "", year: "" }); }}
                    className="px-3 py-1.5 border border-[#D0D5DD] text-[#475467] text-xs font-semibold rounded-lg hover:bg-white transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setAddingDept(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#D0D5DD] text-xs text-[#667085] hover:border-[#6E72E8]/40 hover:text-[#6E72E8] transition-colors">
                <Plus size={13} /> Add Custom Department
              </button>
            )}
          </div>
        </div>
      );

      // ── Step 3: Placement Context ──────────────────────────────────
      case 3: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Placement Rate (Last Year %)" hint="e.g. 85">
              <TextInput type="number" value={context.placementRate} onChange={e => setContext(p => ({ ...p, placementRate: e.target.value }))}
                placeholder="85" />
            </FormField>
            <FormField label="Active Recruiters">
              <TextInput type="number" value={context.activeRecruiters} onChange={e => setContext(p => ({ ...p, activeRecruiters: e.target.value }))}
                placeholder="120" />
            </FormField>
            <FormField label="Average Package (LPA)">
              <TextInput type="number" value={context.avgPackage} onChange={e => setContext(p => ({ ...p, avgPackage: e.target.value }))}
                placeholder="8.5" />
            </FormField>
            <FormField label="Highest Package (LPA)">
              <TextInput type="number" value={context.highestPackage} onChange={e => setContext(p => ({ ...p, highestPackage: e.target.value }))}
                placeholder="42" />
            </FormField>
          </div>
          <FormField label="Placement Season">
            <SelectField value={context.season} onChange={e => setContext(p => ({ ...p, season: e.target.value }))}
              placeholder="Select" options={[
                { value: "aug-dec",  label: "August – December" },
                { value: "jan-apr",  label: "January – April" },
                { value: "year-round", label: "Year-round" },
              ]} />
          </FormField>
          <div>
            <label className="text-xs font-semibold text-[#475467] mb-2 block">Main Placement Challenges</label>
            <div className="flex flex-wrap gap-2">
              {CHALLENGES.map(c => (
                <Chip key={c} label={c} selected={context.challenges.includes(c)} onClick={() => toggleChallenge(c)} />
              ))}
            </div>
          </div>
        </div>
      );

      // ── Step 4: Goals ──────────────────────────────────────────────
      case 4: return (
        <div className="space-y-4">
          <p className="text-xs text-[#98A2B3]">Select the areas where CareerOS should focus. You can update these anytime from Settings.</p>
          <div className="grid grid-cols-1 gap-2">
            {GOAL_OPTIONS.map(g => (
              <button key={g} type="button" onClick={() => toggleGoal(g)}
                className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border text-left transition-all ${
                  goals.includes(g)
                    ? "border-[#6E72E8] bg-[#6E72E8]/6"
                    : "border-[#E4E7EC] bg-white hover:border-[#6E72E8]/40"
                }`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all ${
                  goals.includes(g) ? "bg-[#6E72E8] border-[#6E72E8]" : "border-[#D0D5DD]"
                }`}>
                  {goals.includes(g) && <Check size={11} className="text-white" />}
                </div>
                <span className={`text-sm font-medium ${goals.includes(g) ? "text-[#6E72E8]" : "text-[#344054]"}`}>{g}</span>
              </button>
            ))}
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
            style={{ background: "linear-gradient(135deg, #6E72E8, #8B7CFF)" }}>
            <Building2 size={12} className="text-white" />
          </div>
          <span className="font-bold text-sm text-[#101828]">CareerOS</span>
          <span className="text-[#E4E7EC] mx-1">·</span>
          <span className="text-xs text-[#98A2B3]">College Setup</span>
        </div>
        <button onClick={() => navigate("/college")} className="text-xs text-[#98A2B3] hover:text-[#667085] transition-colors">
          Skip for now
        </button>
      </header>

      <div className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-[620px]">
          <div className="mb-8">
            <StepIndicator steps={STEPS} current={step} accentColor="#6E72E8" />
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
            <div className="px-7 py-5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #6E72E8, #8B7CFF)" }}>
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
                style={{ background: "linear-gradient(135deg, #6E72E8, #8B7CFF)", boxShadow: "0 4px 14px rgba(110,114,232,0.3)" }}>
                {step === STEPS.length - 1 ? <><Sparkles size={14} /> Launch College Workspace</> : <>Continue <ArrowRight size={14} /></>}
              </button>
            </div>
          </div>

          <div className="mt-4 h-1 bg-[#E4E7EC] rounded-full overflow-hidden">
            <div className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: "linear-gradient(90deg, #6E72E8, #8B7CFF)" }} />
          </div>
          <p className="text-center text-[10px] text-[#98A2B3] mt-2">
            {Math.round(((step + 1) / STEPS.length) * 100)}% complete · Progress auto-saved
          </p>
        </div>
      </div>
    </div>
  );
}
