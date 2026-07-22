import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Building2,
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Camera,
  LogOut,
  Laptop,
  Smartphone,
  Tablet,
  KeyRound,
  Save,
  User as UserIcon,
  BadgeCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { getAnalysisHistory } from "@/services/api";

type ThemeChoice = "light" | "dark" | "system";

interface ProfileForm {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
}

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

type SessionKind = "laptop" | "phone" | "tablet";

interface SessionEntry {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
  kind: SessionKind;
}

const PROFILE_STORAGE_KEY = "pregene-profile";
const AVATAR_STORAGE_KEY = "pregene-profile-avatar";
const THEME_CHOICE_KEY = "pregene-theme-choice";
const TFA_KEY = "pregene-2fa-enabled";

const DEFAULT_PROFILE: ProfileForm = {
  fullName: "Dr. Aditi Sharma",
  email: "aditi.sharma@pregene.ai",
  phone: "+91 98765 43210",
  organization: "PreGene Genomics Institute",
  role: "Clinical Geneticist",
};

const DEFAULT_SESSIONS: SessionEntry[] = [
  {
    id: "s-current",
    device: "MacBook Pro 14\"",
    browser: "Chrome on macOS",
    location: "Bengaluru, IN",
    lastActive: "Active now",
    current: true,
    kind: "laptop",
  },
  {
    id: "s-2",
    device: "iPhone 15 Pro",
    browser: "Safari on iOS",
    location: "Bengaluru, IN",
    lastActive: "2 hours ago",
    current: false,
    kind: "phone",
  },
  {
    id: "s-3",
    device: "iPad Air",
    browser: "Safari on iPadOS",
    location: "Mumbai, IN",
    lastActive: "Yesterday",
    current: false,
    kind: "tablet",
  },
];

const THEME_OPTIONS: {
  value: ThemeChoice;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "light",
    label: "Light",
    description: "Bright interface for daytime clinical work.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Reduced glare for extended reading sessions.",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Match your operating system preference.",
    icon: Monitor,
  },
];

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function readString(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeString(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    return;
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "U";
}

function sessionIconFor(kind: SessionKind) {
  if (kind === "phone") return Smartphone;
  if (kind === "tablet") return Tablet;
  return Laptop;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileForm>(() =>
    readJSON<ProfileForm>(PROFILE_STORAGE_KEY, DEFAULT_PROFILE),
  );
  const [profileDraft, setProfileDraft] = useState<ProfileForm>(profile);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() =>
    readString(AVATAR_STORAGE_KEY),
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState<{
    current: boolean;
    next: boolean;
    confirm: boolean;
  }>({ current: false, next: false, confirm: false });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(() =>
    readJSON<boolean>(TFA_KEY, false),
  );

  const [sessions, setSessions] = useState<SessionEntry[]>(DEFAULT_SESSIONS);

  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(() =>
    readJSON<ThemeChoice>(THEME_CHOICE_KEY, "system"),
  );

  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  useEffect(() => {
    writeJSON(TFA_KEY, twoFactorEnabled);
  }, [twoFactorEnabled]);

  useEffect(() => {
    writeJSON(THEME_CHOICE_KEY, themeChoice);

    const applyTheme = () => {
      if (themeChoice === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        const desired = prefersDark ? "dark" : "light";
        setTheme(desired);
      } else {
        setTheme(themeChoice);
      }
    };

    applyTheme();

    if (themeChoice === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme();
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
    return undefined;
  }, [themeChoice, setTheme]);

  const profileDirty = useMemo(
    () =>
      profile.fullName !== profileDraft.fullName ||
      profile.email !== profileDraft.email ||
      profile.phone !== profileDraft.phone ||
      profile.organization !== profileDraft.organization ||
      profile.role !== profileDraft.role,
    [profile, profileDraft],
  );

  const initials = useMemo(
    () => getInitials(profileDraft.fullName),
    [profileDraft.fullName],
  );

  function updateProfileField<K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K],
  ) {
    setProfileDraft((prev) => ({ ...prev, [key]: value }));
    setProfileMessage(null);
    setProfileError(null);
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileError("Please choose an image file for your avatar.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Avatar image must be smaller than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setAvatarUrl(result);
      writeString(AVATAR_STORAGE_KEY, result);
      setProfileError(null);
      setProfileMessage("Avatar updated.");
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatarUrl(null);
    writeString(AVATAR_STORAGE_KEY, null);
    setProfileMessage("Avatar removed.");
    setProfileError(null);
  }

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);

    if (!profileDraft.fullName.trim()) {
      setProfileError("Full name is required.");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileDraft.email);
    if (!emailOk) {
      setProfileError("Please enter a valid email address.");
      return;
    }

    setIsSavingProfile(true);
    await new Promise((r) => setTimeout(r, 600));
    setProfile(profileDraft);
    writeJSON(PROFILE_STORAGE_KEY, profileDraft);
    setIsSavingProfile(false);
    setProfileMessage("Profile updated successfully.");
  }

  function handleResetProfile() {
    setProfileDraft(profile);
    setProfileMessage(null);
    setProfileError(null);
  }

  async function handleSavePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (passwordForm.current.length < 6) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (passwordForm.next.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setIsSavingPassword(true);
    await new Promise((r) => setTimeout(r, 700));
    setPasswordForm({ current: "", next: "", confirm: "" });
    setIsSavingPassword(false);
    setPasswordMessage("Password updated successfully.");
  }

  function revokeSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function handleLogoutAllDevices() {
    logout();
    navigate("/login", { replace: true });
  }

  async function handleExport() {
    setExportMessage(null);
    setExportError(null);
    setIsExporting(true);
    try {
      const history = await getAnalysisHistory();

      if (!history.length) {
        setExportError("No analysis history available to export yet.");
        return;
      }

      const blob = new Blob([JSON.stringify(history, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pregene-analysis-history-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage(`Exported ${history.length} record(s) successfully.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to export data right now.";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  }

  function handleClearSession() {
    logout();
    navigate("/login", { replace: true });
  }

  const inputClass =
    "block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50";

  const labelClass = "block text-xs font-medium uppercase tracking-wide text-slate-500";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your profile, security, appearance, and data preferences."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      {/* Profile */}
      <section
        aria-labelledby="settings-profile-heading"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h3
              id="settings-profile-heading"
              className="text-lg font-semibold text-slate-900"
            >
              Profile
            </h3>
            <p className="text-sm text-slate-500">
              Update your personal and organization details.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex flex-col items-start gap-5 rounded-xl border border-slate-200 bg-slate-50/40 p-5 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-xl font-semibold text-brand-700 ring-1 ring-slate-200">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                aria-label="Change avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarPick}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {profileDraft.fullName || "Your name"}
              </p>
              <p className="text-xs text-slate-500">
                {profileDraft.role || "Role"} · {profileDraft.organization || "Organization"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAvatarClick}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Upload photo
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-slate-600 hover:text-red-600"
                    onClick={handleRemoveAvatar}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                PNG or JPG up to 2MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="fullName" className={labelClass}>
                Full name
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  value={profileDraft.fullName}
                  onChange={(e) => updateProfileField("fullName", e.target.value)}
                  className={`${inputClass} pl-9`}
                  placeholder="Dr. Full Name"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className={labelClass}>
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={profileDraft.email}
                  onChange={(e) => updateProfileField("email", e.target.value)}
                  className={`${inputClass} pl-9`}
                  placeholder="you@hospital.org"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className={labelClass}>
                Phone number
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="phone"
                  type="tel"
                  value={profileDraft.phone}
                  onChange={(e) => updateProfileField("phone", e.target.value)}
                  className={`${inputClass} pl-9`}
                  placeholder="+91 00000 00000"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="organization" className={labelClass}>
                Organization
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="organization"
                  type="text"
                  value={profileDraft.organization}
                  onChange={(e) =>
                    updateProfileField("organization", e.target.value)
                  }
                  className={`${inputClass} pl-9`}
                  placeholder="Hospital or clinic name"
                  autoComplete="organization"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="role" className={labelClass}>
                Role
              </label>
              <div className="relative">
                <BadgeCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="role"
                  value={profileDraft.role}
                  onChange={(e) => updateProfileField("role", e.target.value)}
                  className={`${inputClass} appearance-none pl-9`}
                >
                  <option>Clinical Geneticist</option>
                  <option>Reproductive Endocrinologist</option>
                  <option>Genetic Counselor</option>
                  <option>Embryologist</option>
                  <option>Research Scientist</option>
                  <option>Administrator</option>
                </select>
              </div>
            </div>
          </div>

          {profileError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}
          {profileMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{profileMessage}</span>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetProfile}
              disabled={!profileDirty || isSavingProfile}
            >
              Discard changes
            </Button>
            <Button
              type="submit"
              disabled={!profileDirty || isSavingProfile}
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* Account */}
      <section
        aria-labelledby="settings-account-heading"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3
              id="settings-account-heading"
              className="text-lg font-semibold text-slate-900"
            >
              Account &amp; Security
            </h3>
            <p className="text-sm text-slate-500">
              Manage credentials, sign-in verification, and active devices.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Change Password */}
          <div className="rounded-xl border border-slate-200 p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Change password
                </p>
                <p className="text-xs text-slate-500">
                  Use at least 8 characters, mixing letters and numbers.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="currentPassword" className={labelClass}>
                    Current password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="currentPassword"
                      type={showPassword.current ? "text" : "password"}
                      value={passwordForm.current}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, current: e.target.value }))
                      }
                      className={`${inputClass} pl-9 pr-10`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((s) => ({ ...s, current: !s.current }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-label={
                        showPassword.current ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className={labelClass}>
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="newPassword"
                      type={showPassword.next ? "text" : "password"}
                      value={passwordForm.next}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, next: e.target.value }))
                      }
                      className={`${inputClass} pl-9 pr-10`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((s) => ({ ...s, next: !s.next }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-label={
                        showPassword.next ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword.next ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className={labelClass}>
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirmPassword"
                      type={showPassword.confirm ? "text" : "password"}
                      value={passwordForm.confirm}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, confirm: e.target.value }))
                      }
                      className={`${inputClass} pl-9 pr-10`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((s) => ({ ...s, confirm: !s.confirm }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-label={
                        showPassword.confirm ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {passwordError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
              {passwordMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{passwordMessage}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Update password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Two Factor Authentication */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`rounded-lg p-2 ${
                  twoFactorEnabled
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Two-factor authentication
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      twoFactorEnabled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {twoFactorEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="mt-0.5 max-w-md text-xs text-slate-500">
                  Add a second verification step at sign-in using an authenticator
                  app for stronger account protection.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={twoFactorEnabled}
              onClick={() => setTwoFactorEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                twoFactorEnabled ? "bg-brand-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  twoFactorEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Active Sessions */}
          <div className="rounded-xl border border-slate-200 p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Active sessions
                </p>
                <p className="text-xs text-slate-500">
                  Devices currently signed in to your PreGene-AI account.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                onClick={handleLogoutAllDevices}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out all devices
              </Button>
            </div>

            {sessions.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                No other active sessions.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {sessions.map((s) => {
                  const Icon = sessionIconFor(s.kind);
                  return (
                    <li
                      key={s.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">
                              {s.device}
                            </p>
                            {s.current && (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                This device
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {s.browser} · {s.location}
                          </p>
                          <p className="text-xs text-slate-400">
                            {s.lastActive}
                          </p>
                        </div>
                      </div>
                      {!s.current && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => revokeSession(s.id)}
                          className="sm:self-center"
                        >
                          Revoke
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section
        aria-labelledby="settings-appearance-heading"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h3
              id="settings-appearance-heading"
              className="text-lg font-semibold text-slate-900"
            >
              Appearance
            </h3>
            <p className="text-sm text-slate-500">
              Choose how PreGene-AI looks on your device.
            </p>
          </div>
        </div>

        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Theme preference"
        >
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = themeChoice === opt.value;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={active}
                key={opt.value}
                onClick={() => setThemeChoice(opt.value)}
                className={`group flex h-full flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                  active
                    ? "border-brand-200 bg-brand-50/60 ring-1 ring-brand-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                      active
                        ? "bg-brand-100 text-brand-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                      active
                        ? "border-brand-500 bg-brand-500"
                        : "border-slate-300 bg-white"
                    }`}
                    aria-hidden
                  >
                    {active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Currently applied: <span className="font-medium text-slate-600">{theme === "dark" ? "Dark" : "Light"}</span>
          {themeChoice === "system" ? " (via system preference)" : ""}
        </p>
      </section>

      {/* Data & Privacy */}
      <section
        aria-labelledby="settings-data-heading"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h3
              id="settings-data-heading"
              className="text-lg font-semibold text-slate-900"
            >
              Data &amp; Privacy
            </h3>
            <p className="text-sm text-slate-500">
              Export your analysis history as a JSON file.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Export analysis history
              </p>
              <p className="text-xs text-slate-500">
                Downloads all recorded analyses as a JSON file.
              </p>
            </div>
            <Button type="button" onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>

          {exportError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}
          {exportMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{exportMessage}</span>
            </div>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section
        aria-labelledby="settings-danger-heading"
        className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-3 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3
              id="settings-danger-heading"
              className="text-lg font-semibold text-slate-900"
            >
              Danger Zone
            </h3>
            <p className="text-sm text-slate-500">
              Clear your local session and sign out of this device.
            </p>
          </div>
        </div>

        {!isClearConfirmOpen ? (
          <Button
            type="button"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setIsClearConfirmOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear local session data
          </Button>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              This will sign you out and remove your locally saved session on
              this device. Are you sure?
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleClearSession}
              >
                Yes, clear and sign out
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsClearConfirmOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}