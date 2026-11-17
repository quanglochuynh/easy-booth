import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";
import type { LiveViewFrame, PhotoboothAPI } from "../types/photobooth";

// Custom APIs for renderer
const photoboothAPI: PhotoboothAPI = {
	detectCamera: () => ipcRenderer.invoke("camera:detect"),
	releaseCameraLock: () => ipcRenderer.invoke("camera:release-lock"),
	startLiveView: () => ipcRenderer.invoke("camera:liveview-start"),
	stopLiveView: () => ipcRenderer.invoke("camera:liveview-stop"),
	capture: () => ipcRenderer.invoke("camera:capture"),
	saveComposite: (dataUrl) => ipcRenderer.invoke("storage:save-composite", dataUrl),
	listPrinters: () => ipcRenderer.invoke("printer:list"),
	getPrinterConfig: () => ipcRenderer.invoke("printer:get-config"),
	setSelectedPrinter: (name) =>
		ipcRenderer.invoke("printer:set-selected", name),
	printImage: (request) => ipcRenderer.invoke("printer:print-image", request),
	setMockMode: (enabled) => ipcRenderer.invoke("camera:set-mock-mode", enabled),
	onLiveViewFrame: (callback) => {
		const listener = (_event: Electron.IpcRendererEvent, frame: LiveViewFrame) =>
			callback(frame);
		ipcRenderer.on("camera:liveview-frame", listener);
		return () => ipcRenderer.removeListener("camera:liveview-frame", listener);
	},
	onCameraError: (callback) => {
		const listener = (_event: Electron.IpcRendererEvent, message: string) =>
			callback(message);
		ipcRenderer.on("camera:error", listener);
		return () => ipcRenderer.removeListener("camera:error", listener);
	},
};
const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld("electron", electronAPI);
		contextBridge.exposeInMainWorld("api", api);
		contextBridge.exposeInMainWorld("photoboothAPI", photoboothAPI);
	} catch (error) {
		console.error(error);
	}
} else {
	// @ts-ignore (define in dts)
	window.electron = electronAPI;
	// @ts-ignore (define in dts)
	window.api = api;
	// @ts-ignore (define in dts)
	window.photoboothAPI = photoboothAPI;
}
