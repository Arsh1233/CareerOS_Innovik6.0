import { createBrowserRouter, Navigate } from "react-router";
import { ROLE_HOME, useAuth } from "./context/AuthContext";
import AppShell, { RoleIndex } from "./components/AppShell";
import AuthLoading from "./components/AuthLoading";

// ── Standalone pages ─────────────────────────────────────────────────────
import LandingPage from "./pages/LandingPage";
import StudentAuth from "./pages/auth/StudentAuth";
import CollegeAuth from "./pages/auth/CollegeAuth";
import RecruiterAuth from "./pages/auth/RecruiterAuth";
import AdminAuthPage from "./pages/AdminAuthPage";
import StudentOnboarding from "./pages/onboarding/StudentOnboarding";
import CollegeOnboarding from "./pages/onboarding/CollegeOnboarding";
import RecruiterOnboarding from "./pages/onboarding/RecruiterOnboarding";
import AdminOnboarding from "./pages/onboarding/AdminOnboarding";
import SubscriptionPage from "./pages/SubscriptionPage";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionFailed from "./pages/SubscriptionFailed";

// ── App shell pages ──────────────────────────────────────────────────────
import DashboardPage from "./pages/DashboardPage";
import CareerTwinPage from "./pages/CareerTwinPage";
import MentorPage from "./pages/MentorPage";
import ResumePage from "./pages/ResumePage";
import SkillsPage from "./pages/SkillsPage";
import InterviewPage from "./pages/InterviewPage";
import JobsPage from "./pages/JobsPage";
import CollegePage from "./pages/CollegePage";
import RecruiterPage from "./pages/RecruiterPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import RoadmapPage from "./pages/RoadmapPage";
import ProgressPage from "./pages/ProgressPage";

function RootRedirect() {
  const { user, isLoading } = useAuth();
  // Wait for the session restore call before deciding anything: while loading,
  // the user is neither authenticated nor unauthenticated.
  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/landing" replace />;
  return <Navigate to={ROLE_HOME[user.role] ?? "/landing"} replace />;
}

export const router = createBrowserRouter([
  // ── Landing & role gateway ────────────────────────────────────────
  { path: "/landing",                Component: LandingPage        },
  { path: "/onboarding",            element: <Navigate to="/landing" replace /> },
  { path: "/auth/student",           Component: StudentAuth         },
  { path: "/auth/college",           Component: CollegeAuth         },
  { path: "/auth/recruiter",         Component: RecruiterAuth       },
  { path: "/auth/admin",             Component: AdminAuthPage       },

  // ── Onboarding wizards ────────────────────────────────────────────
  { path: "/onboarding/student",     Component: StudentOnboarding  },
  { path: "/onboarding/college",     Component: CollegeOnboarding  },
  { path: "/onboarding/recruiter",   Component: RecruiterOnboarding },
  { path: "/onboarding/admin",       Component: AdminOnboarding     },

  // ── Subscription & checkout ───────────────────────────────────────
  { path: "/subscription",           Component: SubscriptionPage    },
  { path: "/subscription/success",   Component: SubscriptionSuccess },
  { path: "/subscription/failed",    Component: SubscriptionFailed  },

  // ── App shell ─────────────────────────────────────────────────────
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: RoleIndex },

      // Student
      { path: "dashboard",           Component: DashboardPage      },
      { path: "career-twin",         Component: CareerTwinPage     },
      { path: "mentor",              Component: MentorPage         },
      { path: "resume",              Component: ResumePage         },
      { path: "skills",              Component: SkillsPage         },
      { path: "roadmap",             Component: RoadmapPage        },
      { path: "echo",                Component: InterviewPage      },
      { path: "interview",           Component: InterviewPage      }, // legacy redirect
      { path: "jobs",                Component: JobsPage           },
      { path: "progress",            Component: ProgressPage       },
      { path: "profile",             Component: ProfilePage        },

      // College
      { path: "college",                   Component: CollegePage  },
      { path: "college/students",          Component: CollegePage  },
      { path: "college/readiness",         Component: CollegePage  },
      { path: "college/skills",            Component: CollegePage  },
      { path: "college/departments",       Component: CollegePage  },
      { path: "college/recruiters",        Component: CollegePage  },
      { path: "college/reports",           Component: CollegePage  },
      { path: "college/settings",          Component: CollegePage  },
      { path: "college/progress",          Component: ProgressPage },

      // Recruiter
      { path: "recruiter",                 Component: RecruiterPage },
      { path: "recruiter/talent",          Component: RecruiterPage },
      { path: "recruiter/candidates",      Component: RecruiterPage },
      { path: "recruiter/matches",         Component: RecruiterPage },
      { path: "recruiter/pipeline",        Component: RecruiterPage },
      { path: "recruiter/jobs",            Component: RecruiterPage },
      { path: "recruiter/analytics",       Component: RecruiterPage },
      { path: "recruiter/progress",        Component: ProgressPage  },
      { path: "recruiter/settings",        Component: RecruiterPage },

      // Admin
      { path: "admin",                     Component: AdminDashboard },
      { path: "admin/users",               Component: AdminDashboard },
      { path: "admin/colleges",            Component: AdminDashboard },
      { path: "admin/recruiters",          Component: AdminDashboard },
      { path: "admin/analytics",           Component: AdminDashboard },
      { path: "admin/ai-usage",            Component: AdminDashboard },
      { path: "admin/logs",                Component: AdminDashboard },
      { path: "admin/control",             Component: AdminDashboard },
      { path: "admin/settings",            Component: AdminDashboard },
    ],
  },

  { path: "*", Component: RootRedirect },
]);
