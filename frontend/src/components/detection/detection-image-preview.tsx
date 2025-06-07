"use client";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { Detection } from "@/lib/types";
import { formatFileSize } from "@/lib/constants";
import { DetectionOverlay } from "./detection-overlay";
import { DetectionBadgeList } from "./detection-badge-list";

interface DetectionImagePreviewProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  fileName: string;
  fileSize: number;
  detections?: Detection[];
}

export function DetectionImagePreview({
  src,
  alt,
  width,
  height,
  fileName,
  fileSize,
  detections = [],
}: DetectionImagePreviewProps) {
  // Calculate aspect ratio for proper scaling
  const aspectRatio = width / height;
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayWidth, setDisplayWidth] = useState(0);
  const [displayHeight, setDisplayHeight] = useState(0);

  // Update container dimensions on resize
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const newWidth = containerRef.current.clientWidth;

      // Set display dimensions maintaining aspect ratio
      setDisplayWidth(Math.min(newWidth, width));
      setDisplayHeight(Math.min(newWidth / aspectRatio, height));
    }
  }, [width, height, aspectRatio]);

  // Initialize and handle resize
  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, [updateDimensions]);

  return (
    <div className="w-full" ref={containerRef}>
      <div className="space-y-3 sm:space-y-4">
        {/* Image with all bounding boxes */}
        <div
          className="relative mx-auto"
          style={{ width: displayWidth, height: displayHeight }}
        >
          <Image
            src={src}
            alt={alt}
            width={displayWidth}
            height={displayHeight}
            className="object-contain rounded-md"
            style={{ width: displayWidth, height: displayHeight }}
            priority
          />

          <DetectionOverlay
            detections={detections}
            originalWidth={width}
            originalHeight={height}
            displayWidth={displayWidth}
            displayHeight={displayHeight}
          />
        </div>

        {/* Metadata section */}
        <div className="space-y-3 sm:space-y-4">
          <DetectionBadgeList detections={detections} />

          {/* Image metadata */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Image Metadata</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
              <span className="text-muted-foreground font-medium">
                File Name:
              </span>
              <span className="truncate">{fileName}</span>

              <span className="text-muted-foreground font-medium">
                Dimensions:
              </span>
              <span>
                {width}×{height}px
              </span>

              <span className="text-muted-foreground font-medium">
                File Size:
              </span>
              <span>{formatFileSize(fileSize)}</span>

              <span className="text-muted-foreground font-medium">
                Detection Count:
              </span>
              <span>{detections.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
