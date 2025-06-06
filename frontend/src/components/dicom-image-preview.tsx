"use client";
import { useEffect, useState } from "react";
import { convertDicomToImageUrl } from "@/lib/utils";
import Image from "next/image";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";

export const DicomImagePreview = ({ file }: { file: File }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const convertAndDisplayImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Convert DICOM to JPEG for display
        const { dataUrl, width, height } = await convertDicomToImageUrl(
          file,
          "jpeg",
          0.9
        );
        setImageUrl(dataUrl);
        setImageSize({ width, height });
      } catch (error) {
        console.error("Error converting DICOM image:", error);
        setError("Failed to convert DICOM image");
      } finally {
        setIsLoading(false);
      }
    };

    convertAndDisplayImage();
  }, [file]);

  if (error) {
    return (
      <div className="aspect-video flex items-center justify-center bg-gray-100 text-gray-500">
        <div className="text-center">
          <p className="text-sm">Failed to render DICOM</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="aspect-video flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <p className="text-sm">Converting DICOM image...</p>
        </div>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger className="aspect-video relative w-full h-full cursor-pointer">
        <Image
          src={imageUrl || ""}
          alt={`DICOM preview - ${file.name}`}
          fill
          className="object-contain"
          unoptimized
        />
      </DialogTrigger>
      <DialogContent className="flex flex-col max-w-[90%] sm:max-w-[90%] max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
          <DialogDescription>
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </DialogDescription>
        </DialogHeader>
        <Image
          src={imageUrl || ""}
          alt={`DICOM preview - ${file.name}`}
          width={imageSize?.width || 0}
          height={imageSize?.height || 0}
          className="object-contain rounded-md overflow-hidden w-full h-full bg-secondary"
        />
        <DialogFooter className="self-center">
          <DialogClose asChild>
            <Button variant={"secondary"}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
