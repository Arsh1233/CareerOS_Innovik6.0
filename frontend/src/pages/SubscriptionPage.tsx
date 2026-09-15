import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import {
  Check, Lock, Shield, ArrowLeft, Sparkles, ChevronRight,
  CreditCard, Smartphone, Building2, Wallet, X, AlertCircle, Info,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FormField, TextInput, SelectField } from "../components/ui/FormField";

// ── Plan definitions ───────────────────────────────────────────────────────────

interface PlanDef {
  id: string;
  name: string;
  tagline: string;
  role: "student" | "college" | "recruiter";
  monthlyPrice?: number;
  annualPrice: number;
  badge?: string;
  benefits: string[];
  isEnterprise?: boolean;
  color: string;
}

const PLANS: Record<string, PlanDef> = {
  "student-pro": {
    id: "student-pro", name: "CareerOS Pro", tagline: "Everything you need to get placed",
    role: "student", monthlyPrice: 200, annualPrice: 2000, badge: "Most Popular",
    color: "#4F7CFF",
    benefits: [
      "Advanced Career Twin", "Unlimited ARIA queries", "Resume Intelligence & ATS Analysis",
      "Full Skill Gap Analysis", "Adaptive Career Roadmap", "ECHO Interview Sessions",
      "Advanced Job Matching", "Progress Analytics",
    ],
  },
  "college": {
    id: "college", name: "College Plan", tagline: "Placement intelligence for 5,000 students",
    role: "college", annualPrice: 500000, color: "#6E72E8",
    benefits: [
      "Up to 5,000 student accounts", "Placement Dashboard", "Student Readiness Monitoring",
      "Skill Gap Analytics", "Department Analytics", "Recruiter Engagement Analytics",
      "Multi-Department Intelligence", "Reports & Exports", "Dedicated Account Manager",
    ],
  },
  "recruiter-starter": {
    id: "recruiter-starter", name: "Recruiter Starter", tagline: "Find and hire the right talent faster",
    role: "recruiter", annualPrice: 25000, color: "#8B7CFF",
    benefits: [
      "AI Talent Search", "Candidate Profiles & Match Scores", "Shortlisting Tools",
      "Basic Hiring Analytics", "Campus Access",
    ],
  },
  "recruiter-enterprise": {
    id: "recruiter-enterprise", name: "Recruiter Enterprise", tagline: "Full-scale talent intelligence — billing period to be confirmed",
    role: "recruiter", annualPrice: 150000, isEnterprise: true, color: "#8B7CFF",
    benefits: [
      "Everything in Starter", "Advanced Talent Intelligence", "Full Hiring Pipeline",
      "Bulk Candidate Discovery", "Advanced Analytics", "Institutional Talent Access", "Priority Support & SLA",
    ],
  },
};

const PAYMENT_METHODS = [
  { id: "upi",        label: "UPI",          Icon: Smartphone },
  { id: "card",       label: "Card",         Icon: CreditCard },
  { id: "netbanking", label: "Net Banking",  Icon: Building2 },
  { id: "wallet",     label: "Wallet",       Icon: Wallet },
];

const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Yes Bank", "IndusInd Bank", "Other"];
const WALLETS = ["Paytm", "PhonePe", "Amazon Pay", "Mobikwik", "Freecharge"];

function fmt(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ step, color }: { step: number; color: string }) {
  const steps = ["Review Plan", "Billing Details", "Payment"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: i < step ? "#22A06B" : i === step ? color : "#E4E7EC",
                color: i <= step ? "#fff" : "#98A2B3",
              }}>
              {i < step ? <Check size={13} /> : i + 1}
            </div>
            <span className="text-xs font-semibold hidden sm:inline transition-colors"
              style={{ color: i === step ? color : i < step ? "#22A06B" : "#98A2B3" }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-8 sm:w-12 h-0.5 mx-2 transition-all"
              style={{ background: i < step ? "#22A06B" : "#E4E7EC" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Order summary sidebar ──────────────────────────────────────────────────────

function OrderSummary({ plan, billing, color }: { plan: PlanDef; billing: "annual" | "monthly"; color: string }) {
  const price = billing === "monthly" && plan.monthlyPrice ? plan.monthlyPrice : plan.annualPrice;
  const annualIfMonthly = plan.monthlyPrice ? plan.monthlyPrice * 12 : null;
  const savings = annualIfMonthly && billing === "annual" ? annualIfMonthly - plan.annualPrice : null;

  return (
    <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 space-y-4">
      <div>
        <p className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wide mb-3">Order Summary</p>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-[#101828]">{plan.name}</p>
            <p className="text-xs text-[#98A2B3] capitalize mt-0.5">{billing} billing</p>
          </div>
          <p className="font-bold text-[#101828]">{fmt(price)}</p>
        </div>
      </div>

      {savings && savings > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#F0FFF8] rounded-xl border border-[#22A06B]/20">
          <span className="text-xs font-semibold text-[#22A06B]">Save {fmt(savings)} annually</span>
        </div>
      )}

      <div className="border-t border-[#F1F5F9] pt-4 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-[#667085]">Subtotal</span>
          <span className="text-[#101828] font-medium">{fmt(price)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#667085]">Taxes</span>
          <span className="text-[#98A2B3] text-xs">Calculated at checkout</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-[#F1F5F9]">
          <span className="font-semibold text-[#101828]">Total</span>
          <div className="text-right">
            <p className="font-bold text-[#101828]">{fmt(price)}</p>
            <p className="text-[10px] text-[#98A2B3]">+ applicable taxes</p>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-[#98A2B3] border-t border-[#F1F5F9] pt-3 flex items-start gap-1.5">
        <Info size={11} className="shrink-0 mt-0.5" />
        <span>Renews {billing === "annual" ? "annually" : "monthly"} until cancelled. You can cancel anytime from Settings.</span>
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        {[
          { icon: Lock, text: "Payments secured by our payment partner" },
          { icon: Shield, text: "256-bit SSL encryption" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2">
            <Icon size={11} className="text-[#22A06B] shrink-0" />
            <span className="text-[10px] text-[#98A2B3]">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const planId = params.get("plan") ?? "student-pro";
  const plan = PLANS[planId] ?? PLANS["student-pro"];
  const initialBilling = (params.get("billing") ?? "annual") as "annual" | "monthly";

  const [step, setStep] = useState(0);
  const [billing, setBilling] = useState<"annual" | "monthly">(
    plan.monthlyPrice ? initialBilling : "annual"
  );
  const [enterpriseChoice, setEnterpriseChoice] = useState<"" | "pay" | "request">("");
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Billing form state (role-aware)
  const [billing1, setBilling1] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    country: "India",
    state: "",
    city: "",
    postal: "",
    // college/recruiter extras
    institutionName: "",
    billingContact: user?.name ?? "",
    billingEmail: user?.email ?? "",
    billingAddress: "",
    gstin: "",
    financeEmail: "",
    poNumber: "",
    sameAsMain: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Enterprise request form
  const [entForm, setEntForm] = useState({
    org: "", contact: user?.name ?? "", email: user?.email ?? "",
    phone: "", users: "", requirements: "", timeline: "", message: "",
  });

  const price = billing === "monthly" && plan.monthlyPrice ? plan.monthlyPrice : plan.annualPrice;
  const color = plan.color;

  // ── Validation helpers ───────────────────────────────────────────────────────

  function validateEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function validatePostal(v: string) { return /^\d{6}$/.test(v); }
  function validateGSTIN(v: string) { return v === "" || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v); }

  function validateBilling(): boolean {
    const e: Record<string, string> = {};
    if (!billing1.name) e.name = "Full name is required";
    if (!validateEmail(billing1.email)) e.email = "Enter a valid email address";
    if (!billing1.state) e.state = "State is required";
    if (!billing1.city) e.city = "City is required";
    if (!validatePostal(billing1.postal)) e.postal = "Enter a valid 6-digit postal code";
    if (plan.role !== "student") {
      if (!billing1.institutionName && !billing1.billingContact) e.institutionName = "Organisation name is required";
      if (!validateGSTIN(billing1.gstin)) e.gstin = "Enter a valid GSTIN";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleContinueBilling() {
    if (validateBilling()) setStep(2);
  }

  async function handlePay() {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2800));
    const txnRef = `TXN-${Date.now().toString(36).toUpperCase()}`;
    navigate(`/subscription/success?plan=${plan.id}&billing=${billing}&amount=${price}&txn=${txnRef}`);
  }

  function handleEnterpriseSubmit() {
    setEnterpriseSubmitted(true);
  }

  // ── Processing overlay ────────────────────────────────────────────────────────
  if (processing) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-14 h-14 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${color} transparent transparent transparent` }} />
        <div className="text-center">
          <p className="text-lg font-bold text-[#101828]">Processing your payment</p>
          <p className="text-sm text-[#98A2B3] mt-1">Please don't close this window.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#98A2B3]">
          <Lock size={12} />
          <span>Secured by our payment partner</span>
        </div>
      </div>
    );
  }

  // ── Enterprise request submitted ──────────────────────────────────────────────
  if (enterpriseSubmitted) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
        <CheckoutHeader color={color} />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: color, boxShadow: `0 0 0 10px ${color}18` }}>
              <Check size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#101828] mb-2">Request Received</h1>
            <p className="text-[#475467] text-sm leading-relaxed mb-8">
              Thanks. Our team will contact you regarding your CareerOS Enterprise setup.
              We typically respond within one business day.
            </p>
            <button onClick={() => navigate(plan.role === "college" ? "/college" : "/recruiter")}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold" style={{ background: color }}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Page layout ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <CheckoutHeader color={color} />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8 items-start">

          {/* ── Main area ── */}
          <div>
            {plan.isEnterprise && enterpriseChoice !== "pay" ? (
              /* Enterprise mode */
              <EnterpriseSection plan={plan} color={color} choice={enterpriseChoice}
                setChoice={setEnterpriseChoice} form={entForm} setForm={setEntForm}
                onSubmit={handleEnterpriseSubmit} />
            ) : (
              /* Normal checkout */
              <>
                <StepIndicator step={step} color={color} />

                {step === 0 && (
                  <ReviewStep plan={plan} billing={billing} setBilling={setBilling}
                    color={color} onContinue={() => setStep(1)} />
                )}
                {step === 1 && (
                  <BillingStep plan={plan} data={billing1} setData={setBilling1}
                    errors={errors} color={color}
                    onBack={() => setStep(0)} onContinue={handleContinueBilling} />
                )}
                {step === 2 && (
                  <PaymentStep plan={plan} billing={billing} price={price} color={color}
                    billingData={billing1} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                    upiId={upiId} setUpiId={setUpiId} cardData={cardData} setCardData={setCardData}
                    selectedBank={selectedBank} setSelectedBank={setSelectedBank}
                    selectedWallet={selectedWallet} setSelectedWallet={setSelectedWallet}
                    agreed={agreed} setAgreed={setAgreed}
                    onBack={() => setStep(1)} onPay={handlePay} />
                )}
              </>
            )}
          </div>

          {/* ── Sticky sidebar ── */}
          <div className="lg:sticky lg:top-6">
            <OrderSummary plan={plan} billing={billing} color={color} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Checkout header ────────────────────────────────────────────────────────────

function CheckoutHeader({ color }: { color: string }) {
  const navigate = useNavigate();
  return (
    <header className="h-14 bg-white border-b border-[#E4E7EC] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color }}>
          <Sparkles size={13} className="text-white" />
        </div>
        <span className="font-bold text-sm text-[#101828]">CareerOS</span>
        <span className="text-[#D0D5DD] mx-2">|</span>
        <div className="flex items-center gap-1.5 text-xs text-[#667085]">
          <Lock size={11} />
          <span>Secure Checkout</span>
        </div>
      </div>
      <button onClick={() => navigate(-1)} className="text-xs text-[#98A2B3] hover:text-[#475467] flex items-center gap-1 transition-colors">
        <ArrowLeft size={13} /> Back to CareerOS
      </button>
    </header>
  );
}

// ── Step 0: Review Plan ────────────────────────────────────────────────────────

function ReviewStep({ plan, billing, setBilling, color, onContinue }: {
  plan: PlanDef; billing: "annual" | "monthly"; setBilling: (b: "annual" | "monthly") => void;
  color: string; onContinue: () => void;
}) {
  const price = billing === "monthly" && plan.monthlyPrice ? plan.monthlyPrice : plan.annualPrice;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#101828]">Review Your Plan</h1>
        <p className="text-sm text-[#98A2B3] mt-1">Your plan is pre-selected. Continue when ready.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            {plan.badge && (
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
                style={{ background: `${color}15`, color }}>
                {plan.badge}
              </span>
            )}
            <h2 className="text-lg font-bold text-[#101828]">{plan.name}</h2>
            <p className="text-sm text-[#667085]">{plan.tagline}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#101828]">{fmt(price)}</p>
            <p className="text-xs text-[#98A2B3]">/{billing === "monthly" ? "month" : "year"}</p>
          </div>
        </div>

        {/* Billing toggle (student only) */}
        {plan.monthlyPrice && (
          <div className="flex items-center gap-1 mb-5 p-1 bg-[#F1F5F9] rounded-xl w-fit">
            {(["monthly", "annual"] as const).map(b => (
              <button key={b} type="button" onClick={() => setBilling(b)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                style={billing === b ? { background: color, color: "#fff" } : { color: "#667085" }}>
                {b}
              </button>
            ))}
          </div>
        )}

        {plan.monthlyPrice && billing === "annual" && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-[#F0FFF8] rounded-xl border border-[#22A06B]/20">
            <Check size={12} className="text-[#22A06B]" />
            <span className="text-xs font-semibold text-[#22A06B]">
              Save {fmt(plan.monthlyPrice * 12 - plan.annualPrice)} compared to monthly billing
            </span>
          </div>
        )}

        <div className="space-y-2 mb-6">
          {plan.benefits.map(b => (
            <div key={b} className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${color}18` }}>
                <Check size={9} style={{ color }} />
              </div>
              <span className="text-sm text-[#344054]">{b}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
          <Link to="/landing" className="text-xs text-[#98A2B3] hover:text-[#475467] transition-colors">
            Change Plan
          </Link>
          <button onClick={onContinue}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: color, boxShadow: `0 4px 14px ${color}30` }}>
            Continue to Billing <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Billing Details ────────────────────────────────────────────────────

function BillingStep({ plan, data, setData, errors, color, onBack, onContinue }: {
  plan: PlanDef; data: any; setData: (d: any) => void; errors: Record<string, string>;
  color: string; onBack: () => void; onContinue: () => void;
}) {
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setData((p: any) => ({ ...p, [k]: e.target.value }));

  const STATES = ["Andhra Pradesh","Delhi","Gujarat","Karnataka","Kerala","Maharashtra","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal","Other"];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#101828]">Billing Details</h1>
        <p className="text-sm text-[#98A2B3] mt-1">Pre-filled from your CareerOS profile. Verify and complete.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] space-y-5">

        {/* College / Recruiter extra header */}
        {plan.role !== "student" && (
          <>
            <FormField label={plan.role === "college" ? "Institution / Legal Name" : "Company / Legal Name"} required>
              <TextInput value={data.institutionName} onChange={set("institutionName")}
                placeholder={plan.role === "college" ? "SRM Institute of Science and Technology" : "Flipkart Internet Pvt. Ltd."}
                error={!!errors.institutionName} />
              {errors.institutionName && <p className="text-[10px] text-[#E5484D] mt-1">⚠ {errors.institutionName}</p>}
            </FormField>

            <div className="h-px bg-[#F1F5F9]" />
            <p className="text-xs font-semibold text-[#475467] uppercase tracking-wide">Billing Contact</p>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Full Name" required>
            <TextInput value={data.name} onChange={set("name")} placeholder="Aditya Kumar" error={!!errors.name} />
            {errors.name && <p className="text-[10px] text-[#E5484D] mt-1">⚠ {errors.name}</p>}
          </FormField>
          <FormField label="Phone">
            <TextInput type="tel" value={data.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
          </FormField>
        </div>

        <FormField label="Email" required>
          <TextInput type="email" value={data.email} onChange={set("email")} placeholder="you@example.com" error={!!errors.email} />
          {errors.email && <p className="text-[10px] text-[#E5484D] mt-1">⚠ {errors.email}</p>}
        </FormField>

        {plan.role !== "student" && (
          <>
            <FormField label="Billing Address">
              <TextInput value={data.billingAddress} onChange={set("billingAddress")} placeholder="123 Main St, Block A" />
            </FormField>
            <label className="flex items-center gap-2 cursor-pointer"
              onClick={() => setData((p: any) => ({ ...p, sameAsMain: !p.sameAsMain }))}>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${data.sameAsMain ? "border-transparent" : "border-[#D0D5DD]"}`}
                style={data.sameAsMain ? { background: color } : {}}>
                {data.sameAsMain && <Check size={10} className="text-white" />}
              </div>
              <span className="text-xs text-[#475467]">
                {plan.role === "college" ? "Billing address is same as institution address" : "Billing address is same as company address"}
              </span>
            </label>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="State" required>
            <SelectField value={data.state} onChange={set("state")} placeholder="Select state"
              options={STATES.map(s => ({ value: s, label: s }))} error={!!errors.state} />
            {errors.state && <p className="text-[10px] text-[#E5484D] mt-1">⚠ {errors.state}</p>}
          </FormField>
          <FormField label="City" required>
            <TextInput value={data.city} onChange={set("city")} placeholder="Bangalore" error={!!errors.city} />
            {errors.city && <p className="text-[10px] text-[#E5484D] mt-1">⚠ {errors.city}</p>}
          </FormField>
          <FormField label="Postal Code" required>
            <TextInput value={data.postal} onChange={set("postal")} placeholder="560001" error={!!errors.postal} />
            {errors.postal && <p className="text-[10px] text-[#E5484D] mt-1">⚠ {errors.postal}</p>}
          </FormField>
        </div>

        {/* GST / PO fields for B2B */}
        {plan.role !== "student" && (
          <>
            <div className="h-px bg-[#F1F5F9]" />
            <p className="text-xs text-[#98A2B3]">Optional — for GST invoicing and procurement</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="GSTIN">
                <TextInput value={data.gstin} onChange={set("gstin")} placeholder="22AAAAA0000A1Z5" error={!!errors.gstin} />
                {errors.gstin && <p className="text-[10px] text-[#E5484D] mt-1">⚠ {errors.gstin}</p>}
              </FormField>
              <FormField label="Finance / Billing Email">
                <TextInput type="email" value={data.financeEmail} onChange={set("financeEmail")} placeholder="finance@company.com" />
              </FormField>
              <FormField label="Purchase Order Number">
                <TextInput value={data.poNumber} onChange={set("poNumber")} placeholder="PO-2026-0001" />
              </FormField>
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#667085] hover:text-[#475467] transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
          <button onClick={onContinue}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ background: color, boxShadow: `0 4px 14px ${color}30` }}>
            Continue to Payment <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Payment ────────────────────────────────────────────────────────────

function PaymentStep({ plan, billing, price, color, billingData,
  paymentMethod, setPaymentMethod, upiId, setUpiId, cardData, setCardData,
  selectedBank, setSelectedBank, selectedWallet, setSelectedWallet,
  agreed, setAgreed, onBack, onPay }: {
  plan: PlanDef; billing: string; price: number; color: string; billingData: any;
  paymentMethod: string; setPaymentMethod: (m: string) => void;
  upiId: string; setUpiId: (v: string) => void;
  cardData: any; setCardData: (d: any) => void;
  selectedBank: string; setSelectedBank: (v: string) => void;
  selectedWallet: string; setSelectedWallet: (v: string) => void;
  agreed: boolean; setAgreed: (v: boolean) => void;
  onBack: () => void; onPay: () => void;
}) {
  const canPay = agreed && (
    (paymentMethod === "upi" && upiId.trim()) ||
    (paymentMethod === "card" && cardData.number && cardData.expiry && cardData.cvv && cardData.name) ||
    (paymentMethod === "netbanking" && selectedBank) ||
    (paymentMethod === "wallet" && selectedWallet)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#101828]">Secure Payment</h1>
        <p className="text-sm text-[#98A2B3] mt-1">Select your preferred payment method.</p>
      </div>

      {/* Mini confirmation summary */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-4 mb-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div><p className="text-[#98A2B3]">Plan</p><p className="font-semibold text-[#101828] mt-0.5">{plan.name}</p></div>
          <div><p className="text-[#98A2B3]">Billing</p><p className="font-semibold text-[#101828] mt-0.5 capitalize">{billing}</p></div>
          <div><p className="text-[#98A2B3]">Billing to</p><p className="font-semibold text-[#101828] mt-0.5 truncate">{billingData.name}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] space-y-5">
        {/* Payment method tabs */}
        <div>
          <p className="text-xs font-semibold text-[#475467] mb-3">Payment Method</p>
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map(({ id, label, Icon }) => (
              <button key={id} type="button" onClick={() => setPaymentMethod(id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === id ? "border-transparent text-white" : "border-[#E4E7EC] text-[#667085] hover:border-[#D0D5DD]"
                }`}
                style={paymentMethod === id ? { background: color } : {}}>
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* UPI */}
        {paymentMethod === "upi" && (
          <div className="space-y-3">
            <FormField label="UPI ID" hint="e.g. yourname@okaxis">
              <TextInput value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@okaxis" />
            </FormField>
            <div className="flex items-center gap-2 p-3 bg-[#F8F9FC] rounded-xl border border-[#E4E7EC] text-xs text-[#667085]">
              <Smartphone size={13} className="shrink-0" />
              You will receive a payment request on your UPI app to confirm.
            </div>
          </div>
        )}

        {/* Card */}
        {paymentMethod === "card" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-[#F0F4FF] rounded-xl border border-[#C7D7FF] text-xs text-[#4F7CFF]">
              <Lock size={12} className="shrink-0" />
              Card details are processed securely by our payment partner. CareerOS does not store card information.
            </div>
            <FormField label="Name on Card" required>
              <TextInput value={cardData.name} onChange={e => setCardData((p: any) => ({ ...p, name: e.target.value }))} placeholder="Aditya Kumar" />
            </FormField>
            <FormField label="Card Number" required>
              <TextInput value={cardData.number} maxLength={19}
                onChange={e => setCardData((p: any) => ({
                  ...p, number: e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19),
                }))}
                placeholder="1234 5678 9012 3456" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Expiry" required>
                <TextInput value={cardData.expiry} maxLength={5}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, "");
                    const formatted = raw.length >= 2 ? `${raw.slice(0, 2)}/${raw.slice(2, 4)}` : raw;
                    setCardData((p: any) => ({ ...p, expiry: formatted }));
                  }}
                  placeholder="MM/YY" />
              </FormField>
              <FormField label="CVV" required hint="3–4 digits on back of card">
                <TextInput type="password" value={cardData.cvv} maxLength={4}
                  onChange={e => setCardData((p: any) => ({ ...p, cvv: e.target.value.replace(/\D/g, "") }))}
                  placeholder="•••" />
              </FormField>
            </div>
          </div>
        )}

        {/* Net Banking */}
        {paymentMethod === "netbanking" && (
          <div className="space-y-3">
            <FormField label="Select Bank" required>
              <SelectField value={selectedBank} onChange={e => setSelectedBank(e.target.value)}
                placeholder="Choose your bank" options={BANKS.map(b => ({ value: b, label: b }))} />
            </FormField>
            <div className="flex items-center gap-2 p-3 bg-[#F8F9FC] rounded-xl border border-[#E4E7EC] text-xs text-[#667085]">
              <Building2 size={13} className="shrink-0" />
              You will be redirected to your bank's secure login to complete payment.
            </div>
          </div>
        )}

        {/* Wallet */}
        {paymentMethod === "wallet" && (
          <div>
            <p className="text-xs font-semibold text-[#475467] mb-2">Select Wallet</p>
            <div className="grid grid-cols-3 gap-2">
              {WALLETS.map(w => (
                <button key={w} type="button" onClick={() => setSelectedWallet(w)}
                  className="py-2.5 px-3 rounded-xl border text-xs font-medium transition-all"
                  style={selectedWallet === w
                    ? { borderColor: color, background: `${color}10`, color }
                    : { borderColor: "#E4E7EC", color: "#667085" }}>
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-px bg-[#F1F5F9]" />

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAgreed(!agreed)}>
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${agreed ? "border-transparent" : "border-[#D0D5DD]"}`}
            style={agreed ? { background: color } : {}}>
            {agreed && <Check size={11} className="text-white" />}
          </div>
          <span className="text-xs text-[#475467] leading-relaxed">
            I agree to the{" "}
            <span className="underline cursor-pointer" style={{ color }}>Terms of Service</span>
            {" "}and{" "}
            <span className="underline cursor-pointer" style={{ color }}>Subscription Terms</span>.
            I understand this is a recurring subscription and I can cancel anytime.
          </span>
        </label>

        {/* Pay CTA */}
        <div className="space-y-3">
          <button onClick={onPay} disabled={!canPay}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: canPay ? color : "#D0D5DD", boxShadow: canPay ? `0 4px 16px ${color}30` : "none" }}>
            <Lock size={14} />
            Pay {fmt(price)} Securely
          </button>
          <p className="text-center text-[10px] text-[#98A2B3]">
            Payments are processed securely by our payment partner.
          </p>
        </div>

        <div className="flex items-center justify-start">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#98A2B3] hover:text-[#667085] transition-colors">
            <ArrowLeft size={12} /> Back to Billing
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Enterprise section ─────────────────────────────────────────────────────────

function EnterpriseSection({ plan, color, choice, setChoice, form, setForm, onSubmit }: {
  plan: PlanDef; color: string; choice: string; setChoice: (c: "pay" | "request") => void;
  form: any; setForm: (f: any) => void; onSubmit: () => void;
}) {
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p: any) => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <div className="mb-6">
        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
          style={{ background: `${color}15`, color }}>Enterprise</span>
        <h1 className="text-xl font-bold text-[#101828]">{plan.name}</h1>
        <p className="text-sm text-[#667085] mt-1">{plan.tagline}</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 mb-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-2xl font-bold text-[#101828]">{fmt(plan.annualPrice)}</p>
            <p className="text-xs text-[#98A2B3]">/year</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#667085]">Enterprise plans may require</p>
            <p className="text-xs text-[#667085]">procurement & invoice processing</p>
          </div>
        </div>
        <div className="space-y-1.5 mb-5">
          {plan.benefits.map(b => (
            <div key={b} className="flex items-center gap-2">
              <Check size={12} style={{ color }} />
              <span className="text-sm text-[#344054]">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Choice: Pay Online vs Talk to Sales */}
      {!choice && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => setChoice("pay")}
            className="p-5 rounded-2xl border-2 border-[#E4E7EC] bg-white hover:border-[#D0D5DD] text-left transition-all group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
              <CreditCard size={16} style={{ color }} />
            </div>
            <p className="font-bold text-[#101828] mb-1">Pay Online</p>
            <p className="text-xs text-[#667085]">Proceed to secure checkout and pay now with UPI, card, or net banking.</p>
          </button>
          <button onClick={() => setChoice("request")}
            className="p-5 rounded-2xl border-2 bg-white text-left transition-all"
            style={{ borderColor: color }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
              <Sparkles size={16} style={{ color }} />
            </div>
            <p className="font-bold text-[#101828] mb-1">Talk to Sales</p>
            <p className="text-xs text-[#667085]">Request enterprise access with invoice, GST, and procurement support.</p>
          </button>
        </div>
      )}

      {/* Enterprise request form */}
      {choice === "request" && (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-[#101828]">Request Enterprise Access</h2>
            <button onClick={() => setChoice("" as any)} className="text-[#98A2B3] hover:text-[#475467]"><X size={16} /></button>
          </div>
          <p className="text-xs text-[#98A2B3]">Our team will contact you to arrange procurement, invoicing, and onboarding.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Organisation Name" required>
              <TextInput value={form.org} onChange={set("org")} placeholder="Your institution or company" />
            </FormField>
            <FormField label="Contact Person" required>
              <TextInput value={form.contact} onChange={set("contact")} placeholder="Dr. Ramesh Kumar" />
            </FormField>
            <FormField label="Work Email" required>
              <TextInput type="email" value={form.email} onChange={set("email")} placeholder="you@org.com" />
            </FormField>
            <FormField label="Phone">
              <TextInput type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="Expected Users">
              <TextInput type="number" value={form.users} onChange={set("users")} placeholder="1,200 students" />
            </FormField>
            <FormField label="Purchase Timeline">
              <SelectField value={form.timeline} onChange={set("timeline")} placeholder="When do you plan to start?"
                options={["Immediately","Within 1 month","1–3 months","3–6 months"].map(v => ({ value: v, label: v }))} />
            </FormField>
          </div>
          <FormField label="Specific Requirements" hint="Tell us about your use case, compliance needs, or integrations">
            <textarea value={form.requirements} onChange={e => setForm((p: any) => ({ ...p, requirements: e.target.value }))}
              rows={2} placeholder="We need multi-department access and GST invoicing..."
              className="w-full px-3 py-2.5 rounded-xl border border-[#D0D5DD] text-sm text-[#101828] placeholder:text-[#98A2B3] bg-white focus:outline-none focus:ring-2 resize-none" />
          </FormField>
          <FormField label="Message (optional)">
            <textarea value={form.message} onChange={e => setForm((p: any) => ({ ...p, message: e.target.value }))}
              rows={2} placeholder="Anything else you'd like us to know..."
              className="w-full px-3 py-2.5 rounded-xl border border-[#D0D5DD] text-sm text-[#101828] placeholder:text-[#98A2B3] bg-white focus:outline-none focus:ring-2 resize-none" />
          </FormField>
          <button onClick={onSubmit} disabled={!form.org || !form.contact || !form.email}
            className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{ background: color, boxShadow: `0 4px 14px ${color}30` }}>
            Request Enterprise Access
          </button>
        </div>
      )}
    </div>
  );
}
