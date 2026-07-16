import { Dna } from "lucide-react";
import { FOOTER_COLUMNS, FOOTER_LEGAL_LINKS, FOOTER_DISCLAIMER } from "@/data/content";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="container grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <a href="#top" className="flex items-center gap-2.5 text-lg font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Dna className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
            </span>
            PreGene-AI
          </a>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
            AI-powered prenatal genetic intelligence for a healthier generation.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h3 className="text-sm font-semibold text-white">{column.heading}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/50 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/40 sm:flex-row">
          <p>{FOOTER_DISCLAIMER}</p>
          <div className="flex gap-6">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-white/70">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
