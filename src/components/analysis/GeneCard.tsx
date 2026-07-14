interface Props {
  selectedDisease: any;
}

export default function GeneCard({ selectedDisease }: Props) {
  if (!selectedDisease) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h3 className="text-lg font-semibold text-slate-900">Gene Information</h3>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Gene Symbol
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {selectedDisease.Gene}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Full Gene Name
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {selectedDisease.Gene_Name}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Disease
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {selectedDisease.Disease}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Age Of Onset
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {selectedDisease.Age_Of_Onset}
          </p>
        </div>
      </div>
    </div>
  );
}
