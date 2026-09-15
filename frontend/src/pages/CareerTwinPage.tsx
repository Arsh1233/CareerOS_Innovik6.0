import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Sparkles, TrendingUp, ArrowRight, Target, DollarSign, AlertCircle } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
} from "recharts";

const radarData = [
  { skill: "ML/AI", current: 72, target: 90 },
  { skill: "Python", current: 85, target: 90 },
  { skill: "System Design", current: 55, target: 85 },
  { skill: "MLOps", current: 40, target: 80 },
  { skill: "Data Eng", current: 65, target: 75 },
  { skill: "LLM Fine-tuning", current: 35, target: 75 },
];

function TwinOrb() {
  return (
    <div className="relative flex items-center justify-center w-[200px] h-[200px] mx-auto">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#4F7CFF]/20 animate-spin" style={{ animationDuration: "20s" }} />
      {/* Middle ring */}
      <div className="absolute inset-4 rounded-full border border-[#8B7CFF]/25 animate-spin" style={{ animationDuration: "14s", animationDirection: "reverse" }} />
      {/* Inner glow */}
      <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#4F7CFF]/15 to-[#8B7CFF]/15 backdrop-blur-sm" />
      {/* Core */}
      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex flex-col items-center justify-center ai-glow">
        <Sparkles size={20} className="text-white mb-0.5" />
        <span className="text-white text-[10px] font-semibold">AI Engineer</span>
      </div>
      {/* Orbiting dots */}
      <div className="absolute inset-0">
        {[0, 120, 240].map((deg, i) => (
          <div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              background: ["#4F7CFF", "#8B7CFF", "#55C7F3"][i],
              transform: `rotate(${deg}deg) translateX(86px)`,
              animation: `orbit ${8 + i * 2}s linear infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CareerTwinPage() {
  const navigate = useNavigate();
  const [probAnim, setProbAnim] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setProbAnim(73), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="fade-up">
        <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">Career Twin</h1>
        <p className="text-[#667085] text-sm">Your AI-projected career identity. Where are you heading?</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 fade-up-1">
        {/* Twin Visualization */}
        <div className="bg-gradient-to-br from-[#EEF2FF] via-[#F0F4FF] to-[#EEF2FF] dark:from-[#1a1f3e] dark:via-[#1e2455] dark:to-[#1a1f3e] rounded-2xl p-6 flex flex-col items-center ai-glow">
          <p className="text-[#4F7CFF] dark:text-[#55C7F3] text-xs font-semibold mb-5 uppercase tracking-widest">Your Career Twin</p>
          <TwinOrb />

          <div className="mt-6 w-full grid grid-cols-2 gap-3">
            <div className="bg-[#4F7CFF]/8 dark:bg-white/5 rounded-xl p-3 text-center border border-[#C7D7FF] dark:border-white/8">
              <p className="text-2xl font-bold font-display text-[#101828] dark:text-white">78%</p>
              <p className="text-[#667085] dark:text-white/40 text-xs mt-0.5">Readiness</p>
            </div>
            <div className="bg-[#4F7CFF]/8 dark:bg-white/5 rounded-xl p-3 text-center border border-[#C7D7FF] dark:border-white/8">
              <p
                className="text-2xl font-bold font-display text-[#101828] dark:text-white transition-all duration-1000"
              >
                {probAnim}%
              </p>
              <p className="text-[#667085] dark:text-white/40 text-xs mt-0.5">Placement Prob.</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/skills")}
            className="mt-4 w-full btn-primary text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2"
          >
            Improve My Twin <ArrowRight size={14} />
          </button>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
          <h3 className="font-display font-semibold text-[#101828] mb-1">Skill Alignment</h3>
          <p className="text-xs text-[#667085] mb-4">Current vs. AI Engineer requirements</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E4E7EC" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#667085" }} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, fontSize: 12 }}
              />
              <Radar name="Required" dataKey="target" stroke="#E4E7EC" fill="#F1F5F9" fillOpacity={0.6} />
              <Radar name="Current" dataKey="current" stroke="#4F7CFF" fill="#4F7CFF" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
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

        {/* Trajectory + Salary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-[#22A06B]" />
              <span className="font-semibold text-sm text-[#101828] font-display">Career Trajectory</span>
            </div>
            <div className="space-y-2">
              {[
                { role: "ML Engineer", timeline: "Now — 1 yr", active: true },
                { role: "Senior AI Engineer", timeline: "1 — 3 yrs", active: false },
                { role: "Principal AI Engineer", timeline: "3 — 6 yrs", active: false },
                { role: "Head of AI", timeline: "6+ yrs", active: false },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2.5 rounded-lg ${item.active ? "bg-[#4F7CFF]/6 border border-[#4F7CFF]/20" : "bg-[#F9FAFB]"}`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${item.active ? "bg-[#4F7CFF]" : "bg-[#D0D5DD]"}`} />
                  <span className={`text-xs font-medium ${item.active ? "text-[#4F7CFF]" : "text-[#667085]"}`}>{item.role}</span>
                  <span className="text-[10px] text-[#98A2B3] ml-auto">{item.timeline}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 card-hover">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={15} className="text-[#8B7CFF]" />
              <span className="font-semibold text-sm text-[#101828] font-display">Salary Projection</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Current", value: "₹12L" },
                { label: "1 Year", value: "₹18L" },
                { label: "3 Years", value: "₹28L" },
              ].map((s) => (
                <div key={s.label} className="p-2 rounded-lg bg-[#F7F9FC]">
                  <p className="font-bold font-display text-[#101828] text-sm">{s.value}</p>
                  <p className="text-[10px] text-[#98A2B3]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Missing capabilities */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 fade-up-2">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={15} className="text-[#F59E0B]" />
          <h3 className="font-display font-semibold text-[#101828]">Missing Capabilities</h3>
          <span className="ml-auto text-xs text-[#98A2B3]">To reach AI Engineer — 3 critical gaps</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { cap: "MLOps & Kubernetes", priority: "Critical", effort: "6–8 weeks", color: "#E5484D" },
            { cap: "LLM Fine-tuning & RLHF", priority: "Critical", effort: "4–6 weeks", color: "#E5484D" },
            { cap: "System Design for ML", priority: "Recommended", effort: "3–4 weeks", color: "#F59E0B" },
          ].map((item) => (
            <div key={item.cap} className="p-3.5 rounded-xl border border-[#E4E7EC] card-hover">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${item.color}14`, color: item.color }}
                >
                  {item.priority}
                </span>
                <span className="text-[10px] text-[#98A2B3]">{item.effort}</span>
              </div>
              <p className="font-semibold text-sm text-[#101828] font-display">{item.cap}</p>
              <button
                onClick={() => navigate("/skills")}
                className="mt-2 text-xs font-semibold text-[#4F7CFF] flex items-center gap-1 hover:gap-2 transition-all"
              >
                Close Gap <ArrowRight size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
