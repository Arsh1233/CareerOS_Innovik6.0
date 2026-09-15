// MOCK service layer for capabilities that are NOT connected to the backend yet.
//
// ⚠️ Everything below returns hardcoded values behind a Promise delay. None of
// it persists anything, and none of it may be presented as real data.
//
// Migrated to the real API and removed from this file:
//   ✗ authService     → src/lib/api/auth.ts    (FastAPI /auth/*)
//   ✗ profileService  → src/lib/api/users.ts   (FastAPI /users/*)
//   ✗ resumeService   → src/lib/api/resumes.ts (FastAPI /resumes/*)
//   ✗ skillsService   → src/lib/api/skills.ts  (FastAPI /skills/*)
//   ✗ roadmapService  → src/lib/api/roadmap.ts (FastAPI /roadmap/*)
//
// Still mocked here (awaiting their phases): jobsService, notificationService,
// collegeService, recruiterService, adminService, supportService, subscriptionService.

function delay<T>(value: T, ms = 1000): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms));
}

// (skillsService removed — use skillsApi from src/lib/api/skills.ts)
// (roadmapService removed — use roadmapApi from src/lib/api/roadmap.ts)

// ── Jobs ──────────────────────────────────────────────────────────────────

export const jobsService = {
  apply: (jobId: number) =>
    delay({ success: true, jobId, message: "Application submitted." }, 1200),
  save: (jobId: number, saved: boolean) =>
    delay({ success: true, jobId, saved }, 400),
};

// ── Notifications ─────────────────────────────────────────────────────────

export type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  route?: string;
};

export const notificationService = {
  getAll: (): Promise<Notification[]> =>
    delay([
      { id: "1", title: "New job match", body: "Flipkart – AI Engineer – 92% match", time: "2m ago", read: false, route: "/jobs" },
      { id: "2", title: "Skill gap update", body: "MLOps readiness improved by 4%", time: "1h ago", read: false, route: "/skills" },
      { id: "3", title: "ARIA Insight ready", body: "Your weekly career analysis is ready", time: "3h ago", read: true, route: "/mentor" },
      { id: "4", title: "ECHO session reminder", body: "Practice interview scheduled for today", time: "5h ago", read: true, route: "/echo" },
    ], 400),
  markRead: (id: string) => delay({ success: true, id }, 200),
  markAllRead: () => delay({ success: true }, 300),
};

// ── College ───────────────────────────────────────────────────────────────

export const collegeService = {
  exportStudentCSV: (filter: string) =>
    delay({ success: true, filter, url: "#" }, 1000),
  exportReport: () =>
    delay({ success: true }, 900),
  generateReport: (type: string, dateRange: string) =>
    delay({ success: true, type, dateRange, reportId: `RPT-${Date.now()}` }, 1400),
  inviteRecruiter: (email: string) =>
    delay({ success: true, email }, 900),
  flagIntervention: (studentId: string) =>
    delay({ success: true, studentId }, 600),
};

// ── Recruiter ─────────────────────────────────────────────────────────────

export const recruiterService = {
  searchTalent: (query: string, filters: Record<string, string>) =>
    delay({ success: true, query, filters, count: 48 }, 1200),
  shortlistCandidate: (id: string, shortlisted: boolean) =>
    delay({ success: true, id, shortlisted }, 400),
  createJob: (data: Record<string, unknown>) =>
    delay({ success: true, data, jobId: `JOB-${Date.now()}` }, 1000),
  deactivateJob: (jobId: string) =>
    delay({ success: true, jobId }, 600),
  deleteJob: (jobId: string) =>
    delay({ success: true, jobId }, 600),
  exportReport: () =>
    delay({ success: true }, 900),
  movePipelineStage: (candidateId: string, stage: string) =>
    delay({ success: true, candidateId, stage }, 500),
};

// ── Admin ─────────────────────────────────────────────────────────────────

export const adminService = {
  inviteUser: (email: string, role: string) =>
    delay({ success: true, email, role }, 900),
  lockUser: (userId: string, locked: boolean) =>
    delay({ success: true, userId, locked }, 500),
  approveCollege: (collegeId: string) =>
    delay({ success: true, collegeId }, 600),
  approveRecruiter: (recruiterId: string) =>
    delay({ success: true, recruiterId }, 600),
  exportReport: () =>
    delay({ success: true }, 900),
};

// ── Support ───────────────────────────────────────────────────────────────

export const supportService = {
  // Explicit return type: the two branches differ, and callers read `.message`
  // on the failure branch.
  sendFeedback: (type: string, message: string): Promise<{ success: boolean; message?: string }> => {
    if (!message.trim()) return delay({ success: false, message: "Please write your feedback first." }, 200);
    return delay({ success: true }, 800);
  },
  contactSupport: (subject: string, body: string) =>
    delay({ success: true }, 900),
};

// ── Subscription ──────────────────────────────────────────────────────────

export const subscriptionService = {
  downloadInvoice: (plan: string) =>
    delay({ success: true, plan, invoiceId: `INV-${Date.now()}` }, 1000),
};
