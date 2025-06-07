"use client";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id: string;
}

interface DetectionImagePreviewProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  fileName: string;
  fileSize: number;
  detections?: Detection[];
}

// Color palette for different detection classes
const DETECTION_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
];

function getDetectionColor(classId: number): string {
  return DETECTION_COLORS[classId % DETECTION_COLORS.length];
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
  // Convert bytes to a readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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
      <div className="space-y-4">
        {/* Image with all bounding boxes */}
        <div
          className="relative"
          style={{ width: displayWidth, height: displayHeight }}
        >
          <Image
            src={src}
            alt={alt}
            width={displayWidth}
            height={displayHeight}
            className="object-contain"
            style={{ width: displayWidth, height: displayHeight }}
            priority
          />

          {/* Draw all bounding boxes */}
          {detections.map((detection) => {
            const boxColor = getDetectionColor(detection.class_id);
            const scaleX = displayWidth / width;
            const scaleY = displayHeight / height;

            return (
              <div
                key={detection.detection_id}
                className="absolute border-2"
                style={{
                  left: detection.x * scaleX,
                  top: detection.y * scaleY,
                  width: detection.width * scaleX,
                  height: detection.height * scaleY,
                  borderColor: boxColor,
                }}
              >
                <div
                  className="absolute -top-6 left-0 px-1 text-xs text-white truncate max-w-full"
                  style={{ backgroundColor: boxColor }}
                >
                  {detection.class} ({(detection.confidence * 100).toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>

        {/* Metadata section */}
        <div className="space-y-4">
          {/* Detection details list */}
          {detections.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2">
                {detections.map((detection) => {
                  const boxColor = getDetectionColor(detection.class_id);
                  return (
                    <Tooltip key={detection.detection_id}>
                      <TooltipTrigger asChild>
                        <Badge
                          style={{
                            borderColor: boxColor,
                          }}
                          variant={"outline"}
                        >
                          {detection.class}
                          <span className="ml-1 text-muted-foreground">
                            {(detection.confidence * 100).toFixed(1)}%
                          </span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="" align="start" side="bottom">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          <span className="text-background/80">
                            Confidence:
                          </span>
                          <span>
                            {(detection.confidence * 100).toFixed(2)}%
                          </span>

                          <span className="text-background/80">Position:</span>
                          <span>
                            ({Math.round(detection.x)},{" "}
                            {Math.round(detection.y)})
                          </span>

                          <span className="text-background/80">
                            Dimensions:
                          </span>
                          <span>
                            {Math.round(detection.width)}×
                            {Math.round(detection.height)}px
                          </span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}
          {/* Image metadata */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Image Metadata</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">File Name:</span>
              <span className="truncate">{fileName}</span>

              <span className="text-muted-foreground">Dimensions:</span>
              <span>
                {width}×{height}px
              </span>

              <span className="text-muted-foreground">File Size:</span>
              <span>{formatFileSize(fileSize)}</span>

              <span className="text-muted-foreground">Detection Count:</span>
              <span>{detections.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
