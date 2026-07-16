import { Search, ChevronDown, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import NotificationDropdown from "@/components/common/NotificationDropdown";

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

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

        <button
          type="button"
          className="ml-1 flex items-center gap-2 rounded-full border border-ink-900/10 py-1.5 pl-1.5 pr-3 hover:bg-ink-900/[0.03]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
            U
          </span>
          <span className="hidden text-sm font-medium text-ink-900 sm:inline">
            Account
          </span>
          <ChevronDown className="h-4 w-4 text-ink-500" />
        </button>
      </div>
    </header>
  );
}