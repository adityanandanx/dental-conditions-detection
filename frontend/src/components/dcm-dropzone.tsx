"use client";
import {
  Dropzone,
  DropZoneArea,
  DropzoneDescription,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneTrigger,
  useDropzone,
} from "@/components/ui/dropzone";
import { CloudUploadIcon, Trash2Icon } from "lucide-react";
import { convertDicomToImageUrl } from "@/lib/utils";
import { ImagePreview } from "./image-preview";
import { Button } from "./ui/button";
import { useDroppedFilesStore, ConvertedDicomData } from "@/lib/store";
import { UseMutationResult } from "@tanstack/react-query";
import { DicomDetectionResult } from "@/hooks/use-dicom-detection";

interface DCMDropzoneProps {
  dicomDetectionMutation: UseMutationResult<
    DicomDetectionResult[],
    Error,
    { files: ConvertedDicomData[] },
    unknown
  >;
  onPredict: () => void;
}

export function DCMDropzone({
  dicomDetectionMutation,
  onPredict,
}: DCMDropzoneProps) {
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
      accept: {
        "application/dicom": [".dcm", ".rvg"],
      },
      maxSize: 10 * 1024 * 1024, // 10 MB
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
            <DropzoneFileListItem
              className="overflow-hidden rounded-md bg-secondary p-0 shadow-sm"
              key={file.id}
              file={file}
            >
              {file.status === "pending" && (
                <div className="aspect-video animate-pulse bg-black/20" />
              )}
              {file.status === "success" && (
                <ImagePreview
                  src={file.result.dataUrl}
                  alt={`DICOM preview - ${file.fileName}`}
                  width={file.result.width}
                  height={file.result.height}
                  fileName={file.fileName}
                  fileSize={file.file.size}
                />
              )}
              {file.status === "error" && (
                <div className="aspect-video flex items-center justify-center bg-red-50 text-red-500">
                  <div className="text-center p-2">
                    <p className="text-xs sm:text-sm">
                      Failed to convert DICOM
                    </p>
                    <p className="text-xs text-red-400">{file.error}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-2 sm:p-3 pl-3 sm:pl-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-medium">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <DropzoneRemoveFile
                  variant="ghost"
                  size="sm"
                  className="shrink-0 hover:outline ml-2"
                  onClick={() =>
                    file.status === "success" &&
                    handleRemoveFile(file.result.id, file.id)
                  }
                >
                  <Trash2Icon className="size-3 sm:size-4" />
                </DropzoneRemoveFile>
              </div>
            </DropzoneFileListItem>
          ))}
        </DropzoneFileList>
      </Dropzone>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          size="lg"
          className="w-full sm:w-auto"
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
              className="w-full sm:w-auto"
              onClick={() => dicomDetectionMutation.reset()}
            >
              Clear Results
            </Button>
          )}
      </div>
    </div>
  );
}
