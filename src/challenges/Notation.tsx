import type { ReactNode } from 'react';
import type { Clef, NoteName, RhythmToken, SymbolId } from '../types';
import { parseNote, staffStep, tokenBeats } from '../utils/music';
import { MUSIC_FONT } from '../utils/canvasTextures';

/**
 * Pemaparan notasi muzik berasaskan SVG (tiada imej luar).
 * Unit asas: G = jarak antara dua garisan baluk.
 */
export const G = 12;
const INK = '#1e1b4b';

// Kalibrasi glyph fon (Noto Music) — anjakan menegak relatif garisan rujukan, dalam unit G
export const GLYPH = {
  trebleSize: 4.5, trebleDy: 1.1,  // garis dasar teks relatif garisan G (garisan ke-2)
  bassSize: 4.5, bassDy: 2.83,      // relatif garisan F (garisan ke-4)
  restSize: 4.0, restDy: 2.05,
};

function lineY(top: number, step: number) {
  // step 0 = garisan bawah; top = y garisan atas (step 8)
  return top + (8 - step) * (G / 2);
}

export function StaffLines({ x, width, top }: { x: number; width: number; top: number }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={x} x2={x + width} y1={top + i * G} y2={top + i * G} stroke={INK} strokeWidth={1.1} />
      ))}
    </g>
  );
}

export function ClefGlyph({ clef, x, top }: { clef: Clef; x: number; top: number }) {
  if (clef === 'treble') {
    const y = lineY(top, 2) + GLYPH.trebleDy * G;
    return <text x={x} y={y} fontSize={G * GLYPH.trebleSize} fontFamily={MUSIC_FONT} fill={INK}>𝄞</text>;
  }
  const y = lineY(top, 6) + GLYPH.bassDy * G;
  return <text x={x} y={y} fontSize={G * GLYPH.bassSize} fontFamily={MUSIC_FONT} fill={INK}>𝄢</text>;
}

function TimeSig({ x, top, sig }: { x: number; top: number; sig: [number, number] }) {
  const style = { fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 900, fontSize: G * 2.15, fill: INK } as const;
  return (
    <g>
      <text x={x} y={top + G * 1.78} textAnchor="middle" {...style}>{sig[0]}</text>
      <text x={x} y={top + G * 3.78} textAnchor="middle" {...style}>{sig[1]}</text>
    </g>
  );
}

function Accidental({ acc, x, y }: { acc: number; x: number; y: number }) {
  const ch = acc === 1 ? '♯' : acc === -1 ? '♭' : acc === 2 ? '𝄪' : acc === -2 ? '𝄫' : '♮';
  return (
    <text x={x} y={y + G * (acc < 0 ? 0.31 : 0.41)} fontSize={G * 3} fontFamily={MUSIC_FONT} textAnchor="middle" fill={INK}>
      {ch}
    </text>
  );
}

function LedgerLines({ x, top, step, w = G * 1.1 }: { x: number; top: number; step: number; w?: number }) {
  const out: ReactNode[] = [];
  for (let s = -2; s >= step; s -= 2) out.push(<line key={`b${s}`} x1={x - w} x2={x + w} y1={lineY(top, s)} y2={lineY(top, s)} stroke={INK} strokeWidth={1.1} />);
  for (let s = 10; s <= step; s += 2) out.push(<line key={`t${s}`} x1={x - w} x2={x + w} y1={lineY(top, s)} y2={lineY(top, s)} stroke={INK} strokeWidth={1.1} />);
  return <>{out}</>;
}

/** Kepala not semibrif (berlubang) */
function WholeHead({ x, y, color = INK }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={G * 0.78} ry={G * 0.52} fill={color} />
      <ellipse cx={x} cy={y} rx={G * 0.34} ry={G * 0.4} transform={`rotate(-35 ${x} ${y})`} fill="#fff" />
    </g>
  );
}

function FilledHead({ x, y, hollow, color = INK }: { x: number; y: number; hollow?: boolean; color?: string }) {
  return (
    <g transform={`rotate(-22 ${x} ${y})`}>
      <ellipse cx={x} cy={y} rx={G * 0.66} ry={G * 0.46} fill={color} />
      {hollow && <ellipse cx={x} cy={y} rx={G * 0.48} ry={G * 0.2} fill="#fff" />}
    </g>
  );
}

// ===================== BALUK DENGAN NOT =====================
interface StaffProps {
  clef: Clef;
  notes: (NoteName | NoteName[] | '?')[];
  labels?: string[];
  highlight?: number[];
  timeSig?: [number, number];
  width?: number;
  noteColor?: string;
  ghost?: { step: number; color: string } | null;
  placed?: { step: number; color: string } | null;
  ariaLabel?: string;
}

export function Staff({ clef, notes, labels, highlight = [], timeSig, noteColor, ghost, placed, ariaLabel }: StaffProps) {
  const top = G * 3.5;
  const startX = 12;
  const clefW = G * 3.4;
  const tsW = timeSig ? G * 2.6 : 0;
  const spacing = G * 4.2;
  const firstX = startX + clefW + tsW + G * 2.2;
  const n = Math.max(notes.length, ghost || placed ? 1 : 0);
  const width = Math.max(firstX + spacing * Math.max(n, 1) + G, G * 22);
  const height = top + G * 4 + G * 3.6;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={ariaLabel ?? `Baluk klef ${clef === 'treble' ? 'trebel' : 'bes'}`}>
      <StaffLines x={startX} width={width - startX - 6} top={top} />
      <line x1={width - 6} x2={width - 6} y1={top} y2={top + 4 * G} stroke={INK} strokeWidth={1.5} />
      <ClefGlyph clef={clef} x={startX + 4} top={top} />
      {timeSig && <TimeSig x={startX + clefW + G * 1.2} top={top} sig={timeSig} />}
      {notes.map((nn, i) => {
        const x = firstX + i * spacing + spacing / 2 - G * 1.5;
        const color = highlight.includes(i) ? '#7c3aed' : noteColor ?? INK;
        if (nn === '?') {
          return (
            <g key={i}>
              <rect x={x - G * 1.2} y={top - G * 0.6} width={G * 2.4} height={G * 5.2} rx={G * 0.6} fill="#fde68a" stroke="#f59e0b" strokeDasharray="4 3" />
              <text x={x} y={top + G * 2.9} textAnchor="middle" fontSize={G * 2.4} fontWeight={800} fill="#b45309" fontFamily="Nunito, sans-serif">?</text>
            </g>
          );
        }
        const chord = Array.isArray(nn) ? nn : [nn];
        return (
          <g key={i}>
            {chord.map((note) => {
              const st = staffStep(note, clef);
              const y = lineY(top, st);
              const acc = parseNote(note).acc;
              return (
                <g key={note}>
                  <LedgerLines x={x} top={top} step={st} />
                  {acc !== 0 && <Accidental acc={acc} x={x - G * 1.9} y={y} />}
                  <WholeHead x={x} y={y} color={color} />
                </g>
              );
            })}
            {labels?.[i] && (
              <text x={x} y={height - G * 0.6} textAnchor="middle" fontSize={G * 1.3} fontWeight={800} fill="#6d28d9" fontFamily="Nunito, sans-serif">{labels[i]}</text>
            )}
          </g>
        );
      })}
      {ghost && <GhostNote x={firstX + spacing / 2 - G * 1.5} top={top} step={ghost.step} color={ghost.color} />}
      {placed && (
        <g>
          <LedgerLines x={firstX + spacing / 2 - G * 1.5} top={top} step={placed.step} />
          <WholeHead x={firstX + spacing / 2 - G * 1.5} y={lineY(top, placed.step)} color={placed.color} />
        </g>
      )}
    </svg>
  );
}

function GhostNote({ x, top, step, color }: { x: number; top: number; step: number; color: string }) {
  return (
    <g opacity={0.55}>
      <LedgerLines x={x} top={top} step={step} />
      <WholeHead x={x} y={lineY(top, step)} color={color} />
    </g>
  );
}

/** Geometri untuk komponen interaktif (staff-place) */
export function staffGeometry(notesCount = 1, hasTime = false) {
  const top = G * 3.5;
  const startX = 12;
  const clefW = G * 3.4;
  const tsW = hasTime ? G * 2.6 : 0;
  const spacing = G * 4.2;
  const firstX = startX + clefW + tsW + G * 2.2;
  const width = Math.max(firstX + spacing * Math.max(notesCount, 1) + G, G * 22);
  const height = top + G * 4 + G * 3.6;
  return { top, width, height, yToStep: (y: number) => Math.round(8 - (y - top) / (G / 2)) };
}

// ===================== IRAMA =====================
export function Rhythm({ tokens, timeSig, compact, color = INK, countLabels }: { tokens: RhythmToken[]; timeSig?: [number, number]; compact?: boolean; color?: string; countLabels?: boolean }) {
  const lineYv = G * 4.6;
  const left = timeSig ? G * 3.2 : G * 1.2;
  const xs: number[] = [];
  let x = left + G * 1.2;
  for (const t of tokens) {
    xs.push(x);
    x += G * (compact ? 2.2 : 2.6) + tokenBeats(t) * G * (compact ? 1.4 : 2.0);
  }
  const width = Math.max(x + G * 0.5, compact ? G * 8 : G * 14);
  const height = G * 7.2;
  // kumpulkan kuaver bersebelahan untuk dirasuk (beam) secara berpasangan
  const beamed = new Set<number>();
  const beams: [number, number, Duration2][] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (beamed.has(i)) continue;
    if (!a.rest && !b.rest && !a.dot && !b.dot && a.d === b.d && (a.d === 'e' || a.d === 's')) {
      beamed.add(i); beamed.add(i + 1);
      beams.push([i, i + 1, a.d]);
    }
  }
  const stemTop = lineYv - G * 3.3;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Corak irama">
      <line x1={4} x2={width - 4} y1={lineYv} y2={lineYv} stroke={INK} strokeWidth={1.1} />
      {timeSig && (
        <g fontFamily='Georgia, "Times New Roman", serif' fontWeight={900} fontSize={G * 2} fill={INK}>
          <text x={G * 1.7} y={lineYv - G * 0.25} textAnchor="middle">{timeSig[0]}</text>
          <text x={G * 1.7} y={lineYv + G * 1.75} textAnchor="middle">{timeSig[1]}</text>
        </g>
      )}
      {tokens.map((t, i) => {
        const cx = xs[i];
        if (t.rest) return <RestGlyph key={i} d={t.d} x={cx} lineY={lineYv} color={color} />;
        const hollow = t.d === 'w' || t.d === 'h';
        return (
          <g key={i}>
            {t.d === 'w' ? <WholeHead x={cx} y={lineYv} color={color} /> : <FilledHead x={cx} y={lineYv} hollow={hollow} color={color} />}
            {t.d !== 'w' && <line x1={cx + G * 0.6} x2={cx + G * 0.6} y1={lineYv - 2} y2={stemTop} stroke={color} strokeWidth={1.6} />}
            {!beamed.has(i) && (t.d === 'e' || t.d === 's') && <Flag x={cx + G * 0.6} y={stemTop} double={t.d === 's'} color={color} />}
            {t.dot && <circle cx={cx + G * 1.25} cy={lineYv - G * 0.35} r={G * 0.17} fill={color} />}
            {countLabels && <text x={cx} y={lineYv + G * 2.2} textAnchor="middle" fontSize={G * 1.1} fill="#6d28d9" fontWeight={700}>{tokenBeats(t)}</text>}
          </g>
        );
      })}
      {beams.map(([a, b, d], k) => (
        <g key={k}>
          <rect x={xs[a] + G * 0.6 - 0.8} y={stemTop} width={xs[b] - xs[a] + 1.6} height={G * 0.42} fill={color} />
          {d === 's' && <rect x={xs[a] + G * 0.6 - 0.8} y={stemTop + G * 0.7} width={xs[b] - xs[a] + 1.6} height={G * 0.42} fill={color} />}
        </g>
      ))}
    </svg>
  );
}
type Duration2 = RhythmToken['d'];

function Flag({ x, y, double, color }: { x: number; y: number; double?: boolean; color: string }) {
  const one = (dy: number) => (
    <path key={dy} d={`M ${x} ${y + dy} c ${G * 0.2} ${G * 0.9} ${G * 1.4} ${G * 1.1} ${G * 0.9} ${G * 2.4} c ${G * 0.1} ${-G * 0.9} ${-G * 0.3} ${-G * 1.2} ${-G * 0.9} ${-G * 1.5} z`} fill={color} />
  );
  return <g>{one(0)}{double && one(G * 0.8)}</g>;
}

function RestGlyph({ d, x, lineY: ly, color }: { d: RhythmToken['d']; x: number; lineY: number; color: string }) {
  if (d === 'w') return <rect x={x - G * 0.7} y={ly} width={G * 1.4} height={G * 0.55} fill={color} />;
  if (d === 'h') return <rect x={x - G * 0.7} y={ly - G * 0.55} width={G * 1.4} height={G * 0.55} fill={color} />;
  const ch = d === 'q' ? '𝄽' : d === 'e' ? '𝄾' : '𝄿';
  return <text x={x} y={ly + G * GLYPH.restDy} fontSize={G * GLYPH.restSize} fontFamily={MUSIC_FONT} textAnchor="middle" fill={color}>{ch}</text>;
}

// ===================== SIMBOL =====================
export function SymbolView({ symbol, size = 'lg' }: { symbol: SymbolId; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-28 w-auto' : 'h-14 w-auto';
  const top = G * 2;
  const W = G * 9;
  const H = G * 8;
  const staffBg = <StaffLines x={4} width={W - 8} top={top} />;
  let inner: ReactNode = null;
  switch (symbol) {
    case 'treble': inner = <>{staffBg}<ClefGlyph clef="treble" x={G * 2.8} top={top} /></>; break;
    case 'bass': inner = <>{staffBg}<ClefGlyph clef="bass" x={G * 2.6} top={top} /></>; break;
    case 'sharp': case 'flat': case 'natural':
      inner = <text x={W / 2} y={H * 0.72} textAnchor="middle" fontSize={G * 5.5} fontFamily={MUSIC_FONT} fill={INK}>{symbol === 'sharp' ? '♯' : symbol === 'flat' ? '♭' : '♮'}</text>;
      break;
    case 'whole': case 'half': case 'quarter': case 'eighth': case 'sixteenth': {
      const d = ({ whole: 'w', half: 'h', quarter: 'q', eighth: 'e', sixteenth: 's' } as const)[symbol];
      const x = W / 2 - G * 0.4;
      const y = H * 0.72;
      const stemTop = y - G * 3.6;
      inner = (
        <g>
          {d === 'w' ? <WholeHead x={x} y={y} /> : <FilledHead x={x} y={y} hollow={d === 'h'} />}
          {d !== 'w' && <line x1={x + G * 0.6} x2={x + G * 0.6} y1={y - 2} y2={stemTop} stroke={INK} strokeWidth={1.6} />}
          {(d === 'e' || d === 's') && <Flag x={x + G * 0.6} y={stemTop} double={d === 's'} color={INK} />}
        </g>
      );
      break;
    }
    case 'rest-whole': case 'rest-half': case 'rest-quarter': case 'rest-eighth': {
      const x = W / 2;
      const yLine = (stepFromBottom: number) => top + (8 - stepFromBottom) * (G / 2);
      inner = (
        <g>
          {staffBg}
          {symbol === 'rest-whole' && <rect x={x - G * 0.75} y={yLine(6)} width={G * 1.5} height={G * 0.55} fill={INK} />}
          {symbol === 'rest-half' && <rect x={x - G * 0.75} y={yLine(4) - G * 0.55} width={G * 1.5} height={G * 0.55} fill={INK} />}
          {symbol === 'rest-quarter' && <text x={x} y={yLine(4) + G * GLYPH.restDy} fontSize={G * GLYPH.restSize} fontFamily={MUSIC_FONT} textAnchor="middle" fill={INK}>𝄽</text>}
          {symbol === 'rest-eighth' && <text x={x} y={yLine(4) + G * GLYPH.restDy} fontSize={G * GLYPH.restSize} fontFamily={MUSIC_FONT} textAnchor="middle" fill={INK}>𝄾</text>}
        </g>
      );
      break;
    }
    case 'time-44': case 'time-34': case 'time-24': {
      const n = Number(symbol[5]);
      inner = <>{staffBg}<TimeSig x={W / 2} top={top} sig={[n, 4]} /></>;
      break;
    }
    case 'barline': inner = <>{staffBg}<line x1={W / 2} x2={W / 2} y1={top} y2={top + 4 * G} stroke={INK} strokeWidth={1.6} /></>; break;
    case 'double-bar':
      inner = <>{staffBg}<line x1={W / 2 - 3} x2={W / 2 - 3} y1={top} y2={top + 4 * G} stroke={INK} strokeWidth={1.4} /><rect x={W / 2} y={top} width={4} height={4 * G} fill={INK} /></>;
      break;
    case 'repeat':
      inner = (
        <>{staffBg}
          <circle cx={W / 2 - 8} cy={top + 1.5 * G} r={2.2} fill={INK} /><circle cx={W / 2 - 8} cy={top + 2.5 * G} r={2.2} fill={INK} />
          <line x1={W / 2 - 2} x2={W / 2 - 2} y1={top} y2={top + 4 * G} stroke={INK} strokeWidth={1.4} />
          <rect x={W / 2 + 2} y={top} width={4} height={4 * G} fill={INK} />
        </>
      );
      break;
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cls} role="img" aria-label="Simbol muzik">
      {inner}
    </svg>
  );
}

// ===================== PAPAN KEKUNCI PIANO =====================
const WHITE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export function PianoKeyboard({ highlight = [], octaves = 1, startOctave = 4, onPress, labels = true }: {
  highlight?: string[]; octaves?: number; startOctave?: number; onPress?: (note: string) => void; labels?: boolean;
}) {
  const ww = 34;
  const wh = 120;
  const whites: string[] = [];
  for (let o = 0; o < octaves; o++) WHITE.forEach((l) => whites.push(`${l}${startOctave + o}`));
  whites.push(`C${startOctave + octaves}`);
  const width = whites.length * ww;
  const blacks: { note: string; x: number }[] = [];
  whites.forEach((w, i) => {
    const l = w[0];
    if (['C', 'D', 'F', 'G', 'A'].includes(l) && i < whites.length - 1) blacks.push({ note: `${l}#${w.slice(1)}`, x: (i + 1) * ww - 11 });
  });
  const isHi = (n: string) => highlight.includes(n);
  return (
    <svg viewBox={`0 0 ${width + 2} ${wh + 2}`} className="w-full h-auto max-h-40" role="img" aria-label="Papan kekunci piano">
      {whites.map((n, i) => (
        <g key={n} onClick={() => onPress?.(n)} className={onPress ? 'cursor-pointer' : ''}>
          <rect x={i * ww + 1} y={1} width={ww - 2} height={wh} rx={4} fill={isHi(n) ? '#c4b5fd' : '#fff'} stroke="#1e1b4b" strokeWidth={1.2} />
          {labels && <text x={i * ww + ww / 2} y={wh - 10} textAnchor="middle" fontSize={13} fontWeight={800} fill={isHi(n) ? '#5b21b6' : '#64748b'}>{n[0]}</text>}
        </g>
      ))}
      {blacks.map((b) => (
        <rect key={b.note} x={b.x} y={1} width={22} height={wh * 0.62} rx={3} fill={isHi(b.note) ? '#7c3aed' : '#111827'} onClick={() => onPress?.(b.note)} className={onPress ? 'cursor-pointer' : ''} />
      ))}
    </svg>
  );
}
