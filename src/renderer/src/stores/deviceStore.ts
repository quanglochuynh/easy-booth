import { create } from "zustand";
import type { CameraDetection, PrinterInfo } from "../../../types/photobooth";

interface DeviceStore {
	cameras: CameraDetection[];
	selectedCamera: string;
	cameraConnected: boolean;
	liveView: string;
	cameraError: string;
	printers: PrinterInfo[];
	selectedPrinter: string;
	setCameras: (value: CameraDetection[]) => void;
	setSelectedCamera: (value: string) => void;
	setCameraConnected: (value: boolean) => void;
	setLiveView: (value: string) => void;
	setCameraError: (value: string) => void;
	setPrinters: (value: PrinterInfo[]) => void;
	setSelectedPrinter: (value: string) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
	cameras: [],
	selectedCamera: "",
	cameraConnected: false,
	liveView: "",
	cameraError: "",
	printers: [],
	selectedPrinter: "",
	setCameras: (cameras) => set({ cameras }),
	setSelectedCamera: (selectedCamera) => set({ selectedCamera }),
	setCameraConnected: (cameraConnected) => set({ cameraConnected }),
	setLiveView: (liveView) => set({ liveView }),
	setCameraError: (cameraError) => set({ cameraError }),
	setPrinters: (printers) => set({ printers }),
	setSelectedPrinter: (selectedPrinter) => set({ selectedPrinter }),
}));
