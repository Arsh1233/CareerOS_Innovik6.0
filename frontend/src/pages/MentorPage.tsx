import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Target, Zap, BookOpen, Mic2, Briefcase, TrendingUp } from "lucide-react";

type Message = {
  id: number;
  role: "user" | "aria";
  text: string;
  time: string;
};

const initialMessages: Message[] = [
  {
    id: 1,
    role: "aria",
    text: "Hi Rohan! I've reviewed your progress since our last session. You've improved your Python score by 8 points — great consistency. Today, I'd recommend focusing on MLOps. You're 3 critical skills away from AI Engineer readiness, and deployment knowledge is your highest-leverage gap. What would you like to work on?",
    time: "10:32 AM",
  },
];

const quickActions = [
  { icon: Zap, label: "What should I learn next?" },
  { icon: TrendingUp, label: "Review my progress" },
  { icon: Mic2, label: "Prepare me for an interview" },
  { icon: BookOpen, label: "Improve my resume" },
  { icon: Briefcase, label: "Find suitable roles" },
];

const ariaResponses: Record<string, string> = {
  "What should I learn next?": "Based on your goal of becoming an AI Engineer, I recommend starting with Docker and Kubernetes this week. It's the single highest-ROI skill gap on your profile — 87% of AI Engineer job listings in India require container deployment. I've found a 6-hour Udemy course that matches your learning pace. Want me to add it to your roadmap?",
  "Review my progress": "You've been consistent this month! Here's your snapshot: Python is strong at 85%. ML fundamentals at 72% — above average for your graduation year. Your weakest areas remain MLOps (40%) and LLM fine-tuning (35%). Interview confidence has improved from 55 to 68 since last month. You're on track for 85% readiness by December if you maintain this pace.",
  "Prepare me for an interview": "Let's get you ready. Based on your target role (AI Engineer), I'll focus on three high-frequency interview areas: system design for ML pipelines, Python coding challenges with NumPy/Pandas, and behavioral questions. Should we start with a quick 15-minute mock session right now, or do you want me to generate a study plan first?",
  "Improve my resume": "I've analyzed your resume. Your ATS score is 81/100 — solid but improvable. The top 3 quick wins: (1) Add quantified impact to your ML project description ('improved model accuracy by 12%'), (2) Include 'MLOps' and 'model deployment' keywords which appear in 76% of AI Engineer JDs, (3) Move your skills section above experience. Want me to rewrite the top section?",
  "Find suitable roles": "I found 12 strong matches for your current profile. Top picks: Flipkart AI Engineer (92% match), Infosys ML Specialist (88%), Zomato Data Scientist (85%). The Flipkart role is especially well-aligned — 9 of your 11 required skills match. The gap is Kubernetes, which you could close in 6 weeks. Want me to show you the full breakdown?",
};

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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), role: "user", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const responseText = ariaResponses[text] ?? "That's a great question. Based on your current profile and goals, I recommend focusing on your top skill gap first. Would you like me to create a specific action plan for that?";
      const ariaMsg: Message = {
        id: Date.now() + 1,
        role: "aria",
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((m) => [...m, ariaMsg]);
    }, 1800);
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E4E7EC] bg-white text-xs text-[#475467] hover:border-[#4F7CFF]/40 hover:text-[#4F7CFF] hover:bg-[#4F7CFF]/4 transition-all whitespace-nowrap"
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
            { label: "Target Role", value: "AI Engineer", color: "#4F7CFF" },
            { label: "Readiness", value: "78%", color: "#22A06B" },
            { label: "Roadmap Stage", value: "Skill Building", color: "#8B7CFF" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-[#F7F9FC] border border-[#E4E7EC]">
              <p className="text-[10px] text-[#98A2B3] mb-0.5">{item.label}</p>
              <p className="font-semibold text-sm font-display" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#F1F5F9]">
          <p className="text-xs font-semibold text-[#475467] mb-2.5">Top Priority Goal</p>
          <div className="p-3 rounded-xl bg-[#F59E0B]/6 border border-[#F59E0B]/20">
            <p className="text-xs font-medium text-[#101828]">Complete MLOps learning module</p>
            <p className="text-[10px] text-[#98A2B3] mt-0.5">Due in 3 days · 65% done</p>
          </div>
        </div>

        <div className="pt-3 border-t border-[#F1F5F9]">
          <p className="text-xs font-semibold text-[#475467] mb-2.5">Session Summary</p>
          <div className="space-y-1.5">
            {["Resume analyzed", "Skill gaps identified", "Roadmap created"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22A06B]" />
                <span className="text-xs text-[#667085]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
