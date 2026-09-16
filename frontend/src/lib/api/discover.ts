import { apiClient } from "./client";
import { requireToken } from "./token";
import type { DiscoveredJob } from "./types";

export interface DiscoverJobsResponse {
  jobs: DiscoveredJob[];
  target_role: string;
  total: number;
  cached: boolean;
}

export async function discoverJobs(): Promise<DiscoverJobsResponse> {
  return apiClient.request<DiscoverJobsResponse>("/jobs/discover", {
    accessToken: requireToken(),
    timeoutMs: 120_000, // scraping takes time
  });
}
