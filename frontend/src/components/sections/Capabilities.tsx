import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FEATURE_CARDS } from "@/data/content";

export default function Capabilities() {
  return (
    <section id="features" className="py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Platform Capabilities
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            A clinical-grade foundation for genetic risk assessment
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-500">
            Each capability is designed to support genetic risk assessment,
            inheritance analysis, and AI-assisted clinical decision support
            through an intuitive workflow.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              >
                <Card className="h-full border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                  <CardHeader>
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBgClass}`}
                    >
                      <Icon className={`h-5 w-5 ${feature.iconColorClass}`} />
                    </span>
                    <CardTitle className="pt-3 text-slate-900">{feature.title}</CardTitle>
                    <CardDescription className="text-slate-500">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
