import { useBoothStore } from "../store";
import LayoutThumbnail from "./LayoutThumbnail";

function SetupScreen({
	availableFrames,
	onStartCapture,
}: {
	availableFrames: string[];
	onStartCapture: () => Promise<void>;
}) {
	const {
		layoutFamily,
		setLayoutFamily,
		shotCount,
		setShotCount,
		selectedFrame,
		setSelectedFrame,
		cameraConnected,
		errorMessage,
		setScreen,
	} = useBoothStore();

	return (
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
							{[1, 2, 3, 4].map((count) => (
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
											<span className="rounded-sm bg-neutral-500" key={slot} />
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
					onClick={() => void onStartCapture()}
					type="button"
				>
					{cameraConnected
						? "Start photo session"
						: "Connect a camera to start"}
				</button>
			</footer>
		</section>
	);
}

function frameName(path: string): string {
	return (
		path
			.split("/")
			.at(-1)
			?.replace(/[-_]/g, " ")
			.replace(/\.png$/i, "")
			.replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "Photo frame"
	);
}

export default SetupScreen;
