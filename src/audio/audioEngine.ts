/**
 * Enjin audio prosedural (Web Audio API) — semua bunyi disintesis secara asli,
 * tiada fail audio berhak cipta digunakan.
 */
import type { NoteName, RhythmToken, WorldId } from '../types';
import { freq, tokenBeats } from '../utils/music';

let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let sfxBus: GainNode;
let noiseBuf: AudioBuffer | null = null;
let vol = { music: 0.5, sfx: 0.8, muted: false };

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  musicBus = ctx.createGain();
  sfxBus = ctx.createGain();
  musicBus.connect(master);
  sfxBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  applyVolumes();
}

function applyVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(vol.muted ? 0 : 1, t, 0.05);
  musicBus.gain.setTargetAtTime(vol.music * 0.35, t, 0.1);
  sfxBus.gain.setTargetAtTime(vol.sfx * 0.6, t, 0.05);
}

export function setVolumes(music: number, sfxV: number, muted: boolean) {
  vol = { music, sfx: sfxV, muted };
  applyVolumes();
}

let activeVoices = 0;
const MAX_VOICES = 24;

function tone(
  f: number, start: number, dur: number,
  opts: { type?: OscillatorType; gain?: number; attack?: number; release?: number; bus?: GainNode; detune?: number; filter?: number; glideTo?: number } = {},
) {
  if (!ctx) return;
  if (activeVoices > MAX_VOICES) return;
  const { type = 'triangle', gain = 0.3, attack = 0.01, release = 0.2, bus = sfxBus, detune = 0, filter, glideTo } = opts;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, start);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
  o.detune.value = detune;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + attack);
  g.gain.setTargetAtTime(0, start + Math.max(attack, dur - release * 0.3), release / 3);
  let node: AudioNode = o.connect(g);
  if (filter) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = filter;
    node = node.connect(lp);
  }
  node.connect(bus);
  activeVoices++;
  o.start(start);
  o.stop(start + dur + release * 2);
  o.onended = () => { activeVoices--; g.disconnect(); };
}

function noise(start: number, dur: number, gain: number, hp = 6000, bus: GainNode = sfxBus) {
  if (!ctx || !noiseBuf) return;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  s.connect(f).connect(g).connect(bus);
  s.start(start);
  s.stop(start + dur + 0.05);
}

const lastPlayed: Record<string, number> = {};

export type SfxName =
  | 'click' | 'hover' | 'coin' | 'collect' | 'crystal' | 'correct' | 'wrong' | 'quest' | 'fanfare' | 'fanfareSmall'
  | 'jump' | 'land' | 'gate' | 'locked' | 'portal' | 'levelup' | 'step' | 'open';

export function sfx(name: SfxName) {
  if (!ctx) return;
  const now = ctx.currentTime;
  if (lastPlayed[name] && now - lastPlayed[name] < 0.07) return; // elak bertindih
  lastPlayed[name] = now;
  const t = now + 0.005;
  const m = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
  switch (name) {
    case 'click': tone(m(84), t, 0.06, { type: 'sine', gain: 0.15 }); break;
    case 'hover': tone(m(91), t, 0.03, { type: 'sine', gain: 0.05 }); break;
    case 'open': tone(m(72), t, 0.08, { type: 'sine', gain: 0.12 }); tone(m(79), t + 0.05, 0.1, { type: 'sine', gain: 0.12 }); break;
    case 'coin': tone(m(88), t, 0.08, { type: 'square', gain: 0.07, filter: 4000 }); tone(m(93), t + 0.07, 0.15, { type: 'square', gain: 0.07, filter: 4000 }); break;
    case 'collect': [76, 79, 84, 88].forEach((n, i) => tone(m(n), t + i * 0.06, 0.2, { type: 'triangle', gain: 0.18 })); break;
    case 'crystal':
      [72, 76, 79, 84, 88, 91, 96].forEach((n, i) => tone(m(n), t + i * 0.07, 0.6, { type: 'sine', gain: 0.14 }));
      noise(t, 0.8, 0.04, 9000);
      break;
    case 'correct': tone(m(76), t, 0.12, { type: 'triangle', gain: 0.22 }); tone(m(83), t + 0.1, 0.25, { type: 'triangle', gain: 0.22 }); break;
    case 'wrong': tone(m(55), t, 0.18, { type: 'sawtooth', gain: 0.08, filter: 900 }); tone(m(52), t + 0.14, 0.25, { type: 'sawtooth', gain: 0.08, filter: 900 }); break;
    case 'quest': [67, 72, 76].forEach((n, i) => tone(m(n), t + i * 0.09, 0.3, { type: 'triangle', gain: 0.2 })); break;
    case 'fanfareSmall': [72, 76, 79, 84].forEach((n, i) => tone(m(n), t + i * 0.1, 0.35, { type: 'square', gain: 0.07, filter: 3000 })); break;
    case 'fanfare': {
      const seq: [number, number, number][] = [[67, 0, 0.15], [72, 0.15, 0.15], [76, 0.3, 0.15], [79, 0.45, 0.35], [76, 0.8, 0.15], [79, 0.95, 0.7]];
      seq.forEach(([n, d, l]) => { tone(m(n), t + d, l, { type: 'square', gain: 0.08, filter: 3500 }); tone(m(n - 12), t + d, l, { type: 'triangle', gain: 0.12 }); });
      [60, 64, 67, 72].forEach((n) => tone(m(n), t + 0.95, 1.2, { type: 'triangle', gain: 0.07, attack: 0.05 }));
      break;
    }
    case 'jump': tone(m(64), t, 0.15, { type: 'sine', gain: 0.1, glideTo: m(76) }); break;
    case 'land': noise(t, 0.08, 0.06, 1200); break;
    case 'step': noise(t, 0.04, 0.025, 2500); break;
    case 'gate': [48, 55, 60, 64, 67].forEach((n, i) => tone(m(n), t + i * 0.08, 0.6, { type: 'triangle', gain: 0.15 })); break;
    case 'locked': tone(m(50), t, 0.12, { type: 'square', gain: 0.06, filter: 700 }); tone(m(50), t + 0.15, 0.12, { type: 'square', gain: 0.06, filter: 700 }); break;
    case 'portal': tone(m(48), t, 0.9, { type: 'sine', gain: 0.2, glideTo: m(84), attack: 0.2 }); noise(t, 1, 0.05, 3000); break;
    case 'levelup': [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => tone(m(n), t + i * 0.07, 0.25, { type: 'square', gain: 0.07, filter: 4000 })); break;
  }
}

/** Mainkan satu not (cth. batu not, papan kekunci) */
export function playNote(n: NoteName | number, dur = 0.6, when = 0) {
  initAudio();
  if (!ctx) return;
  const f = typeof n === 'number' ? 440 * Math.pow(2, (n - 69) / 12) : freq(n);
  const t = ctx.currentTime + 0.01 + when;
  tone(f, t, dur, { type: 'triangle', gain: 0.28, release: 0.5 });
  tone(f * 2, t, dur * 0.6, { type: 'sine', gain: 0.06, release: 0.3 });
}

export function playChord(notes: NoteName[], dur = 1.2) {
  notes.forEach((n) => playNote(n, dur));
}

export function playMelodic(notes: NoteName[], gap = 0.55) {
  notes.forEach((n, i) => playNote(n, 0.5, i * gap));
}

/**
 * Mainkan corak irama dengan metronom (kiraan masuk satu bar).
 * Pulangkan tempoh keseluruhan (saat).
 */
export function playRhythm(tokens: RhythmToken[], bpm: number, beatsPerBar = 4, countIn = true, onEnd?: () => void): number {
  initAudio();
  if (!ctx) return 0;
  const spb = 60 / bpm;
  let t = ctx.currentTime + 0.1;
  if (countIn) {
    for (let i = 0; i < beatsPerBar; i++) {
      tone(i === 0 ? 1760 : 1320, t + i * spb, 0.05, { type: 'square', gain: 0.06, filter: 5000 });
    }
    t += beatsPerBar * spb;
  }
  const start = t;
  let total = 0;
  for (const tk of tokens) total += tokenBeats(tk);
  // metronom lembut sepanjang corak
  for (let b = 0; b < Math.ceil(total); b++) noise(start + b * spb, 0.03, 0.05, 7000);
  let pos = 0;
  for (const tk of tokens) {
    const len = tokenBeats(tk) * spb;
    if (!tk.rest) {
      tone(660, start + pos, Math.min(len * 0.9, 1.5), { type: 'triangle', gain: 0.3, release: 0.08 });
      noise(start + pos, 0.05, 0.08, 1500);
    }
    pos += len;
  }
  const dur = start - ctx.currentTime + pos;
  if (onEnd) setTimeout(onEnd, dur * 1000 + 100);
  return dur;
}

/** Ketukan metronom tunggal */
export function click(accent = false) {
  if (!ctx) return;
  tone(accent ? 1760 : 1320, ctx.currentTime + 0.01, 0.05, { type: 'square', gain: 0.06, filter: 5000 });
}

// ===================== MUZIK LATAR PROSEDURAL =====================
interface Theme { bpm: number; prog: number[][]; scale: number[]; perc: boolean; pad: OscillatorType; lead: OscillatorType; octave: number }
const THEMES: Record<WorldId | 'menu', Theme> = {
  menu: { bpm: 76, prog: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]], scale: [0, 2, 4, 7, 9], perc: false, pad: 'triangle', lead: 'sine', octave: 12 },
  w1: { bpm: 96, prog: [[60, 64, 67], [65, 69, 72], [55, 59, 62], [60, 64, 67]], scale: [0, 2, 4, 7, 9], perc: false, pad: 'triangle', lead: 'triangle', octave: 12 },
  w2: { bpm: 108, prog: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], scale: [0, 2, 4, 7, 9], perc: true, pad: 'triangle', lead: 'square', octave: 12 },
  w3: { bpm: 88, prog: [[62, 66, 69], [67, 71, 74], [59, 62, 66], [69, 73, 76]], scale: [0, 2, 4, 7, 9], perc: false, pad: 'sawtooth', lead: 'triangle', octave: 12 },
  w4: { bpm: 70, prog: [[57, 60, 64], [52, 55, 59], [53, 57, 60], [52, 56, 59]], scale: [0, 3, 5, 7, 10], perc: false, pad: 'sine', lead: 'sine', octave: 12 },
  w5: { bpm: 84, prog: [[60, 64, 67], [53, 57, 60], [55, 59, 62], [60, 64, 67]], scale: [0, 2, 4, 7, 9], perc: true, pad: 'triangle', lead: 'triangle', octave: 12 },
};

let musicTimer: number | null = null;
let currentTheme: WorldId | 'menu' | null = null;

export function startMusic(theme: WorldId | 'menu') {
  initAudio();
  if (!ctx) return;
  if (currentTheme === theme && musicTimer !== null) return;
  stopMusic();
  currentTheme = theme;
  const th = THEMES[theme];
  const spb = 60 / th.bpm;
  let nextTime = ctx.currentTime + 0.2;
  let step = 0; // langkah kuaver
  let seed = 7;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const schedule = () => {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + 0.4) {
      const bar = Math.floor(step / 8) % th.prog.length;
      const chord = th.prog[bar];
      const inBar = step % 8;
      const m = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
      if (inBar === 0) {
        chord.forEach((n) => tone(m(n), nextTime, spb * 4, { type: th.pad, gain: 0.05, attack: 0.4, release: 1.2, bus: musicBus, filter: 1400 }));
        tone(m(chord[0] - 24), nextTime, spb * 1.8, { type: 'sine', gain: 0.16, release: 0.3, bus: musicBus });
      }
      if (inBar === 4) tone(m(chord[0] - 24 + 7), nextTime, spb * 1.5, { type: 'sine', gain: 0.12, release: 0.3, bus: musicBus });
      // arpeggio
      if (inBar % 2 === 0 || rand() < 0.25) {
        const n = chord[(inBar / 2) % chord.length | 0] + th.octave;
        tone(m(n), nextTime, spb * 0.45, { type: th.lead, gain: 0.05, release: 0.25, bus: musicBus, filter: 3000 });
      }
      // melodi kecil
      if ((inBar === 1 || inBar === 5) && rand() < 0.55) {
        const deg = th.scale[Math.floor(rand() * th.scale.length)];
        tone(m(60 + th.octave + deg + (rand() < 0.3 ? 12 : 0)), nextTime, spb * 0.9, { type: 'sine', gain: 0.04, attack: 0.03, release: 0.5, bus: musicBus });
      }
      if (th.perc) {
        if (inBar % 2 === 0) noise(nextTime, 0.04, 0.025, 8000, musicBus);
        if (inBar === 0 || inBar === 4) tone(110, nextTime, 0.12, { type: 'sine', gain: 0.18, glideTo: 50, bus: musicBus });
      }
      nextTime += spb / 2;
      step++;
    }
  };
  schedule();
  musicTimer = window.setInterval(schedule, 120);
}

export function stopMusic() {
  if (musicTimer !== null) window.clearInterval(musicTimer);
  musicTimer = null;
  currentTheme = null;
}
