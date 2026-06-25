import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface TitanicProps {
  targetX: number;
  z?: number;
  onClick?: () => void;
  enabled?: boolean;
}

/** Stylized Titanic-inspired ocean liner. */
export function Titanic({ targetX, z = 0, onClick, enabled }: TitanicProps) {
  const group = useRef<THREE.Group>(null);
  const smokeRefs = useRef<THREE.Mesh[]>([]);
  const hoverRef = useRef(false);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 1.2, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, z, 2, dt);
    // gentle sway
    const t = performance.now() / 1000;
    g.rotation.z = Math.sin(t * 0.7) * 0.025;
    g.position.y = Math.sin(t * 0.9) * 0.06;
    // smoke drift
    smokeRefs.current.forEach((s, i) => {
      if (!s) return;
      s.position.y += dt * (0.4 + (i % 3) * 0.05);
      s.position.x += dt * 0.3;
      const mat = s.material as THREE.MeshBasicMaterial;
      if (s.position.y > 3.5) {
        s.position.y = 1.9;
        s.position.x = funnelXs[i % funnelXs.length];
        mat.opacity = 0.55;
      } else {
        mat.opacity *= 0.985;
      }
    });
  });

  const funnelXs = useMemo(() => [-1.3, -0.45, 0.4, 1.25], []);
  const portholes = useMemo(() => {
    const arr: Array<[number, number, number]> = [];
    for (let i = -2.4; i <= 2.4; i += 0.35) {
      arr.push([i, 0.25, 0.42]);
      arr.push([i, 0.25, -0.42]);
    }
    return arr;
  }, []);

  return (
    <group
      ref={group}
      position={[targetX, 0, z]}
      onClick={(e) => {
        if (!enabled) return;
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        if (!enabled) return;
        e.stopPropagation();
        hoverRef.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hoverRef.current = false;
        document.body.style.cursor = "";
      }}
    >
      {/* hull - black */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.4, 0.5, 1.05]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* hull bow taper */}
      <mesh position={[2.85, 0.05, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.55, 1.2, 4]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.6} />
      </mesh>
      {/* hull stern */}
      <mesh position={[-2.85, 0.05, 0]} rotation={[0, Math.PI, 0]} castShadow>
        <coneGeometry args={[0.55, 0.9, 4]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.6} />
      </mesh>
      {/* red waterline stripe */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[5.5, 0.12, 1.07]} />
        <meshStandardMaterial color="#8a1a14" roughness={0.7} />
      </mesh>
      {/* superstructure - white */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[3.6, 0.55, 0.9]} />
        <meshStandardMaterial color="#f0ece2" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[3.0, 0.35, 0.75]} />
        <meshStandardMaterial color="#f0ece2" roughness={0.7} />
      </mesh>
      {/* portholes (emissive) */}
      {portholes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#ffd089" emissive="#ffb35a" emissiveIntensity={1.6} />
        </mesh>
      ))}
      {/* 4 funnels (cream + black top) */}
      {funnelXs.map((x, i) => (
        <group key={i} position={[x, 1.55, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.14, 0.95, 14]} />
            <meshStandardMaterial color="#dcc89c" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.135, 0.135, 0.12, 14]} />
            <meshStandardMaterial color="#08080a" />
          </mesh>
        </group>
      ))}
      {/* deck mast */}
      <mesh position={[2.0, 1.1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh position={[-2.0, 1.0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      {/* warm lantern */}
      <pointLight position={[1.5, 1.1, 0]} intensity={1.2} distance={3.5} color="#ffb56a" />
      {/* smoke sprites */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`smk${i}`}
          ref={(el) => {
            if (el) smokeRefs.current[i] = el;
          }}
          position={[funnelXs[i % 4], 2.1 + (i % 2) * 0.3, 0]}
        >
          <sphereGeometry args={[0.18 + (i % 3) * 0.04, 8, 8]} />
          <meshBasicMaterial color="#1c1820" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
