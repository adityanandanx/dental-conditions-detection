import Nav from "@/components/nav";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="h-svh flex flex-col">
      <Nav />
      <main className="flex flex-1">
        <div className="w-lg p-10">
          <h1 className="text-2xl font-bold mb-5">X-Ray Image</h1>
          <div className="border border-dashed border-muted-foreground p-10 flex flex-col items-center justify-center gap-2 h-96 text-center rounded-4xl">
            <h1 className="text-lg font-bold">Upload DICOM Image</h1>
            <p>
              Drag and drop or browse to upload a dental X-ray image for
              analysis.
            </p>
            <Button variant={"default"}>Browse files</Button>
          </div>
        </div>
        <div className="flex-1 p-10">
          <h1 className="text-2xl font-bold mb-5">Diagnostic Report</h1>
          <p>
            The diagnostic report will be generated based on the uploaded X-ray
            image. Please upload an image and click &apos;Predict&apos; to
            generate the report.
          </p>
        </div>
      </main>
    </div>
  );
}
