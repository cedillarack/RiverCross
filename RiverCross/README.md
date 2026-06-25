# RiverCross

**River Crossing Riddle game** — a cinematic 3D river-crossing puzzle built with React, TanStack Router, and Three.js.

Ferry 3 priests and 3 demons across a stormy river aboard a Titanic-styled liner, making sure the demons never outnumber the priests on either bank.

## How to Play

- **Board**: Click a figure on the current bank to board them onto the boat (max 2 passengers)
- **Disembark**: Click a figure on the boat to send them back to the current bank
- **Cross**: Tap the cross button to sail the boat to the other side
- **Hint**: Use the hint system (BFS solver) if you get stuck
- **Undo**: Step back to your previous move

### Rules

- The boat holds at most 2 figures
- At least 1 figure must be on the boat to cross
- If demons outnumber priests on either bank after crossing, they get devoured — game over
- Win by getting all 6 figures safely to the right bank

## Tech Stack

- **React 19** + **TypeScript**
- **TanStack Router** + **TanStack Start** (SSR)
- **Three.js** via `@react-three/fiber` + `@react-three/drei` (3D scene)
- **Tailwind CSS v4**
- **shadcn/ui** components
- **Vite**

## Getting Started

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build
```

## License

MIT
