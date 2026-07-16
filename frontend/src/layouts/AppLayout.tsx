import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_NAV_ITEMS } from "@/data/content";
import Sidebar from "@/components/common/Sidebar";
import Topbar from "@/components/common/Topbar";
import { useAuth } from "@/hooks/useAuth";

export default function AppLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    // Clears the local session (see AuthContext.tsx) and returns the user
    // to the public Landing Page — not /login — matching the professional
    // SaaS pattern where logging out takes you back to the marketing site,
    // not straight to a bare login form.
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-muted">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((v) => !v)}
        onLogout={handleLogout}
      />

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink-900/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="flex h-20 items-center justify-between px-6">
                <div className="flex items-center gap-2.5 text-lg font-bold text-ink-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
                    <Sparkles className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  PreGene<span className="text-brand-500">-AI</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="rounded-lg p-2 text-ink-700"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-2">
                {SIDEBAR_NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors",
                        isActive
                          ? "bg-brand-50 text-brand-600"
                          : "text-ink-500 hover:bg-ink-900/[0.03] hover:text-ink-900"
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="border-t border-ink-900/[0.06] p-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-ink-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 px-6 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}