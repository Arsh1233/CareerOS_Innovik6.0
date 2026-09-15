import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { ShieldCheck, Mail, Loader2, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { FormField, TextInput, PasswordInput, OTPInput } from "../components/ui/FormField";
import { useAuth } from "../context/AuthContext";

type Stage = "credentials" | "otp" | "success";

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  async function handleCredentials(ev: FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Admin email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    setStage("otp");
  }

  async function handleOTP(ev: FormEvent) {
    ev.preventDefault();
    if (otp.length < 6) {
      setOtpError("Enter all 6 digits");
      return;
    }
    setOtpError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);

    if (otp !== "123456") {
      setOtpError("Invalid verification code. Try 123456 for demo.");
      return;
    }

    setStage("success");
    signIn({ role: "admin", email, name: "Admin", onboardingComplete: true });
    await new Promise((r) => setTimeout(r, 1200));
    navigate("/admin");
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
                  <p className="text-xs text-[#667085]">Enter your credentials. A 2FA code will be sent to your device.</p>
                </div>

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

            {stage === "otp" && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#4F7CFF]/10 flex items-center justify-center mx-auto mb-3">
                    <Mail size={20} className="text-[#4F7CFF]" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-[#101828] mb-1">Verification Code</h2>
                  <p className="text-xs text-[#667085]">
                    A 6-digit code was sent to <strong>{email}</strong>
                  </p>
                  <p className="text-[10px] text-[#98A2B3] mt-1">Use <strong>123456</strong> for this demo</p>
                </div>

                <form onSubmit={handleOTP} className="space-y-4">
                  <OTPInput value={otp} onChange={setOtp} length={6} />

                  {otpError && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#E5484D]/8 border border-[#E5484D]/20 text-xs text-[#E5484D]">
                      <AlertCircle size={12} /> {otpError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #1a1f3e, #2d3476)" }}
                  >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <><ShieldCheck size={14} /> Verify & Enter Admin Panel</>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStage("credentials")}
                    className="w-full text-xs text-[#98A2B3] hover:text-[#667085] transition-colors"
                  >
                    ← Change email address
                  </button>
                </form>
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
          <span className="text-[10px] text-[#98A2B3]">256-bit encrypted · Session logged · MFA enforced</span>
        </div>
      </div>
    </div>
  );
}
