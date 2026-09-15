import { useEffect, useMemo, useState } from "react";
import { User, GraduationCap, Target, Zap, FileText, Shield, Edit2, Check, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { userMessage } from "../lib/api";

const sections = [
  { id: "personal", icon: User, label: "Personal Info" },
  { id: "education", icon: GraduationCap, label: "Education" },
  { id: "target", icon: Target, label: "Career Target" },
  { id: "skills", icon: Zap, label: "Skills" },
  { id: "resume", icon: FileText, label: "Resume" },
  { id: "security", icon: Shield, label: "Account & Security" },
];

const ONBOARDING_LABEL: Record<string, string> = {
  not_started: "Onboarding not started",
  in_progress: "Onboarding in progress",
  complete: "Profile complete",
};

type DraftField = "display_name" | "phone" | "location" | "linkedin_url" | "github_url";

const EMPTY_DRAFT: Record<DraftField, string> = {
  display_name: "",
  phone: "",
  location: "",
  linkedin_url: "",
  github_url: "",
};

export default function ProfilePage() {
  const { user, profile, sessionError, updateProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [active, setActive] = useState("personal");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<DraftField, string>>(EMPTY_DRAFT);

  // Reload the form fields whenever the persisted profile changes.
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

  const initials = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) return "—";
    return name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  }, [user]);

  const education = profile?.education ?? [];
  const salary = profile?.target_salary_inr;

  async function handleSave() {
    if (saving) return;

    // Only send fields that have a value; the backend rejects empty updates and
    // unknown keys, and cannot store an empty display name.
    const trimmed = {
      display_name: draft.display_name.trim() || undefined,
      phone: draft.phone.trim() || undefined,
      location: draft.location.trim() || undefined,
      linkedin_url: draft.linkedin_url.trim() || undefined,
      github_url: draft.github_url.trim() || undefined,
    };

    if (Object.values(trimmed).every((value) => value === undefined)) {
      showError("Nothing to save yet.");
      return;
    }

    setSaving(true);
    try {
      // Success is only reported after the backend returns the persisted row.
      await updateProfile(trimmed);
      success("Profile saved.");
      setEditing(false);
    } catch (err) {
      showError(userMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const personalFields: { label: string; key: DraftField | null; value: string }[] = [
    { label: "Full Name", key: "display_name", value: profile?.display_name ?? "" },
    { label: "Email", key: null, value: profile?.email ?? user?.email ?? "" },
    { label: "Phone", key: "phone", value: profile?.phone ?? "" },
    { label: "Location", key: "location", value: profile?.location ?? "" },
    { label: "LinkedIn", key: "linkedin_url", value: profile?.linkedin_url ?? "" },
    { label: "GitHub", key: "github_url", value: profile?.github_url ?? "" },
  ];

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/30 focus:border-[#4F7CFF] transition-all";

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="fade-up mb-6">
        <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">My Profile</h1>
        <p className="text-[#667085] text-sm">Manage your personal information and career settings.</p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6 fade-up-1">
        {/* Sidebar */}
        <div className="space-y-1">
          {/* Avatar card */}
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
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                active === s.id
                  ? "sidebar-item-active"
                  : "text-[#667085] hover:text-[#101828] hover:bg-[#F1F5F9]"
              }`}
            >
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
                {sessionError ??
                  "No profile exists for this account yet. Finish onboarding to create one."}
              </p>
            </div>
          )}

          {active === "personal" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-semibold text-[#101828]">Personal Information</h2>
                <button
                  onClick={editing ? handleSave : () => setEditing(true)}
                  disabled={saving || !profile}
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
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {personalFields.map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-semibold text-[#475467] mb-1.5">{field.label}</label>
                    {editing && field.key ? (
                      <input
                        value={draft[field.key]}
                        onChange={(e) => setDraft((prev) => ({ ...prev, [field.key!]: e.target.value }))}
                        className={inputCls}
                      />
                    ) : (
                      <p className="text-sm text-[#101828] py-2 px-3 rounded-lg bg-[#F7F9FC]">
                        {field.value || "—"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-[#98A2B3]">
                Email is managed by your account and cannot be changed here.
              </p>
            </div>
          )}

          {active === "education" && (
            <div>
              <h2 className="font-display font-semibold text-[#101828] mb-5">Education</h2>
              <div className="space-y-4">
                {education.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB]">
                    <p className="text-sm text-[#667085]">No education added yet.</p>
                  </div>
                ) : (
                  education.map((edu) => (
                    <div key={`${edu.degree}-${edu.institution}`} className="p-4 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB]">
                      <p className="font-display font-semibold text-[#101828]">{edu.degree}</p>
                      <p className="text-sm text-[#667085] mt-0.5">{edu.institution}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#98A2B3]">
                        {(edu.start_year || edu.end_year) && (
                          <span>{edu.start_year ?? "—"} — {edu.end_year ?? "—"}</span>
                        )}
                        {edu.grade && <span className="font-semibold text-[#22A06B]">{edu.grade}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {active === "target" && (
            <div>
              <h2 className="font-display font-semibold text-[#101828] mb-5">Career Target</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#4F7CFF]/25 bg-[#4F7CFF]/4">
                  <p className="text-xs font-semibold text-[#4F7CFF] mb-1">Target Role</p>
                  <p className="font-display text-lg font-bold text-[#101828]">
                    {profile?.target_role_name || "Not set yet"}
                  </p>
                </div>
                {[
                  { label: "Expected CTC", value: typeof salary === "number" ? `₹${salary.toLocaleString("en-IN")} / year` : "—" },
                  { label: "Timeframe", value: profile?.timeframe_years != null ? `${profile.timeframe_years} years` : "—" },
                  { label: "Discoverable to recruiters", value: profile?.discoverability ? "Yes" : "No" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0">
                    <span className="text-sm text-[#667085]">{f.label}</span>
                    <span className="text-sm font-medium text-[#101828]">{f.value}</span>
                  </div>
                ))}
                <p className="text-[11px] text-[#98A2B3]">
                  Industry, preferred location, availability and work mode are not captured by the backend yet.
                </p>
              </div>
            </div>
          )}

          {active === "skills" && (
            <div>
              <h2 className="font-display font-semibold text-[#101828] mb-5">Skills</h2>
              <div className="p-4 rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB]">
                <p className="text-sm text-[#667085]">Skill data is not connected yet.</p>
                <p className="text-xs text-[#98A2B3] mt-1">
                  Skills will be derived from your resume analysis and skill-gap diagnosis (later phase).
                </p>
              </div>
            </div>
          )}

          {active === "resume" && (
            <div>
              <h2 className="font-display font-semibold text-[#101828] mb-5">Resume</h2>
              <div className="p-4 rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] text-center">
                <div className="w-10 h-10 rounded-lg bg-[#E4E7EC] flex items-center justify-center mx-auto mb-2">
                  <FileText size={18} className="text-[#98A2B3]" />
                </div>
                <p className="text-sm text-[#667085]">Resume upload is not connected yet.</p>
                <p className="text-xs text-[#98A2B3] mt-1">
                  Upload, parsing and analysis arrive with the resume intelligence phase.
                </p>
              </div>
            </div>
          )}

          {active === "security" && (
            <div>
              <h2 className="font-display font-semibold text-[#101828] mb-5">Account &amp; Security</h2>
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-[#4F7CFF]/6 border border-[#4F7CFF]/20 flex items-start gap-2">
                  <AlertCircle size={13} className="text-[#4F7CFF] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#667085] leading-relaxed">
                    Password changes, two-factor authentication and account deletion are not connected yet. Use
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
                      <button
                        disabled
                        className="text-xs font-semibold text-[#98A2B3] border border-[#E4E7EC] px-3 py-1.5 rounded-lg cursor-not-allowed"
                      >
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
