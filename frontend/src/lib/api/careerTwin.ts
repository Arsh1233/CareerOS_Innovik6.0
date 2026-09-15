// Career Twin API client — matches backend Pydantic contracts exactly.
// Source of truth: backend/app/schemas/career_twin.py
//
// Do NOT use guessed field names.  Update both sides together.

import { apiClient } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────

export interface CareerTwinGenerateRequest {
  /** Preferred target role override. Falls back to profile target_role_name. */
  target_role?: string;
}

export interface Strength {
  title: string;
  evidence: string;
  relevance: string;
}

export interface Gap {
  skill_or_capability: string;
  reason: string;
  priority: "critical" | "recommended" | "nice_to_have";
  evidence_state: "missing" | "partial" | "insufficient";
}

export interface TrajectoryStage {
  stage: string;
  goal: string;
  capabilities_to_build: string[];
  recommended_actions: string[];
}

export interface NextAction {
  title: string;
  reason: string;
  destination: string;
}

export interface EvidenceSummary {
  education_context: string;
  relevant_experience: string;
  known_skills: string;
}

export interface CareerTwinResult {
  target_role: string | null;
  summary: string;
  current_position: EvidenceSummary;
  strengths: Strength[];
  gaps: Gap[];
  trajectory: TrajectoryStage[];
  next_actions: NextAction[];

  /** Fraction of available evidence fields populated (0-1). NOT a readiness score. */
  evidence_coverage: number | null;
  evidence_quality: "sufficient" | "partial" | "insufficient";
  generated_at: string | null;
  model: string | null;
  version: string;
}

export interface CareerTwinResponse {
  result: CareerTwinResult;
  twin_id: string | null;
  is_stale: boolean;
  generated_at: string | null;
}

// ── API calls ─────────────────────────────────────────────────────────────

export async function generateCareerTwin(
  accessToken: string,
  request: CareerTwinGenerateRequest = {},
): Promise<CareerTwinResponse> {
  return apiClient.request<CareerTwinResponse>("/career-twin/get-career-twin", {
    method: "POST",
    body: request,
    accessToken,
    timeoutMs: 60_000, // Groq inference can take a few seconds.
  });
}

export async function getLatestCareerTwin(
  accessToken: string,
): Promise<CareerTwinResponse | null> {
  try {
    const result = await apiClient.request<CareerTwinResponse | null>(
      "/career-twin/latest",
      {
        method: "GET",
        accessToken,
      },
    );
    return result ?? null;
  } catch {
    // 404 or null response means no twin exists yet.
    return null;
  }
}
