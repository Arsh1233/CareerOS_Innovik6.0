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

// ── ARIA Chat ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "aria" | "system";
  message: string;
  created_at: string;
}

export interface ChatRequest {
  message: string;
  /** Omit to start a new session; pass the existing ID to continue one. */
  session_id?: string | null;
}

export interface ChatResponse {
  session_id: string;
  message: ChatMessage;
}

// ── ECHO Interview ────────────────────────────────────────────────────────

export interface StartSessionRequest {
  interview_type: string;
  difficulty: string;
}

export interface StartSessionResponse {
  session_id: string;
  signed_url: string;
  elevenlabs_agent_id: string;
}

export interface EndSessionRequest {
  session_id: string;
  elevenlabs_conversation_id: string;
  duration_seconds?: number | null;
}

export interface RubricScore {
  technical: number;
  communication: number;
  confidence: number;
  overall: number;
}

export interface InterviewFeedback {
  strongest_area: string;
  strongest_explanation: string;
  improvement_area: string;
  improvement_explanation: string;
  summary: string;
  recommended_action: string;
}

export interface InterviewResult {
  session_id: string;
  status: string;
  interview_type: string;
  difficulty: string;
  target_role: string | null;
  scores: RubricScore | null;
  feedback: InterviewFeedback | null;
  transcript: Array<Record<string, unknown>> | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface InterviewSessionSummary {
  session_id: string;
  interview_type: string;
  difficulty: string;
  target_role: string | null;
  status: string;
  overall_score: number | null;
  created_at: string;
}

// ── Jobs ──────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  recruiter_id: string;
  company_name: string;
  title: string;
  department: string | null;
  location: string;
  salary_range: string | null;
  employment_type: string;
  description: string | null;
  required_skills: string[];
  status: string;
  deadline: string | null;
  created_at: string;
}

export interface JobMatch {
  job: Job;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  has_applied: boolean;
}

export interface JobApplication {
  id: string;
  job_id: string;
  student_id: string;
  status: string;
  match_score: number | null;
  matching_skills: string[] | null;
  missing_skills: string[] | null;
  created_at: string;
  student_name: string | null;
  student_college: string | null;
}

export interface RecruiterJobMetric {
  job: Job;
  applicants_count: number;
  shortlisted_count: number;
  avg_match_score: number | null;
}

export interface RecruiterPipelineMetric {
  stage: string;
  count: number;
  color: string;
}

export interface RecruiterDashboard {
  pipeline: RecruiterPipelineMetric[];
  job_metrics: RecruiterJobMetric[];
  recent_applications: JobApplication[];
}

// ── Analytics ─────────────────────────────────────────────────────────────

export interface StudentMetric {
  name: string;
  email: string;
  department: string | null;
  readiness: number;
  status: string;
  issue: string | null;
}

export interface DepartmentMetric {
  dept: string;
  students: number;
  readiness: number;
  placed: number;
  atRisk: number;
}

export interface CollegeDashboard {
  total_students: number;
  job_ready_students: number;
  at_risk_students: number;
  active_recruiters: number;
  department_metrics: DepartmentMetric[];
  students: StudentMetric[];
}

export interface UserMetric {
  name: string;
  email: string;
  role: PlatformRole;
  status: string;
  college: string | null;
  joined: string;
}

export interface CollegeMetric {
  name: string;
  city: string | null;
  students: number;
  active: number;
  readiness: number;
  status: string;
  joinDate: string;
}

export interface RecruiterMetric {
  name: string;
  contact: string | null;
  roles: number;
  hires: number;
  plan: string;
  status: string;
  since: string;
}

export interface AdminDashboard {
  total_users: number;
  active_colleges: number;
  active_recruiters: number;
  users: UserMetric[];
  colleges: CollegeMetric[];
  recruiters: RecruiterMetric[];
}

export interface DiscoveredJob {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience: string;
  salary: string;
  skills_required: string[];
  description: string;
  apply_url: string;
  source: string;
  deadline: string;
  match_score: number;
  readiness_score: number;
}

export interface DiscoveredCourse {
  id: string;
  title: string;
  provider: string;
  instructor: string;
  duration: string;
  level: string;
  skills_covered: string[];
  description: string;
  url: string;
  is_free: boolean;
  has_certificate: boolean;
  language: string;
  relevance_score: number;
}

