import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import RiskMeter from "./RiskMeter";
import GeneCard from "./GeneCard";

interface Props {
  selectedDisease: any;
}

export default function DiseaseAnalysisCard({ selectedDisease }: Props) {
  if (!selectedDisease) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"
      />

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="text-xl font-bold text-slate-900">AI Genetic Analysis</h3>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Disease</p>
          <p className="mt-1 font-semibold text-slate-900">{selectedDisease.Disease}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Gene</p>
          <p className="mt-1 font-semibold text-slate-900">{selectedDisease.Gene}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Gene Name</p>
          <p className="mt-1 font-semibold text-slate-900">{selectedDisease.Gene_Name}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Inheritance</p>
          <p className="mt-1 font-semibold text-slate-900">
            {selectedDisease.Inheritance_Type}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Age Of Onset</p>
          <p className="mt-1 font-semibold text-slate-900">{selectedDisease.Age_Of_Onset}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Risk Level</p>
          <span className="mt-1 inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            Medium Risk
          </span>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-slate-900">AI Confidence</p>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-blue-600 transition-all duration-700" style={{ width: "96%" }} />
        </div>
        <p className="mt-2 text-sm text-slate-500">96% Confidence</p>
      </div>

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <h4 className="font-semibold text-blue-700">AI Recommendation</h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Based on the inheritance pattern, genetic counselling and carrier
          screening are recommended before pregnancy.
        </p>
      </div>

      <div className="mt-6">
        <RiskMeter risk={65} />
      </div>

      <div className="mt-6">
        <GeneCard selectedDisease={selectedDisease} />
      </div>
    </motion.div>
  );
}
