import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { Character } from "./Character";
import { Titanic } from "./Titanic";
import { River } from "./River";
import { Bank } from "./Bank";
import { Storm } from "./Storm";
import type { Figure, GameState } from "./state";
import { boatOccupants } from "./state";

interface SceneProps {
  state: GameState;
  crossing: boolean;
  rejected: string | null;
  hint: { takePriests: number; takeDemons: number } | null;
  devouredIds: Set<string>;
  onBoardFig: (id: string) => void;
  onDisembarkFig: (id: string) => void;
  onCross: () => void;
}

const BOAT_DOCK_L = -4.5;
const BOAT_DOCK_R = 4.5;
const BANK_L_BASE = -8.2;
const BANK_R_BASE = 8.2;
const DECK_Y = 0.85;

export function GameScene(props: SceneProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 5.5, 17], fov: 45 }}
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#1a2238"]} />
      <fog attach="fog" args={["#1a2238", 40, 90]} />
      <SceneContents {...props} />
      <EffectComposer>
        <Bloom intensity={0.35} luminanceThreshold={1.0} luminanceSmoothing={0.05} mipmapBlur />
        <Vignette eskil={false} offset={0.4} darkness={0.35} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </Canvas>
  );
}

function SceneContents({ state, crossing, rejected, hint, devouredIds, onBoardFig, onDisembarkFig, onCross }: SceneProps) {
  const boatPosRef = useRef({ x: state.boatSide === "L" ? BOAT_DOCK_L : BOAT_DOCK_R });
  const cameraSway = useRef(0);
  const lightningRef = useRef<{ flash: () => void } | null>(null);

  // Crossing flash when rejected
  useEffect(() => {
    if (rejected) lightningRef.current?.flash();
  }, [rejected]);

  // Hint flash to give visual cue
  useEffect(() => {
    if (hint) lightningRef.current?.flash();
  }, [hint]);

  // Compute target X for boat
  const boatTargetX = useMemo(() => {
    if (crossing) {
      return state.boatSide === "L" ? BOAT_DOCK_R : BOAT_DOCK_L;
    }
    return state.boatSide === "L" ? BOAT_DOCK_L : BOAT_DOCK_R;
  }, [crossing, state.boatSide]);

  useFrame((root, dt) => {
    boatPosRef.current.x = THREE.MathUtils.damp(boatPosRef.current.x, boatTargetX, 1.2, dt);
    cameraSway.current += dt;
    root.camera.position.x = Math.sin(cameraSway.current * 0.2) * 0.3;
    root.camera.position.y = 5.5 + Math.sin(cameraSway.current * 0.35) * 0.1;
    root.camera.lookAt(0, 1.0, 0);
  });

  // Stable slot assignments
  const figuresByLoc = useMemo(() => groupFigures(state.figures), [state.figures]);
  const boatOcc = useMemo(() => boatOccupants(state), [state]);
  const onBoatSide = state.boatSide;

  // Compute hint targets (which figures should board next, from boat's current bank)
  const hintIds = useMemo<Set<string>>(() => {
    if (!hint) return new Set();
    const ids = new Set<string>();
    const bankFigs = figuresByLoc[onBoatSide];
    let pNeed = hint.takePriests;
    let dNeed = hint.takeDemons;
    for (const f of bankFigs) {
      if (f.kind === "priest" && pNeed > 0) {
        ids.add(f.id);
        pNeed--;
      } else if (f.kind === "demon" && dNeed > 0) {
        ids.add(f.id);
        dNeed--;
      }
    }
    return ids;
  }, [hint, figuresByLoc, onBoatSide]);

  // Slot positions on bank: front row close to dock, back row behind.
  const bankSlot = (side: "L" | "R", idx: number): [number, number, number] => {
    const baseX = side === "L" ? BANK_L_BASE : BANK_R_BASE;
    const dir = side === "L" ? -1 : 1;
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    return [baseX + dir * row * 1.1, 0, -2 + col * 2];
  };
  const facingForBank = (side: "L" | "R") => (side === "L" ? Math.PI / 2 : -Math.PI / 2);

  // Boat seat positions (relative to boat). Two slots on the deck.
  const boatSlotOffset = (idx: number): [number, number, number] => {
    return [idx === 0 ? -0.5 : 0.5, DECK_Y, 0];
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.95} color="#aac4ee" />
      <directionalLight
        position={[-8, 14, 6]}
        intensity={1.3}
        color="#cfe0ff"
      />
      <directionalLight position={[8, 12, -6]} intensity={0.6} color="#b0c0d8" />
      <hemisphereLight args={["#9bb4d8", "#2a3346", 0.9]} />

      <Storm lightningRef={lightningRef} />

      <River />

      <Bank side="L" />
      <Bank side="R" />

      {/* Figures on each bank */}
      {(["L", "R"] as const).map((side) =>
        figuresByLoc[side].map((f, idx) => (
          <Character
            key={f.id}
            id={f.id}
            kind={f.kind}
            target={bankSlot(side, idx)}
            facing={facingForBank(side)}
            selectable={side === onBoatSide && !crossing}
            highlighted={hintIds.has(f.id)}
            devoured={devouredIds.has(f.id)}
            onClick={() => onBoardFig(f.id)}
          />
        )),
      )}

      {/* Boat */}
      <BoatGroup
        boatPosRef={boatPosRef}
        enabled={!crossing && boatOcc.figures.length > 0}
        onClick={onCross}
      />

      {/* Figures on boat - parent visually to boat by computing position each frame */}
      {boatOcc.figures.map((f, idx) => (
        <BoatRiderCharacter
          key={f.id}
          figure={f}
          slotOffset={boatSlotOffset(idx)}
          boatPosRef={boatPosRef}
          selectable={!crossing}
          devoured={devouredIds.has(f.id)}
          onClick={() => onDisembarkFig(f.id)}
        />
      ))}
    </>
  );
}

function BoatGroup({
  boatPosRef,
  enabled,
  onClick,
}: {
  boatPosRef: React.MutableRefObject<{ x: number }>;
  enabled: boolean;
  onClick: () => void;
}) {
  // Titanic listens to boatPosRef via a wrapper that updates it each frame.
  return <TitanicFollow boatPosRef={boatPosRef} enabled={enabled} onClick={onClick} />;
}

function TitanicFollow({
  boatPosRef,
  enabled,
  onClick,
}: {
  boatPosRef: React.MutableRefObject<{ x: number }>;
  enabled: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) groupRef.current.position.x = boatPosRef.current.x;
  });
  return (
    <group ref={groupRef}>
      <Titanic targetX={0} enabled={enabled} onClick={onClick} />
    </group>
  );
}

function BoatRiderCharacter({
  figure,
  slotOffset,
  boatPosRef,
  selectable,
  devoured,
  onClick,
}: {
  figure: Figure;
  slotOffset: [number, number, number];
  boatPosRef: React.MutableRefObject<{ x: number }>;
  selectable: boolean;
  devoured: boolean;
  onClick: () => void;
}) {
  const wrapper = useRef<THREE.Group>(null);
  useFrame(() => {
    if (wrapper.current) wrapper.current.position.x = boatPosRef.current.x;
  });
  return (
    <group ref={wrapper}>
      <Character
        id={figure.id}
        kind={figure.kind}
        target={slotOffset}
        facing={0}
        selectable={selectable}
        devoured={devoured}
        onClick={onClick}
      />
    </group>
  );
}

function groupFigures(figures: Figure[]): { L: Figure[]; R: Figure[] } {
  const byKindOrder = [...figures].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "priest" ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
  return {
    L: byKindOrder.filter((f) => f.loc === "L"),
    R: byKindOrder.filter((f) => f.loc === "R"),
  };
}
