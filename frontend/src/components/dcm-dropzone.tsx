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
import { CloudUploadIcon, ExpandIcon, Trash2Icon } from "lucide-react";
import { DicomImagePreview } from "./dicom-image-preview";
import { Button } from "./ui/button";

export function DCMDropzone() {
  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        status: "success",
        result: file, // Return the file object instead of blob URL
      };
    },
    validation: {
      accept: {
        "application/dicom": [".dcm", ".rvg"],
      },
      maxSize: 10 * 1024 * 1024, // 10 MB
    },
  });

  return (
    <div className="not-prose flex flex-col gap-4">
      <Dropzone {...dropzone}>
        <div className="">
          <div className="flex flex-col mb-3">
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

        <DropzoneFileList className="gap-3 grid grid-cols-2 p-0">
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
                <DicomImagePreview file={file.file} />
              )}
              <div className="flex items-center justify-between p-2 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center">
                  <DropzoneRemoveFile variant="ghost" size={"icon"}>
                    <Trash2Icon className="size-4" />
                  </DropzoneRemoveFile>
                </div>
              </div>
            </DropzoneFileListItem>
          ))}
        </DropzoneFileList>
      </Dropzone>
    </div>
  );
}
