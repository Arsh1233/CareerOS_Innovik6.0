import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Building2, Sparkles, Check, ArrowLeft, Loader2, Eye, EyeOff, Info, X } from "lucide-react";
import { ROLE_LABEL, useAuth, type Role } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { authApi, isApiError, userMessage } from "../../lib/api";

type Mode = "login" | "register";

const FEATURES = [
  "Placement Readiness Dashboard",
  "Student Progress Monitoring",
  "Skill Gap Analytics",
  "Department Insights",
  "At-Risk Student Detection",
  "Recruiter Engagement",
];

export default function CollegeAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const { success, error: showError } = useToast();

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("mode") === "signup" ? "register" : "login"
  );
  const [transitioning, setTransitioning] = useState(false);
  const [institutionName, setInstitutionName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [redirectRole, setRedirectRole] = useState<Role | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleForgotPassword() {
    if (forgotLoading) return;
    if (!forgotEmail) { showError("Please enter your email address."); return; }
    setForgotLoading(true);
    try {
      await authApi.requestPasswordReset(forgotEmail.trim());
      setForgotOpen(false);
      setForgotEmail("");
      // The backend deliberately does not disclose whether the account exists.
      success("If an account exists for this email, a password reset link has been sent.");
    } catch (err) {
      showError(userMessage(err));
    } finally {
      setForgotLoading(false);
    }
  }

  function switchMode(newMode: Mode) {
    if (newMode === mode || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setError("");
      setTransitioning(false);
    }, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setNotice("");
    setRedirectRole(null);
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);

    try {
      if (mode === "login") {
        const signedIn = await signIn({
          email: email.trim(),
          password,
          expectedRole: "college",
        });
        success(`Welcome back, ${signedIn.name.split(" ")[0]}`);
        navigate("/college");
        return;
      }

      const outcome = await signUp({
        email: email.trim(),
        password,
        full_name: contactPerson.trim() || institutionName.trim() || email.trim().split("@")[0],
        role: "college",
      });

      if (outcome.requiresEmailConfirmation) {
        setNotice(outcome.message ?? "Check your email to confirm your account.");
        switchMode("login");
        return;
      }

      success("Account created. Let's set up your institution.");
      navigate("/onboarding/college");
    } catch (err) {
      if (isApiError(err) && err.code === "role_mismatch") {
        const actual = err.details.actualRole as Role | undefined;
        setRedirectRole(actual ?? null);
      }
      setError(userMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#6E72E8]/20 focus:border-[#6E72E8] transition-all placeholder:text-[#C0C9D8]";

  return (
    <div className="min-h-screen flex">
      <style>{`
        @keyframes slideOutLeft  { to   { opacity: 0; transform: translateX(-12px); } }
        @keyframes slideInRight  { from { opacity: 0; transform: translateX(12px); }  }
        .form-exit  { animation: slideOutLeft 200ms ease forwards; }
        .form-enter { animation: slideInRight 200ms ease both; }
      `}</style>

      {/* Left panel */}
      <div
        className="w-[400px] shrink-0 flex flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #5A5FD8 0%, #6E72E8 50%, #8B7CFF 100%)" }}
      >
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute bottom-20 -left-16 w-44 h-44 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col h-full p-9">
          <button onClick={() => navigate("/landing")} className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">CareerOS</span>
          </button>

          <div className="mt-auto mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-5">
              <Building2 size={24} className="text-white" />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50 mb-2">College Portal</div>
            <h2 className="font-display font-bold text-white text-2xl leading-tight mb-2">
              Placement intelligence<br />for your institution
            </h2>
            <p className="text-white/60 text-[13px] mb-6 leading-relaxed">
              Used by 140+ institutions across India
            </p>
            <ul className="space-y-2.5">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check size={9} className="text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-white/80 text-[13px]">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-white/30 text-[11px]">© 2026 CareerOS · Privacy · Terms</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F7F9FC]">
        <div className="w-full max-w-[380px]">
          <button
            onClick={() => navigate("/landing")}
            className="flex items-center gap-1.5 text-[13px] text-[#98A2B3] hover:text-[#475467] mb-6 transition-colors"
          >
            <ArrowLeft size={13} /> Change Role
          </button>

          <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-[0_2px_24px_rgba(0,0,0,0.06)] p-7">
            <div className={transitioning ? "form-exit" : "form-enter"}>
              <h1 className="font-display font-bold text-[#101828] text-[1.2rem] mb-1">
                {mode === "login" ? "Welcome back" : "Register Institution"}
              </h1>
              <p className="text-[#667085] text-[13px] mb-5">
                {mode === "login"
                  ? "Access your placement intelligence workspace."
                  : "Register your college on CareerOS"}
              </p>
            </div>

            {/* Mode tabs */}
            <div className="flex bg-[#F7F9FC] rounded-lg p-1 mb-5">
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="flex-1 py-1.5 rounded-md text-[13px] font-medium transition-all"
                  style={mode === m ? { background: "#fff", color: "#101828", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "#667085" }}
                >
                  {m === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className={`space-y-3.5 ${transitioning ? "form-exit" : "form-enter"}`}>
              {mode === "register" && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#344054] mb-1.5">Institution Name</label>
                    <input type="text" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder="SRM Institute of Science and Technology" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#344054] mb-1.5">Contact Person</label>
                    <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Dr. Anita Sharma" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#344054] mb-1.5">Designation</label>
                    <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Placement Director" className={inputCls} />
                  </div>
                </>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-[#344054] mb-1.5">Official Institution Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="placement@institution.edu.in" className={inputCls} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-[#344054]">Password</label>
                  {mode === "login" && <button type="button" onClick={() => setForgotOpen(true)} className="text-[11px] text-[#6E72E8] hover:underline">Forgot password?</button>}
                </div>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls + " pr-10"} />
                  <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085] transition-colors">
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#6E72E8]/6 border border-[#6E72E8]/15">
                  <Info size={13} className="text-[#6E72E8] mt-0.5 shrink-0" />
                  <p className="text-[12px] text-[#475467] leading-relaxed">
                    Institution verification may be required. Our team will review your registration within 1–2 business days.
                  </p>
                </div>
              )}

              {error && <p className="text-[12px] text-red-500">{error}</p>}
              {notice && (
                <p className="text-[12px] text-[#6E72E8] bg-[#6E72E8]/6 border border-[#6E72E8]/20 rounded-lg px-3 py-2">
                  {notice}
                </p>
              )}
              {redirectRole && (
                <button
                  type="button"
                  onClick={() => navigate(redirectRole === "admin" ? "/auth/admin" : `/auth/${redirectRole}`)}
                  className="w-full py-2 rounded-xl border border-[#D0D5DD] text-[12px] font-semibold text-[#344054] hover:bg-[#F7F9FC] transition-colors"
                >
                  Go to {ROLE_LABEL[redirectRole]} login
                </button>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: loading ? "#D0D5DD" : "linear-gradient(135deg, #6E72E8, #8B7CFF)", boxShadow: loading ? "none" : "0 4px 14px rgba(110,114,232,0.28)" }}
              >
                {loading
                  ? <><Loader2 size={13} className="animate-spin" />{mode === "login" ? "Signing in…" : "Submitting registration…"}</>
                  : mode === "login" ? "Login to College Portal" : "Register Institution"}
              </button>
            </form>

            <p className="mt-4 text-center text-[12px] text-[#98A2B3]">
              {mode === "login" ? "New institution? " : "Already registered? "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                className="text-[#6E72E8] font-semibold hover:underline"
              >
                {mode === "login" ? "Register Institution" : "Login"}
              </button>
            </p>
          </div>

          <p className="mt-4 text-center text-[12px] text-[#98A2B3]">
            Need help? <button type="button" onClick={() => success("Our team will reach out within 1–2 business days.")} className="text-[#6E72E8] cursor-pointer hover:underline">Contact our onboarding team →</button>
          </p>

          {forgotOpen && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setForgotOpen(false); }}>
              <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-xl w-full max-w-[360px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-[#101828]">Reset Password</h3>
                  <button onClick={() => setForgotOpen(false)} className="text-[#98A2B3] hover:text-[#667085]"><X size={16} /></button>
                </div>
                <p className="text-[13px] text-[#667085] mb-4">{"Enter your email and we'll send a reset link."}</p>
                <input
                  type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="placement@institution.edu.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6E72E8]/20 focus:border-[#6E72E8] mb-4"
                />
                <button
                  onClick={handleForgotPassword} disabled={forgotLoading}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: forgotLoading ? "#D0D5DD" : "linear-gradient(135deg, #6E72E8, #8B7CFF)" }}
                >
                  {forgotLoading ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : "Send Reset Link"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
