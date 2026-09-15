import { apiClient } from "./client";
import type { ChatRequest, ChatResponse } from "./types";

/**
 * Send a message to ARIA and get a response.
 * Pass `session_id` to continue an existing session; omit to start a new one.
 */
export async function sendChatMessage(
  accessToken: string,
  request: ChatRequest
): Promise<ChatResponse> {
  return apiClient.request<ChatResponse>("/chat/", {
    method: "POST",
    accessToken,
    body: request,
  });
}
