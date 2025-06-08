"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { AlertCircle, Clock } from "lucide-react";
import { DetectionImagePreview } from "../detection/detection-image-preview";
import { DicomMetadata } from "../dicom/dicom-metadata";
import { StatusIndicator } from "./status-indicator";
import { DiagnosticReportComponent } from "./diagnostic-report";
import {
  DetectionProgress,
  ConvertedDicomData,
  DiagnosticReport,
} from "@/lib/types";
import { formatFileSize } from "@/lib/constants";

interface ResultCardProps {
  fileState: DetectionProgress["files"][0];
  fileData?: ConvertedDicomData;
  onReportGenerated?: (fileId: string, report: DiagnosticReport) => void;
}

export function ResultCard({
  fileState,
  fileData,
  onReportGenerated,
}: ResultCardProps) {
  const handleReportGenerated = (report: DiagnosticReport) => {
    onReportGenerated?.(fileState.fileId, report);
  };

  return (
    <TabsContent key={fileState.fileId} value={fileState.fileId}>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <StatusIndicator status={fileState.status} />
            <CardTitle className="text-base sm:text-lg truncate">
              File: {fileState.fileName}
            </CardTitle>
          </div>
          <CardDescription>
            {fileState.status === "loading" && "Processing..."}
            {fileState.status === "success" && (
              <div className="flex flex-col">
                <span>
                  Detections: {fileState.result?.predictions.length || 0}
                </span>
                <span>Patient: {fileState.result?.metadata.patient_name}</span>
              </div>
            )}
            {fileState.status === "error" &&
              `Error: ${fileState.error?.message || "Processing failed"}`}
            {fileState.status === "pending" && "Waiting to process..."}
          </CardDescription>
          {fileData && fileState.result && (
            <DetectionImagePreview
              src={fileData.dataUrl}
              alt={`DICOM with detections - ${fileState.result.fileName}`}
              width={fileData.width}
              height={fileData.height}
              detections={fileState.result.predictions}
            />
          )}
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {fileState.status === "loading" && (
            <div className="space-y-3">
              <Skeleton className="h-48 w-full rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          )}

          {fileState.status === "error" && (
            <div className="p-4 border border-red-200 rounded-md bg-red-50">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Processing Failed</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                {fileState.error?.message ||
                  "An unknown error occurred during processing."}
              </p>
            </div>
          )}

          {fileState.status === "pending" && (
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Waiting to Process</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This file is queued for processing.
              </p>
            </div>
          )}

          {fileState.status === "success" && fileState.result && (
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
                <TabsTrigger value="report">Diagnostic Report</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4 mt-4">
                {fileData && fileState.result && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Image Metadata</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
                      <span className="text-muted-foreground font-medium">
                        File Name:
                      </span>
                      <span className="truncate">{fileData.fileName}</span>

                      <span className="text-muted-foreground font-medium">
                        Dimensions:
                      </span>
                      <span>
                        {fileData.width}×{fileData.height}px
                      </span>

                      <span className="text-muted-foreground font-medium">
                        File Size:
                      </span>
                      <span>{formatFileSize(fileData.fileSize)}</span>

                      <span className="text-muted-foreground font-medium">
                        Detection Count:
                      </span>
                      <span>{fileState.result.predictions.length}</span>
                    </div>
                  </div>
                )}
                <Separator />

                {/* DICOM Metadata */}
                <DicomMetadata metadata={fileState.result.metadata} />

                <Separator />

                {/* Image Info */}
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Image Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
                    <span className="text-muted-foreground font-medium">
                      Original Shape:
                    </span>
                    <span>
                      {fileState.result.image_info.original_shape.join("×")}
                    </span>

                    <span className="text-muted-foreground font-medium">
                      Converted Format:
                    </span>
                    <span>{fileState.result.image_info.converted_format}</span>

                    <span className="text-muted-foreground font-medium">
                      Converted Size:
                    </span>
                    <span>
                      {fileState.result.image_info.converted_size.join("×")}
                    </span>

                    <span className="text-muted-foreground font-medium">
                      Pixel Range:
                    </span>
                    <span>
                      {fileState.result.image_info.pixel_array_min.toFixed(1)} -{" "}
                      {fileState.result.image_info.pixel_array_max.toFixed(1)}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="report" className="mt-4">
                <DiagnosticReportComponent
                  predictions={fileState.result.predictions}
                  metadata={fileState.result.metadata}
                  imageInfo={fileState.result.image_info}
                  report={fileState.diagnosticReport}
                  onReportGenerated={handleReportGenerated}
                  originalImageSrc={fileData?.dataUrl} // Pass the original image source
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
