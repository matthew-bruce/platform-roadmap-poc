# Technology Roadmap PoC (Next.js + TypeScript + Tailwind)

A premium-styled executive roadmap canvas with:

- Sticky FY / RMG quarter / month timeline bands.
- Horizontal timeline (Jan 2026 → Jun 2027, 18 months).
- Theme + swimlane + initiative planning model.
- Drag/drop and resize interactions powered by `@dnd-kit`.
- Global and attached milestones.
- Freeze window overlays.
- Local-only persistence in `localStorage`.

## Run locally

```bash
npm install
npm run dev
```

Open: http://localhost:3000

## Controls included

- Roadmap selector + create / rename / delete (with confirmation).
- Collapsible sidebar.
- Add theme / swimlane / initiative / milestone / freeze.
- Initiative drag (horizontal timing + cross-lane/theme move), resize, and double-click edit modal.
- Swimlane and theme reordering.
- Global milestone horizontal drag.
- Reset demo data for current roadmap only (requires typing `RESET`).

## Persistence

All data is stored under one localStorage key:

- `roadmap-poc-v1`
