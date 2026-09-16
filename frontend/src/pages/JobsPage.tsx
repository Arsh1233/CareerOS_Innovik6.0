import { useState, useEffect } from "react";
import { MapPin, DollarSign, Bookmark, ExternalLink, X, ChevronRight, Search, SlidersHorizontal, Loader2, Sparkles, Navigation } from "lucide-react";
import { getJobMatches, applyToJob } from "../lib/api/jobs";
import { discoverJobs } from "../lib/api/discover";
import type { JobMatch, DiscoveredJob } from "../lib/api/types";
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

function ReadinessBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#22A06B" : score >= 50 ? "#F59E0B" : "#E5484D";
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border"
      style={{ borderColor: `${color}30`, color }}
    >
      <Sparkles size={10} />
      {score}% readiness
    </div>
  );
}

export default function JobsPage() {
  const [tab, setTab] = useState<"matches" | "discover">("matches");
  
  // Tab 1 state
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [selected, setSelected] = useState<JobMatch | null>(null);
  
  // Tab 2 state
  const [discovered, setDiscovered] = useState<DiscoveredJob[]>([]);
  const [selectedDisc, setSelectedDisc] = useState<DiscoveredJob | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const { error, success } = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
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

  useEffect(() => {
    if (tab === "discover" && discovered.length === 0 && !discovering) {
      async function loadDiscover() {
        setDiscovering(true);
        try {
          const res = await discoverJobs();
          setDiscovered(res.jobs);
          if (res.jobs.length > 0) {
            setSelectedDisc(res.jobs[0]);
          }
          if (res.cached) {
            // success("Loaded cached jobs from external boards.");
          } else {
            success(`Discovered ${res.jobs.length} jobs from external boards!`);
          }
        } catch (err: any) {
          error(err.message || "Failed to discover jobs");
        } finally {
          setDiscovering(false);
        }
      }
      loadDiscover();
    }
  }, [tab, discovered.length, discovering, error, success]);

  function toggleSave(id: string) {
    setSaved((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function handleApply(id: string) {
    if (selected?.has_applied) return;
    setApplying(true);
    try {
      await applyToJob(id);
      success("Application submitted successfully!");
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

  function handleExternalApply(url: string) {
    window.open(url, "_blank");
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-125">
        <div className="flex flex-col items-center gap-4 text-text-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet" />
          <p className="font-medium text-sm animate-pulse">Finding best matches...</p>
        </div>
      </div>
    );
  }

  const isDiscover = tab === "discover";
  const activeSelected = isDiscover ? selectedDisc : selected;

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Job list */}
      <div className={`flex flex-col ${activeSelected ? "hidden lg:flex lg:w-105" : "flex-1"} border-r border-[#E4E7EC] bg-white`}>
        {/* Header */}
        <div className="p-5 border-b border-[#E4E7EC]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-xl font-bold text-text-1">Jobs</h1>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E7EC] text-xs text-text-3 hover:border-[#D0D5DD] transition-colors">
              <SlidersHorizontal size={12} />
              Filters
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex p-1 bg-surface-2 rounded-xl mb-4">
            <button
              onClick={() => setTab("matches")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                !isDiscover ? "bg-white text-text-1 shadow-sm" : "text-text-3 hover:text-text-2"
              }`}
            >
              My Matches
            </button>
            <button
              onClick={() => setTab("discover")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                isDiscover ? "bg-white text-text-1 shadow-sm" : "text-text-3 hover:text-text-2"
              }`}
            >
              <Navigation size={14} className={isDiscover ? "text-brand" : ""} />
              Discover Web
            </button>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-4" />
            <input
              placeholder="Search by role, company, or skill..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E4E7EC] text-sm text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-surface-2">
          {/* Info banner: no skills in DB yet */}
          {!isDiscover && matches.length > 0 && matches.every(m => m.match_score === 35) && (
            <div className="mx-4 mt-3 mb-1 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
              <span className="text-amber-500 text-xs mt-0.5">⚡</span>
              <div>
                <p className="text-xs font-semibold text-amber-700">Upload your resume for AI-powered match scores</p>
                <p className="text-[11px] text-amber-600 mt-0.5">Currently showing estimated readiness. Your real score will update after resume upload.</p>
              </div>
            </div>
          )}
          {!isDiscover && matches.map((match) => (
            <div
              key={match.job.id}
              onClick={() => setSelected(match)}
              className={`p-4 cursor-pointer transition-colors hover:bg-[#F9FAFB] ${selected?.job.id === match.job.id ? "bg-surface border-l-2 border-brand" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet to-indigo flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {match.job.company_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-text-1 font-display">{match.job.title}</p>
                      <p className="text-xs text-text-3">{match.job.company_name}</p>
                    </div>
                    <MatchBadge score={match.match_score} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-text-4">
                    <span className="flex items-center gap-1"><MapPin size={10} />{match.job.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isDiscover && discovering && (
             <div className="p-8 text-center text-text-3">
               <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet mb-3" />
               <p className="text-sm font-medium text-text-1">Hermes is scraping the web...</p>
               <p className="text-xs mt-1">Scanning LinkedIn, Naukri, Govt & Microsoft boards.</p>
             </div>
          )}

          {isDiscover && !discovering && discovered.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedDisc(job)}
              className={`p-4 cursor-pointer transition-colors hover:bg-[#F9FAFB] ${selectedDisc?.id === job.id ? "bg-surface border-l-2 border-brand" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand to-[#3B82F6] flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm">
                  {job.company[0] || "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <p className="font-semibold text-sm text-text-1 font-display truncate">{job.title}</p>
                      <p className="text-xs text-text-3 truncate">{job.company}</p>
                    </div>
                    <MatchBadge score={job.match_score} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-text-4">
                    <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-2 text-text-3">{job.source}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {(!isDiscover && matches.length === 0) && (
             <div className="p-8 text-center text-text-3">
                <p className="text-sm font-medium">No job matches yet.</p>
                <p className="text-xs mt-1">Post jobs or upload your resume to see matches.</p>
             </div>
          )}
          {(isDiscover && !discovering && discovered.length === 0) && (
             <div className="p-8 text-center text-text-3">
                <p className="text-sm font-medium">No external jobs found.</p>
                <p className="text-xs mt-1">Try updating your target role in your profile.</p>
             </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {activeSelected ? (
        <div className="flex-1 overflow-y-auto bg-surface">
          <div className="p-6 max-w-175 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet to-brand flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-sm">
                  {isDiscover ? (selectedDisc?.company[0] || "C") : (selected?.job.company_name[0])}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-text-1">
                    {isDiscover ? selectedDisc?.title : selected?.job.title}
                  </h2>
                  <p className="text-text-2 font-medium mt-1">
                    {isDiscover ? selectedDisc?.company : selected?.job.company_name}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-text-3">
                    <span className="flex items-center gap-1"><MapPin size={14} />{isDiscover ? selectedDisc?.location : selected?.job.location}</span>
                    {isDiscover ? (
                      selectedDisc?.salary && <span className="flex items-center gap-1"><DollarSign size={14} />{selectedDisc.salary}</span>
                    ) : (
                      selected?.job.salary_range && <span className="flex items-center gap-1"><DollarSign size={14} />{selected.job.salary_range}</span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-[#E2E8F0] text-text-2 font-medium">
                      {isDiscover ? selectedDisc?.job_type : selected?.job.employment_type}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => { isDiscover ? setSelectedDisc(null) : setSelected(null); }} className="lg:hidden absolute top-6 right-6 text-text-4 hover:text-text-3">
                <X size={20} />
              </button>
            </div>

            {/* Match & Readiness */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-text-1">Fit Analysis</h3>
                <div className="flex gap-2">
                  <MatchBadge score={isDiscover ? (selectedDisc?.match_score || 0) : (selected?.match_score || 0)} />
                  <ReadinessBadge score={isDiscover ? (selectedDisc?.readiness_score || 0) : (selected?.readiness_score || 0)} />
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-text-1 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" /> Required Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {isDiscover ? (
                      selectedDisc?.skills_required.map((s) => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-surface-2 text-text-2 text-xs font-medium">{s}</span>
                      ))
                    ) : (
                      selected?.job.required_skills.map((s) => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-surface-2 text-text-2 text-xs font-medium">{s}</span>
                      ))
                    )}
                  </div>
                </div>
                {!isDiscover && selected && (
                  <div>
                    <p className="text-sm font-semibold text-text-1 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-error" /> Missing Requirements
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selected.missing_skills.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-[#FEF2F2] text-error border border-[#FECACA] text-xs font-medium">{s}</span>
                      ))}
                      {selected.missing_skills.length === 0 && <span className="text-xs text-text-4">None</span>}
                    </div>
                  </div>
                )}
                {isDiscover && selectedDisc && (
                  <div>
                    <p className="text-sm font-semibold text-text-1 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-warning" /> Sourced From
                    </p>
                    <span className="px-3 py-1.5 rounded-lg bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-sm font-semibold">
                      {selectedDisc.source}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold text-text-1 mb-4">About this Role</h3>
              <p className="text-[15px] text-text-2 leading-relaxed whitespace-pre-wrap">
                {isDiscover ? selectedDisc?.description : selected?.job.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              {isDiscover ? (
                <button 
                  onClick={() => handleExternalApply(selectedDisc?.apply_url || "")}
                  className="btn-primary text-white font-bold text-[15px] px-8 py-3.5 rounded-xl flex items-center gap-2 flex-1 justify-center shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <ExternalLink size={18} />
                  Apply on {selectedDisc?.source.split(" ")[0]}
                </button>
              ) : (
                <button 
                  onClick={() => handleApply(selected!.job.id)}
                  disabled={selected?.has_applied || applying}
                  className="btn-primary text-white font-bold text-[15px] px-8 py-3.5 rounded-xl flex items-center gap-2 flex-1 justify-center shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                >
                  {applying ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
                  {selected?.has_applied ? "Application Submitted" : "Apply to Job"}
                </button>
              )}
              <button
                onClick={() => toggleSave(isDiscover ? selectedDisc!.id : selected!.job.id)}
                className={`p-3.5 rounded-xl border transition-all ${
                  saved.includes(isDiscover ? selectedDisc!.id : selected!.job.id)
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-[#E4E7EC] text-text-3 hover:border-[#D0D5DD] bg-white hover:bg-[#F8FAFC]"
                }`}
              >
                <Bookmark size={20} fill={saved.includes(isDiscover ? selectedDisc!.id : selected!.job.id) ? "#4F7CFF" : "none"} />
              </button>
            </div>
            
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex items-center justify-center text-center p-8">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#E4E7EC] shadow-sm flex items-center justify-center mx-auto mb-4">
              <Navigation size={24} className="text-text-4" />
            </div>
            <p className="font-display text-lg font-bold text-text-1">Select a job to view details</p>
            <p className="text-sm text-text-3 mt-1.5 max-w-62.5 mx-auto">Click any job on the left to see the full description and requirements.</p>
          </div>
        </div>
      )}
    </div>
  );
}
