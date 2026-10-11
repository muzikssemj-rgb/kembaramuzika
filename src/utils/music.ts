import type { Clef, Duration, NoteName, RhythmToken } from '../types';

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const NATURAL_SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export interface ParsedNote { letter: string; acc: number; octave: number }

export function parseNote(n: NoteName): ParsedNote {
  const m = /^([A-G])(#{1,2}|b{1,2})?(-?\d)$/.exec(n);
  if (!m) throw new Error(`Not tidak sah: ${n}`);
  const accStr = m[2] ?? '';
  const acc = accStr.startsWith('#') ? accStr.length : -accStr.length;
  return { letter: m[1], acc, octave: parseInt(m[3], 10) };
}

/** Indeks diatonik: C0 = 0, D0 = 1 ... C4 = 28 */
export function diatonicIndex(n: NoteName): number {
  const p = parseNote(n);
  return LETTERS.indexOf(p.letter as (typeof LETTERS)[number]) + p.octave * 7;
}

export function midi(n: NoteName): number {
  const p = parseNote(n);
  return 12 * (p.octave + 1) + NATURAL_SEMI[p.letter] + p.acc;
}

export function freq(n: NoteName | number): number {
  const m = typeof n === 'number' ? n : midi(n);
  return 440 * Math.pow(2, (m - 69) / 12);
}

/** Nama huruf + aksidental tanpa oktaf, cth "F#" */
export function pitchClassName(n: NoteName): string {
  const p = parseNote(n);
  return p.letter + (p.acc > 0 ? '#'.repeat(p.acc) : 'b'.repeat(-p.acc));
}

export function displayName(name: string): string {
  return name.replace(/##/g, '𝄪').replace(/#/g, '♯').replace(/(?<=[A-G])bb/g, '𝄫').replace(/(?<=[A-G])b/g, '♭');
}

/** Garisan bawah baluk (indeks diatonik) */
export const CLEF_BOTTOM: Record<Clef, number> = { treble: diatonicIndex('E4'), bass: diatonicIndex('G2') };

/** Kedudukan pada baluk: 0 = garisan 1 (bawah), 1 = ruang 1, 2 = garisan 2 ... 8 = garisan 5 */
export function staffStep(n: NoteName, clef: Clef): number {
  return diatonicIndex(n) - CLEF_BOTTOM[clef];
}

export function noteFromStep(step: number, clef: Clef): NoteName {
  const idx = step + CLEF_BOTTOM[clef];
  const octave = Math.floor(idx / 7);
  return LETTERS[((idx % 7) + 7) % 7] + octave;
}

export function describeStaffPosition(step: number): string {
  if (step >= 0 && step <= 8) {
    return step % 2 === 0 ? `garisan ke-${step / 2 + 1}` : `ruang ke-${(step + 1) / 2}`;
  }
  return step < 0 ? 'bawah baluk (garisan tambahan)' : 'atas baluk (garisan tambahan)';
}

// ===== Jeda =====
export interface IntervalInfo { number: number; quality: 'P' | 'M' | 'm' | 'A' | 'd'; semitones: number }

export function intervalBetween(a: NoteName, b: NoteName): IntervalInfo {
  const lo = midi(a) <= midi(b) ? a : b;
  const hi = lo === a ? b : a;
  const number = diatonicIndex(hi) - diatonicIndex(lo) + 1;
  const semitones = midi(hi) - midi(lo);
  const simple = ((number - 1) % 7) + 1;
  const octaves = Math.floor((number - 1) / 7);
  const base: Record<number, number> = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11 };
  const diff = semitones - octaves * 12 - base[simple];
  const perfect = [1, 4, 5].includes(simple);
  let quality: IntervalInfo['quality'];
  if (perfect) quality = diff === 0 ? 'P' : diff > 0 ? 'A' : 'd';
  else quality = diff === 0 ? 'M' : diff === -1 ? 'm' : diff > 0 ? 'A' : 'd';
  return { number, quality, semitones };
}

export function intervalCode(a: NoteName, b: NoteName): string {
  const i = intervalBetween(a, b);
  return `${i.quality}${i.number}`;
}

export const INTERVAL_LABEL: Record<string, string> = {
  P1: 'Unison Perfek', m2: 'Minor ke-2', M2: 'Major ke-2', m3: 'Minor ke-3', M3: 'Major ke-3',
  P4: 'Perfek ke-4', A4: 'Ogmentasi ke-4', P5: 'Perfek ke-5', m6: 'Minor ke-6', M6: 'Major ke-6',
  m7: 'Minor ke-7', M7: 'Major ke-7', P8: 'Oktaf Perfek',
};

// ===== Skel major =====
const MAJOR_PATTERN = [2, 2, 1, 2, 2, 2, 1];

export function majorScale(tonic: NoteName): NoteName[] {
  const out: NoteName[] = [tonic];
  let cur = tonic;
  for (let i = 0; i < 7; i++) {
    const p = parseNote(cur);
    const li = LETTERS.indexOf(p.letter as (typeof LETTERS)[number]);
    const nextLetter = LETTERS[(li + 1) % 7];
    const nextOct = li === 6 ? p.octave + 1 : p.octave;
    const target = midi(cur) + MAJOR_PATTERN[i];
    const natural = 12 * (nextOct + 1) + NATURAL_SEMI[nextLetter];
    const acc = target - natural;
    const accStr = acc > 0 ? '#'.repeat(acc) : 'b'.repeat(-acc);
    cur = `${nextLetter}${accStr}${nextOct}`;
    out.push(cur);
  }
  return out;
}

export function majorTriad(root: NoteName): NoteName[] {
  const s = majorScale(root);
  return [s[0], s[2], s[4]];
}

// ===== Irama =====
export const BEATS: Record<Duration, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
export function tokenBeats(t: RhythmToken): number {
  return BEATS[t.d] * (t.dot ? 1.5 : 1);
}
export function totalBeats(tokens: RhythmToken[]): number {
  return tokens.reduce((a, t) => a + tokenBeats(t), 0);
}

export const DURATION_NAME: Record<Duration, string> = {
  w: 'semibrif', h: 'minim', q: 'krotchet', e: 'kuaver', s: 'semikuaver',
};

/** Pembantu ringkas untuk menulis corak irama: "q q h" , "e e q. e", "qr" (r = rehat) */
export function rh(spec: string): RhythmToken[] {
  return spec.trim().split(/\s+/).map((s) => ({
    d: s[0] as Duration,
    dot: s.includes('.'),
    rest: s.includes('r'),
  }));
}

export function sameRhythm(a: RhythmToken[], b: RhythmToken[]): boolean {
  return a.length === b.length && a.every((t, i) => t.d === b[i].d && !!t.dot === !!b[i].dot && !!t.rest === !!b[i].rest);
}
