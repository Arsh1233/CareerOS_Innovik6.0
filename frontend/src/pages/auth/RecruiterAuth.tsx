import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Users, Sparkles, Check, ArrowLeft, Loader2, Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { authService } from "../../services/index";

type Mode = "login" | "signup";

const FEATURES = [
  "AI Candidate Search",
  "Match Score Engine",
  "Candidate Ranking",
  "Talent Pipeline",
  "Resume Intelligence",
  "Hiring Analytics",
];

function GoogleWorkspaceIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function RecruiterAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const { success, error: showError, info } = useToast();

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [transitioning, setTransitioning] = useState(false);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleForgotPassword() {
    if (!forgotEmail) { showError("Please enter your email address."); return; }
    setForgotLoading(true);
    await authService.resetPassword(forgotEmail);
    setForgotLoading(false);
    setForgotOpen(false);
    setForgotEmail("");
    success("Password reset link sent! Check your email.");
  }

  async function handleGoogleSignIn() {
    const result = await authService.loginWithGoogle();
    if (!result.success) info(result.message);
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
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    const isNew = mode === "signup";
    signIn({
      role: "recruiter",
      email,
      name: fullName || company || email.split("@")[0],
      onboardingComplete: !isNew,
    });
    navigate(isNew ? "/onboarding/recruiter" : "/recruiter");
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7CFF]/20 focus:border-[#8B7CFF] transition-all placeholder:text-[#C0C9D8]";

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
        style={{ background: "linear-gradient(150deg, #7B6EFF 0%, #8B7CFF 50%, #55C7F3 100%)" }}
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
              <Users size={24} className="text-white" />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50 mb-2">Recruiter</div>
            <h2 className="font-display font-bold text-white text-2xl leading-tight mb-2">
              Hire faster with<br />AI-powered talent
            </h2>
            <p className="text-white/60 text-[13px] mb-6 leading-relaxed">
              90+ leading companies already trust CareerOS
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
                {mode === "login" ? "Welcome back" : "Create Recruiter Account"}
              </h1>
              <p className="text-[#667085] text-[13px] mb-5">
                {mode === "login"
                  ? "Your next great hire could already be here."
                  : "Start discovering top talent with AI"}
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
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#344054] mb-1.5">Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Priya Mehta" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#344054] mb-1.5">Company Name</label>
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Technologies" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#344054] mb-1.5">Job Title</label>
                    <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Head of Talent Acquisition" className={inputCls} />
                  </div>
                </>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-[#344054] mb-1.5">Work Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={inputCls} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-[#344054]">Password</label>
                  {mode === "login" && <button type="button" onClick={() => setForgotOpen(true)} className="text-[11px] text-[#8B7CFF] hover:underline">Forgot password?</button>}
                </div>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls + " pr-10"} />
                  <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085] transition-colors">
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-[12px] text-red-500">{error}</p>}

              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: loading ? "#D0D5DD" : "linear-gradient(135deg, #8B7CFF, #55C7F3)", boxShadow: loading ? "none" : "0 4px 14px rgba(139,124,255,0.28)" }}
              >
                {loading
                  ? <><Loader2 size={13} className="animate-spin" />{mode === "login" ? "Signing in…" : "Creating account…"}</>
                  : mode === "login" ? "Login to Recruiter Portal" : "Create Recruiter Account"}
              </button>
            </form>

            {mode === "login" && (
              <>
                <div className="relative my-4">
                  <div className="h-px bg-[#E4E7EC]" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[11px] text-[#98A2B3]">or</span>
                </div>
                <button type="button" onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#D0D5DD] text-[13px] font-medium text-[#344054] hover:bg-[#F7F9FC] transition-colors">
                  <GoogleWorkspaceIcon /> Continue with Google Workspace
                </button>
              </>
            )}

            <p className="mt-4 text-center text-[12px] text-[#98A2B3]">
              {mode === "login" ? "New to CareerOS? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="text-[#8B7CFF] font-semibold hover:underline"
              >
                {mode === "login" ? "Create Account" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setForgotOpen(false); }}>
          <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-xl w-full max-w-[360px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-[#101828]">Reset Password</h3>
              <button onClick={() => setForgotOpen(false)} className="text-[#98A2B3] hover:text-[#667085]"><X size={16} /></button>
            </div>
            <p className="text-[13px] text-[#667085] mb-4">{"Enter your work email and we'll send a reset link."}</p>
            <input
              type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#8B7CFF]/20 focus:border-[#8B7CFF] mb-4"
            />
            <button
              onClick={handleForgotPassword} disabled={forgotLoading}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: forgotLoading ? "#D0D5DD" : "linear-gradient(135deg, #8B7CFF, #55C7F3)" }}
            >
              {forgotLoading ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : "Send Reset Link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
