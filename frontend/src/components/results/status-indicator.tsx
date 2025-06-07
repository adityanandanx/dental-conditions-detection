"use client";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "../ui/badge";

interface StatusIndicatorProps {
  status: string;
  className?: string;
}

interface StatusBadgesProps {
  completedCount: number;
  loadingCount: number;
  errorCount: number;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  switch (status) {
    case "success":
      return <CheckCircle className={`h-4 w-4 text-green-500 ${className}`} />;
    case "error":
      return <AlertCircle className={`h-4 w-4 text-red-500 ${className}`} />;
    case "loading":
      return (
        <div
          className={`h-4 w-4 border-b-2 border-primary animate-spin rounded-full ${className}`}
        />
      );
    default:
      return <Clock className={`h-4 w-4 text-gray-400 ${className}`} />;
  }
}

export function StatusBadges({
  completedCount,
  loadingCount,
  errorCount,
}: StatusBadgesProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {completedCount > 0 && (
        <Badge variant="default">{completedCount} completed</Badge>
      )}
      {loadingCount > 0 && (
        <Badge variant="secondary">{loadingCount} processing</Badge>
      )}
      {errorCount > 0 && (
        <Badge variant="destructive">{errorCount} failed</Badge>
      )}
    </div>
  );
}
