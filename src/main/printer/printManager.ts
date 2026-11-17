import { randomUUID } from "node:crypto";
import {
	mkdir,
	mkdtemp,
	readFile,
	rename,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import { join, resolve, tmpdir } from "node:path";
import { pathToFileURL } from "node:url";
import { app, BrowserWindow, type WebContents } from "electron";
import type {
	PrintImageRequest,
	PrintPageSize,
	PrinterConfig,
	PrinterInfo,
} from "../../types/photobooth";

const MAX_PRINT_IMAGE_SIZE = 100 * 1024 * 1024;
const DEFAULT_PRINTER_CONFIG: PrinterConfig = { selectedPrinter: null };

export class PrintManager {
	private configWriteQueue: Promise<void> = Promise.resolve();

	async listPrinters(webContents: WebContents): Promise<PrinterInfo[]> {
		const printers = await webContents.getPrintersAsync();
		return printers.map((printer) => ({
			name: printer.name,
			isDefault: printer.isDefault,
			status:
				printer.status === undefined ? undefined : String(printer.status),
		}));
	}

	async getPrinterConfig(): Promise<PrinterConfig> {
		await this.configWriteQueue;
		await app.whenReady();
		const configPath = this.getConfigPath();
		let contents: string;
		try {
			contents = await readFile(configPath, "utf8");
		} catch (error) {
			if (isFileNotFound(error)) {
				return { ...DEFAULT_PRINTER_CONFIG };
			}
			throw error;
		}

		let config: unknown;
		try {
			config = JSON.parse(contents);
		} catch (error) {
			throw new Error("Printer configuration contains invalid JSON", { cause: error });
		}
		return parsePrinterConfig(config);
	}

	async setSelectedPrinter(selectedPrinter: string | null): Promise<PrinterConfig> {
		if (
			selectedPrinter !== null &&
			(typeof selectedPrinter !== "string" || !selectedPrinter.trim())
		) {
			throw new TypeError("Printer name must be a non-empty string or null");
		}

		const config = {
			selectedPrinter: selectedPrinter?.trim() ?? null,
		};
		const operation = this.configWriteQueue.then(() =>
			this.writePrinterConfig(config),
		);
		this.configWriteQueue = operation.catch(() => undefined);
		await operation;
		return config;
	}

	async printImage(input: unknown): Promise<void> {
		const request = parsePrintImageRequest(input);
		const imagePath = resolve(request.imagePath);
		const imageStats = await stat(imagePath);
		if (!imageStats.isFile()) {
			throw new TypeError("Print image path must refer to a file");
		}
		if (imageStats.size > MAX_PRINT_IMAGE_SIZE) {
			throw new TypeError("Print image must be a PNG or JPEG under 100 MB");
		}
		const image = await readFile(imagePath);
		if (!isSupportedImage(image)) {
			throw new TypeError("Print image must be a PNG or JPEG under 100 MB");
		}

		const temporaryDirectory = await mkdtemp(
			join(tmpdir(), "easy-booth-print-"),
		);
		const htmlPath = join(temporaryDirectory, "print.html");
		let printWindow: BrowserWindow | undefined;

		try {
			await writeFile(
				htmlPath,
				createPrintDocument(imagePath, request.pageSize),
				"utf8",
			);
			const window = new BrowserWindow({
				show: false,
				width: 400,
				height: 600,
				webPreferences: {
					contextIsolation: true,
					nodeIntegration: false,
					sandbox: true,
				},
			});
			printWindow = window;
			await window.loadFile(htmlPath);
			const imageLoaded = await window.webContents.executeJavaScript(
				"document.images.length === 1 && document.images[0].naturalWidth > 0",
				true,
			);
			if (!imageLoaded) {
				throw new Error("Print image could not be loaded in the print window");
			}
			await new Promise<void>((resolvePrint, rejectPrint) => {
				window.once("closed", () =>
					rejectPrint(new Error("Print window closed before printing completed")),
				);
				window.webContents.print(
					{
						silent: true,
						printBackground: true,
						deviceName: request.printerName,
						copies: request.copies,
						margins: { marginType: "none" },
						pageSize: {
							width: Math.round(request.pageSize.widthInches * 25_400),
							height: Math.round(request.pageSize.heightInches * 25_400),
						},
					},
					(success, failureReason) => {
						if (success) {
							resolvePrint();
						} else {
							rejectPrint(
								new Error(
									`Printing failed${failureReason ? `: ${failureReason}` : ""}`,
								),
							);
						}
					},
				);
			});
		} finally {
			if (printWindow && !printWindow.isDestroyed()) {
				printWindow.destroy();
			}
			await rm(temporaryDirectory, { recursive: true, force: true });
		}
	}

	private async writePrinterConfig(config: PrinterConfig): Promise<void> {
		await app.whenReady();
		const configPath = this.getConfigPath();
		await mkdir(app.getPath("userData"), { recursive: true });
		const temporaryPath = `${configPath}.${randomUUID()}.tmp`;
		await writeFile(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, {
			encoding: "utf8",
			flag: "wx",
		});
		await rename(temporaryPath, configPath);
	}

	private getConfigPath(): string {
		return join(app.getPath("userData"), "photobooth-config.json");
	}
}

function createPrintDocument(
	imagePath: string,
	pageSize: PrintPageSize,
): string {
	const imageUrl = escapeHtml(pathToFileURL(imagePath).href);
	return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src file:; style-src 'unsafe-inline';">
<style>
@page { margin: 0; size: ${pageSize.widthInches}in ${pageSize.heightInches}in; }
html, body { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; }
img { display: block; width: 100%; height: 100%; object-fit: contain; }
</style>
</head>
<body><img src="${imageUrl}" alt=""></body>
</html>`;
}

function parsePrintImageRequest(input: unknown): PrintImageRequest {
	if (!isRecord(input)) {
		throw new TypeError("Print request must be an object");
	}
	const { imagePath, printerName, copies, pageSize } = input;
	if (typeof imagePath !== "string" || !imagePath.trim()) {
		throw new TypeError("Image path must be a non-empty string");
	}
	if (typeof printerName !== "string" || !printerName.trim()) {
		throw new TypeError("Printer name must be a non-empty string");
	}
	if (
		typeof copies !== "number" ||
		!Number.isInteger(copies) ||
		copies < 1 ||
		copies > 99
	) {
		throw new RangeError("Copies must be an integer between 1 and 99");
	}
	if (
		!isRecord(pageSize) ||
		typeof pageSize.widthInches !== "number" ||
		typeof pageSize.heightInches !== "number" ||
		!Number.isFinite(pageSize.widthInches) ||
		!Number.isFinite(pageSize.heightInches) ||
		pageSize.widthInches <= 0 ||
		pageSize.heightInches <= 0 ||
		pageSize.widthInches > 24 ||
		pageSize.heightInches > 24
	) {
		throw new RangeError("Page dimensions must be greater than 0 and no more than 24 inches");
	}

	return {
		imagePath: imagePath.trim(),
		printerName: printerName.trim(),
		copies,
		pageSize: {
			widthInches: pageSize.widthInches,
			heightInches: pageSize.heightInches,
		},
	};
}

function parsePrinterConfig(config: unknown): PrinterConfig {
	if (
		!isRecord(config) ||
		!(
			config.selectedPrinter === null ||
			(typeof config.selectedPrinter === "string" &&
				config.selectedPrinter.trim().length > 0)
		)
	) {
		throw new TypeError("Printer configuration has an invalid selectedPrinter value");
	}
	return {
		selectedPrinter:
			typeof config.selectedPrinter === "string"
				? config.selectedPrinter
				: null,
	};
}

function isSupportedImage(image: Buffer): boolean {
	const isPng =
		image.length >= 8 &&
		image
			.subarray(0, 8)
			.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
	const isJpeg =
		image.length >= 3 &&
		image[0] === 0xff &&
		image[1] === 0xd8 &&
		image[2] === 0xff;
	return isPng || isJpeg;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isFileNotFound(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		error.code === "ENOENT"
	);
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}
