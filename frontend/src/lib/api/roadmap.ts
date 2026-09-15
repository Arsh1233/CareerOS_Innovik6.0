import { apiClient } from "./client";
import { requireActiveSession } from "./auth";

export interface RoadmapTask {
  title: string;
  type: string;
  estimated_hours: number;
  description: string;
  destination: string | null;
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

export interface MilestoneResponse {
  id: string;
  roadmap_id: string;
  week_number: number;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoadmapResponse {
  id: string;
  target_role: string;
  version: number;
  pace_hours_per_week: number;
  plan: RoadmapPlan;
  status: string;
  milestones: MilestoneResponse[];
  created_at: string;
  updated_at: string;
}

export const roadmapApi = {
  getLatestRoadmap: async (): Promise<RoadmapResponse | null> => {
    const session = await requireActiveSession();
    return apiClient.request<RoadmapResponse | null>("/roadmap/latest", {
      method: "GET",
      accessToken: session.access_token,
    });
  },

  generateRoadmap: async (paceHoursPerWeek: number): Promise<RoadmapResponse> => {
    const session = await requireActiveSession();
    return apiClient.request<RoadmapResponse>("/roadmap/get-roadmap", {
      method: "POST",
      accessToken: session.access_token,
      body: {
        pace_hours_per_week: paceHoursPerWeek,
      },
    });
  },

  updateMilestoneStatus: async (
    milestoneId: string,
    status: "pending" | "in_progress" | "completed"
  ): Promise<MilestoneResponse> => {
    const session = await requireActiveSession();
    return apiClient.request<MilestoneResponse>(`/roadmap/milestones/${milestoneId}`, {
      method: "PATCH",
      accessToken: session.access_token,
      body: { status },
    });
  },
};
