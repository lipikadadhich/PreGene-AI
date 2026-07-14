import { useState } from "react";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { getAnalysisHistory } from "@/services/api";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  async function handleExport() {
    setExportMessage(null);
    setExportError(null);
    setIsExporting(true);
    try {
      const history = await getAnalysisHistory();

      if (!history.length) {
        setExportError("No analysis history available to export yet.");
        return;
      }

      const blob = new Blob([JSON.stringify(history, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pregene-analysis-history-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage(`Exported ${history.length} record(s) successfully.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to export data right now.";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  }

  function handleClearSession() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your workspace, appearance, and data preferences."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
      />

      {/* Appearance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Appearance</h3>
            <p className="text-sm text-slate-500">
              Choose how PreGene-AI looks on your device.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            {isDark ? (
              <Sun className="h-5 w-5 text-brand-600" />
            ) : (
              <Moon className="h-5 w-5 text-brand-600" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-900">
                {isDark ? "Dark mode" : "Light mode"}
              </p>
              <p className="text-xs text-slate-500">
                Currently using {isDark ? "dark" : "light"} appearance.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={toggleTheme}>
            Switch to {isDark ? "light" : "dark"}
          </Button>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Data &amp; Privacy</h3>
            <p className="text-sm text-slate-500">
              Export your analysis history as a JSON file.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Export analysis history
              </p>
              <p className="text-xs text-slate-500">
                Downloads all recorded analyses as a JSON file.
              </p>
            </div>
            <Button type="button" onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>

          {exportError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}
          {exportMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{exportMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-3 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Danger Zone</h3>
            <p className="text-sm text-slate-500">
              Clear your local session and sign out of this device.
            </p>
          </div>
        </div>

        {!isClearConfirmOpen ? (
          <Button
            type="button"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setIsClearConfirmOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear local session data
          </Button>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              This will sign you out and remove your locally saved session on this device. Are you sure?
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleClearSession}
              >
                Yes, clear and sign out
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsClearConfirmOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}