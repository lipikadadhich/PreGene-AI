interface RiskMeterProps {
  risk?: number;
}

function riskTone(risk: number) {
  if (risk >= 70) {
    return { bar: "bg-rose-500", text: "text-rose-600", note: "High hereditary risk detected." };
  }
  if (risk >= 40) {
    return { bar: "bg-amber-500", text: "text-amber-600", note: "Medium hereditary risk detected." };
  }
  return { bar: "bg-emerald-500", text: "text-emerald-600", note: "Low hereditary risk detected." };
}

export default function RiskMeter({ risk = 65 }: RiskMeterProps) {
  const tone = riskTone(risk);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h3 className="text-lg font-semibold text-slate-900">AI Risk Assessment</h3>

      <div className="mt-6">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Risk Score</span>
          <span className={`font-semibold ${tone.text}`}>{risk}%</span>
        </div>

        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
            style={{ width: `${Math.max(0, Math.min(100, risk))}%` }}
          />
        </div>

        <p className="mt-4 text-sm text-slate-500">{tone.note}</p>
      </div>
    </div>
  );
}
