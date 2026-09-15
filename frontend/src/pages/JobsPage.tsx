import { useState, useEffect } from "react";
import { MapPin, DollarSign, Bookmark, ExternalLink, X, ChevronRight, Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { getJobMatches, applyToJob } from "../lib/api/jobs";
import type { JobMatch } from "../lib/api/types";
import { useToast } from "../context/ToastContext";

function MatchBadge({ score }: { score: number }) {
  const color = score >= 90 ? "#22A06B" : score >= 80 ? "#4F7CFF" : "#F59E0B";
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: `${color}14`, color }}
    >
      {score}% match
    </div>
  );
}

export default function JobsPage() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<JobMatch | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const { error, success } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const data = await getJobMatches();
        setMatches(data);
        if (data.length > 0) {
          setSelected(data[0]);
        }
      } catch (err: any) {
        error(err.message || "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [error]);

  function toggleSave(id: string) {
    setSaved((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function handleApply(id: string) {
    if (selected?.has_applied) return;
    setApplying(true);
    try {
      await applyToJob(id);
      success("Application submitted successfully!");
      
      // Update local state
      setMatches(prev => prev.map(m => m.job.id === id ? { ...m, has_applied: true } : m));
      if (selected && selected.job.id === id) {
        setSelected({ ...selected, has_applied: true });
      }
    } catch (err: any) {
      error(err.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4 text-[#667085]">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B7CFF]" />
          <p className="font-medium text-sm animate-pulse">Finding best matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Job list */}
      <div className={`flex flex-col ${selected ? "hidden lg:flex lg:w-[420px]" : "flex-1"} border-r border-[#E4E7EC] bg-white`}>
        {/* Header */}
        <div className="p-5 border-b border-[#E4E7EC]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-display text-lg font-bold text-[#101828]">Job Matches</h1>
              <p className="text-[#22A06B] text-xs font-semibold mt-0.5">{matches.length} strong matches for you</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E7EC] text-xs text-[#667085] hover:border-[#D0D5DD] transition-colors">
              <SlidersHorizontal size={12} />
              Filters
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            <input
              placeholder="Search by role, company, or skill..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E4E7EC] text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/25 focus:border-[#4F7CFF] transition-all"
            />
          </div>
          <div className="flex gap-2 mt-2.5 overflow-x-auto pb-0.5">
            {["All", "Remote", "Full-time", "Internship", "> 80% match"].map((f, i) => (
              <button
                key={f}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                  i === 0 ? "border-[#4F7CFF] bg-[#4F7CFF]/8 text-[#4F7CFF]" : "border-[#E4E7EC] text-[#667085]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
          {matches.map((match) => (
            <div
              key={match.job.id}
              onClick={() => setSelected(match)}
              className={`p-4 cursor-pointer transition-colors hover:bg-[#F9FAFB] ${selected?.job.id === match.job.id ? "bg-[#F7F9FC] border-l-2 border-[#4F7CFF]" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B7CFF] to-[#6E72E8] flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {match.job.company_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-[#101828] font-display">{match.job.title}</p>
                      <p className="text-xs text-[#667085]">{match.job.company_name}</p>
                    </div>
                    <MatchBadge score={match.match_score} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#98A2B3]">
                    <span className="flex items-center gap-1"><MapPin size={10} />{match.job.location}</span>
                    {match.job.salary_range && (
                      <span className="flex items-center gap-1"><DollarSign size={10} />{match.job.salary_range}</span>
                    )}
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {match.matching_skills.slice(0, 2).map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded-md bg-[#4F7CFF]/8 text-[#4F7CFF] text-[10px] font-medium">{s}</span>
                    ))}
                    {match.missing_skills.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#E5484D]/8 text-[#E5484D] text-[10px] font-medium">-{match.missing_skills[0]}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {matches.length === 0 && (
             <div className="p-8 text-center text-[#667085]">
                <p className="text-sm font-medium">No matches found.</p>
                <p className="text-xs mt-1">Upload your resume to see personalized matches.</p>
             </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected ? (
        <div className="flex-1 overflow-y-auto bg-[#F7F9FC]">
          <div className="p-6 max-w-[640px] space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B7CFF] to-[#6E72E8] flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {selected.job.company_name[0]}
                </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#101828]">{selected.job.title}</h2>
                    <p className="text-[#667085] text-sm">{selected.job.company_name}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="lg:hidden text-[#98A2B3] hover:text-[#667085]">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#667085]">
                  <span className="flex items-center gap-1"><MapPin size={12} />{selected.job.location}</span>
                  {selected.job.salary_range && (
                     <span className="flex items-center gap-1"><DollarSign size={12} />{selected.job.salary_range}</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#667085]">{selected.job.employment_type}</span>
                </div>
              </div>
            </div>

            {/* Match */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-sm text-[#101828]">Your Match</h3>
                <MatchBadge score={selected.match_score} />
              </div>
              <div className="h-2 bg-[#F1F5F9] rounded-full mb-3">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${selected.match_score}%`,
                    background: "linear-gradient(90deg, #4F7CFF, #8B7CFF)",
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#22A06B] mb-1.5">Matching Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.matching_skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-full bg-[#22A06B]/8 text-[#22A06B] text-xs font-medium border border-[#22A06B]/15">{s}</span>
                    ))}
                    {selected.matching_skills.length === 0 && <span className="text-xs text-[#98A2B3]">None</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#E5484D] mb-1.5">Missing Requirements</p>
                  <div className="flex flex-wrap gap-1.5">
                     {selected.missing_skills.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full bg-[#E5484D]/8 text-[#E5484D] text-xs font-medium border border-[#E5484D]/15">{s}</span>
                     ))}
                     {selected.missing_skills.length === 0 && <span className="text-xs text-[#98A2B3]">None</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Job description snippet */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
              <h3 className="font-display font-semibold text-sm text-[#101828] mb-3">About this Role</h3>
              <p className="text-sm text-[#475467] leading-relaxed whitespace-pre-wrap">
                {selected.job.description || "No description provided."}
              </p>
              
              <h4 className="font-display font-semibold text-xs text-[#101828] mt-4 mb-2">Requirements</h4>
              <div className="grid grid-cols-2 gap-2">
                {selected.job.required_skills.map((req) => (
                  <div key={req} className="flex items-center gap-2 text-xs text-[#475467]">
                    <ChevronRight size={12} className="text-[#98A2B3]" />
                    {req}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => handleApply(selected.job.id)}
                disabled={selected.has_applied || applying}
                className="btn-primary text-white font-semibold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applying ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                {selected.has_applied ? "Applied" : "Apply Now"}
              </button>
              <button
                onClick={() => toggleSave(selected.job.id)}
                className={`p-2.5 rounded-xl border transition-all ${
                  saved.includes(selected.job.id)
                    ? "border-[#4F7CFF] bg-[#4F7CFF]/8 text-[#4F7CFF]"
                    : "border-[#E4E7EC] text-[#667085] hover:border-[#D0D5DD]"
                }`}
              >
                <Bookmark size={16} fill={saved.includes(selected.job.id) ? "#4F7CFF" : "none"} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex items-center justify-center text-center p-8">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
              <ExternalLink size={22} className="text-[#98A2B3]" />
            </div>
            <p className="font-display font-semibold text-[#475467]">Select a job to view details</p>
            <p className="text-sm text-[#98A2B3] mt-1">Click any job on the left to see the full breakdown</p>
          </div>
        </div>
      )}
    </div>
  );
}
