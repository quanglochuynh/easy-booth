import { spawn, execFile, type ChildProcess } from "node:child_process";
import { copyFile, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { app } from "electron";
import { getSessionDirectory } from "../storage/fileManager";
import type { CameraDetection, LiveViewFrame } from "../../types/photobooth";

const execFileAsync = promisify(execFile);
const MAX_FRAME_SIZE = 20 * 1024 * 1024;
const MOCK_FRAME_INTERVAL_MS = 100;

interface LiveViewProcess {
	child: ChildProcess;
	close: Promise<void>;
	intentionalStop: boolean;
}

interface Gphoto2ManagerOptions {
	onFrame: (frame: LiveViewFrame) => void;
	onError: (message: string) => void;
}

export class Gphoto2Manager {
	private mockMode = false;
	private liveViewProcess?: LiveViewProcess;
	private mockTimer?: NodeJS.Timeout;
	private captureQueue: Promise<void> = Promise.resolve();
	private captureNumber = 0;

	constructor(private readonly options: Gphoto2ManagerOptions) {}

	async detect(): Promise<CameraDetection> {
		if (this.mockMode) {
			return { connected: true, model: "Mock Camera", port: "mock" };
		}

		const { stdout } = await this.runGphoto2(["--auto-detect"]);
		const lines = stdout.split(/\r?\n/);
		const cameraLine = lines.find(
			(line) =>
				line.trim().length > 0 &&
				!/^camera\s+port$/i.test(line.trim()) &&
				!/^[-\s]+$/.test(line),
		);

		if (!cameraLine) {
			return { connected: false };
		}

		const match = cameraLine.match(/^\s*(.+?)\s{2,}(\S.*?)\s*$/);
		if (!match) {
			return { connected: false };
		}

		return { connected: true, model: match[1].trim(), port: match[2].trim() };
	}

	async releaseLock(): Promise<boolean> {
		if (process.platform !== "darwin") {
			return false;
		}

		try {
			await execFileAsync("killall", ["ptpcamerad"]);
			return true;
		} catch (error) {
			if (getExitCode(error) === 1) {
				return false;
			}
			throw commandError("Could not release the macOS camera lock", error);
		}
	}

	async startLiveView(): Promise<void> {
		if (this.isLiveViewRunning()) {
			return;
		}

		if (this.mockMode) {
			const sampleFrame = (await this.readMockFrame()).toString("base64");
			this.mockTimer = setInterval(() => {
				this.options.onFrame({
					data: sampleFrame,
					mimeType: "image/png",
				});
			}, MOCK_FRAME_INTERVAL_MS);
			this.options.onFrame({
				data: sampleFrame,
				mimeType: "image/png",
			});
			return;
		}

		const child = spawn("gphoto2", ["--capture-movie", "--stdout"], {
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stderr = "";
		let pending = Buffer.alloc(0);
		let hasSpawned = false;
		const record: LiveViewProcess = {
			child,
			close: new Promise<void>((resolve) =>
				child.once("close", () => resolve()),
			),
			intentionalStop: false,
		};
		this.liveViewProcess = record;

		child.stdout?.on("data", (chunk: Buffer) => {
			pending = Buffer.concat([pending, chunk]);
			pending = this.emitJpegFrames(pending);
		});
		child.stderr?.on("data", (chunk: Buffer) => {
			stderr = appendLimited(stderr, chunk.toString());
		});
		child.once("error", (error) => {
			if (hasSpawned && !record.intentionalStop) {
				this.options.onError(
					`Could not start gphoto2 live view: ${error.message}`,
				);
			}
		});
		child.once("close", (code, signal) => {
			if (this.liveViewProcess === record) {
				this.liveViewProcess = undefined;
			}
			if (hasSpawned && !record.intentionalStop) {
				this.options.onError(
					`gphoto2 live view stopped${code === 0 ? "" : ` (exit ${code ?? signal ?? "unknown"})`}${stderr.trim() ? `: ${stderr.trim()}` : ""}`,
				);
			}
		});

		await new Promise<void>((resolve, reject) => {
			child.once("spawn", () => {
				hasSpawned = true;
				resolve();
			});
			child.once("error", (error) => {
				if (this.liveViewProcess === record) {
					this.liveViewProcess = undefined;
				}
				reject(commandError("Could not start gphoto2 live view", error));
			});
		});
	}

	async stopLiveView(): Promise<void> {
		if (this.mockTimer) {
			clearInterval(this.mockTimer);
			this.mockTimer = undefined;
		}

		const record = this.liveViewProcess;
		if (!record) {
			return;
		}

		record.intentionalStop = true;
		this.liveViewProcess = undefined;
		await stopChild(record);
	}

	capture(): Promise<string> {
		const operation = this.captureQueue.then(() => this.captureOnce());
		this.captureQueue = operation.then(
			() => undefined,
			() => undefined,
		);
		return operation;
	}

	async setMockMode(enabled: boolean): Promise<void> {
		if (this.mockMode === enabled) {
			return;
		}

		const restartLiveView = this.isLiveViewRunning();
		await this.stopLiveView();
		this.mockMode = enabled;
		if (restartLiveView) {
			await this.startLiveView();
		}
	}

	private async captureOnce(): Promise<string> {
		const restartLiveView = this.isLiveViewRunning();
		if (restartLiveView) {
			await this.stopLiveView();
		}

		let capturePath: string | undefined;
		let captureFailure: unknown;
		try {
			const directory = await getSessionDirectory();
			this.captureNumber += 1;
			if (this.mockMode) {
				await delay(500);
				capturePath = join(directory, `shot_${this.captureNumber}.png`);
				await copyFile(this.getMockImagePath(), capturePath);
			} else {
				await this.runGphoto2([
					"--capture-image-and-download",
					"--filename",
					join(directory, "shot_%n.jpg"),
					"--force-overwrite",
				]);
				capturePath = await this.findLatestCapture(directory);
			}
		} catch (error) {
			captureFailure = error;
		}

		if (restartLiveView) {
			try {
				await this.startLiveView();
			} catch (restartError) {
				if (captureFailure) {
					throw new AggregateError(
						[captureFailure, restartError],
						"Capture failed and live view could not be restarted",
					);
				}
				throw restartError;
			}
		}

		if (captureFailure) {
			throw captureFailure;
		}
		if (!capturePath) {
			throw new Error("gphoto2 completed without producing a capture file");
		}
		return capturePath;
	}

	private emitJpegFrames(buffer: Buffer): Buffer {
		const soi = Buffer.from([0xff, 0xd8]);
		const eoi = Buffer.from([0xff, 0xd9]);

		while (buffer.length > 0) {
			const start = buffer.indexOf(soi);
			if (start < 0) {
				return buffer[buffer.length - 1] === 0xff
					? buffer.subarray(buffer.length - 1)
					: Buffer.alloc(0);
			}
			if (start > 0) {
				buffer = buffer.subarray(start);
			}

			const end = buffer.indexOf(eoi, soi.length);
			const nextStart = buffer.indexOf(soi, soi.length);
			if (nextStart >= 0 && (end < 0 || nextStart < end)) {
				buffer = buffer.subarray(nextStart);
				continue;
			}
			if (end < 0) {
				return buffer.length > MAX_FRAME_SIZE ? Buffer.alloc(0) : buffer;
			}

			const frame = buffer.subarray(0, end + eoi.length);
			this.options.onFrame({
				data: frame.toString("base64"),
				mimeType: "image/jpeg",
			});
			buffer = buffer.subarray(end + eoi.length);
		}

		return buffer;
	}

	private async runGphoto2(
		args: string[],
	): Promise<{ stdout: string; stderr: string }> {
		try {
			const result = await execFileAsync("gphoto2", args, {
				encoding: "utf8",
				maxBuffer: 10 * 1024 * 1024,
				timeout: 120_000,
			});
			return { stdout: result.stdout, stderr: result.stderr };
		} catch (error) {
			throw commandError("gphoto2 command failed", error);
		}
	}

	private async findLatestCapture(directory: string): Promise<string> {
		const files = await readdir(directory);
		const captures = await Promise.all(
			files
				.filter((file) => /^shot_\d+\.jpg$/i.test(file))
				.map(async (file) => ({
					path: join(directory, file),
					mtimeMs: (await stat(join(directory, file))).mtimeMs,
				})),
		);
		captures.sort((a, b) => b.mtimeMs - a.mtimeMs);
		if (!captures[0]) {
			throw new Error("gphoto2 completed without producing a JPEG capture");
		}
		return captures[0].path;
	}

	private isLiveViewRunning(): boolean {
		return Boolean(this.mockTimer || this.liveViewProcess);
	}

	private async readMockFrame(): Promise<Buffer> {
		return readFile(this.getMockImagePath());
	}

	private getMockImagePath(): string {
		return join(app.getAppPath(), "resources", "icon.png");
	}
}

async function stopChild(record: LiveViewProcess): Promise<void> {
	const { child, close } = record;
	if (child.exitCode !== null || child.signalCode !== null) {
		await close;
		return;
	}

	child.kill("SIGINT");
	if (await waitForClose(close, 2_000)) {
		return;
	}
	child.kill("SIGTERM");
	if (await waitForClose(close, 1_500)) {
		return;
	}
	child.kill("SIGKILL");
	await close;
}

async function waitForClose(
	close: Promise<void>,
	timeout: number,
): Promise<boolean> {
	return Promise.race([
		close.then(() => true),
		delay(timeout).then(() => false),
	]);
}

function delay(milliseconds: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function appendLimited(current: string, addition: string): string {
	return `${current}${addition}`.slice(-16_384);
}

function getExitCode(error: unknown): number | undefined {
	if (typeof error === "object" && error !== null && "code" in error) {
		const code = error.code;
		return code === 1 || code === "1"
			? 1
			: typeof code === "number"
				? code
				: undefined;
	}
	return undefined;
}

function commandError(message: string, error: unknown): Error {
	if (!(error instanceof Error)) {
		return new Error(`${message}: ${String(error)}`);
	}
	const stderr =
		typeof error === "object" &&
		"stderr" in error &&
		typeof error.stderr === "string"
			? error.stderr.trim()
			: "";
	return new Error(
		`${message}: ${error.message}${stderr ? `: ${stderr}` : ""}`,
		{
			cause: error,
		},
	);
}
