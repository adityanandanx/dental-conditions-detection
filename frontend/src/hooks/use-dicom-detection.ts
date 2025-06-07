import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { ConvertedDicomData } from "@/lib/store";

// Types based on the backend models
interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id: string;
}

interface DicomMetadata {
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

interface ImageInfo {
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

interface DetectDicomFilesParams {
  files: ConvertedDicomData[];
}

const detectDicomFiles = async (
  params: DetectDicomFilesParams
): Promise<DicomDetectionResult[]> => {
  const { files } = params;

  if (files.length === 0) {
    return [];
  }

  // Process all files in parallel
  const detectionPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append("file", file.originalFile);

    const response = await apiClient.post<DicomDetectionResponse>(
      "/detect-dicom",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return {
      ...response.data,
      fileId: file.id,
      fileName: file.fileName,
    };
  });

  return Promise.all(detectionPromises);
};

export function useDicomDetection() {
  return useMutation({
    mutationFn: detectDicomFiles,
    onError: (error) => {
      console.error("DICOM detection failed:", error);
    },
  });
}
