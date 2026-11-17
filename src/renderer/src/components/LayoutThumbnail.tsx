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
			className={`relative flex w-36 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white p-2 ${
				family === "strip" ? "aspect-3/1" : "aspect-3/2"
			}`}
		>
			<span
				className={`grid h-full w-full gap-1 ${
					family === "strip"
						? shots === 1
							? "grid-cols-1"
							: shots === 2
								? "grid-cols-2"
								: shots === 3
									? "grid-cols-3"
									: "grid-cols-4"
						: shots === 1
							? "grid-cols-1"
							: shots === 2
								? "grid-rows-2"
								: "grid-cols-2 grid-rows-2"
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

export default LayoutThumbnail;
