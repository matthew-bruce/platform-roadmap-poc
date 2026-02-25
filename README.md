# Technology Roadmap PoC

Minimal Next.js (App Router) + TypeScript + Tailwind CSS proof of concept for an executive-style technology roadmap.

## Features

- Sticky 3-band timeline header: Financial Year, RMG quarters, and month labels.
- 18-month default range: Jan 2026 → Jun 2027.
- Collapsible sidebar with roadmap controls and add actions.
- Local-only persistence in `localStorage` (`technology-roadmap-poc-v1`).
- Demo data seeded on first load.
- Drag/drop powered by `@dnd-kit`:
  - Reorder themes.
  - Reorder/move swimlanes across themes.
  - Move initiatives across lanes/themes and shift timing by month.
  - Drag global milestones horizontally.
- Initiative resizing (left/right) snapped to month grid.
- Double-click initiative edit modal (title + exact month indices).
- Freeze window overlays with optional theme scoping.
- Attached milestones that stay anchored to initiative bars.

## Install and run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

## Notes

- This PoC intentionally keeps all data client-side and local-only.
- "Reset demo data" only resets the currently selected roadmap and requires typing `RESET`.
