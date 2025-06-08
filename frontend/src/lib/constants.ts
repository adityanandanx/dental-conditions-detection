// Application constants
export const FILE_SIZE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10 MB
} as const;

export const SUPPORTED_DICOM_EXTENSIONS = {
  "application/dicom": [".dcm", ".rvg"],
} as const;

// Utility function for consistent file size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
// Color palette for different detection classes
export const DETECTION_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
];

export function getDetectionColor(classId: number): string {
  return DETECTION_COLORS[classId % DETECTION_COLORS.length];
}
