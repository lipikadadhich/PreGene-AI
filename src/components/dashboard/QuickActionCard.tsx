import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { QuickActionData } from "@/types";

interface QuickActionCardProps {
  action: QuickActionData;
}

export default function QuickActionCard({ action }: QuickActionCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18, ease: "easeOut" }}>
      <Link
        to={action.href}
        className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] transition-colors duration-200 hover:border-slate-300 hover:shadow-md"
      >
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              action.accentClass
            )}
          >
            <action.icon className="h-5 w-5" />
          </span>
          <ArrowUpRight className="h-4 w-4 text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-600" />
        </div>
        <p className="mt-5 text-base font-semibold text-slate-900">{action.title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {action.description}
        </p>
      </Link>
    </motion.div>
  );
}
