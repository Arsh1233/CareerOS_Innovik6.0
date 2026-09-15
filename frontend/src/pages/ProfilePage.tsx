import { useState } from "react";
import { User, GraduationCap, Target, Zap, FileText, Shield, Edit2, Check } from "lucide-react";

const sections = [
  { id: "personal", icon: User, label: "Personal Info" },
  { id: "education", icon: GraduationCap, label: "Education" },
  { id: "target", icon: Target, label: "Career Target" },
  { id: "skills", icon: Zap, label: "Skills" },
  { id: "resume", icon: FileText, label: "Resume" },
  { id: "security", icon: Shield, label: "Account & Security" },
];

export default function ProfilePage() {
  const [active, setActive] = useState("personal");
  const [editing, setEditing] = useState(false);

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="fade-up mb-6">
        <h1 className="font-display text-2xl font-bold text-[#101828] mb-1">My Profile</h1>
        <p className="text-[#667085] text-sm">Manage your personal information and career settings.</p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6 fade-up-1">
        {/* Sidebar */}
        <div className="space-y-1">
          {/* Avatar card */}
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 mb-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
              RK
            </div>
            <p className="font-display font-semibold text-[#101828]">Rohan Kumar</p>
            <p className="text-xs text-[#667085] mt-0.5">B.Tech CSE · SRM Institute</p>
            <div className="mt-3 px-3 py-1.5 rounded-full bg-[#4F7CFF]/8 border border-[#4F7CFF]/15">
              <span className="text-xs font-semibold text-[#4F7CFF]">78% Career Readiness</span>
            </div>
          </div>

          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                active === s.id
                  ? "sidebar-item-active"
                  : "text-[#667085] hover:text-[#101828] hover:bg-[#F1F5F9]"
              }`}
            >
              <s.icon size={15} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6">
          {active === "personal" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-semibold text-[#101828]">Personal Information</h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    editing ? "bg-[#22A06B]/8 text-[#22A06B] border border-[#22A06B]/20" : "border border-[#E4E7EC] text-[#667085]"
                  }`}
                >
                  {editing ? <><Check size={12} /> Save</> : <><Edit2 size={12} /> Edit</>}
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: "Rohan Kumar" },
                  { label: "Email", value: "rohan.kumar@srm.edu.in" },
                  { label: "Phone", value: "+91 98765 43210" },
                  { label: "Location", value: "Chennai, Tamil Nadu" },
                  { label: "LinkedIn", value: "linkedin.com/in/rohankumar" },
                  { label: "GitHub", value: "github.com/rohankumar" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-semibold text-[#475467] mb-1.5">{field.label}</label>
                    {editing ? (
                      <input
                        defaultValue={field.value}
                        className="w-full px-3 py-2 rounded-lg border border-[#D0D5DD] text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF]/30 focus:border-[#4F7CFF] transition-all"
                      />
                    ) : (
                      <p className="text-sm text-[#101828] py-2 px-3 rounded-lg bg-[#F7F9FC]">{field.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "education" && (
            <div>
              <h2 className="font-display font-semibold text-[#101828] mb-5">Education</h2>
              <div className="space-y-4">
                {[
                  { degree: "B.Tech — Computer Science & Engineering", inst: "SRM Institute of Science and Technology", year: "2022 — 2026", cgpa: "8.7 / 10" },
                  { degree: "Class XII — Science (PCM + CS)", inst: "DAV Public School, Chennai", year: "2022", cgpa: "92.4%" },
                ].map((edu) => (
                  <div key={edu.degree} className="p-4 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB]">
                    <p className="font-display font-semibold text-[#101828]">{edu.degree}</p>
                    <p className="text-sm text-[#667085] mt-0.5">{edu.inst}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#98A2B3]">
                      <span>{edu.year}</span>
                      <span className="font-semibold text-[#22A06B]">{edu.cgpa}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "target" && (
            <div>
              <h2 className="font-display font-semibold text-[#101828] mb-5">Career Target</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#4F7CFF]/25 bg-[#4F7CFF]/4">
                  <p className="text-xs font-semibold text-[#4F7CFF] mb-1">Target Role</p>
                  <p className="font-display text-lg font-bold text-[#101828]">AI Engineer</p>
                  <p className="text-xs text-[#667085] mt-1">Machine Learning · GenAI · Full Stack AI</p>
                </div>
                {[
                  { label: "Industry", value: "Technology / AI" },
                  { label: "Preferred Location", value: "Bangalore, Hyderabad, Remote" },
                  { label: "Expected CTC", value: "₹18–28 LPA" },
                  { label: "Availability", value: "May 2026 (Post graduation)" },
                  { label: "Work Mode", value: "Hybrid / Remote" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0">
                    <span className="text-sm text-[#667085]">{f.label}</span>
                    <span className="text-sm font-medium text-[#101828]">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "skills" && (
            <div>
              <h2 className="font-display font-semibold text-[#101828] mb-5">Skills</h2>
              <div className="space-y-4">
                {[
                  { category: "Strong", skills: ["Python", "TensorFlow", "Scikit-learn", "SQL", "Git", "FastAPI"], color: "#22A06B" },
                  { category: "Learning", skills: ["Kubernetes", "MLOps", "LLM Fine-tuning", "System Design"], color: "#F59E0B" },
                  { category: "Familiar", skills: ["Spark", "Kafka", "AWS SageMaker", "Tableau"], color: "#667085" },
                ].map((cat) => (
                  <div key={cat.category}>
                    <p className="text-xs font-semibold mb-2" style={{ color: cat.color }}>{cat.category}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.skills.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-full text-xs font-medium border"
                          style={{ background: `${cat.color}10`, color: cat.color, borderColor: `${cat.color}25` }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "resume" && (
            <div>
              <h2 className="font-display font-semibold text-[#101828] mb-5">Resume</h2>
              <div className="p-4 rounded-xl border border-[#E4E7EC] flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#4F7CFF]/10 flex items-center justify-center">
                  <FileText size={18} className="text-[#4F7CFF]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#101828]">Rohan_Kumar_Resume_2026.pdf</p>
                  <p className="text-xs text-[#98A2B3]">Updated 3 days ago · ATS Score: 81/100</p>
                </div>
                <button className="btn-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                  Replace
                </button>
              </div>
              <button className="w-full border-2 border-dashed border-[#D0D5DD] rounded-xl p-6 text-center text-[#98A2B3] text-sm hover:border-[#4F7CFF]/40 hover:text-[#667085] transition-colors">
                Drop a new resume here or click to upload
              </button>
            </div>
          )}

          {active === "security" && (
            <div>
              <h2 className="font-display font-semibold text-[#101828] mb-5">Account & Security</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#E4E7EC]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-[#101828]">Password</p>
                      <p className="text-xs text-[#98A2B3] mt-0.5">Last changed 60 days ago</p>
                    </div>
                    <button className="text-xs font-semibold text-[#4F7CFF] border border-[#4F7CFF]/25 px-3 py-1.5 rounded-lg hover:bg-[#4F7CFF]/4 transition-colors">
                      Change
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-[#E4E7EC]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-[#101828]">Two-Factor Authentication</p>
                      <p className="text-xs text-[#98A2B3] mt-0.5">Add an extra layer of security</p>
                    </div>
                    <div className="w-10 h-5 rounded-full bg-[#E4E7EC] relative cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-[#E5484D]/20 bg-[#E5484D]/4">
                  <p className="font-semibold text-sm text-[#E5484D]">Delete Account</p>
                  <p className="text-xs text-[#98A2B3] mt-0.5">This action is irreversible.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
