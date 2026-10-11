import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { AvatarConfig } from '../types';

export interface AnimState { speed: number; grounded: boolean; vy: number; talking?: boolean }

interface Props {
  config: AvatarConfig;
  anim?: MutableRefObject<AnimState>;
  idleWave?: boolean;
  hatOverride?: 'conductor' | 'cap' | 'beret' | 'crown' | 'hood' | 'headphones' | 'none';
  scale?: number;
}

/**
 * Watak prosedural bergaya "low-poly" — badan, kepala, mata, anggota dan topi.
 * Animasi: rehat (bernafas), berjalan (hayun tangan/kaki), melompat (tangan ke atas).
 */
export function Avatar({ config, anim, idleWave, hatOverride, scale = 1 }: Props) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const head = useRef<Group>(null);
  const phase = useRef(Math.random() * 10);

  useFrame((_, dt) => {
    const a = anim?.current ?? { speed: 0, grounded: true, vy: 0 };
    const sp = Math.min(a.speed, 12);
    phase.current += dt * (sp > 0.3 ? 2.2 + sp * 0.9 : 2);
    const p = phase.current;
    const swing = sp > 0.3 ? Math.min(0.9, 0.25 + sp * 0.07) : 0;
    const k = 1 - Math.pow(0.001, dt);
    const lerp = (cur: number, target: number) => cur + (target - cur) * k * 0.6;
    if (legL.current && legR.current && armL.current && armR.current && body.current && head.current) {
      if (!a.grounded) {
        legL.current.rotation.x = lerp(legL.current.rotation.x, -0.5);
        legR.current.rotation.x = lerp(legR.current.rotation.x, 0.3);
        armL.current.rotation.z = lerp(armL.current.rotation.z, 2.4);
        armR.current.rotation.z = lerp(armR.current.rotation.z, -2.4);
        armL.current.rotation.x = lerp(armL.current.rotation.x, 0);
        armR.current.rotation.x = lerp(armR.current.rotation.x, 0);
        body.current.position.y = lerp(body.current.position.y, 0.05);
      } else {
        legL.current.rotation.x = Math.sin(p) * swing;
        legR.current.rotation.x = -Math.sin(p) * swing;
        armL.current.rotation.x = -Math.sin(p) * swing * 0.9;
        armR.current.rotation.x = Math.sin(p) * swing * 0.9;
        const wave = idleWave && sp < 0.3 ? 2.6 + Math.sin(p * 2.5) * 0.35 : 0.12;
        armL.current.rotation.z = lerp(armL.current.rotation.z, 0.12);
        armR.current.rotation.z = lerp(armR.current.rotation.z, -wave);
        body.current.position.y = sp > 0.3 ? Math.abs(Math.sin(p)) * 0.08 : Math.sin(p * 0.8) * 0.02;
      }
      head.current.rotation.z = sp > 0.3 ? Math.sin(p) * 0.05 : Math.sin(p * 0.5) * 0.04;
      head.current.rotation.x = a.talking ? Math.sin(p * 4) * 0.06 : 0;
    }
  });

  const hat = hatOverride ?? config.hat;
  return (
    <group ref={root} scale={scale}>
      {/* bayang bulat */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <group ref={body}>
        {/* kaki */}
        <group ref={legL} position={[-0.17, 0.62, 0]}>
          <mesh position-y={-0.3} castShadow>
            <capsuleGeometry args={[0.12, 0.38, 4, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, -0.58, 0.06]} castShadow>
            <boxGeometry args={[0.22, 0.12, 0.34]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
        <group ref={legR} position={[0.17, 0.62, 0]}>
          <mesh position-y={-0.3} castShadow>
            <capsuleGeometry args={[0.12, 0.38, 4, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, -0.58, 0.06]} castShadow>
            <boxGeometry args={[0.22, 0.12, 0.34]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
        {/* badan */}
        <mesh position-y={1.0} castShadow>
          <capsuleGeometry args={[0.34, 0.42, 6, 14]} />
          <meshStandardMaterial color={config.body} roughness={0.6} />
        </mesh>
        {/* simbol not di dada */}
        <mesh position={[0, 1.05, 0.33]} rotation-x={-0.1}>
          <circleGeometry args={[0.12, 16]} />
          <meshStandardMaterial color={config.accent} emissive={config.accent} emissiveIntensity={0.4} />
        </mesh>
        {/* tangan */}
        <group ref={armL} position={[-0.42, 1.28, 0]}>
          <mesh position-y={-0.28} castShadow>
            <capsuleGeometry args={[0.09, 0.36, 4, 8]} />
            <meshStandardMaterial color={config.body} />
          </mesh>
          <mesh position-y={-0.55}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color={config.skin} />
          </mesh>
        </group>
        <group ref={armR} position={[0.42, 1.28, 0]}>
          <mesh position-y={-0.28} castShadow>
            <capsuleGeometry args={[0.09, 0.36, 4, 8]} />
            <meshStandardMaterial color={config.body} />
          </mesh>
          <mesh position-y={-0.55}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color={config.skin} />
          </mesh>
        </group>
        {/* kepala */}
        <group ref={head} position-y={1.78}>
          <mesh castShadow>
            <sphereGeometry args={[0.36, 20, 16]} />
            <meshStandardMaterial color={config.skin} roughness={0.7} />
          </mesh>
          <mesh position={[-0.12, 0.04, 0.31]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshBasicMaterial color="#1e1b4b" />
          </mesh>
          <mesh position={[0.12, 0.04, 0.31]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshBasicMaterial color="#1e1b4b" />
          </mesh>
          <mesh position={[-0.1, 0.07, 0.36]}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
          <mesh position={[0.14, 0.07, 0.36]}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
          <mesh position={[0, -0.12, 0.32]} rotation-z={Math.PI}>
            <torusGeometry args={[0.07, 0.015, 6, 12, Math.PI]} />
            <meshBasicMaterial color="#7f1d1d" />
          </mesh>
          <mesh position={[-0.22, -0.06, 0.27]}>
            <circleGeometry args={[0.05, 10]} />
            <meshBasicMaterial color="#fb7185" transparent opacity={0.5} />
          </mesh>
          <mesh position={[0.22, -0.06, 0.27]}>
            <circleGeometry args={[0.05, 10]} />
            <meshBasicMaterial color="#fb7185" transparent opacity={0.5} />
          </mesh>
          <Hat kind={hat} color={config.accent} />
        </group>
      </group>
    </group>
  );
}

function Hat({ kind, color }: { kind: string; color: string }) {
  switch (kind) {
    case 'cap':
      return (
        <group position-y={0.2}>
          <mesh>
            <sphereGeometry args={[0.37, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.0, 0.3]} rotation-x={0.15}>
            <boxGeometry args={[0.4, 0.04, 0.3]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case 'headphones':
      return (
        <group>
          <mesh position-y={0.05} rotation-z={Math.PI / 2} rotation-y={Math.PI / 2}>
            <torusGeometry args={[0.4, 0.04, 8, 20, Math.PI]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          {[-0.38, 0.38].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.13, 0.13, 0.1, 14]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'crown':
      return (
        <group position-y={0.36}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.24, 0.16, 8, 1, true]} />
            <meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.3} side={2} />
          </mesh>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 0.22, 0.12, Math.sin((i / 8) * Math.PI * 2) * 0.22]}>
              <coneGeometry args={[0.04, 0.1, 4]} />
              <meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'beret':
      return (
        <mesh position={[0.05, 0.3, 0]} rotation-z={-0.25} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[0.36, 16, 10]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case 'conductor':
      return (
        <group position-y={0.3}>
          <mesh position-y={0.18}>
            <cylinderGeometry args={[0.24, 0.26, 0.42, 16]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
          <mesh position-y={0.0}>
            <cylinderGeometry args={[0.42, 0.42, 0.04, 20]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
          <mesh position-y={0.06}>
            <cylinderGeometry args={[0.265, 0.265, 0.07, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
        </group>
      );
    case 'hood':
      return (
        <mesh position={[0, 0.08, -0.04]}>
          <sphereGeometry args={[0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color={color} side={2} />
        </mesh>
      );
    default:
      return null;
  }
}
