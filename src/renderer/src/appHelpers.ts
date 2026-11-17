export function playCountdownTone(
	context: AudioContext | null,
	final: boolean,
): void {
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

export function createTestPage(): string {
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
	const bars = [
		"#f43f5e",
		"#f59e0b",
		"#22c55e",
		"#06b6d4",
		"#6366f1",
		"#a855f7",
	];
	bars.forEach((color, index) => {
		context.fillStyle = color;
		context.fillRect(120 + index * 160, 560, 140, 540);
	});
	context.fillStyle = "#171717";
	context.font = "32px sans-serif";
	context.fillText(
		"If the colors and edges look right, you're ready to print.",
		600,
		1260,
	);
	context.strokeStyle = "#171717";
	context.lineWidth = 8;
	context.strokeRect(70, 70, 1060, 1660);
	return canvas.toDataURL("image/png");
}

export function errorText(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export function delay(milliseconds: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
