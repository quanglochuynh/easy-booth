import type { ElectronAPI } from "@electron-toolkit/preload";
import type { PhotoboothAPI } from "../types/photobooth";

declare global {
	interface Window {
		electron: ElectronAPI;
		api: unknown;
		photoboothAPI: PhotoboothAPI;
	}
}
