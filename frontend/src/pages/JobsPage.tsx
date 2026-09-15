import { useState } from "react";
import { MapPin, DollarSign, Bookmark, ExternalLink, X, ChevronRight, Search, SlidersHorizontal } from "lucide-react";

type Job = {
  id: number;
  company: string;
  role: string;
  location: string;
  salary: string;
  match: number;
  matchSkills: string[];
  missingSkill: string;
  type: string;
  logo: string;
};

const jobs: Job[] = [
  {
    id: 1, company: "Flipkart", role: "AI Engineer", location: "Bangalore, India",
    salary: "₹22–32 LPA", match: 92, matchSkills: ["Python", "TensorFlow", "ML Pipelines"],
    missingSkill: "Kubernetes", type: "Full-time",
    logo: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=40&h=40&fit=crop",
  },
  {
    id: 2, company: "Infosys BPM", role: "ML Specialist", location: "Pune, India",
    salary: "₹18–24 LPA", match: 88, matchSkills: ["PyTorch", "NLP", "API Development"],
    missingSkill: "MLOps", type: "Full-time",
    logo: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=40&h=40&fit=crop",
  },
  {
    id: 3, company: "Zomato", role: "Data Scientist – AI", location: "Gurgaon, India",
    salary: "₹16–22 LPA", match: 85, matchSkills: ["Python", "Spark", "Recommendation Systems"],
    missingSkill: "LLM Fine-tuning", type: "Full-time",
    logo: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=40&h=40&fit=crop",
  },
  {
    id: 4, company: "Razorpay", role: "AI/ML Engineer", location: "Bangalore, India",
    salary: "₹24–35 LPA", match: 82, matchSkills: ["Deep Learning", "Python", "FastAPI"],
    missingSkill: "System Design at Scale", type: "Full-time",
    logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=40&h=40&fit=crop",
  },
  {
    id: 5, company: "Swiggy", role: "Machine Learning Engineer", location: "Bangalore, India",
    salary: "₹18–26 LPA", match: 79, matchSkills: ["Scikit-learn", "SQL", "Data Engineering"],
    missingSkill: "Kafka / Real-time ML", type: "Full-time",
    logo: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=40&h=40&fit=crop",
  },
];

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
  const [selected, setSelected] = useState<Job | null>(null);
  const [saved, setSaved] = useState<number[]>([]);

  function toggleSave(id: number) {
    setSaved((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
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
              <p className="text-[#22A06B] text-xs font-semibold mt-0.5">12 strong matches for you</p>
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
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelected(job)}
              className={`p-4 cursor-pointer transition-colors hover:bg-[#F9FAFB] ${selected?.id === job.id ? "bg-[#F7F9FC] border-l-2 border-[#4F7CFF]" : ""}`}
            >
              <div className="flex items-start gap-3">
                <img
                  src={job.logo}
                  alt={job.company}
                  className="w-10 h-10 rounded-xl object-cover bg-[#F1F5F9] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-[#101828] font-display">{job.role}</p>
                      <p className="text-xs text-[#667085]">{job.company}</p>
                    </div>
                    <MatchBadge score={job.match} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#98A2B3]">
                    <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
                    <span className="flex items-center gap-1"><DollarSign size={10} />{job.salary}</span>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {job.matchSkills.slice(0, 2).map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded-md bg-[#4F7CFF]/8 text-[#4F7CFF] text-[10px] font-medium">{s}</span>
                    ))}
                    <span className="px-1.5 py-0.5 rounded-md bg-[#E5484D]/8 text-[#E5484D] text-[10px] font-medium">-{job.missingSkill}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected ? (
        <div className="flex-1 overflow-y-auto bg-[#F7F9FC]">
          <div className="p-6 max-w-[640px] space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <img src={selected.logo} alt={selected.company} className="w-14 h-14 rounded-2xl object-cover bg-[#F1F5F9]" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#101828]">{selected.role}</h2>
                    <p className="text-[#667085] text-sm">{selected.company}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="lg:hidden text-[#98A2B3] hover:text-[#667085]">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#667085]">
                  <span className="flex items-center gap-1"><MapPin size={12} />{selected.location}</span>
                  <span className="flex items-center gap-1"><DollarSign size={12} />{selected.salary}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#667085]">{selected.type}</span>
                </div>
              </div>
            </div>

            {/* Match */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-sm text-[#101828]">Your Match</h3>
                <MatchBadge score={selected.match} />
              </div>
              <div className="h-2 bg-[#F1F5F9] rounded-full mb-3">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${selected.match}%`,
                    background: "linear-gradient(90deg, #4F7CFF, #8B7CFF)",
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#22A06B] mb-1.5">Matching Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.matchSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-full bg-[#22A06B]/8 text-[#22A06B] text-xs font-medium border border-[#22A06B]/15">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#E5484D] mb-1.5">Missing Requirement</p>
                  <span className="px-2 py-0.5 rounded-full bg-[#E5484D]/8 text-[#E5484D] text-xs font-medium border border-[#E5484D]/15">{selected.missingSkill}</span>
                </div>
              </div>
            </div>

            {/* Job description snippet */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
              <h3 className="font-display font-semibold text-sm text-[#101828] mb-3">About this Role</h3>
              <p className="text-sm text-[#475467] leading-relaxed">
                We're looking for an AI Engineer to join our personalization team. You'll build and maintain ML pipelines that power recommendations for 500M+ users. You'll work across model development, deployment, and monitoring in a cloud-native environment.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {["Python 3.10+", "TensorFlow / PyTorch", "Kubernetes preferred", "Distributed systems", "3+ years experience", "B.Tech / M.Tech CS"].map((req) => (
                  <div key={req} className="flex items-center gap-2 text-xs text-[#475467]">
                    <ChevronRight size={12} className="text-[#98A2B3]" />
                    {req}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="btn-primary text-white font-semibold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 flex-1 justify-center">
                <ExternalLink size={14} />
                Apply Now
              </button>
              <button
                onClick={() => toggleSave(selected.id)}
                className={`p-2.5 rounded-xl border transition-all ${
                  saved.includes(selected.id)
                    ? "border-[#4F7CFF] bg-[#4F7CFF]/8 text-[#4F7CFF]"
                    : "border-[#E4E7EC] text-[#667085] hover:border-[#D0D5DD]"
                }`}
              >
                <Bookmark size={16} fill={saved.includes(selected.id) ? "#4F7CFF" : "none"} />
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
