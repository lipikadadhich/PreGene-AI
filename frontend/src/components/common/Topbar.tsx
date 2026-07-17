import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import NotificationDropdown from "@/components/common/NotificationDropdown";

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // FIX: the Account button previously had no onClick handler at all — it
  // was static markup with a chevron icon implying a dropdown that was
  // never built. This adds real open/close state, closes on outside
  // click (same pattern as NotificationDropdown), and wires up real
  // navigation + logout instead of doing nothing.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleProfileClick() {
    setIsAccountOpen(false);
    navigate("/profile");
  }

  function handleSettingsClick() {
    setIsAccountOpen(false);
    navigate("/settings");
  }

  function handleLogoutClick() {
    setIsAccountOpen(false);
    logout();
    navigate("/login");
  }

  const initial = user?.name?.trim()?.[0]?.toUpperCase() || "U";
  const displayName = user?.name || "Account";

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center gap-4 border-b border-ink-900/[0.06] bg-white/80 px-6 backdrop-blur-md">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex items-center justify-center rounded-lg p-2 text-ink-700 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
        <input
          type="search"
          placeholder="Search patients, reports, analyses..."
          className="h-11 w-full rounded-full border border-ink-900/10 bg-muted pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 hover:bg-ink-900/[0.03]"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </button>

        <NotificationDropdown />

        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => setIsAccountOpen((prev) => !prev)}
            className="ml-1 flex items-center gap-2 rounded-full border border-ink-900/10 py-1.5 pl-1.5 pr-3 hover:bg-ink-900/[0.03]"
            aria-haspopup="menu"
            aria-expanded={isAccountOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
              {initial}
            </span>
            <span className="hidden text-sm font-medium text-ink-900 sm:inline">
              {displayName}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-ink-500 transition-transform ${
                isAccountOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isAccountOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-white py-1.5 shadow-xl">
              {user?.email && (
                <div className="border-b border-ink-900/[0.05] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {user.email}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleProfileClick}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-900/[0.03]"
              >
                <User className="h-4 w-4" />
                Profile
              </button>

              <button
                type="button"
                onClick={handleSettingsClick}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-900/[0.03]"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>

              <div className="my-1 border-t border-ink-900/[0.05]" />

              <button
                type="button"
                onClick={handleLogoutClick}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}