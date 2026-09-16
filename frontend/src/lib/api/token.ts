/**
 * Reads the current user's access token from the session store.
 * Use this in API functions that need authentication but don't have
 * direct access to the React AuthContext.
 */
import { sessionStore } from "../session";
import { ApiError } from "./errors";

export function requireToken(): string {
  const session = sessionStore.read();
  if (!session?.tokens?.access_token) {
    throw new ApiError({
      status: 401,
      code: "not_authenticated",
      message: "Authentication required.",
    });
  }
  return session.tokens.access_token;
}

export function getToken(): string | null {
  return sessionStore.read()?.tokens?.access_token ?? null;
}
