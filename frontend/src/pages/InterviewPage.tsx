import { useState } from "react"
import {
  Mic2,
  Mic,
  Play,
  Clock,
  ChevronRight,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Volume2,
} from "lucide-react"

type Stage = "start" | "live" | "results"

function WaveBar({ delay }: { delay: number }) {
  return (
    <div
      className="w-1 rounded-full bg-[#4F7CFF]"
      style={{
        animation: `waveAnim 0.8s ${delay}s ease-in-out infinite alternate`,
        height: "4px",
      }}
    />
  )
}

const waveStyle = `@keyframes waveAnim { from { height: 4px; } to { height: 28px; } }`

export default function InterviewPage() {
  const [stage, setStage] = useState<Stage>("start")
  const [muted, setMuted] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // Start screen
  if (stage === "start") {
    return (
      <div className="p-6 max-w-[700px] mx-auto space-y-6">
        <div className="fade-up">
          <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">
            ECHO Interview
          </h1>
          <p className="text-[#667085] text-sm">
            AI-powered mock interviews with real-time feedback.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 fade-up-1 space-y-5">
          <h3 className="font-display font-semibold text-[#101828]">
            Configure Your Session
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-[#475467] mb-2 uppercase tracking-wide">
                Interview Type
              </p>
              <div className="space-y-2">
                {["Technical", "Behavioral", "System Design", "Mixed"].map(
                  (type, i) => (
                    <label
                      key={type}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E4E7EC] cursor-pointer hover:border-[#4F7CFF]/30 transition-colors"
                    >
                      <input
                        type="radio"
                        name="type"
                        defaultChecked={i === 0}
                        className="accent-[#4F7CFF]"
                      />
                      <span className="text-sm text-[#475467]">{type}</span>
                    </label>
                  ),
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#475467] mb-2 uppercase tracking-wide">
                  Target Role
                </p>
                <select className="w-full px-3 py-2.5 rounded-xl border border-[#D0D5DD] text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/30 focus:border-[#4F7CFF]">
                  <option>AI Engineer</option>
                  <option>ML Engineer</option>
                  <option>Data Scientist</option>
                </select>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#475467] mb-2 uppercase tracking-wide">
                  Difficulty
                </p>
                <div className="flex gap-2">
                  {["Easy", "Medium", "Hard"].map((d, i) => (
                    <button
                      key={d}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        i === 1
                          ? "border-[#4F7CFF] bg-[#4F7CFF]/8 text-[#4F7CFF]"
                          : "border-[#E4E7EC] text-[#667085] hover:border-[#4F7CFF]/30"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#475467] mb-2 uppercase tracking-wide">
                  Estimated Duration
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F7F9FC] border border-[#E4E7EC]">
                  <Clock size={13} className="text-[#667085]" />
                  <span className="text-sm text-[#475467]">
                    45 minutes · 8 questions
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStage("live")}
            className="w-full btn-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2.5"
          >
            <Play size={16} fill="white" />
            Start Interview
          </button>
        </div>

        {/* Last result preview */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 fade-up-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-sm text-[#101828]">
              Last Session
            </h3>
            <button
              onClick={() => setStage("results")}
              className="text-xs text-[#4F7CFF] font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View full results <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-[#4F7CFF]">
                76
              </p>
              <p className="text-[10px] text-[#98A2B3]">Overall</p>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2">
              {[
                { label: "Technical", score: 72 },
                { label: "Communication", score: 80 },
                { label: "Confidence", score: 74 },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center p-2 rounded-lg bg-[#F7F9FC]"
                >
                  <p className="font-semibold text-sm text-[#101828] font-display">
                    {s.score}%
                  </p>
                  <p className="text-[10px] text-[#98A2B3]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Live interview
  if (stage === "live") {
    return (
      <div className="p-6 max-w-[700px] mx-auto h-[calc(100vh-56px)] flex flex-col">
        <style>{waveStyle}</style>

        {/* Progress bar */}
        <div className="h-1 bg-[#F1F5F9] rounded-full mb-6 fade-up">
          <div className="h-1 w-[37%] rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#8B7CFF]" />
        </div>

        <div className="text-center mb-6 fade-up-1">
          <span className="text-xs text-[#98A2B3] font-medium">
            Question 3 of 8 · Technical
          </span>
        </div>

        {/* ECHO orb */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 fade-up-2">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] ai-glow" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] animate-ping opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Volume2 size={28} className="text-white" />
            </div>
          </div>

          <div className="max-w-[520px] text-center p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-sm">
            <p className="text-xs text-[#667085] mb-3">ECHO is asking:</p>
            <p className="font-display text-base font-semibold text-[#101828] leading-relaxed">
              Walk me through how you would design a real-time recommendation
              system at scale. Consider data ingestion, model serving, and
              latency requirements.
            </p>
          </div>

          {/* Voice waveform */}
          <div className="flex items-center justify-center gap-1 h-10">
            {muted ? (
              <p className="text-xs text-[#98A2B3]">Microphone muted</p>
            ) : (
              Array.from({ length: 20 }).map((_, i) => (
                <WaveBar key={i} delay={i * 0.05} />
              ))
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F9FC] rounded-lg border border-[#E4E7EC]">
              <Clock size={13} className="text-[#667085]" />
              <span className="text-sm font-medium text-[#475467]">03:24</span>
            </div>

            <button
              onClick={() => setMuted(!muted)}
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                muted
                  ? "border-[#E5484D] bg-[#E5484D]/10"
                  : "border-[#4F7CFF] bg-[#4F7CFF]/8"
              }`}
            >
              {muted ? (
                <Mic size={18} className="text-[#E5484D]" />
              ) : (
                <Mic size={18} className="text-[#4F7CFF]" />
              )}
            </button>

            <button
              onClick={() => setStage("results")}
              className="px-4 py-2 rounded-xl bg-[#F7F9FC] border border-[#E4E7EC] text-sm font-medium text-[#667085] hover:border-[#D0D5DD] transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Results
  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-5">
      <div className="fade-up text-center">
        <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">
          Interview Results
        </h1>
        <p className="text-[#667085] text-sm">
          AI Engineer · Technical · 45 min
        </p>
      </div>

      {/* Overall score */}
      <div className="bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] rounded-2xl p-6 text-center text-white fade-up-1">
        <p className="text-white/60 text-sm mb-2">Overall Score</p>
        <p className="font-display text-5xl font-bold mb-1">76</p>
        <p className="text-white/70 text-sm">
          Above average for AI Engineer candidates
        </p>
      </div>

      {/* Category scores */}
      <div className="grid sm:grid-cols-3 gap-4 fade-up-2">
        {[
          { label: "Technical", score: 72, icon: Sparkles },
          { label: "Communication", score: 80, icon: MessageCircle },
          { label: "Confidence", score: 74, icon: TrendingUp },
        ].map((cat) => (
          <div
            key={cat.label}
            className="bg-white rounded-2xl border border-[#E4E7EC] p-4 text-center card-hover"
          >
            <cat.icon size={18} className="text-[#4F7CFF] mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-[#101828]">
              {cat.score}%
            </p>
            <p className="text-xs text-[#667085] mt-0.5">{cat.label}</p>
          </div>
        ))}
      </div>

      {/* Highlights */}
      <div className="grid sm:grid-cols-2 gap-4 fade-up-3">
        <div className="bg-[#22A06B]/6 rounded-2xl border border-[#22A06B]/20 p-5">
          <p className="text-xs font-semibold text-[#22A06B] mb-2">
            Strongest Area
          </p>
          <p className="font-display font-semibold text-[#101828]">
            Communication Clarity
          </p>
          <p className="text-xs text-[#667085] mt-1 leading-relaxed">
            You explained the recommendation system architecture clearly with
            appropriate use of terminology. Interviewer satisfaction signals
            were strong.
          </p>
        </div>
        <div className="bg-[#F59E0B]/6 rounded-2xl border border-[#F59E0B]/20 p-5">
          <p className="text-xs font-semibold text-[#F59E0B] mb-2">
            Improvement Area
          </p>
          <p className="font-display font-semibold text-[#101828]">
            System Design Depth
          </p>
          <p className="text-xs text-[#667085] mt-1 leading-relaxed">
            Your answers lacked specific numbers — latency targets, throughput
            estimates, SLA constraints. Practice estimating scale before your
            next session.
          </p>
        </div>
      </div>

      {/* Next action */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 flex items-center justify-between fade-up-4">
        <div>
          <p className="font-display font-semibold text-[#101828] mb-1">
            Recommended Next Action
          </p>
          <p className="text-sm text-[#667085]">
            Complete the System Design module, then retake this interview.
          </p>
        </div>
        <button
          onClick={() => setStage("start")}
          className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 shrink-0"
        >
          Retake <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
