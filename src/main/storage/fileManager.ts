import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { app } from "electron";

const MAX_COMPOSITE_SIZE = 100 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

let sessionDirectory: Promise<string> | undefined;

export function getSessionDirectory(): Promise<string> {
	if (!sessionDirectory) {
		sessionDirectory = createSessionDirectory();
	}

	return sessionDirectory;
}

export async function saveComposite(dataUrl: string): Promise<string> {
	const match = dataUrl.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/);
	if (!match) {
		throw new TypeError("Composite must be a PNG or JPEG base64 data URL");
	}

	const [, format, base64] = match;
	if (base64.length > Math.ceil((MAX_COMPOSITE_SIZE * 4) / 3)) {
		throw new RangeError("Composite exceeds the maximum file size");
	}
	const image = Buffer.from(base64, "base64");
	if (
		image.length === 0 ||
		image.length > MAX_COMPOSITE_SIZE ||
		image.toString("base64") !== base64
	) {
		throw new TypeError("Composite contains invalid or oversized base64 data");
	}

	const validSignature =
		format === "png"
			? image.length >= PNG_SIGNATURE.length &&
				image.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
			: image.length >= 3 &&
				image[0] === 0xff &&
				image[1] === 0xd8 &&
				image[2] === 0xff;
	if (!validSignature) {
		throw new TypeError(`Composite data does not contain a valid ${format.toUpperCase()} image`);
	}

	const directory = await getSessionDirectory();
	const filePath = join(directory, `composite-${randomUUID()}.${format === "jpeg" ? "jpg" : "png"}`);
	await writeFile(filePath, image, { flag: "wx" });
	return filePath;
}

async function createSessionDirectory(): Promise<string> {
	const directory = join(
		app.getPath("temp"),
		"easy-booth",
		`session-${randomUUID()}`,
	);
	await mkdir(directory, { recursive: true });
	return directory;
}
