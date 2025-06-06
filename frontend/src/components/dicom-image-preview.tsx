"use client";
import { useEffect, useState } from "react";
import { convertDicomToImageUrl } from "@/lib/utils";
import Image from "next/image";

export const DicomImagePreview = ({ file }: { file: File }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const convertAndDisplayImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Convert DICOM to JPEG for display
        const dataUrl = await convertDicomToImageUrl(file, "jpeg", 0.9);
        setImageUrl(dataUrl);
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
    <div className="aspect-video relative w-full h-full">
      <Image
        src={imageUrl || ""}
        alt={`DICOM preview - ${file.name}`}
        fill
        className="object-contain"
        unoptimized // Required for data URLs
      />
    </div>
  );
};
