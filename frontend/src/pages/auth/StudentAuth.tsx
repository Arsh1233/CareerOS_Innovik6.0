import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { GraduationCap, Sparkles, Check, ArrowLeft, Loader2, Eye, EyeOff, X } from "lucide-react";
import { ROLE_LABEL, useAuth, type Role } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { authApi, isApiError, userMessage } from "../../lib/api";

type Mode = "login" | "signup";

const FEATURES = [
  "Career Twin AI",
  "Resume Intelligence",
  "Skill Gap Analysis",
  "ARIA Mentor",
  "Mock Interviews",
  "Job Matching",
];

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function StudentAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const { success, error: showError, info } = useToast();

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [transitioning, setTransitioning] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [redirectRole, setRedirectRole] = useState<Role | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

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

  function handleGoogleSignIn() {
    // Google OAuth is not wired to the backend yet. No fake sign-in.
    info("Google sign-in is not connected yet. Please continue with your email and password.");
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
    if (mode === "signup" && password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);

    try {
      if (mode === "login") {
        const signedIn = await signIn({
          email: email.trim(),
          password,
          expectedRole: "student",
        });
        success(`Welcome back, ${signedIn.name.split(" ")[0]}`);
        navigate("/dashboard");
        return;
      }

      const outcome = await signUp({
        email: email.trim(),
        password,
        full_name: name.trim() || email.trim().split("@")[0],
        role: "student",
      });

      if (outcome.requiresEmailConfirmation) {
        // The account exists but there is no session: do not pretend otherwise.
        setNotice(outcome.message ?? "Check your email to confirm your account.");
        switchMode("login");
        return;
      }

      success("Account created. Let's finish your setup.");
      navigate("/onboarding/student");
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

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20 focus:border-[#4F7CFF] transition-all placeholder:text-[#C0C9D8]";

  return (
    <div className="min-h-screen flex">
      <style>{`
        @keyframes slideOutLeft  { to   { opacity: 0; transform: translateX(-12px); } }
        @keyframes slideInRight  { from { opacity: 0; transform: translateX(12px); }  }
        .form-exit { animation: slideOutLeft 200ms ease forwards; }
        .form-enter { animation: slideInRight 200ms ease both; }
      `}</style>

      {/* Left panel */}
      <div
        className="w-[400px] shrink-0 flex flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #3D68FF 0%, #6B6FF0 50%, #8B7CFF 100%)" }}
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
              <GraduationCap size={24} className="text-white" />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50 mb-2">Student</div>
            <h2 className="font-display font-bold text-white text-2xl leading-tight mb-2">
              Build your career<br />with AI
            </h2>
            <p className="text-white/60 text-[13px] mb-6 leading-relaxed">
              Join 12,000+ students already on CareerOS
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

      {/* Forgot password modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setForgotOpen(false); }}>
          <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-xl w-full max-w-[360px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-[#101828]">Reset Password</h3>
              <button onClick={() => setForgotOpen(false)} className="text-[#98A2B3] hover:text-[#667085]"><X size={16} /></button>
            </div>
            <p className="text-[13px] text-[#667085] mb-4">{"Enter your email and we'll send you a reset link."}</p>
            <input
              type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@university.edu"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/20 focus:border-[#4F7CFF] mb-4"
            />
            <button
              onClick={handleForgotPassword} disabled={forgotLoading}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: forgotLoading ? "#D0D5DD" : "linear-gradient(135deg, #4F7CFF, #8B7CFF)" }}
            >
              {forgotLoading ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : "Send Reset Link"}
            </button>
          </div>
        </div>
      )}

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F7F9FC]">
        <div className="w-full max-w-[360px]">
          <button
            onClick={() => navigate("/landing")}
            className="flex items-center gap-1.5 text-[13px] text-[#98A2B3] hover:text-[#475467] mb-6 transition-colors"
          >
            <ArrowLeft size={13} /> Change Role
          </button>

          <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-[0_2px_24px_rgba(0,0,0,0.06)] p-7">
            {/* Heading */}
            <div ref={formRef} className={transitioning ? "form-exit" : "form-enter"}>
              <h1 className="font-display font-bold text-[#101828] text-[1.2rem] mb-1">
                {mode === "login" ? "Welcome back" : "Start building your CareerOS"}
              </h1>
              <p className="text-[#667085] text-[13px] mb-5">
                {mode === "login"
                  ? "Continue building your career with CareerOS."
                  : "Create your free student account today."}
              </p>
            </div>

            {/* Mode tabs */}
            <div className="flex bg-[#F7F9FC] rounded-lg p-1 mb-5">
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="flex-1 py-1.5 rounded-md text-[13px] font-medium transition-all"
                  style={mode === m ? { background: "#fff", color: "#101828", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "#667085" }}
                >
                  {m === "login" ? "Login" : "Sign Up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className={`space-y-3.5 ${transitioning ? "form-exit" : "form-enter"}`}>
              {mode === "signup" && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#344054] mb-1.5">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rohan Kumar" className={inputCls} />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-[#344054] mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" className={inputCls} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-[#344054]">Password</label>
                  {mode === "login" && <button type="button" onClick={() => setForgotOpen(true)} className="text-[11px] text-[#4F7CFF] hover:underline">Forgot password?</button>}
                </div>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls + " pr-10"} />
                  <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085] transition-colors">
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              {mode === "signup" && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#344054] mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputCls + " pr-10"} />
                    <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085] transition-colors">
                      {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              )}
              {mode === "login" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-[#4F7CFF]"
                  />
                  <span className="text-[12px] text-[#667085]">Remember me</span>
                </label>
              )}
              {error && <p className="text-[12px] text-red-500">{error}</p>}
              {notice && (
                <p className="text-[12px] text-[#4F7CFF] bg-[#4F7CFF]/6 border border-[#4F7CFF]/20 rounded-lg px-3 py-2">
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
                style={{ background: loading ? "#D0D5DD" : "linear-gradient(135deg, #4F7CFF, #8B7CFF)", boxShadow: loading ? "none" : "0 4px 14px rgba(79,124,255,0.28)" }}
              >
                {loading
                  ? <><Loader2 size={13} className="animate-spin" />{mode === "login" ? "Signing in…" : "Creating account…"}</>
                  : mode === "login" ? "Login as Student" : "Create Student Account"}
              </button>
            </form>

            {mode === "login" && (
              <>
                <div className="relative my-4">
                  <div className="h-px bg-[#E4E7EC]" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[11px] text-[#98A2B3]">or</span>
                </div>
                <button type="button" onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#D0D5DD] text-[13px] font-medium text-[#344054] hover:bg-[#F7F9FC] transition-colors">
                  <GoogleIcon /> Continue with Google
                </button>
              </>
            )}

            <p className="mt-4 text-center text-[12px] text-[#98A2B3]">
              {mode === "login" ? "New to CareerOS? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="text-[#4F7CFF] font-semibold hover:underline"
              >
                {mode === "login" ? "Create Account" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
