import { useEffect, useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { ShieldCheck, Mail, Loader2, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { FormField, TextInput, PasswordInput } from "../components/ui/FormField";
import { ROLE_LABEL, useAuth, type Role } from "../context/AuthContext";
import { isApiError, userMessage } from "../lib/api";

type Stage = "credentials" | "success";

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [redirectRole, setRedirectRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  // The previous flow verified a hardcoded demo code client-side. Admin access
  // is now decided by the backend identity: the account must carry the `admin`
  // role in its verified token, which only the service role can grant.
  useEffect(() => {
    if (stage !== "success") return;
    const timer = setTimeout(() => navigate("/admin"), 900);
    return () => clearTimeout(timer);
  }, [stage, navigate]);

  async function handleCredentials(ev: FormEvent) {
    ev.preventDefault();
    if (loading) return;

    const nextErrors: Record<string, string> = {};
    if (!email.trim()) nextErrors.email = "Admin email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Enter a valid email";
    if (!password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    setFormError("");
    setRedirectRole(null);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await signIn({ email: email.trim(), password, expectedRole: "admin" });
      setStage("success");
    } catch (err) {
      if (isApiError(err) && err.code === "role_mismatch") {
        setRedirectRole((err.details.actualRole as Role | undefined) ?? null);
      }
      setFormError(userMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-6">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#E4E7EC 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.4,
        }}
      />

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Back link */}
        <Link
          to="/landing"
          className="flex items-center gap-1.5 text-xs text-[#98A2B3] hover:text-[#667085] mb-6 transition-colors w-fit"
        >
          <ArrowLeft size={13} /> Change Role
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-[0_4px_32px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Top bar */}
          <div className="px-7 py-5 border-b border-[#E4E7EC]" style={{ background: "#F4F6F8" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#D0D5DD]" style={{ background: "#EEF0F4" }}>
                <ShieldCheck size={18} className="text-[#344054]" />
              </div>
              <div>
                <p className="font-display font-bold text-[#101828]">CareerOS Admin</p>
                <p className="text-[#98A2B3] text-xs">Secure administrative access</p>
              </div>
            </div>
          </div>

          <div className="p-7">
            {stage === "credentials" && (
              <>
                <div className="mb-5">
                  <h2 className="font-display text-lg font-bold text-[#101828] mb-0.5">Admin Login</h2>
                  <p className="text-xs text-[#667085]">Sign in with an administrator account.</p>
                </div>

                {formError && (
                  <div className="mb-3.5 flex items-center gap-2 p-2.5 rounded-lg bg-[#E5484D]/8 border border-[#E5484D]/20 text-xs text-[#E5484D]">
                    <AlertCircle size={12} className="shrink-0" /> {formError}
                  </div>
                )}

                {redirectRole && (
                  <button
                    type="button"
                    onClick={() => navigate(redirectRole === "admin" ? "/auth/admin" : `/auth/${redirectRole}`)}
                    className="mb-3.5 w-full py-2 rounded-xl border border-[#D0D5DD] text-[12px] font-semibold text-[#344054] hover:bg-[#F7F9FC] transition-colors"
                  >
                    Go to {ROLE_LABEL[redirectRole]} login
                  </button>
                )}

                <form onSubmit={handleCredentials} className="space-y-3.5">
                  <FormField label="Admin Email" error={errors.email} required>
                    <TextInput
                      type="email"
                      placeholder="admin@careeros.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={!!errors.email}
                      leftIcon={<Mail size={14} />}
                    />
                  </FormField>
                  <FormField label="Password" error={errors.password} required>
                    <PasswordInput
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={!!errors.password}
                    />
                  </FormField>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all"
                    style={{ background: loading ? "#D0D5DD" : "linear-gradient(135deg, #344054, #475467)" }}
                  >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <><ShieldCheck size={14} /> Secure Admin Login</>}
                  </button>
                </form>

                <div className="mt-5 p-3 rounded-xl bg-[#F59E0B]/6 border border-[#F59E0B]/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={13} className="text-[#F59E0B] mt-0.5 shrink-0" />
                    <p className="text-xs text-[#667085] leading-relaxed">
                      This portal is restricted to authorised CareerOS administrators. Unauthorised access attempts are logged and reported.
                    </p>
                  </div>
                </div>
              </>
            )}

            {stage === "success" && (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#22A06B]/10 flex items-center justify-center mx-auto">
                  <CheckCircle size={22} className="text-[#22A06B]" />
                </div>
                <p className="font-display font-semibold text-[#101828]">Identity Verified</p>
                <p className="text-xs text-[#667085]">Redirecting to admin panel…</p>
                <div className="h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-1 bg-[#22A06B] rounded-full" style={{ width: "100%", transition: "width 1.2s ease" }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <ShieldCheck size={12} className="text-[#98A2B3]" />
          <span className="text-[10px] text-[#98A2B3]">Role enforced server-side · Session logged</span>
        </div>
      </div>
    </div>
  );
}
