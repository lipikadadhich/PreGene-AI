import { AlertCircle, Brain, Dna, ArrowRight } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import PatientInputForm from "@/components/analysis/PatientInputForm";
import RiskAssessmentPanel from "@/components/analysis/RiskAssessmentPanel";
import AnalysisPipeline from "@/components/analysis/AnalysisPipeline";
import { Button } from "@/components/ui/button";
import { usePrediction } from "@/hooks/usePrediction";

export default function AnalysisPage() {
  const {
    formData,
    handleChange,
    job,
    result,
    isLoading,
    error,
    runPrediction,
    prefilledFields,
    isResultReady,
    revealResult,
  } = usePrediction();

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Risk Assessment"
        description="Evaluate hereditary genetic risk using AI-assisted clinical analysis."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "AI Risk Assessment" },
        ]}
      />

      {prefilledFields.length > 0 && (
        <div className="flex gap-2 rounded-xl border border-brand-200 bg-brand-50 p-4 text-brand-700">
          <Dna className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm">
            Some fields below were pre-filled from your uploaded DNA file.
            Review them and edit anything that needs correcting before
            running the analysis.
          </span>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                <Brain className="h-5 w-5" />
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
              submitLabel="Analyze Risk"
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
          {isLoading && job ? (
            <div className="space-y-4">
              <AnalysisPipeline job={job} />

              {isResultReady && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <p className="text-sm font-medium text-emerald-700">
                    Analysis complete — your results are ready.
                  </p>
                  <Button onClick={revealResult}>
                    View Results
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          ) : result ? (
            <RiskAssessmentPanel result={result} />
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <div className="text-center">
                <Brain className="mx-auto h-12 w-12 text-brand-500" />

                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  No Analysis Yet
                </h3>

                <p className="mt-2 text-slate-500">
                  Enter patient details and click Analyze Risk.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}