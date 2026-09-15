import { apiClient } from "./client";
import { requireActiveSession } from "./auth";

export interface CurrentSkill {
  skill: string;
  normalized_key: string;
  evidence_summary: string | null;
}

export interface MatchedSkill {
  skill: string;
  normalized_key: string;
  evidence_summary: string | null;
}

export interface SkillGap {
  skill: string;
  normalized_key: string;
  priority: "critical" | "recommended" | "optional";
  required_level: string | null;
  current_evidence: string | null;
  reason: string;
  recommended_action: string;
}

export interface SkillGapResponse {
  target_role: string;
  current_skills: CurrentSkill[];
  matched_skills: MatchedSkill[];
  gaps: SkillGap[];
  total_required: number;
  matched_count: number;
  gap_count: number;
  evidence_quality: "sufficient" | "partial" | "insufficient" | "no_requirements" | "no_role";
  generated_at: string;
}

export const skillsApi = {
  getGapAnalysis: async (): Promise<SkillGapResponse> => {
    const session = await requireActiveSession();
    return apiClient.request<SkillGapResponse>("/skills/gap-analysis", {
      method: "GET",
      accessToken: session.access_token,
    });
  },
};
