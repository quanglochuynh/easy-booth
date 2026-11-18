import type { SetStateAction } from "react";
import { create } from "zustand";

interface CaptureStore {
	countdown: number | null;
	shots: string[];
	capturedPreview: string;
	processing: boolean;
	flash: boolean;
	compositeImage: string;
	copyCount: number;
	printing: boolean;
	setCountdown: (value: number | null) => void;
	setShots: (value: string[]) => void;
	setCapturedPreview: (value: string) => void;
	setProcessing: (value: boolean) => void;
	setFlash: (value: boolean) => void;
	setCompositeImage: (value: string) => void;
	setCopyCount: (value: SetStateAction<number>) => void;
	setPrinting: (value: boolean) => void;
}

export const useCaptureStore = create<CaptureStore>((set) => ({
	countdown: null,
	shots: [],
	capturedPreview: "",
	processing: false,
	flash: false,
	compositeImage: "",
	copyCount: 1,
	printing: false,
	setCountdown: (countdown) => set({ countdown }),
	setShots: (shots) => set({ shots }),
	setCapturedPreview: (capturedPreview) => set({ capturedPreview }),
	setProcessing: (processing) => set({ processing }),
	setFlash: (flash) => set({ flash }),
	setCompositeImage: (compositeImage) => set({ compositeImage }),
	setCopyCount: (value) =>
		set((state) => ({
			copyCount: typeof value === "function" ? value(state.copyCount) : value,
		})),
	setPrinting: (printing) => set({ printing }),
}));
