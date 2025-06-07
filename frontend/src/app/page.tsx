"use client";
import { DicomDropzone } from "@/components/dicom/dicom-dropzone";
import Nav from "@/components/nav";
import { PredictionResults } from "@/components/results/prediction-results";
import { useDicomDetection } from "@/hooks/use-dicom-detection";
import { useDroppedFilesStore } from "@/lib/store";

export default function Home() {
  const { files } = useDroppedFilesStore();
  const dicomDetectionMutation = useDicomDetection();

  // Handle prediction
  const handlePredict = async () => {
    if (files.length === 0) return;

    dicomDetectionMutation.mutate({ files });
  };

  const { detectionProgress } = dicomDetectionMutation;
  const hasAnyActivity = detectionProgress.files.length > 0;

  return (
    <div className="min-h-screen flex flex-col w-full max-w-screen-2xl mx-auto">
      <Nav />
      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="w-full lg:w-96 xl:w-[28rem] p-4 sm:p-6 lg:p-10">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">X-Ray Image</h1>
          <DicomDropzone
            dicomDetectionMutation={dicomDetectionMutation}
            onPredict={handlePredict}
          />
        </div>
        <div className="flex-1 p-4 sm:p-6 lg:p-10">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 lg:mb-5">
            Diagnostic Report
          </h1>

          {!hasAnyActivity && (
            <p className="text-sm sm:text-base text-muted-foreground">
              The diagnostic report will be generated based on the uploaded
              X-ray image. Please upload an image and click &apos;Predict&apos;
              to generate the report.
            </p>
          )}

          {hasAnyActivity && (
            <PredictionResults detectionProgress={detectionProgress} />
          )}
        </div>
      </main>
    </div>
  );
}
