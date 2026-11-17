import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { join } from "path";
import icon from "../../resources/icon.png?asset";
import { Gphoto2Manager } from "./camera/gphoto2Manager";
import { PrintManager } from "./printer/printManager";
import {
	getOutputDirectory,
	saveComposite,
	setOutputDirectory,
} from "./storage/fileManager";

const cameraManager = new Gphoto2Manager({
	onFrame: (frame) => {
		for (const window of BrowserWindow.getAllWindows()) {
			window.webContents.send("camera:liveview-frame", frame);
		}
	},
	onError: (message) => {
		for (const window of BrowserWindow.getAllWindows()) {
			window.webContents.send("camera:error", message);
		}
	},
});
const printManager = new PrintManager();

function registerCameraIpc(): void {
	ipcMain.handle("camera:detect", () => cameraManager.detect());
	ipcMain.handle("camera:detect-all", () => cameraManager.detectCameras());
	ipcMain.handle("camera:set-selected", (_event, port: unknown) => {
		if (typeof port !== "string") {
			throw new TypeError("Camera port must be a string");
		}
		return cameraManager.setSelectedCamera(port);
	});
	ipcMain.handle("camera:release-lock", () => cameraManager.releaseLock());
	ipcMain.handle("camera:liveview-start", () => cameraManager.startLiveView());
	ipcMain.handle("camera:liveview-stop", () => cameraManager.stopLiveView());
	ipcMain.handle("camera:capture", () => cameraManager.capture());
	ipcMain.handle("storage:save-composite", (_event, dataUrl: unknown) => {
		if (typeof dataUrl !== "string") {
			throw new TypeError("Composite data must be a string");
		}
		return saveComposite(dataUrl);
	});
	ipcMain.handle("storage:get-output-directory", () => getOutputDirectory());
	ipcMain.handle("storage:choose-output-directory", async () => {
		const window =
			BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
		const options = {
			properties: ["openDirectory", "createDirectory"] as (
				| "openDirectory"
				| "createDirectory"
			)[],
		};
		const result = window
			? await dialog.showOpenDialog(window, options)
			: await dialog.showOpenDialog(options);
		if (result.canceled || !result.filePaths[0]) {
			return null;
		}
		return setOutputDirectory(result.filePaths[0]);
	});
	ipcMain.handle("camera:set-mock-mode", (_event, enabled: unknown) => {
		if (typeof enabled !== "boolean") {
			throw new TypeError("Mock mode must be a boolean");
		}
		return cameraManager.setMockMode(enabled);
	});
	ipcMain.handle("printer:list", (event) =>
		printManager.listPrinters(event.sender),
	);
	ipcMain.handle("printer:get-config", () => printManager.getPrinterConfig());
	ipcMain.handle("printer:set-selected", (_event, name: unknown) => {
		if (name !== null && typeof name !== "string") {
			throw new TypeError("Printer name must be a string or null");
		}
		return printManager.setSelectedPrinter(name);
	});
	ipcMain.handle("printer:print-image", (_event, request: unknown) =>
		printManager.printImage(request),
	);
}

function createWindow(): void {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 900,
		height: 670,
		show: false,
		autoHideMenuBar: true,
		...(process.platform === "linux" ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, "../preload/index.mjs"),
			sandbox: false,
		},
	});

	mainWindow.on("ready-to-show", () => {
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env.ELECTRON_RENDERER_URL) {
		mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
	} else {
		mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	registerCameraIpc();

	// Set app user model id for windows
	electronApp.setAppUserModelId("com.electron");

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on("browser-window-created", (_, window) => {
		optimizer.watchWindowShortcuts(window);
	});

	// IPC test
	ipcMain.on("ping", () => console.log("pong"));

	createWindow();

	app.on("activate", () => {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

let stoppingCamera = false;
app.on("before-quit", (event) => {
	if (stoppingCamera) {
		return;
	}

	event.preventDefault();
	stoppingCamera = true;
	void cameraManager
		.stopLiveView()
		.catch((error: unknown) =>
			console.error("Could not stop camera live view", error),
		)
		.finally(() => app.quit());
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
