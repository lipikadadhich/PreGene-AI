import { NavLink } from "react-router-dom";
import { Sparkles, LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_NAV_ITEMS } from "@/data/content";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout?: () => void;
}

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-ink-900/[0.06] bg-white transition-[width] duration-200 lg:flex",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-20 items-center gap-2.5 px-6 text-lg font-bold text-ink-900",
          isCollapsed && "justify-center px-0"
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
          <Sparkles className="h-5 w-5" strokeWidth={2.25} />
        </span>
        {!isCollapsed && (
          <span>
            PreGene<span className="text-brand-500">-AI</span>
          </span>
        )}
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-2"
        aria-label="App navigation"
      >
        {SIDEBAR_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors",
                isCollapsed && "justify-center px-0",
                isActive
                  ? "bg-brand-50 text-brand-600"
                  : "text-ink-500 hover:bg-ink-900/[0.03] hover:text-ink-900"
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-ink-900/[0.06] p-4">
        <button
          type="button"
          onClick={onLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {!isCollapsed && "Logout"}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-300 transition-colors hover:bg-ink-900/[0.03] hover:text-ink-700",
            isCollapsed && "justify-center px-0"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-[18px] w-[18px] shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-[18px] w-[18px] shrink-0" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
