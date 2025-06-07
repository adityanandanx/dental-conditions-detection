"use client";
import Image from "next/image";
import { formatFileSize } from "@/lib/constants";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface ImagePreviewProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  fileName: string;
  fileSize: number;
}

export function ImagePreview({
  src,
  alt,
  width,
  height,
  fileName,
  fileSize,
}: ImagePreviewProps) {
  return (
    <Dialog>
      <DialogTrigger className="aspect-video relative w-full h-full cursor-pointer">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          unoptimized
        />
      </DialogTrigger>
      <DialogContent className="flex flex-col max-w-[90%] sm:max-w-[90%] max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
          <DialogDescription>
            {width} × {height} • {formatFileSize(fileSize)}
          </DialogDescription>
        </DialogHeader>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="object-contain rounded-md overflow-hidden w-full h-full bg-secondary"
          unoptimized
        />
        <DialogFooter className="self-center">
          <DialogClose asChild>
            <Button variant={"secondary"}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
