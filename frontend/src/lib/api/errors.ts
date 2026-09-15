// Typed API errors and the mapping from backend/provider failures to text that
// is safe to show a user.
//
// Raw provider messages, stack traces and SQL errors must never reach the UI.

import type { ApiErrorEnvelope } from "./types";

export class ApiError extends Error {
  /** HTTP status, or 0 for transport-level failures (offline, timeout). */
  readonly status: number;
  /** Machine-readable code from the backend envelope, or a local code. */
  readonly code: string;
  readonly details: Record<string, unknown>;
  readonly requestId: string | null;

  constructor(init: {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string | null;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details ?? {};
    this.requestId = init.requestId ?? null;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidationError(): boolean {
    return this.status === 422;
  }

  get isServiceUnavailable(): boolean {
    return this.status === 503;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  /** True when the request never reached the backend. */
  get isOffline(): boolean {
    return this.status === 0;
  }

  /** 422 field errors as `{ "target_salary_inr": "..." }`. */
  fieldErrors(): Record<string, string> {
    const fields = this.details.fields;
    if (!Array.isArray(fields)) return {};

    const result: Record<string, string> = {};
    for (const entry of fields) {
      if (!entry || typeof entry !== "object") continue;
      const location = String((entry as { location?: unknown }).location ?? "");
      const message = String((entry as { message?: unknown }).message ?? "");
      if (!location || !message) continue;
      result[location.replace(/^(body|query|path)\./, "")] = message;
    }
    return result;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

const MESSAGES: Record<string, string> = {
  // Transport / configuration
  api_not_configured:
    "The app is not configured to reach the CareerOS API. Set VITE_API_BASE_URL.",
  network_error:
    "Cannot reach the CareerOS server. Check your connection and that the backend is running.",
  timeout: "The server took too long to respond. Please try again.",
  invalid_response: "The server returned an unexpected response.",
  request_aborted: "The request was cancelled.",

  // Auth
  invalid_credentials: "Email or password is incorrect.",
  not_authenticated: "Your session has ended. Please sign in again.",
  token_expired: "Your session has expired. Please sign in again.",
  invalid_token: "Your session is no longer valid. Please sign in again.",
  session_not_issued: "Sign-in did not return a session. Please try again.",
  email_already_registered: "An account already exists for this email. Try signing in instead.",
  invalid_signup: "We could not create the account with those details.",
  role_not_assigned:
    "This account has no CareerOS role assigned. Please contact your administrator.",
  role_mismatch: "This account belongs to a different workspace.",
  forbidden: "Your account does not have access to this area.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",

  // Backend readiness
  auth_not_configured:
    "CareerOS is not connected to its authentication provider yet. Please try again later.",
  auth_admin_not_configured:
    "Account creation is not available yet: the server is missing its Supabase admin configuration.",
  auth_provider_unavailable:
    "The authentication provider is unavailable right now. Please try again shortly.",
  auth_verification_unavailable:
    "Sessions cannot be verified right now. Please try again shortly.",
  database_not_configured:
    "CareerOS is not connected to its database yet, so this data is unavailable.",
  service_unavailable: "CareerOS is temporarily unavailable. Please try again shortly.",

  // Profile
  empty_update: "Nothing to save yet.",
  profile_not_found:
    "No profile exists for this account yet. Complete onboarding to create one.",
  validation_error: "Please check the details you entered.",
  internal_error: "Something went wrong on our side. Please try again.",
};

/**
 * Safe, user-facing text for any thrown value.
 *
 * Backend 4xx messages are shown as-is (the API writes them for users); 5xx and
 * unexpected values fall back to a generic message so internals never leak.
 */
export function userMessage(error: unknown): string {
  if (!isApiError(error)) {
    return "Something went wrong. Please try again.";
  }

  // Field-level detail is more useful than the generic validation message.
  if (error.isValidationError) {
    const firstField = Object.values(error.fieldErrors())[0];
    return firstField ?? MESSAGES.validation_error;
  }

  const mapped = MESSAGES[error.code];
  if (mapped) {
    // `role_mismatch` carries a precise sentence built by the auth layer.
    if (error.code === "role_mismatch" && error.message) return error.message;
    return mapped;
  }

  if (error.isServerError || error.isOffline) {
    return MESSAGES.service_unavailable;
  }

  return error.message || "Something went wrong. Please try again.";
}

/** True when the failure means the caller's session is no longer usable. */
export function isSessionInvalid(error: unknown): boolean {
  return isApiError(error) && (error.isUnauthorized || error.isForbidden);
}

/**
 * Build an `ApiError` from a backend error envelope, falling back to a generic
 * code when the body is not a CareerOS envelope.
 */
export function apiErrorFromResponse(
  status: number,
  body: unknown,
): ApiError {
  const envelope = body as Partial<ApiErrorEnvelope> | null;
  const error = envelope && typeof envelope === "object" ? envelope.error : undefined;

  if (error && typeof error === "object") {
    return new ApiError({
      status,
      code: String(error.code ?? "http_error"),
      message: String(error.message ?? "Request failed."),
      details:
        error.details && typeof error.details === "object"
          ? (error.details as Record<string, unknown>)
          : {},
      requestId: error.request_id ?? null,
    });
  }

  return new ApiError({ status, code: defaultCodeForStatus(status), message: "Request failed." });
}

export function defaultCodeForStatus(status: number): string {
  switch (status) {
    case 400:
      return "bad_request";
    case 401:
      return "not_authenticated";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 422:
      return "validation_error";
    case 429:
      return "rate_limited";
    default:
      return status >= 500 ? "service_unavailable" : "http_error";
  }
}
