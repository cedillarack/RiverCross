import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

interface StormProps {
  lightningRef: React.MutableRefObject<{ flash: () => void } | null>;
}

/** Rain particles + lightning flash light. */
export function Storm({ lightningRef }: StormProps) {
  const rainRef = useRef<THREE.Points>(null);
  const flashRef = useRef<THREE.DirectionalLight>(null);
  const nextFlash = useRef(performance.now() + 4000);
  const flashUntil = useRef(0);
  const { scene } = useThree();

  const { positions, velocities } = useMemo(() => {
    const n = 1800;
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      vel[i] = 14 + Math.random() * 10;
    }
    return { positions: pos, velocities: vel };
  }, []);

  // expose flash trigger
  if (lightningRef) {
    lightningRef.current = {
      flash: () => {
        flashUntil.current = performance.now() + 220;
      },
    };
  }

  useFrame((_, dt) => {
    const r = rainRef.current;
    if (r) {
      const arr = r.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < velocities.length; i++) {
        arr[i * 3 + 1] -= velocities[i] * dt;
        arr[i * 3 + 0] += dt * 4; // wind
        if (arr[i * 3 + 1] < -0.5) {
          arr[i * 3 + 1] = 18 + Math.random() * 2;
          arr[i * 3 + 0] = (Math.random() - 0.5) * 60;
        }
        if (arr[i * 3 + 0] > 30) arr[i * 3 + 0] -= 60;
      }
      r.geometry.attributes.position.needsUpdate = true;
    }
    const now = performance.now();
    if (now > nextFlash.current) {
      flashUntil.current = now + 200 + Math.random() * 120;
      nextFlash.current = now + 5000 + Math.random() * 8000;
    }
    const active = now < flashUntil.current;
    if (flashRef.current) {
      const intensity = active ? 2.4 + Math.random() * 1.6 : 0;
      flashRef.current.intensity = intensity;
    }
    scene.background = active
      ? new THREE.Color("#5a7099")
      : new THREE.Color("#1a2238");
  });

  return (
    <>
      <points ref={rainRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial color="#9eb4cc" size={0.04} transparent opacity={0.35} sizeAttenuation depthWrite={false} />
      </points>
      <pointLight position={[0, 12, 0]} intensity={0.4} color="#b3c5e0" />
      <directionalLight ref={flashRef} position={[5, 20, 5]} intensity={0} color="#cfe0ff" />
    </>
  );
}
