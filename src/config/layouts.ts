import type { PhotoLayout } from "../types/photobooth";

export const DEFAULT_LAYOUT_ID = "postcard-4x6-3-photo";

const postcardFrame = "frames/postcard-frame.png";
const stripFrame = "frames/strip-frame.png";

const postcardSlots = [
	{ x: 48, y: 48, width: 780, height: 540 },
	{ x: 852, y: 48, width: 780, height: 540 },
	{ x: 48, y: 612, width: 780, height: 540 },
	{ x: 852, y: 612, width: 780, height: 540 },
];

const postcardSlots1 = [{ x: 48, y: 48, width: 1704, height: 1104 }];

const postcardSlots2 = [
	{ x: 48, y: 48, width: 1704, height: 540 },
	{ x: 48, y: 612, width: 1704, height: 540 },
];

const stripSlots1 = [{ x: 30, y: 30, width: 1740, height: 540 }];

const stripSlots2 = [
	{ x: 30, y: 30, width: 858, height: 540 },
	{ x: 912, y: 30, width: 858, height: 540 },
];

const stripSlots3 = [
	{ x: 30, y: 30, width: 564, height: 540 },
	{ x: 618, y: 30, width: 564, height: 540 },
	{ x: 1206, y: 30, width: 564, height: 540 },
];

const stripSlots4 = [
	{ x: 30, y: 30, width: 420, height: 540 },
	{ x: 468, y: 30, width: 420, height: 540 },
	{ x: 906, y: 30, width: 420, height: 540 },
	{ x: 1344, y: 30, width: 420, height: 540 },
];

export const photoLayouts: PhotoLayout[] = [
	{
		id: "postcard-4x6-1-photo",
		name: "6x4 Postcard · 1 Photo",
		widthPx: 1800,
		heightPx: 1200,
		shotCount: 1,
		slots: postcardSlots1,
		availableFrames: [postcardFrame],
	},
	{
		id: "postcard-4x6-2-photo",
		name: "6x4 Postcard · 2 Photos",
		widthPx: 1800,
		heightPx: 1200,
		shotCount: 2,
		slots: postcardSlots2,
		availableFrames: [postcardFrame],
	},
	{
		id: "postcard-4x6-3-photo",
		name: "6x4 Postcard · 3 Photos",
		widthPx: 1800,
		heightPx: 1200,
		shotCount: 3,
		slots: postcardSlots.slice(0, 3),
		availableFrames: [postcardFrame],
	},
	{
		id: "postcard-4x6-4-photo",
		name: "6x4 Postcard · 4 Photos",
		widthPx: 1800,
		heightPx: 1200,
		shotCount: 4,
		slots: postcardSlots,
		availableFrames: [postcardFrame],
	},
	{
		id: "strip-2x6-1-photo",
		name: "6x2 Photo Strip · 1 Photo",
		widthPx: 1800,
		heightPx: 600,
		shotCount: 1,
		slots: stripSlots1,
		availableFrames: [stripFrame],
	},
	{
		id: "strip-2x6-2-photo",
		name: "6x2 Photo Strip · 2 Photos",
		widthPx: 1800,
		heightPx: 600,
		shotCount: 2,
		slots: stripSlots2,
		availableFrames: [stripFrame],
	},
	{
		id: "strip-2x6-3-photo",
		name: "6x2 Photo Strip · 3 Photos",
		widthPx: 1800,
		heightPx: 600,
		shotCount: 3,
		slots: stripSlots3,
		availableFrames: [stripFrame],
	},
	{
		id: "strip-2x6-4-photo",
		name: "6x2 Photo Strip · 4 Photos",
		widthPx: 1800,
		heightPx: 600,
		shotCount: 4,
		slots: stripSlots4,
		availableFrames: [stripFrame],
	},
];

export const photoLayoutById: ReadonlyMap<string, PhotoLayout> = new Map(
	photoLayouts.map((layout): [string, PhotoLayout] => [layout.id, layout]),
);
