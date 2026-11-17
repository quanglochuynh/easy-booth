import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminModal from "./components/AdminModal";
import { photoLayouts } from "../../config/layouts";
import { composite } from "../../utils/canvasCompositor";
import type {
	CameraDetection,
	PhotoLayout,
	PrinterInfo,
} from "../../types/photobooth";

type BoothScreen = "attract" | "setup" | "capture" | "review";

const COUNTDOWN_STORAGE_KEY = "easy-booth-countdown";
const MOCK_MODE_STORAGE_KEY = "easy-booth-mock-mode";

function App() {
	const [screen, setScreen] = useState<BoothScreen>("attract");
	const [cameras, setCameras] = useState<CameraDetection[]>([]);
	const [selectedCamera, setSelectedCamera] = useState("");
	const [cameraConnected, setCameraConnected] = useState(false);
	const [liveView, setLiveView] = useState("");
	const [cameraError, setCameraError] = useState("");
	const [printers, setPrinters] = useState<PrinterInfo[]>([]);
	const [selectedPrinter, setSelectedPrinter] = useState("");
	const [outputDirectory, setOutputDirectory] = useState("");
	const [mockMode, setMockMode] = useState(false);
	const [countdownDuration, setCountdownDuration] = useState(3);
	const [adminOpen, setAdminOpen] = useState(false);
	const [layoutFamily, setLayoutFamily] = useState<"strip" | "postcard">(
		"postcard",
	);
	const [shotCount, setShotCount] = useState(3);
	const [selectedFrame, setSelectedFrame] = useState("");
	const [countdown, setCountdown] = useState<number | null>(null);
	const [shots, setShots] = useState<string[]>([]);
	const [capturedPreview, setCapturedPreview] = useState("");
	const [processing, setProcessing] = useState(false);
	const [flash, setFlash] = useState(false);
	const [compositeImage, setCompositeImage] = useState("");
	const [copyCount, setCopyCount] = useState(1);
	const [printing, setPrinting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const audioContext = useRef<AudioContext | null>(null);

	const layout = useMemo(
		() =>
			photoLayouts.find(
				(item) =>
					item.id.startsWith(layoutFamily) && item.shotCount === shotCount,
			) ??
				photoLayouts.find((item) => item.id === "postcard-4x6-3-photo") ??
				(() => {
					throw new Error("No default photo layout is configured.");
				})(),
		[layoutFamily, shotCount],
	);
	const availableFrames = layout.availableFrames;

	const refreshCameras = useCallback(async () => {
		const detected = await window.photoboothAPI.detectCameras();
		setCameras(detected);
		setCameraConnected(detected.length > 0);
		if (!detected.some((camera) => camera.port === selectedCamera)) {
			setSelectedCamera(detected[0]?.port ?? "");
		}
		return detected;
	}, [selectedCamera]);

	useEffect(() => {
		let mounted = true;
		const initialize = async () => {
			try {
				const savedMockMode =
					window.localStorage.getItem(MOCK_MODE_STORAGE_KEY) === "true";
				if (savedMockMode) {
					await window.photoboothAPI.setMockMode(true);
				}
				const [
					cameraResult,
					printersResult,
					printerConfigResult,
					directoryResult,
				] = await Promise.allSettled([
					window.photoboothAPI.detectCameras(),
					window.photoboothAPI.listPrinters(),
					window.photoboothAPI.getPrinterConfig(),
					window.photoboothAPI.getOutputDirectory(),
				]);
				if (!mounted) {
					return;
				}
				setMockMode(savedMockMode);
				if (cameraResult.status === "fulfilled") {
					setCameras(cameraResult.value);
					setCameraConnected(cameraResult.value.length > 0);
					setSelectedCamera(cameraResult.value[0]?.port ?? "");
				} else {
					setCameraError(errorText(cameraResult.reason));
				}
				if (printersResult.status === "fulfilled") {
					setPrinters(printersResult.value);
					const printerConfig =
						printerConfigResult.status === "fulfilled"
							? printerConfigResult.value
							: null;
					setSelectedPrinter(
						printerConfig?.selectedPrinter ??
							printersResult.value.find((printer) => printer.isDefault)?.name ??
							"",
					);
				} else {
					setErrorMessage(errorText(printersResult.reason));
				}
				if (printerConfigResult.status === "rejected") {
					setErrorMessage(errorText(printerConfigResult.reason));
				}
				if (directoryResult.status === "fulfilled") {
					setOutputDirectory(directoryResult.value);
				} else {
					setErrorMessage(errorText(directoryResult.reason));
				}
				const savedCountdown = Number(
					window.localStorage.getItem(COUNTDOWN_STORAGE_KEY),
				);
				if ([3, 5, 8].includes(savedCountdown)) {
					setCountdownDuration(savedCountdown);
				}
			} catch (error) {
				if (mounted) {
					setErrorMessage(errorText(error));
				}
			}
		};
		void initialize();

		const unsubscribeFrame = window.photoboothAPI.onLiveViewFrame((frame) => {
			setLiveView(`data:${frame.mimeType};base64,${frame.data}`);
		});
		const unsubscribeCameraError = window.photoboothAPI.onCameraError(
			(message) => setCameraError(message),
		);
		return () => {
			mounted = false;
			unsubscribeFrame();
			unsubscribeCameraError();
			if (audioContext.current) {
				void audioContext.current.close();
			}
		};
	}, []);

	useEffect(() => {
		const onShortcut = (event: KeyboardEvent) => {
			if (
				(event.ctrlKey || event.metaKey) &&
				event.shiftKey &&
				event.key.toLowerCase() === "s"
			) {
				event.preventDefault();
				setAdminOpen((open) => !open);
			}
		};
		window.addEventListener("keydown", onShortcut);
		return () => window.removeEventListener("keydown", onShortcut);
	}, []);

	useEffect(() => {
		if (!availableFrames.includes(selectedFrame)) {
			setSelectedFrame(availableFrames[0] ?? "");
		}
	}, [availableFrames, selectedFrame]);

	const selectedFrameSource = selectedFrame
		? new URL(selectedFrame, window.location.href).href
		: "";

	const chooseCamera = async (port: string) => {
		await window.photoboothAPI.setSelectedCamera(port);
		setSelectedCamera(port);
		setCameraError("");
	};

	const refreshCameraList = async () => {
		const detected = await refreshCameras();
		if (detected[0]?.port && detected[0].port !== "mock") {
			await window.photoboothAPI.setSelectedCamera(detected[0].port);
			setSelectedCamera(detected[0].port);
		}
	};

	const choosePrinter = async (name: string) => {
		const config = await window.photoboothAPI.setSelectedPrinter(name || null);
		setSelectedPrinter(config.selectedPrinter ?? "");
	};

	const toggleMockMode = async (enabled: boolean) => {
		await window.photoboothAPI.setMockMode(enabled);
		window.localStorage.setItem(MOCK_MODE_STORAGE_KEY, String(enabled));
		setMockMode(enabled);
		const detected = await window.photoboothAPI.detectCameras();
		setCameras(detected);
		setCameraConnected(detected.length > 0);
		const port = detected[0]?.port ?? "";
		setSelectedCamera(port);
		if (port && port !== "mock") {
			await window.photoboothAPI.setSelectedCamera(port);
		}
	};

	const changeCountdownDuration = (seconds: number) => {
		setCountdownDuration(seconds);
		window.localStorage.setItem(COUNTDOWN_STORAGE_KEY, String(seconds));
	};

	const chooseOutputDirectory = async () => {
		const directory = await window.photoboothAPI.chooseOutputDirectory();
		if (directory) {
			setOutputDirectory(directory);
		}
	};

	const testShutter = async () => {
		await window.photoboothAPI.capture();
	};

	const printTestPage = async () => {
		if (!selectedPrinter) {
			throw new Error("Select a printer before printing a test page.");
		}
		const testPage = createTestPage();
		const imagePath = await window.photoboothAPI.saveComposite(testPage);
		await window.photoboothAPI.printImage({
			imagePath,
			printerName: selectedPrinter,
			copies: 1,
			pageSize: { widthInches: 4, heightInches: 6 },
		});
	};

	const startSetup = () => {
		setErrorMessage("");
		setScreen("setup");
	};

	const startCaptureSession = async () => {
		setErrorMessage("");
		setCameraError("");
		setShots([]);
		setCompositeImage("");
		setCapturedPreview("");
		setCopyCount(1);
		setScreen("capture");
		try {
			if (!audioContext.current) {
				audioContext.current = new AudioContext();
			}
			await audioContext.current.resume();
			await window.photoboothAPI.startLiveView();
			await runCaptureSequence(layout, selectedFrameSource);
		} catch (error) {
			setErrorMessage(errorText(error));
			setProcessing(false);
			setCountdown(null);
			try {
				await window.photoboothAPI.stopLiveView();
			} catch (stopError) {
				setErrorMessage(
					`${errorText(error)}. Live view could not be stopped: ${errorText(stopError)}`,
				);
			}
		}
	};

	const runCaptureSequence = async (
		selectedLayout: PhotoLayout,
		frameSource: string,
	) => {
		const captured: string[] = [];
		for (let shot = 0; shot < selectedLayout.shotCount; shot += 1) {
			for (let seconds = countdownDuration; seconds > 0; seconds -= 1) {
				setCountdown(seconds);
				playCountdownTone(audioContext.current, seconds === 1);
				await delay(1_000);
			}
			setCountdown(null);
			setFlash(true);
			await delay(180);
			setFlash(false);
			setProcessing(true);
			const path = await window.photoboothAPI.capture();
			setProcessing(false);
			captured.push(path);
			setShots([...captured]);
			setCapturedPreview(toFileUrl(path));
			await delay(750);
			setCapturedPreview("");
		}
		await window.photoboothAPI.stopLiveView();
		setLiveView("");
		const result = await composite(
			selectedLayout,
			captured,
			frameSource || undefined,
		);
		setShots(captured);
		setCompositeImage(result);
		setScreen("review");
	};

	const cancelCapture = async () => {
		setCountdown(null);
		setProcessing(false);
		setCapturedPreview("");
		try {
			await window.photoboothAPI.stopLiveView();
			setLiveView("");
			setScreen("setup");
		} catch (error) {
			setErrorMessage(`Could not stop live view: ${errorText(error)}`);
		}
	};

	const printPhotos = async () => {
		if (!selectedPrinter) {
			setErrorMessage("Choose a printer in Admin Settings before printing.");
			return;
		}
		setErrorMessage("");
		setPrinting(true);
		try {
			const imagePath = await window.photoboothAPI.saveComposite(compositeImage);
			await window.photoboothAPI.printImage({
				imagePath,
				printerName: selectedPrinter,
				copies: copyCount,
				pageSize: {
					widthInches: layout.widthPx / 300,
					heightInches: layout.heightPx / 300,
				},
			});
			await delay(5_000);
			setPrinting(false);
			setScreen("attract");
			setShots([]);
			setCompositeImage("");
		} catch (error) {
			setPrinting(false);
			setErrorMessage(`Printing failed: ${errorText(error)}`);
		}
	};

	const cameraStatus = mockMode
		? "Mock camera ready"
		: cameraConnected
			? "Camera connected"
			: "Camera not connected";

	return (
		<main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white selection:bg-amber-200 selection:text-neutral-950">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(245,158,11,0.12),transparent_55%)]" />
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.035]" />

			<div className="absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs font-medium text-neutral-300 backdrop-blur">
				<span
					className={`h-2.5 w-2.5 rounded-full ${cameraConnected ? "bg-emerald-400" : "bg-rose-400"}`}
				/>
				{cameraStatus}
			</div>

			{screen === "attract" && (
				<section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
					<div className="pointer-events-none absolute left-[12%] top-[18%] h-40 w-40 animate-float rounded-full bg-amber-300/10 blur-3xl" />
					<div className="pointer-events-none absolute bottom-[15%] right-[12%] h-56 w-56 animate-pulse rounded-full bg-orange-500/10 blur-3xl" />
					<div className="mb-8 flex h-20 w-20 animate-float items-center justify-center rounded-[1.75rem] border border-amber-100/20 bg-linear-to-br from-amber-200 to-amber-500 text-4xl text-neutral-950 shadow-2xl shadow-amber-500/20">
						✦
					</div>
					<p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">
						Easy Booth
					</p>
					<h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl md:text-7xl">
						Make this moment
						<br />
						<span className="bg-linear-to-r from-amber-100 via-amber-300 to-orange-300 bg-clip-text text-transparent">
							a little more memorable.
						</span>
					</h1>
					<p className="mt-6 max-w-xl text-pretty text-base leading-7 text-neutral-400 sm:text-lg">
						Gather your crew, find your pose, and let the fun begin.
					</p>
					<button
						className="mt-10 flex min-h-16 items-center gap-3 rounded-2xl bg-amber-300 px-8 text-base font-semibold text-neutral-950 shadow-xl shadow-amber-500/15 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
						onClick={startSetup}
						type="button"
					>
						<span aria-hidden="true">✦</span>
						Tap Anywhere to Start
					</button>
					<p className="mt-5 text-xs text-neutral-500">
						Admin settings · Ctrl/Cmd + Shift + S
					</p>
				</section>
			)}

			{screen === "setup" && (
				<section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-20 sm:px-8">
					<header className="mb-8">
						<p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
							Step 1 · Make it yours
						</p>
						<h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
							Choose your layout
						</h1>
						<p className="mt-2 text-neutral-400">
							Select a print size, photo count, and frame.
						</p>
					</header>
					<div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
						<div>
							<h2 className="mb-3 text-sm font-semibold text-neutral-300">
								Print layout
							</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								{(
									[
										{
											id: "strip",
											title: "2 × 6 Photo Strip",
											subtitle: "Classic vertical strip",
											selected: layoutFamily === "strip",
										},
										{
											id: "postcard",
											title: "4 × 6 Grid",
											subtitle: "A postcard to keep",
											selected: layoutFamily === "postcard",
										},
									] as const
								).map((option) => (
									<button
										aria-pressed={option.selected}
										className={`flex min-h-52 items-center gap-5 rounded-2xl border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
											option.selected
												? "border-amber-300 bg-amber-300/10"
												: "border-white/10 bg-white/3 hover:border-white/25"
										}`}
										key={option.id}
										onClick={() => setLayoutFamily(option.id)}
										type="button"
									>
										<LayoutThumbnail family={option.id} shots={shotCount} />
										<span>
											<span className="block text-lg font-semibold">
												{option.title}
											</span>
											<span className="mt-1 block text-sm text-neutral-400">
												{option.subtitle}
											</span>
										</span>
									</button>
								))}
							</div>
							<div className="mt-5">
								<h2 className="mb-3 text-sm font-semibold text-neutral-300">
									Photos per print
								</h2>
								<div className="flex gap-3">
									{[3, 4].map((count) => (
										<button
											aria-pressed={shotCount === count}
											className={`min-h-12 min-w-24 rounded-xl border px-5 font-semibold transition ${
												shotCount === count
													? "border-amber-300 bg-amber-300 text-neutral-950"
													: "border-white/10 bg-white/3 text-neutral-200 hover:bg-white/10"
											}`}
											key={count}
											onClick={() => setShotCount(count)}
											type="button"
										>
											{count} shots
										</button>
									))}
								</div>
							</div>
						</div>
						<div>
							<h2 className="mb-3 text-sm font-semibold text-neutral-300">
								Frame overlay
							</h2>
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
								<button
									aria-pressed={!selectedFrame}
									className={`flex min-h-28 items-center gap-4 rounded-2xl border p-4 text-left transition ${
										!selectedFrame
											? "border-amber-300 bg-amber-300/10"
											: "border-white/10 bg-white/3 hover:border-white/25"
									}`}
									onClick={() => setSelectedFrame("")}
									type="button"
								>
									<div className="flex h-20 w-16 items-center justify-center rounded-lg border border-dashed border-white/20 text-xs text-neutral-500">
										None
									</div>
									<span className="font-medium">No frame</span>
								</button>
								{availableFrames.map((frame) => (
									<button
										aria-pressed={selectedFrame === frame}
										className={`flex min-h-28 items-center gap-4 rounded-2xl border p-4 text-left transition ${
											selectedFrame === frame
												? "border-amber-300 bg-amber-300/10"
												: "border-white/10 bg-white/3 hover:border-white/25"
										}`}
										key={frame}
										onClick={() => setSelectedFrame(frame)}
										type="button"
									>
										<div className="relative h-20 w-16 overflow-hidden rounded-lg bg-neutral-700">
											<div className="absolute inset-2 grid grid-rows-3 gap-1">
												{[0, 1, 2].map((slot) => (
													<span
														className="rounded-sm bg-neutral-500"
														key={slot}
													/>
												))}
											</div>
											<img
												alt=""
												className="absolute inset-0 h-full w-full object-cover"
												src={new URL(frame, window.location.href).href}
											/>
										</div>
										<span className="font-medium">{frameName(frame)}</span>
									</button>
								))}
							</div>
						</div>
					</div>
					{errorMessage && (
						<p className="mt-5 text-sm text-rose-300" role="alert">
							{errorMessage}
						</p>
					)}
					<footer className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
						<button
							className="min-h-14 rounded-xl border border-white/10 px-6 font-semibold text-neutral-300 transition hover:bg-white/10"
							onClick={() => setScreen("attract")}
							type="button"
						>
							Back
						</button>
						<button
							className="min-h-14 rounded-xl bg-amber-300 px-7 font-semibold text-neutral-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
							disabled={!cameraConnected}
							onClick={() => void startCaptureSession()}
							type="button"
						>
							{cameraConnected ? "Start photo session" : "Connect a camera to start"}
						</button>
					</footer>
				</section>
			)}

			{screen === "capture" && (
				<section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-5 py-20 sm:px-8">
					<header className="mb-5 text-center">
						<p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
							Photo {Math.min(shots.length + 1, layout.shotCount)} of{" "}
							{layout.shotCount}
						</p>
						<h1 className="mt-2 text-3xl font-semibold">Find your pose!</h1>
						{cameraError && (
							<p className="mt-2 text-sm text-rose-300" role="alert">
								{cameraError}
							</p>
						)}
					</header>
					<div className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl shadow-black/40">
						{liveView ? (
							<img
								alt="Mirrored live camera view"
								className="h-full w-full -scale-x-100 object-cover"
								src={liveView}
							/>
						) : (
							<div className="flex h-full items-center justify-center text-neutral-500">
								Starting camera…
							</div>
						)}
						{capturedPreview && (
							<img
								alt={`Capture ${shots.length}`}
								className="absolute inset-0 h-full w-full object-cover"
								src={capturedPreview}
							/>
						)}
						{countdown !== null && (
							<div
								aria-live="assertive"
								className="absolute inset-0 flex items-center justify-center bg-black/15 text-8xl font-bold text-white drop-shadow-lg sm:text-9xl"
							>
								{countdown}
							</div>
						)}
						{processing && (
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
								<span className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-amber-300" />
								<span className="font-medium">Processing photo…</span>
							</div>
						)}
						{flash && (
							<div className="pointer-events-none absolute inset-0 animate-pulse bg-white opacity-90" />
						)}
					</div>
					<div
						aria-label={`${shots.length} of ${layout.shotCount} captures complete`}
						className="mt-6 flex items-center gap-3"
						role="status"
					>
						{[1, 2, 3, 4].slice(0, layout.shotCount).map((shotNumber) => (
							<span
								aria-hidden="true"
								className={`h-3 w-3 rounded-full ${
									shotNumber <= shots.length ? "bg-amber-300" : "bg-white/20"
								}`}
								key={shotNumber}
							/>
						))}
					</div>
					{errorMessage && (
						<div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-center">
							<p className="text-sm text-rose-300" role="alert">
								{errorMessage}
							</p>
							<button
								className="min-h-11 rounded-xl border border-white/15 px-4 text-sm"
								onClick={() => void cancelCapture()}
								type="button"
							>
								Back to setup
							</button>
						</div>
					)}
				</section>
			)}

			{screen === "review" && (
				<section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-20 sm:px-8">
					<header className="mb-6 text-center">
						<p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
							Step 3 · Keep the moment
						</p>
						<h1 className="mt-2 text-3xl font-semibold">Looking good?</h1>
					</header>
					<div className="flex min-h-0 flex-1 items-center justify-center">
						{compositeImage && (
							<img
								alt="Finished print preview"
								className="max-h-[min(55vh,620px)] max-w-full rounded-lg bg-white object-contain shadow-2xl"
								src={compositeImage}
							/>
						)}
					</div>
					{errorMessage && (
						<p className="mt-4 text-center text-sm text-rose-300" role="alert">
							{errorMessage}
						</p>
					)}
					<footer className="mt-6 flex flex-wrap items-center justify-center gap-4">
						<button
							className="min-h-14 rounded-xl border border-white/10 px-6 font-semibold text-neutral-200 transition hover:bg-white/10"
							onClick={() => void startCaptureSession()}
							type="button"
						>
							Retake photos
						</button>
						<div className="flex min-h-14 items-center gap-3 rounded-xl border border-white/10 px-4">
							<span className="text-sm text-neutral-300">Prints</span>
							<button
								aria-label="Decrease print copies"
								className="h-9 w-9 rounded-lg bg-white/10 text-lg disabled:opacity-40"
								disabled={copyCount <= 1}
								onClick={() => setCopyCount((count) => Math.max(1, count - 1))}
								type="button"
							>
								−
							</button>
							<output className="w-5 text-center font-semibold">{copyCount}</output>
							<button
								aria-label="Increase print copies"
								className="h-9 w-9 rounded-lg bg-white/10 text-lg disabled:opacity-40"
								disabled={copyCount >= 4}
								onClick={() => setCopyCount((count) => Math.min(4, count + 1))}
								type="button"
							>
								+
							</button>
						</div>
						<button
							className="min-h-14 rounded-xl bg-amber-300 px-7 font-semibold text-neutral-950 transition hover:bg-amber-200"
							onClick={() => void printPhotos()}
							type="button"
						>
							Print Photos
						</button>
					</footer>
				</section>
			)}

			{printing && (
				<div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-neutral-950/95 text-center">
					<span className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-amber-300" />
					<p className="text-2xl font-semibold">Printing your photos…</p>
					<p className="text-sm text-neutral-400">Your booth will reset shortly.</p>
				</div>
			)}

			<AdminModal
				cameras={cameras}
				countdown={countdownDuration}
				mockMode={mockMode}
				onCameraChange={chooseCamera}
				onChooseOutputDirectory={chooseOutputDirectory}
				onClose={() => setAdminOpen(false)}
				onCountdownChange={changeCountdownDuration}
				onMockModeChange={toggleMockMode}
				onPrintTestPage={printTestPage}
				onPrinterChange={choosePrinter}
				onRefreshCameras={refreshCameraList}
				onTestShutter={testShutter}
				open={adminOpen}
				outputDirectory={outputDirectory}
				printers={printers}
				selectedCamera={selectedCamera}
				selectedPrinter={selectedPrinter}
			/>
		</main>
	);
}

function LayoutThumbnail({
	family,
	shots,
}: {
	family: "strip" | "postcard";
	shots: number;
}) {
	return (
		<span
			aria-hidden="true"
			className={`relative flex h-36 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white p-2 ${
				family === "strip" ? "aspect-1/3" : "aspect-2/3"
			}`}
		>
			<span
				className={`grid h-full w-full gap-1 ${
					family === "strip" ? "grid-cols-1" : "grid-cols-2 grid-rows-2"
				}`}
			>
				{[1, 2, 3, 4].slice(0, shots).map((shotNumber) => (
					<span
						className="rounded-sm bg-linear-to-br from-orange-200 via-rose-300 to-violet-400"
						key={shotNumber}
					/>
				))}
			</span>
		</span>
	);
}

function frameName(path: string): string {
	return path
		.split("/")
		.at(-1)
		?.replace(/[-_]/g, " ")
		.replace(/\.png$/i, "")
		.replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "Photo frame";
}

function toFileUrl(path: string): string {
	if (/^file:/i.test(path)) {
		return path;
	}
	const normalized = path.replace(/\\/g, "/");
	return new URL(
		normalized.startsWith("/")
			? `file://${normalized}`
			: `file:///${normalized}`,
	).href;
}

function playCountdownTone(context: AudioContext | null, final: boolean): void {
	if (!context) {
		return;
	}
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = "sine";
	oscillator.frequency.value = final ? 880 : 660;
	gain.gain.setValueAtTime(0.0001, context.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.015);
	gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
	oscillator.connect(gain);
	gain.connect(context.destination);
	oscillator.start();
	oscillator.stop(context.currentTime + 0.17);
}

function createTestPage(): string {
	const canvas = document.createElement("canvas");
	canvas.width = 1200;
	canvas.height = 1800;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("Could not create a printer test page.");
	}
	context.fillStyle = "#fff";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = "#171717";
	context.textAlign = "center";
	context.font = "bold 84px sans-serif";
	context.fillText("EASY BOOTH", 600, 300);
	context.font = "42px sans-serif";
	context.fillText("Printer color test", 600, 380);
	const bars = ["#f43f5e", "#f59e0b", "#22c55e", "#06b6d4", "#6366f1", "#a855f7"];
	bars.forEach((color, index) => {
		context.fillStyle = color;
		context.fillRect(120 + index * 160, 560, 140, 540);
	});
	context.fillStyle = "#171717";
	context.font = "32px sans-serif";
	context.fillText("If the colors and edges look right, you're ready to print.", 600, 1260);
	context.strokeStyle = "#171717";
	context.lineWidth = 8;
	context.strokeRect(70, 70, 1060, 1660);
	return canvas.toDataURL("image/png");
}

function errorText(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function delay(milliseconds: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export default App;
