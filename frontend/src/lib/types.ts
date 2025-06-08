// Shared types for the application
export interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id: string;
}

export interface DicomMetadata {
  patient_id?: string;
  patient_name?: string;
  patient_birth_date?: string;
  patient_sex?: string;
  study_date?: string;
  study_time?: string;
  study_description?: string;
  series_description?: string;
  modality?: string;
  manufacturer?: string;
  manufacturer_model_name?: string;
  rows?: number;
  columns?: number;
  pixel_spacing?: number[];
  bits_allocated?: number;
  bits_stored?: number;
  photometric_interpretation?: string;
  acquisition_date?: string;
  acquisition_time?: string;
  institution_name?: string;
  referring_physician_name?: string;
}

export interface ImageInfo {
  original_shape: number[];
  converted_format: string;
  converted_size: number[];
  original_dtype: string;
  pixel_array_min: number;
  pixel_array_max: number;
  photometric_interpretation?: string;
  transfer_syntax?: string;
}

export interface DicomDetectionResponse {
  predictions: Detection[];
  metadata: DicomMetadata;
  image_info: ImageInfo;
}

export interface DicomDetectionResult extends DicomDetectionResponse {
  fileId: string;
  fileName: string;
}

// Type for the converted DICOM data
export interface ConvertedDicomData {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  originalFile: File;
  fileName: string;
  fileSize: number;
}

// Types for individual file detection states
export interface FileDetectionState {
  fileId: string;
  fileName: string;
  status: "pending" | "loading" | "success" | "error";
  result?: DicomDetectionResult;
  error?: Error;
}

export interface DetectionProgress {
  files: FileDetectionState[];
  isAllComplete: boolean;
  hasAnyResults: boolean;
  hasAnyErrors: boolean;
}

// Diagnostic Report Types
export interface DiagnosticReport {
  report: string;
  summary: string;
  recommendations: string[];
  severity_level: "low" | "moderate" | "high";
  generated_at: string;
}

export type DiagnosticReportRequest = DicomDetectionResponse;

export interface DiagnosticReportResponse {
  diagnostic_report: DiagnosticReport;
  detections_used: Detection[];
  metadata?: DicomMetadata;
}
