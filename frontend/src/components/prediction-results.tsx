"use client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDroppedFilesStore } from "@/lib/store";
import { DetectionProgress } from "@/lib/types";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { DetectionImagePreview } from "./detection-image-preview";

interface PredictionResultsProps {
  detectionProgress: DetectionProgress;
}

export function PredictionResults({
  detectionProgress,
}: PredictionResultsProps) {
  const { files } = useDroppedFilesStore();
  const { files: fileStates } = detectionProgress;

  if (fileStates.length === 0) {
    return null;
  }

  // Find the first available result or the first file as default
  const defaultTab =
    fileStates.find((f) => f.result)?.fileId || fileStates[0]?.fileId || "";
  const completedFiles = fileStates.filter((f) => f.status === "success");
  const errorFiles = fileStates.filter((f) => f.status === "error");
  const loadingFiles = fileStates.filter((f) => f.status === "loading");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "loading":
        return (
          <div className="h-4 w-4 border-b-2 border-primary animate-spin rounded-full" />
        );
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold">
          Prediction Results
        </h3>
        <div className="flex gap-2 flex-wrap">
          {completedFiles.length > 0 && (
            <Badge variant="default">{completedFiles.length} completed</Badge>
          )}
          {loadingFiles.length > 0 && (
            <Badge variant="secondary">{loadingFiles.length} processing</Badge>
          )}
          {errorFiles.length > 0 && (
            <Badge variant="destructive">{errorFiles.length} failed</Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 w-full overflow-x-auto flex-nowrap justify-start">
          {fileStates.map((fileState) => (
            <TabsTrigger
              key={fileState.fileId}
              value={fileState.fileId}
              className="whitespace-nowrap text-xs sm:text-sm flex items-center gap-2"
            >
              {getStatusIcon(fileState.status)}
              <span className="truncate max-w-24 sm:max-w-none">
                {fileState.fileName}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {fileStates.map((fileState) => {
          const fileData = files.find((f) => f.id === fileState.fileId);

          return (
            <TabsContent key={fileState.fileId} value={fileState.fileId}>
              <Card className="w-full">
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(fileState.status)}
                    <CardTitle className="text-base sm:text-lg truncate">
                      File: {fileState.fileName}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    {fileState.status === "loading" && "Processing..."}
                    {fileState.status === "success" &&
                      `Detections: ${
                        fileState.result?.predictions.length || 0
                      }`}
                    {fileState.status === "error" &&
                      `Error: ${
                        fileState.error?.message || "Processing failed"
                      }`}
                    {fileState.status === "pending" && "Waiting to process..."}
                  </CardDescription>
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
                    <>
                      {/* Image with Detection Visualization */}
                      {fileData && (
                        <DetectionImagePreview
                          src={fileData.dataUrl}
                          alt={`DICOM with detections - ${fileState.result.fileName}`}
                          width={fileData.width}
                          height={fileData.height}
                          fileName={fileState.result.fileName}
                          fileSize={fileData.fileSize}
                          detections={fileState.result.predictions}
                        />
                      )}

                      <Separator />

                      {/* DICOM Metadata */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          DICOM Metadata
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
                          {fileState.result.metadata.patient_name && (
                            <>
                              <span className="text-muted-foreground font-medium">
                                Patient:
                              </span>
                              <span className="break-words">
                                {fileState.result.metadata.patient_name}
                              </span>
                            </>
                          )}
                          {fileState.result.metadata.patient_id && (
                            <>
                              <span className="text-muted-foreground font-medium">
                                Patient ID:
                              </span>
                              <span className="break-all">
                                {fileState.result.metadata.patient_id}
                              </span>
                            </>
                          )}
                          {fileState.result.metadata.modality && (
                            <>
                              <span className="text-muted-foreground font-medium">
                                Modality:
                              </span>
                              <span>{fileState.result.metadata.modality}</span>
                            </>
                          )}
                          {fileState.result.metadata.study_date && (
                            <>
                              <span className="text-muted-foreground font-medium">
                                Study Date:
                              </span>
                              <span>
                                {fileState.result.metadata.study_date}
                              </span>
                            </>
                          )}
                          {fileState.result.metadata.manufacturer && (
                            <>
                              <span className="text-muted-foreground font-medium">
                                Manufacturer:
                              </span>
                              <span className="break-words">
                                {fileState.result.metadata.manufacturer}
                              </span>
                            </>
                          )}
                          {fileState.result.metadata.rows &&
                            fileState.result.metadata.columns && (
                              <>
                                <span className="text-muted-foreground font-medium">
                                  Dimensions:
                                </span>
                                <span>
                                  {fileState.result.metadata.columns}×
                                  {fileState.result.metadata.rows}
                                </span>
                              </>
                            )}
                        </div>
                      </div>

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
                            {fileState.result.image_info.original_shape.join(
                              "×"
                            )}
                          </span>

                          <span className="text-muted-foreground font-medium">
                            Converted Format:
                          </span>
                          <span>
                            {fileState.result.image_info.converted_format}
                          </span>

                          <span className="text-muted-foreground font-medium">
                            Converted Size:
                          </span>
                          <span>
                            {fileState.result.image_info.converted_size.join(
                              "×"
                            )}
                          </span>

                          <span className="text-muted-foreground font-medium">
                            Pixel Range:
                          </span>
                          <span>
                            {fileState.result.image_info.pixel_array_min.toFixed(
                              1
                            )}{" "}
                            -{" "}
                            {fileState.result.image_info.pixel_array_max.toFixed(
                              1
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
