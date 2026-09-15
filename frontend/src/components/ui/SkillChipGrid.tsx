export type Proficiency = "" | "Beginner" | "Intermediate" | "Advanced";
export type SkillMap = Record<string, Proficiency>;

const CYCLE: Proficiency[] = ["", "Beginner", "Intermediate", "Advanced"];

const proficiencyConfig: Record<string, { bg: string; text: string; border: string }> = {
  Beginner: { bg: "#22A06B14", text: "#22A06B", border: "#22A06B30" },
  Intermediate: { bg: "#4F7CFF14", text: "#4F7CFF", border: "#4F7CFF30" },
  Advanced: { bg: "#8B7CFF14", text: "#8B7CFF", border: "#8B7CFF30" },
};

const SKILL_CATEGORIES: Record<string, string[]> = {
  "Programming": ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust", "Kotlin"],
  "ML & AI": ["TensorFlow", "PyTorch", "Scikit-learn", "NLP", "Computer Vision", "LLMs", "RAG", "MLOps"],
  "Data": ["SQL", "Pandas", "NumPy", "Spark", "Tableau", "Power BI", "BigQuery", "dbt"],
  "Web & Backend": ["React", "Node.js", "FastAPI", "Django", "REST APIs", "GraphQL", "Next.js"],
  "DevOps & Cloud": ["Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Terraform"],
  "Soft Skills": ["Communication", "Leadership", "Problem Solving", "Teamwork", "Critical Thinking"],
};

interface Props {
  value: SkillMap;
  onChange: (v: SkillMap) => void;
}

export default function SkillChipGrid({ value, onChange }: Props) {
  function toggle(skill: string) {
    const current = value[skill] ?? "";
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
    if (next === "") {
      const updated = { ...value };
      delete updated[skill];
      onChange(updated);
    } else {
      onChange({ ...value, [skill]: next });
    }
  }

  const selectedCount = Object.keys(value).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#667085]">Click a skill to add it, click again to cycle proficiency level.</p>
        <span className="text-xs font-semibold text-[#4F7CFF]">{selectedCount} selected</span>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-[#667085]">
        {(["Beginner", "Intermediate", "Advanced"] as Proficiency[]).map((p) => (
          <div key={p} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: proficiencyConfig[p].text }} />
            <span>{p}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
        {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
          <div key={category}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#98A2B3] mb-2">{category}</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => {
                const prof = value[skill] ?? "";
                const cfg = prof ? proficiencyConfig[prof] : null;
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggle(skill)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150"
                    style={
                      cfg
                        ? { background: cfg.bg, color: cfg.text, borderColor: cfg.border }
                        : { background: "#F7F9FC", color: "#667085", borderColor: "#E4E7EC" }
                    }
                  >
                    {skill}
                    {prof && (
                      <span className="ml-1 opacity-70 text-[10px]">· {prof.slice(0, 3)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
