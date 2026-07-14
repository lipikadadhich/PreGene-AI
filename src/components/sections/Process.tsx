import { motion } from "framer-motion";
import { PROCESS_STEPS } from "@/data/content";

export default function Process() {
  return (
    <section id="research" className="bg-slate-50 py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            The Process
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            How Genetic Risk Assessment Works
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-500">
            Follow a guided clinical workflow from disease exploration to
            AI-assisted risk assessment, genetic counselling, and
            downloadable reports.
          </p>
        </div>

        <div className="relative mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
          {/* connecting line, desktop only */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-9 hidden h-px bg-slate-200 sm:block"
            style={{ marginInline: "16.6%" }}
          />

          {PROCESS_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-blue-50">
                  <Icon className="h-7 w-7 text-blue-600" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white ring-4 ring-slate-50">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
