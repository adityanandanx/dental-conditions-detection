"use client";
import { Detection } from "@/lib/types";

interface DetectionOverlayProps {
  detections: Detection[];
  originalWidth: number;
  originalHeight: number;
  displayWidth: number;
  displayHeight: number;
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

export function DetectionOverlay({
  detections,
  originalWidth,
  originalHeight,
  displayWidth,
  displayHeight,
}: DetectionOverlayProps) {
  const scaleX = displayWidth / originalWidth;
  const scaleY = displayHeight / originalHeight;

  return (
    <>
      {detections.map((detection) => {
        const boxColor = getDetectionColor(detection.class_id);

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
    </>
  );
}
