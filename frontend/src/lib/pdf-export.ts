import jsPDF from "jspdf";
import type {
  DiagnosticReport,
  Detection,
  DicomMetadata,
  ImageInfo,
} from "./types";

export interface PDFExportData {
  report: DiagnosticReport;
  detections: Detection[];
  metadata: DicomMetadata;
  imageInfo: ImageInfo;
  fileName: string;
}

export const exportToPDF = async (data: PDFExportData): Promise<void> => {
  try {
    // Create a new jsPDF instance
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // Add title
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("X-Ray Diagnostic Report", margin, yPosition);
    yPosition += 15;

    // Add a line separator
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Add patient information
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Patient Information", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    if (data.metadata.patient_name) {
      pdf.text(
        `Patient Name: ${data.metadata.patient_name}`,
        margin,
        yPosition
      );
      yPosition += 6;
    }

    if (data.metadata.patient_id) {
      pdf.text(`Patient ID: ${data.metadata.patient_id}`, margin, yPosition);
      yPosition += 6;
    }

    if (data.metadata.study_date) {
      pdf.text(`Study Date: ${data.metadata.study_date}`, margin, yPosition);
      yPosition += 6;
    }

    if (data.metadata.modality) {
      pdf.text(`Modality: ${data.metadata.modality}`, margin, yPosition);
      yPosition += 6;
    }

    yPosition += 5;

    // Add severity and summary
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Diagnostic Summary", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    // Severity
    const severityText = `Severity Level: ${
      data.report.severity_level.charAt(0).toUpperCase() +
      data.report.severity_level.slice(1)
    }`;
    pdf.text(severityText, margin, yPosition);
    yPosition += 8;

    // Summary
    const summaryLines = pdf.splitTextToSize(data.report.summary, contentWidth);
    pdf.text(summaryLines, margin, yPosition);
    yPosition += summaryLines.length * 5 + 5;

    // Add detailed analysis
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Detailed Analysis", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const reportLines = pdf.splitTextToSize(data.report.report, contentWidth);

    // Check if we need a new page
    if (yPosition + reportLines.length * 5 > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.text(reportLines, margin, yPosition);
    yPosition += reportLines.length * 5 + 10;

    // Add recommendations
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");

    // Check if we need a new page for recommendations
    if (yPosition + 20 > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.text("Recommendations", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    data.report.recommendations.forEach((recommendation) => {
      // Check if we need a new page
      if (yPosition + 10 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      const bulletPoint = `• ${recommendation}`;
      const recLines = pdf.splitTextToSize(bulletPoint, contentWidth - 5);
      pdf.text(recLines, margin + 5, yPosition);
      yPosition += recLines.length * 5 + 2;
    });

    yPosition += 5;

    // Add detections summary
    if (data.detections.length > 0) {
      // Check if we need a new page
      if (yPosition + 30 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Detection Summary", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      data.detections.forEach((detection, index) => {
        // Check if we need a new page
        if (yPosition + 15 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.text(
          `${index + 1}. ${detection.class} (Confidence: ${(
            detection.confidence * 100
          ).toFixed(1)}%)`,
          margin,
          yPosition
        );
        yPosition += 6;

        const bboxText = `   Location: x=${detection.x}, y=${detection.y}, width=${detection.width}, height=${detection.height}`;
        pdf.text(bboxText, margin, yPosition);
        yPosition += 6;

        yPosition += 2;
      });
    }

    // Add metadata
    yPosition += 10;

    // Check if we need a new page
    if (yPosition + 30 > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Technical Information", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    pdf.text(`File: ${data.fileName}`, margin, yPosition);
    yPosition += 6;

    if (data.imageInfo.original_shape) {
      pdf.text(
        `Original Image Size: ${data.imageInfo.original_shape.join("×")}`,
        margin,
        yPosition
      );
      yPosition += 6;
    }

    if (data.imageInfo.converted_size) {
      pdf.text(
        `Processed Size: ${data.imageInfo.converted_size.join("×")}`,
        margin,
        yPosition
      );
      yPosition += 6;
    }

    if (data.metadata.manufacturer) {
      pdf.text(`Equipment: ${data.metadata.manufacturer}`, margin, yPosition);
      yPosition += 6;
    }

    yPosition += 10;

    // Add footer with generation info
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    const footerText = `Report generated on ${new Date(
      data.report.generated_at
    ).toLocaleString()}`;
    pdf.text(footerText, margin, pageHeight - 10);

    // Save the PDF
    const pdfFileName = `diagnostic-report-${data.fileName.replace(
      /\.[^/.]+$/,
      ""
    )}-${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(pdfFileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF report");
  }
};
