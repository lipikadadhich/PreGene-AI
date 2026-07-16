import { motion } from "framer-motion";
import { Dna, Target, ShieldCheck, Users } from "lucide-react";

const PILLARS = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "To make inherited genetic risk understandable and actionable before birth — combining AI-assisted analysis with real clinical reasoning, not black-box predictions.",
  },
  {
    icon: ShieldCheck,
    title: "Built for Trust",
    description:
      "Every prediction shows its evidence tier, its reasoning, and its limitations. We never present a guess as a fact.",
  },
  {
    icon: Users,
    title: "Who It's For",
    description:
      "Genetic counsellors, clinicians, and researchers who need a fast, transparent starting point for hereditary risk assessment.",
  },
];

export default function About() {
  return (
    <section id="about" className="border-t border-slate-200 bg-slate-50 py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
            <Dna className="h-4 w-4" aria-hidden="true" />
            About PreGene-AI
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Genomic intelligence, built to be understood
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-500">
            PreGene-AI is an academic research platform exploring how AI can
            support — not replace — genetic counselling. It combines
            inheritance modelling, risk prediction, and an evidence-tiered
            CRISPR recommendation engine into one clinical workflow.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-slate-400">
          PreGene-AI is developed for academic and research demonstration
          purposes. It is not a certified diagnostic tool and does not
          replace professional medical or genetic counselling advice.
        </p>
      </div>
    </section>
  );
}