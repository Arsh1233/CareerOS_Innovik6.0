import { GraduationCap, Building2, Users, Sparkles } from "lucide-react";

const flowAnim = `
@keyframes flowLine {
  from { stroke-dashoffset: 20; }
  to   { stroke-dashoffset: 0; }
}
@keyframes nodePulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.85; transform: scale(1.04); }
}
@keyframes orbitDot {
  from { transform: rotate(0deg)   translateX(52px) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(52px) rotate(-360deg); }
}
`;

const roles = [
  { icon: GraduationCap, label: "Students", desc: "Learn · Build · Practice", color: "#4F7CFF", bg: "from-[#4F7CFF] to-[#5B8CFF]", glow: "rgba(79,124,255,0.25)" },
  { icon: Building2,     label: "Colleges",  desc: "Monitor · Intervene · Improve", color: "#6E72E8", bg: "from-[#6E72E8] to-[#8B7CFF]", glow: "rgba(110,114,232,0.25)" },
  { icon: Users,         label: "Recruiters", desc: "Discover · Evaluate · Hire", color: "#8B7CFF", bg: "from-[#8B7CFF] to-[#55C7F3]", glow: "rgba(139,124,255,0.25)" },
];

// SVG coordinate space: 360 × 280
const CENTER = { x: 180, y: 148 };
// Node center points matched to the HTML absolute positions below
const NODE_CENTERS = [
  { x: 56, y: 54 },   // Student  (top-left div centered)
  { x: 304, y: 54 },  // College  (top-right div centered)
  { x: 180, y: 240 }, // Recruiter (bottom-center div centered)
];

export default function EcosystemVisual() {
  return (
    <div className="w-full max-w-[380px] mx-auto select-none">
      <style>{flowAnim}</style>
      <div className="relative" style={{ height: 300 }}>
        {/* SVG connection layer */}
        <svg
          viewBox="0 0 360 280"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: "visible" }}
        >
          <defs>
            {NODE_CENTERS.map((nc, i) => (
              <linearGradient key={i} id={`lg${i}`}
                gradientUnits="userSpaceOnUse"
                x1={`${CENTER.x}`} y1={`${CENTER.y}`} x2={`${nc.x}`} y2={`${nc.y}`}
              >
                <stop offset="0%" stopColor={roles[i].color} stopOpacity="0.6" />
                <stop offset="100%" stopColor={roles[i].color} stopOpacity="0.15" />
              </linearGradient>
            ))}
          </defs>

          {NODE_CENTERS.map((nc, i) => (
            <line
              key={i}
              x1={CENTER.x} y1={CENTER.y}
              x2={nc.x} y2={nc.y}
              stroke={`url(#lg${i})`}
              strokeWidth="1.5"
              strokeDasharray="5 4"
              style={{ animation: `flowLine ${1.4 + i * 0.3}s linear infinite` }}
            />
          ))}

          {/* Animated travelling dots */}
          {NODE_CENTERS.map((nc, i) => (
            <circle key={`dot-${i}`} r="3" fill={roles[i].color}>
              <animateMotion
                dur={`${2.2 + i * 0.4}s`}
                repeatCount="indefinite"
                path={`M${nc.x},${nc.y} L${CENTER.x},${CENTER.y}`}
              />
            </circle>
          ))}
        </svg>

        {/* Node cards */}
        {/* Student – top-left */}
        <div
          className="absolute top-[4px] left-[8px] flex flex-col items-center gap-1.5"
          style={{ animation: "nodePulse 3.5s ease-in-out infinite" }}
        >
          <div className={`w-[52px] h-[52px] rounded-2xl bg-gradient-to-br ${roles[0].bg} flex items-center justify-center`}
            style={{ boxShadow: `0 4px 16px ${roles[0].glow}` }}>
            <GraduationCap size={22} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-white/90">{roles[0].label}</span>
          <span className="text-[9px] text-white/45 text-center">{roles[0].desc}</span>
        </div>

        {/* College – top-right */}
        <div
          className="absolute top-[4px] right-[8px] flex flex-col items-center gap-1.5"
          style={{ animation: "nodePulse 3.5s 0.6s ease-in-out infinite" }}
        >
          <div className={`w-[52px] h-[52px] rounded-2xl bg-gradient-to-br ${roles[1].bg} flex items-center justify-center`}
            style={{ boxShadow: `0 4px 16px ${roles[1].glow}` }}>
            <Building2 size={22} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-white/90">{roles[1].label}</span>
          <span className="text-[9px] text-white/45 text-center">{roles[1].desc}</span>
        </div>

        {/* Recruiter – bottom-center */}
        <div
          className="absolute bottom-[4px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          style={{ animation: "nodePulse 3.5s 1.2s ease-in-out infinite" }}
        >
          <div className={`w-[52px] h-[52px] rounded-2xl bg-gradient-to-br ${roles[2].bg} flex items-center justify-center`}
            style={{ boxShadow: `0 4px 16px ${roles[2].glow}` }}>
            <Users size={22} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-white/90">{roles[2].label}</span>
          <span className="text-[9px] text-white/45 text-center">{roles[2].desc}</span>
        </div>

        {/* CareerOS AI Core – center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10">
          <div className="relative">
            {/* Outer pulse ring */}
            <div className="absolute inset-[-10px] rounded-full border-2 border-dashed border-white/10 animate-spin" style={{ animationDuration: "18s" }} />
            <div className="absolute inset-[-20px] rounded-full border border-white/5 animate-spin" style={{ animationDuration: "26s", animationDirection: "reverse" }} />
            {/* Orbiting dot */}
            <div
              className="absolute w-2 h-2 rounded-full bg-[#55C7F3] top-1/2 left-1/2 -mt-1 -ml-1"
              style={{ animation: "orbitDot 4s linear infinite" }}
            />
            <div className="w-[64px] h-[64px] rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex flex-col items-center justify-center"
              style={{ boxShadow: "0 0 0 6px rgba(79,124,255,0.12), 0 0 32px rgba(79,124,255,0.3)" }}>
              <Sparkles size={20} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white text-[11px] font-bold tracking-wide">CareerOS AI</p>
            <p className="text-white/40 text-[9px]">Intelligence Core</p>
          </div>
        </div>
      </div>
    </div>
  );
}
