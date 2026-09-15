import { apiClient } from "./client";
import type { Job, JobApplication, JobMatch, RecruiterDashboard } from "./types";

/**
 * Get job matches for the current student.
 */
export async function getJobMatches(): Promise<JobMatch[]> {
  return apiClient.request<JobMatch[]>("/jobs/matches");
}

/**
 * Apply to a job.
 */
export async function applyToJob(jobId: string): Promise<JobApplication> {
  return apiClient.request<JobApplication>(`/jobs/${jobId}/apply`, {
    method: "POST",
  });
}

/**
 * Create a new job posting (Recruiter only).
 */
export async function createJob(data: Partial<Job>): Promise<Job> {
  return apiClient.request<Job>("/jobs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get recruiter dashboard data.
 */
export async function getRecruiterDashboard(): Promise<RecruiterDashboard> {
  return apiClient.request<RecruiterDashboard>("/jobs/dashboard");
}

/**
 * Update an application's status (Recruiter only).
 */
export async function updateApplicationStatus(applicationId: string, status: string): Promise<JobApplication> {
  return apiClient.request<JobApplication>(`/jobs/applications/${applicationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
