import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Dna, ArrowRight, CheckCircle2, Scissors, Search, Loader2 } from "lucide-react";
import DnaHelix from "./DnaHelix";
import { HERO_STATS } from "@/data/content";
import { useDiseaseSearch } from "@/hooks/useDiseaseSearch";
import { useAuth } from "@/hooks/useAuth";
import DiseaseAnalysisCard from "@/components/analysis/DiseaseAnalysisCard";

// ---------------------------------------------------------------------------
// NOTE ON REUSE
// SectionHeader / CardAccent / StatusBadge-style patterns used here are
// modelled directly on DiseasePredictionPage.tsx to match its design
// language, but are defined locally rather than imported, since that file
// is out of scope to modify (its subcomponents aren't currently exported as
// shared components). If a future pass extracts them into
// components/ui/*, this file should switch to importing them instead of
// duplicating the pattern.
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};

export default function Hero() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const { query, setQuery, results, loading, selectedDisease, selectDisease } =
    useDiseaseSearch();

  const floatLoop = (range: number, duration: number) =>
    prefersReducedMotion
      ? {}
      : {
          animate: { y: [0, -range, 0] },
          transition: { duration, repeat: Infinity, ease: "easeInOut" as const },
        };

  // Mirrors Header.tsx's "Get Started" logic — authenticated visitors go
  // straight into the app, everyone else lands on /login. Kept in sync
  // manually here since both live in separate landing-page components;
  // if this diverges from Header.tsx again, consider extracting to a
  // shared useSmartCta() hook.
  function handleStartAnalysis() {
    navigate(isAuthenticated ? "/dashboard" : "/login");
  }

  // TEMPORARY: there is no standalone interactive demo/walkthrough yet.
  // Routing to /login lets visitors try the real product instead of
  // hitting a dead or fake "demo" experience. Replace this handler with
  // real demo content later without changing where this button lives.
  function handleViewDemo() {
    navigate("/login");
  }

  return (
    <section id="top" className="relative overflow-hidden border-b border-slate-200 bg-slate-50">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-emerald-100/60 blur-3xl"
        aria-hidden="true"
      />

      <div className="container relative grid items-center gap-16 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="flex items-center gap-2 text-sm font-semibold tracking-wide text-blue-600"
          >
            <Dna className="h-4 w-4" aria-hidden="true" />
            PreGene-AI · Genomic Intelligence
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.1}
            variants={fadeUp}
            className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
          >
            Predict genetic disorders{" "}
            <span className="text-blue-600">before</span> birth
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.2}
            variants={fadeUp}
            className="mt-3.5 max-w-xl text-base leading-relaxed text-slate-600"
          >
            PreGene-AI analyzes parental DNA to predict inherited genetic
            disorders and recommends precision CRISPR-based interventions —
            giving every child the healthiest possible start.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.25}
            variants={fadeUp}
            className="relative mt-8 max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"
            />

            <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
              Search genetic disease
            </h3>

            <div className="relative mt-3">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="hero-disease-search" className="sr-only">
                Search genetic disease
              </label>
              <input
                id="hero-disease-search"
                type="text"
                placeholder="Type disease name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {loading && (
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Searching...
              </p>
            )}

            {!loading && results.length > 0 && (
              <div className="mt-3 max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                {results.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => selectDisease(item)}
                    className="cursor-pointer border-b border-slate-100 p-3 transition-colors last:border-b-0 hover:bg-blue-50/60"
                  >
                    <p className="text-sm font-semibold text-slate-900">{item.Disease}</p>
                    <p className="text-sm text-slate-500">{item.Gene}</p>
                  </div>
                ))}
              </div>
            )}

            <DiseaseAnalysisCard selectedDisease={selectedDisease} />
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.3}
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartAnalysis}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-100 transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Start analysis
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleViewDemo}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              View demo
            </motion.button>
          </motion.div>

          <motion.dl
            initial="hidden"
            animate="visible"
            custom={0.4}
            variants={fadeUp}
            className="mt-14 grid grid-cols-3 gap-6 border-t border-slate-200 pt-8"
          >
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-3xl font-bold tabular-nums text-slate-900">
                  {stat.value}
                </dd>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </motion.dl>
        </div>

        <div className="relative mx-auto hidden h-[460px] w-full max-w-md lg:block">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/40 blur-3xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="absolute left-1/2 top-0 h-full -translate-x-1/2"
          >
            <DnaHelix className="h-full w-auto" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="absolute left-0 top-10"
          >
            <motion.div
              {...floatLoop(6, 4.2)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Gene scan complete</p>
                <p className="text-xs text-slate-500">BRCA2 — Normal</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="absolute bottom-24 left-0 w-52"
          >
            <motion.div
              {...floatLoop(5, 3.6)}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-900">CRISPR ready</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">3 edits suggested</p>
              <div className="mt-3 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 flex-1 rounded-full bg-blue-500" />
                ))}
                <span className="h-1.5 flex-1 rounded-full bg-slate-200" />
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="absolute bottom-0 right-0"
          >
            <motion.div
              {...floatLoop(5, 5)}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <p className="text-xs font-medium text-slate-500">Risk score</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-blue-600">2.4%</p>
              <p className="text-xs text-slate-500">Hereditary risk</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}