import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  User, GraduationCap, Target, Zap, FileText, Shield,
  Briefcase, Edit2, Check, Loader2, AlertCircle, Plus, Trash2, ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { userMessage } from "../lib/api";
import { resumesApi } from "../lib/api/resumes";
import type { EducationEntry, ExperienceEntry, ProfileUpdateRequest } from "../lib/api/types";

const sections = [
  { id: "personal",   icon: User,         label: "Personal Info" },
  { id: "education",  icon: GraduationCap, label: "Education" },
  { id: "experience", icon: Briefcase,     label: "Experience" },
  { id: "target",     icon: Target,        label: "Career Target" },
  { id: "skills",     icon: Zap,           label: "Skills & Interests" },
  { id: "resume",     icon: FileText,      label: "Resume" },
  { id: "security",   icon: Shield,        label: "Account & Security" },
];

const ONBOARDING_LABEL: Record<string, string> = {
  not_started: "Onboarding not started",
  in_progress: "Onboarding in progress",
  complete: "Profile complete",
};

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/30 focus:border-[#4F7CFF] transition-all bg-white";

const labelCls = "block text-xs font-semibold text-[#475467] mb-1.5";
const readCls  = "text-sm text-[#101828] py-2 px-3 rounded-lg bg-[#F7F9FC]";

// ── EditToggle button ────────────────────────────────────────────────────────

function EditToggleBtn({
  editing, saving, disabled, onEdit, onSave,
}: {
  editing: boolean; saving: boolean; disabled?: boolean;
  onEdit: () => void; onSave: () => void;
}) {
  return (
    <button
      onClick={editing ? onSave : onEdit}
      disabled={saving || disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        editing ? "bg-[#22A06B]/8 text-[#22A06B] border border-[#22A06B]/20" : "border border-[#E4E7EC] text-[#667085]"
      }`}
    >
      {saving ? (
        <><Loader2 size={12} className="animate-spin" /> Saving</>
      ) : editing ? (
        <><Check size={12} /> Save</>
      ) : (
        <><Edit2 size={12} /> Edit</>
      )}
    </button>
  );
}

// ── Personal Section ─────────────────────────────────────────────────────────

function PersonalSection() {
  const { user, profile, updateProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    display_name: "", phone: "", location: "", linkedin_url: "", github_url: "",
  });

  useEffect(() => {
    if (editing) return;
    setDraft({
      display_name: profile?.display_name ?? "",
      phone: profile?.phone ?? "",
      location: profile?.location ?? "",
      linkedin_url: profile?.linkedin_url ?? "",
      github_url: profile?.github_url ?? "",
    });
  }, [editing, profile]);

  async function handleSave() {
    if (saving) return;
    const payload: ProfileUpdateRequest = {};
    if (draft.display_name.trim()) payload.display_name = draft.display_name.trim();
    if (draft.phone.trim()) payload.phone = draft.phone.trim();
    if (draft.location.trim()) payload.location = draft.location.trim();
    if (draft.linkedin_url.trim()) payload.linkedin_url = draft.linkedin_url.trim();
    if (draft.github_url.trim()) payload.github_url = draft.github_url.trim();
    if (!Object.keys(payload).length) { showError("Nothing to save."); return; }
    setSaving(true);
    try {
      await updateProfile(payload);
      success("Profile saved.");
      setEditing(false);
    } catch (err) { showError(userMessage(err)); }
    finally { setSaving(false); }
  }

  const fields: { label: string; key: keyof typeof draft | null; value: string }[] = [
    { label: "Full Name",   key: "display_name",  value: profile?.display_name ?? "" },
    { label: "Email",       key: null,             value: profile?.email ?? user?.email ?? "" },
    { label: "Phone",       key: "phone",          value: profile?.phone ?? "" },
    { label: "Location",    key: "location",       value: profile?.location ?? "" },
    { label: "LinkedIn",    key: "linkedin_url",   value: profile?.linkedin_url ?? "" },
    { label: "GitHub",      key: "github_url",     value: profile?.github_url ?? "" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-[#101828]">Personal Information</h2>
        <EditToggleBtn editing={editing} saving={saving} disabled={!profile}
          onEdit={() => setEditing(true)} onSave={handleSave} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.label}>
            <label className={labelCls}>{f.label}</label>
            {editing && f.key ? (
              <input value={draft[f.key]} onChange={(e) => setDraft((p) => ({ ...p, [f.key!]: e.target.value }))}
                className={inputCls} />
            ) : (
              <p className={readCls}>{f.value || "—"}</p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-[#98A2B3]">Email is managed by your account and cannot be changed here.</p>
    </div>
  );
}

// ── Education Section ────────────────────────────────────────────────────────

function EducationSection() {
  const { profile, updateProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<EducationEntry[]>([]);

  useEffect(() => {
    if (editing) return;
    setEntries(profile?.education ?? []);
  }, [editing, profile]);

  const blank = (): EducationEntry => ({ degree: "", institution: "", start_year: null, end_year: null, grade: null });

  function update(i: number, field: keyof EducationEntry, val: string) {
    setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: val || null } : e));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ education: entries.filter((e) => e.degree.trim() || e.institution.trim()) });
      success("Education saved.");
      setEditing(false);
    } catch (err) { showError(userMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-[#101828]">Education</h2>
        <div className="flex gap-2">
          {editing && (
            <button onClick={() => setEntries((p) => [...p, blank()])}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#4F7CFF]/30 text-[#4F7CFF]">
              <Plus size={12} /> Add
            </button>
          )}
          <EditToggleBtn editing={editing} saving={saving} disabled={!profile}
            onEdit={() => setEditing(true)} onSave={handleSave} />
        </div>
      </div>
      <div className="space-y-4">
        {entries.length === 0 && !editing && (
          <div className="p-4 rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB]">
            <p className="text-sm text-[#667085]">No education added yet. Click Edit to add.</p>
          </div>
        )}
        {entries.map((edu, i) => (
          <div key={i} className="p-4 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] space-y-3">
            {editing ? (
              <>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Degree / Program</label>
                      <input value={edu.degree} onChange={(e) => update(i, "degree", e.target.value)}
                        placeholder="B.Tech Computer Science" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Institution</label>
                      <input value={edu.institution} onChange={(e) => update(i, "institution", e.target.value)}
                        placeholder="IIT Bombay" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Start Year</label>
                      <input value={edu.start_year ?? ""} onChange={(e) => update(i, "start_year", e.target.value)}
                        placeholder="2020" type="number" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>End Year</label>
                      <input value={edu.end_year ?? ""} onChange={(e) => update(i, "end_year", e.target.value)}
                        placeholder="2024" type="number" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Grade / CGPA</label>
                      <input value={edu.grade ?? ""} onChange={(e) => update(i, "grade", e.target.value)}
                        placeholder="8.5 / 10" className={inputCls} />
                    </div>
                  </div>
                  <button onClick={() => setEntries((p) => p.filter((_, idx) => idx !== i))}
                    className="mt-6 text-[#E5484D] hover:opacity-70 transition-opacity">
                    <Trash2 size={15} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="font-display font-semibold text-[#101828]">{edu.degree}</p>
                <p className="text-sm text-[#667085] mt-0.5">{edu.institution}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-[#98A2B3]">
                  {(edu.start_year || edu.end_year) && (
                    <span>{edu.start_year ?? "—"} — {edu.end_year ?? "Present"}</span>
                  )}
                  {edu.grade && <span className="font-semibold text-[#22A06B]">{edu.grade}</span>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Experience Section ───────────────────────────────────────────────────────

function ExperienceSection() {
  const { profile, updateProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<ExperienceEntry[]>([]);

  useEffect(() => {
    if (editing) return;
    setEntries(profile?.experience ?? []);
  }, [editing, profile]);

  const blank = (): ExperienceEntry => ({ title: "", organization: "", start_date: null, end_date: null, description: null });

  function update(i: number, field: keyof ExperienceEntry, val: string) {
    setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: val || null } : e));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ experience: entries.filter((e) => e.title.trim() || e.organization.trim()) });
      success("Experience saved.");
      setEditing(false);
    } catch (err) { showError(userMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-[#101828]">Experience</h2>
        <div className="flex gap-2">
          {editing && (
            <button onClick={() => setEntries((p) => [...p, blank()])}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#4F7CFF]/30 text-[#4F7CFF]">
              <Plus size={12} /> Add
            </button>
          )}
          <EditToggleBtn editing={editing} saving={saving} disabled={!profile}
            onEdit={() => setEditing(true)} onSave={handleSave} />
        </div>
      </div>
      <div className="space-y-4">
        {entries.length === 0 && !editing && (
          <div className="p-4 rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB]">
            <p className="text-sm text-[#667085]">No experience added yet. Click Edit to add.</p>
          </div>
        )}
        {entries.map((exp, i) => (
          <div key={i} className="p-4 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB]">
            {editing ? (
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Job Title</label>
                    <input value={exp.title} onChange={(e) => update(i, "title", e.target.value)}
                      placeholder="Software Engineer Intern" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Organization</label>
                    <input value={exp.organization} onChange={(e) => update(i, "organization", e.target.value)}
                      placeholder="Google" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Start Date</label>
                    <input value={exp.start_date ?? ""} onChange={(e) => update(i, "start_date", e.target.value)}
                      placeholder="Jun 2023" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>End Date</label>
                    <input value={exp.end_date ?? ""} onChange={(e) => update(i, "end_date", e.target.value)}
                      placeholder="Aug 2023 (or leave blank for current)" className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Description</label>
                    <textarea value={exp.description ?? ""} onChange={(e) => update(i, "description", e.target.value)}
                      placeholder="What did you work on?" rows={3}
                      className={`${inputCls} resize-none`} />
                  </div>
                </div>
                <button onClick={() => setEntries((p) => p.filter((_, idx) => idx !== i))}
                  className="mt-6 text-[#E5484D] hover:opacity-70 transition-opacity">
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display font-semibold text-[#101828]">{exp.title}</p>
                    <p className="text-sm text-[#667085] mt-0.5">{exp.organization}</p>
                  </div>
                  {(exp.start_date || exp.end_date) && (
                    <span className="text-xs text-[#98A2B3]">
                      {exp.start_date ?? "—"} — {exp.end_date ?? "Present"}
                    </span>
                  )}
                </div>
                {exp.description && (
                  <p className="text-xs text-[#667085] mt-2 leading-relaxed">{exp.description}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Career Target Section ────────────────────────────────────────────────────

function CareerTargetSection() {
  const { profile, updateProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    target_role_name: "",
    target_salary_inr: "",
    timeframe_years: "",
    discoverability: false,
  });

  useEffect(() => {
    if (editing) return;
    setDraft({
      target_role_name: profile?.target_role_name ?? "",
      target_salary_inr: profile?.target_salary_inr?.toString() ?? "",
      timeframe_years: profile?.timeframe_years?.toString() ?? "",
      discoverability: profile?.discoverability ?? false,
    });
  }, [editing, profile]);

  async function handleSave() {
    setSaving(true);
    const payload: ProfileUpdateRequest = {};
    if (draft.target_role_name.trim()) payload.target_role_name = draft.target_role_name.trim();
    if (draft.target_salary_inr) payload.target_salary_inr = parseInt(draft.target_salary_inr) || undefined;
    if (draft.timeframe_years) payload.timeframe_years = parseInt(draft.timeframe_years) || undefined;
    payload.discoverability = draft.discoverability;
    try {
      await updateProfile(payload);
      success("Career target saved.");
      setEditing(false);
    } catch (err) { showError(userMessage(err)); }
    finally { setSaving(false); }
  }

  const salary = profile?.target_salary_inr;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-[#101828]">Career Target</h2>
        <EditToggleBtn editing={editing} saving={saving} disabled={!profile}
          onEdit={() => setEditing(true)} onSave={handleSave} />
      </div>
      <div className="space-y-4">
        {editing ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Target Role</label>
                <input value={draft.target_role_name}
                  onChange={(e) => setDraft((p) => ({ ...p, target_role_name: e.target.value }))}
                  placeholder="e.g. AI Engineer, Data Scientist" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Expected CTC (₹ / year)</label>
                <input value={draft.target_salary_inr}
                  onChange={(e) => setDraft((p) => ({ ...p, target_salary_inr: e.target.value }))}
                  placeholder="1200000" type="number" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Timeframe (years)</label>
                <input value={draft.timeframe_years}
                  onChange={(e) => setDraft((p) => ({ ...p, timeframe_years: e.target.value }))}
                  placeholder="2" type="number" className={inputCls} />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <button
                  type="button"
                  onClick={() => setDraft((p) => ({ ...p, discoverability: !p.discoverability }))}
                  className={`w-10 h-6 rounded-full transition-colors ${draft.discoverability ? "bg-[#4F7CFF]" : "bg-[#D0D5DD]"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white mx-auto transition-transform ${draft.discoverability ? "translate-x-2" : "-translate-x-2"}`} />
                </button>
                <label className="text-sm text-[#475467]">Discoverable to recruiters</label>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-xl border border-[#4F7CFF]/25 bg-[#4F7CFF]/4">
              <p className="text-xs font-semibold text-[#4F7CFF] mb-1">Target Role</p>
              <p className="font-display text-lg font-bold text-[#101828]">
                {profile?.target_role_name || "Not set yet"}
              </p>
            </div>
            {[
              { label: "Expected CTC", value: typeof salary === "number" ? `₹${salary.toLocaleString("en-IN")} / year` : "—" },
              { label: "Timeframe", value: profile?.timeframe_years != null ? `${profile.timeframe_years} year${profile.timeframe_years !== 1 ? "s" : ""}` : "—" },
              { label: "Discoverable to recruiters", value: profile?.discoverability ? "Yes" : "No" },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0">
                <span className="text-sm text-[#667085]">{f.label}</span>
                <span className="text-sm font-medium text-[#101828]">{f.value}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Skills & Interests Section ───────────────────────────────────────────────

function SkillsSection() {
  const { profile, updateProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [interestInput, setInterestInput] = useState("");

  useEffect(() => {
    if (editing) return;
    setInterestInput((profile?.interests ?? []).join(", "));
  }, [editing, profile]);

  async function handleSave() {
    setSaving(true);
    const interests = interestInput.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      await updateProfile({ interests });
      success("Interests saved.");
      setEditing(false);
    } catch (err) { showError(userMessage(err)); }
    finally { setSaving(false); }
  }

  const interests = profile?.interests ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-[#101828]">Skills & Interests</h2>
        <EditToggleBtn editing={editing} saving={saving} disabled={!profile}
          onEdit={() => setEditing(true)} onSave={handleSave} />
      </div>
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-[#4F7CFF]/4 border border-[#4F7CFF]/15 text-xs text-[#4F7CFF]">
          Skills are extracted from your resume automatically. Interests below help ARIA personalise advice.
        </div>
        <div>
          <label className={labelCls}>Interests (comma-separated)</label>
          {editing ? (
            <input value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              placeholder="Machine Learning, Open Source, System Design, Competitive Programming"
              className={inputCls} />
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {interests.length === 0 ? (
                <p className={readCls}>No interests added yet.</p>
              ) : (
                interests.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-[#4F7CFF]/8 text-[#4F7CFF] text-xs font-medium border border-[#4F7CFF]/20">
                    {tag}
                  </span>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Resume Section ───────────────────────────────────────────────────────────

function ResumeSection() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [resumeData, setResumeData] = useState<{ filename: string; score: number | null; updated: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) { setLoading(false); return; }
    resumesApi.getLatestResume(accessToken).then((r) => {
      if (r) {
        setResumeData({
          filename: r.original_filename,
          score: r.resume_quality_score,
          updated: r.updated_at,
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div>
      <h2 className="font-display font-semibold text-[#101828] mb-5">Resume</h2>
      {loading ? (
        <div className="flex justify-center p-6">
          <Loader2 size={20} className="animate-spin text-[#4F7CFF]" />
        </div>
      ) : resumeData ? (
        <div className="p-4 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#4F7CFF]/10 flex items-center justify-center">
                <FileText size={18} className="text-[#4F7CFF]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#101828]">{resumeData.filename}</p>
                <p className="text-xs text-[#98A2B3]">
                  {resumeData.score != null ? `Score: ${resumeData.score}/100 · ` : ""}
                  Last updated {new Date(resumeData.updated).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
            <button onClick={() => navigate("/resume")}
              className="flex items-center gap-1 text-xs font-semibold text-[#4F7CFF] border border-[#4F7CFF]/30 px-3 py-1.5 rounded-lg hover:bg-[#4F7CFF]/5 transition-colors">
              View <ExternalLink size={11} />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] text-center">
          <div className="w-10 h-10 rounded-lg bg-[#E4E7EC] flex items-center justify-center mx-auto mb-2">
            <FileText size={18} className="text-[#98A2B3]" />
          </div>
          <p className="text-sm text-[#667085] mb-3">No resume uploaded yet.</p>
          <button onClick={() => navigate("/resume")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4F7CFF] text-white text-xs font-semibold hover:bg-[#3d6ae8] transition-colors">
            Upload Resume <ExternalLink size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, profile, sessionError } = useAuth();
  const [active, setActive] = useState("personal");

  const initials = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) return "—";
    return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }, [user]);

  const education = profile?.education ?? [];

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="fade-up mb-6">
        <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">My Profile</h1>
        <p className="text-[#667085] text-sm">Manage your personal information and career settings.</p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6 fade-up-1">
        {/* Sidebar */}
        <div className="space-y-1">
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 mb-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
              {initials}
            </div>
            <p className="font-display font-semibold text-[#101828]">{user?.name || "—"}</p>
            <p className="text-xs text-[#667085] mt-0.5">
              {education[0]
                ? `${education[0].degree} · ${education[0].institution}`
                : profile
                  ? "No education added yet"
                  : "Profile not created yet"}
            </p>
            <div className="mt-3 px-3 py-1.5 rounded-full bg-[#4F7CFF]/8 border border-[#4F7CFF]/15">
              <span className="text-xs font-semibold text-[#4F7CFF]">
                {profile ? ONBOARDING_LABEL[profile.onboarding_state] ?? "Profile" : "Profile not created"}
              </span>
            </div>
          </div>

          {sections.map((s) => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                active === s.id ? "sidebar-item-active" : "text-[#667085] hover:text-[#101828] hover:bg-[#F1F5F9]"
              }`}>
              <s.icon size={15} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6">
          {!profile && (
            <div className="mb-5 p-3 rounded-xl bg-[#F59E0B]/6 border border-[#F59E0B]/20 flex items-start gap-2">
              <AlertCircle size={13} className="text-[#F59E0B] mt-0.5 shrink-0" />
              <p className="text-xs text-[#667085] leading-relaxed">
                {sessionError ?? "No profile exists for this account yet. Finish onboarding to create one."}
              </p>
            </div>
          )}

          {active === "personal"   && <PersonalSection />}
          {active === "education"  && <EducationSection />}
          {active === "experience" && <ExperienceSection />}
          {active === "target"     && <CareerTargetSection />}
          {active === "skills"     && <SkillsSection />}
          {active === "resume"     && <ResumeSection />}

          {active === "security" && (
            <div>
              <h2 className="font-display font-semibold text-[#101828] mb-5">Account &amp; Security</h2>
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-[#4F7CFF]/6 border border-[#4F7CFF]/20 flex items-start gap-2">
                  <AlertCircle size={13} className="text-[#4F7CFF] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#667085] leading-relaxed">
                    Password changes and two-factor authentication are not connected yet. Use
                    &ldquo;Forgot password&rdquo; on the sign-in page to reset your password.
                  </p>
                </div>
                {[
                  { title: "Password", note: "Resets are handled from the sign-in page." },
                  { title: "Two-Factor Authentication", note: "Not connected yet." },
                ].map((row) => (
                  <div key={row.title} className="p-4 rounded-xl border border-[#E4E7EC]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-[#101828]">{row.title}</p>
                        <p className="text-xs text-[#98A2B3] mt-0.5">{row.note}</p>
                      </div>
                      <button disabled className="text-xs font-semibold text-[#98A2B3] border border-[#E4E7EC] px-3 py-1.5 rounded-lg cursor-not-allowed">
                        Unavailable
                      </button>
                    </div>
                  </div>
                ))}
                <div className="p-4 rounded-xl border border-[#E5484D]/20 bg-[#E5484D]/4">
                  <p className="font-semibold text-sm text-[#E5484D]">Delete Account</p>
                  <p className="text-xs text-[#98A2B3] mt-0.5">Not connected yet.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
