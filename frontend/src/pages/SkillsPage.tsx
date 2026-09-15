import { useNavigate } from "react-router";
import { ArrowRight, Sparkles, BookOpen } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useToast } from "../context/ToastContext";
import { skillsService } from "../services/index";

const radarData = [
  { skill: "ML/AI", current: 72, target: 90 },
  { skill: "Python", current: 85, target: 90 },
  { skill: "System Design", current: 55, target: 85 },
  { skill: "MLOps", current: 40, target: 80 },
  { skill: "Data Engineering", current: 65, target: 75 },
  { skill: "LLM Fine-tuning", current: 35, target: 75 },
];

const gaps = [
  {
    skill: "MLOps & Kubernetes",
    current: 40, required: 80, priority: "Critical",
    effort: "6–8 weeks", resource: "Docker & Kubernetes Masterclass",
  },
  {
    skill: "LLM Fine-tuning & RLHF",
    current: 35, required: 75, priority: "Critical",
    effort: "4–6 weeks", resource: "Hugging Face PEFT & RLHF Course",
  },
  {
    skill: "System Design for ML",
    current: 55, required: 85, priority: "Recommended",
    effort: "3–4 weeks", resource: "Designing ML Systems — O'Reilly",
  },
  {
    skill: "Data Engineering",
    current: 65, required: 75, priority: "Recommended",
    effort: "2–3 weeks", resource: "Apache Spark & Kafka Fundamentals",
  },
  {
    skill: "Cloud AI Services",
    current: 50, required: 70, priority: "Optional",
    effort: "2 weeks", resource: "AWS SageMaker & GCP Vertex AI",
  },
];

const priorityColors: Record<string, string> = {
  Critical: "#E5484D",
  Recommended: "#F59E0B",
  Optional: "#22A06B",
};

export default function SkillsPage() {
  const navigate = useNavigate();
  const { success } = useToast();

  async function handleBuildRoadmap() {
    await skillsService.buildRoadmap();
    success("Roadmap built! Redirecting…");
    setTimeout(() => navigate("/roadmap"), 800);
  }

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="fade-up">
        <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">Skill Gap Intelligence</h1>
        <p className="text-[#667085] text-sm">What are you missing for your target role?</p>
      </div>

      {/* Hero metrics */}
      <div className="grid sm:grid-cols-3 gap-4 fade-up-1">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
          <p className="text-xs text-[#667085] mb-1">Target Role</p>
          <p className="font-display text-xl font-bold text-[#4F7CFF]">AI Engineer</p>
          <p className="text-xs text-[#98A2B3] mt-0.5">Machine Learning · Full Stack AI</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
          <p className="text-xs text-[#667085] mb-1">Overall Readiness</p>
          <div className="flex items-end gap-2">
            <p className="font-display text-3xl font-bold text-[#101828]">78<span className="text-lg text-[#98A2B3]">%</span></p>
            <span className="text-xs text-[#22A06B] font-semibold mb-1">↑ 4% this month</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
          <p className="text-xs text-[#667085] mb-1">Critical Skill Gaps</p>
          <div className="flex items-end gap-2">
            <p className="font-display text-3xl font-bold text-[#E5484D]">3</p>
            <span className="text-xs text-[#667085] mb-1">of 12 required skills</span>
          </div>
        </div>
      </div>

      {/* Chart + Gaps */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-5 fade-up-2">
        {/* Radar */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Skill Map</h3>
          <p className="text-xs text-[#667085] mb-3">Current vs. required for AI Engineer</p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#E4E7EC" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#667085" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }} />
              <Radar name="Required" dataKey="target" stroke="#E4E7EC" fill="#F1F5F9" fillOpacity={0.7} />
              <Radar name="Current" dataKey="current" stroke="#4F7CFF" fill="#4F7CFF" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-[#4F7CFF]/50" />
              <span className="text-xs text-[#667085]">Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-[#E4E7EC]" />
              <span className="text-xs text-[#667085]">Required</span>
            </div>
          </div>
        </div>

        {/* Top skill gaps */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[#101828]">Top Skill Gaps</h3>
            <span className="text-xs text-[#98A2B3]">Prioritized by impact</span>
          </div>
          <div className="space-y-4">
            {gaps.map((g) => (
              <div key={g.skill} className="p-3.5 rounded-xl border border-[#E4E7EC] card-hover">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <p className="font-semibold text-sm text-[#101828] font-display">{g.skill}</p>
                    <p className="text-xs text-[#98A2B3] mt-0.5">{g.effort} to close</p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${priorityColors[g.priority]}14`, color: priorityColors[g.priority] }}
                  >
                    {g.priority}
                  </span>
                </div>

                {/* Bars */}
                <div className="space-y-1.5 mb-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-[#98A2B3] mb-0.5">
                      <span>Current: {g.current}%</span>
                      <span>Required: {g.required}%</span>
                    </div>
                    <div className="h-1.5 bg-[#F1F5F9] rounded-full relative">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${g.current}%`,
                          background: `linear-gradient(90deg, ${priorityColors[g.priority]}, ${priorityColors[g.priority]}90)`,
                          transition: "width 0.8s ease 0.2s",
                        }}
                      />
                      <div
                        className="absolute top-0 h-1.5 w-0.5 bg-[#101828]/20 rounded"
                        style={{ left: `${g.required}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={11} className="text-[#98A2B3]" />
                    <span className="text-xs text-[#667085]">{g.resource}</span>
                  </div>
                  <button
                    onClick={() => navigate("/roadmap")}
                    className="text-xs font-semibold text-[#4F7CFF] flex items-center gap-0.5 hover:gap-1.5 transition-all"
                  >
                    Close Gap <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ARIA insight */}
      <div className="bg-gradient-to-r from-[#4F7CFF]/6 to-[#8B7CFF]/6 rounded-2xl border border-[#4F7CFF]/15 p-5 flex items-start gap-4 fade-up-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center shrink-0">
          <Sparkles size={15} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-[#4F7CFF] mb-1">ARIA Recommendation</p>
          <p className="text-sm text-[#475467] leading-relaxed">
            "Close MLOps first — it unlocks both cloud deployment and LLM fine-tuning pathways simultaneously. 6 weeks of focused learning will push your readiness from 78% to ~91% and make you eligible for 4 additional companies in your target list."
          </p>
        </div>
        <button
          onClick={() => navigate("/mentor")}
          className="btn-primary text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shrink-0"
        >
          Ask ARIA <ArrowRight size={12} />
        </button>
      </div>

      {/* CTA */}
      <div className="fade-up-4">
        <button
          onClick={handleBuildRoadmap}
          className="btn-primary text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center gap-2"
        >
          Build My Learning Roadmap <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
