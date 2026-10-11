// ===== Jenis data teras KEMBARA MUZIKA =====

export type TopicId = 'notasi' | 'nilai' | 'irama' | 'skel' | 'jeda' | 'triad';
export type WorldId = 'w1' | 'w2' | 'w3' | 'w4' | 'w5';
export type Clef = 'treble' | 'bass';

/** Not ditulis seperti "C4", "F#4", "Bb3" (oktaf saintifik: C4 = C tengah). */
export type NoteName = string;

export type Duration = 'w' | 'h' | 'q' | 'e' | 's';
export interface RhythmToken {
  d: Duration;
  dot?: boolean;
  rest?: boolean;
}

export type SymbolId =
  | 'treble' | 'bass' | 'sharp' | 'flat' | 'natural'
  | 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'
  | 'rest-whole' | 'rest-half' | 'rest-quarter' | 'rest-eighth'
  | 'time-44' | 'time-34' | 'time-24' | 'barline' | 'double-bar' | 'repeat';

export type Stimulus =
  | {
      kind: 'staff';
      clef: Clef;
      /** Setiap kumpulan not; satu elemen = satu not, atau array = kord (dimainkan serentak). '?' = tempat kosong. */
      notes: (NoteName | NoteName[] | '?')[];
      keySig?: number; // +n syap, -n flet
      timeSig?: [number, number];
      labels?: string[];
      highlight?: number[];
    }
  | { kind: 'rhythm'; tokens: RhythmToken[]; timeSig?: [number, number]; showCounts?: boolean }
  | { kind: 'symbol'; symbol: SymbolId }
  | { kind: 'audio-rhythm'; tokens: RhythmToken[]; bpm: number; timeSig?: [number, number] }
  | { kind: 'keyboard'; highlight: NoteName[] };

export interface ChoiceOption {
  id: string;
  label?: string;
  rhythm?: RhythmToken[];
  symbol?: SymbolId;
}

export type QuestionType =
  | 'mcq'
  | 'staff-identify'
  | 'staff-place'
  | 'match'
  | 'order'
  | 'scale-missing'
  | 'interval'
  | 'triad-build'
  | 'listen';

export interface Question {
  id: string;
  topic: TopicId;
  difficulty: 1 | 2 | 3;
  type: QuestionType;
  prompt: string;
  explanation: string;
  hint: string;
  xp: number;
  stimulus?: Stimulus;
  /** Untuk mcq / staff-identify / scale-missing / interval / listen */
  options?: ChoiceOption[];
  /** Jawapan: id pilihan, atau senarai (order / triad-build) */
  answer: string | string[];
  /** staff-place: klef & not sasaran */
  clef?: Clef;
  /** match: pasangan kiri (simbol) -> kanan (nama) */
  pairs?: { left: { id: string; symbol?: SymbolId; label?: string }; right: string }[];
  /** order: item yang perlu disusun */
  items?: { id: string; label?: string; rhythm?: RhythmToken[]; symbol?: SymbolId }[];
  /** triad-build: not yang boleh dipilih (tanpa oktaf, cth "C", "E", "G") */
  choices?: string[];
  /** Metadata untuk pengesah automatik */
  check?: Record<string, unknown>;
  custom?: boolean;
}

// ===== Quest =====
export type QuestStep =
  | { type: 'talk'; npc: string; text: string }
  | { type: 'collect'; group: string; count: number; text: string }
  | { type: 'interact'; objects: string[]; ordered?: boolean; text: string }
  | { type: 'challenge'; set: string; at: string; text: string };

export interface QuestDef {
  id: string;
  world: WorldId;
  title: string;
  giver: string;
  story: string;
  requires: string[];
  steps: QuestStep[];
  reward: { xp: number; coins: number; crystal?: string; badge?: string };
  completeText: string;
}

export interface QuestState {
  status: 'active' | 'done';
  step: number;
  progress: string[];
}

export interface ChallengeSetDef {
  id: string;
  title: string;
  questionIds: string[];
}

// ===== Dunia =====
export interface Island {
  x: number; z: number; r: number; top: number;
  shape?: 'cyl' | 'box';
  w?: number; d?: number; // untuk box
  color?: string;
}

export interface NPCDef {
  id: string;
  name: string;
  title: string;
  pos: [number, number, number];
  color: string;
  accent: string;
  hat: 'conductor' | 'cap' | 'beret' | 'crown' | 'hood';
  idle: string[];
  tip: { topic: TopicId; text: string };
}

export type WorldObjectKind = 'collectible' | 'gate' | 'stone' | 'board' | 'portal' | 'crystal' | 'coin';
export interface WorldObject {
  id: string;
  kind: WorldObjectKind;
  pos: [number, number, number];
  group?: string;     // collectible group / quest group
  quest?: string;     // dipaparkan hanya bila quest aktif
  symbol?: SymbolId;
  note?: NoteName;    // batu not
  label?: string;
  target?: WorldId | 'final';   // portal
  rotY?: number;
  set?: string;       // board -> challenge set
}

export type DecorKind = 'noteTree' | 'house' | 'pillar' | 'crystalCluster' | 'mushroom' | 'drum' | 'rock' | 'lamp' | 'temple' | 'pine' | 'stalagmite' | 'bigNote';
export interface Decor { kind: DecorKind; pos: [number, number, number]; s?: number; rotY?: number; color?: string; solid?: number }

export interface WorldDef {
  id: WorldId;
  name: string;
  subtitle: string;
  topics: TopicId[];
  sky: [string, string];
  fog: string;
  ground: string;
  grass: string;
  accent: string;
  spawn: [number, number, number];
  islands: Island[];
  bridges: { from: [number, number]; to: [number, number]; y: number; piano?: boolean }[];
  decor: Decor[];
  npcs: NPCDef[];
  objects: WorldObject[];
  unlockText: string;
}

// ===== Statistik =====
export interface TopicStats { attempted: number; correctFirst: number; correct: number; }

export interface Settings {
  musicVol: number;
  sfxVol: number;
  muted: boolean;
  quality: 'tinggi' | 'sederhana' | 'rendah';
  touchControls: 'auto' | 'on' | 'off';
  invertY: boolean;
}

export interface AvatarConfig {
  name: string;
  body: string;
  skin: string;
  hat: 'none' | 'cap' | 'headphones' | 'crown' | 'beret';
  accent: string;
}
