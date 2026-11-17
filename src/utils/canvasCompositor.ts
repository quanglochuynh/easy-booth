import type { PhotoFrame, PhotoLayout, PhotoSlot } from "../types/photobooth";

export async function composite(
	layout: PhotoLayout,
	photos: string[],
	frame?: string | PhotoFrame,
): Promise<string> {
	validateLayout(layout, photos);

	const canvas = document.createElement("canvas");
	canvas.width = layout.widthPx;
	canvas.height = layout.heightPx;
	const context = canvas.getContext("2d");
	if (!context) {
		throw new Error("Could not create a 2D canvas context");
	}

	context.fillStyle = "#ffffff";
	context.fillRect(0, 0, canvas.width, canvas.height);

	const images = await Promise.all(photos.map(loadImage));
	for (const [index, slot] of layout.slots.entries()) {
		const image = images[index];
		if (!image) {
			throw new Error(`Missing photo at slot ${index + 1}`);
		}
		drawPhoto(context, image, slot);
	}

	const frameSource = typeof frame === "string" ? frame : frame?.src;
	if (frameSource) {
		const frameImage = await loadImage(frameSource);
		context.drawImage(frameImage, 0, 0, layout.widthPx, layout.heightPx);
	}

	return canvas.toDataURL("image/png");
}

function validateLayout(layout: PhotoLayout, photos: string[]): void {
	if (
		!Number.isInteger(layout.widthPx) ||
		!Number.isInteger(layout.heightPx) ||
		layout.widthPx <= 0 ||
		layout.heightPx <= 0
	) {
		throw new RangeError("Layout dimensions must be positive integers");
	}
	if (photos.length !== layout.shotCount || layout.slots.length !== layout.shotCount) {
		throw new RangeError(
			`Layout "${layout.id}" requires exactly ${layout.shotCount} photos and slots`,
		);
	}
	if (photos.some((photo) => !photo.trim())) {
		throw new TypeError("Photo sources must not be empty");
	}
	for (const slot of layout.slots) {
		if (
			![slot.x, slot.y, slot.width, slot.height].every(Number.isFinite) ||
			(slot.rotation !== undefined && !Number.isFinite(slot.rotation)) ||
			slot.width <= 0 ||
			slot.height <= 0 ||
			slot.x < 0 ||
			slot.y < 0 ||
			slot.x + slot.width > layout.widthPx ||
			slot.y + slot.height > layout.heightPx
		) {
			throw new RangeError(`Layout "${layout.id}" contains an invalid photo slot`);
		}
	}
}

function loadImage(source: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Could not load image: ${source}`));
		image.src = resolveImageSource(source);
	});
}

function resolveImageSource(source: string): string {
	if (/^(?:data:|blob:|file:|https?:)/i.test(source)) {
		return source;
	}
	if (source.startsWith("/")) {
		return new URL(`file://${source}`).href;
	}
	if (/^[a-z]:[\\/]/i.test(source)) {
		return new URL(`file:///${source.replace(/\\/g, "/")}`).href;
	}
	return source;
}

function drawPhoto(
	context: CanvasRenderingContext2D,
	image: HTMLImageElement,
	slot: PhotoSlot,
): void {
	const rotation = ((slot.rotation ?? 0) % 360 + 360) % 360;
	if (rotation === 0) {
		drawCover(context, image, slot.x, slot.y, slot.width, slot.height);
		return;
	}

	context.save();
	context.beginPath();
	context.rect(slot.x, slot.y, slot.width, slot.height);
	context.clip();
	context.translate(slot.x + slot.width / 2, slot.y + slot.height / 2);
	const radians = (rotation * Math.PI) / 180;
	context.rotate(radians);
	const absCos = Math.abs(Math.cos(radians));
	const absSin = Math.abs(Math.sin(radians));
	const drawWidth = slot.width * absCos + slot.height * absSin;
	const drawHeight = slot.width * absSin + slot.height * absCos;
	drawCover(context, image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
	context.restore();
}

function drawCover(
	context: CanvasRenderingContext2D,
	image: HTMLImageElement,
	x: number,
	y: number,
	width: number,
	height: number,
): void {
	const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
	const drawnWidth = image.naturalWidth * scale;
	const drawnHeight = image.naturalHeight * scale;
	context.drawImage(
		image,
		x + (width - drawnWidth) / 2,
		y + (height - drawnHeight) / 2,
		drawnWidth,
		drawnHeight,
	);
}
