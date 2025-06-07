"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DicomDetectionResult } from "@/hooks/use-dicom-detection";
import { DetectionImagePreview } from "./detection-image-preview";
import { useDroppedFilesStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PredictionResultsProps {
  results: DicomDetectionResult[];
}

export function PredictionResults({ results }: PredictionResultsProps) {
  const { files } = useDroppedFilesStore();

  if (results.length === 0) {
    return null;
  }

  // Set the default tab to the first result
  const defaultTab = results.length > 0 ? results[0].fileId : "";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold">
          Prediction Results
        </h3>
        <Badge variant="secondary">{results.length} file(s) analyzed</Badge>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 w-full overflow-x-auto flex-nowrap justify-start">
          {results.map((result) => (
            <TabsTrigger
              key={result.fileId}
              value={result.fileId}
              className="whitespace-nowrap text-xs sm:text-sm"
            >
              <span className="truncate max-w-24 sm:max-w-none">
                {result.fileName}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {results.map((result) => {
          // Find the corresponding file data for image preview
          const fileData = files.find((f) => f.id === result.fileId);

          return (
            <TabsContent key={result.fileId} value={result.fileId}>
              <Card className="w-full">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg truncate">
                    File: {result.fileName}
                  </CardTitle>
                  <CardDescription>
                    Detections: {result.predictions.length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {/* Image with Detection Visualization in Tabs */}
                  {fileData && (
                    <DetectionImagePreview
                      src={fileData.dataUrl}
                      alt={`DICOM with detections - ${result.fileName}`}
                      width={fileData.width}
                      height={fileData.height}
                      fileName={result.fileName}
                      fileSize={fileData.fileSize}
                      detections={result.predictions}
                    />
                  )}

                  <Separator />

                  {/* DICOM Metadata */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">DICOM Metadata</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
                      {result.metadata.patient_name && (
                        <>
                          <span className="text-muted-foreground font-medium">
                            Patient:
                          </span>
                          <span className="break-words">
                            {result.metadata.patient_name}
                          </span>
                        </>
                      )}
                      {result.metadata.patient_id && (
                        <>
                          <span className="text-muted-foreground font-medium">
                            Patient ID:
                          </span>
                          <span className="break-all">
                            {result.metadata.patient_id}
                          </span>
                        </>
                      )}
                      {result.metadata.modality && (
                        <>
                          <span className="text-muted-foreground font-medium">
                            Modality:
                          </span>
                          <span>{result.metadata.modality}</span>
                        </>
                      )}
                      {result.metadata.study_date && (
                        <>
                          <span className="text-muted-foreground font-medium">
                            Study Date:
                          </span>
                          <span>{result.metadata.study_date}</span>
                        </>
                      )}
                      {result.metadata.manufacturer && (
                        <>
                          <span className="text-muted-foreground font-medium">
                            Manufacturer:
                          </span>
                          <span className="break-words">
                            {result.metadata.manufacturer}
                          </span>
                        </>
                      )}
                      {result.metadata.rows && result.metadata.columns && (
                        <>
                          <span className="text-muted-foreground font-medium">
                            Dimensions:
                          </span>
                          <span>
                            {result.metadata.columns}×{result.metadata.rows}
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
                      <span>{result.image_info.original_shape.join("×")}</span>

                      <span className="text-muted-foreground font-medium">
                        Converted Format:
                      </span>
                      <span>{result.image_info.converted_format}</span>

                      <span className="text-muted-foreground font-medium">
                        Converted Size:
                      </span>
                      <span>{result.image_info.converted_size.join("×")}</span>

                      <span className="text-muted-foreground font-medium">
                        Pixel Range:
                      </span>
                      <span>
                        {result.image_info.pixel_array_min.toFixed(1)} -{" "}
                        {result.image_info.pixel_array_max.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
