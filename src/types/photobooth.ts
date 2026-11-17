export type PhotoboothAPI = Record<string, never>;

export interface PhotoSlot {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface PhotoLayout {
	id: string;
	name: string;
	widthInches: number;
	heightInches: number;
	slots: PhotoSlot[];
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

declare global {
	interface Window {
		photoboothAPI: PhotoboothAPI;
	}
}
