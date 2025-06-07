import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import {
  ConvertedDicomData,
  DicomDetectionResponse,
  DicomDetectionResult,
} from "@/lib/types";

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
