// Centralized mock service layer.
// All methods return Promises to mirror real async APIs.
// In a production build, swap these implementations for real API clients.

function delay<T>(value: T, ms = 1000): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms));
}

// ── Auth ─────────────────────────────────────────────────────────────────

export const authService = {
  resetPassword: (email: string) =>
    delay({ success: true, message: `Reset link sent to ${email}` }, 1200),
  loginWithGoogle: () =>
    delay({ success: false, message: "Google sign-in is not available in this environment." }, 800),
};

// ── Profile ───────────────────────────────────────────────────────────────

export const profileService = {
  save: (data: Record<string, unknown>) =>
    delay({ success: true, data }, 900),
  changePassword: (current: string, next: string) => {
    if (!current || !next) return delay({ success: false, message: "All fields required." }, 500);
    return delay({ success: true }, 1000);
  },
  replaceResume: (file: File) =>
    delay({ success: true, filename: file.name }, 1400),
  deleteAccount: () =>
    delay({ success: true }, 1500),
};

// ── Resume ────────────────────────────────────────────────────────────────

export const resumeService = {
  upload: (file: File) =>
    delay({ success: true, filename: file.name, score: 81 }, 1800),
  analyze: (filename: string) =>
    delay({ success: true, filename, ats: 81, quality: 76, roleFit: 71 }, 1600),
  improve: () =>
    delay({ success: true, suggestions: [] }, 1000),
  remove: () =>
    delay({ success: true }, 600),
};

// ── Skills ────────────────────────────────────────────────────────────────

export const skillsService = {
  getGaps: () =>
    delay({ success: true, gaps: [] }, 800),
  buildRoadmap: () =>
    delay({ success: true }, 700),
};

// ── Roadmap ───────────────────────────────────────────────────────────────

export const roadmapService = {
  markComplete: (milestoneId: string) =>
    delay({ success: true, milestoneId }, 600),
  markIncomplete: (milestoneId: string) =>
    delay({ success: true, milestoneId }, 600),
};

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
  sendFeedback: (type: string, message: string) => {
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
