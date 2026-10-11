import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import { AdditiveBlending, DoubleSide, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import type { WorldDef, WorldObject } from '../types';
import { useGame } from '../store/gameStore';
import { isObjectVisible, pendingChallengeAt } from '../game/interactions';
import { NoteShape } from './Scenery';
import { ensureMusicFont, signTexture, staffNoteTexture } from '../utils/canvasTextures';
import { CRYSTALS, QUEST_BY_ID } from '../quests/questData';
import { WORLDS } from './worldData';

export function WorldObjects({ world }: { world: WorldDef }) {
  const quests = useGame((s) => s.quests);
  const collected = useGame((s) => s.collected);
  const visible = world.objects.filter((o) => isObjectVisible(o, { quests, collected }));
  return (
    <>
      {visible.map((o) => (
        <ObjectMesh key={o.id} o={o} />
      ))}
    </>
  );
}

function ObjectMesh({ o }: { o: WorldObject }) {
  switch (o.kind) {
    case 'coin': return <Coin o={o} />;
    case 'collectible': return <Collectible o={o} />;
    case 'crystal': return <Crystal o={o} />;
    case 'gate': return <Gate o={o} />;
    case 'stone': return <NoteStone o={o} />;
    case 'board': return <Board o={o} />;
    case 'portal': return <Portal o={o} />;
    default: return null;
  }
}

function Coin({ o }: { o: WorldObject }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 2.5;
    ref.current.position.y = o.pos[1] + 1 + Math.sin(clock.elapsedTime * 3 + o.pos[0]) * 0.12;
  });
  return (
    <group ref={ref} position={[o.pos[0], o.pos[1] + 1, o.pos[2]]}>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.38, 0.38, 0.08, 18]} />
        <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
      </mesh>
      <group position-z={0.05} scale={0.38} position-y={-0.15}>
        <NoteShape color="#92400e" emissive={0} />
      </group>
    </group>
  );
}

function Collectible({ o }: { o: WorldObject }) {
  const ref = useRef<Group>(null);
  const colors: Record<string, string> = { q1notes: '#c084fc', q2scrolls: '#38bdf8', w2items: '#4ade80', w3items: '#fbbf24', w4items: '#f472b6', w5items: '#fb923c' };
  const color = colors[o.group ?? ''] ?? '#c084fc';
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 1.5;
    ref.current.position.y = o.pos[1] + 1.2 + Math.sin(clock.elapsedTime * 2) * 0.25;
  });
  return (
    <group position={[o.pos[0], 0, o.pos[2]]}>
      <group ref={ref}>
        <NoteShape color={color} emissive={1} />
        <mesh>
          <sphereGeometry args={[1.0, 16, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
      {/* tiang cahaya */}
      <mesh position-y={o.pos[1] + 6}>
        <cylinderGeometry args={[0.25, 0.6, 12, 10, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
      </mesh>
      {o.label && (
        <Html position={[0, o.pos[1] + 2.6, 0]} center distanceFactor={12} zIndexRange={[10, 0]}>
          <div className="pointer-events-none select-none rounded-full bg-white/90 px-3 py-0.5 font-display text-2xl font-extrabold text-violet-700 shadow-lg">
            {o.label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Crystal({ o }: { o: WorldObject }) {
  const ref = useRef<Group>(null);
  const c = CRYSTALS.find((x) => x.id === o.group)?.color ?? '#a78bfa';
  const appear = useRef(0);
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    appear.current = Math.min(1, appear.current + dt * 0.8);
    ref.current.scale.setScalar(appear.current);
    ref.current.rotation.y = clock.elapsedTime * 1.2;
    ref.current.position.y = o.pos[1] + 1.6 + Math.sin(clock.elapsedTime * 1.6) * 0.2;
  });
  return (
    <group position={[o.pos[0], 0, o.pos[2]]}>
      <group ref={ref} scale={0}>
        <mesh scale={[0.7, 1.2, 0.7]}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.1} flatShading transparent opacity={0.92} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.6, 16, 12]} />
          <meshBasicMaterial color={c} transparent opacity={0.12} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
        <pointLight color={c} intensity={8} distance={10} />
      </group>
      <mesh position-y={o.pos[1] + 0.1} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.2, 1.6, 32]} />
        <meshBasicMaterial color={c} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function Gate({ o }: { o: WorldObject }) {
  const opened = useGame((s) => s.opened.includes(o.id));
  const barrier = useRef<Mesh>(null);
  const tex = useMemo(() => staffNoteTexture(null, 'treble', 'Gerbang Baluk', '#ede9fe'), []);
  useFrame((_, dt) => {
    if (!barrier.current) return;
    const target = opened ? -4 : 1.9;
    barrier.current.position.y += (target - barrier.current.position.y) * Math.min(1, dt * 2);
    const m = barrier.current.material as MeshStandardMaterial;
    m.opacity += ((opened ? 0 : 0.92) - m.opacity) * Math.min(1, dt * 2);
  });
  return (
    <group position={o.pos}>
      {[-2.4, 2.4].map((x) => (
        <mesh key={x} position={[x, 2, 0]} castShadow>
          <boxGeometry args={[0.7, 4, 0.7]} />
          <meshStandardMaterial color="#6d28d9" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 4.2, 0]} castShadow>
        <boxGeometry args={[5.6, 0.6, 0.8]} />
        <meshStandardMaterial color="#7c3aed" flatShading />
      </mesh>
      <mesh position={[0, 4.9, 0]}>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color={opened ? '#fde047' : '#a78bfa'} emissive={opened ? '#fde047' : '#a78bfa'} emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={barrier} position={[0, 1.9, 0]}>
        <planeGeometry args={[4.1, 3.6]} />
        <meshStandardMaterial map={tex} transparent opacity={0.92} side={DoubleSide} emissive="#c4b5fd" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function NoteStone({ o }: { o: WorldObject }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { void ensureMusicFont().then(() => setReady(true)); }, []);
  const tex = useMemo(() => staffNoteTexture(o.note!, 'treble', 'Klef Trebel'), [o.note, ready]);
  const quest = useGame((s) => s.quests.q3);
  const step = quest?.status === 'active' ? QUEST_BY_ID.q3.steps[quest.step] : null;
  const lit = !!(step?.type === 'interact' && quest!.progress.includes(o.id));
  return (
    <group position={o.pos}>
      <mesh position-y={0.7} castShadow>
        <dodecahedronGeometry args={[1.0, 0]} />
        <meshStandardMaterial color={lit ? '#fde68a' : '#94a3b8'} emissive={lit ? '#fbbf24' : '#000'} emissiveIntensity={lit ? 0.6 : 0} flatShading />
      </mesh>
      <mesh position-y={1.75}>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 6]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <Billboard position-y={2.9} lockX lockZ>
        <mesh>
          <planeGeometry args={[2.4, 1.8]} />
          <meshStandardMaterial map={tex} side={DoubleSide} />
        </mesh>
      </Billboard>
    </group>
  );
}

function Board({ o }: { o: WorldObject }) {
  const quests = useGame((s) => s.quests);
  const pending = pendingChallengeAt(o.id, { quests });
  const tex = useMemo(() => signTexture([o.label ?? 'Papan', 'Tekan E']), [o.label]);
  const marker = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (marker.current) {
      marker.current.position.y = 3.6 + Math.sin(clock.elapsedTime * 3) * 0.15;
      marker.current.rotation.y = clock.elapsedTime * 2;
    }
  });
  return (
    <group position={o.pos} rotation-y={o.rotY ?? 0}>
      {[-1, 1].map((x) => (
        <mesh key={x} position={[x * 1.1, 1, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 2, 6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      ))}
      <mesh position-y={2.1} castShadow>
        <boxGeometry args={[2.8, 1.5, 0.15]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
      <mesh position={[0, 2.1, 0.08]}>
        <planeGeometry args={[2.6, 1.3]} />
        <meshStandardMaterial map={tex} />
      </mesh>
      {pending && (
        <group ref={marker} position-y={3.6}>
          <QuestMarker color="#fde047" />
        </group>
      )}
    </group>
  );
}

export function QuestMarker({ color = '#fde047', kind = '!' }: { color?: string; kind?: '!' | '?' }) {
  return (
    <group>
      {kind === '!' ? (
        <>
          <mesh position-y={0.25}>
            <boxGeometry args={[0.18, 0.55, 0.18]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
          </mesh>
          <mesh position-y={-0.2}>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position-y={0.3}>
            <torusGeometry args={[0.2, 0.07, 6, 14, Math.PI * 1.5]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
          </mesh>
          <mesh position-y={-0.2}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
          </mesh>
        </>
      )}
    </group>
  );
}

function Portal({ o }: { o: WorldObject }) {
  const unlocked = useGame((s) => (o.target && o.target !== 'final' ? s.isWorldUnlocked(o.target) : false));
  const target = o.target && o.target !== 'final' ? WORLDS[o.target] : null;
  const swirl = useRef<Mesh>(null);
  const color = unlocked ? target?.accent ?? '#a78bfa' : '#64748b';
  useFrame(({ clock }) => {
    if (swirl.current) {
      swirl.current.rotation.z = clock.elapsedTime * (unlocked ? 1.5 : 0.2);
      const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.03;
      swirl.current.scale.set(s, s, 1);
    }
  });
  return (
    <group position={o.pos} rotation-y={o.rotY ?? 0}>
      <mesh position-y={2.2} castShadow>
        <torusGeometry args={[1.7, 0.28, 10, 32]} />
        <meshStandardMaterial color={unlocked ? '#f8fafc' : '#475569'} emissive={color} emissiveIntensity={unlocked ? 0.6 : 0.1} metalness={0.3} />
      </mesh>
      <mesh ref={swirl} position-y={2.2}>
        <circleGeometry args={[1.5, 6]} />
        <meshBasicMaterial color={color} transparent opacity={unlocked ? 0.75 : 0.35} side={DoubleSide} blending={unlocked ? AdditiveBlending : undefined} />
      </mesh>
      <mesh position-y={0.1}>
        <cylinderGeometry args={[1.9, 2.1, 0.2, 24]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <Html position={[0, 4.6, 0]} center distanceFactor={14} zIndexRange={[10, 0]}>
        <div className={`pointer-events-none select-none whitespace-nowrap rounded-xl px-3 py-1 text-center font-display text-lg font-bold shadow-lg ${unlocked ? 'bg-white/90 text-violet-800' : 'bg-slate-800/85 text-slate-200'}`}>
          {unlocked ? '' : '🔒 '}{target?.name}
        </div>
      </Html>
    </group>
  );
}
