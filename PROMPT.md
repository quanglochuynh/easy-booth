# Project Specification: Electron + React + Tailwind v4 Photobooth Desktop App

## 1. Objective & Tech Stack

Build a cross-platform (macOS/Linux primary for `gphoto2`) desktop photobooth application using:

- **Runtime:** Electron (Latest, with `contextIsolation: true`, `nodeIntegration: false`, and strict IPC preload bridge)
- **Bundler:** Vite (`electron-vite` or Vite + Electron Builder)
- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS **v4** (`@tailwindcss/vite` plugin, CSS-first configuration using `@import "tailwindcss";` and `@theme` blocks in `src/index.css` — **DO NOT** create `tailwind.config.js` or `postcss.config.js`)
- **Camera Tethering:** `gphoto2` CLI spawned via Node.js `child_process` in the Electron Main process
- **Image Compositing:** Offscreen HTML5 `<canvas>` (or `sharp` in Main process) rendering at 300 DPI print resolution
- **Printing:** Electron silent printing (`webContents.print({ silent: true })`) via a hidden print `BrowserWindow`

---

## 2. Directory Structure

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

3. Core Technical Requirements
   A. Tailwind CSS v4 Configuration
   Install tailwindcss and @tailwindcss/vite.

Register tailwindcss() inside vite.config.ts plugins array alongside react().

In src/index.css, use @import "tailwindcss"; and define custom touch-kiosk colors/animations inside @theme { ... }.

Design UI for a touchscreen kiosk: large hit targets (min-h-16), high contrast dark mode (bg-neutral-950 text-white), zero scrollbars (overflow-hidden select-none), and smooth CSS transitions.

B. gphoto2 Camera Control (electron/camera/gphoto2Manager.ts)
Implement a robust wrapper around the gphoto2 CLI using Node's spawn and execFile:

Detect Camera: Run gphoto2 --auto-detect and parse connected USB camera model/port.

Release OS Lock (macOS helper): Provide a utility method to kill ptpcamerad on macOS if it blocks USB access.

Live View Stream (MJPEG / Frame Loop):

Spawn gphoto2 --capture-movie --stdout and parse JPEG SOI (0xFF 0xD8) and EOI (0xFF 0xD9) byte markers from stdout stream, sending base64 or ArrayBuffer frames over IPC (camera:liveview-frame) to render smoothly on an HTML <canvas> or <img>.

Important: Cleanly terminate (SIGINT/SIGTERM) the --capture-movie process right before triggering a full-resolution shutter capture, then restart it if more shots remain.

Capture High-Res Image:

Run gphoto2 --capture-image-and-download --filename <temp*session_dir>/shot*%n.jpg --force-overwrite.

Return the local file path (or custom media:// protocol URL) to the Renderer upon completion.

Mock/Fallback Mode: Include a toggleable mockMode in gphoto2Manager.ts that uses local sample images or simulated capture delays so the app can be developed and tested without a physical DSLR/mirrorless camera plugged in.

C. Print Layouts & 300 DPI Compositor (src/config/layouts.ts & src/utils/canvasCompositor.ts)
Define standard dye-sublimation print sizes at 300 DPI:

4x6 Postcard (1200 x 1800 px or 1800 x 1200 px): 3-photo or 4-photo grid with logo area.

2x6 Photo Strip (600 x 1800 px): Classic 3-shot or 4-shot vertical strip (optionally duplicated side-by-side onto a 1200 x 1800 px 4x6 canvas for 2-inch cut printers).

Each layout definition must specify:

id, name, widthPx, heightPx, shotCount

slots: Array of { x, y, width, height, rotation? }

availableFrames: Array of transparent PNG frame overlay paths

canvasCompositor.ts must:

Create an offscreen <canvas> matching widthPx and heightPx.

Draw each captured photo into its designated slot using object-fit: cover center-crop math (preventing image stretching).

Draw the selected transparent PNG frame overlay on top (ctx.drawImage(frameImg, 0, 0, widthPx, heightPx)).

Export the final composite as a high-quality PNG/JPEG data URL or Buffer and save it via IPC (storage:save-composite).

D. Silent Printing (electron/printer/printManager.ts)
Expose printer:list via webContents.getPrintersAsync() so the Admin Modal can select the target color/dye-sub printer and save it to local config (electron-store or JSON file in app.getPath('userData')).

Expose printer:print-image accepting { imagePath, printerName, copies, pageSize }:

Spawn a hidden BrowserWindow({ show: false }) loading a minimal HTML wrapper with @page { margin: 0; size: 4in 6in; } and img { width: 100%; height: 100%; object-fit: contain; }.

Once did-finish-load fires, call printWindow.webContents.print({ silent: true, printBackground: true, deviceName: printerName, copies }).

Close the hidden window in the print callback and report success/error back to React.

4. Photobooth User Flow (State Machine)
   Attract Screen: Animated background + "Tap Anywhere to Start" button. Shows camera status indicator in the corner.

Setup Screen (Layout & Frame): Touch cards to select Layout (2x6 Strip / 4x6 Grid) and Frame overlay with live visual thumbnails.

Capture Session:

Displays Live View feed mirrored horizontally (like a mirror).

Runs a visual & audio countdown (3... 2... 1...) before each shot in layout.shotCount.

Triggers a white screen flash animation (animate-pulse / opacity transition) when shutter fires, displays "Processing photo..." spinner while gphoto2 downloads the file, and briefly shows the captured shot before starting the next countdown.

Review & Print Screen:

Displays the rendered final composite with the frame applied.

Allows selecting copy count (1 to 4 prints), retaking photos, or clicking "Print Photos".

Shows a "Printing your photos..." overlay screen for 5 seconds before automatically resetting to the Attract Screen.

Admin Settings Modal (Ctrl+Shift+S / Cmd+Shift+S):

Select connected camera / test shutter / toggle Mock Camera Mode.

Select default printer / print test page.

Set countdown duration (3s, 5s, 8s) and output save directory.
