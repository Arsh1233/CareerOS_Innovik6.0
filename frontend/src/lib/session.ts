// Session persistence.
//
// The only thing stored is what is required to restore the user after a page
// refresh: the Supabase session tokens plus the last known identity summary.
// Never store passwords or any server-side secret.
//
// Known limitation (documented, not hidden): the tokens live in
// `localStorage`, which is readable by any script running on the origin. A
// production hardening step is to move the session behind an httpOnly cookie
// issued by the backend.
//
// There is no refresh endpoint in the backend contract yet, so an expired
// access token simply ends the session and the user signs in again.

import type { PlatformRole, SessionTokens } from "./api/types";

const STORAGE_KEY = "careeros.session.v1";

export interface StoredSession {
  userId: string;
  email: string | null;
  /** Last role reported by the backend; never trusted for authorization. */
  role: PlatformRole | null;
  tokens: SessionTokens;
  savedAt: string;
}

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    // Safari private mode throws on write rather than on access.
    const probe = "__careeros_storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function isSessionTokens(value: unknown): value is SessionTokens {
  if (!value || typeof value !== "object") return false;
  const tokens = value as Partial<SessionTokens>;
  return typeof tokens.access_token === "string" && tokens.access_token.length > 0;
}

function parse(raw: string): StoredSession | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.userId !== "string" || !parsed.userId) return null;
    if (!isSessionTokens(parsed.tokens)) return null;
    return {
      userId: parsed.userId,
      email: typeof parsed.email === "string" ? parsed.email : null,
      role: (parsed.role ?? null) as PlatformRole | null,
      tokens: parsed.tokens,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** True when the access token is at (or past) its expiry. */
export function isSessionExpired(session: StoredSession, skewSeconds = 30): boolean {
  const expiresAt = session.tokens.expires_at;
  // Unknown expiry: let the API decide — a 401 clears the session.
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) return false;
  return Date.now() / 1000 >= expiresAt - skewSeconds;
}

export const sessionStore = {
  /** True when browser storage is usable. */
  isAvailable(): boolean {
    return getStorage() !== null;
  },

  read(): StoredSession | null {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session = parse(raw);
    if (!session) {
      // Corrupt or legacy payload: drop it instead of failing on every load.
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  },

  write(session: StoredSession): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Quota exceeded: the in-memory session still works for this tab.
    }
  },

  clear(): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing more we can do; state is cleared in memory by the caller.
    }
  },
};
