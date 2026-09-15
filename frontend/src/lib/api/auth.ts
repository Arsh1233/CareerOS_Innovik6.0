// Auth endpoints. The frontend never calls Supabase directly and never holds a
// service key: FastAPI brokers login/signup so the platform role is assigned
// server-side.

import { apiClient } from "./client";
import type {
  AuthResult,
  HealthResponse,
  LoginRequest,
  SimpleMessage,
  SignupRequest,
} from "./types";

export const authApi = {
  /** `POST /auth/login` → Supabase session tokens + identity. */
  login(input: LoginRequest): Promise<AuthResult> {
    return apiClient.request<AuthResult>("/auth/login", {
      method: "POST",
      body: input,
    });
  },

  /**
   * `POST /auth/signup`. Admin is not a valid role here and is rejected by the
   * backend contract.
   *
   * A 201 with `session: null` means email confirmation is required: the
   * account exists but the user is not signed in.
   */
  signup(input: SignupRequest): Promise<AuthResult> {
    return apiClient.request<AuthResult>("/auth/signup", {
      method: "POST",
      body: input,
    });
  },

  /**
   * `POST /auth/logout` — revokes the Supabase session.
   *
   * Callers must clear local state regardless of the outcome.
   */
  logout(accessToken: string): Promise<void> {
    return apiClient.request<void>("/auth/logout", {
      method: "POST",
      accessToken,
    });
  },

  /** `POST /auth/password-reset` — never discloses whether the account exists. */
  requestPasswordReset(email: string): Promise<SimpleMessage> {
    return apiClient.request<SimpleMessage>("/auth/password-reset", {
      method: "POST",
      body: { email },
    });
  },

  /** `GET /health` — service status and which integrations are configured. */
  health(): Promise<HealthResponse> {
    return apiClient.request<HealthResponse>("/health");
  },
};
