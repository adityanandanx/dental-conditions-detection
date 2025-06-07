"use client";
import {
  Dropzone,
  DropZoneArea,
  DropzoneDescription,
  DropzoneFileList,
  DropzoneMessage,
  DropzoneTrigger,
  useDropzone,
} from "@/components/ui/dropzone";
import { CloudUploadIcon } from "lucide-react";
import { convertDicomToImageUrl } from "@/lib/utils";
import { Button } from "../ui/button";
import { useDroppedFilesStore } from "@/lib/store";
import { UseMutationResult } from "@tanstack/react-query";
import { ConvertedDicomData, DicomDetectionResult } from "@/lib/types";
import { FILE_SIZE_LIMITS, SUPPORTED_DICOM_EXTENSIONS } from "@/lib/constants";
import { DicomFileItem } from "./dicom-file-item";

interface DicomDropzoneProps {
  dicomDetectionMutation: UseMutationResult<
    DicomDetectionResult[],
    Error,
    { files: ConvertedDicomData[] },
    unknown
  >;
  onPredict: () => void;
}

export function DicomDropzone({
  dicomDetectionMutation,
  onPredict,
}: DicomDropzoneProps) {
  const { files, addFile, removeFile } = useDroppedFilesStore();

  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      try {
        // Convert DICOM to image during upload
        const convertedData = await convertDicomToImageUrl(file, "jpeg", 0.9);

        const fileData: ConvertedDicomData = {
          id: `${file.name}-${Date.now()}`, // Generate unique ID
          ...convertedData,
          originalFile: file,
          fileName: file.name,
          fileSize: file.size,
        };

        // Add to zustand store
        addFile(fileData);

        return {
          status: "success" as const,
          result: fileData,
        };
      } catch (error) {
        console.error("Failed to convert DICOM file:", error);
        return {
          status: "error" as const,
          error: "Failed to convert DICOM file",
        };
      }
    },
    validation: {
      accept: SUPPORTED_DICOM_EXTENSIONS,
      maxSize: FILE_SIZE_LIMITS.MAX_SIZE,
    },
  });

  // Handle file removal
  const handleRemoveFile = (fileId: string, dropzoneFileId: string) => {
    removeFile(fileId);
    dropzone.onRemoveFile(dropzoneFileId);
    // Reset mutation state when files change
    dicomDetectionMutation.reset();
  };

  return (
    <div className="not-prose flex flex-col gap-3 sm:gap-4">
      <Dropzone {...dropzone}>
        <div className="">
          <div className="flex flex-col">
            <DropzoneDescription className="text-sm sm:text-base">
              Please select DICOM (.dcm/.rvg) files you want to analyse
            </DropzoneDescription>
            <DropzoneMessage />
          </div>
          <DropZoneArea className="border-dashed border-muted-foreground rounded-md min-h-32 sm:min-h-40">
            <DropzoneTrigger className="flex flex-col items-center gap-3 sm:gap-4 bg-transparent w-full h-full text-center text-sm">
              <CloudUploadIcon className="size-6 sm:size-8" />
              <div>
                <p className="font-semibold text-sm sm:text-base">
                  Upload DICOM files
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Click here or drag and drop to upload
                </p>
              </div>
            </DropzoneTrigger>
          </DropZoneArea>
        </div>

        <DropzoneFileList className="gap-2 sm:gap-3 p-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2">
          {dropzone.fileStatuses.map((file) => (
            <DicomFileItem
              key={file.id}
              file={file}
              onRemove={handleRemoveFile}
            />
          ))}
        </DropzoneFileList>
      </Dropzone>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          size="lg"
          className="w-full sm:w-auto sm:flex-1"
          disabled={files.length === 0 || dicomDetectionMutation.isPending}
          onClick={onPredict}
        >
          {dicomDetectionMutation.isPending
            ? "Analyzing..."
            : `Predict (${files.length} files)`}
        </Button>

        {dicomDetectionMutation.data &&
          dicomDetectionMutation.data.length > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto sm:flex-1"
              onClick={() => dicomDetectionMutation.reset()}
            >
              Clear Results
            </Button>
          )}
      </div>
    </div>
  );
}
