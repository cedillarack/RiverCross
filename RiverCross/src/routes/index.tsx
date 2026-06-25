import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameScene } from "@/game/Scene";
import { HUD } from "@/game/HUD";
import { useGame } from "@/game/useGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stormy River Crossing — 3D Priests & Demons River Puzzle" },
      {
        name: "description",
        content:
          "A cinematic 3D river-crossing puzzle: ferry 3 priests and 3 Demogorgon-like demons across a stormy night aboard a Titanic-styled liner.",
      },
      { property: "og:title", content: "Stormy River Crossing — 3D Priests & Demons" },
      {
        property: "og:description",
        content: "Solve the classic river-crossing puzzle in a dark, stormy 3D scene.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-black">
      <h1 className="sr-only">Stormy River Crossing — 3D Priests &amp; Demons River-Crossing Puzzle</h1>
      <ClientGame />
    </main>
  );
}

function ClientGame() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center text-amber-100/70">
        Loading the storm…
      </div>
    );
  }
  return <GameInner />;
}

function GameInner() {
  const game = useGame();
  return (
    <>
      <div className="absolute inset-0">
        <GameScene
          state={game.state}
          crossing={game.crossing}
          rejected={game.rejected}
          hint={game.hint}
          devouredIds={game.devouredIds}
          onBoardFig={game.boardFig}
          onDisembarkFig={game.disembarkFig}
          onCross={game.crossBoat}
        />
      </div>
      <HUD game={game} />
    </>
  );
}
