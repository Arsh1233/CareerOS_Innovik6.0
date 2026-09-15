// TypeScript contracts mirroring the FastAPI Pydantic schemas.
// Source of truth: CareerOS-RuBI/backend/app/schemas/identity.py
// Field names, nullability and enum values are copied from the backend — do not
// invent fields here, and update both sides together.

export type PlatformRole = "student" | "college" | "recruiter" | "admin";

/** Roles a user may self-register with. `admin` is never offered publicly. */
export type SelfServiceRole = "student" | "college" | "recruiter";

export type OnboardingState = "not_started" | "in_progress" | "complete";

// ── Error envelope ────────────────────────────────────────────────────────

export interface ApiErrorBody {
  code: string;
  message: string;
  request_id: string;
  details: Record<string, unknown>;
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody;
}

/** One entry of `error.details.fields` on a 422 response. */
export interface ValidationFieldError {
  location: string;
  message: string;
  type: string;
}

export interface SimpleMessage {
  message: string;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  service: string;
  environment: string;
  version: string;
  capabilities: Record<string, boolean>;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  role: SelfServiceRole;
  full_name: string;
}

export interface IdentityUser {
  id: string;
  email: string | null;
  role: PlatformRole | null;
  full_name: string | null;
  onboarding_state: string;
}

export interface SessionTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number | null;
  expires_at: number | null;
}

/**
 * Result of `/auth/login` and `/auth/signup`.
 *
 * `session` is null when Supabase created the account but requires email
 * confirmation — the user is NOT signed in in that case.
 */
export interface AuthResult {
  user: IdentityUser;
  session: SessionTokens | null;
  message: string | null;
}

// ── Identity / profile ────────────────────────────────────────────────────

export interface EducationEntry {
  degree: string;
  institution: string;
  start_year?: number | null;
  end_year?: number | null;
  grade?: string | null;
}

export interface ExperienceEntry {
  title: string;
  organization: string;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
}

export interface Profile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  interests: string[];
  target_role_id: string | null;
  target_role_name: string | null;
  target_salary_inr: number | null;
  timeframe_years: number | null;
  onboarding_state: OnboardingState | string;
  discoverability: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Partial profile update. Only the fields actually sent are written, and the
 * backend rejects unknown fields (`extra="forbid"`), so never add keys here
 * casually — `user_id` and `email` are deliberately absent.
 */
export interface ProfileUpdateRequest {
  display_name?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  interests?: string[];
  target_role_name?: string;
  target_salary_inr?: number;
  timeframe_years?: number;
  onboarding_state?: OnboardingState;
  discoverability?: boolean;
}

export interface Membership {
  id: string | null;
  organization_type: "college" | "recruiter_organization";
  organization_id: string | null;
  organization_name: string | null;
  membership_role: string | null;
  status: string | null;
}

/** `GET /users/me` — the authoritative identity for the session. */
export interface CurrentUser {
  id: string;
  email: string | null;
  role: PlatformRole;
  full_name: string | null;
  /** null when the user has no profile row yet — never fabricate one. */
  profile: Profile | null;
  memberships: Membership[];
}

// ── Skill gap (Phase 06) ──────────────────────────────────────────────────
// Source of truth: backend/app/schemas/skills.py

export type SkillPriority = "critical" | "recommended" | "optional";
export type EvidenceQuality = "none" | "limited" | "moderate" | "strong";
/** `no_target_role` / `insufficient_requirements` are honest empty states. */
export type GapStatus = "ok" | "no_target_role" | "insufficient_requirements";

export interface SkillGapItem {
  skill: string;
  skill_key: string;
  priority: SkillPriority;
  required_level: string | null;
  current_evidence: string | null;
  reason: string;
  recommended_action: string;
}

/** `GET /skills/gap-analysis`. */
export interface SkillGapAnalysis {
  status: GapStatus;
  target_role: string | null;
  current_skills: string[];
  matched_skills: string[];
  gaps: SkillGapItem[];
  evidence_quality: EvidenceQuality;
  evidence_count: number;
  requirement_count: number;
  career_twin_stale: boolean;
  generated_at: string;
  message: string | null;
}

// ── Roadmap (Phase 06) ────────────────────────────────────────────────────
// Source of truth: backend/app/schemas/roadmap.py

export type RoadmapTaskType =
  | "course"
  | "project"
  | "practice"
  | "reading"
  | "certification"
  | "other";
export type MilestoneStatus = "pending" | "complete";

export interface RoadmapTask {
  title: string;
  type: RoadmapTaskType;
  estimated_hours: number;
  description: string;
}

export interface RoadmapWeek {
  week: number;
  theme: string;
  objectives: string[];
  skills: string[];
  tasks: RoadmapTask[];
}

export interface RoadmapPlan {
  target_role: string;
  weeks: RoadmapWeek[];
}

export interface Milestone {
  id: string;
  week_number: number;
  title: string;
  status: MilestoneStatus;
  completed_at: string | null;
  created_at: string | null;
}

/** `GET /roadmap/latest` and `POST /roadmap/get-roadmap`. */
export interface Roadmap {
  id: string;
  target_role: string;
  version: number;
  pace_hours_per_week: number | null;
  status: string;
  generated_by: string | null;
  plan: RoadmapPlan;
  milestones: Milestone[];
  career_twin_stale: boolean;
  created_at: string | null;
}

// ── Resume (Phase 05) ─────────────────────────────────────────────────────
// Source of truth: backend/app/schemas/resume.py

export type ResumeSectionStatus = "good" | "warn" | "bad";
export type ResumeParseStatus = "pending" | "parsed" | "failed";
export type ResumeAnalysisStatus = "pending" | "complete" | "failed";

export interface ResumeSection {
  label: string;
  score: number;
  status: ResumeSectionStatus;
}

export interface ResumeImprovements {
  critical: string[];
  recommended: string[];
  optional: string[];
}

export interface ResumeAnalysis {
  ats_score: number;
  quality_score: number;
  role_fit_score: number | null;
  sections: ResumeSection[];
  detected_skills: string[];
  missing_skills: string[];
  improvements: ResumeImprovements;
  word_count: number;
  target_role: string | null;
  analyzed_at: string;
}

export interface Resume {
  id: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  version: number;
  parse_status: ResumeParseStatus;
  analysis_status: ResumeAnalysisStatus;
  storage_path: string | null;
  content_hash: string;
  target_role: string | null;
  analysis: ResumeAnalysis | null;
  created_at: string | null;
}

export interface ResumeList {
  resumes: Resume[];
}
