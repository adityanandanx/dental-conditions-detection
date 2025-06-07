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
