const Sparkle = () => (
	<svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
		<path
			d="M12 2.75 14.3 9.7 21.25 12l-6.95 2.3L12 21.25 9.7 14.3 2.75 12 9.7 9.7 12 2.75Z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
	</svg>
);

const Camera = () => (
	<svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
		<path
			d="M8.25 6.5 9.5 4.75h5L15.75 6.5H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h3.25Z"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
		<circle
			cx="12"
			cy="12.75"
			r="3.25"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
	</svg>
);

function App() {
	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-6 py-10 text-white selection:bg-amber-200 selection:text-neutral-950">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(245,158,11,0.12),transparent_55%)]" />
			<div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:64px_64px]" />

			<section className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
				<div className="mb-10 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-300 shadow-lg shadow-black/20">
					<span className="relative flex h-2.5 w-2.5">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-50" />
						<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-300" />
					</span>
					Your photo moment starts here
				</div>

				<div className="mb-8 flex h-20 w-20 animate-float items-center justify-center rounded-[1.75rem] border border-amber-100/20 bg-gradient-to-br from-amber-200 to-amber-500 text-neutral-950 shadow-2xl shadow-amber-500/20">
					<Camera />
				</div>

				<p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">
					Easy Booth
				</p>
				<h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl md:text-7xl">
					Make this moment
					<br />
					<span className="bg-gradient-to-r from-amber-100 via-amber-300 to-orange-300 bg-clip-text text-transparent">
						a little more memorable.
					</span>
				</h1>
				<p className="mt-6 max-w-xl text-pretty text-base leading-7 text-neutral-400 sm:text-lg">
					A simple photo booth for the moments worth keeping. Get together, find
					your pose, and let the fun begin.
				</p>

				<button
					className="mt-10 flex min-h-16 items-center gap-3 rounded-2xl bg-amber-300 px-8 text-base font-semibold text-neutral-950 shadow-xl shadow-amber-500/15 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-200 hover:shadow-amber-500/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200 active:translate-y-0"
					type="button"
				>
					<Sparkle />
					Tap to start
				</button>

				<div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
					<span className="flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
						Booth ready
					</span>
					<span>Gather your crew</span>
					<span>Make it yours</span>
				</div>
			</section>

			<footer className="absolute bottom-5 left-0 right-0 text-center text-xs text-neutral-600">
				Good times, one frame at a time
			</footer>
		</main>
	);
}

export default App;
