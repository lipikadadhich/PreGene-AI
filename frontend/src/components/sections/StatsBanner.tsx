import { motion } from "framer-motion";
import { BANNER_STATS } from "@/data/content";

export default function StatsBanner() {
  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="container grid grid-cols-2 gap-4 py-16 sm:grid-cols-4">
        {BANNER_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <p className="text-4xl font-bold tabular-nums text-slate-900 lg:text-5xl">
              {stat.value}
            </p>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}