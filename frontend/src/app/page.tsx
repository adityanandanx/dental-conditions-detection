"use client";
import { DCMDropzone } from "@/components/dcm-dropzone";
import Nav from "@/components/nav";
import { PredictionResults } from "@/components/prediction-results";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="min-h-screen flex flex-col w-full max-w-screen-2xl mx-auto">
      <Nav />
      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="w-full lg:w-96 xl:w-[28rem] p-4 sm:p-6 lg:p-10">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">X-Ray Image</h1>
          <DCMDropzone
            dicomDetectionMutation={dicomDetectionMutation}
            onPredict={handlePredict}
          />
        </div>
        <div className="flex-1 p-4 sm:p-6 lg:p-10">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 lg:mb-5">
            Diagnostic Report
          </h1>

          {!dicomDetectionMutation.data &&
            !dicomDetectionMutation.isError &&
            !dicomDetectionMutation.isPending && (
              <p className="text-sm sm:text-base text-muted-foreground">
                The diagnostic report will be generated based on the uploaded
                X-ray image. Please upload an image and click
                &apos;Predict&apos; to generate the report.
              </p>
            )}

          {dicomDetectionMutation.isPending && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <p className="text-sm sm:text-base">Analyzing DICOM files...</p>
            </div>
          )}

          {dicomDetectionMutation.isError && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm font-medium">
                Analysis Failed:
              </p>
              <p className="text-red-600 text-sm">
                {dicomDetectionMutation.error instanceof Error
                  ? dicomDetectionMutation.error.message
                  : "An unexpected error occurred during detection"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => dicomDetectionMutation.reset()}
              >
                Try Again
              </Button>
            </div>
          )}

          {dicomDetectionMutation.data &&
            dicomDetectionMutation.data.length > 0 && (
              <PredictionResults results={dicomDetectionMutation.data} />
            )}
        </div>
      </main>
    </div>
  );
}
