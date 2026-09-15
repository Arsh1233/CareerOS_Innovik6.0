import { useSearchParams, useNavigate } from "react-router";
import { AlertCircle, ArrowLeft, RefreshCw, CreditCard, Sparkles } from "lucide-react";

const PLAN_COLOR: Record<string, string> = {
  "student-pro":          "#4F7CFF",
  "college":              "#6E72E8",
  "recruiter-starter":    "#8B7CFF",
  "recruiter-enterprise": "#8B7CFF",
};

export default function SubscriptionFailed() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const planId  = params.get("plan")    ?? "student-pro";
  const billing = params.get("billing") ?? "annual";
  const color   = PLAN_COLOR[planId]    ?? "#4F7CFF";

  function tryAgain() {
    navigate(`/subscription?plan=${planId}&billing=${billing}`);
  }

  function changeMethod() {
    navigate(`/subscription?plan=${planId}&billing=${billing}&step=2`);
  }

  function backToPlans() {
    navigate("/landing");
  }

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
          {/* Error icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-[#FFF1F2] border-4 border-[#FECDD3]">
              <AlertCircle size={28} className="text-[#E5484D]" />
            </div>
            <h1 className="text-2xl font-bold text-[#101828] text-center">{"Payment wasn't completed"}</h1>
            <p className="text-[#475467] text-sm mt-2 text-center max-w-xs leading-relaxed">
              Your subscription has not been activated. Please try again or choose another payment method.
            </p>
          </div>

          {/* Info box */}
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 mb-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold text-[#344054] mb-3">Common reasons for payment failure</p>
            <div className="space-y-2">
              {[
                "Insufficient balance or credit limit",
                "Transaction declined by your bank",
                "UPI / wallet authentication timed out",
                "Network issue during payment",
              ].map(r => (
                <div key={r} className="flex items-start gap-2 text-xs text-[#667085]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D0D5DD] mt-1.5 shrink-0" />
                  {r}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#98A2B3] mt-3 pt-3 border-t border-[#F1F5F9]">
              No amount has been deducted. If you see a pending charge, it will be automatically reversed within 3–5 business days.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button onClick={tryAgain}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: color, boxShadow: `0 4px 14px ${color}30` }}>
              <RefreshCw size={14} /> Try Again
            </button>
            <button onClick={changeMethod}
              className="w-full py-3 rounded-xl border border-[#E4E7EC] text-[#475467] text-sm font-semibold hover:border-[#D0D5DD] flex items-center justify-center gap-2 transition-colors">
              <CreditCard size={14} /> Change Payment Method
            </button>
            <button onClick={backToPlans}
              className="w-full py-3 rounded-xl text-[#98A2B3] text-sm font-semibold flex items-center justify-center gap-2 hover:text-[#667085] transition-colors">
              <ArrowLeft size={14} /> Back to Plans
            </button>
          </div>

          <p className="text-center text-[10px] text-[#98A2B3] mt-6">
            Need help? Contact us at support@careeros.in
          </p>
        </div>
      </div>
    </div>
  );
}
