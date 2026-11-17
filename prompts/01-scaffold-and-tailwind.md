# Part 1: Project Scaffold, Stack & Tailwind v4

## Objective & Tech Stack

Build a cross-platform (macOS/Linux primary for `gphoto2`) desktop photobooth application using:

- **Runtime:** Electron (Latest, with `contextIsolation: true`, `nodeIntegration: false`, and strict IPC preload bridge)
- **Bundler:** Vite (`electron-vite` or Vite + Electron Builder)
- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS **v4** (`@tailwindcss/vite` plugin, CSS-first configuration using `@import "tailwindcss";` and `@theme` blocks in `src/index.css` — **DO NOT** create `tailwind.config.js` or `postcss.config.js`)
- **Camera Tethering:** `gphoto2` CLI spawned via Node.js `child_process` in the Electron Main process
- **Image Compositing:** Offscreen HTML5 `<canvas>` (or `sharp` in Main process) rendering at 300 DPI print resolution
- **Printing:** Electron silent printing (`webContents.print({ silent: true })`) via a hidden print `BrowserWindow`

## Directory Structure

Scaffold the project with this clean separation between Main, Preload, and Renderer:

```text
photobooth-app/
├── electron/
│   ├── main.ts                 # App lifecycle, window creation, silent print window
│   ├── preload.ts              # Safe contextBridge exposing window.photoboothAPI
│   ├── camera/
│   │   └── gphoto2Manager.ts   # Child process wrapper for gphoto2 detect, live-view, and capture
│   ├── printer/
│   │   └── printManager.ts     # Printer discovery & hidden window silent print execution
│   └── storage/
│       └── fileManager.ts      # Saves raw captures, final composites, and custom frames
├── src/
│   ├── index.css               # Tailwind v4 entry (@import "tailwindcss"; + @theme variables)
│   ├── App.tsx                 # Main state machine (Attract -> Layout -> Capture -> Preview -> Print)
│   ├── types/
│   │   └── photobooth.ts       # Shared TypeScript interfaces for IPC, Layouts, Frames, Printers
│   ├── config/
│   │   └── layouts.ts          # Print template definitions (2x6 strip, 4x6 grid, photo slot coordinates)
│   ├── utils/
│   │   └── canvasCompositor.ts # High-res 300 DPI image cropping, slot placement, and PNG frame overlay
│   └── components/
│       ├── AttractScreen.tsx   # Fullscreen touch-friendly "Tap to Start" screen
│       ├── LayoutSelector.tsx  # UI to pick print layout (e.g., 2x6 Strip vs 4x6 Postcard) & PNG frame
│       ├── CaptureSession.tsx  # Live-view feed, countdown timer (3-2-1), flash effect, shot progress
│       ├── ReviewAndPrint.tsx  # Final composite preview, retake option, copy count, "Print" button
│       └── AdminModal.tsx      # Hidden settings modal (shortcut: Ctrl/Cmd+Shift+S) for camera/printer setup
├── public/
│   └── frames/                 # Sample transparent PNG frame overlays (1200x1800px & 600x1800px)
├── package.json
└── vite.config.ts
```

## Tailwind CSS v4 Configuration

- Install `tailwindcss` and `@tailwindcss/vite`.
- Register `tailwindcss()` inside the `vite.config.ts` plugins array alongside `react()`.
- In `src/index.css`, use `@import "tailwindcss";` and define custom touch-kiosk colors/animations inside `@theme { ... }`.
- Design the UI for a touchscreen kiosk: large hit targets (`min-h-16`), high-contrast dark mode (`bg-neutral-950 text-white`), zero scrollbars (`overflow-hidden select-none`), and smooth CSS transitions.

## Deliverables for This Part

- Working Electron + Vite + React app that opens a window with a placeholder screen styled by Tailwind v4.
- Secure `main.ts` / `preload.ts` skeleton exposing an empty `window.photoboothAPI`.
- Shared types stub in `src/types/photobooth.ts`.
