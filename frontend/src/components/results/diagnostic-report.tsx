"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGenerateDiagnosticReport } from "@/hooks/use-diagnostic-report";
import { exportToPDF, type PDFExportData } from "@/lib/pdf-export";
import type {
  Detection,
  DicomMetadata,
  ImageInfo,
  DiagnosticReport,
} from "@/lib/types";
import {
  FileText,
  Brain,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface DiagnosticReportComponentProps {
  predictions: Detection[];
  metadata: DicomMetadata;
  imageInfo: ImageInfo;
  report?: DiagnosticReport;
  onReportGenerated?: (report: DiagnosticReport) => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "low":
      return "bg-green-100 text-green-800";
    case "moderate":
      return "bg-yellow-100 text-yellow-800";
    case "high":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "low":
      return <CheckCircle className="h-4 w-4" />;
    case "moderate":
      return <Clock className="h-4 w-4" />;
    case "high":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

export function DiagnosticReportComponent({
  predictions,
  metadata,
  imageInfo,
  report: externalReport,
  onReportGenerated,
}: DiagnosticReportComponentProps) {
  const [report, setReport] = useState<DiagnosticReport | null>(
    externalReport || null
  );
  const [isExporting, setIsExporting] = useState(false);
  const generateReport = useGenerateDiagnosticReport();

  // Update local state when external report changes
  useEffect(() => {
    setReport(externalReport || null);
  }, [externalReport]);

  const handleGenerateReport = async () => {
    try {
      const response = await generateReport.mutateAsync({
        predictions,
        metadata,
        image_info: imageInfo,
      });
      setReport(response.diagnostic_report);
      onReportGenerated?.(response.diagnostic_report);
    } catch (error) {
      console.error("Failed to generate diagnostic report:", error);
    }
  };

  const handleExportPDF = async () => {
    if (!report) return;

    setIsExporting(true);
    try {
      const exportData: PDFExportData = {
        report,
        detections: predictions,
        metadata,
        imageInfo,
        fileName: metadata.patient_name || "diagnostic-report",
      };

      await exportToPDF(exportData);
    } catch (error) {
      toast.error("Failed to export PDF");
      console.log(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex-1">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Diagnostic Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!report ? (
          <div className="flex flex-col items-center text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4 max-w-sm">
              Generate a comprehensive diagnostic report based on the detected
              conditions.
            </p>
            <Button
              onClick={handleGenerateReport}
              disabled={generateReport.isPending || predictions.length === 0}
              className="flex items-center gap-2"
            >
              {generateReport.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Generate Diagnostic Report
                </>
              )}
            </Button>
            {predictions.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No detections found. Please upload and analyze an image first.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Severity and Summary */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Summary</h3>
                <p className="text-gray-700">{report.summary}</p>
              </div>
              <Badge
                className={`ml-4 flex items-center gap-1 ${getSeverityColor(
                  report.severity_level
                )}`}
              >
                {getSeverityIcon(report.severity_level)}
                {report.severity_level.charAt(0).toUpperCase() +
                  report.severity_level.slice(1)}
              </Badge>
            </div>

            <Separator />

            {/* Detailed Report */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Detailed Analysis</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {report.report}
                </p>
              </div>
            </div>

            <Separator />

            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {report.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Report Metadata */}
            <div className="text-sm text-gray-500">
              <p>
                Report generated on{" "}
                {new Date(report.generated_at).toLocaleString()}
              </p>
              <p>
                Based on {predictions.length} detection
                {predictions.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex gap-4">
              {/* Generate New Report Button */}
              <Button
                onClick={handleGenerateReport}
                disabled={generateReport.isPending}
                variant="outline"
                className="flex-1"
              >
                {generateReport.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Regenerating Report...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Generate New Report
                  </>
                )}
              </Button>
              {/* Export Button */}
              <Button
                onClick={handleExportPDF}
                disabled={isExporting}
                variant="default"
                className="flex-1"
              >
                {isExporting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                    Exporting PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {generateReport.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Failed to generate report</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              {generateReport.error?.message ||
                "An error occurred while generating the diagnostic report. Please try again."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
