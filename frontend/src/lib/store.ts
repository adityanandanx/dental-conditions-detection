import { create } from "zustand";
import { ConvertedDicomData } from "./types";

interface DroppedFilesState {
  files: ConvertedDicomData[];
  addFile: (file: ConvertedDicomData) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  updateFile: (id: string, updates: Partial<ConvertedDicomData>) => void;
}

export const useDroppedFilesStore = create<DroppedFilesState>((set) => ({
  files: [],
  addFile: (file) =>
    set((state) => ({
      files: [...state.files, file],
    })),
  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
    })),
  clearFiles: () => set({ files: [] }),
  updateFile: (id, updates) =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, ...updates } : file
      ),
    })),
}));
