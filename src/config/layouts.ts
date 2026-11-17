import type { PhotoLayout } from "../types/photobooth";

const postcardFrame = "frames/postcard-frame.png";
const stripFrame = "frames/strip-frame.png";

const postcardSlots = [
	{ x: 48, y: 48, width: 540, height: 780 },
	{ x: 612, y: 48, width: 540, height: 780 },
	{ x: 48, y: 852, width: 540, height: 780 },
	{ x: 612, y: 852, width: 540, height: 780 },
];

const postcardSlots1 = [{ x: 48, y: 48, width: 1104, height: 1704 }];

const postcardSlots2 = [
	{ x: 48, y: 48, width: 540, height: 1704 },
	{ x: 612, y: 48, width: 540, height: 1704 },
];

const stripSlots1 = [{ x: 30, y: 30, width: 540, height: 1740 }];

const stripSlots2 = [
	{ x: 30, y: 30, width: 540, height: 858 },
	{ x: 30, y: 912, width: 540, height: 858 },
];

const stripSlots3 = [
	{ x: 30, y: 30, width: 540, height: 564 },
	{ x: 30, y: 618, width: 540, height: 564 },
	{ x: 30, y: 1206, width: 540, height: 564 },
];

const stripSlots4 = [
	{ x: 30, y: 30, width: 540, height: 420 },
	{ x: 30, y: 468, width: 540, height: 420 },
	{ x: 30, y: 906, width: 540, height: 420 },
	{ x: 30, y: 1344, width: 540, height: 420 },
];

export const photoLayouts: PhotoLayout[] = [
	{
		id: "postcard-4x6-1-photo",
		name: "4x6 Postcard · 1 Photo",
		widthPx: 1200,
		heightPx: 1800,
		shotCount: 1,
		slots: postcardSlots1,
		availableFrames: [postcardFrame],
	},
	{
		id: "postcard-4x6-2-photo",
		name: "4x6 Postcard · 2 Photos",
		widthPx: 1200,
		heightPx: 1800,
		shotCount: 2,
		slots: postcardSlots2,
		availableFrames: [postcardFrame],
	},
	{
		id: "postcard-4x6-3-photo",
		name: "4x6 Postcard · 3 Photos",
		widthPx: 1200,
		heightPx: 1800,
		shotCount: 3,
		slots: postcardSlots.slice(0, 3),
		availableFrames: [postcardFrame],
	},
	{
		id: "postcard-4x6-4-photo",
		name: "4x6 Postcard · 4 Photos",
		widthPx: 1200,
		heightPx: 1800,
		shotCount: 4,
		slots: postcardSlots,
		availableFrames: [postcardFrame],
	},
	{
		id: "strip-2x6-1-photo",
		name: "2x6 Photo Strip · 1 Photo",
		widthPx: 600,
		heightPx: 1800,
		shotCount: 1,
		slots: stripSlots1,
		availableFrames: [stripFrame],
	},
	{
		id: "strip-2x6-2-photo",
		name: "2x6 Photo Strip · 2 Photos",
		widthPx: 600,
		heightPx: 1800,
		shotCount: 2,
		slots: stripSlots2,
		availableFrames: [stripFrame],
	},
	{
		id: "strip-2x6-3-photo",
		name: "2x6 Photo Strip · 3 Photos",
		widthPx: 600,
		heightPx: 1800,
		shotCount: 3,
		slots: stripSlots3,
		availableFrames: [stripFrame],
	},
	{
		id: "strip-2x6-4-photo",
		name: "2x6 Photo Strip · 4 Photos",
		widthPx: 600,
		heightPx: 1800,
		shotCount: 4,
		slots: stripSlots4,
		availableFrames: [stripFrame],
	},
];

export const photoLayoutById: ReadonlyMap<string, PhotoLayout> = new Map(
	photoLayouts.map((layout): [string, PhotoLayout] => [layout.id, layout]),
);
