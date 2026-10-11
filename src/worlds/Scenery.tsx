import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { BackSide, Color, type Group, type Mesh } from 'three';
import type { Decor, Island, WorldDef } from '../types';
import { BRIDGE_WIDTH } from '../game/physics';

// ===== Langit kecerunan =====
export function SkyDome({ top, bottom }: { top: string; bottom: string }) {
  const uniforms = useMemo(
    () => ({ topColor: { value: new Color(top) }, bottomColor: { value: new Color(bottom) } }),
    [top, bottom],
  );
  return (
    <mesh scale={400} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        side={BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={`varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`uniform vec3 topColor; uniform vec3 bottomColor; varying vec3 vP;
          void main(){ float h = clamp(vP.y*0.8+0.35,0.0,1.0); gl_FragColor = vec4(mix(bottomColor, topColor, h),1.0); }`}
      />
    </mesh>
  );
}

// ===== Awan rendah poligon =====
export function Clouds({ count = 10, color = '#ffffff', y = 26 }: { count?: number; color?: string; y?: number }) {
  const ref = useRef<Group>(null);
  const clouds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const r = 55 + (i % 3) * 18;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: y + (i % 4) * 4, s: 2 + (i % 3) };
      }),
    [count, y],
  );
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.01; });
  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {[[0, 0, 0, 1.6], [1.5, -0.2, 0.3, 1.2], [-1.5, -0.3, -0.2, 1.1], [0.6, 0.6, -0.4, 1.0]].map(([x, yy, z, r], k) => (
            <mesh key={k} position={[x, yy, z]}>
              <icosahedronGeometry args={[r, 0]} />
              <meshStandardMaterial color={color} flatShading roughness={1} transparent opacity={0.92} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ===== Pulau terapung =====
export function IslandMesh({ island, world }: { island: Island; world: WorldDef }) {
  const grass = island.color ?? world.grass;
  const depth = 4 + island.r * 0.35;
  return (
    <group position={[island.x, island.top, island.z]}>
      <mesh position-y={-0.3} receiveShadow>
        <cylinderGeometry args={[island.r, island.r * 0.97, 0.6, Math.max(18, Math.round(island.r * 2.2))]} />
        <meshStandardMaterial color={grass} flatShading roughness={0.9} />
      </mesh>
      <mesh position-y={-0.6 - depth / 2}>
        <cylinderGeometry args={[island.r * 0.97, island.r * 0.25, depth, Math.max(10, Math.round(island.r * 1.2)), 2]} />
        <meshStandardMaterial color={world.ground} flatShading roughness={1} />
      </mesh>
      <mesh position-y={-0.6 - depth - 0.8}>
        <coneGeometry args={[island.r * 0.25, 2.5, 7]} />
        <meshStandardMaterial color={world.ground} flatShading roughness={1} />
      </mesh>
    </group>
  );
}

// ===== Jambatan (biasa / kekunci piano) =====
export const PIANO_KEY_LEN = 1.25;
export function Bridge({ from, to, y, piano }: { from: [number, number]; to: [number, number]; y: number; piano?: boolean }) {
  const [x1, z1] = from;
  const [x2, z2] = to;
  const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
  const len = alongX ? Math.abs(x2 - x1) + 1 : Math.abs(z2 - z1) + 1;
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const rotY = alongX ? Math.PI / 2 : 0;
  if (!piano) {
    return (
      <group position={[cx, y, cz]} rotation-y={rotY}>
        <mesh position-y={-0.15} receiveShadow castShadow>
          <boxGeometry args={[BRIDGE_WIDTH, 0.3, len]} />
          <meshStandardMaterial color="#b45309" flatShading />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (BRIDGE_WIDTH / 2 - 0.1), 0.45, 0]}>
            <boxGeometry args={[0.12, 0.12, len]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        ))}
      </group>
    );
  }
  const n = Math.floor(len / PIANO_KEY_LEN);
  return (
    <group position={[cx, y, cz]} rotation-y={rotY}>
      <mesh position-y={-0.35}>
        <boxGeometry args={[BRIDGE_WIDTH + 0.4, 0.4, len]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {Array.from({ length: n }, (_, i) => {
        const z = -len / 2 + PIANO_KEY_LEN * (i + 0.5);
        const hasBlack = [0, 1, 3, 4, 5].includes(i % 7);
        return (
          <group key={i} position-z={z}>
            <mesh position-y={-0.1} receiveShadow castShadow>
              <boxGeometry args={[BRIDGE_WIDTH, 0.22, PIANO_KEY_LEN - 0.08]} />
              <meshStandardMaterial color="#fafaf9" roughness={0.35} />
            </mesh>
            {hasBlack && i < n - 1 && (
              <mesh position={[BRIDGE_WIDTH / 2 - 0.55, 0.06, PIANO_KEY_LEN / 2]}>
                <boxGeometry args={[1.0, 0.18, 0.62]} />
                <meshStandardMaterial color="#111827" roughness={0.3} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ===== Hiasan =====
export function DecorMesh({ d }: { d: Decor }) {
  const s = d.s ?? 1;
  const color = d.color;
  const content = (() => {
    switch (d.kind) {
      case 'noteTree':
        return <NoteTree color={color} />;
      case 'house':
        return <House color={color ?? '#f472b6'} />;
      case 'lamp':
        return <Lamp />;
      case 'pillar':
        return (
          <group>
            <mesh position-y={1.6} castShadow>
              <cylinderGeometry args={[0.45, 0.55, 3.2, 10]} />
              <meshStandardMaterial color={color ?? '#e9d5ff'} flatShading />
            </mesh>
            <mesh position-y={3.35}>
              <boxGeometry args={[1.3, 0.3, 1.3]} />
              <meshStandardMaterial color={color ?? '#e9d5ff'} flatShading />
            </mesh>
            <FloatingNote y={4.3} color="#a78bfa" />
          </group>
        );
      case 'crystalCluster':
        return (
          <group>
            {[[0, 1, 0, 1.2], [0.6, 0.6, 0.3, 0.7], [-0.5, 0.7, -0.2, 0.8], [0.1, 0.5, -0.6, 0.6]].map(([x, y, z, sc], i) => (
              <mesh key={i} position={[x, y * sc, z]} rotation={[0.2 * i, i, 0.15 * i]} scale={[0.5 * sc, 1.6 * sc, 0.5 * sc]}>
                <octahedronGeometry args={[0.8, 0]} />
                <meshStandardMaterial color={color ?? '#67e8f9'} emissive={color ?? '#67e8f9'} emissiveIntensity={0.7} flatShading transparent opacity={0.9} />
              </mesh>
            ))}
          </group>
        );
      case 'mushroom':
        return (
          <group>
            <mesh position-y={0.5}>
              <cylinderGeometry args={[0.2, 0.28, 1, 8]} />
              <meshStandardMaterial color="#fef3c7" />
            </mesh>
            <mesh position-y={1.05}>
              <sphereGeometry args={[0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#f43f5e" flatShading />
            </mesh>
          </group>
        );
      case 'drum':
        return (
          <group>
            <mesh position-y={0.6} castShadow>
              <cylinderGeometry args={[0.9, 0.9, 1.2, 16]} />
              <meshStandardMaterial color={color ?? '#dc2626'} />
            </mesh>
            <mesh position-y={1.22}>
              <cylinderGeometry args={[0.92, 0.92, 0.05, 16]} />
              <meshStandardMaterial color="#fef3c7" />
            </mesh>
            {[0.15, 1.05].map((y) => (
              <mesh key={y} position-y={y}>
                <torusGeometry args={[0.92, 0.05, 6, 20]} />
                <meshStandardMaterial color="#facc15" metalness={0.5} />
              </mesh>
            ))}
          </group>
        );
      case 'pine':
        return (
          <group>
            <mesh position-y={0.6}>
              <cylinderGeometry args={[0.2, 0.3, 1.2, 6]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
            {[1.6, 2.6, 3.5].map((y, i) => (
              <mesh key={y} position-y={y} castShadow>
                <coneGeometry args={[1.5 - i * 0.35, 1.6, 7]} />
                <meshStandardMaterial color={color ?? '#15803d'} flatShading />
              </mesh>
            ))}
          </group>
        );
      case 'rock':
        return (
          <mesh position-y={0.6} castShadow>
            <dodecahedronGeometry args={[1.1, 0]} />
            <meshStandardMaterial color={color ?? '#a8a29e'} flatShading />
          </mesh>
        );
      case 'stalagmite':
        return (
          <group>
            <mesh position-y={1.4}>
              <coneGeometry args={[0.8, 2.8, 6]} />
              <meshStandardMaterial color="#4c1d95" flatShading />
            </mesh>
            <mesh position={[0.5, 0.7, 0.3]}>
              <coneGeometry args={[0.35, 1.4, 5]} />
              <meshStandardMaterial color={color ?? '#a78bfa'} emissive={color ?? '#a78bfa'} emissiveIntensity={0.5} flatShading />
            </mesh>
          </group>
        );
      case 'bigNote':
        return <Fountain />;
      case 'temple':
        return <Temple />;
      default:
        return null;
    }
  })();
  return (
    <group position={d.pos} rotation-y={d.rotY ?? 0} scale={s}>
      {content}
    </group>
  );
}

export function FloatingNote({ y = 0, color = '#a78bfa', scale = 1 }: { y?: number; color?: string; scale?: number }) {
  const ref = useRef<Group>(null);
  const off = useMemo(() => Math.random() * 6, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = y + Math.sin(clock.elapsedTime * 1.5 + off) * 0.2;
    ref.current.rotation.y = clock.elapsedTime * 0.8 + off;
  });
  return (
    <group ref={ref} position-y={y} scale={scale}>
      <NoteShape color={color} />
    </group>
  );
}

/** Bentuk not kuaver 3D */
export function NoteShape({ color, emissive = 0.6 }: { color: string; emissive?: number }) {
  return (
    <group>
      <mesh rotation-z={0.4} scale={[1, 0.72, 0.6]}>
        <sphereGeometry args={[0.32, 14, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} />
      </mesh>
      <mesh position={[0.27, 0.62, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.25, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} />
      </mesh>
      <mesh position={[0.42, 1.0, 0]} rotation-z={-0.9}>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} />
      </mesh>
    </group>
  );
}

function NoteTree({ color }: { color?: string }) {
  const leaf = useMemo(() => color ?? ['#22c55e', '#10b981', '#84cc16'][Math.floor(Math.random() * 3)], [color]);
  return (
    <group>
      {/* batang seperti batang not */}
      <mesh position={[0.45, 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 4.2, 7]} />
        <meshStandardMaterial color="#7c4a1e" flatShading />
      </mesh>
      {/* kepala not = rimbunan bawah */}
      <mesh position={[0, 0.55, 0]} rotation-z={0.35} scale={[1.2, 0.8, 1]} castShadow>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color="#5b21b6" flatShading />
      </mesh>
      {/* bendera = rimbunan atas */}
      <mesh position={[1.1, 3.6, 0]} castShadow>
        <icosahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial color={leaf} flatShading />
      </mesh>
      <mesh position={[1.5, 2.8, 0.2]} castShadow>
        <icosahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color={leaf} flatShading />
      </mesh>
    </group>
  );
}

function House({ color }: { color: string }) {
  return (
    <group>
      <mesh position-y={1.3} castShadow receiveShadow>
        <boxGeometry args={[3.4, 2.6, 3.0]} />
        <meshStandardMaterial color="#fef3c7" flatShading />
      </mesh>
      <mesh position-y={3.3} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[2.9, 1.8, 4]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, 0.85, 1.51]}>
        <boxGeometry args={[0.9, 1.7, 0.05]} />
        <meshStandardMaterial color="#7c2d12" />
      </mesh>
      {/* tingkap berbentuk kekunci piano */}
      {[-1.1, 1.1].map((x) => (
        <group key={x} position={[x, 1.6, 1.51]}>
          <mesh>
            <boxGeometry args={[0.8, 0.7, 0.04]} />
            <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 0.12, 0.02]}>
            <boxGeometry args={[0.18, 0.45, 0.03]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
      ))}
      <mesh position={[1.0, 3.9, -0.4]}>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshStandardMaterial color="#9a3412" />
      </mesh>
    </group>
  );
}

function Lamp() {
  return (
    <group>
      <mesh position-y={1.2}>
        <cylinderGeometry args={[0.07, 0.1, 2.4, 6]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position-y={2.55}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function Fountain() {
  const water = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (water.current) water.current.rotation.y = clock.elapsedTime * 0.5;
  });
  return (
    <group>
      <mesh position-y={0.35} receiveShadow>
        <cylinderGeometry args={[2.4, 2.6, 0.7, 20]} />
        <meshStandardMaterial color="#e9d5ff" flatShading />
      </mesh>
      <mesh ref={water} position-y={0.66}>
        <cylinderGeometry args={[2.1, 2.1, 0.08, 20]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.3} transparent opacity={0.85} />
      </mesh>
      <group position-y={1.2} scale={2.2}>
        <FloatingNote color="#8b5cf6" />
      </group>
    </group>
  );
}

function Temple() {
  return (
    <group>
      <mesh position-y={0.03} receiveShadow>
        <boxGeometry args={[14, 0.06, 9]} />
        <meshStandardMaterial color="#fde68a" flatShading />
      </mesh>
      {/* dinding belakang */}
      <mesh position={[0, 3, -3.6]} castShadow>
        <boxGeometry args={[13, 6, 0.8]} />
        <meshStandardMaterial color="#fed7aa" flatShading />
      </mesh>
      {/* tiang hadapan */}
      {[-5, -2.5, 2.5, 5].map((x) => (
        <mesh key={x} position={[x, 3, 3]} castShadow>
          <cylinderGeometry args={[0.5, 0.6, 6, 10]} />
          <meshStandardMaterial color="#fff7ed" flatShading />
        </mesh>
      ))}
      {/* bumbung */}
      <mesh position={[0, 6.4, -0.3]} castShadow>
        <boxGeometry args={[14, 0.8, 8.5]} />
        <meshStandardMaterial color="#c2410c" flatShading />
      </mesh>
      <mesh position={[0, 7.6, -0.3]} rotation-y={Math.PI / 4} scale={[1, 0.35, 0.62]}>
        <coneGeometry args={[9.5, 4, 4]} />
        <meshStandardMaterial color="#9a3412" flatShading />
      </mesh>
      {/* tiga tiang harmoni */}
      {[[-3, '#fb7185'], [0, '#fbbf24'], [3, '#34d399']].map(([x, c]) => (
        <group key={x as number} position={[x as number, 0.4, -2.6]}>
          <mesh position-y={1}>
            <cylinderGeometry args={[0.3, 0.3, 2, 8]} />
            <meshStandardMaterial color={c as string} emissive={c as string} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function AmbientParticles({ color, count, area = 40 }: { color: string; count: number; area?: number }) {
  if (count <= 0) return null;
  return <Sparkles count={count} scale={[area * 2, 12, area * 2]} position={[0, 5, 0]} size={4} speed={0.3} color={color} opacity={0.8} />;
}
