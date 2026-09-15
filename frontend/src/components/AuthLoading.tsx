import { Loader2, Sparkles } from "lucide-react";

/**
 * Shown while a stored session is being restored (GET /users/me).
 *
 * Guards must wait for this instead of treating "still loading" as
 * "unauthenticated", otherwise a page refresh would bounce the user to the
 * landing page before the session resolves.
 */
export default function AuthLoading({ label = "Restoring your session…" }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0F1117]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF]">
          <Sparkles size={18} className="text-white" strokeWidth={1.8} />
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[#667085] dark:text-[#9199B2]">
          <Loader2 size={13} className="animate-spin" />
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}
