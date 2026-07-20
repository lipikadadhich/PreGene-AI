import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileCheck2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Dna,
  ArrowRight,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  uploadDnaFile,
  isUploadError,
  type UploadResult,
} from "@/services/api";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type SampleOwner = "father" | "mother";

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Who the detected VCF genotype belongs to. A single VCF only ever
  // represents one individual, so we ask rather than guess — this
  // stays null until the user picks one, and the "Continue" button is
  // disabled until they do.
  const [sampleOwner, setSampleOwner] = useState<SampleOwner | null>(null);

  function handleBrowseClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setNetworkError(null);
    setResult(null);
    setSampleOwner(null);

    try {
      const response = await uploadDnaFile(file);
      setResult(response);
    } catch {
      setNetworkError(
        "Could not reach the server to upload this file. Please try again."
      );
    } finally {
      setIsUploading(false);
      // reset so selecting the same file again still fires onChange
      e.target.value = "";
    }
  }

  function handleUploadAnother() {
    setResult(null);
    setNetworkError(null);
    setSampleOwner(null);
    fileInputRef.current?.click();
  }

  function handleContinueToAnalysis() {
    if (!result || isUploadError(result) || !result.extracted_data || !sampleOwner) {
      return;
    }

    const { extracted_data } = result;

    const genotypeField =
      sampleOwner === "father" ? "father_genotype" : "mother_genotype";
    const carrierField =
      sampleOwner === "father" ? "father_carrier" : "mother_carrier";

    const isCarrierOrAffected =
      extracted_data.zygosity === "heterozygous" ||
      extracted_data.zygosity === "homozygous_alt";

    navigate("/analysis", {
      state: {
        prefill: {
          disease: extracted_data.disease ?? "",
          inheritance: extracted_data.inheritance ?? undefined,
          [genotypeField]: extracted_data.genotype_notation ?? undefined,
          [carrierField]: isCarrierOrAffected,
        },
      },
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Upload DNA"
        description="Upload embryo imaging and genetic sequencing files for analysis."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Upload DNA" }]}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".fasta,.fa,.fastq,.fq,.vcf,.csv,.txt,.zip"
        className="hidden"
        onChange={handleFileSelected}
      />

      {isUploading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-ink-900/15 bg-white">
          <p className="flex items-center gap-2 text-sm text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Uploading and validating file...
          </p>
        </div>
      ) : networkError ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>{networkError}</span>
            </div>
            <Button size="sm" onClick={handleUploadAnother}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : result && isUploadError(result) ? (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Upload Failed</CardTitle>
                <CardDescription>{result.file_name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">{result.error}</p>
                {result.detail && (
                  <p className="mt-1 text-sm text-red-600">{result.detail}</p>
                )}
              </div>
            </div>
            <Button size="sm" onClick={handleUploadAnother}>
              Try Another File
            </Button>
          </CardContent>
        </Card>
      ) : result ? (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <FileCheck2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>{result.file_name}</CardTitle>
                <CardDescription>
                  {result.validation_status === "valid"
                    ? "File validated successfully."
                    : "File uploaded with warnings."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  File Size
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink-900">
                  {formatFileSize(result.file_size_bytes)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  File Type
                </dt>
                <dd className="mt-1 text-sm font-medium uppercase text-ink-900">
                  {result.file_type}
                </dd>
              </div>
              {result.sequence_length != null && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                    Sequence Length
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink-900">
                    {result.sequence_length.toLocaleString()} bp
                  </dd>
                </div>
              )}
              {result.quality_score != null && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                    Quality Score
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink-900">
                    {result.quality_score.toFixed(1)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  Processing Status
                </dt>
                <dd className="mt-1 text-sm font-medium capitalize text-ink-900">
                  {result.processing_status}
                </dd>
              </div>
            </dl>

            {result.validation_status === "warning" && result.validation_message && (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span>{result.validation_message}</span>
              </div>
            )}

            {result.validation_status === "valid" && (
              <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span>Ready for analysis.</span>
              </div>
            )}

            {result.extracted_data?.matched ? (
              <div className="space-y-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
                <div className="flex items-start gap-2.5 text-brand-700">
                  <Dna className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">
                      Genetic data detected
                    </p>
                    <p className="mt-1 text-sm text-brand-700/90">
                      {result.extracted_data.note}
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {result.extracted_data.gene && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                        Gene
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-ink-900">
                        {result.extracted_data.gene}
                      </dd>
                    </div>
                  )}
                  {result.extracted_data.genotype_notation && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                        Genotype
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-ink-900">
                        {result.extracted_data.genotype_notation}
                      </dd>
                    </div>
                  )}
                  {result.extracted_data.disease && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                        Matched Disease
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-ink-900">
                        {result.extracted_data.disease}
                      </dd>
                    </div>
                  )}
                </dl>

                <div>
                  <p className="mb-2 text-sm font-medium text-ink-900">
                    Whose sample is this?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={sampleOwner === "father" ? "primary" : "outline"}
                      onClick={() => setSampleOwner("father")}
                    >
                      Father
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={sampleOwner === "mother" ? "primary" : "outline"}
                      onClick={() => setSampleOwner("mother")}
                    >
                      Mother
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-ink-400">
                    A single DNA file reflects one person's genotype, so
                    we need to know whose sample this is before
                    pre-filling the risk assessment form. You can still
                    edit every field on the next screen.
                  </p>
                </div>

                <Button
                  size="sm"
                  disabled={!sampleOwner}
                  onClick={handleContinueToAnalysis}
                  className="w-full sm:w-auto"
                >
                  Continue to AI Risk Assessment
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
                <Info className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm">
                  {result.extracted_data?.note ??
                    "This file has been securely stored and validated."}{" "}
                  Use{" "}
                  <a href="/analysis" className="font-medium text-brand-600 hover:underline">
                    AI Risk Assessment
                  </a>{" "}
                  to run an analysis with manually entered patient details.
                </p>
              </div>
            )}

            <Button size="sm" variant="outline" onClick={handleUploadAnother}>
              Upload Another File
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Upload}
          title="No uploads yet"
          description="Drag and drop sequencing (.vcf, .fasta, .fastq) or data (.csv, .txt, .zip) files here, or browse to select files from your device."
          actionLabel="Browse Files"
          onAction={handleBrowseClick}
        />
      )}
    </div>
  );
}