import { useCallback, useEffect, useRef, useState } from "react";
import {
  board,
  canBoard,
  countsOnSide,
  // cross intentionally unused — illegal crossings must be allowed
  disembark,
  hasWon,
  initialState,
  isLegal,
  nextHint,
  type GameState,
} from "./state";

export interface GameHook {
  state: GameState;
  moves: number;
  elapsed: number;
  rejected: string | null;
  crossing: boolean;
  won: boolean;
  failed: boolean;
  failureReason: string | null;
  devouredIds: Set<string>;
  hint: { takePriests: number; takeDemons: number } | null;
  boardFig: (id: string) => void;
  disembarkFig: (id: string) => void;
  crossBoat: () => void;
  undo: () => void;
  reset: () => void;
  requestHint: () => void;
  clearHint: () => void;
}

function computeDevoured(state: GameState): Set<string> {
  const ids = new Set<string>();
  for (const side of ["L", "R"] as const) {
    const { priests, demons } = countsOnSide(state, side);
    if (priests > 0 && demons > priests) {
      // priests on that physical side (including those on boat when boat docked there)
      for (const f of state.figures) {
        const onSide = f.loc === side || (f.loc === "B" && state.boatSide === side);
        if (onSide && f.kind === "priest") ids.add(f.id);
      }
    }
  }
  return ids;
}

export function useGame(): GameHook {
  const [state, setState] = useState<GameState>(() => initialState());
  const historyRef = useRef<GameState[]>([]);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [rejected, setRejected] = useState<string | null>(null);
  const [crossing, setCrossing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [devouredIds, setDevouredIds] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState<GameHook["hint"]>(null);
  const won = hasWon(state);

  useEffect(() => {
    if (won || failed) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt, won, failed]);

  useEffect(() => {
    if (!rejected) return;
    const id = setTimeout(() => setRejected(null), 2200);
    return () => clearTimeout(id);
  }, [rejected]);

  const push = useCallback((next: GameState) => {
    historyRef.current.push(state);
    setState(next);
    setHint(null);
  }, [state]);

  const boardFig = useCallback((id: string) => {
    if (crossing || won || failed) return;
    if (!canBoard(state, id)) return;
    push(board(state, id));
  }, [state, crossing, won, failed, push]);

  const disembarkFig = useCallback((id: string) => {
    if (crossing || won || failed) return;
    push(disembark(state, id));
  }, [state, crossing, won, failed, push]);

  const crossBoat = useCallback(() => {
    if (crossing || won || failed) return;
    // Need at least one passenger
    const onBoat = state.figures.filter((f) => f.loc === "B").length;
    if (onBoat === 0) {
      setRejected("The boat needs at least one passenger.");
      return;
    }
    setCrossing(true);
    historyRef.current.push(state);
    setHint(null);
    window.setTimeout(() => {
      // Always perform the crossing, even if illegal — the consequences play out visibly.
      const forced: GameState = { ...state, boatSide: state.boatSide === "L" ? "R" : "L" };
      setState(forced);
      setMoves((m) => m + 1);
      setCrossing(false);
      if (!isLegal(forced)) {
        const doomed = computeDevoured(forced);
        setDevouredIds(doomed);
        setFailureReason("The demons devoured the priests!");
        // delay banner/modal to let the eating animation play
        window.setTimeout(() => setFailed(true), 1600);
      }
    }, 1800);
  }, [state, crossing, won, failed]);

  const undo = useCallback(() => {
    if (crossing || failed) return;
    const prev = historyRef.current.pop();
    if (!prev) return;
    setState(prev);
    setHint(null);
  }, [crossing, failed]);

  const reset = useCallback(() => {
    historyRef.current = [];
    setState(initialState());
    setMoves(0);
    setHint(null);
    setFailed(false);
    setFailureReason(null);
    setDevouredIds(new Set());
    setElapsed(0);
    setStartedAt(Date.now());
  }, []);

  const requestHint = useCallback(() => {
    const h = nextHint(state);
    if (!h) {
      setRejected("Disembark passengers first to get a hint.");
      return;
    }
    setHint(h);
  }, [state]);

  const clearHint = useCallback(() => setHint(null), []);

  return {
    state,
    moves,
    elapsed,
    rejected,
    crossing,
    won,
    failed,
    failureReason,
    devouredIds,
    hint,
    boardFig,
    disembarkFig,
    crossBoat,
    undo,
    reset,
    requestHint,
    clearHint,
  };
}
