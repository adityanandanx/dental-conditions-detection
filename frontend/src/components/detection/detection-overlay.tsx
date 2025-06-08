"use client";
import { getDetectionColor } from "@/lib/constants";
import { Detection } from "@/lib/types";

interface DetectionOverlayProps {
  detections: Detection[];
  originalWidth: number;
  originalHeight: number;
  displayWidth: number;
  displayHeight: number;
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
