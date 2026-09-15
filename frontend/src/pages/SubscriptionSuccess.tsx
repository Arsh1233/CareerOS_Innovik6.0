import { useSearchParams, useNavigate } from "react-router";
import { Check, ArrowRight, Download, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PLAN_NAMES: Record<string, string> = {
  "student-pro":          "CareerOS Pro",
  "college":              "College Plan",
  "recruiter-starter":    "Recruiter Starter",
  "recruiter-enterprise": "Recruiter Enterprise",
};

const ROLE_HOME: Record<string, string> = {
  "student-pro":          "/dashboard",
  "college":              "/college",
  "recruiter-starter":    "/recruiter",
  "recruiter-enterprise": "/recruiter",
};

const PLAN_COLOR: Record<string, string> = {
  "student-pro":          "#4F7CFF",
  "college":              "#6E72E8",
  "recruiter-starter":    "#8B7CFF",
  "recruiter-enterprise": "#8B7CFF",
};

function fmt(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

function getNextRenewal(billing: string) {
  const d = new Date();
  billing === "annual" ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

export default function SubscriptionSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const planId  = params.get("plan")    ?? "student-pro";
  const billing = params.get("billing") ?? "annual";
  const amount  = Number(params.get("amount") ?? 2000);
  const txn     = params.get("txn")    ?? `TXN-${Date.now().toString(36).toUpperCase()}`;

  const planName  = PLAN_NAMES[planId]  ?? "CareerOS Pro";
  const color     = PLAN_COLOR[planId]  ?? "#4F7CFF";
  const homeRoute = ROLE_HOME[planId]   ?? "/dashboard";

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      {/* Minimal header */}
      <header className="h-14 bg-white border-b border-[#E4E7EC] flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color }}>
            <Sparkles size={13} className="text-white" />
          </div>
          <span className="font-bold text-sm text-[#101828]">CareerOS</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Success icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#22A06B", boxShadow: "0 0 0 12px #22A06B18" }}>
                <Check size={28} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#101828] text-center">{"You're all set!"}</h1>
            <p className="text-[#475467] text-sm mt-2 text-center">
              <strong style={{ color }}>{planName}</strong> is now active on your account.
            </p>
          </div>

          {/* Subscription summary */}
          <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-[0_2px_16px_rgba(0,0,0,0.05)] p-5 mb-5 space-y-3">
            {[
              { label: "Plan",               value: planName },
              { label: "Billing",            value: billing === "annual" ? "Annual" : "Monthly" },
              { label: "Amount Paid",        value: fmt(amount) },
              { label: "Next Renewal",       value: getNextRenewal(billing) },
              { label: "Transaction Ref",    value: txn },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-[#98A2B3]">{label}</span>
                <span className="text-sm font-semibold text-[#101828]">{value}</span>
              </div>
            ))}
          </div>

          {/* Premium unlocked indicator */}
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border mb-5"
            style={{ borderColor: `${color}30`, background: `${color}08` }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: color }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color }}>Premium unlocked</p>
              <p className="text-xs text-[#667085]">All {planName} features are now available.</p>
            </div>
          </div>

          {/* Invoice download */}
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E4E7EC] text-xs font-semibold text-[#475467] hover:border-[#D0D5DD] hover:bg-white transition-colors mb-4">
            <Download size={13} /> Download Invoice
          </button>

          {/* CTAs */}
          <button onClick={() => navigate(homeRoute)}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 mb-3 transition-all"
            style={{ background: color, boxShadow: `0 4px 14px ${color}30` }}>
            Explore Pro Features <ArrowRight size={15} />
          </button>
          <button
            onClick={() => navigate(planId.startsWith("student") ? "/profile" : planId.startsWith("college") ? "/college/settings" : "/recruiter/settings")}
            className="w-full py-3 rounded-xl border border-[#E4E7EC] text-[#475467] text-sm font-semibold hover:border-[#D0D5DD] transition-colors">
            View Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
