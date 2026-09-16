import { apiClient } from "./client";
import { requireToken } from "./token";
import type { DiscoveredCourse } from "./types";

export interface DiscoverCoursesResponse {
  courses: DiscoveredCourse[];
  skill_gaps: string[];
  total: number;
  cached: boolean;
}

export async function getCourses(): Promise<DiscoverCoursesResponse> {
  return apiClient.request<DiscoverCoursesResponse>("/courses/", {
    accessToken: requireToken(),
    timeoutMs: 120_000,
  });
}
