import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import {
  GraduationCap, Building2, Users, ShieldCheck, Sparkles, ArrowRight,
  Mail, Lock, User, Phone, Globe, CheckCircle, Loader2, AlertCircle,
} from "lucide-react";
import EcosystemVisual from "../components/auth/EcosystemVisual";
import { FormField, TextInput, PasswordInput, SelectField } from "../components/ui/FormField";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../context/AuthContext";

type Mode = "login" | "signup";

interface RoleConfig {
  icon: React.ElementType;
  label: string;
  tagline: string;
  color: string;
  bg: string;
  border: string;
  ring: string;
}

const roleConfig: Record<Role, RoleConfig> = {
  student: {
    icon: GraduationCap, label: "Student", tagline: "Career clarity & growth",
    color: "#4F7CFF", bg: "#4F7CFF0D", border: "#4F7CFF", ring: "#4F7CFF30",
  },
  college: {
    icon: Building2, label: "College", tagline: "Placement intelligence",
    color: "#6E72E8", bg: "#6E72E80D", border: "#6E72E8", ring: "#6E72E830",
  },
  recruiter: {
    icon: Users, label: "Recruiter", tagline: "Precision talent discovery",
    color: "#8B7CFF", bg: "#8B7CFF0D", border: "#8B7CFF", ring: "#8B7CFF30",
  },
  admin: {
    icon: ShieldCheck, label: "Admin", tagline: "Secure system access",
    color: "#475467", bg: "#4754670D", border: "#475467", ring: "#47546730",
  },
};

function RoleCard({ role, selected, onSelect }: { role: Role; selected: boolean; onSelect: () => void }) {
  const cfg = roleConfig[role];
  const Icon = cfg.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 flex-1"
      style={{
        background: selected ? cfg.bg : "transparent",
        borderColor: selected ? cfg.border : "#E4E7EC",
        boxShadow: selected ? `0 0 0 3px ${cfg.ring}` : "none",
      }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: selected ? cfg.border : "#F1F5F9" }}>
        <Icon size={17} style={{ color: selected ? "#fff" : "#98A2B3" }} />
      </div>
      <span className="text-xs font-semibold" style={{ color: selected ? cfg.color : "#475467" }}>{cfg.label}</span>
      <span className="text-[9px] text-[#98A2B3] text-center leading-tight hidden sm:block">{cfg.tagline}</span>
    </button>
  );
}

// ---------- Forms ----------

function StudentLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <FormField label="Email" error={errors.email} required>
        <TextInput type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} error={!!errors.email} leftIcon={<Mail size={14} />} />
      </FormField>
      <FormField label="Password" error={errors.password} required>
        <PasswordInput placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} error={!!errors.password} />
      </FormField>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-3.5 h-3.5 rounded accent-[#4F7CFF]" />
          <span className="text-xs text-[#667085]">Remember me</span>
        </label>
        <button type="button" onClick={() => setForgotSent(true)} className="text-xs text-[#4F7CFF] hover:underline font-medium">
          Forgot password?
        </button>
      </div>
      {forgotSent && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#22A06B]/8 border border-[#22A06B]/20 text-xs text-[#22A06B]">
          <CheckCircle size={13} /> Reset link sent to {email || "your email"}
        </div>
      )}
      <SubmitButton loading={loading} label="Sign In" color="#4F7CFF" />
      <GoogleButton />
    </form>
  );
}

function StudentSignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [f, setF] = useState({ name: "", email: "", password: "", college: "", degree: "", branch: "", gradYear: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Full name is required";
    if (!f.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(f.email)) e.email = "Enter a valid email";
    if (!f.password) e.password = "Password is required";
    else if (f.password.length < 8) e.password = "Minimum 8 characters";
    if (!f.college.trim()) e.college = "College name is required";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    onSuccess();
  }

  const degreeOptions = [
    { value: "btech", label: "B.Tech / B.E." },
    { value: "bsc", label: "B.Sc" },
    { value: "bca", label: "BCA" },
    { value: "mtech", label: "M.Tech / M.E." },
    { value: "msc", label: "M.Sc" },
    { value: "mba", label: "MBA" },
    { value: "phd", label: "Ph.D" },
  ];
  const years = Array.from({ length: 6 }, (_, i) => ({ value: `${2024 + i}`, label: `${2024 + i}` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Full Name" error={errors.name} required>
          <TextInput placeholder="Rohan Kumar" value={f.name} onChange={set("name")} error={!!errors.name} leftIcon={<User size={14} />} />
        </FormField>
        <FormField label="Email" error={errors.email} required>
          <TextInput type="email" placeholder="you@uni.edu" value={f.email} onChange={set("email")} error={!!errors.email} leftIcon={<Mail size={14} />} />
        </FormField>
      </div>
      <FormField label="Password" error={errors.password} required hint="Minimum 8 characters">
        <PasswordInput placeholder="••••••••" value={f.password} onChange={set("password")} error={!!errors.password} />
      </FormField>
      <FormField label="College / University" error={errors.college} required>
        <TextInput placeholder="SRM Institute of Science and Technology" value={f.college} onChange={set("college")} error={!!errors.college} />
      </FormField>
      <div className="grid grid-cols-3 gap-2">
        <FormField label="Degree">
          <SelectField options={degreeOptions} placeholder="Select" value={f.degree} onChange={set("degree")} />
        </FormField>
        <FormField label="Branch">
          <TextInput placeholder="CSE / IT / ECE" value={f.branch} onChange={set("branch")} />
        </FormField>
        <FormField label="Grad Year">
          <SelectField options={years} placeholder="Year" value={f.gradYear} onChange={set("gradYear")} />
        </FormField>
      </div>
      <SubmitButton loading={loading} label="Create Student Account" color="#4F7CFF" />
      <GoogleButton />
    </form>
  );
}

function CollegeLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    if (!password) e.password = "Password is required";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <FormField label="Institutional Email" error={errors.email} required>
        <TextInput type="email" placeholder="placement@institution.edu" value={email} onChange={(e) => setEmail(e.target.value)} error={!!errors.email} leftIcon={<Mail size={14} />} />
      </FormField>
      <FormField label="Password" error={errors.password} required>
        <PasswordInput placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} error={!!errors.password} />
      </FormField>
      <SubmitButton loading={loading} label="Sign In to College Portal" color="#6E72E8" />
    </form>
  );
}

function CollegeSignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [f, setF] = useState({ instName: "", email: "", contact: "", designation: "", phone: "", instType: "", city: "", state: "", website: "", studentCount: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (!f.instName.trim()) e.instName = "Institution name is required";
    if (!f.email.trim()) e.email = "Official email is required";
    else if (!f.email.includes(".edu") && !f.email.includes(".ac.in")) e.email = "Must be an institutional email (.edu or .ac.in)";
    if (!f.contact.trim()) e.contact = "Contact person is required";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 2000));
    onSuccess();
  }

  const instTypes = [
    { value: "university", label: "University" },
    { value: "college", label: "College" },
    { value: "deemed", label: "Deemed University" },
    { value: "iit", label: "IIT / NIT / IIIT" },
    { value: "private", label: "Private Institute" },
  ];

  if (verifying) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#6E72E8]/10 flex items-center justify-center mx-auto">
          <Mail size={22} className="text-[#6E72E8]" />
        </div>
        <p className="font-display font-semibold text-[#101828]">Verify your institutional email</p>
        <p className="text-sm text-[#667085]">We sent a verification link to <strong>{f.email}</strong>. Check your inbox and click the link to continue.</p>
        <div className="flex items-center justify-center gap-2 text-xs text-[#98A2B3]">
          <Loader2 size={12} className="animate-spin" /> Waiting for verification...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Institution Name" error={errors.instName} required>
          <TextInput placeholder="SRM Institute" value={f.instName} onChange={set("instName")} error={!!errors.instName} />
        </FormField>
        <FormField label="Official Email" error={errors.email} required>
          <TextInput type="email" placeholder="tpo@srm.ac.in" value={f.email} onChange={set("email")} error={!!errors.email} leftIcon={<Mail size={14} />} />
        </FormField>
        <FormField label="Contact Person" error={errors.contact} required>
          <TextInput placeholder="Dr. Ramesh Kumar" value={f.contact} onChange={set("contact")} error={!!errors.contact} leftIcon={<User size={14} />} />
        </FormField>
        <FormField label="Designation">
          <TextInput placeholder="Placement Officer" value={f.designation} onChange={set("designation")} />
        </FormField>
        <FormField label="Phone">
          <TextInput type="tel" placeholder="+91 98765 43210" value={f.phone} onChange={set("phone")} leftIcon={<Phone size={14} />} />
        </FormField>
        <FormField label="Institution Type">
          <SelectField options={instTypes} placeholder="Select type" value={f.instType} onChange={set("instType")} />
        </FormField>
        <FormField label="City">
          <TextInput placeholder="Chennai" value={f.city} onChange={set("city")} />
        </FormField>
        <FormField label="State">
          <TextInput placeholder="Tamil Nadu" value={f.state} onChange={set("state")} />
        </FormField>
        <FormField label="Website">
          <TextInput placeholder="www.srm.edu.in" value={f.website} onChange={set("website")} leftIcon={<Globe size={14} />} />
        </FormField>
        <FormField label="Total Students">
          <TextInput type="number" placeholder="5000" value={f.studentCount} onChange={set("studentCount")} />
        </FormField>
      </div>
      <SubmitButton loading={loading} label="Register Institution" color="#6E72E8" />
    </form>
  );
}

function RecruiterLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Work email is required";
    if (!password) e.password = "Password is required";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <FormField label="Work Email" error={errors.email} required>
        <TextInput type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} error={!!errors.email} leftIcon={<Mail size={14} />} />
      </FormField>
      <FormField label="Password" error={errors.password} required>
        <PasswordInput placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} error={!!errors.password} />
      </FormField>
      <SubmitButton loading={loading} label="Sign In to Recruiter Hub" color="#8B7CFF" />
    </form>
  );
}

function RecruiterSignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [f, setF] = useState({ name: "", email: "", password: "", company: "", title: "", industry: "", companySize: "", location: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Full name is required";
    if (!f.email.trim()) e.email = "Work email is required";
    else if (!/\S+@\S+\.\S+/.test(f.email)) e.email = "Enter a valid email";
    if (!f.password) e.password = "Password is required";
    else if (f.password.length < 8) e.password = "Minimum 8 characters";
    if (!f.company.trim()) e.company = "Company is required";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    onSuccess();
  }

  const sizes = [
    { value: "1-10", label: "1–10 employees" },
    { value: "11-50", label: "11–50 employees" },
    { value: "51-200", label: "51–200 employees" },
    { value: "201-500", label: "201–500 employees" },
    { value: "500+", label: "500+ employees" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Full Name" error={errors.name} required>
          <TextInput placeholder="Priya Singh" value={f.name} onChange={set("name")} error={!!errors.name} leftIcon={<User size={14} />} />
        </FormField>
        <FormField label="Work Email" error={errors.email} required>
          <TextInput type="email" placeholder="you@company.com" value={f.email} onChange={set("email")} error={!!errors.email} leftIcon={<Mail size={14} />} />
        </FormField>
      </div>
      <FormField label="Password" error={errors.password} required hint="Minimum 8 characters">
        <PasswordInput placeholder="••••••••" value={f.password} onChange={set("password")} error={!!errors.password} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Company" error={errors.company} required>
          <TextInput placeholder="Flipkart" value={f.company} onChange={set("company")} error={!!errors.company} />
        </FormField>
        <FormField label="Job Title">
          <TextInput placeholder="HR Manager / TA Lead" value={f.title} onChange={set("title")} />
        </FormField>
        <FormField label="Industry">
          <TextInput placeholder="Technology / E-Commerce" value={f.industry} onChange={set("industry")} />
        </FormField>
        <FormField label="Company Size">
          <SelectField options={sizes} placeholder="Select size" value={f.companySize} onChange={set("companySize")} />
        </FormField>
      </div>
      <FormField label="Hiring Location">
        <TextInput placeholder="Bangalore, Hyderabad, Remote" value={f.location} onChange={set("location")} />
      </FormField>
      <SubmitButton loading={loading} label="Create Recruiter Account" color="#8B7CFF" />
    </form>
  );
}

// ---------- Shared sub-components ----------

function SubmitButton({ loading, label, color }: { loading: boolean; label: string; color: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all"
      style={{
        background: loading ? "#D0D5DD" : `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
        boxShadow: loading ? "none" : `0 4px 14px ${color}35`,
      }}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <><span>{label}</span><ArrowRight size={14} /></>}
    </button>
  );
}

function GoogleButton() {
  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E4E7EC]" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-[#98A2B3]">or continue with</span></div>
      </div>
      <button type="button" className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-[#D0D5DD] text-sm font-medium text-[#344054] hover:bg-[#F9FAFB] transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
    </>
  );
}

// ---------- Main Auth Page ----------

const ONBOARDING_ROUTES: Record<Role, string> = {
  student: "/onboarding/student",
  college: "/onboarding/college",
  recruiter: "/onboarding/recruiter",
  admin: "/admin",
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("student");

  function handleSuccess() {
    signIn({ role, email: "", name: "", onboardingComplete: false });
    if (role === "admin") {
      navigate("/admin");
    } else if (mode === "signup") {
      navigate(ONBOARDING_ROUTES[role]);
    } else {
      // Existing user — go to their dashboard
      const dashRoutes: Record<Role, string> = {
        student: "/dashboard",
        college: "/college",
        recruiter: "/recruiter",
        admin: "/admin",
      };
      navigate(dashRoutes[role]);
    }
  }

  const cfg = roleConfig[role];

  function renderForm() {
    if (role === "admin") {
      return (
        <div className="py-4 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#475467]/10 flex items-center justify-center mx-auto">
            <ShieldCheck size={18} className="text-[#475467]" />
          </div>
          <p className="text-sm text-[#667085]">Admin accounts require secure login.</p>
          <Link
            to="/admin"
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all"
            style={{ background: "linear-gradient(135deg, #475467, #344054)" }}
          >
            <ShieldCheck size={14} /> Go to Admin Login
          </Link>
        </div>
      );
    }
    if (role === "student") return mode === "login" ? <StudentLoginForm onSuccess={handleSuccess} /> : <StudentSignupForm onSuccess={handleSuccess} />;
    if (role === "college") return mode === "login" ? <CollegeLoginForm onSuccess={handleSuccess} /> : <CollegeSignupForm onSuccess={handleSuccess} />;
    if (role === "recruiter") return mode === "login" ? <RecruiterLoginForm onSuccess={handleSuccess} /> : <RecruiterSignupForm onSuccess={handleSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col w-[480px] shrink-0 bg-gradient-to-br from-[#131726] via-[#1b2247] to-[#141829] px-10 py-10 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute top-[-100px] right-[-80px] w-[340px] h-[340px] rounded-full bg-[#4F7CFF]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[40px] left-[-60px] w-[280px] h-[280px] rounded-full bg-[#8B7CFF]/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-auto">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">CareerOS</span>
        </div>

        {/* Central visual */}
        <div className="my-6">
          <EcosystemVisual />
        </div>

        <div className="mb-auto">
          <h1 className="font-display text-3xl font-bold text-white leading-tight mb-3">
            Your Career Ecosystem<br />
            <span className="shimmer-text">Starts Here</span>
          </h1>
          <p className="text-white/55 text-sm leading-relaxed">
            Students grow. Colleges monitor. Recruiters hire.<br />CareerOS connects it all.
          </p>
        </div>

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
          {[
            { n: "50K+", l: "Students" },
            { n: "800+", l: "Colleges" },
            { n: "2K+", l: "Recruiters" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-display font-bold text-white text-lg">{s.n}</p>
              <p className="text-white/40 text-[11px]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right auth panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-[480px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-[#101828]">CareerOS</span>
          </div>

          {/* Auth card */}
          <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-[0_2px_24px_rgba(0,0,0,0.06)] p-7">
            {/* Mode tabs */}
            <div className="flex bg-[#F7F9FC] rounded-xl p-1 mb-5 border border-[#E4E7EC]">
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={
                    mode === m
                      ? { background: "white", color: cfg.color, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                      : { color: "#98A2B3" }
                  }
                >
                  {m === "login" ? "Login" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Role selector */}
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#98A2B3] mb-2">I am a</p>
              <div className="flex gap-2">
                {(["student", "college", "recruiter", "admin"] as Role[]).map((r) => (
                  <RoleCard key={r} role={r} selected={role === r} onSelect={() => setRole(r)} />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#F1F5F9] mb-5" />

            {/* Context heading */}
            <div className="mb-4">
              <h2 className="font-display text-lg font-bold text-[#101828]">
                {mode === "login" ? `Welcome back` : `Join as ${roleConfig[role].label}`}
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">{cfg.tagline}</p>
            </div>

            {/* Dynamic form */}
            <div className="overflow-y-auto max-h-[420px] pr-0.5">
              {renderForm()}
            </div>

            {role !== "admin" && (
              <p className="text-center text-xs text-[#667085] mt-5">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="font-semibold hover:underline"
                  style={{ color: cfg.color }}
                >
                  {mode === "login" ? "Create Account" : "Sign In"}
                </button>
              </p>
            )}
          </div>

          <p className="text-center text-xs text-[#98A2B3] mt-4">
            By continuing you agree to CareerOS{" "}
            <span className="text-[#667085] underline cursor-pointer">Terms</span> &{" "}
            <span className="text-[#667085] underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
