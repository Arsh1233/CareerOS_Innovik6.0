// Authentication state for the whole app.
//
// The session starts from Supabase tokens issued by the backend, but the
// authoritative identity — including the platform role — always comes from
// `GET /users/me`. The role is never derived from the login form, the URL, the
// selected portal, or stored client state.
//
// The public shape of `useAuth()` is preserved for existing pages
// (`user`, `signIn`, `signOut`, `completeOnboarding`).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authApi, usersApi } from "../lib/api";
import { ApiError, isSessionInvalid, userMessage } from "../lib/api/errors";
import type {
  CurrentUser,
  PlatformRole,
  Profile,
  ProfileUpdateRequest,
  SelfServiceRole,
} from "../lib/api/types";
import { isSessionExpired, sessionStore, type StoredSession } from "../lib/session";

export type Role = PlatformRole;

/**
 * Backwards-compatible user shape used by existing screens
 * (AppShell, ProgressPage, SubscriptionPage, ...).
 */
export interface AuthUser {
  id: string;
  role: Role;
  email: string;
  name: string;
  onboardingComplete: boolean;
}

export interface SignInInput {
  email: string;
  password: string;
  /**
   * The portal the user opened. When set, a signed-in account whose
   * server-assigned role differs is rejected instead of being let into the
   * wrong workspace.
   */
  expectedRole?: Role;
}

export interface SignUpInput {
  email: string;
  password: string;
  full_name: string;
  role: SelfServiceRole;
}

export interface SignUpOutcome {
  /** null when the account needs email confirmation before it can sign in. */
  user: AuthUser | null;
  requiresEmailConfirmation: boolean;
  message: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** Full backend identity (`GET /users/me`), null while loading or unresolved. */
  identity: CurrentUser | null;
  profile: Profile | null;
  role: Role | null;
  isAuthenticated: boolean;
  /** True while the stored session is being restored on startup. */
  isLoading: boolean;
  /** True while a sign-in/sign-up request is in flight. */
  isSubmitting: boolean;
  /** Non-fatal problem with the current session (expired, backend unreachable). */
  sessionError: string | null;
  /**
   * The active access token, or null when not signed in. Use this to pass to
   * API functions instead of reading sessionStore directly, so callers remain
   * reactive to sign-out.
   */
  accessToken: string | null;
  signIn: (input: SignInInput) => Promise<AuthUser>;
  signUp: (input: SignUpInput) => Promise<SignUpOutcome>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<CurrentUser | null>;
  updateProfile: (input: ProfileUpdateRequest) => Promise<Profile>;
  /** Local UI flag only — see the implementation note below. */
  completeOnboarding: () => void;
}

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  college: "College Admin",
  recruiter: "Recruiter",
  admin: "Administrator",
};

export const ROLE_HOME: Record<Role, string> = {
  student: "/dashboard",
  college: "/college",
  recruiter: "/recruiter",
  admin: "/admin",
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  identity: null,
  profile: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  isSubmitting: false,
  sessionError: null,
  accessToken: null,
  signIn: () => Promise.reject(new Error("AuthProvider is not mounted.")),
  signUp: () => Promise.reject(new Error("AuthProvider is not mounted.")),
  signOut: () => Promise.resolve(),
  refreshUser: () => Promise.resolve(null),
  updateProfile: () => Promise.reject(new Error("AuthProvider is not mounted.")),
  completeOnboarding: () => {},
});

function toAuthUser(identity: CurrentUser): AuthUser {
  const profileName = identity.profile?.display_name?.trim();
  const metadataName = identity.full_name?.trim();
  const emailPrefix = (identity.email ?? "").split("@")[0];

  return {
    id: identity.id,
    role: identity.role,
    email: identity.profile?.email ?? identity.email ?? "",
    name: profileName || metadataName || emailPrefix || ROLE_LABEL[identity.role],
    onboardingComplete: identity.profile?.onboarding_state === "complete",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [identity, setIdentity] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  // Reactive token — updated whenever a session is acquired or cleared.
  const [accessToken, setAccessToken] = useState<string | null>(() => sessionStore.read()?.tokens.access_token ?? null);

  // Kept in a ref so callbacks never act on a stale token.
  const sessionRef = useRef<StoredSession | null>(null);

  const clearLocalSession = useCallback(() => {
    sessionRef.current = null;
    sessionStore.clear();
    setUser(null);
    setIdentity(null);
    setAccessToken(null);
  }, []);

  /** Apply an authoritative identity and persist the current tokens with it. */
  const applyIdentity = useCallback((next: CurrentUser) => {
    setIdentity(next);
    setUser(toAuthUser(next));

    const current = sessionRef.current;
    if (current) {
      const updated: StoredSession = {
        ...current,
        userId: next.id,
        email: next.email,
        role: next.role,
        savedAt: new Date().toISOString(),
      };
      sessionRef.current = updated;
      sessionStore.write(updated);
    }
  }, []);

  // ── startup restore ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = sessionStore.read();
      if (!stored) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (isSessionExpired(stored)) {
        // No refresh endpoint exists in the API contract, so an expired token
        // ends the session instead of being silently reused.
        sessionStore.clear();
        if (!cancelled) {
          setSessionError("Your previous session expired. Please sign in again.");
          setIsLoading(false);
        }
        return;
      }

      sessionRef.current = stored;
      try {
        const me = await usersApi.me(stored.tokens.access_token);
        if (cancelled) return;
        setAccessToken(stored.tokens.access_token);
        applyIdentity(me);
        setSessionError(null);
      } catch (error) {
        if (cancelled) return;
        if (isSessionInvalid(error)) {
          clearLocalSession();
        } else {
          // Backend unreachable or not configured: the user is NOT treated as
          // authenticated. The stored session is left in place so a later load
          // can retry, but nothing is restored from it now.
          sessionRef.current = null;
        }
        setSessionError(userMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [applyIdentity, clearLocalSession]);

  // ── sign in ─────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (input: SignInInput): Promise<AuthUser> => {
      setIsSubmitting(true);
      setSessionError(null);

      try {
        const result = await authApi.login({
          email: input.email.trim(),
          password: input.password,
        });

        if (!result.session) {
          throw new ApiError({
            status: 401,
            code: "session_not_issued",
            message: "Sign-in did not return a session.",
          });
        }

        const actualRole = result.user.role;
        if (!actualRole) {
          throw new ApiError({
            status: 403,
            code: "role_not_assigned",
            message: "This account has no CareerOS role assigned.",
          });
        }

        // Portal/identity mismatch: refuse, and create no local session.
        if (input.expectedRole && actualRole !== input.expectedRole) {
          throw new ApiError({
            status: 403,
            code: "role_mismatch",
            message: `This account is registered as a ${ROLE_LABEL[actualRole]}. Please use the ${ROLE_LABEL[actualRole]} workspace instead.`,
            details: { actualRole, expectedRole: input.expectedRole },
          });
        }

        const stored: StoredSession = {
          userId: result.user.id,
          email: result.user.email,
          role: actualRole,
          tokens: result.session,
          savedAt: new Date().toISOString(),
        };
        sessionRef.current = stored;
        sessionStore.write(stored);
        setAccessToken(result.session.access_token);

        try {
          // The verified identity is what the app trusts, not the login form.
          const me = await usersApi.me(result.session.access_token);
          applyIdentity(me);
          return toAuthUser(me);
        } catch (error) {
          if (isSessionInvalid(error)) {
            clearLocalSession();
            throw error;
          }

          // Tokens are valid but identity could not be read (for example the
          // database is not configured yet). Keep the session, show no profile.
          const fallback: AuthUser = {
            id: result.user.id,
            role: actualRole,
            email: result.user.email ?? input.email.trim(),
            name: result.user.full_name?.trim() || input.email.trim().split("@")[0],
            onboardingComplete: false,
          };
          setUser(fallback);
          setIdentity(null);
          setSessionError(userMessage(error));
          return fallback;
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [applyIdentity, clearLocalSession],
  );

  // ── sign up ─────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (input: SignUpInput): Promise<SignUpOutcome> => {
      setIsSubmitting(true);
      setSessionError(null);

      try {
        const result = await authApi.signup({
          email: input.email.trim(),
          password: input.password,
          role: input.role,
          full_name: input.full_name.trim(),
        });

        if (!result.session) {
          // Email confirmation required: the account exists, the user is not
          // signed in, and no local session is created.
          return {
            user: null,
            requiresEmailConfirmation: true,
            message:
              result.message ?? "Account created. Check your email to confirm your account.",
          };
        }

        const assignedRole = result.user.role;
        if (assignedRole && assignedRole !== input.role) {
          throw new ApiError({
            status: 403,
            code: "role_mismatch",
            message: `This account was registered as a ${ROLE_LABEL[assignedRole]}. Please use the ${ROLE_LABEL[assignedRole]} workspace instead.`,
            details: { actualRole: assignedRole, expectedRole: input.role },
          });
        }

        const stored: StoredSession = {
          userId: result.user.id,
          email: result.user.email,
          role: assignedRole ?? input.role,
          tokens: result.session,
          savedAt: new Date().toISOString(),
        };
        sessionRef.current = stored;
        sessionStore.write(stored);
        setAccessToken(result.session.access_token);

        try {
          const me = await usersApi.me(result.session.access_token);
          applyIdentity(me);
          return { user: toAuthUser(me), requiresEmailConfirmation: false, message: null };
        } catch (error) {
          if (isSessionInvalid(error)) {
            clearLocalSession();
            throw error;
          }
          const fallback: AuthUser = {
            id: result.user.id,
            role: assignedRole ?? input.role,
            email: result.user.email ?? input.email.trim(),
            name: result.user.full_name?.trim() || input.full_name.trim(),
            onboardingComplete: false,
          };
          setUser(fallback);
          setIdentity(null);
          setSessionError(userMessage(error));
          return { user: fallback, requiresEmailConfirmation: false, message: null };
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [applyIdentity, clearLocalSession],
  );

  // ── sign out ────────────────────────────────────────────────────────────
  const signOut = useCallback(async (): Promise<void> => {
    const accessToken = sessionRef.current?.tokens.access_token ?? null;

    // Local state is cleared first so the UI can never keep showing an
    // authenticated shell if the revocation call fails.
    clearLocalSession();
    setSessionError(null);

    if (!accessToken) return;
    try {
      await authApi.logout(accessToken);
    } catch {
      // The session was already invalid, or the backend is unreachable.
      // Revocation is best-effort: this token expires on its own.
    }
  }, [clearLocalSession]);

  // ── refresh ─────────────────────────────────────────────────────────────
  const refreshUser = useCallback(async (): Promise<CurrentUser | null> => {
    const accessToken = sessionRef.current?.tokens.access_token;
    if (!accessToken) {
      clearLocalSession();
      return null;
    }

    try {
      const me = await usersApi.me(accessToken);
      applyIdentity(me);
      return me;
    } catch (error) {
      if (isSessionInvalid(error)) clearLocalSession();
      throw error;
    }
  }, [applyIdentity, clearLocalSession]);

  // ── profile update ──────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (input: ProfileUpdateRequest): Promise<Profile> => {
      const accessToken = sessionRef.current?.tokens.access_token;
      if (!accessToken) {
        throw new ApiError({
          status: 401,
          code: "not_authenticated",
          message: "You must be signed in to update your profile.",
        });
      }

      // Only the persisted response is allowed to update state.
      const saved = await usersApi.updateProfile(accessToken, input);

      setIdentity((prev) =>
        prev ? { ...prev, profile: saved, full_name: saved.display_name ?? prev.full_name } : prev,
      );
      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: saved.display_name?.trim() || prev.name,
              email: saved.email ?? prev.email,
              onboardingComplete: saved.onboarding_state === "complete",
            }
          : prev,
      );

      return saved;
    },
    [],
  );

  const completeOnboarding = useCallback(() => {
    // Local UI flag only. Persisting onboarding state must go through
    // `updateProfile({ onboarding_state: "complete" })`; this does not write to
    // the backend and must not be used as proof of completion.
    setUser((current) => (current ? { ...current, onboardingComplete: true } : null));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      identity,
      profile: identity?.profile ?? null,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isLoading,
      isSubmitting,
      sessionError,
      accessToken,
      signIn,
      signUp,
      signOut,
      refreshUser,
      updateProfile,
      completeOnboarding,
    }),
    [
      user,
      identity,
      isLoading,
      isSubmitting,
      sessionError,
      accessToken,
      signIn,
      signUp,
      signOut,
      refreshUser,
      updateProfile,
      completeOnboarding,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Convenience for screens that require a signed-in role. */
export function useRequiredRole(): Role | null {
  return useAuth().role;
}
