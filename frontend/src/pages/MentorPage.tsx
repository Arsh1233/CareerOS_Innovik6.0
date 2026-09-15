import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Zap, Mic2, BookOpen, Briefcase, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sendChatMessage } from "../lib/api/chat";

type Message = {
  id: number;
  role: "user" | "aria";
  text: string;
  time: string;
};

const quickActions = [
  { icon: Zap, label: "What should I learn next?" },
  { icon: TrendingUp, label: "Review my progress" },
  { icon: Mic2, label: "Prepare me for an interview" },
  { icon: BookOpen, label: "Improve my resume" },
  { icon: Briefcase, label: "Find suitable roles" },
];

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center px-4 py-3 bg-[#F7F9FC] rounded-2xl rounded-tl-md w-fit">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#4F7CFF]"
          style={{ animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </div>
  );
}

export default function MentorPage() {
  const { accessToken, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "aria",
      text: `Hi${profile?.display_name ? ` ${profile.display_name.split(" ")[0]}` : ""}! I'm ARIA, your AI career mentor. Ask me anything about your career, skills, or goals — I'll use your profile and roadmap to give you personalised advice.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // Persist the DB session so the whole conversation is one thread
  const sessionIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(text: string) {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await sendChatMessage(accessToken ?? "", {
        message: text,
        session_id: sessionIdRef.current,
      });

      // Persist session ID for the rest of the conversation
      sessionIdRef.current = response.session_id;

      const ariaMsg: Message = {
        id: Date.now() + 1,
        role: "aria",
        text: response.message.message,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((m) => [...m, ariaMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: Date.now() + 1,
        role: "aria",
        text: "Sorry, I couldn't reach the server. Please check your connection and try again.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="h-[calc(100vh-56px)] flex">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-[#E4E7EC] bg-white flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center ai-glow">
            <Sparkles size={16} className="text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#22A06B] border-2 border-white" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm text-[#101828]">ARIA</p>
            <p className="text-xs text-[#667085]">AI Career Mentor · Active now</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "aria" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={12} className="text-white" />
                </div>
              )}
              <div className={`max-w-[70%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-[#4F7CFF] to-[#6E72E8] text-white rounded-tr-md"
                      : "bg-[#F7F9FC] text-[#101828] rounded-tl-md border border-[#E4E7EC]"
                  }`}
                >
                  {msg.text}
                </div>
                <p className="text-[10px] text-[#98A2B3]">{msg.time}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-white" />
              </div>
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick actions */}
        <div className="px-6 py-3 border-t border-[#E4E7EC] bg-white/60 backdrop-blur-sm overflow-x-auto">
          <div className="flex gap-2 w-max">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={() => sendMessage(qa.label)}
                disabled={isTyping}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E4E7EC] bg-white text-xs text-[#475467] hover:border-[#4F7CFF]/40 hover:text-[#4F7CFF] hover:bg-[#4F7CFF]/4 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <qa.icon size={12} />
                {qa.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-[#E4E7EC] bg-white">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex items-center gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask ARIA anything about your career..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#D0D5DD] text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/30 focus:border-[#4F7CFF] transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="btn-primary text-white p-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* Context panel */}
      <div className="w-[260px] shrink-0 border-l border-[#E4E7EC] bg-white p-5 space-y-5 hidden lg:block overflow-y-auto">
        <h3 className="font-display font-semibold text-sm text-[#101828]">Your Context</h3>

        <div className="space-y-3">
          {[
            { label: "Target Role", value: profile?.target_role_name ?? "—", color: "#4F7CFF" },
            { label: "Location", value: profile?.location ?? "—", color: "#22A06B" },
            { label: "Onboarding", value: profile?.onboarding_state ?? "—", color: "#8B7CFF" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-[#F7F9FC] border border-[#E4E7EC]">
              <p className="text-[10px] text-[#98A2B3] mb-0.5">{item.label}</p>
              <p className="font-semibold text-sm font-display" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#F1F5F9]">
          <p className="text-xs font-semibold text-[#475467] mb-2.5">Session</p>
          <div className="p-3 rounded-xl bg-[#4F7CFF]/6 border border-[#4F7CFF]/20">
            <p className="text-xs font-medium text-[#101828]">
              {sessionIdRef.current ? "Active session" : "New session"}
            </p>
            <p className="text-[10px] text-[#98A2B3] mt-0.5">Messages are saved to your history</p>
          </div>
        </div>
      </div>
    </div>
  );
}
