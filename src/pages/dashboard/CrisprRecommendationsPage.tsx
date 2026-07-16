import { AlertCircle, Scissors } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import PatientInputForm from "@/components/analysis/PatientInputForm";
import CRISPRCard from "@/components/prediction/CRISPRCard";
import { usePrediction } from "@/hooks/usePrediction";

export default function CrisprRecommendationsPage() {
  const {
    formData,
    handleChange,
    result,
    isLoading,
    error,
    runPrediction,
  } = usePrediction();

  return (
    <div className="space-y-8">
      <PageHeader
        title="CRISPR Recommendations"
        description="Suggested precision gene-editing interventions."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "CRISPR Recommendations" },
        ]}
      />

      <div className="grid gap-8 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                <Scissors className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Patient Information
                </h2>

                <p className="text-sm text-slate-500">
                  Enter the patient's genetic information.
                </p>
              </div>
            </div>

            <PatientInputForm
              formData={formData}
              onChange={handleChange}
              onSubmit={runPrediction}
              isLoading={isLoading}
              submitLabel="Get Recommendation"
            />

            {error && (
              <div className="mt-5 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-3">
          {result ? (
            <CRISPRCard recommendation={result.recommendation} />
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <div className="text-center">
                <Scissors className="mx-auto h-12 w-12 text-brand-500" />

                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  No Recommendation Yet
                </h3>

                <p className="mt-2 text-slate-500">
                  Enter patient details and click Get Recommendation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}