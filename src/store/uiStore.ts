import { create } from 'zustand';
import type { Question, TopicId, WorldObject } from '../types';

export type Screen = 'menu' | 'intro' | 'avatar' | 'loading' | 'game';
export type Panel = null | 'pause' | 'quests' | 'book' | 'achievements' | 'progress' | 'settings' | 'worlds' | 'avatar' | 'help' | 'score';

export interface ChallengeSession {
  mode: 'quest' | 'practice' | 'daily' | 'final';
  title: string;
  setId?: string;
  topic?: TopicId;
  questions: Question[];
}

export interface Nearby {
  id: string;
  kind: 'npc' | WorldObject['kind'];
  label: string;
}

export interface Toast { id: number; text: string; kind: 'info' | 'good' | 'warn'; badge?: string }
export interface Celebration { title: string; subtitle: string; text: string; rewards: string[]; crystal?: string }

interface UIState {
  screen: Screen;
  panel: Panel;
  dialogueNpc: string | null;
  challenge: ChallengeSession | null;
  nearby: Nearby | null;
  toasts: Toast[];
  celebration: Celebration | null;
  respawnTick: number;
  transition: string | null; // nama dunia semasa peralihan portal
  setScreen: (s: Screen) => void;
  setPanel: (p: Panel) => void;
  openDialogue: (id: string | null) => void;
  startChallenge: (c: ChallengeSession | null) => void;
  setNearby: (n: Nearby | null) => void;
  pushToast: (text: string, kind?: Toast['kind'], badge?: string) => void;
  dismissToast: (id: number) => void;
  celebrate: (c: Celebration | null) => void;
  respawn: () => void;
  setTransition: (t: string | null) => void;
}

let toastId = 1;

export const useUI = create<UIState>()((set) => ({
  screen: 'menu',
  panel: null,
  dialogueNpc: null,
  challenge: null,
  nearby: null,
  toasts: [],
  celebration: null,
  respawnTick: 0,
  transition: null,
  setScreen: (screen) => set({ screen, panel: null, dialogueNpc: null, challenge: null }),
  setPanel: (panel) => set({ panel }),
  openDialogue: (dialogueNpc) => set({ dialogueNpc }),
  startChallenge: (challenge) => set({ challenge, dialogueNpc: null }),
  setNearby: (nearby) => set({ nearby }),
  pushToast: (text, kind = 'info', badge) => {
    const id = toastId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, kind, badge }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), badge ? 5000 : 3800);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  celebrate: (celebration) => set({ celebration }),
  respawn: () => set((s) => ({ respawnTick: s.respawnTick + 1 })),
  setTransition: (transition) => set({ transition }),
}));

/** Adakah permainan perlu dijeda (tiada pergerakan pemain)? */
export function isBlocking(s: Pick<UIState, 'panel' | 'dialogueNpc' | 'challenge' | 'celebration' | 'transition'>) {
  return !!(s.panel || s.dialogueNpc || s.challenge || s.celebration || s.transition);
}
