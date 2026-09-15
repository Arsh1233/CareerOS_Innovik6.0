// Identity and profile endpoints. Reads and writes are scoped to the bearer
// token's subject; the backend enforces ownership again with RLS.

import { apiClient } from "./client";
import type { CurrentUser, Profile, ProfileUpdateRequest } from "./types";

export const usersApi = {
  /**
   * `GET /users/me` — the authoritative identity for the session.
   *
   * `profile` is null when no profile row exists; callers must render an
   * incomplete-profile state rather than inventing data.
   */
  me(accessToken: string): Promise<CurrentUser> {
    return apiClient.request<CurrentUser>("/users/me", { accessToken });
  },

  /**
   * `PUT /users/profile` — partial update, returns the persisted row.
   *
   * Only send fields that changed. Unknown fields are rejected with 422.
   */
  updateProfile(accessToken: string, input: ProfileUpdateRequest): Promise<Profile> {
    return apiClient.request<Profile>("/users/profile", {
      method: "PUT",
      accessToken,
      body: input,
    });
  },
};
