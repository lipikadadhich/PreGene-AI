import { useEffect, useState } from "react";
import { BrainCircuit, Award, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import PageHeader from "@/components/common/PageHeader";
import { API_URL } from "@/services/api";

interface ModelMetric {
  accuracy: number;
  weighted_f1: number;
}

interface MetricsResponse {
  logistic_regression?: { accuracy: number; weighted_f1: number; classification_report: unknown };
  random_forest?: { accuracy: number; weighted_f1: number; classification_report: unknown };
  neural_network?: { accuracy: number; weighted_f1: number; classification_report: unknown };
  comparison: {
    logistic_regression: ModelMetric;
    random_forest: ModelMetric;
    neural_network: ModelMetric;
    best_model: string;
  };
}

interface EpochHistory {
  epochs: number[];
  train_loss: number[];
  val_loss: number[];
  train_accuracy: number[];
  val_accuracy: number[];
}

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  logistic_regression: "Logistic Regression",
  random_forest: "Random Forest",
  neural_network: "Neural Network",
};

export default function ModelInsightsPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [epochHistory, setEpochHistory] = useState<EpochHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInsights() {
      try {
        const [metricsRes, epochRes] = await Promise.all([
          fetch(`${API_URL}/ml-insights/metrics`),
          fetch(`${API_URL}/ml-insights/epoch-history`),
        ]);

        if (!metricsRes.ok || !epochRes.ok) {
          throw new Error("Failed to load model insights");
        }

        setMetrics(await metricsRes.json());
        setEpochHistory(await epochRes.json());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load model insights"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadInsights();
  }, []);

  // Reshape epoch arrays into recharts' expected [{epoch, train_loss, val_loss, ...}] format
  const chartData =
    epochHistory?.epochs.map((epoch, i) => ({
      epoch,
      train_loss: Number(epochHistory.train_loss[i].toFixed(4)),
      val_loss: Number(epochHistory.val_loss[i].toFixed(4)),
      train_accuracy: Number((epochHistory.train_accuracy[i] * 100).toFixed(2)),
      val_accuracy: Number((epochHistory.val_accuracy[i] * 100).toFixed(2)),
    })) ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Model Insights"
        description="Real training evidence for PreGene-AI's risk prediction model — not a black box."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Model Insights" },
        ]}
      />

      {isLoading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <p className="text-slate-500">Loading training data...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {metrics && (
        <>
          {/* Model comparison table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Model Comparison
                </h2>
                <p className="text-sm text-slate-500">
                  Three models trained and evaluated on the same held-out
                  test set.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-4 font-medium">Model</th>
                    <th className="py-2.5 pr-4 font-medium">Accuracy</th>
                    <th className="py-2.5 pr-4 font-medium">Weighted F1</th>
                    <th className="py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metrics.comparison)
                    .filter(([key]) => key !== "best_model")
                    .map(([key, value]) => {
                      const m = value as ModelMetric;
                      const isBest = key === metrics.comparison.best_model;
                      return (
                        <tr key={key} className="border-b border-slate-100">
                          <td className="py-3 pr-4 font-medium text-slate-900">
                            {MODEL_DISPLAY_NAMES[key] || key}
                          </td>
                          <td className="py-3 pr-4 text-slate-700">
                            {(m.accuracy * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 pr-4 text-slate-700">
                            {(m.weighted_f1 * 100).toFixed(1)}%
                          </td>
                          <td className="py-3">
                            {isBest ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                <Award className="h-3 w-3" />
                                In production
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Benchmark only
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive epoch training curves */}
          {chartData.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Neural Network Training — {chartData.length} Epochs
                  </h2>
                  <p className="text-sm text-slate-500">
                    Loss and accuracy per epoch, on both training and
                    held-out validation data.
                  </p>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700">
                    Loss per Epoch
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="epoch" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="train_loss"
                        name="Train Loss"
                        stroke="#0f7a5c"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="val_loss"
                        name="Validation Loss"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700">
                    Accuracy per Epoch
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="epoch" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        domain={[0, 100]}
                        unit="%"
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="train_accuracy"
                        name="Train Accuracy"
                        stroke="#0f7a5c"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="val_accuracy"
                        name="Validation Accuracy"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Confusion matrix */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Confusion Matrix — {MODEL_DISPLAY_NAMES[metrics.comparison.best_model]}
                </h2>
                <p className="text-sm text-slate-500">
                  Predicted vs. actual risk level on the held-out test set.
                </p>
              </div>
            </div>
            <img
              src={`${API_URL}/ml-insights/confusion-matrix`}
              alt="Confusion matrix"
              className="mx-auto max-w-full rounded-xl border border-slate-100"
            />
          </div>
        </>
      )}
    </div>
  );
}