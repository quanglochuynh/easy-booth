# Part 5: Photobooth User Flow (State Machine) & Admin

Files: `src/App.tsx`, `src/components/*`.

Depends on Parts 1–4. Follow the kiosk styling rules from Part 1.

## 1. Attract Screen

Animated background + "Tap Anywhere to Start" button. Shows a camera status indicator in the corner.

## 2. Setup Screen (Layout & Frame)

Touch cards to select Layout (2x6 Strip / 4x6 Grid) and Frame overlay with live visual thumbnails.

## 3. Capture Session

- Displays the Live View feed mirrored horizontally (like a mirror).
- Runs a visual & audio countdown (3... 2... 1...) before each shot in `layout.shotCount`.
- Triggers a white screen flash animation (`animate-pulse` / opacity transition) when the shutter fires.
- Displays a "Processing photo..." spinner while gphoto2 downloads the file.
- Briefly shows the captured shot before starting the next countdown.

## 4. Review & Print Screen

- Displays the rendered final composite with the frame applied.
- Allows selecting copy count (1 to 4 prints), retaking photos, or clicking "Print Photos".
- Shows a "Printing your photos..." overlay for 5 seconds before automatically resetting to the Attract Screen.

## 5. Admin Settings Modal (Ctrl+Shift+S / Cmd+Shift+S)

- Select connected camera / test shutter / toggle Mock Camera Mode.
- Select default printer / print test page.
- Set countdown duration (3s, 5s, 8s) and output save directory.
