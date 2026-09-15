import { createContext, useContext, useState, ReactNode } from "react";

export type Role = "student" | "college" | "recruiter" | "admin";

export interface AuthUser {
  role: Role;
  email: string;
  name: string;
  onboardingComplete: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: () => {},
  signOut: () => {},
  completeOnboarding: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn: setUser,
        signOut: () => setUser(null),
        completeOnboarding: () =>
          setUser((u) => u ? { ...u, onboardingComplete: true } : null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
