import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Kind } from "./state";

interface CharacterProps {
  id: string;
  kind: Kind;
  target: [number, number, number];
  facing?: number; // rotation Y target
  selectable: boolean;
  highlighted?: boolean;
  devoured?: boolean;
  onClick?: () => void;
}

const PRIEST_ROBE = "#ff7a1a";
const PRIEST_ROBE_DARK = "#c44a00";
const SKIN = "#e0a978";
const DEMO_BODY = "#7a7a82";
const DEMO_DARK = "#3a3a40";

export function Character({ id, kind, target, facing = 0, selectable, highlighted, devoured, onClick }: CharacterProps) {
  const group = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const hoverRef = useRef(false);
  const idleSeed = useMemo(() => Math.random() * Math.PI * 2, []);
  const devourStart = useRef<number | null>(null);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    // devour animation: shrink + tilt + sink for priests; flare/grow for demons
    if (devoured) {
      if (devourStart.current === null) devourStart.current = performance.now();
      const t = Math.min(1, (performance.now() - devourStart.current) / 1400);
      if (kind === "priest") {
        const s = Math.max(0.01, 1 - t);
        g.scale.setScalar(s);
        g.rotation.z = t * 1.4;
        g.position.set(target[0], target[1] - t * 0.4, target[2]);
      } else {
        const s = 1 + t * 0.35;
        g.scale.setScalar(s);
        g.position.set(target[0], target[1] + Math.sin(t * Math.PI) * 0.15, target[2]);
        g.rotation.y = facing + Math.sin(performance.now() / 80) * 0.15 * (1 - t);
      }
      if (ringRef.current) (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      return;
    }
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, 1, 6, dt));
    // lerp toward target
    g.position.x = THREE.MathUtils.damp(g.position.x, target[0], 4, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, target[1], 6, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, target[2], 4, dt);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, facing, 4, dt);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, 0, 4, dt);
    // idle bob
    const t = performance.now() / 1000 + idleSeed;
    g.position.y += Math.sin(t * 2) * 0.015;
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 250);
      mat.opacity = highlighted ? 0.45 + pulse * 0.35 : hoverRef.current ? 0.25 : 0;
      ringRef.current.scale.setScalar(highlighted ? 1 + pulse * 0.12 : 1);
    }
  });

  return (
    <group
      ref={group}
      position={target}
      onClick={(e) => {
        if (!selectable) return;
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        if (!selectable) return;
        e.stopPropagation();
        hoverRef.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hoverRef.current = false;
        document.body.style.cursor = "";
      }}
    >
      {/* highlight ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.32, 0.42, 32]} />
        <meshBasicMaterial color={kind === "priest" ? "#ffaa55" : "#ff3344"} transparent opacity={0} />
      </mesh>
      {kind === "priest" ? <PriestMesh key={id} /> : <DemogorgonMesh key={id} />}
    </group>
  );
}

function PriestMesh() {
  const armSwing = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!armSwing.current) return;
    const t = performance.now() / 600;
    armSwing.current.rotation.x = Math.sin(t) * 0.08;
  });
  return (
    <group>
      {/* legs (orange pants) */}
      <mesh position={[-0.07, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.36, 10]} />
        <meshStandardMaterial color={PRIEST_ROBE_DARK} roughness={0.85} />
      </mesh>
      <mesh position={[0.07, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.36, 10]} />
        <meshStandardMaterial color={PRIEST_ROBE_DARK} roughness={0.85} />
      </mesh>
      {/* shoes */}
      <mesh position={[-0.07, 0.02, 0.03]} castShadow>
        <boxGeometry args={[0.1, 0.05, 0.16]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.9} />
      </mesh>
      <mesh position={[0.07, 0.02, 0.03]} castShadow>
        <boxGeometry args={[0.1, 0.05, 0.16]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.9} />
      </mesh>
      {/* torso (orange tunic) */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.42, 14]} />
        <meshStandardMaterial color={PRIEST_ROBE} roughness={0.7} emissive={PRIEST_ROBE_DARK} emissiveIntensity={0.08} />
      </mesh>
      {/* shoulders */}
      <mesh position={[0, 0.77, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={PRIEST_ROBE} roughness={0.7} />
      </mesh>
      {/* rope belt */}
      <mesh position={[0, 0.4, 0]}>
        <torusGeometry args={[0.18, 0.018, 8, 24]} />
        <meshStandardMaterial color="#3a2a18" roughness={1} />
      </mesh>
      {/* arms */}
      <group ref={armSwing} position={[0, 0.78, 0]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.21, 0, 0]}>
            <mesh position={[0, -0.16, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.045, 0.32, 10]} />
              <meshStandardMaterial color={PRIEST_ROBE} roughness={0.75} />
            </mesh>
            {/* hand */}
            <mesh position={[0, -0.36, 0]}>
              <sphereGeometry args={[0.05, 12, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
      {/* neck */}
      <mesh position={[0, 0.86, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.06, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.97, 0]} castShadow>
        <sphereGeometry args={[0.11, 20, 18]} />
        <meshStandardMaterial color={SKIN} roughness={0.55} />
      </mesh>
      {/* hair cap */}
      <mesh position={[0, 1.02, -0.015]} castShadow>
        <sphereGeometry args={[0.115, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#2a1810" roughness={0.95} />
      </mesh>
      {/* eyes */}
      <mesh position={[-0.04, 0.98, 0.095]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.04, 0.98, 0.095]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* mouth */}
      <mesh position={[0, 0.935, 0.1]}>
        <boxGeometry args={[0.03, 0.005, 0.005]} />
        <meshStandardMaterial color="#4a2018" />
      </mesh>
    </group>
  );
}

function DemogorgonMesh() {
  const petalCount = 5;
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = performance.now() / 1000;
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 1.3) * 0.02;
      bodyRef.current.rotation.x = -0.18 + Math.sin(t * 0.7) * 0.03;
    }
    if (!headRef.current) return;
    const open = 0.35 + Math.sin(t * 1.4) * 0.25 + 0.25;
    headRef.current.children.forEach((c, i) => {
      const angle = (i / petalCount) * Math.PI * 2;
      const r = 0.12 + open * 0.09;
      c.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      c.rotation.set(Math.PI / 2 - open * 1.1, angle, 0);
    });
  });
  return (
    <group ref={bodyRef}>
      {/* hunched legs */}
      {[-1, 1].map((s) => (
        <group key={`leg${s}`}>
          <mesh position={[s * 0.09, 0.22, -0.02]} rotation={[0.2, 0, s * -0.05]} castShadow>
            <cylinderGeometry args={[0.055, 0.045, 0.42, 10]} />
            <meshStandardMaterial color={DEMO_BODY} roughness={0.95} />
          </mesh>
          <mesh position={[s * 0.11, 0.02, 0.06]} castShadow>
            <boxGeometry args={[0.11, 0.04, 0.18]} />
            <meshStandardMaterial color={DEMO_DARK} roughness={1} />
          </mesh>
          {/* toe claws */}
          {[-1, 0, 1].map((tx) => (
            <mesh key={tx} position={[s * 0.11 + tx * 0.03, 0.015, 0.15]} rotation={[0.6, 0, 0]}>
              <coneGeometry args={[0.012, 0.05, 5]} />
              <meshStandardMaterial color="#0a0a0c" />
            </mesh>
          ))}
        </group>
      ))}
      {/* gaunt torso – stretched */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 0.55, 16]} />
        <meshStandardMaterial color={DEMO_BODY} roughness={0.95} />
      </mesh>
      {/* ribs */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.5 + i * 0.07, 0.14]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.13, 0.012, 6, 14, Math.PI]} />
          <meshStandardMaterial color={DEMO_DARK} roughness={1} />
        </mesh>
      ))}
      {/* sternum gash */}
      <mesh position={[0, 0.65, 0.16]}>
        <boxGeometry args={[0.02, 0.3, 0.01]} />
        <meshStandardMaterial color="#1a0608" emissive="#5a0810" emissiveIntensity={0.4} />
      </mesh>
      {/* shoulders */}
      <mesh position={[0, 0.88, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={DEMO_BODY} roughness={0.95} />
      </mesh>
      {/* long sinewy arms */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.18, 0.86, 0]} rotation={[0.3, 0, s * 0.5]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, 0.45, 8]} />
            <meshStandardMaterial color={DEMO_BODY} roughness={0.95} />
          </mesh>
          <mesh position={[s * 0.05, -0.5, 0.08]} rotation={[0.5, 0, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.035, 0.42, 8]} />
            <meshStandardMaterial color={DEMO_BODY} roughness={0.95} />
          </mesh>
          {/* claw hand */}
          {[-1, 0, 1].map((c) => (
            <mesh key={c} position={[s * 0.1 + c * 0.025, -0.74, 0.18]} rotation={[1.2, 0, 0]}>
              <coneGeometry args={[0.018, 0.1, 5]} />
              <meshStandardMaterial color="#0a0a0c" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
      {/* neck */}
      <mesh position={[0, 0.99, 0.02]} rotation={[0.25, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.16, 10]} />
        <meshStandardMaterial color={DEMO_BODY} roughness={0.95} />
      </mesh>
      {/* head core (dark) */}
      <mesh position={[0, 1.12, 0.06]} castShadow>
        <sphereGeometry args={[0.16, 20, 18]} />
        <meshStandardMaterial color="#0e0e12" roughness={0.45} />
      </mesh>
      {/* inner gore */}
      <mesh position={[0, 1.14, 0.08]}>
        <sphereGeometry args={[0.1, 16, 14]} />
        <meshStandardMaterial color="#3a0408" emissive="#7a0a14" emissiveIntensity={0.5} roughness={0.3} />
      </mesh>
      {/* flower-maw petals */}
      <group ref={headRef} position={[0, 1.14, 0.08]}>
        {Array.from({ length: petalCount }).map((_, i) => (
          <mesh key={i} castShadow>
            <coneGeometry args={[0.13, 0.34, 5]} />
            <meshStandardMaterial color={DEMO_BODY} roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
      {/* teeth ring */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.1, 1.14, 0.08 + Math.sin(a) * 0.1]} rotation={[0, -a, 0]}>
            <coneGeometry args={[0.012, 0.05, 4]} />
            <meshStandardMaterial color="#f4ead8" roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}
