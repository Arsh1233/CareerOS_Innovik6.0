import { apiClient } from "./client";
import type { CollegeDashboard, AdminDashboard } from "./types";

/**
 * Get college dashboard metrics and students list.
 */
export async function getCollegeDashboard(): Promise<CollegeDashboard> {
  return apiClient.request<CollegeDashboard>("/colleges/me/dashboard");
}

/**
 * Get platform-wide metrics for the Super Admin.
 */
export async function getAdminDashboard(): Promise<AdminDashboard> {
  return apiClient.request<AdminDashboard>("/admin/dashboard");
}
