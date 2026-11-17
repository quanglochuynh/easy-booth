import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { DEFAULT_LAYOUT_ID, photoLayouts } from "../../config/layouts";
import type { PhotoLayout } from "../../types/photobooth";
import { composite } from "../../utils/canvasCompositor";
import {
	createTestPage,
	delay,
	errorText,
	playCountdownTone,
} from "./appHelpers";
import AdminModal from "./components/AdminModal";
import AttractScreen from "./components/AttractScreen";
import CaptureScreen from "./components/CaptureScreen";
import ReviewScreen from "./components/ReviewScreen";
import SetupScreen from "./components/SetupScreen";
import { useBoothStore } from "./store";

const COUNTDOWN_STORAGE_KEY = "easy-booth-countdown";
const MOCK_MODE_STORAGE_KEY = "easy-booth-mock-mode";

function App() {
	const {
		setCameras,
		selectedCamera,
		setSelectedCamera,
		cameraConnected,
		setCameraConnected,
		setLiveView,
		setCameraError,
		setPrinters,
		selectedPrinter,
		setSelectedPrinter,
		setOutputDirectory,
		mockMode,
		setMockMode,
		countdownDuration,
		setCountdownDuration,
		setAdminOpen,
		layoutFamily,
		shotCount,
		selectedFrame,
		setSelectedFrame,
		setCountdown,
		setShots,
		setCapturedPreview,
		setProcessing,
		setFlash,
		compositeImage,
		setCompositeImage,
		copyCount,
		setCopyCount,
		printing,
		setPrinting,
		setErrorMessage,
	} = useBoothStore();
	const navigate = useNavigate();
	const [captureActive, setCaptureActive] = useState(false);
	const audioContext = useRef<AudioContext | null>(null);

	const layout = useMemo(
		() =>
			photoLayouts.find(
				(item) =>
					item.id.startsWith(layoutFamily) && item.shotCount === shotCount,
			) ??
			photoLayouts.find((item) => item.id === DEFAULT_LAYOUT_ID) ??
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
	}, [selectedCamera, setCameras, setCameraConnected, setSelectedCamera]);

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
					console.log("here");

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
	}, [
		setMockMode,
		setCameras,
		setCameraConnected,
		setSelectedCamera,
		setCameraError,
		setPrinters,
		setSelectedPrinter,
		setErrorMessage,
		setOutputDirectory,
		setCountdownDuration,
		setLiveView,
	]);

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
	}, [setAdminOpen]);

	useEffect(() => {
		if (selectedFrame && !availableFrames.includes(selectedFrame)) {
			setSelectedFrame(availableFrames[0] ?? "");
		}
	}, [availableFrames, selectedFrame, setSelectedFrame]);

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
		navigate("/setup", { replace: true });
	};

	const startCaptureSession = async () => {
		setErrorMessage("");
		setCameraError("");
		setShots([]);
		setCompositeImage("");
		setCapturedPreview("");
		setCopyCount(1);
		setCaptureActive(true);
		navigate("/capture", { replace: true });
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
			const photo = await window.photoboothAPI.capture();
			setProcessing(false);
			captured.push(photo);
			setShots([...captured]);
			setCapturedPreview(photo);
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
		setCaptureActive(false);
		navigate("/review", { replace: true });
	};

	const cancelCapture = async () => {
		setCountdown(null);
		setProcessing(false);
		setCapturedPreview("");
		try {
			await window.photoboothAPI.stopLiveView();
			setLiveView("");
			setCaptureActive(false);
			navigate("/setup", { replace: true });
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
			const imagePath =
				await window.photoboothAPI.saveComposite(compositeImage);
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
			setShots([]);
			setCompositeImage("");
			navigate("/", { replace: true });
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

			<Routes>
				<Route path="/" element={<AttractScreen onStart={startSetup} />} />
				<Route
					path="/setup"
					element={
						<SetupScreen
							availableFrames={availableFrames}
							onStartCapture={startCaptureSession}
						/>
					}
				/>
				<Route
					path="/capture"
					element={
						captureActive ? (
							<CaptureScreen
								shotCount={layout.shotCount}
								onCancel={cancelCapture}
							/>
						) : (
							<Navigate to="/setup" replace />
						)
					}
				/>
				<Route
					path="/review"
					element={
						compositeImage ? (
							<ReviewScreen
								onRetake={startCaptureSession}
								onPrint={printPhotos}
							/>
						) : (
							<Navigate to="/setup" replace />
						)
					}
				/>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>

			{printing && (
				<div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-neutral-950/95 text-center">
					<span className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-amber-300" />
					<p className="text-2xl font-semibold">Printing your photos…</p>
					<p className="text-sm text-neutral-400">
						Your booth will reset shortly.
					</p>
				</div>
			)}

			<AdminModal
				onCameraChange={chooseCamera}
				onChooseOutputDirectory={chooseOutputDirectory}
				onCountdownChange={changeCountdownDuration}
				onMockModeChange={toggleMockMode}
				onPrintTestPage={printTestPage}
				onPrinterChange={choosePrinter}
				onRefreshCameras={refreshCameraList}
				onTestShutter={testShutter}
			/>
		</main>
	);
}

export default App;
