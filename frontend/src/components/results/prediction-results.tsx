"use client";
import { useDroppedFilesStore } from "@/lib/store";
import { DetectionProgress } from "@/lib/types";
import { ResultTabs } from "./result-tabs";
import { ResultCard } from "./result-card";
import { StatusBadges } from "./status-indicator";

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold">
          Prediction Results
        </h3>
        <StatusBadges
          completedCount={completedFiles.length}
          loadingCount={loadingFiles.length}
          errorCount={errorFiles.length}
        />
      </div>

      <ResultTabs fileStates={fileStates} defaultValue={defaultTab}>
        {fileStates.map((fileState) => {
          const fileData = files.find((f) => f.id === fileState.fileId);
          return (
            <ResultCard
              key={fileState.fileId}
              fileState={fileState}
              fileData={fileData}
            />
          );
        })}
      </ResultTabs>
    </div>
  );
}
