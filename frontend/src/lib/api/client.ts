// Centralized HTTP client for the CareerOS FastAPI backend.
//
// Every request in the app goes through here: no `fetch` calls in components.
// Responsibilities: base-URL resolution, bearer auth, timeouts, and turning
// backend/network failures into typed `ApiError`s.

import { ApiError, apiErrorFromResponse, defaultCodeForStatus } from "./errors";

export const API_BASE_URL_ENV_VAR = "VITE_API_BASE_URL";

const DEFAULT_TIMEOUT_MS = 15_000;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * The configured API base URL, normalized to have no trailing slash.
 *
 * The value already includes the version prefix, e.g.
 * `http://localhost:8000/api/v1`. Endpoint paths are appended to it.
 */
export function resolveApiBaseUrl(): string {
  const configured = import.meta.env?.VITE_API_BASE_URL;
  return typeof configured === "string" ? configured.trim().replace(/\/+$/, "") : "";
}

/**
 * Joins the base URL with a path, tolerating a duplicated version prefix so a
 * misconfigured value cannot produce `/api/v1/api/v1/...`.
 */
export function joinApiUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const prefix = "/api/v1";
  let suffix = path.startsWith("/") ? path : `/${path}`;

  if (base.endsWith(prefix) && (suffix === prefix || suffix.startsWith(`${prefix}/`))) {
    suffix = suffix.slice(prefix.length) || "/";
  }

  return `${base}${suffix}`;
}

export interface ApiClientOptions {
  /** Overrides the environment value. Used by tooling and tests. */
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  method?: HttpMethod;
  /** Serialized as a JSON body. */
  body?: unknown;
  /**
   * Sent as `multipart/form-data`. Takes precedence over `body`. The
   * Content-Type header is left unset so the browser adds the multipart
   * boundary itself.
   */
  formData?: FormData;
  /** Supabase access token, sent as `Authorization: Bearer <token>`. */
  accessToken?: string | null;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function buildUrl(
  url: string,
  query: RequestOptions["query"],
): string {
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/** Combines the caller's signal with the timeout signal. */
function linkSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}

export class ApiClient {
  private readonly explicitBaseUrl?: string;
  private readonly defaultTimeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions = {}) {
    this.explicitBaseUrl = options.baseUrl;
    this.defaultTimeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    // `fetch` is called unbound so browsers do not throw "Illegal invocation".
    this.fetchImpl = options.fetchImpl ?? ((...args) => globalThis.fetch(...args));
  }

  get baseUrl(): string {
    return this.explicitBaseUrl ?? resolveApiBaseUrl();
  }

  get isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const baseUrl = this.baseUrl;
    if (!baseUrl) {
      throw new ApiError({
        status: 0,
        code: "api_not_configured",
        message: `The frontend is missing its API base URL. Set ${API_BASE_URL_ENV_VAR}.`,
      });
    }

    const url = buildUrl(joinApiUrl(baseUrl, path), options.query);
    const headers: Record<string, string> = { Accept: "application/json" };
    if (options.accessToken) {
      headers.Authorization = `Bearer ${options.accessToken}`;
    }

    let body: BodyInit | undefined;
    if (options.formData) {
      body = options.formData;
    } else if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(
      () => timeoutController.abort(),
      options.timeoutMs ?? this.defaultTimeoutMs,
    );

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: options.method ?? "GET",
        headers,
        body,
        signal: options.signal
          ? linkSignals([options.signal, timeoutController.signal])
          : timeoutController.signal,
      });
    } catch (error) {
      if (options.signal?.aborted) {
        throw new ApiError({
          status: 0,
          code: "request_aborted",
          message: "The request was cancelled.",
        });
      }
      if (isAbortError(error)) {
        throw new ApiError({
          status: 0,
          code: "timeout",
          message: "The server took too long to respond.",
        });
      }
      throw new ApiError({
        status: 0,
        code: "network_error",
        message: "The CareerOS API could not be reached.",
      });
    } finally {
      clearTimeout(timeoutId);
    }

    return this.parse<T>(response);
  }

  private async parse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    let parsed: unknown;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = undefined;
      }
    }

    if (!response.ok) {
      if (parsed === undefined) {
        throw new ApiError({
          status: response.status,
          code: defaultCodeForStatus(response.status),
          message: "Request failed.",
        });
      }
      throw apiErrorFromResponse(response.status, parsed);
    }

    if (parsed === undefined) {
      throw new ApiError({
        status: response.status,
        code: "invalid_response",
        message: "The server returned an empty or invalid response.",
      });
    }

    return parsed as T;
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "AbortError"
  );
}

/** Shared client used by the whole app. */
export const apiClient = new ApiClient();
