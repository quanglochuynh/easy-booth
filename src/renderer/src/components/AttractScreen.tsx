function AttractScreen({ onStart }: { onStart: () => void }) {
	return (
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
				onClick={onStart}
				type="button"
			>
				<span aria-hidden="true">✦</span>
				Tap Anywhere to Start
			</button>
			<p className="mt-5 text-xs text-neutral-500">
				Admin settings · Ctrl/Cmd + Shift + S
			</p>
		</section>
	);
}

export default AttractScreen;
