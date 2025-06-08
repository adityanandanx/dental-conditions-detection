import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
  DiagnosticReportRequest,
  DiagnosticReportResponse,
} from "@/lib/types";

export const useGenerateDiagnosticReport = () => {
  return useMutation<DiagnosticReportResponse, Error, DiagnosticReportRequest>({
    mutationFn: async (data: DiagnosticReportRequest) => {
      // Ensure the data structure matches backend expectations
      const requestBody = {
        predictions: data.predictions,
        metadata: data.metadata || null,
        image_info: data.image_info || null,
      };

      const response = await apiClient.post<DiagnosticReportResponse>(
        "/generate-diagnostic-report",
        requestBody
      );
      return response.data;
    },
  });
};
