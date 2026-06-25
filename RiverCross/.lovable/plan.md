## Priests & Devils — "Stormy Crossing" 3D Puzzle

A polished browser game built with React Three Fiber where the player ferries 3 robed priests and 3 demons across a stormy river aboard a Titanic-styled ocean liner, without ever letting demons outnumber priests on either bank.

### Visual direction
- **Setting**: dark, stormy, windy night. Heavy clouds, sheet lightning that briefly lights the scene, wind-blown rain streaks, rolling fog over black choppy water. Distant thunder ambience (mutable).
- **Boat — Titanic-inspired ocean liner**: long black hull with red waterline stripe, white superstructure, four cream-and-black funnels venting smoke, tiny warm porthole lights. Stylized/low-poly so it reads as Titanic at a glance but fits the puzzle scale (the boat still holds at most 2 figures, standing on the foredeck).
- **Priests — humans in orange**: realistic-proportioned low-poly humans in saffron/orange monk robes with hoods, simple cinched rope belts, warm skin tones, hands clasped. Soft inner glow so they read against the dark scene.
- **Demons — Demogorgon-inspired** (Stranger Things vibe, not a literal copy to stay clear of IP filters on any AI-generated textures): tall, gaunt, pale-grey humanoid silhouette; head opens into a five-petaled flower-like maw with teeth; long clawed arms; hunched stance; subtle idle breathing animation; petals slowly flare when selected.
- **Banks**: muddy, rocky shore with dead reeds and a few bare trees bending in the wind on each side; wet ground reflections.
- **Postprocessing**: bloom (lightning, portholes, lantern on the boat), vignette, slight chromatic aberration on thunder flashes, film grain for stormy atmosphere.

### Gameplay (unchanged from prior plan)
- Click a figure on the boat's current bank → they walk up the gangplank into the boat (max 2).
- Click a seated figure → they disembark back to the bank.
- Click the boat (or "Set sail") → ship sails across with smoke + wake + camera sway.
- Illegal proposed crossings (demons would outnumber priests on either bank with priests present) are rejected with a red lightning flash, screen shake, and a tooltip: "The demons would devour the priests!"
- Win = all 6 on the far bank → storm briefly clears, sun-break beam, confetti, win modal.

### HUD / Helpers
- Top bar: move counter + mm:ss timer.
- Bottom bar: Undo, Reset, Hint, Rules.
- Hint: BFS solver over (priests, demons, boat-side) states; highlights the figures to board with a pulsing orange ring.
- Win modal with stats + Replay.

### Tech & files
- Stack: existing TanStack Start + React 19 + Tailwind v4. Add `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `canvas-confetti`.
- Pure-TS game logic separated from rendering.
- Files:
  - `src/routes/index.tsx` — replaces placeholder; renders the game with SEO head().
  - `src/game/state.ts` — types, move application, legality check, BFS hint solver.
  - `src/game/useGame.ts` — React store/reducer + animation queue.
  - `src/game/Scene.tsx` — R3F Canvas, lighting (key moonlight, lightning flash light), fog, postprocessing.
  - `src/game/Storm.tsx` — rain instanced particles, wind-driven clouds, lightning controller, thunder audio.
  - `src/game/River.tsx` — choppy water shader plane with normal-mapped ripples and foam at the hull.
  - `src/game/Bank.tsx` — terrain, reeds, bent trees, gangplank dock.
  - `src/game/Titanic.tsx` — Titanic-styled liner mesh (hull, decks, 4 funnels with smoke particles, porthole emissive lights).
  - `src/game/Priest.tsx` — orange-robed human character.
  - `src/game/Demogorgon.tsx` — Demogorgon-styled demon character with flower-maw animation.
  - `src/game/HUD.tsx` — counters, buttons, rules dialog, win modal (shadcn).
- Client-only Canvas mount (mount-gated wrapper) to avoid SSR `window` issues.

### Asset strategy
- All meshes built procedurally from Three.js primitives + a few subtle shaders — no external 3D files needed, keeps load fast and avoids IP-textured assets.
- A single rain normal map and a smoke sprite generated via the agent image tool into `src/assets/` if needed.

### Validation
- Build check, then a Playwright smoke test: load `/`, screenshot night scene, run the known 6-step solution programmatically through the store, assert win modal renders, capture final screenshot.

No backend needed — fully client-side.
