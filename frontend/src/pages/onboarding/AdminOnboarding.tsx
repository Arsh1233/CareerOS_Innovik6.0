import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Shield, ArrowRight, Check, Sparkles } from "lucide-react";
import { FormField, TextInput, SelectField } from "../../components/ui/FormField";

type Phase = "form" | "generating" | "result";

const GEN_STEPS = [
  "Verifying admin credentials...",
  "Configuring workspace permissions",
  "Setting up audit logging",
  "Preparing your console",
];

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
        selected
          ? "text-white border-transparent"
          : "bg-white border-[#D0D5DD] text-[#475467] hover:border-[#E5484D]/60"
      }`}
      style={selected ? { background: "#E5484D" } : {}}>
      {label}
    </button>
  );
}

export default function AdminOnboarding() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("form");
  const [genIdx, setGenIdx] = useState(0);

  const [form, setForm] = useState({
    name: "", department: "", adminRole: "", phone: "", notifications: [] as string[],
  });

  useEffect(() => {
    if (phase !== "generating") return;
    if (genIdx >= GEN_STEPS.length) {
      const t = setTimeout(() => setPhase("result"), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setGenIdx(i => i + 1), 650);
    return () => clearTimeout(t);
  }, [phase, genIdx]);

  function toggleNotif(n: string) {
    setForm(p => ({
      ...p,
      notifications: p.notifications.includes(n) ? p.notifications.filter(x => x !== n) : [...p.notifications, n],
    }));
  }

  function canSubmit() {
    return !!(form.name && form.adminRole);
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
          style={{ background: "linear-gradient(135deg, #E5484D, #FF8C42)", boxShadow: "0 0 0 10px #E5484D18" }}>
          <Shield size={22} className="text-white" style={{ animation: "co-spin 2.5s linear infinite" }} />
        </div>
        <div className="h-9 flex items-center mb-2">
          <p key={genIdx} className="text-[#101828] text-xl font-semibold text-center"
            style={{ animation: "co-fade-up 0.4s ease" }}>
            {genIdx < GEN_STEPS.length ? GEN_STEPS[genIdx] : GEN_STEPS[GEN_STEPS.length - 1]}
          </p>
        </div>
        <p className="text-[#98A2B3] text-sm">Preparing your admin console...</p>
        <div className="flex gap-2 mt-10">
          {GEN_STEPS.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: i < genIdx ? "2.5rem" : "1.5rem", background: i < genIdx ? "#E5484D" : "#E4E7EC" }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Result phase ───────────────────────────────────────────────────────────
  if (phase === "result") {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
              style={{ background: "linear-gradient(135deg, #E5484D, #FF8C42)", boxShadow: "0 0 0 10px #E5484D18" }}>
              <Check size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#101828] text-center">Admin Workspace Ready</h1>
            <p className="text-[#475467] text-sm mt-2 text-center max-w-sm">
              Your admin console has been configured with full platform access.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "Admin Role",    value: form.adminRole || "Platform Admin" },
              { label: "Department",    value: form.department || "Operations" },
              { label: "Access Level",  value: "Full Access" },
              { label: "Audit Logging", value: "Enabled" },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-2xl border border-[#E4E7EC] p-4">
                <p className="text-[10px] text-[#98A2B3] font-semibold uppercase tracking-wide mb-1">{m.label}</p>
                <p className="text-base font-bold text-[#101828] truncate">{m.value}</p>
              </div>
            ))}
          </div>

          <button onClick={() => navigate("/admin")}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors mb-3"
            style={{ background: "linear-gradient(135deg, #E5484D, #FF8C42)" }}>
            Enter Admin Console <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate("/admin/settings")} className="w-full py-3 rounded-xl border border-[#D0D5DD] text-[#475467] text-sm font-semibold hover:border-[#E5484D] hover:text-[#E5484D] transition-colors">
            Review Admin Profile
          </button>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[#E4E7EC] bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E5484D, #FF8C42)" }}>
            <Shield size={12} className="text-white" />
          </div>
          <span className="font-bold text-sm text-[#101828]">CareerOS</span>
          <span className="text-[#E4E7EC] mx-1">·</span>
          <span className="text-xs text-[#98A2B3]">Admin Setup</span>
        </div>
        <button onClick={() => navigate("/admin")} className="text-xs text-[#98A2B3] hover:text-[#667085] transition-colors">
          Skip for now
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[500px]">
          <div className="text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #E5484D, #FF8C42)" }}>
              <Shield size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#101828]">Configure your admin account</h1>
            <p className="text-sm text-[#98A2B3] mt-1">Admin accounts are internally provisioned. This takes less than a minute.</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-[0_2px_24px_rgba(0,0,0,0.06)] p-7 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Full Name" required>
                <TextInput value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Vikram Nair" />
              </FormField>
              <FormField label="Department">
                <TextInput value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  placeholder="Operations, Engineering..." />
              </FormField>
            </div>

            <FormField label="Admin Role" required>
              <SelectField value={form.adminRole} onChange={e => setForm(p => ({ ...p, adminRole: e.target.value }))}
                placeholder="Select role" options={[
                  { value: "Platform Admin",   label: "Platform Admin" },
                  { value: "Analytics Admin",  label: "Analytics Admin" },
                  { value: "Content Admin",    label: "Content Admin" },
                  { value: "Support Admin",    label: "Support Admin" },
                  { value: "Super Admin",      label: "Super Admin" },
                ]} />
            </FormField>

            <FormField label="Contact Number">
              <TextInput type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210 (optional)" />
            </FormField>

            <div>
              <label className="text-xs font-semibold text-[#475467] mb-2 block">Notification Preferences</label>
              <div className="flex flex-wrap gap-2">
                {["Critical alerts","User activity","System health","Weekly reports","All"].map(n => (
                  <Chip key={n} label={n} selected={form.notifications.includes(n)} onClick={() => toggleNotif(n)} />
                ))}
              </div>
            </div>

            <button type="button" onClick={() => setPhase("generating")} disabled={!canSubmit()}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #E5484D, #FF8C42)", boxShadow: canSubmit() ? "0 4px 14px rgba(229,72,77,0.3)" : "none" }}>
              <Sparkles size={14} /> Set Up Admin Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
