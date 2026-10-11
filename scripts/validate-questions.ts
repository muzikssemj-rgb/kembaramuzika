/**
 * Pengesah automatik bank soalan.
 * Mengira semula jawapan daripada data notasi (nama not, jeda, skel, triad, jumlah detik)
 * dan memastikan ia sepadan dengan jawapan yang ditetapkan.
 * Jalankan: npm run validate
 */
import { BUILTIN_QUESTIONS, CHALLENGE_SETS } from '../src/questions';
import type { Question } from '../src/types';
import {
  BEATS, intervalBetween, intervalCode, majorScale, majorTriad, pitchClassName, sameRhythm, staffStep, totalBeats, noteFromStep,
} from '../src/utils/music';

const errors: string[] = [];
const warn = (q: Question, m: string) => errors.push(`[${q.id}] ${m}`);
let checked = 0;

const ids = new Set<string>();
for (const q of BUILTIN_QUESTIONS) {
  if (ids.has(q.id)) warn(q, 'ID berganda');
  ids.add(q.id);
  const c = (q.check ?? {}) as Record<string, any>;
  const optIds = q.options?.map((o) => o.id) ?? [];
  if (q.options) {
    if (new Set(optIds).size !== optIds.length) warn(q, 'id pilihan berganda');
    if (!optIds.includes(q.answer as string)) warn(q, 'jawapan bukan salah satu pilihan');
    const labels = q.options.map((o) => o.label ?? JSON.stringify(o.rhythm));
    if (new Set(labels).size !== labels.length) warn(q, 'label pilihan berganda');
  }
  if (q.prompt.length < 5 || q.explanation.length < 10 || q.hint.length < 5) warn(q, 'teks terlalu pendek');

  if (c.note) {
    checked++;
    if (pitchClassName(c.note) !== q.answer) warn(q, `not ${c.note} => ${pitchClassName(c.note)} ≠ ${q.answer}`);
    if (q.stimulus?.kind !== 'staff' || q.stimulus.notes[0] !== c.note) warn(q, 'stimulus tidak sepadan dengan check.note');
  }
  if (q.type === 'staff-place') {
    checked++;
    const st = staffStep(q.answer as string, q.clef!);
    if (st < -2 || st > 10) warn(q, 'sasaran di luar julat');
    if (noteFromStep(st, q.clef!) !== q.answer) warn(q, 'noteFromStep tidak konsisten');
    const letter = (q.answer as string)[0];
    if (!q.prompt.includes(` ${letter} `) && !q.prompt.includes(`${letter} `)) warn(q, 'prompt tidak menyebut huruf sasaran');
  }
  if (c.interval) {
    checked++;
    const code = intervalCode(c.interval[0], c.interval[1]);
    if (code !== q.answer) warn(q, `jeda ${c.interval.join('-')} => ${code} ≠ ${q.answer}`);
    // pastikan pilihan lain tidak juga betul
    if (q.stimulus?.kind === 'staff' && JSON.stringify(q.stimulus.notes) !== JSON.stringify(c.interval)) warn(q, 'stimulus jeda tidak sepadan');
  }
  if (c.scale) {
    checked++;
    const sc = majorScale(c.scale);
    const miss = pitchClassName(sc[c.missing]);
    if (miss !== q.answer) warn(q, `skel ${c.scale}: not ke-${c.missing + 1} = ${miss} ≠ ${q.answer}`);
    if (q.stimulus?.kind === 'staff') {
      q.stimulus.notes.forEach((n, i) => {
        if (i === c.missing) { if (n !== '?') warn(q, 'tempat kosong salah'); }
        else if (n !== sc[i]) warn(q, `stimulus skel indeks ${i}: ${String(n)} ≠ ${sc[i]}`);
      });
    }
  }
  if (c.scaleContains) {
    checked++;
    const names = majorScale(c.scaleContains[0]).map(pitchClassName);
    if (!names.includes(c.scaleContains[1]) || c.scaleContains[1] !== q.answer) warn(q, 'skel tidak mengandungi jawapan');
    const accOpts = optIds.filter((o) => names.includes(o));
    if (accOpts.length !== 1) warn(q, `lebih daripada satu pilihan dalam skel: ${accOpts}`);
  }
  if (c.scaleOrder) {
    checked++;
    const names = majorScale(c.scaleOrder).map(pitchClassName);
    const got = (q.answer as string[]).map((id) => q.items!.find((it) => it.id === id)!.label!.split(' ')[0]);
    if (JSON.stringify(got) !== JSON.stringify(names)) warn(q, `urutan skel ${got} ≠ ${names}`);
  }
  if (c.semitones) {
    checked++;
    const i = intervalBetween(c.semitones[0], c.semitones[1]);
    if (i.semitones !== c.semitones[2]) warn(q, 'semiton salah');
  }
  if (c.triad) {
    checked++;
    const t = majorTriad(c.triad).map(pitchClassName);
    if (JSON.stringify(t) !== JSON.stringify(q.answer)) warn(q, `triad ${t} ≠ ${q.answer}`);
    for (const n of t) if (!q.choices!.includes(n)) warn(q, `pilihan tiada ${n}`);
  }
  if (c.triadName) {
    checked++;
    const [r, t, f] = c.triadName as string[];
    if (intervalCode(r, t) !== 'M3' || intervalCode(r, f) !== 'P5') warn(q, 'bukan triad major');
    if (pitchClassName(r) !== q.answer) warn(q, 'nama triad salah');
  }
  if (c.triadRoot) { checked++; if (pitchClassName(c.triadRoot[0]) !== q.answer) warn(q, 'not dasar salah'); }
  if (c.triadThird) { checked++; if (pitchClassName(c.triadThird[1]) !== q.answer) warn(q, 'not ketiga salah'); }
  if (c.primaryTriads) {
    checked++;
    const s = majorScale(c.primaryTriads).map(pitchClassName);
    if (`${s[0]}, ${s[3]}, ${s[4]}` !== q.options!.find((o) => o.id === q.answer)!.label) warn(q, 'triad primer salah');
  }
  if (c.majorTriadIntervals) {
    checked++;
    const t = majorTriad('C4');
    if (intervalCode(t[0], t[1]) !== 'M3' || intervalCode(t[0], t[2]) !== 'P5') warn(q, 'jeda triad salah');
  }
  if (c.beatsOf) { checked++; if (String(BEATS[c.beatsOf as keyof typeof BEATS]) !== q.answer) warn(q, 'nilai detik salah'); }
  if (c.beatsOfStimulus) {
    checked++;
    if (q.stimulus?.kind !== 'rhythm') warn(q, 'tiada stimulus irama');
    else {
      const b = totalBeats(q.stimulus.tokens);
      if (String(b) !== q.answer) warn(q, `jumlah detik ${b} ≠ ${q.answer}`);
      if (q.stimulus.timeSig && q.stimulus.timeSig[0] !== b) warn(q, 'bar tidak lengkap mengikut tanda masa');
    }
  }
  if (c.completeBar) {
    checked++;
    if (q.stimulus?.kind !== 'rhythm') warn(q, 'tiada stimulus');
    else {
      const have = totalBeats(q.stimulus.tokens);
      const good = q.options!.filter((o) => have + totalBeats(o.rhythm!) === c.completeBar).map((o) => o.id);
      if (good.length !== 1 || good[0] !== q.answer) warn(q, `pilihan melengkapkan bar: ${good}`);
    }
  }
  if (c.listen) {
    checked++;
    if (q.stimulus?.kind !== 'audio-rhythm') warn(q, 'tiada audio');
    else {
      const good = q.options!.filter((o) => sameRhythm(o.rhythm!, (q.stimulus as any).tokens)).map((o) => o.id);
      if (good.length !== 1 || good[0] !== q.answer) warn(q, `pilihan dengar sepadan: ${good}`);
      q.options!.forEach((o) => { if (totalBeats(o.rhythm!) !== 4) warn(q, `pilihan ${o.id} bukan 4 detik`); });
    }
  }
  if (c.orderMatchesAudio) {
    checked++;
    const seq = (q.answer as string[]).flatMap((id) => q.items!.find((i) => i.id === id)!.rhythm!);
    if (q.stimulus?.kind !== 'audio-rhythm' || !sameRhythm(seq, q.stimulus.tokens)) warn(q, 'urutan blok tidak sepadan audio');
  }
  if (c.orderByBeatsDesc) {
    checked++;
    const m: Record<string, number> = { whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25 };
    const vals = (q.answer as string[]).map((id) => m[q.items!.find((i) => i.id === id)!.symbol!]);
    for (let i = 1; i < vals.length; i++) if (vals[i] >= vals[i - 1]) warn(q, 'urutan nilai salah');
  }
  if (c.spaces) {
    checked++;
    if (q.stimulus?.kind === 'staff') {
      const names = (q.stimulus.notes as string[]).map((n) => n[0]).join(' – ');
      if (q.options!.find((o) => o.id === q.answer)!.label !== names) warn(q, 'ruang FACE salah');
      for (const n of q.stimulus.notes as string[]) if (staffStep(n, 'treble') % 2 !== 1) warn(q, `${n} bukan ruang`);
    }
  }
  if (q.type === 'match') {
    if (!q.pairs || q.pairs.length < 3) warn(q, 'pasangan tidak cukup');
  }
  if (q.type === 'order' && q.items) {
    const ids2 = q.items.map((i) => i.id).sort();
    if (JSON.stringify(ids2) !== JSON.stringify([...(q.answer as string[])].sort())) warn(q, 'jawapan susunan tidak meliputi semua item');
  }
}

for (const set of Object.values(CHALLENGE_SETS)) {
  for (const id of set.questionIds) if (!ids.has(id)) errors.push(`[set ${set.id}] soalan ${id} tiada`);
}

const byTopic: Record<string, number> = {};
BUILTIN_QUESTIONS.forEach((q) => (byTopic[q.topic] = (byTopic[q.topic] ?? 0) + 1));
console.log(`Jumlah soalan: ${BUILTIN_QUESTIONS.length}`, byTopic);
console.log(`Semakan teori automatik dijalankan: ${checked}`);
if (errors.length) {
  console.error('RALAT:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('✔ Semua soalan lulus pengesahan.');
