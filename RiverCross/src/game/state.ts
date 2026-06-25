// Pure game logic for Priests & Demons river crossing.

export type Side = "L" | "R";
export type Loc = "L" | "R" | "B"; // bank L, bank R, or Boat
export type Kind = "priest" | "demon";

export interface Figure {
  id: string;
  kind: Kind;
  loc: Loc;
}

export interface GameState {
  figures: Figure[];
  boatSide: Side;
}

export const BOAT_CAPACITY = 2;

export function initialState(): GameState {
  const figures: Figure[] = [];
  for (let i = 0; i < 3; i++) figures.push({ id: `p${i}`, kind: "priest", loc: "L" });
  for (let i = 0; i < 3; i++) figures.push({ id: `d${i}`, kind: "demon", loc: "L" });
  return { figures, boatSide: "L" };
}

export function countsOnSide(state: GameState, side: Side) {
  let priests = 0;
  let demons = 0;
  for (const f of state.figures) {
    const onSide = f.loc === side || (f.loc === "B" && state.boatSide === side);
    if (!onSide) continue;
    if (f.kind === "priest") priests++;
    else demons++;
  }
  return { priests, demons };
}

export function boatOccupants(state: GameState) {
  const onBoat = state.figures.filter((f) => f.loc === "B");
  return {
    priests: onBoat.filter((f) => f.kind === "priest").length,
    demons: onBoat.filter((f) => f.kind === "demon").length,
    figures: onBoat,
  };
}

export function isSideLegal(state: GameState, side: Side): boolean {
  const { priests, demons } = countsOnSide(state, side);
  if (priests === 0) return true;
  return demons <= priests;
}

export function isLegal(state: GameState): boolean {
  return isSideLegal(state, "L") && isSideLegal(state, "R");
}

export function hasWon(state: GameState): boolean {
  return state.figures.every((f) => f.loc === "R") && state.boatSide === "R";
}

export function canBoard(state: GameState, figId: string): boolean {
  const f = state.figures.find((x) => x.id === figId);
  if (!f) return false;
  if (f.loc !== state.boatSide) return false;
  const onBoat = state.figures.filter((x) => x.loc === "B").length;
  return onBoat < BOAT_CAPACITY;
}

export function board(state: GameState, figId: string): GameState {
  if (!canBoard(state, figId)) return state;
  return {
    ...state,
    figures: state.figures.map((f) => (f.id === figId ? { ...f, loc: "B" } : f)),
  };
}

export function disembark(state: GameState, figId: string): GameState {
  const f = state.figures.find((x) => x.id === figId);
  if (!f || f.loc !== "B") return state;
  return {
    ...state,
    figures: state.figures.map((x) =>
      x.id === figId ? { ...x, loc: state.boatSide } : x,
    ),
  };
}

export function canCross(state: GameState): { ok: boolean; reason?: string } {
  const occ = boatOccupants(state);
  if (occ.figures.length === 0) return { ok: false, reason: "The boat needs at least one passenger." };
  // Simulate the crossing: boat side flips; legality of both banks afterwards.
  const next: GameState = { ...state, boatSide: state.boatSide === "L" ? "R" : "L" };
  if (!isLegal(next)) {
    return { ok: false, reason: "The demons would devour the priests!" };
  }
  return { ok: true };
}

export function cross(state: GameState): GameState {
  const c = canCross(state);
  if (!c.ok) return state;
  return { ...state, boatSide: state.boatSide === "L" ? "R" : "L" };
}

/* ---------------- BFS solver for hints ---------------- */

interface Compact {
  pL: number; // priests on bank L (not on boat)
  dL: number;
  pR: number;
  dR: number;
  pB: number; // priests on boat
  dB: number;
  side: Side;
}

function compact(state: GameState): Compact {
  let pL = 0, dL = 0, pR = 0, dR = 0, pB = 0, dB = 0;
  for (const f of state.figures) {
    if (f.loc === "B") {
      if (f.kind === "priest") pB++;
      else dB++;
    } else if (f.loc === "L") {
      if (f.kind === "priest") pL++;
      else dL++;
    } else {
      if (f.kind === "priest") pR++;
      else dR++;
    }
  }
  return { pL, dL, pR, dR, pB, dB, side: state.boatSide };
}

function legalCompact(c: Compact): boolean {
  const sideP = (s: Side) => (s === "L" ? c.pL : c.pR) + (c.side === s ? c.pB : 0);
  const sideD = (s: Side) => (s === "L" ? c.dL : c.dR) + (c.side === s ? c.dB : 0);
  for (const s of ["L", "R"] as Side[]) {
    const p = sideP(s), d = sideD(s);
    if (p > 0 && d > p) return false;
  }
  return true;
}

type Move = { takePriests: number; takeDemons: number };

/** BFS in "stable" states where boat is empty before/after each crossing.
 *  A move loads p priests + d demons from boat's current bank (p+d in 1..2),
 *  crosses, then unloads them on the other bank. */
export function solve(state: GameState): Move[] | null {
  const start = compact(state);
  // canonicalize: assume boat empty at start of search
  if (start.pB || start.dB) return null; // only solve from stable
  type Key = string;
  const key = (c: Compact): Key => `${c.pL},${c.dL},${c.pR},${c.dR},${c.side}`;
  const visited = new Map<Key, { prev: Key | null; move: Move | null }>();
  visited.set(key(start), { prev: null, move: null });
  const queue: Compact[] = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    const k = key(cur);
    if (cur.pL === 0 && cur.dL === 0 && cur.side === "R") {
      // reconstruct
      const moves: Move[] = [];
      let curK: Key | null = k;
      while (curK !== null) {
        const node: { prev: Key | null; move: Move | null } = visited.get(curK)!;
        if (node.move) moves.push(node.move);
        curK = node.prev;
      }
      moves.reverse();
      return moves;
    }
    const availP = cur.side === "L" ? cur.pL : cur.pR;
    const availD = cur.side === "L" ? cur.dL : cur.dR;
    for (let tp = 0; tp <= Math.min(2, availP); tp++) {
      for (let td = 0; td <= Math.min(2 - tp, availD); td++) {
        if (tp + td < 1) continue;
        // build next compact
        const next: Compact = { ...cur };
        if (cur.side === "L") {
          next.pL -= tp; next.dL -= td;
          next.pR += tp; next.dR += td;
        } else {
          next.pR -= tp; next.dR -= td;
          next.pL += tp; next.dL += td;
        }
        next.side = cur.side === "L" ? "R" : "L";
        // legality during the trip: treat passengers as on origin/destination boat side
        const tripCompact: Compact = {
          pL: cur.side === "L" ? cur.pL - tp : cur.pL,
          dL: cur.side === "L" ? cur.dL - td : cur.dL,
          pR: cur.side === "R" ? cur.pR - tp : cur.pR,
          dR: cur.side === "R" ? cur.dR - td : cur.dR,
          pB: tp, dB: td,
          side: next.side, // boat now on dest side mid-arrival
        };
        if (!legalCompact(tripCompact)) continue;
        if (!legalCompact({ ...next, pB: 0, dB: 0 })) continue;
        const nk = key(next);
        if (visited.has(nk)) continue;
        visited.set(nk, { prev: k, move: { takePriests: tp, takeDemons: td } });
        queue.push(next);
      }
    }
  }
  return null;
}

export function nextHint(state: GameState): Move | null {
  const occ = boatOccupants(state);
  if (occ.priests || occ.demons) return null; // only hint from stable state
  const plan = solve(state);
  return plan && plan.length ? plan[0] : null;
}
