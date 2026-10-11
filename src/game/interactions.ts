import type { WorldObject } from '../types';
import { useGame, type GameState } from '../store/gameStore';
import { useUI, type Nearby } from '../store/uiStore';
import { QUEST_BY_ID } from '../quests/questData';
import { WORLDS } from '../worlds/worldData';
import { CHALLENGE_SETS, getQuestion, pickQuestions } from '../questions';
import { playNote, sfx } from '../audio/audioEngine';
import { clearInput } from '../hooks/input';
import type { Question } from '../types';

/** Objek quest dipaparkan hanya ketika langkah kutipan yang berkaitan sedang aktif */
export function isObjectVisible(o: WorldObject, s: Pick<GameState, 'quests' | 'collected'>): boolean {
  if (o.kind === 'coin') return !s.collected.includes(o.id);
  if (o.kind === 'collectible' || o.kind === 'crystal') {
    if (s.collected.includes(o.id)) return false;
    const st = s.quests[o.quest!];
    if (!st || st.status !== 'active') return false;
    const step = QUEST_BY_ID[o.quest!].steps[st.step];
    return step?.type === 'collect' && step.group === o.group;
  }
  return true;
}

/** Cabaran yang sedang menunggu di objek/NPC ini (jika ada) */
export function pendingChallengeAt(at: string, s: Pick<GameState, 'quests'>): string | null {
  for (const [qid, st] of Object.entries(s.quests)) {
    if (st.status !== 'active') continue;
    const step = QUEST_BY_ID[qid].steps[st.step];
    if (step?.type === 'challenge' && step.at === at) return step.set;
  }
  return null;
}

export function launchQuestChallenge(setId: string) {
  const set = CHALLENGE_SETS[setId];
  const questions = set.questionIds.map((id) => getQuestion(id)).filter(Boolean) as Question[];
  clearInput();
  sfx('open');
  useUI.getState().startChallenge({ mode: 'quest', title: set.title, setId, questions });
}

export function launchPractice(topics: Question['topic'][], title: string, count = 5) {
  const s = useGame.getState();
  const mastered = new Set(Object.entries(s.qlog).filter(([, v]) => v.mastered).map(([k]) => k));
  clearInput();
  sfx('open');
  useUI.getState().startChallenge({ mode: 'practice', title, topic: topics[0], questions: pickQuestions(topics, count, mastered) });
}

/** Jalankan tindakan apabila pemain menekan E berhampiran sesuatu */
export function interact(n: Nearby) {
  const game = useGame.getState();
  const ui = useUI.getState();
  const world = WORLDS[game.world];
  if (n.kind === 'npc') {
    clearInput();
    sfx('open');
    ui.openDialogue(n.id);
    return;
  }
  const o = world.objects.find((x) => x.id === n.id);
  if (!o) return;
  switch (o.kind) {
    case 'board': {
      const set = pendingChallengeAt(o.id, game);
      if (set) launchQuestChallenge(set);
      else launchPractice(world.topics, `${o.label} — Latihan`);
      break;
    }
    case 'gate':
      game.interactObject(o);
      break;
    case 'stone':
      if (o.note) playNote(o.note, 0.9);
      game.interactObject(o);
      break;
    case 'portal':
      enterPortal(o);
      break;
    default:
      break;
  }
}

let portalBusy = false;
export function enterPortal(o: WorldObject) {
  if (portalBusy || !o.target || o.target === 'final') return;
  const game = useGame.getState();
  const ui = useUI.getState();
  const target = WORLDS[o.target];
  if (!game.isWorldUnlocked(o.target)) {
    sfx('locked');
    ui.pushToast(`${target.name} terkunci: ${target.unlockText}.`, 'warn');
    return;
  }
  portalBusy = true;
  clearInput();
  sfx('portal');
  ui.setTransition(target.name);
  setTimeout(() => {
    game.setWorld(o.target as typeof game.world);
    ui.setNearby(null);
    setTimeout(() => {
      ui.setTransition(null);
      portalBusy = false;
    }, 700);
  }, 800);
}

export function travelTo(worldId: GameState['world']) {
  const ui = useUI.getState();
  const game = useGame.getState();
  if (!game.isWorldUnlocked(worldId)) return;
  clearInput();
  sfx('portal');
  ui.setPanel(null);
  ui.setTransition(WORLDS[worldId].name);
  setTimeout(() => {
    game.setWorld(worldId);
    ui.respawn();
    setTimeout(() => ui.setTransition(null), 700);
  }, 600);
}
