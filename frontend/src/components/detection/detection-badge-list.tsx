"use client";
import { getDetectionColor } from "@/lib/constants";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Detection } from "@/lib/types";

interface DetectionBadgeListProps {
  detections: Detection[];
}

export function DetectionBadgeList({ detections }: DetectionBadgeListProps) {
  if (detections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Detections</h4>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-40 sm:max-h-60 overflow-y-auto pr-2">
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
                  className="text-xs sm:text-sm"
                >
                  {detection.class}
                  <span className="ml-1 text-muted-foreground">
                    {(detection.confidence * 100).toFixed(1)}%
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="" align="start" side="bottom">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <span className="text-background/80">Confidence:</span>
                  <span>{(detection.confidence * 100).toFixed(2)}%</span>

                  <span className="text-background/80">Position:</span>
                  <span>
                    ({Math.round(detection.x)}, {Math.round(detection.y)})
                  </span>

                  <span className="text-background/80">Dimensions:</span>
                  <span>
                    {Math.round(detection.width)}×{Math.round(detection.height)}
                    px
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
