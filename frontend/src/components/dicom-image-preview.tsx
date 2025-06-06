import { NativePixelDecoder, DicomImage } from "dcmjs-imaging";
import { useRef, useState, useEffect } from "react";

export function DicomImagePreview({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCodecsInitialized, setIsCodecsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize native decoders on component mount
  useEffect(() => {
    const initCodecs = async () => {
      try {
        // Configure the WASM file path for dcmjs-imaging
        await NativePixelDecoder.initializeAsync({
          webAssemblyModulePathOrUrl: "/dcmjs-native-codecs.wasm",
        });
        setIsCodecsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize native decoders:", err);
        setError("Failed to initialize DICOM decoders");
      }
    };

    initCodecs();
  }, []);

  useEffect(() => {
    if (!isCodecsInitialized) return;

    const renderDicomImage = async () => {
      try {
        setError(null);

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Create DICOM image instance
        const image = new DicomImage(arrayBuffer);

        // Render the image
        const renderingResult = image.render();

        // Get the canvas element
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas dimensions
        canvas.width = renderingResult.width;
        canvas.height = renderingResult.height;

        // Get 2D context
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Create ImageData from rendered pixels (RGBA format)
        const imageData = new ImageData(
          new Uint8ClampedArray(renderingResult.pixels),
          renderingResult.width,
          renderingResult.height
        );

        // Draw the image data to canvas
        ctx.putImageData(imageData, 0, 0);
      } catch (error) {
        console.error("Error rendering DICOM image:", error);
        setError("Failed to render DICOM image");
      }
    };

    renderDicomImage();
  }, [file, isCodecsInitialized]);

  if (error) {
    return (
      <div className="aspect-video flex items-center justify-center bg-gray-100 text-gray-500">
        <div className="text-center">
          <p className="text-sm">Failed to render DICOM</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!isCodecsInitialized) {
    return (
      <div className="aspect-video flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <p className="text-sm">Initializing DICOM decoders...</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="aspect-video object-contain w-full h-full"
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}
