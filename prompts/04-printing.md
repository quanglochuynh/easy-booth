# Part 4: Silent Printing

File: `electron/printer/printManager.ts` (plus IPC wiring).

## Printer Discovery

Expose `printer:list` via `webContents.getPrintersAsync()` so the Admin Modal can select the target color/dye-sub printer and save it to local config (`electron-store` or a JSON file in `app.getPath('userData')`).

## Print Image

Expose `printer:print-image` accepting `{ imagePath, printerName, copies, pageSize }`:

1. Spawn a hidden `BrowserWindow({ show: false })` loading a minimal HTML wrapper with `@page { margin: 0; size: 4in 6in; }` and `img { width: 100%; height: 100%; object-fit: contain; }`.
2. Once `did-finish-load` fires, call `printWindow.webContents.print({ silent: true, printBackground: true, deviceName: printerName, copies })`.
3. Close the hidden window in the print callback and report success/error back to React.

## Deliverables for This Part

- `printManager.ts` with `listPrinters()` and `printImage()`.
- Persisted config (selected printer) read/written from `userData`.
- IPC channels exposed through `window.photoboothAPI`.
