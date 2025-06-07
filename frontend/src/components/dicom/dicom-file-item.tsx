"use client";
import { Trash2Icon } from "lucide-react";
import { ImagePreview } from "../image-preview";
import {
  DropzoneFileListItem,
  DropzoneRemoveFile,
  FileStatus,
} from "../ui/dropzone";
import { formatFileSize } from "@/lib/constants";
import { ConvertedDicomData } from "@/lib/types";

interface DicomFileItemProps {
  file: FileStatus<ConvertedDicomData, string>;
  onRemove: (fileId: string, dropzoneFileId: string) => void;
}

export function DicomFileItem({ file, onRemove }: DicomFileItemProps) {
  return (
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
            <p className="text-xs sm:text-sm">Failed to convert DICOM</p>
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
            {formatFileSize(file.file.size)}
          </p>
        </div>
        <DropzoneRemoveFile
          variant="ghost"
          size="sm"
          className="shrink-0 hover:outline ml-2"
          onClick={() =>
            file.status === "success" && onRemove(file.result.id, file.id)
          }
        >
          <Trash2Icon className="size-3 sm:size-4" />
        </DropzoneRemoveFile>
      </div>
    </DropzoneFileListItem>
  );
}
