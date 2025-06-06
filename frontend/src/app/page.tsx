"use client";
import { DCMDropzone } from "@/components/dcm-dropzone";
import Nav from "@/components/nav";

export default function Home() {
  return (
    <div className="h-svh flex flex-col">
      <Nav />
      <main className="flex flex-1">
        <div className="w-lg p-10">
          <h1 className="text-2xl font-bold">X-Ray Image</h1>
          <DCMDropzone />
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
