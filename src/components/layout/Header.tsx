import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dna, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/data/content";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const goTo = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  function handleGetStarted() {
    goTo(isAuthenticated ? "/dashboard" : "/signup");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container flex h-20 items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Dna className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </span>
          PreGene<span className="text-blue-600">-AI</span>
        </a>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-[15px] font-medium text-slate-600 transition-colors hover:text-slate-900">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" onClick={() => goTo("/login")}>
            Sign In
          </Button>
          <Button size="sm" onClick={handleGetStarted}>
            Get Started
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-slate-200 md:hidden"
          >
            <nav className="container flex flex-col gap-1 py-4" aria-label="Mobile primary">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-700 hover:bg-slate-50">
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 px-3">
                <Button variant="outline" size="sm" className="w-full" onClick={() => goTo("/login")}>
                  Sign In
                </Button>
                <Button size="sm" className="w-full" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}