import { useMemo } from "react";

interface DnaLoaderProps {
  /** Text shown below the animation, e.g. "Analyzing genetic risk..." */
  label?: string;
  /** Compact mode for smaller inline spots (cards, buttons, table rows) */
  compact?: boolean;
}

const BASE_LETTERS = ["A", "C", "G", "T"];

/**
 * Reusable DNA-themed loading visual. Drop this in anywhere a result is
 * being generated (analysis pipeline, report generation, search, etc.)
 * instead of a plain spinner. Pure CSS/SVG — no extra dependencies.
 */
export default function DnaLoader({ label, compact = false }: DnaLoaderProps) {
  // 12 rungs give a smooth double-helix twist without being too dense
  const rungs = useMemo(() => Array.from({ length: 12 }), []);
  const letters = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => BASE_LETTERS[i % BASE_LETTERS.length]),
    []
  );

  const helixHeight = compact ? 72 : 128;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        compact ? "py-3" : "py-8"
      }`}
    >
      <style>{`
        @keyframes dna-rung-twist {
          0%, 100% { transform: scaleX(1); opacity: 1; }
          50% { transform: scaleX(-1); opacity: 0.55; }
        }
        @keyframes dna-letters-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes dna-chromosome-pulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>

      {/* Double helix */}
      <div
        className="relative flex flex-col items-center justify-between"
        style={{ height: helixHeight, width: compact ? 40 : 56 }}
        role="status"
        aria-label={label ?? "Loading"}
      >
        {rungs.map((_, i) => {
          const delay = (i * 0.09).toFixed(2);
          const isEmerald = i % 2 === 0;
          return (
            <div
              key={i}
              className="flex w-full items-center justify-between"
              style={{
                animation: `dna-rung-twist 1.8s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            >
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  isEmerald ? "bg-brand-500" : "bg-brand-300"
                }`}
              />
              <span
                className={`mx-1 h-px flex-1 ${
                  isEmerald ? "bg-brand-300" : "bg-brand-200"
                }`}
              />
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  isEmerald ? "bg-brand-300" : "bg-brand-500"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Scrolling gene sequence letters */}
      <div
        className={`relative overflow-hidden ${compact ? "w-40" : "w-64"}`}
        aria-hidden="true"
      >
        <div
          className="flex gap-3 whitespace-nowrap font-mono text-xs font-semibold text-brand-400"
          style={{
            animation: "dna-letters-scroll 6s linear infinite",
            width: "200%",
          }}
        >
          {[...letters, ...letters].map((letter, i) => (
            <span key={i}>{letter}</span>
          ))}
        </div>
        {/* fade edges so letters don't hard-cut at the container edge */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
      </div>

      {/* Chromosome pulse dots */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-brand-500"
            style={{
              animation: "dna-chromosome-pulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {label && (
        <p
          className={`text-center font-medium text-slate-500 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {label}
        </p>
      )}
    </div>
  );
}