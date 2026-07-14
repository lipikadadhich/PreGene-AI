import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// AUTH CONTEXT — FRONTEND-ONLY PLACEHOLDER
//
// There is no backend authentication service connected yet. This context
// exists so the rest of the app (routing, nav, protected routes) can be
// built against a stable API today, and swapped to real network calls
// later without touching any consuming component.
//
// Accounts are stored locally (not just sessions) so that login() can
// verify email/password against what was used at signup(), and so the
// Profile page has real data to display and edit. Passwords are stored
// as plain text in localStorage for this placeholder only — this is NOT
// secure and must be replaced by real backend auth (with proper
// hashing, done server-side) before this app handles real users.
//
// TO CONNECT A REAL BACKEND LATER:
//   1. Replace the body of `login()` with a real request, e.g.
//        const res = await fetch("/api/auth/login", { method: "POST", ... });
//        const { token, user } = await res.json();
//      and store the returned token instead of the fake one below.
//   2. Replace the body of `signup()` the same way.
//   3. Replace `updateProfile()` and `changePassword()` with real
//      requests (e.g. PATCH /api/auth/me, POST /api/auth/change-password).
//   4. Delete the local ACCOUNTS_STORAGE_KEY logic entirely — the
//      backend becomes the source of truth for credentials/profile data.
//   5. Optionally add a `/api/auth/me` call inside the initial
//      `useEffect` below to validate the stored token on page load
//      instead of trusting local storage blindly.
//   6. `logout()` already clears local state — add a call to a
//      `/api/auth/logout` endpoint there if the backend needs to
//      invalidate sessions server-side.
// ---------------------------------------------------------------------------

const AUTH_STORAGE_KEY = "pregene_auth_session";
const ACCOUNTS_STORAGE_KEY = "pregene_auth_accounts";

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

interface StoredAccount {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role?: string;
  institution?: string;
  specialty?: string;
  memberSince: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True only while the initial session check (localStorage read) is running. */
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
    // localStorage may be unavailable (private browsing, etc.) — fail silently,
    // the session will just live only in memory for that tab.
  }
}

function readStoredAccounts(): Record<string, StoredAccount> {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredAccount>;
  } catch {
    return {};
  }
}

function writeStoredAccounts(accounts: Record<string, StoredAccount>) {
  try {
    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // localStorage may be unavailable — account won't persist across reloads,
    // but the current tab's session will still work for this visit.
  }
}

function toAuthUser(account: StoredAccount): AuthUser {
  return {
    name: account.name,
    email: account.email,
    avatar: account.avatar,
    role: account.role,
    institution: account.institution,
    specialty: account.specialty,
    memberSince: account.memberSince,
  };
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
    // --- Placeholder network delay, standing in for a real API call. ---
    await new Promise((resolve) => setTimeout(resolve, 600));

    const normalizedEmail = email.trim().toLowerCase();
    const accounts = readStoredAccounts();
    const account = accounts[normalizedEmail];

    if (!account || account.password !== password) {
      throw new Error("Invalid email or password.");
    }

    const nextUser = toAuthUser(account);
    const session: StoredSession = { token: `fake-token-${Date.now()}`, user: nextUser };

    writeStoredSession(session);
    setUser(nextUser);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      // --- Placeholder network delay, standing in for a real API call. ---
      await new Promise((resolve) => setTimeout(resolve, 600));

      const normalizedEmail = email.trim().toLowerCase();
      const accounts = readStoredAccounts();

      const account: StoredAccount = {
        name,
        email,
        password,
        memberSince: new Date().toISOString(),
      };
      accounts[normalizedEmail] = account;
      writeStoredAccounts(accounts);

      const nextUser = toAuthUser(account);
      const session: StoredSession = { token: `fake-token-${Date.now()}`, user: nextUser };

      writeStoredSession(session);
      setUser(nextUser);
    },
    []
  );

  const logout = useCallback(() => {
    writeStoredSession(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: ProfileUpdate) => {
      await new Promise((resolve) => setTimeout(resolve, 400));

      setUser((current) => {
        if (!current) return current;

        const normalizedEmail = current.email.trim().toLowerCase();
        const accounts = readStoredAccounts();
        const existing = accounts[normalizedEmail];
        if (!existing) return current;

        const updatedAccount: StoredAccount = { ...existing, ...updates };
        accounts[normalizedEmail] = updatedAccount;
        writeStoredAccounts(accounts);

        const nextUser = toAuthUser(updatedAccount);
        const session = readStoredSession();
        if (session) {
          writeStoredSession({ ...session, user: nextUser });
        }

        return nextUser;
      });
    },
    []
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (!user) {
        throw new Error("You must be signed in to change your password.");
      }

      const normalizedEmail = user.email.trim().toLowerCase();
      const accounts = readStoredAccounts();
      const existing = accounts[normalizedEmail];

      if (!existing || existing.password !== currentPassword) {
        throw new Error("Current password is incorrect.");
      }

      accounts[normalizedEmail] = { ...existing, password: newPassword };
      writeStoredAccounts(accounts);
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