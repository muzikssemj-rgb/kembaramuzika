import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import type { NPCDef } from '../types';
import { Avatar, type AnimState } from './Avatar';
import { QuestMarker } from '../worlds/WorldObjects';
import { useGame } from '../store/gameStore';
import { QUEST_BY_ID, QUESTS } from '../quests/questData';
import { playerPos } from '../game/playerState';

const SKIN: Record<string, string> = { maestro: '#e0ac69', komposer: '#f1c27d', ritma: '#c68642', tangga: '#8d5524', gema: '#c4b5fd', penjaga: '#e0ac69' };

/** Status penanda di atas kepala NPC: '!' quest baharu, '?' ada tugasan di sini */
export function npcMarker(npcId: string, s: ReturnType<typeof useGame.getState>): '!' | '?' | null {
  for (const [qid, st] of Object.entries(s.quests)) {
    if (st.status !== 'active') continue;
    const step = QUEST_BY_ID[qid].steps[st.step];
    if ((step.type === 'talk' && step.npc === npcId) || (step.type === 'challenge' && step.at === npcId)) return '?';
  }
  if (QUESTS.some((q) => q.giver === npcId && s.questAvailable(q.id))) return '!';
  if (npcId === 'penjaga' && s.quests.w5q?.status === 'done' && !s.final.passed) return '!';
  return null;
}

export function NPC({ npc }: { npc: NPCDef }) {
  const root = useRef<Group>(null);
  const marker = useRef<Group>(null);
  const anim = useRef<AnimState>({ speed: 0, grounded: true, vy: 0 });
  const state = useGame();
  const mark = npcMarker(npc.id, state);
  const config = useMemo(
    () => ({ name: npc.name, body: npc.color, skin: SKIN[npc.id] ?? '#f1c27d', hat: 'none' as const, accent: npc.accent }),
    [npc],
  );
  useFrame(({ clock }, dt) => {
    if (!root.current) return;
    const dx = playerPos.x - npc.pos[0];
    const dz = playerPos.z - npc.pos[2];
    const near = dx * dx + dz * dz < 64;
    anim.current.talking = near;
    const target = near ? Math.atan2(dx, dz) : 0;
    let diff = target - root.current.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    root.current.rotation.y += diff * Math.min(1, dt * 4);
    if (marker.current) {
      marker.current.position.y = 3.25 + Math.sin(clock.elapsedTime * 3) * 0.12;
      marker.current.rotation.y = clock.elapsedTime * 2;
    }
  });
  return (
    <group position={npc.pos}>
      <group ref={root}>
        <Avatar config={config} anim={anim} hatOverride={npc.hat} idleWave={!!mark} scale={1.1} />
      </group>
      {mark && (
        <group ref={marker} position-y={3.25} scale={1.7}>
          <QuestMarker kind={mark} color={mark === '!' ? '#fde047' : '#38bdf8'} />
        </group>
      )}
      <Html position={[0, 4.35, 0]} center distanceFactor={13} zIndexRange={[10, 0]}>
        <div className="pointer-events-none select-none whitespace-nowrap text-center">
          <div className="rounded-full bg-slate-900/75 px-3 py-0.5 font-display text-base font-bold text-white shadow">{npc.name}</div>
        </div>
      </Html>
    </group>
  );
}
