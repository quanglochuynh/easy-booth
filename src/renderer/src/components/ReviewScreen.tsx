import { useBoothStore } from "../store";

function ReviewScreen({
	onRetake,
	onPrint,
}: {
	onRetake: () => Promise<void>;
	onPrint: () => Promise<void>;
}) {
	const { compositeImage, errorMessage, copyCount, setCopyCount } =
		useBoothStore();

	return (
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
					onClick={() => void onRetake()}
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
					onClick={() => void onPrint()}
					type="button"
				>
					Print Photos
				</button>
			</footer>
		</section>
	);
}

export default ReviewScreen;
