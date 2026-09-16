import { apiClient } from "./client";
import type { CollegeDashboard, AdminDashboard } from "./types";

/**
 * Get college dashboard metrics and students list.
 */
export async function getCollegeDashboard(accessToken: string): Promise<CollegeDashboard> {
  return apiClient.request<CollegeDashboard>("/colleges/me/dashboard", { accessToken });
}

/**
 * Get platform-wide metrics for the Super Admin.
 */
export async function getAdminDashboard(accessToken: string): Promise<AdminDashboard> {
  return apiClient.request<AdminDashboard>("/admin/dashboard", { accessToken });
}
