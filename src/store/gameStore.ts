import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AvatarConfig, Question, QuestState, Settings, TopicId, TopicStats, WorldId, WorldObject } from '../types';
import { QUEST_BY_ID, QUESTS, WORLD_UNLOCK } from '../quests/questData';
import { WORLDS } from '../worlds/worldData';
import { setCustomQuestions } from '../questions';
import { sfx } from '../audio/audioEngine';
import { useUI } from './uiStore';

const emptyStats = (): Record<TopicId, TopicStats> => ({
  notasi: { attempted: 0, correctFirst: 0, correct: 0 },
  nilai: { attempted: 0, correctFirst: 0, correct: 0 },
  irama: { attempted: 0, correctFirst: 0, correct: 0 },
  skel: { attempted: 0, correctFirst: 0, correct: 0 },
  jeda: { attempted: 0, correctFirst: 0, correct: 0 },
  triad: { attempted: 0, correctFirst: 0, correct: 0 },
});

export const DEFAULT_SETTINGS: Settings = {
  musicVol: 0.5, sfxVol: 0.8, muted: false, quality: 'tinggi', touchControls: 'auto', invertY: false,
};

export const DEFAULT_AVATAR: AvatarConfig = {
  name: 'Penjelajah', body: '#f43f5e', skin: '#f1c27d', hat: 'cap', accent: '#fde047',
};

/** Tahap: setiap tahap memerlukan 80 + 40×(tahap−1) XP */
export function levelInfo(xp: number) {
  let level = 1;
  let need = 80;
  let rest = xp;
  while (rest >= need) { rest -= need; level++; need = 80 + 40 * (level - 1); }
  return { level, into: rest, need };
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export interface StudentInfo { nama: string; kelas: string; sekolah: string; guru: string }

interface QLog { attempts: number; correctFirst: boolean; mastered: boolean }

export interface GameState {
  hasSave: boolean;
  avatar: AvatarConfig;
  xp: number;
  coins: number;
  crystals: string[];
  badges: string[];
  quests: Record<string, QuestState>;
  collected: string[];
  opened: string[];
  stats: Record<TopicId, TopicStats>;
  qlog: Record<string, QLog>;
  streak: number;
  world: WorldId;
  settings: Settings;
  daily: { date: string; done: boolean };
  final: { best: number; passed: boolean; attempts: number };
  customQuestions: Question[];
  explored: Record<string, boolean>;
  student: StudentInfo;
  setStudent: (s: Partial<StudentInfo>) => void;

  // actions
  newGame: (avatar: AvatarConfig) => void;
  setAvatar: (a: AvatarConfig) => void;
  setWorld: (w: WorldId) => void;
  updateSettings: (s: Partial<Settings>) => void;
  isWorldUnlocked: (w: WorldId) => boolean;
  questAvailable: (id: string) => boolean;
  startQuest: (id: string) => void;
  advanceQuest: (id: string) => void;
  completeTalkStep: (npcId: string) => boolean;
  collectObject: (o: WorldObject) => void;
  interactObject: (o: WorldObject) => void;
  completeChallengeSet: (setId: string) => void;
  recordAnswer: (q: Question, correct: boolean, firstAttempt: boolean, awardXp: boolean) => { xp: number; coins: number };
  awardBadge: (id: string) => void;
  completeDaily: () => void;
  recordFinal: (score: number, total: number) => void;
  setCustomQuestions: (qs: Question[]) => void;
  resetProgress: () => void;
}

const initialProgress = () => ({
  hasSave: false,
  avatar: DEFAULT_AVATAR,
  xp: 0, coins: 0,
  crystals: [] as string[], badges: [] as string[],
  quests: {} as Record<string, QuestState>,
  collected: [] as string[], opened: [] as string[],
  stats: emptyStats(), qlog: {} as Record<string, QLog>, streak: 0,
  world: 'w1' as WorldId,
  daily: { date: '', done: false },
  final: { best: 0, passed: false, attempts: 0 },
  explored: {} as Record<string, boolean>,
});

const toast = (text: string, kind: 'info' | 'good' | 'warn' = 'info') => useUI.getState().pushToast(text, kind);

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialProgress(),
      settings: DEFAULT_SETTINGS,
      customQuestions: [],

      newGame: (avatar) => set({ ...initialProgress(), hasSave: true, avatar }),
      setAvatar: (avatar) => set({ avatar }),
      setWorld: (world) => set((s) => ({ world, explored: { ...s.explored, [world]: true } })),
      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

      isWorldUnlocked: (w) => {
        const req = WORLD_UNLOCK[w];
        return !req || get().quests[req]?.status === 'done';
      },

      questAvailable: (id) => {
        const q = QUEST_BY_ID[id];
        const st = get().quests[id];
        if (!q || st) return false;
        return q.requires.every((r) => get().quests[r]?.status === 'done');
      },

      startQuest: (id) => {
        const q = QUEST_BY_ID[id];
        set((s) => ({ quests: { ...s.quests, [id]: { status: 'active', step: 1, progress: [] } } }));
        sfx('quest');
        toast(`Quest baharu: ${q.title}`, 'good');
        // jika item langkah collect sudah dikumpul lebih awal (tidak berlaku kerana item tersorok), tiada tindakan
      },

      advanceQuest: (id) => {
        const q = QUEST_BY_ID[id];
        const st = get().quests[id];
        if (!q || !st || st.status === 'done') return;
        const next = st.step + 1;
        if (next >= q.steps.length) {
          set((s) => ({
            quests: { ...s.quests, [id]: { status: 'done', step: next, progress: [] } },
            xp: s.xp + q.reward.xp,
            coins: s.coins + q.reward.coins,
          }));
          if (q.reward.badge) get().awardBadge(q.reward.badge);
          sfx('fanfare');
          useUI.getState().celebrate({
            title: 'Quest Selesai!',
            subtitle: q.title,
            text: q.completeText,
            rewards: [`+${q.reward.xp} XP`, `+${q.reward.coins} Syiling Muzik`],
          });
        } else {
          set((s) => ({ quests: { ...s.quests, [id]: { ...st, step: next, progress: [] } } }));
          toast(`Objektif baharu: ${q.steps[next].text}`, 'info');
        }
      },

      completeTalkStep: (npcId) => {
        for (const [id, st] of Object.entries(get().quests)) {
          if (st.status !== 'active') continue;
          const step = QUEST_BY_ID[id].steps[st.step];
          if (step?.type === 'talk' && step.npc === npcId) {
            get().advanceQuest(id);
            return true;
          }
        }
        return false;
      },

      collectObject: (o) => {
        const s = get();
        if (s.collected.includes(o.id)) return;
        if (o.kind === 'coin') {
          set({ collected: [...s.collected, o.id], coins: s.coins + 2 });
          sfx('coin');
          // lencana pengumpul
          const w = WORLDS[s.world];
          const coins = w.objects.filter((x) => x.kind === 'coin').map((x) => x.id);
          if (coins.every((c) => c === o.id || s.collected.includes(c))) {
            toast(`Semua simbol muzik di ${w.name} dikumpul! +20 syiling`, 'good');
            set((st) => ({ coins: st.coins + 20 }));
            get().awardBadge('pengumpul');
          }
          return;
        }
        // item quest
        const qid = o.quest!;
        const st = s.quests[qid];
        if (!st || st.status !== 'active') return;
        const step = QUEST_BY_ID[qid].steps[st.step];
        if (step.type !== 'collect' || step.group !== o.group) return;
        const progress = [...st.progress, o.id];
        set({ collected: [...s.collected, o.id], quests: { ...s.quests, [qid]: { ...st, progress } } });
        if (o.kind === 'crystal') {
          set((x) => ({ crystals: x.crystals.includes(o.group!) ? x.crystals : [...x.crystals, o.group!] }));
          sfx('crystal');
          useUI.getState().celebrate({ title: 'Kristal Muzik Ditemui!', subtitle: 'Harmoni semakin pulih', text: 'Satu lagi Kristal Muzik kembali ke tempatnya.', rewards: ['+1 Kristal'] , crystal: o.group });
        } else {
          sfx('collect');
          toast(`${step.text}: ${progress.length}/${step.count}`, 'good');
        }
        if (progress.length >= step.count) get().advanceQuest(qid);
      },

      interactObject: (o) => {
        const s = get();
        for (const [qid, st] of Object.entries(s.quests)) {
          if (st.status !== 'active') continue;
          const step = QUEST_BY_ID[qid].steps[st.step];
          if (step.type !== 'interact' || !step.objects.includes(o.id)) continue;
          if (st.progress.includes(o.id)) return;
          if (step.ordered) {
            const expected = step.objects[st.progress.length];
            if (expected !== o.id) {
              sfx('wrong');
              set({ quests: { ...s.quests, [qid]: { ...st, progress: [] } } });
              toast('Urutan tidak tepat — mula semula dari not pertama. Baca not pada setiap batu dengan teliti!', 'warn');
              return;
            }
          }
          const progress = [...st.progress, o.id];
          set({ quests: { ...s.quests, [qid]: { ...st, progress } }, opened: o.kind === 'gate' ? [...s.opened, o.id] : s.opened });
          if (o.kind === 'gate') { sfx('gate'); toast('Gerbang terbuka!', 'good'); }
          if (progress.length >= step.objects.length) {
            if (o.kind === 'stone') { sfx('fanfareSmall'); toast('Melodi lengkap! Laluan ke Papan Ujian terbuka.', 'good'); }
            get().advanceQuest(qid);
          } else if (o.kind === 'stone') {
            toast(`Betul! ${progress.length}/${step.objects.length}`, 'good');
          }
          return;
        }
        if (o.kind === 'gate' && !s.opened.includes(o.id)) {
          sfx('locked');
          toast('Gerbang ini terkunci dengan teka-teki baluk. Selesaikan quest Maestro Melodi dahulu.', 'warn');
        }
      },

      completeChallengeSet: (setId) => {
        for (const [qid, st] of Object.entries(get().quests)) {
          if (st.status !== 'active') continue;
          const step = QUEST_BY_ID[qid].steps[st.step];
          if (step.type === 'challenge' && step.set === setId) {
            get().advanceQuest(qid);
            return;
          }
        }
      },

      recordAnswer: (q, correct, firstAttempt, awardXp) => {
        const s = get();
        const stats = { ...s.stats, [q.topic]: { ...s.stats[q.topic] } };
        const log = { ...(s.qlog[q.id] ?? { attempts: 0, correctFirst: false, mastered: false }) };
        if (firstAttempt) {
          stats[q.topic].attempted += 1;
          log.attempts += 1;
          if (correct) stats[q.topic].correctFirst += 1;
          log.correctFirst = correct;
        }
        if (correct) stats[q.topic].correct += 1;
        if (correct) log.mastered = log.mastered || firstAttempt;
        let xp = 0;
        let coins = 0;
        if (correct && awardXp) {
          xp = firstAttempt ? q.xp : Math.max(2, Math.round(q.xp / 3));
          coins = firstAttempt ? 5 : 1;
        }
        const streak = firstAttempt ? (correct ? s.streak + 1 : 0) : s.streak;
        set({ stats, qlog: { ...s.qlog, [q.id]: log }, xp: s.xp + xp, coins: s.coins + coins, streak });
        if (correct && !s.badges.includes('langkah-pertama')) get().awardBadge('langkah-pertama');
        if (streak >= 5) get().awardBadge('tepat-lima');
        const before = levelInfo(s.xp).level;
        const after = levelInfo(s.xp + xp).level;
        if (after > before) { sfx('levelup'); toast(`Naik ke Tahap ${after}!`, 'good'); }
        return { xp, coins };
      },

      awardBadge: (id) => {
        if (get().badges.includes(id)) return;
        set((s) => ({ badges: [...s.badges, id] }));
        useUI.getState().pushToast(`Lencana baharu dibuka!`, 'good', id);
      },

      completeDaily: () => {
        set((s) => ({ daily: { date: todayKey(), done: true }, coins: s.coins + 30, xp: s.xp + 40 }));
        get().awardBadge('rajin-berlatih');
        toast('Cabaran Harian selesai! +40 XP, +30 syiling', 'good');
      },

      recordFinal: (score, total) => {
        const passed = score / total >= 0.7;
        set((s) => ({
          final: { best: Math.max(s.final.best, score), passed: s.final.passed || passed, attempts: s.final.attempts + 1 },
        }));
        if (passed && !get().crystals.includes('crystal7')) {
          set((s) => ({ crystals: [...s.crystals, 'crystal7'], xp: s.xp + 300, coins: s.coins + 100 }));
          get().awardBadge('maestro-muzika');
          sfx('fanfare');
          useUI.getState().celebrate({
            title: 'HARMONI DIPULIHKAN!', subtitle: 'Kamu kini Maestro Muzika',
            text: 'Ketujuh-tujuh Kristal Muzik telah kembali. Dunia Muzik bergema semula dengan harmoni — terima kasih, Penjelajah!',
            rewards: ['+300 XP', '+100 Syiling', 'Kristal Harmoni Agung'], crystal: 'crystal7',
          });
        }
      },

      setCustomQuestions: (qs) => { setCustomQuestions(qs); set({ customQuestions: qs }); },

      student: { nama: '', kelas: '', sekolah: '', guru: '' },
      setStudent: (p) => set((s) => ({ student: { ...s.student, ...p } })),

      resetProgress: () => set({ ...initialProgress() }),
    }),
    {
      name: 'gamar-muzika-save-v1',
      version: 1,
      partialize: (s) => ({
        hasSave: s.hasSave, avatar: s.avatar, xp: s.xp, coins: s.coins, crystals: s.crystals, badges: s.badges,
        quests: s.quests, collected: s.collected, opened: s.opened, stats: s.stats, qlog: s.qlog, streak: s.streak,
        world: s.world, settings: s.settings, daily: s.daily, final: s.final, customQuestions: s.customQuestions, explored: s.explored, student: s.student,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.customQuestions?.length) setCustomQuestions(state.customQuestions);
      },
    },
  ),
);

/** Quest aktif yang paling relevan untuk dunia semasa */
export function currentQuest(s: Pick<GameState, 'quests' | 'world'>) {
  const active = QUESTS.filter((q) => s.quests[q.id]?.status === 'active');
  return active.find((q) => q.world === s.world) ?? active[0] ?? null;
}

/** Quest seterusnya yang boleh dimulakan (untuk panduan pemain) */
export function nextAvailableQuest(s: GameState) {
  return QUESTS.find((q) => s.questAvailable(q.id)) ?? null;
}
