# Part 2: gphoto2 Camera Control

File: `electron/camera/gphoto2Manager.ts` (plus IPC wiring in `main.ts` / `preload.ts`).

Implement a robust wrapper around the `gphoto2` CLI using Node's `spawn` and `execFile`.

## Detect Camera

Run `gphoto2 --auto-detect` and parse the connected USB camera model/port.

## Release OS Lock (macOS helper)

Provide a utility method to kill `ptpcamerad` on macOS if it blocks USB access.

## Live View Stream (MJPEG / Frame Loop)

- Spawn `gphoto2 --capture-movie --stdout` and parse JPEG SOI (`0xFF 0xD8`) and EOI (`0xFF 0xD9`) byte markers from the stdout stream.
- Send base64 or `ArrayBuffer` frames over IPC (`camera:liveview-frame`) to render smoothly on an HTML `<canvas>` or `<img>`.
- **Important:** Cleanly terminate (SIGINT/SIGTERM) the `--capture-movie` process right before triggering a full-resolution shutter capture, then restart it if more shots remain.

## Capture High-Res Image

- Run `gphoto2 --capture-image-and-download --filename <temp_session_dir>/shot_%n.jpg --force-overwrite`.
- Return the local file path (or custom `media://` protocol URL) to the Renderer upon completion.

## Mock/Fallback Mode

Include a toggleable `mockMode` in `gphoto2Manager.ts` that uses local sample images or simulated capture delays so the app can be developed and tested without a physical DSLR/mirrorless camera plugged in.

## Deliverables for This Part

- `gphoto2Manager.ts` with `detect()`, `releaseLock()`, `startLiveView()`, `stopLiveView()`, `capture()`, `setMockMode()`.
- IPC channels exposed via `window.photoboothAPI`: camera detect, live-view start/stop, `camera:liveview-frame` subscription, capture.
- Session temp directory handling in `electron/storage/fileManager.ts`.
