import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// AUTH CONTEXT — CONNECTED TO FASTAPI
//
// This context now communicates directly with your FastAPI backend.
// Credentials are no longer stored in localStorage. Only the JWT session 
// token and basic user info are persisted to keep the user logged in 
// across page reloads.
// ---------------------------------------------------------------------------

const AUTH_STORAGE_KEY = "pregene_auth_session";
const BACKEND_URL = "http://127.0.0.1:8000";

export interface AuthUser {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  institution?: string;
  specialty?: string;
  memberSince: string;
}

export interface ProfileUpdate {
  name?: string;
  avatar?: string;
  role?: string;
  institution?: string;
  specialty?: string;
}

interface StoredSession {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

function readStoredSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredSession | null) {
  try {
    if (session) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Fail silently
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Restore any previously "signed in" session on first load.
  useEffect(() => {
    const stored = readStoredSession();
    if (stored) {
      setUser(stored.user);
    }
    setIsInitializing(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Call real FastAPI login endpoint
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Invalid email or password.");
    }

    const data = await response.json();

    // 2. Build a basic user object (since backend doesn't have a /me route yet)
    const nextUser: AuthUser = {
      name: normalizedEmail.split("@")[0], // Fallback name
      email: normalizedEmail,
      memberSince: new Date().toISOString(),
    };

    // 3. Store the real JWT token
    const session: StoredSession = { 
      token: data.access_token, 
      user: nextUser 
    };

    writeStoredSession(session);
    setUser(nextUser);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Call real FastAPI signup endpoint
      const response = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: normalizedEmail, 
          password, 
          full_name: name 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create account.");
      }

      // 2. Automatically log the user in after successful signup
      await login(normalizedEmail, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    writeStoredSession(null);
    setUser(null);
  }, []);

  // NOTE: These are kept as frontend mocks to prevent your UI from breaking.
  // You will need to build FastAPI endpoints for these later.
  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    setUser((current) => {
      if (!current) return current;
      const nextUser = { ...current, ...updates };
      const session = readStoredSession();
      if (session) {
        writeStoredSession({ ...session, user: nextUser });
      }
      return nextUser;
    });
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      // Mock network delay. Backend integration needed later.
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      if (!user) {
        throw new Error("You must be signed in to change your password.");
      }

      // Temporary log to satisfy TypeScript/ESLint until the backend route is built
      console.log("Password change requested.");
      console.log("Current:", currentPassword, "New:", newPassword);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      signup,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, isInitializing, login, signup, logout, updateProfile, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}