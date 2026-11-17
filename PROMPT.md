# Project Specification: Electron + React + Tailwind v4 Photobooth Desktop App

The specification is split into parts under [`prompts/`](./prompts). Implement them in order; each part lists its own deliverables.

| # | Part | Scope |
|---|------|-------|
| 1 | [Scaffold & Tailwind](./prompts/01-scaffold-and-tailwind.md) | Tech stack, directory structure, Tailwind v4, secure Electron shell |
| 2 | [Camera](./prompts/02-camera.md) | `gphoto2Manager.ts`: detect, live view, capture, mock mode |
| 3 | [Layouts & Compositor](./prompts/03-layouts-compositor.md) | 300 DPI layouts, canvas compositing, frame overlays |
| 4 | [Printing](./prompts/04-printing.md) | Printer discovery and silent printing |
| 5 | [UI Flow & Admin](./prompts/05-ui-flow.md) | State machine screens and admin modal |

Parts 2–4 are independent of each other (all depend on Part 1); Part 5 integrates everything.
