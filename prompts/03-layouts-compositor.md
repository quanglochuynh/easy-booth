# Part 3: Print Layouts & 300 DPI Compositor

Files: `src/config/layouts.ts`, `src/utils/canvasCompositor.ts`, `public/frames/`.

## Layouts

Define standard dye-sublimation print sizes at 300 DPI:

- **4x6 Postcard** (1200 x 1800 px or 1800 x 1200 px): 3-photo or 4-photo grid with logo area.
- **2x6 Photo Strip** (600 x 1800 px): Classic 3-shot or 4-shot vertical strip (optionally duplicated side-by-side onto a 1200 x 1800 px 4x6 canvas for 2-inch cut printers).

Each layout definition must specify:

- `id`, `name`, `widthPx`, `heightPx`, `shotCount`
- `slots`: Array of `{ x, y, width, height, rotation? }`
- `availableFrames`: Array of transparent PNG frame overlay paths

## Compositor (`canvasCompositor.ts`)

- Create an offscreen `<canvas>` matching `widthPx` and `heightPx`.
- Draw each captured photo into its designated slot using `object-fit: cover` center-crop math (prevent stretching).
- Draw the selected transparent PNG frame overlay on top (`ctx.drawImage(frameImg, 0, 0, widthPx, heightPx)`).
- Export the final composite as a high-quality PNG/JPEG data URL or Buffer and save it via IPC (`storage:save-composite`).

## Deliverables for This Part

- Typed layout configs for the 2x6 strip and 4x6 grid.
- Sample transparent frame PNGs (1200x1800 and 600x1800).
- `composite(layout, photos, frame)` function plus the `storage:save-composite` IPC handler.
