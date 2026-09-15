import { apiClient } from "./client";
import type {
  EndSessionRequest,
  InterviewResult,
  InterviewSessionSummary,
  StartSessionRequest,
  StartSessionResponse,
} from "./types";

/**
 * Start an ECHO interview session.
 * Returns a short-lived ElevenLabs signed WebSocket URL and our DB session ID.
 */
export async function startInterviewSession(
  accessToken: string,
  request: StartSessionRequest
): Promise<StartSessionResponse> {
  return apiClient.request<StartSessionResponse>("/voice/start-session", {
    method: "POST",
    accessToken,
    body: request,
  });
}

/**
 * Signal end of session. Backend fetches transcript from ElevenLabs,
 * scores it with Groq, and returns the rubric result.
 */
export async function endInterviewSession(
  accessToken: string,
  request: EndSessionRequest
): Promise<InterviewResult> {
  return apiClient.request<InterviewResult>("/voice/end-session", {
    method: "POST",
    accessToken,
    body: request,
  });
}

/**
 * Retrieve a previously scored interview session.
 */
export async function getInterviewResult(
  accessToken: string,
  sessionId: string
): Promise<InterviewResult> {
  return apiClient.request<InterviewResult>(`/voice/sessions/${sessionId}`, {
    method: "GET",
    accessToken,
  });
}

/**
 * List the most recent interview sessions for the authenticated student.
 */
export async function listInterviewSessions(
  accessToken: string,
  limit = 5
): Promise<InterviewSessionSummary[]> {
  return apiClient.request<InterviewSessionSummary[]>(`/voice/sessions`, {
    method: "GET",
    accessToken,
    query: { limit },
  });
}
