import { useBoothStore } from "../store";

function CaptureScreen({
	shotCount,
	onCancel,
}: {
	shotCount: number;
	onCancel: () => Promise<void>;
}) {
	const {
		shots,
		cameraError,
		liveView,
		capturedPreview,
		countdown,
		processing,
		flash,
		errorMessage,
	} = useBoothStore();

	return (
		<section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-5 py-20 sm:px-8">
			<header className="mb-5 text-center">
				<p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
					Photo {Math.min(shots.length + 1, shotCount)} of {shotCount}
				</p>
				<h1 className="mt-2 text-3xl font-semibold">Find your pose!!</h1>
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
				aria-label={`${shots.length} of ${shotCount} captures complete`}
				className="mt-6 flex items-center gap-3"
				role="status"
			>
				{[1, 2, 3, 4].slice(0, shotCount).map((shotNumber) => (
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
					<p className="text-sm text-rose-400" role="alert">
						{errorMessage}
					</p>
					<button
						className="min-h-11 rounded-xl border border-white/15 px-4 text-sm"
						onClick={() => void onCancel()}
						type="button"
					>
						Back to setup
					</button>
				</div>
			)}
		</section>
	);
}

export default CaptureScreen;
