import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RotateCcw, Lightbulb, BookOpen, Ship, AlertTriangle, Skull, MousePointerClick } from "lucide-react";
import type { GameHook } from "./useGame";

export function HUD({ game }: { game: GameHook }) {
  const [showRules, setShowRules] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (game.won) {
      setShowWin(true);
      confetti({
        particleCount: 220,
        spread: 90,
        startVelocity: 45,
        colors: ["#ff7a1a", "#ffb35a", "#f4ead8", "#8a1a14"],
        origin: { y: 0.4 },
      });
    }
  }, [game.won]);

  useEffect(() => {
    if (game.failed) setShowFail(true);
  }, [game.failed]);

  const mm = Math.floor(game.elapsed / 60).toString().padStart(2, "0");
  const ss = (game.elapsed % 60).toString().padStart(2, "0");
  const occ = game.state.figures.filter((f) => f.loc === "B").length;
  const devourActive = game.devouredIds.size > 0;

  return (
    <>
      {/* Devour red flash overlay */}
      {devourActive && (
        <div className="pointer-events-none absolute inset-0 z-20 animate-pulse bg-red-900/30 mix-blend-multiply" />
      )}
      {/* Intro overlay */}
      {showIntro && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowIntro(false)}
        >
          <div className="mx-4 max-w-md rounded-2xl border border-amber-400/30 bg-black/80 p-6 text-center shadow-2xl">
            <div className="font-serif text-2xl text-amber-100">Stormy River{"\u00a0"}Crossing</div>
            <div className="mt-4 space-y-3 text-sm text-amber-100/90">
              <div className="flex items-center justify-center gap-2">
                <MousePointerClick className="h-4 w-4 text-amber-300" />
                <span>Click a figure to <b>board the boat</b></span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Ship className="h-4 w-4 text-amber-300" />
                <span>Click <b>Set sail</b> to cross the river</span>
              </div>
              <div className="text-xs text-amber-100/60">
                Never let demons outnumber priests on any bank.
              </div>
            </div>
            <Button
              className="mt-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white"
              onClick={(e) => { e.stopPropagation(); setShowIntro(false); }}
            >
              Begin
            </Button>
          </div>
        </div>
      )}
      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 sm:p-6">
        <div className="pointer-events-auto rounded-xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-md">
          <div className="font-serif text-lg tracking-wide text-amber-100">
            Stormy River{"\u00a0"}Crossing
          </div>
          <div className="text-xs text-amber-100/70">
            Get all 6 to the far bank. Never let demons outnumber priests.
          </div>
        </div>
        <div className="pointer-events-auto flex gap-3">
          <Stat label="Moves" value={String(game.moves)} />
          <Stat label="Time" value={`${mm}:${ss}`} />
          <Stat label="On boat" value={`${occ}/2`} />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 p-4 sm:p-6">
        {/* Rejected toast */}
        {game.rejected && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-red-500/50 bg-red-950/80 px-4 py-2 text-sm text-red-100 shadow-lg backdrop-blur-md animate-fade-in">
            <AlertTriangle className="h-4 w-4" />
            {game.rejected}
          </div>
        )}
        {/* Hint banner */}
        {game.hint && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-950/70 px-4 py-2 text-sm text-amber-100 shadow-lg backdrop-blur-md animate-fade-in">
            <Lightbulb className="h-4 w-4" />
            Send {describeHint(game.hint)} across.
          </div>
        )}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/55 p-2 backdrop-blur-md">
          <Button
            size="lg"
            onClick={game.crossBoat}
            disabled={game.crossing || game.won || occ === 0}
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500"
          >
            <Ship className="mr-1 h-4 w-4" />
            Set sail
          </Button>
          <Button variant="secondary" onClick={game.reset} disabled={game.crossing}>
            <RotateCcw className="mr-1 h-4 w-4" /> Reset
          </Button>
          <Button variant="secondary" onClick={game.requestHint} disabled={game.crossing || game.won}>
            <Lightbulb className="mr-1 h-4 w-4" /> Hint
          </Button>
          <Button variant="secondary" onClick={() => setShowRules(true)}>
            <BookOpen className="mr-1 h-4 w-4" /> Rules
          </Button>
        </div>
      </div>

      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How to play</DialogTitle>
            <DialogDescription>
              Three priests in orange robes and three Demogorgon-like demons must cross the river on the ocean liner.
            </DialogDescription>
          </DialogHeader>
          <ul className="ml-5 list-disc space-y-2 text-sm text-foreground">
            <li>Click a figure on the boat's current bank to board (max 2 on the ship).</li>
            <li>Click a figure on the boat to send them back to shore.</li>
            <li>Press <span className="font-semibold">Set sail</span> to cross — the ship needs at least one passenger.</li>
            <li>
              On either bank, if priests are present and demons outnumber them, the demons will devour the priests.
            </li>
            <li>Use <span className="font-semibold">Hint</span> if you get stuck — it reveals the next safe move.</li>
          </ul>
          <DialogFooter>
            <Button onClick={() => setShowRules(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showWin} onOpenChange={setShowWin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">The storm breaks!</DialogTitle>
            <DialogDescription>
              All priests and demons reached the far bank — alive.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-white/10 bg-muted p-3">
              <div className="text-xs text-muted-foreground">Crossings</div>
              <div className="text-2xl font-semibold">{game.moves}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-muted p-3">
              <div className="text-xs text-muted-foreground">Time</div>
              <div className="text-2xl font-semibold">{mm}:{ss}</div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowWin(false);
                game.reset();
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white"
            >
              Play again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFail} onOpenChange={setShowFail}>
        <DialogContent className="border-red-700/60 bg-red-950/95">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-red-100">
              <Skull className="h-6 w-6 text-red-300" />
              The demons feasted
            </DialogTitle>
            <DialogDescription className="text-red-200/80">
              {game.failureReason ?? "Priests were outnumbered and devoured."}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-red-100/80">
            Never let demons outnumber priests on either bank (or aboard the docked ship).
          </p>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowFail(false);
                game.reset();
              }}
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500"
            >
              <RotateCcw className="mr-1 h-4 w-4" /> Try again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-center backdrop-blur-md">
      <div className="text-[10px] uppercase tracking-widest text-amber-100/60">{label}</div>
      <div className="font-mono text-sm font-semibold text-amber-100">{value}</div>
    </div>
  );
}

function describeHint(h: { takePriests: number; takeDemons: number }): string {
  const parts: string[] = [];
  if (h.takePriests) parts.push(`${h.takePriests} priest${h.takePriests > 1 ? "s" : ""}`);
  if (h.takeDemons) parts.push(`${h.takeDemons} demon${h.takeDemons > 1 ? "s" : ""}`);
  return parts.join(" and ");
}
