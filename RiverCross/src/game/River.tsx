import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/** Choppy night water with a custom vertex/fragment shader. */
export function River() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color("#1e3550") },
      uShallow: { value: new THREE.Color("#3a5a82") },
      uFoam: { value: new THREE.Color("#6f8bb0") },
    }),
    [],
  );

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[80, 40, 200, 100]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vert}
        fragmentShader={frag}
        transparent
      />
    </mesh>
  );
}

const vert = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying float vWave;

float wave(vec2 p, vec2 dir, float freq, float speed, float amp) {
  return sin(dot(p, dir) * freq + uTime * speed) * amp;
}

void main() {
  vUv = uv;
  vec3 pos = position;
  float w = 0.0;
  w += wave(pos.xy, normalize(vec2(1.0, 0.3)), 0.55, 1.4, 0.08);
  w += wave(pos.xy, normalize(vec2(-0.4, 1.0)), 0.9, 1.9, 0.05);
  w += wave(pos.xy, normalize(vec2(0.7, -0.7)), 1.5, 2.3, 0.03);
  pos.z += w;
  vWave = w;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const frag = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
varying vec2 vUv;
varying float vWave;

void main() {
  float depth = smoothstep(-0.15, 0.15, vWave);
  vec3 col = mix(uDeep, uShallow, depth);
  float crest = smoothstep(0.08, 0.14, vWave);
  col = mix(col, uFoam, crest * 0.6);
  gl_FragColor = vec4(col, 1.0);
}
`;
