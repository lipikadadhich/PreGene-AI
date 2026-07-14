import { Dna, Users, HeartPulse, GitBranch, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PatientFormData } from "@/types/prediction";
import DiseaseAutocomplete from "./DiseaseAutocomplete";

const INHERITANCE_OPTIONS = [
  "Autosomal Recessive",
  "Autosomal Dominant",
  "X-linked Recessive",
  "X-linked Dominant",
  "Mitochondrial",
];

interface PatientInputFormProps {
  formData: PatientFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel?: string;
}

export default function PatientInputForm({
  formData,
  onChange,
  onSubmit,
  isLoading,
  submitLabel = "Run Analysis",
}: PatientInputFormProps) {
  // DiseaseAutocomplete reports plain string values, but the rest of the
  // form drives off onChange(e: ChangeEvent<...>). This adapts one to the
  // other without touching usePrediction.ts's existing handleChange shape.
  function handleDiseaseChange(newValue: string) {
    onChange({
      target: { name: "disease", value: newValue, type: "text" },
    } as React.ChangeEvent<HTMLInputElement>);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">
            Disease
          </label>

          <DiseaseAutocomplete
            value={formData.disease}
            onChange={handleDiseaseChange}
            placeholder="e.g. Cystic Fibrosis"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">
            Inheritance Pattern
          </label>

          <select
            name="inheritance"
            value={formData.inheritance}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          >
            {INHERITANCE_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Father Genotype
          </label>

          <input
            name="father_genotype"
            value={formData.father_genotype}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Mother Genotype
          </label>

          <input
            name="mother_genotype"
            value={formData.mother_genotype}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxTile
          name="father_carrier"
          label="Father is a carrier"
          checked={formData.father_carrier}
          icon={<Users size={16} />}
          onChange={onChange}
        />

        <CheckboxTile
          name="mother_carrier"
          label="Mother is a carrier"
          checked={formData.mother_carrier}
          icon={<Users size={16} />}
          onChange={onChange}
        />

        <CheckboxTile
          name="family_history"
          label="Family History"
          checked={formData.family_history}
          icon={<HeartPulse size={16} />}
          onChange={onChange}
        />

        <CheckboxTile
          name="consanguinity"
          label="Consanguinity"
          checked={formData.consanguinity}
          icon={<GitBranch size={16} />}
          onChange={onChange}
        />
      </div>

      <Button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-fit"
      >
        <Dna className="mr-2 h-4 w-4" />
        {isLoading ? "Analyzing..." : submitLabel}
      </Button>
    </div>
  );
}

function CheckboxTile({
  name,
  label,
  icon,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />

      {icon}

      <span className="flex-1">{label}</span>

      {checked && <Check size={16} />}
    </label>
  );
}