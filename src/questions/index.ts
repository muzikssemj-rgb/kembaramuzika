import type { ChallengeSetDef, Question, TopicId } from '../types';
import { notasiQuestions } from './notasi';
import { iramaQuestions, nilaiQuestions } from './irama';
import { jedaQuestions, skelQuestions, triadQuestions } from './teori';

/**
 * BANK SOALAN
 * ------------
 * Guru boleh menambah soalan dengan:
 *  1. Menyunting fail dalam src/questions/*.ts (ikut format `Question` dalam src/types), atau
 * Jalankan `npm run validate` untuk menyemak ketepatan jawapan secara automatik.
 */
export const BUILTIN_QUESTIONS: Question[] = [
  ...notasiQuestions,
  ...nilaiQuestions,
  ...iramaQuestions,
  ...skelQuestions,
  ...jedaQuestions,
  ...triadQuestions,
];

export const TOPICS: { id: TopicId; name: string; short: string; color: string }[] = [
  { id: 'notasi', name: 'Notasi Muzik', short: 'Notasi', color: '#a78bfa' },
  { id: 'nilai', name: 'Nilai Not & Tanda Rehat', short: 'Nilai Not', color: '#34d399' },
  { id: 'irama', name: 'Irama & Meter', short: 'Irama', color: '#22d3ee' },
  { id: 'skel', name: 'Skel Major', short: 'Skel', color: '#fbbf24' },
  { id: 'jeda', name: 'Jeda', short: 'Jeda', color: '#f472b6' },
  { id: 'triad', name: 'Triad', short: 'Triad', color: '#fb923c' },
];

export const TOPIC_NAME = Object.fromEntries(TOPICS.map((t) => [t.id, t.name])) as Record<TopicId, string>;

let customQuestions: Question[] = [];
export function setCustomQuestions(qs: Question[]) {
  customQuestions = qs.map((q) => ({ ...q, custom: true }));
}
export function allQuestions(): Question[] {
  return [...BUILTIN_QUESTIONS, ...customQuestions];
}
export function getQuestion(id: string): Question | undefined {
  return allQuestions().find((q) => q.id === id);
}

export const CHALLENGE_SETS: Record<string, ChallengeSetDef> = {
  q1: { id: 'q1', title: 'Teka-teki Klef Trebel', questionIds: ['n05', 'n09', 'n07'] },
  q2: { id: 'q2', title: 'Rahsia Klef Bes', questionIds: ['n02', 'n12', 'n13', 'n19'] },
  q3: { id: 'q3', title: 'Jambatan Piano Ajaib', questionIds: ['n16', 'n10', 'n22', 'n24'] },
  w2: { id: 'w2', title: 'Ujian Hutan Irama', questionIds: ['v01', 'r01', 'r04', 'v06'] },
  w3: { id: 'w3', title: 'Ujian Puncak Skel', questionIds: ['s01', 's02', 's03'] },
  w4: { id: 'w4', title: 'Gema Gua Jeda', questionIds: ['j06', 'j01', 'j02', 'j07'] },
  w5: { id: 'w5', title: 'Ujian Kuil Triad', questionIds: ['t05', 't01', 't04', 't06'] },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pilih soalan latihan rawak daripada topik tertentu (soalan belum dikuasai diutamakan). */
export function pickQuestions(topics: TopicId[], count: number, mastered: Set<string> = new Set()): Question[] {
  const pool = allQuestions().filter((q) => topics.includes(q.topic));
  const fresh = shuffle(pool.filter((q) => !mastered.has(q.id)));
  const seen = shuffle(pool.filter((q) => mastered.has(q.id)));
  return [...fresh, ...seen].slice(0, count);
}

/** Ujian penguasaan akhir: soalan seimbang daripada semua topik. */
export function pickFinalQuestions(): Question[] {
  const per: Record<TopicId, number> = { notasi: 2, nilai: 2, irama: 2, skel: 2, jeda: 1, triad: 1 };
  return shuffle(
    (Object.keys(per) as TopicId[]).flatMap((t) =>
      shuffle(allQuestions().filter((q) => q.topic === t && q.type !== 'listen')).slice(0, per[t]),
    ),
  );
}

export function validateCustomQuestion(q: unknown): string | null {
  if (!q || typeof q !== 'object') return 'Bukan objek.';
  const o = q as Record<string, unknown>;
  const need = ['id', 'topic', 'type', 'prompt', 'answer', 'explanation', 'hint'];
  for (const k of need) if (o[k] === undefined) return `Medan "${k}" tiada.`;
  if (!TOPICS.some((t) => t.id === o.topic)) return `Topik "${String(o.topic)}" tidak sah.`;
  const types = ['mcq', 'staff-identify', 'scale-missing', 'interval', 'listen', 'order', 'match', 'triad-build', 'staff-place'];
  if (!types.includes(String(o.type))) return `Jenis "${String(o.type)}" tidak sah.`;
  if (['mcq', 'staff-identify', 'scale-missing', 'interval', 'listen'].includes(String(o.type))) {
    if (!Array.isArray(o.options) || o.options.length < 2) return 'Soalan pilihan perlu sekurang-kurangnya 2 "options".';
    if (!(o.options as { id: string }[]).some((op) => op.id === o.answer)) return 'Jawapan tidak sepadan dengan mana-mana id pilihan.';
  }
  if (BUILTIN_QUESTIONS.some((b) => b.id === o.id)) return `ID "${String(o.id)}" sudah digunakan oleh soalan terbina.`;
  return null;
}
