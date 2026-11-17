import type { SetStateAction } from "react";
import { create } from "zustand";
import type { CameraDetection, PrinterInfo } from "../../types/photobooth";

type BoothScreen = "attract" | "setup" | "capture" | "review";

interface BoothStore {
	screen: BoothScreen;
	cameras: CameraDetection[];
	selectedCamera: string;
	cameraConnected: boolean;
	liveView: string;
	cameraError: string;
	printers: PrinterInfo[];
	selectedPrinter: string;
	outputDirectory: string;
	mockMode: boolean;
	countdownDuration: number;
	adminOpen: boolean;
	layoutFamily: "strip" | "postcard";
	shotCount: number;
	selectedFrame: string;
	countdown: number | null;
	shots: string[];
	capturedPreview: string;
	processing: boolean;
	flash: boolean;
	compositeImage: string;
	copyCount: number;
	printing: boolean;
	errorMessage: string;
	setScreen: (value: BoothScreen) => void;
	setCameras: (value: CameraDetection[]) => void;
	setSelectedCamera: (value: string) => void;
	setCameraConnected: (value: boolean) => void;
	setLiveView: (value: string) => void;
	setCameraError: (value: string) => void;
	setPrinters: (value: PrinterInfo[]) => void;
	setSelectedPrinter: (value: string) => void;
	setOutputDirectory: (value: string) => void;
	setMockMode: (value: boolean) => void;
	setCountdownDuration: (value: number) => void;
	setAdminOpen: (value: SetStateAction<boolean>) => void;
	setLayoutFamily: (value: "strip" | "postcard") => void;
	setShotCount: (value: number) => void;
	setSelectedFrame: (value: string) => void;
	setCountdown: (value: number | null) => void;
	setShots: (value: string[]) => void;
	setCapturedPreview: (value: string) => void;
	setProcessing: (value: boolean) => void;
	setFlash: (value: boolean) => void;
	setCompositeImage: (value: string) => void;
	setCopyCount: (value: SetStateAction<number>) => void;
	setPrinting: (value: boolean) => void;
	setErrorMessage: (value: string) => void;
}

export const useBoothStore = create<BoothStore>((set) => ({
	screen: "attract",
	cameras: [],
	selectedCamera: "",
	cameraConnected: false,
	liveView: "",
	cameraError: "",
	printers: [],
	selectedPrinter: "",
	outputDirectory: "",
	mockMode: false,
	countdownDuration: 3,
	adminOpen: false,
	layoutFamily: "postcard",
	shotCount: 3,
	selectedFrame: "",
	countdown: null,
	shots: [],
	capturedPreview: "",
	processing: false,
	flash: false,
	compositeImage: "",
	copyCount: 1,
	printing: false,
	errorMessage: "",
	setScreen: (screen) => set({ screen }),
	setCameras: (cameras) => set({ cameras }),
	setSelectedCamera: (selectedCamera) => set({ selectedCamera }),
	setCameraConnected: (cameraConnected) => set({ cameraConnected }),
	setLiveView: (liveView) => set({ liveView }),
	setCameraError: (cameraError) => set({ cameraError }),
	setPrinters: (printers) => set({ printers }),
	setSelectedPrinter: (selectedPrinter) => set({ selectedPrinter }),
	setOutputDirectory: (outputDirectory) => set({ outputDirectory }),
	setMockMode: (mockMode) => set({ mockMode }),
	setCountdownDuration: (countdownDuration) => set({ countdownDuration }),
	setAdminOpen: (value) =>
		set((state) => ({
			adminOpen: typeof value === "function" ? value(state.adminOpen) : value,
		})),
	setLayoutFamily: (layoutFamily) => set({ layoutFamily }),
	setShotCount: (shotCount) => set({ shotCount }),
	setSelectedFrame: (selectedFrame) => set({ selectedFrame }),
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
	setErrorMessage: (errorMessage) => set({ errorMessage }),
}));
