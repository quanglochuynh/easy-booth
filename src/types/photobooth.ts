export interface CameraDetection {
	connected: boolean;
	model?: string;
	port?: string;
}

export interface LiveViewFrame {
	data: string;
	mimeType: "image/jpeg" | "image/png";
}

export interface PhotoboothAPI {
	detectCamera(): Promise<CameraDetection>;
	detectCameras(): Promise<CameraDetection[]>;
	setSelectedCamera(port: string): Promise<void>;
	releaseCameraLock(): Promise<boolean>;
	startLiveView(): Promise<void>;
	stopLiveView(): Promise<void>;
	capture(): Promise<string>;
	saveComposite(dataUrl: string): Promise<string>;
	getOutputDirectory(): Promise<string>;
	chooseOutputDirectory(): Promise<string | null>;
	listPrinters(): Promise<PrinterInfo[]>;
	getPrinterConfig(): Promise<PrinterConfig>;
	setSelectedPrinter(name: string | null): Promise<PrinterConfig>;
	printImage(request: PrintImageRequest): Promise<void>;
	setMockMode(enabled: boolean): Promise<void>;
	onLiveViewFrame(callback: (frame: LiveViewFrame) => void): () => void;
	onCameraError(callback: (message: string) => void): () => void;
}

export interface PhotoSlot {
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
}

export interface PhotoLayout {
	id: string;
	name: string;
	widthPx: number;
	heightPx: number;
	shotCount: number;
	slots: PhotoSlot[];
	availableFrames: string[];
}

export interface PhotoFrame {
	id: string;
	name: string;
	src: string;
}

export interface PrinterInfo {
	name: string;
	isDefault: boolean;
	status?: string;
}

export interface PrinterConfig {
	selectedPrinter: string | null;
}

export interface PrintPageSize {
	widthInches: number;
	heightInches: number;
}

export interface PrintImageRequest {
	imagePath: string;
	printerName: string;
	copies: number;
	pageSize: PrintPageSize;
}

declare global {
	interface Window {
		photoboothAPI: PhotoboothAPI;
	}
}
