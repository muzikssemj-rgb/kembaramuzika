import type { GameState } from '../store/gameStore';
import { currentQuest } from '../store/gameStore';
import { QUESTS } from '../quests/questData';
import { WORLDS } from '../worlds/worldData';
import { NPCS } from '../worlds/worldData';

export interface ObjectiveInfo {
  questTitle: string;
  text: string;
  counter?: string;
  target?: [number, number, number];
  stepIndex: number;
  totalSteps: number;
  otherWorld?: string;
}

/** Tentukan objektif semasa dan sasaran (untuk penunjuk arah HUD) */
export function getObjective(s: GameState, px = 0, pz = 0): ObjectiveInfo | null {
  const q = currentQuest(s);
  const world = WORLDS[s.world];
  if (!q) {
    // tiada quest aktif: tunjuk NPC yang menawarkan quest seterusnya
    const avail = QUESTS.find((x) => x.world === s.world && s.questAvailable(x.id)) ?? QUESTS.find((x) => s.questAvailable(x.id));
    if (avail) {
      const npc = NPCS[avail.giver];
      const here = avail.world === s.world;
      return {
        questTitle: 'Quest baharu tersedia',
        text: here ? `Bercakap dengan ${npc.name}` : `Pergi ke ${WORLDS[avail.world].name} dan cari ${npc.name}`,
        target: here ? npc.pos : portalTo(s, avail.world),
        stepIndex: 0, totalSteps: avail.steps.length,
        otherWorld: here ? undefined : WORLDS[avail.world].name,
      };
    }
    if (s.quests.w5q?.status === 'done' && !s.final.passed) {
      const here = s.world === 'w5';
      return { questTitle: 'Ujian Penguasaan Akhir', text: here ? 'Bercakap dengan Penjaga Harmoni' : 'Pergi ke Kuil Triad', target: here ? NPCS.penjaga.pos : portalTo(s, 'w5'), stepIndex: 0, totalSteps: 1 };
    }
    return null;
  }
  const st = s.quests[q.id];
  const step = q.steps[st.step];
  const base = { questTitle: q.title, text: step.text, stepIndex: st.step, totalSteps: q.steps.length };
  if (q.world !== s.world) {
    return { ...base, text: `Kembali ke ${WORLDS[q.world].name}: ${step.text}`, target: portalTo(s, q.world), otherWorld: WORLDS[q.world].name };
  }
  let target: [number, number, number] | undefined;
  let counter: string | undefined;
  if (step.type === 'talk') target = NPCS[step.npc].pos;
  if (step.type === 'challenge') {
    target = NPCS[step.at]?.pos ?? world.objects.find((o) => o.id === step.at)?.pos;
  }
  if (step.type === 'collect') {
    counter = `${st.progress.length}/${step.count}`;
    const items = world.objects.filter((o) => o.group === step.group && !s.collected.includes(o.id));
    let best = Infinity;
    for (const o of items) {
      const d = Math.hypot(o.pos[0] - px, o.pos[2] - pz);
      if (d < best) { best = d; target = o.pos; }
    }
  }
  if (step.type === 'interact') {
    counter = step.objects.length > 1 ? `${st.progress.length}/${step.objects.length}` : undefined;
    const remaining = step.objects.filter((id) => !st.progress.includes(id));
    // untuk urutan, jangan dedahkan batu seterusnya — tunjuk kawasan umum sahaja
    const objs = world.objects.filter((o) => remaining.includes(o.id));
    if (step.ordered && objs.length) {
      const cx = objs.reduce((a, o) => a + o.pos[0], 0) / objs.length;
      const cz = objs.reduce((a, o) => a + o.pos[2], 0) / objs.length;
      target = [cx, objs[0].pos[1], cz];
    } else target = objs[0]?.pos;
  }
  return { ...base, counter, target };
}

function portalTo(s: GameState, w: GameState['world']): [number, number, number] | undefined {
  const world = WORLDS[s.world];
  const direct = world.objects.find((o) => o.kind === 'portal' && o.target === w);
  if (direct) return direct.pos;
  // jika tiada portal terus, tuju portal ke Kampung Notasi atau portal seterusnya
  const home = world.objects.find((o) => o.kind === 'portal' && o.target === 'w1');
  const fwd = world.objects.find((o) => o.kind === 'portal' && o.target !== 'w1');
  const order = ['w1', 'w2', 'w3', 'w4', 'w5'];
  return (order.indexOf(w) > order.indexOf(s.world) ? fwd ?? home : home ?? fwd)?.pos;
}
