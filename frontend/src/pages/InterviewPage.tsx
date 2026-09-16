import { useState, useRef, useEffect } from "react";
import {
  Mic, Play, Clock, ChevronRight, Sparkles, TrendingUp,
  MessageCircle, Volume2, AlertTriangle, ExternalLink, RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  startInterviewSession,
  endInterviewSession,
  listInterviewSessions,
} from "../lib/api/interview";
import { Conversation } from "@elevenlabs/client";
import type { InterviewResult, InterviewSessionSummary } from "../lib/api/types";

type Stage = "start" | "live" | "results" | "loading" | "not_configured" | "error";

function WaveBar({ delay }: { delay: number }) {
  return (
    <div
      className="w-1 rounded-full bg-brand"
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
  const [errorMessage, setErrorMessage] = useState<string>("");

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
    async function loadHistory() {
      if (!accessToken) return;
      try {
        const history = await listInterviewSessions(accessToken, 1);
        if (history.length > 0) setLastResult(history[0]);
      } catch {
        // History load failure is non-critical
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
    setLiveTranscript("Connecting to ECHO…");
    setElapsed(0);
    setMuted(false);

    try {
      const res = await startInterviewSession(accessToken, {
        interview_type: interviewType,
        difficulty,
      });
      setSessionId(res.session_id);

      const conversation = await Conversation.startSession({
        signedUrl: res.signed_url,
        onConnect: () => {
          setStage("live");
          setLiveTranscript("ECHO is listening…");
        },
        onDisconnect: () => {},
        onMessage: (message: any) => {
          if (message.message) setLiveTranscript(message.message);
        },
        onError: (message: string) => {
          console.error("ElevenLabs error:", message);
          setErrorMessage("The voice connection was interrupted. Please try again.");
          setStage("error");
        },
        onModeChange: (mode: any) => {
          setIsAgentSpeaking(mode.mode === "speaking");
        },
      });

      try {
        const cid = await conversation.getId();
        setConversationId(cid);
      } catch {
        // ID may not be available immediately — captured on end
      }

      conversationRef.current = conversation;
    } catch (e: any) {
      console.error(e);
      // Only show the setup page when the backend explicitly says the agent is not configured.
      // Use the typed error code so auth/DB failures don't get misclassified.
      if (e?.code === "ai_not_configured") {
        setStage("not_configured");
      } else {
        setErrorMessage(e?.message || "Failed to start interview. Please try again.");
        setStage("error");
      }
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

      // End the ElevenLabs session first
      await conversationRef.current.endSession();

      if (!cid) {
        throw new Error("Missing conversation ID from ElevenLabs.");
      }

      // Give ElevenLabs ~2s to finalize & write the transcript server-side
      // before we ask our backend to fetch it.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await endInterviewSession(accessToken, {
        session_id: sessionId,
        elevenlabs_conversation_id: cid,
        duration_seconds: elapsed,
      });

      setCurrentResult(result);
      setStage("results");

      // Refresh the history card so the start screen shows updated stats
      try {
        const history = await listInterviewSessions(accessToken, 1);
        if (history.length > 0) setLastResult(history[0]);
      } catch {
        // non-critical
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Failed to finalise interview.");
      setStage("error");
    }
  };

  const toggleMute = async () => {
    if (!conversationRef.current) return;
    setMuted((prev) => !prev);
  };

  // ── Not configured ────────────────────────────────────────────────────────
  if (stage === "not_configured") {
    return (
      <div className="p-6 max-w-175 mx-auto space-y-6">
        <div className="fade-up">
          <h1 className="font-display text-2xl font-bold text-text-1 mb-1">ECHO Interview</h1>
          <p className="text-text-3 text-sm">AI-powered mock interviews with real-time voice feedback.</p>
        </div>

        <div className="bg-[#FEF3C7] border border-warning/30 rounded-2xl p-6 fade-up-1 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-semibold text-[#92400E]">ElevenLabs Agent Not Configured</p>
              <p className="text-sm text-[#92400E]/80 mt-1">
                ECHO requires an ElevenLabs Conversational AI Agent ID to run voice interviews.
                Your API key is present — you just need to create an agent and paste its ID.
              </p>
            </div>
          </div>

          <div className="bg-white/60 rounded-xl p-4 space-y-3 text-sm">
            <p className="font-semibold text-text-1">Setup (2 minutes):</p>
            <ol className="space-y-2 text-text-2 list-decimal list-inside">
              <li>
                Go to{" "}
                <a
                  href="https://elevenlabs.io/app/conversational-ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand underline font-medium"
                >
                  elevenlabs.io → Conversational AI
                </a>{" "}
                and create a new Agent.
              </li>
              <li>Name it <strong>ECHO</strong> and set its first message to something like: <em>"Hi! I'm ECHO, your AI interviewer. Let's begin."</em></li>
              <li>Copy the <strong>Agent ID</strong> from the agent's settings page.</li>
              <li>
                Open{" "}
                <code className="bg-surface-2 px-1.5 py-0.5 rounded text-xs">backend/.env</code>{" "}
                and set <code className="bg-surface-2 px-1.5 py-0.5 rounded text-xs">ELEVENLABS_AGENT_ID=&lt;your-id&gt;</code>
              </li>
              <li>Restart the backend server.</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <a
              href="https://elevenlabs.io/app/conversational-ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning text-white text-sm font-semibold hover:bg-[#D97706] transition-colors"
            >
              Open ElevenLabs <ExternalLink size={13} />
            </a>
            <button
              onClick={() => setStage("start")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E4E7EC] text-sm font-medium text-text-3 hover:bg-[#F9FAFB] transition-colors"
            >
              <RefreshCw size={13} /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Generic error ──────────────────────────────────────────────────────────
  if (stage === "error") {
    return (
      <div className="p-6 max-w-175 mx-auto space-y-6">
        <div className="fade-up">
          <h1 className="font-display text-2xl font-bold text-text-1 mb-1">ECHO Interview</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3 fade-up-1">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-700">Session Failed</p>
            <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
          </div>
          <button
            onClick={() => setStage("start")}
            className="btn-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Start screen ───────────────────────────────────────────────────────────
  if (stage === "start") {
    return (
      <div className="p-6 max-w-175 mx-auto space-y-6">
        <div className="fade-up">
          <h1 className="font-display text-2xl font-bold text-text-1 mb-1">ECHO Interview</h1>
          <p className="text-text-3 text-sm">AI-powered mock interviews with real-time voice feedback.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 fade-up-1 space-y-5">
          <h3 className="font-display font-semibold text-text-1">Configure Your Session</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-text-2 mb-2 uppercase tracking-wide">Interview Type</p>
              <div className="space-y-2">
                {["Technical", "Behavioral", "System Design", "Mixed"].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E4E7EC] cursor-pointer hover:border-brand/30 transition-colors"
                  >
                    <input
                      type="radio"
                      name="type"
                      checked={interviewType === type}
                      onChange={() => setInterviewType(type)}
                      className="accent-brand"
                    />
                    <span className="text-sm text-text-2">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-text-2 mb-2 uppercase tracking-wide">Target Role</p>
                <div className="px-3 py-2.5 rounded-xl border border-[#D0D5DD] bg-gray-50 text-sm text-text-1">
                  {profile?.target_role_name || "General Candidate"}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-2 mb-2 uppercase tracking-wide">Difficulty</p>
                <div className="flex gap-2">
                  {["Easy", "Medium", "Hard"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        difficulty === d
                          ? "border-brand bg-brand/8 text-brand"
                          : "border-[#E4E7EC] text-text-3 hover:border-brand/30"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-2 mb-2 uppercase tracking-wide">Duration</p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface border border-[#E4E7EC]">
                  <Clock size={13} className="text-text-3" />
                  <span className="text-sm text-text-2">Open ended · Control your pace</span>
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

        {lastResult && (
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 fade-up-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-sm text-text-1">Last Session</h3>
              <span className="text-xs text-text-4">{new Date(lastResult.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-brand">{lastResult.overall_score ?? "--"}</p>
                <p className="text-[10px] text-text-4">Overall</p>
              </div>
              <div className="flex-1 flex items-center justify-end">
                <span className="text-sm text-text-3">
                  {lastResult.interview_type} • {lastResult.difficulty}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <div className="p-6 max-w-175 mx-auto h-[calc(100vh-56px)] flex flex-col items-center justify-center">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-linear-to-br from-brand to-violet ai-glow animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={28} className="text-white" />
          </div>
        </div>
        <p className="text-lg font-semibold text-text-1">Connecting to ECHO…</p>
        <p className="text-sm text-text-3 mt-2">This may take a few seconds.</p>
      </div>
    );
  }

  // ── Live interview ─────────────────────────────────────────────────────────
  if (stage === "live") {
    return (
      <div className="p-6 max-w-175 mx-auto h-[calc(100vh-56px)] flex flex-col">
        <style>{waveStyle}</style>

        <div className="h-1 bg-surface-2 rounded-full mb-6 fade-up">
          <div className="h-1 w-full rounded-full bg-linear-to-r from-brand to-violet animate-pulse" />
        </div>

        <div className="text-center mb-6 fade-up-1">
          <span className="text-xs text-text-4 font-medium uppercase tracking-wide">
            Live {interviewType} Interview
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 fade-up-2">
          <div className="relative w-24 h-24">
            <div
              className={`absolute inset-0 rounded-full bg-linear-to-br from-brand to-violet ai-glow ${
                isAgentSpeaking ? "animate-pulse" : ""
              }`}
            />
            {isAgentSpeaking && (
              <div className="absolute inset-0 rounded-full bg-linear-to-br from-brand to-violet animate-ping opacity-20" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <Volume2 size={28} className="text-white" />
            </div>
          </div>

          <div className="max-w-130 text-center p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-sm min-h-30 flex flex-col justify-center">
            <p className="font-display text-base font-medium text-text-1 leading-relaxed italic">
              "{liveTranscript}"
            </p>
          </div>

          <div className="flex items-center justify-center gap-1 h-10">
            {muted ? (
              <p className="text-xs text-text-4">Microphone muted</p>
            ) : (
              Array.from({ length: 20 }).map((_, i) => <WaveBar key={i} delay={i * 0.05} />)
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-[#E4E7EC]">
              <Clock size={13} className="text-text-3" />
              <span className="text-sm font-medium text-text-2">{formatTime(elapsed)}</span>
            </div>

            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                muted ? "border-error bg-error/10" : "border-brand bg-brand/8"
              }`}
            >
              <Mic size={18} className={muted ? "text-error" : "text-brand"} />
            </button>

            <button
              onClick={endInterview}
              className="px-4 py-2 rounded-xl bg-surface border border-[#E4E7EC] text-sm font-medium text-text-3 hover:border-[#D0D5DD] transition-colors hover:text-error"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (stage === "results" && currentResult) {
    const s = currentResult.scores;
    const fb = currentResult.feedback;

    return (
      <div className="p-6 max-w-200 mx-auto space-y-5">
        <div className="fade-up text-center">
          <h1 className="font-display text-2xl font-bold text-text-1 mb-1">Interview Results</h1>
          <p className="text-text-3 text-sm">
            {currentResult.target_role} · {currentResult.interview_type} ·{" "}
            {currentResult.duration_seconds ? formatTime(currentResult.duration_seconds) : "--"}
          </p>
        </div>

        <div className="bg-linear-to-br from-brand to-violet rounded-2xl p-6 text-center text-white fade-up-1">
          <p className="text-white/60 text-sm mb-2">Overall Score</p>
          <p className="font-display text-5xl font-bold mb-1">{s?.overall ?? "--"}</p>
          <p className="text-white/70 text-sm max-w-lg mx-auto">
            {fb?.summary || "Score calculated based on transcript analysis."}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 fade-up-2">
          {[
            { label: "Technical", score: s?.technical ?? "--", icon: Sparkles },
            { label: "Communication", score: s?.communication ?? "--", icon: MessageCircle },
            { label: "Confidence", score: s?.confidence ?? "--", icon: TrendingUp },
          ].map((cat) => (
            <div key={cat.label} className="bg-white rounded-2xl border border-[#E4E7EC] p-4 text-center card-hover">
              <cat.icon size={18} className="text-brand mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-text-1">{cat.score}%</p>
              <p className="text-xs text-text-3 mt-0.5">{cat.label}</p>
            </div>
          ))}
        </div>

        {fb && (
          <div className="grid sm:grid-cols-2 gap-4 fade-up-3">
            <div className="bg-success/6 rounded-2xl border border-success/20 p-5">
              <p className="text-xs font-semibold text-success mb-2 uppercase">
                Strongest: {fb.strongest_area}
              </p>
              <p className="text-sm text-text-1 leading-relaxed">{fb.strongest_explanation}</p>
            </div>
            <div className="bg-warning/6 rounded-2xl border border-warning/20 p-5">
              <p className="text-xs font-semibold text-warning mb-2 uppercase">
                Improve: {fb.improvement_area}
              </p>
              <p className="text-sm text-text-1 leading-relaxed">{fb.improvement_explanation}</p>
            </div>
          </div>
        )}

        {fb?.recommended_action && (
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 flex items-center justify-between fade-up-4">
            <div>
              <p className="font-display font-semibold text-text-1 mb-1">Recommended Next Action</p>
              <p className="text-sm text-text-3">{fb.recommended_action}</p>
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
