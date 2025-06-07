"use client";
import { Button } from "../ui/button";
import { CopyIcon } from "lucide-react";
import { DicomDetectionResult } from "@/lib/types";

interface DicomMetadataProps {
  metadata: DicomDetectionResult["metadata"];
}

export function DicomMetadata({ metadata }: DicomMetadataProps) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">DICOM Metadata</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
        {metadata.patient_name && (
          <>
            <span className="text-muted-foreground font-medium">Patient:</span>
            <span className="break-words">{metadata.patient_name}</span>
          </>
        )}
        {metadata.patient_id && (
          <>
            <span className="text-muted-foreground font-medium">
              Patient ID:
            </span>
            <div className="w-full flex items-center">
              <span className="truncate flex-1">{metadata.patient_id}</span>
              <Button
                variant={"secondary"}
                size="sm"
                className="cursor-pointer focus-within:text-muted-foreground"
                onClick={() => {
                  if (metadata.patient_id) {
                    navigator.clipboard.writeText(metadata.patient_id);
                  }
                }}
              >
                <CopyIcon size={8} className="size-3" />
              </Button>
            </div>
          </>
        )}
        {metadata.modality && (
          <>
            <span className="text-muted-foreground font-medium">Modality:</span>
            <span>{metadata.modality}</span>
          </>
        )}
        {metadata.study_date && (
          <>
            <span className="text-muted-foreground font-medium">
              Study Date:
            </span>
            <span>{metadata.study_date}</span>
          </>
        )}
        {metadata.manufacturer && (
          <>
            <span className="text-muted-foreground font-medium">
              Manufacturer:
            </span>
            <span className="break-words">{metadata.manufacturer}</span>
          </>
        )}
        {metadata.rows && metadata.columns && (
          <>
            <span className="text-muted-foreground font-medium">
              Dimensions:
            </span>
            <span>
              {metadata.columns}×{metadata.rows}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
