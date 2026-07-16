const API_URL = "https://pregene-ai-1.onrender.com";

// ==============================
// Disease Search
// ==============================
export async function searchDisease(query: string) {
  const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error("Failed to search diseases");
  }

  return response.json();
}

// ==============================
// Disease List
// ==============================
export interface DiseaseListResponse {
  count: number;
  diseases: string[];
}

export async function getDiseaseList(): Promise<DiseaseListResponse> {
  const response = await fetch(`${API_URL}/diseases`);

  if (!response.ok) {
    throw new Error("Failed to load disease list");
  }

  return response.json();
}

// ==============================
// Disease Detail
// ==============================
export interface DiseaseDetailResponse {
  found: boolean;
  message?: string;
  Disease?: string;
  Gene?: string;
  Gene_Name?: string;
  Age_Of_Onset?: string;
  Inheritance_Type?: string;
}

export async function getDiseaseDetail(
  diseaseName: string
): Promise<DiseaseDetailResponse> {
  const response = await fetch(
    `${API_URL}/disease/${encodeURIComponent(diseaseName)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch disease details");
  }

  return response.json();
}

// ==============================
// Dataset Statistics
// ==============================
export interface DatasetStatsResponse {
  total_diseases: number;
  total_genes: number;
  total_records: number;
  columns: string[];
}

export async function getDatasetStats(): Promise<DatasetStatsResponse> {
  const response = await fetch(`${API_URL}/stats`);

  if (!response.ok) {
    throw new Error("Failed to fetch dataset statistics");
  }

  return response.json();
}

// ==============================
// Health Check
// ==============================
export interface HealthResponse {
  status: string;
}

export async function getHealthStatus(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend unavailable");
  }

  return response.json();
}

// ==============================
// AI Prediction (legacy synchronous call)
// ==============================
export async function predictDisease(data: unknown) {
  const response = await fetch(`${API_URL}/predict/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Prediction failed");
  }

  return response.json();
}

// ==============================
// AI Prediction (staged job + polling)
// ==============================
export type PipelineStageStatus = "pending" | "running" | "complete" | "error";

export type PipelineStage =
  | "validate_input"
  | "inheritance"
  | "risk_prediction"
  | "crispr_recommendation"
  | "counselling"
  | "report_generation";

export type EvidenceTier =
  | "FDA_APPROVED"
  | "CLINICAL_TRIAL"
  | "STRONG_PRECLINICAL"
  | "EXPERIMENTAL"
  | "THEORETICAL_CANDIDATE"
  | "NO_KNOWN_STRATEGY";

export interface PredictionRecommendation {
  gene: string;
  mutation: string;
  editing_method: string;
  success_rate: number;
  clinical_status?: string;
  evidence?: string;
  reference?: string;
  confidence?: number;
  disease_category?: string;
  inheritance_type?: string;
  ai_reasoning?: string;

  // Evidence-tier system fields (backend: evidence_tiers.py)
  available?: boolean;
  message?: string | null;
  evidence_tier?: EvidenceTier;
  sources?: string[];
  explanation?: string | null;
}

export interface PredictionInheritance {
  Healthy: number;
  Carrier: number;
  Affected: number;
}

export interface PredictionJobResult {
  risk_score: number;
  risk_level: string;
  confidence?: number;
  disease_category?: string;
  evidence_level?: string;
  clinical_status?: string;
  reference?: string;
  recommendation: PredictionRecommendation;
  inheritance: PredictionInheritance;
  counselling: string[];
  pdf?: string;
  generated_on?: string;
  report_id?: string;
}

export interface PredictionJobStatus {
  job_id: string;
  overall_status: PipelineStageStatus;
  stages: Record<PipelineStage, PipelineStageStatus>;
  current_stage: PipelineStage | null;
  result: PredictionJobResult | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface StartPredictionResponse {
  job_id: string;
}

export async function startPrediction(
  data: unknown
): Promise<StartPredictionResponse> {
  const response = await fetch(`${API_URL}/predict/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to start prediction");
  }

  return response.json();
}

export async function getPredictionStatus(
  jobId: string
): Promise<PredictionJobStatus> {
  const response = await fetch(`${API_URL}/predict/status/${jobId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch prediction status");
  }

  return response.json();
}

// ==============================
// Report History
// ==============================
export interface ReportPatientInfo {
  disease: string;
  inheritance: string;
  father_carrier: boolean;
  mother_carrier: boolean;
  family_history: boolean;
  consanguinity: boolean;
  father_genotype: string;
  mother_genotype: string;
}

export interface ReportListItem {
  report_id: string;
  disease: string;
  risk_score: number;
  risk_level: string;
  timestamp: string;
  pdf_path?: string;
}

export interface ReportDetail extends ReportListItem {
  patient: ReportPatientInfo;
  recommendation: PredictionRecommendation;
  inheritance: PredictionInheritance;
  counselling: string[];
}

export interface ReportListResponse {
  reports: ReportListItem[];
}

export async function getReportList(): Promise<ReportListResponse> {
  const response = await fetch(`${API_URL}/report/list`);

  if (!response.ok) {
    throw new Error("Failed to load report history");
  }

  return response.json();
}

export async function getReportDetail(
  reportId: string
): Promise<ReportDetail> {
  const response = await fetch(
    `${API_URL}/report/${encodeURIComponent(reportId)}`
  );

  if (!response.ok) {
    throw new Error("Failed to load report details");
  }

  return response.json();
}

export async function downloadReportById(reportId: string): Promise<Blob> {
  const response = await fetch(
    `${API_URL}/report/${encodeURIComponent(reportId)}/download`
  );

  if (!response.ok) {
    throw new Error("Failed to download report");
  }

  return response.blob();
}

export async function deleteReport(
  reportId: string
): Promise<{ deleted: boolean; report_id: string }> {
  const response = await fetch(
    `${API_URL}/report/${encodeURIComponent(reportId)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error("Failed to delete report");
  }

  return response.json();
}

// ==============================
// Latest Report (legacy, single-file)
// ==============================
export async function getLatestReportBlob(): Promise<Blob> {
  const response = await fetch(`${API_URL}/report/download`);

  if (!response.ok) {
    throw new Error("No report available yet");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("pdf")) {
    throw new Error("No report available yet");
  }

  return response.blob();
}

// ==============================
// Analysis History
// ==============================
export interface AnalysisHistoryRecord {
  disease: string;
  risk_score: number;
  risk_level: string;
  timestamp: string;
}

export async function getAnalysisHistory(): Promise<AnalysisHistoryRecord[]> {
  const response = await fetch(`${API_URL}/analysis-history/`);

  if (!response.ok) {
    throw new Error("Failed to load analysis history");
  }

  return response.json();
}

// ==============================
// DNA File Upload
// ==============================
export interface UploadSuccessResponse {
  file_name: string;
  file_size_bytes: number;
  file_type: string;
  validation_status: "valid" | "invalid" | "warning";
  validation_message?: string | null;
  sequence_length?: number | null;
  quality_score?: number | null;
  processing_status: string;
}

export interface UploadErrorResponse {
  file_name: string;
  error: string;
  detail?: string | null;
}

export type UploadResult = UploadSuccessResponse | UploadErrorResponse;

// Type guard so the UI can branch cleanly between success and error shapes
export function isUploadError(
  result: UploadResult
): result is UploadErrorResponse {
  return "error" in result;
}

export async function uploadDnaFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload/`, {
    method: "POST",
    body: formData,
  });

  // Note: unlike other endpoints here, /upload/ returns 200 with an
  // error-shaped JSON body on validation failure (not a non-200 status),
  // so we don't throw on !response.ok for the validation case — only
  // for genuine network/server failures.
  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
}

// ==============================
// Notifications
// ==============================
export type NotificationType =
  | "dna_uploaded"
  | "dna_upload_failed"
  | "analysis_started"
  | "analysis_completed"
  | "analysis_failed"
  | "report_generated"
  | "report_downloaded";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unread_count: number;
}

export async function getNotifications(): Promise<NotificationListResponse> {
  const response = await fetch(`${API_URL}/notifications/list`);

  if (!response.ok) {
    throw new Error("Failed to load notifications");
  }

  return response.json();
}

export async function markNotificationRead(
  notificationId: string
): Promise<NotificationItem> {
  const response = await fetch(
    `${API_URL}/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }

  return response.json();
}

export async function markAllNotificationsRead(): Promise<{ marked_read: number }> {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to mark all notifications as read");
  }

  return response.json();
}

export async function deleteNotification(
  notificationId: string
): Promise<{ deleted: boolean; id: string }> {
  const response = await fetch(
    `${API_URL}/notifications/${encodeURIComponent(notificationId)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error("Failed to delete notification");
  }

  return response.json();
}