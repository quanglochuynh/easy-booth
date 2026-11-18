import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDeviceStore } from "../stores/deviceStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useUiStore } from "../stores/uiStore";

interface AdminModalProps {
	onCameraChange: (port: string) => Promise<void>;
	onPrinterChange: (name: string) => Promise<void>;
	onCountdownChange: (seconds: number) => void;
	onCaptureCommandAtChange: (seconds: number) => void;
	onMockModeChange: (enabled: boolean) => Promise<void>;
	onChooseOutputDirectory: () => Promise<void>;
	onRefreshCameras: () => Promise<void>;
	onTestShutter: () => Promise<void>;
	onPrintTestPage: () => Promise<void>;
}

function AdminModal({
	onCameraChange,
	onPrinterChange,
	onCountdownChange,
	onCaptureCommandAtChange,
	onMockModeChange,
	onChooseOutputDirectory,
	onRefreshCameras,
	onTestShutter,
	onPrintTestPage,
}: AdminModalProps) {
	const {
		cameras,
		selectedCamera,
		printers,
		selectedPrinter,
	} = useDeviceStore(
		useShallow((state) => ({
			cameras: state.cameras,
			selectedCamera: state.selectedCamera,
			printers: state.printers,
			selectedPrinter: state.selectedPrinter,
		})),
	);
	const {
		countdownDuration,
		captureCommandAt,
		mockMode,
		outputDirectory,
	} = useSettingsStore(
		useShallow((state) => ({
			countdownDuration: state.countdownDuration,
			captureCommandAt: state.captureCommandAt,
			mockMode: state.mockMode,
			outputDirectory: state.outputDirectory,
		})),
	);
	const { adminOpen, setAdminOpen } = useUiStore();
	const [busyAction, setBusyAction] = useState("");
	const [feedback, setFeedback] = useState("");

	if (!adminOpen) {
		return null;
	}

	const runAction = async (label: string, action: () => Promise<void>) => {
		setBusyAction(label);
		setFeedback("");
		try {
			await action();
			setFeedback(`${label} completed.`);
		} catch (error) {
			setFeedback(
				`${label} failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		} finally {
			setBusyAction("");
		}
	};

	const selectCamera = (port: string) => {
		void runAction("Camera selection", () => onCameraChange(port));
	};

	const selectPrinter = (name: string) => {
		void runAction("Printer selection", () => onPrinterChange(name));
	};

	const toggleMockMode = (enabled: boolean) => {
		void runAction("Mock camera mode", () => onMockModeChange(enabled));
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
			<section
				aria-labelledby="admin-title"
				aria-modal="true"
				className="max-h-[min(90vh,900px)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-neutral-900 p-6 text-left shadow-2xl shadow-black/50 sm:p-8"
				role="dialog"
			>
				<header className="mb-7 flex items-start justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
							Easy Booth
						</p>
						<h2 className="mt-2 text-2xl font-semibold" id="admin-title">
							Admin settings
						</h2>
						<p className="mt-1 text-sm text-neutral-400">
							Manage connected equipment and session defaults.
						</p>
					</div>
					<button
						aria-label="Close settings"
						className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-2xl text-neutral-300 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300"
						disabled={Boolean(busyAction)}
						onClick={() => setAdminOpen(false)}
						type="button"
					>
						×
					</button>
				</header>

				<div className="space-y-6">
					<section className="rounded-2xl border border-white/10 bg-black/20 p-5">
						<div className="mb-4 flex items-center justify-between gap-3">
							<h3 className="font-semibold">Camera</h3>
							<button
								className="min-h-10 rounded-xl border border-white/10 px-4 text-sm text-neutral-300 transition hover:bg-white/10 disabled:opacity-50"
								disabled={Boolean(busyAction)}
								onClick={() => void runAction("Camera scan", onRefreshCameras)}
								type="button"
							>
								Scan again
							</button>
						</div>
						<label className="mb-4 block text-sm text-neutral-400">
							Connected camera
							<select
								className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-neutral-800 px-3 text-white outline-none focus:border-amber-300"
								disabled={Boolean(busyAction) || cameras.length === 0}
								onChange={(event) => selectCamera(event.target.value)}
								value={selectedCamera}
							>
								{cameras.length === 0 ? (
									<option value="">No cameras detected</option>
								) : (
									cameras.map((camera) => (
										<option key={camera.port} value={camera.port}>
											{camera.model} · {camera.port}
										</option>
									))
								)}
							</select>
						</label>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<label className="flex min-h-12 items-center gap-3 text-sm text-neutral-300">
								<input
									checked={mockMode}
									className="h-5 w-5 accent-amber-300"
									disabled={Boolean(busyAction)}
									onChange={(event) => toggleMockMode(event.target.checked)}
									type="checkbox"
								/>
								Mock camera mode
							</label>
							<button
								className="min-h-12 rounded-xl bg-amber-300 px-5 font-semibold text-neutral-950 transition hover:bg-amber-200 disabled:opacity-50"
								disabled={Boolean(busyAction)}
								onClick={() => void runAction("Shutter test", onTestShutter)}
								type="button"
							>
								Test shutter
							</button>
						</div>
					</section>

					<section className="rounded-2xl border border-white/10 bg-black/20 p-5">
						<h3 className="mb-4 font-semibold">Printer</h3>
						<label className="mb-4 block text-sm text-neutral-400">
							Default printer
							<select
								className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-neutral-800 px-3 text-white outline-none focus:border-amber-300"
								disabled={Boolean(busyAction) || printers.length === 0}
								onChange={(event) => selectPrinter(event.target.value)}
								value={selectedPrinter}
							>
								{printers.length === 0 ? (
									<option value="">No printers detected</option>
								) : (
									printers.map((printer) => (
										<option key={printer.name} value={printer.name}>
											{printer.name}
											{printer.isDefault ? " · System default" : ""}
										</option>
									))
								)}
							</select>
						</label>
						<button
							className="min-h-12 rounded-xl border border-amber-300/50 px-5 font-semibold text-amber-200 transition hover:bg-amber-300/10 disabled:opacity-50"
							disabled={Boolean(busyAction) || !selectedPrinter}
							onClick={() =>
								void runAction("Printer test page", onPrintTestPage)
							}
							type="button"
						>
							Print test page
						</button>
					</section>

					<section className="grid gap-5 rounded-2xl border border-white/10 bg-black/20 p-5 sm:grid-cols-2">
						<label className="text-sm text-neutral-400">
							Countdown duration
							<select
								className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-neutral-800 px-3 text-white outline-none focus:border-amber-300"
								onChange={(event) =>
									onCountdownChange(Number(event.target.value))
								}
								value={countdownDuration}
							>
								<option value={3}>3 seconds</option>
								<option value={4}>4 seconds</option>
								<option value={5}>5 seconds</option>
								<option value={6}>6 seconds</option>
							</select>
						</label>
						<label className="text-sm text-neutral-400">
							Start sending capture command at
							<select
								className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-neutral-800 px-3 text-white outline-none focus:border-amber-300"
								onChange={(event) =>
									onCaptureCommandAtChange(Number(event.target.value))
								}
								value={captureCommandAt}
							>
								<option value={0}>0 seconds</option>
								<option value={1}>1 second</option>
								<option value={2}>2 seconds</option>
								<option value={3}>3 seconds</option>
							</select>
						</label>
						<div className="text-sm text-neutral-400">
							Output save directory
							<p className="mt-2 break-all rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-xs leading-5 text-neutral-300">
								{outputDirectory || "Loading…"}
							</p>
							<button
								className="mt-2 min-h-11 rounded-xl border border-white/10 px-4 text-sm text-neutral-200 transition hover:bg-white/10 disabled:opacity-50"
								disabled={Boolean(busyAction)}
								onClick={() =>
									void runAction("Output folder", onChooseOutputDirectory)
								}
								type="button"
							>
								Choose folder
							</button>
						</div>
					</section>
				</div>

				{feedback && (
					<p
						aria-live="polite"
						className={`mt-5 text-sm ${feedback.includes("failed:") ? "text-rose-300" : "text-emerald-300"}`}
						role="status"
					>
						{busyAction ? `${busyAction}…` : feedback}
					</p>
				)}
			</section>
		</div>
	);
}

export default AdminModal;
