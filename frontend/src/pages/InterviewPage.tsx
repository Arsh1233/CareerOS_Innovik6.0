import { useState, useRef, useEffect } from "react";
import { Mic2, Mic, Play, Clock, ChevronRight, Sparkles, TrendingUp, MessageCircle, Volume2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { startInterviewSession, endInterviewSession, listInterviewSessions } from "../lib/api/interview";
import { Conversation } from "@elevenlabs/client";
import type { InterviewResult, InterviewSessionSummary } from "../lib/api/types";

type Stage = "start" | "live" | "results" | "loading";

function WaveBar({ delay }: { delay: number }) {
  return (
    <div
      className="w-1 rounded-full bg-[#4F7CFF]"
      style={{
        animation: `waveAnim 0.8s ${delay}s ease-in-out infinite alternate`,
        height: "4px",
      }}
    />
  );
}

const waveStyle = `@keyframes waveAnim { from { height: 4px; } to { height: 28px; } }`;

export default function InterviewPage() {
  const { accessToken, profile } = useAuth();
  const [stage, setStage] = useState<Stage>("start");
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Configuration
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");

  // History & Results
  const [lastResult, setLastResult] = useState<InterviewSessionSummary | null>(null);
  const [currentResult, setCurrentResult] = useState<InterviewResult | null>(null);

  // Active Session State
  const conversationRef = useRef<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);

  useEffect(() => {
    // Load last session on mount
    async function loadHistory() {
      if (!accessToken) return;
      try {
        const history = await listInterviewSessions(accessToken, 1);
        if (history.length > 0) {
          setLastResult(history[0]);
        }
      } catch (e) {
        console.error("Failed to load interview history", e);
      }
    }
    loadHistory();
  }, [accessToken]);

  useEffect(() => {
    if (stage === "live") {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startInterview = async () => {
    if (!accessToken) return;
    setStage("loading");
    setLiveTranscript("Connecting to ECHO...");
    setElapsed(0);
    setMuted(false);

    try {
      // 1. Get signed URL and Session ID from backend
      const res = await startInterviewSession(accessToken, {
        interview_type: interviewType,
        difficulty,
      });
      setSessionId(res.session_id);

      // 2. Start ElevenLabs WebRTC/WebSocket session
      const conversation = await Conversation.startSession({
        signedUrl: res.signed_url,
        onConnect: () => {
          setStage("live");
          setLiveTranscript("ECHO is listening...");
        },
        onDisconnect: () => {
          // Typically handled manually via "End Session" button
        },
        onMessage: (message: any) => {
          // Listen for transcript updates
          if (message.source === "ai" && message.message) {
            setLiveTranscript(message.message);
          } else if (message.source === "user" && message.message) {
            setLiveTranscript(message.message);
          }
        },
        onError: (message: string) => {
          console.error("ElevenLabs error:", message);
          alert("Connection lost. Please try again.");
          setStage("start");
        },
        onModeChange: (mode: any) => {
          if (mode.mode === "speaking") {
            setIsAgentSpeaking(true);
          } else {
            setIsAgentSpeaking(false);
          }
        },
      });

      // Capture conversation ID (available once connected)
      // The ElevenLabs SDK might provide getConversationId()
      try {
        const cid = await conversation.getId();
        setConversationId(cid);
      } catch (e) {
        console.warn("Could not retrieve ElevenLabs conversation ID immediately", e);
      }

      conversationRef.current = conversation;

    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to start interview.");
      setStage("start");
    }
  };

  const endInterview = async () => {
    if (!accessToken || !sessionId || !conversationRef.current) return;
    setStage("loading");

    try {
      let cid = conversationId;
      if (!cid) {
        cid = await conversationRef.current.getId();
      }
      
      // Stop the frontend stream
      await conversationRef.current.endSession();

      if (!cid) {
        throw new Error("Missing conversation ID from ElevenLabs.");
      }

      // 3. Inform backend to score the interview
      const result = await endInterviewSession(accessToken, {
        session_id: sessionId,
        elevenlabs_conversation_id: cid,
        duration_seconds: elapsed,
      });

      setCurrentResult(result);
      setStage("results");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to finalize interview.");
      setStage("start");
    }
  };

  const toggleMute = async () => {
    if (!conversationRef.current) return;
    if (muted) {
      // Logic to unmute might depend on specific SDK methods if available,
      // but usually the SDK manages the mic. For now we just visually mute.
      // E.g. conversationRef.current.setVolume(...)
      setMuted(false);
    } else {
      setMuted(true);
    }
  };

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
                  (type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E4E7EC] cursor-pointer hover:border-[#4F7CFF]/30 transition-colors"
                    >
                      <input
                        type="radio"
                        name="type"
                        checked={interviewType === type}
                        onChange={() => setInterviewType(type)}
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
                <div className="px-3 py-2.5 rounded-xl border border-[#D0D5DD] bg-gray-50 text-sm text-[#101828]">
                  {profile?.target_role_name || "General Candidate"}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#475467] mb-2 uppercase tracking-wide">
                  Difficulty
                </p>
                <div className="flex gap-2">
                  {["Easy", "Medium", "Hard"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        difficulty === d
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
                    Open ended · Control your pace
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={startInterview}
            className="w-full btn-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2.5"
          >
            <Play size={16} fill="white" />
            Start Interview
          </button>
        </div>

        {/* Last result preview */}
        {lastResult && (
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 fade-up-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-sm text-[#101828]">
                Last Session
              </h3>
              <span className="text-xs text-[#98A2B3]">{new Date(lastResult.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-[#4F7CFF]">
                  {lastResult.overall_score ?? "--"}
                </p>
                <p className="text-[10px] text-[#98A2B3]">Overall</p>
              </div>
              <div className="flex-1 flex items-center justify-end">
                  <span className="text-sm text-[#667085]">
                    {lastResult.interview_type} • {lastResult.difficulty}
                  </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (stage === "loading") {
    return (
      <div className="p-6 max-w-[700px] mx-auto h-[calc(100vh-56px)] flex flex-col items-center justify-center">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] ai-glow animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={28} className="text-white" />
          </div>
        </div>
        <p className="text-lg font-semibold text-[#101828]">Connecting to ECHO...</p>
        <p className="text-sm text-[#667085] mt-2">This may take a few seconds.</p>
      </div>
    );
  }

  // Live interview
  if (stage === "live") {
    return (
      <div className="p-6 max-w-[700px] mx-auto h-[calc(100vh-56px)] flex flex-col">
        <style>{waveStyle}</style>

        {/* Progress bar (visual only since open ended) */}
        <div className="h-1 bg-[#F1F5F9] rounded-full mb-6 fade-up">
          <div className="h-1 w-[100%] rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#8B7CFF] animate-pulse" />
        </div>

        <div className="text-center mb-6 fade-up-1">
          <span className="text-xs text-[#98A2B3] font-medium uppercase tracking-wide">
            Live {interviewType} Interview
          </span>
        </div>

        {/* ECHO orb */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 fade-up-2">
          <div className="relative w-24 h-24">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] ai-glow ${isAgentSpeaking ? 'animate-pulse' : ''}`} />
            {isAgentSpeaking && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] animate-ping opacity-20" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <Volume2 size={28} className="text-white" />
            </div>
          </div>

          <div className="max-w-[520px] text-center p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-sm min-h-[120px] flex flex-col justify-center">
            <p className="font-display text-base font-medium text-[#101828] leading-relaxed italic">
              "{liveTranscript}"
            </p>
          </div>

          {/* Voice waveform */}
          <div className="flex items-center justify-center gap-1 h-10">
            {muted ? (
              <p className="text-xs text-[#98A2B3]">Microphone visually muted</p>
            ) : (
              Array.from({ length: 20 }).map((_, i) => (
                <WaveBar key={i} delay={i * 0.05} />
              ))
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F9FC] rounded-lg border border-[#E4E7EC]">
              <Clock size={13} className="text-[#667085]" />
              <span className="text-sm font-medium text-[#475467]">{formatTime(elapsed)}</span>
            </div>

            <button
              onClick={toggleMute}
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
              onClick={endInterview}
              className="px-4 py-2 rounded-xl bg-[#F7F9FC] border border-[#E4E7EC] text-sm font-medium text-[#667085] hover:border-[#D0D5DD] transition-colors hover:text-[#E5484D]"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results
  if (stage === "results" && currentResult) {
    const s = currentResult.scores;
    const fb = currentResult.feedback;

    return (
      <div className="p-6 max-w-[800px] mx-auto space-y-5">
        <div className="fade-up text-center">
          <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">
            Interview Results
          </h1>
          <p className="text-[#667085] text-sm">
            {currentResult.target_role} · {currentResult.interview_type} · {currentResult.duration_seconds ? formatTime(currentResult.duration_seconds) : "--"}
          </p>
        </div>

        {/* Overall score */}
        <div className="bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] rounded-2xl p-6 text-center text-white fade-up-1">
          <p className="text-white/60 text-sm mb-2">Overall Score</p>
          <p className="font-display text-5xl font-bold mb-1">{s?.overall ?? "--"}</p>
          <p className="text-white/70 text-sm max-w-lg mx-auto">
            {fb?.summary || "Score calculated based on transcript analysis."}
          </p>
        </div>

        {/* Category scores */}
        <div className="grid sm:grid-cols-3 gap-4 fade-up-2">
          {[
            { label: "Technical", score: s?.technical ?? "--", icon: Sparkles },
            { label: "Communication", score: s?.communication ?? "--", icon: MessageCircle },
            { label: "Confidence", score: s?.confidence ?? "--", icon: TrendingUp },
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
        {fb && (
          <div className="grid sm:grid-cols-2 gap-4 fade-up-3">
            <div className="bg-[#22A06B]/6 rounded-2xl border border-[#22A06B]/20 p-5">
              <p className="text-xs font-semibold text-[#22A06B] mb-2 uppercase">
                Strongest Area: {fb.strongest_area}
              </p>
              <p className="text-sm text-[#101828] leading-relaxed">
                {fb.strongest_explanation}
              </p>
            </div>
            <div className="bg-[#F59E0B]/6 rounded-2xl border border-[#F59E0B]/20 p-5">
              <p className="text-xs font-semibold text-[#F59E0B] mb-2 uppercase">
                Improvement Area: {fb.improvement_area}
              </p>
              <p className="text-sm text-[#101828] leading-relaxed">
                {fb.improvement_explanation}
              </p>
            </div>
          </div>
        )}

        {/* Next action */}
        {fb?.recommended_action && (
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 flex items-center justify-between fade-up-4">
            <div>
              <p className="font-display font-semibold text-[#101828] mb-1">
                Recommended Next Action
              </p>
              <p className="text-sm text-[#667085]">
                {fb.recommended_action}
              </p>
            </div>
            <button
              onClick={() => {
                setStage("start");
                setCurrentResult(null);
              }}
              className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 shrink-0"
            >
              Retake <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
