"use client";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { StatusIndicator } from "./status-indicator";
import { DetectionProgress } from "@/lib/types";

interface ResultTabsProps {
  fileStates: DetectionProgress["files"];
  defaultValue: string;
  children: React.ReactNode;
}

export function ResultTabs({
  fileStates,
  defaultValue,
  children,
}: ResultTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      <TabsList className="mb-4 w-full overflow-x-auto flex-nowrap justify-start">
        {fileStates.map((fileState) => (
          <TabsTrigger
            key={fileState.fileId}
            value={fileState.fileId}
            className="whitespace-nowrap text-xs sm:text-sm flex items-center gap-2"
          >
            <StatusIndicator status={fileState.status} />
            <span className="truncate max-w-24 sm:max-w-none">
              {fileState.fileName}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
