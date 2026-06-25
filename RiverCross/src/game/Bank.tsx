import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface BankProps {
  side: "L" | "R";
}

export function Bank({ side }: BankProps) {
  const x = side === "L" ? -10 : 10;
  const reeds = useMemo(() => {
    const arr: Array<[number, number, number, number]> = [];
    for (let i = 0; i < 28; i++) {
      const rx = (Math.random() - 0.5) * 7;
      const rz = (Math.random() - 0.5) * 14;
      arr.push([rx, 0, rz, Math.random() * Math.PI]);
    }
    return arr;
  }, []);

  return (
    <group position={[x, 0.5, 0]}>
      {/* terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 24, 1, 1]} />
        <meshStandardMaterial color="#7a6a52" roughness={1} />
      </mesh>
      {/* mound */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <boxGeometry args={[10, 1.2, 24]} />
        <meshStandardMaterial color="#5a4a36" roughness={1} />
      </mesh>
      {/* rocks scattered */}
      {Array.from({ length: 8 }).map((_, i) => {
        const rx = (Math.random() - 0.5) * 8;
        const rz = (Math.random() - 0.5) * 18;
        const s = 0.2 + Math.random() * 0.3;
        return (
          <mesh key={i} position={[rx, 0.05, rz]} castShadow>
            <dodecahedronGeometry args={[s, 0]} />
            <meshStandardMaterial color="#857665" roughness={1} />
          </mesh>
        );
      })}
      {/* reeds */}
      {reeds.map(([rx, ry, rz, rot], i) => (
        <Reed key={i} position={[rx, ry, rz]} rotation={rot} />
      ))}
      {/* dead tree */}
      <DeadTree position={[side === "L" ? -3 : 3, 0, -6]} bend={side === "L" ? 0.2 : -0.2} />
      <DeadTree position={[side === "L" ? -4 : 4, 0, 7]} bend={side === "L" ? 0.3 : -0.3} />
      {/* gangplank dock toward river */}
      <mesh position={[side === "L" ? 4.5 : -4.5, 0.05, 0]} castShadow>
        <boxGeometry args={[1.6, 0.06, 1.3]} />
        <meshStandardMaterial color="#6b4a2a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Reed({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    ref.current.rotation.z = Math.sin(t * 2 + position[0]) * 0.18;
  });
  return (
    <mesh ref={ref} position={[position[0], 0.25, position[2]]} rotation={[0, rotation, 0]}>
      <cylinderGeometry args={[0.01, 0.02, 0.5, 4]} />
      <meshStandardMaterial color="#2a2418" />
    </mesh>
  );
}

function DeadTree({ position, bend }: { position: [number, number, number]; bend: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    ref.current.rotation.z = bend + Math.sin(t * 1.2) * 0.04;
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.08, 0.14, 2.2, 8]} />
        <meshStandardMaterial color="#1a120a" roughness={1} />
      </mesh>
      {[0.7, 1.1, 1.5].map((y, i) => (
        <mesh key={i} position={[0.25 * (i % 2 ? 1 : -1), y, 0]} rotation={[0, 0, (i % 2 ? -1 : 1) * 0.6]} castShadow>
          <cylinderGeometry args={[0.03, 0.05, 0.7, 6]} />
          <meshStandardMaterial color="#1a120a" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
