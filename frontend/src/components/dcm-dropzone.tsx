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

export function DCMDropzone() {
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
  };

  return (
    <div className="not-prose flex flex-col gap-4">
      <Dropzone {...dropzone}>
        <div className="">
          <div className="flex flex-col">
            <DropzoneDescription>
              Please select DICOM (.dcm/.rvg) files you want to analyse
            </DropzoneDescription>
            <DropzoneMessage />
          </div>
          <DropZoneArea className=" border-dashed border-muted-foreground rounded-md">
            <DropzoneTrigger className="flex flex-col items-center gap-4 bg-transparent w-full h-full text-center text-sm">
              <CloudUploadIcon className="size-8" />
              <div>
                <p className="font-semibold">Upload DICOM files</p>
                <p className="text-sm text-muted-foreground">
                  Click here or drag and drop to upload
                </p>
              </div>
            </DropzoneTrigger>
          </DropZoneArea>
        </div>

        <DropzoneFileList className="gap-3 p-0 grid grid-cols-2">
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
                  <div className="text-center">
                    <p className="text-sm">Failed to convert DICOM</p>
                    <p className="text-xs">{file.error}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-2 pl-4">
                <div className="min-w-0">
                  <p className="truncate text-sm">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <DropzoneRemoveFile
                  variant="ghost"
                  className="shrink-0 hover:outline"
                  onClick={() =>
                    file.status === "success" &&
                    handleRemoveFile(file.result.id, file.id)
                  }
                >
                  <Trash2Icon className="size-4" />
                </DropzoneRemoveFile>
              </div>
            </DropzoneFileListItem>
          ))}
        </DropzoneFileList>
      </Dropzone>

      <Button size={"lg"} disabled={files.length === 0}>
        Predict ({files.length} files)
      </Button>
    </div>
  );
}
