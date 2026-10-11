import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2 } from 'lucide-react';
import type { ChoiceOption, Question, Stimulus } from '../types';
import { PianoKeyboard, Rhythm, Staff, SymbolView, staffGeometry, G } from './Notation';
import { displayName, noteFromStep, staffStep } from '../utils/music';
import { playChord, playMelodic, playNote, playRhythm, sfx } from '../audio/audioEngine';

export type Verdict = 'idle' | 'correct' | 'wrong';

// ===================== STIMULUS =====================
export function StimulusView({ s, revealAudio }: { s: Stimulus; revealAudio: boolean }) {
  const [playing, setPlaying] = useState(false);
  switch (s.kind) {
    case 'staff': {
      const chordOnly = s.notes.length === 1 && Array.isArray(s.notes[0]);
      const canPlay = revealAudio && !s.notes.includes('?');
      return (
        <div className="w-full">
          <div className="mx-auto max-w-md rounded-2xl bg-white p-3 shadow-inner">
            <Staff clef={s.clef} notes={s.notes} labels={s.labels} highlight={s.highlight} timeSig={s.timeSig} />
          </div>
          {canPlay && (
            <button
              className="mx-auto mt-2 flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-bold text-violet-800 hover:bg-violet-200"
              onClick={() => {
                const flat = s.notes.flatMap((n) => (Array.isArray(n) ? [n] : [[n as string]]));
                if (chordOnly) playChord(flat[0]);
                else playMelodic(flat.map((x) => x[0]));
              }}
            >
              <Volume2 size={16} /> Dengar bunyinya
            </button>
          )}
        </div>
      );
    }
    case 'rhythm':
      return (
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-3 shadow-inner">
          <Rhythm tokens={s.tokens} timeSig={s.timeSig} countLabels={s.showCounts} />
        </div>
      );
    case 'symbol':
      return (
        <div className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-white px-8 py-3 shadow-inner">
          <SymbolView symbol={s.symbol} />
        </div>
      );
    case 'keyboard':
      return (
        <div className="mx-auto w-full max-w-sm rounded-2xl bg-white p-3 shadow-inner">
          <PianoKeyboard highlight={s.highlight} onPress={(n) => playNote(n)} />
          <p className="mt-1 text-center text-xs text-slate-500">Ketik kekunci untuk mendengar bunyinya.</p>
        </div>
      );
    case 'audio-rhythm':
      return (
        <div className="flex flex-col items-center gap-2">
          <button
            disabled={playing}
            onClick={() => {
              setPlaying(true);
              playRhythm(s.tokens, s.bpm, s.timeSig?.[0] ?? 4, true, () => setPlaying(false));
            }}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 font-display text-lg font-bold text-white shadow-lg transition hover:scale-105 disabled:opacity-60"
          >
            {playing ? <Volume2 className="animate-pulse" /> : <Play />} {playing ? 'Sedang dimainkan…' : 'Main Irama'}
          </button>
          <p className="text-xs text-violet-200">Kiraan masuk: 4 ketukan, kemudian corak irama dimainkan.</p>
        </div>
      );
  }
}

// ===================== PILIHAN =====================
export function OptionContent({ o }: { o: ChoiceOption }) {
  if (o.rhythm) return <div className="w-36 sm:w-40"><Rhythm tokens={o.rhythm} compact /></div>;
  if (o.symbol) return (
    <div className="flex items-center gap-2">
      <SymbolView symbol={o.symbol} size="sm" />
      {o.label && <span className="font-display text-xl font-bold">{o.label}</span>}
    </div>
  );
  return <span className="font-display text-lg font-bold leading-tight sm:text-xl">{displayName(o.label ?? o.id)}</span>;
}

export function ChoiceView({ q, value, onChange, verdict, disabled }: { q: Question; value: string | null; onChange: (v: string) => void; verdict: Verdict; disabled: boolean }) {
  const opts = q.options ?? [];
  const visual = opts.some((o) => o.rhythm || o.symbol);
  return (
    <div className={`grid gap-2 ${visual ? 'grid-cols-2' : opts.length > 3 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`} role="radiogroup">
      {opts.map((o, i) => {
        const sel = value === o.id;
        const right = verdict === 'correct' && sel;
        const wrong = verdict === 'wrong' && sel;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={sel}
            disabled={disabled}
            onClick={() => { sfx('click'); onChange(o.id); }}
            className={`relative flex min-h-[56px] items-center justify-center rounded-2xl border-2 px-3 py-2 text-slate-800 shadow transition
              ${right ? 'border-emerald-500 bg-emerald-100' : wrong ? 'border-rose-500 bg-rose-100' : sel ? 'border-violet-500 bg-violet-100 ring-4 ring-violet-300/50' : 'border-white/60 bg-white hover:-translate-y-0.5 hover:border-violet-300'}
              disabled:cursor-default`}
          >
            <span className="absolute left-2 top-1.5 text-[11px] font-bold text-slate-400">{i + 1}</span>
            <OptionContent o={o} />
          </button>
        );
      })}
    </div>
  );
}

// ===================== LETAK NOT PADA BALUK =====================
export function StaffPlaceView({ q, value, onChange, disabled, verdict }: { q: Question; value: number | null; onChange: (step: number) => void; disabled: boolean; verdict: Verdict }) {
  const clef = q.clef ?? 'treble';
  const geo = staffGeometry(1);
  const svgWrap = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const stepFromClient = (clientX: number, clientY: number): number | null => {
    const el = svgWrap.current?.querySelector('svg');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top - 20 || clientY > r.bottom + 20) return null;
    const y = ((clientY - r.top) / r.height) * geo.height;
    return Math.max(-3, Math.min(11, geo.yToStep(y)));
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => { setDragPos({ x: e.clientX, y: e.clientY }); setGhost(stepFromClient(e.clientX, e.clientY)); };
    const up = (e: PointerEvent) => {
      const st = stepFromClient(e.clientX, e.clientY);
      if (st !== null) { onChange(st); playNote(noteFromStep(st, clef), 0.4); }
      setDragging(false); setDragPos(null); setGhost(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const color = verdict === 'correct' ? '#059669' : verdict === 'wrong' ? '#e11d48' : '#6d28d9';
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={svgWrap}
        tabIndex={0}
        aria-label="Baluk interaktif. Guna anak panah atas/bawah untuk memilih kedudukan, Enter untuk meletak."
        className="w-full max-w-md cursor-crosshair rounded-2xl bg-white p-3 shadow-inner outline-none focus:ring-4 focus:ring-violet-300"
        onPointerMove={(e) => { if (!disabled && !dragging && e.pointerType === 'mouse') setGhost(stepFromClient(e.clientX, e.clientY)); }}
        onPointerLeave={() => !dragging && setGhost(null)}
        onClick={(e) => {
          if (disabled) return;
          const st = stepFromClient(e.clientX, e.clientY);
          if (st !== null) { onChange(st); playNote(noteFromStep(st, clef), 0.4); }
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          const cur = value ?? 4;
          if (e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.min(11, cur + 1)); }
          if (e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(-3, cur - 1)); }
        }}
      >
        <Staff clef={clef} notes={[]} ghost={ghost !== null && !disabled ? { step: ghost, color: '#a78bfa' } : null} placed={value !== null ? { step: value, color } : null} />
      </div>
      <div className="flex items-center gap-3 text-sm text-violet-100">
        <button
          disabled={disabled}
          onPointerDown={(e) => { e.preventDefault(); setDragging(true); setDragPos({ x: e.clientX, y: e.clientY }); }}
          className="flex h-14 w-14 touch-none items-center justify-center rounded-2xl bg-white shadow-lg ring-2 ring-violet-300 disabled:opacity-40"
          aria-label="Not untuk diseret"
        >
          <svg viewBox="0 0 30 20" className="h-8 w-10"><ellipse cx={15} cy={10} rx={G * 0.78} ry={G * 0.52} fill="#1e1b4b" /><ellipse cx={15} cy={10} rx={G * 0.34} ry={G * 0.4} transform="rotate(-35 15 10)" fill="#fff" /></svg>
        </button>
        <span>Seret not ke baluk, atau ketik terus pada baluk.</span>
      </div>
      {dragging && dragPos && (
        <div className="pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-1/2" style={{ left: dragPos.x, top: dragPos.y }}>
          <div className="h-5 w-7 rounded-[50%] border-[5px] border-indigo-950 bg-white/70" />
        </div>
      )}
    </div>
  );
}

export function staffPlaceCorrect(q: Question, step: number | null) {
  return step !== null && step === staffStep(q.answer as string, q.clef ?? 'treble');
}

// ===================== PADANAN =====================
export function MatchView({ q, value, onChange, disabled, wrongIds }: { q: Question; value: Record<string, string>; onChange: (v: Record<string, string>) => void; disabled: boolean; wrongIds: string[] }) {
  const [activeLeft, setActiveLeft] = useState<string | null>(null);
  const rights = useMemo(() => [...q.pairs!.map((p) => p.right)].sort(() => Math.random() - 0.5), [q.id]);
  const palette = ['#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899'];
  const colorOf = (leftId: string) => palette[q.pairs!.findIndex((p) => p.left.id === leftId) % palette.length];
  const leftForRight = (r: string) => Object.entries(value).find(([, v]) => v === r)?.[0];
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        {q.pairs!.map((p) => {
          const paired = value[p.left.id];
          const wrong = wrongIds.includes(p.left.id);
          return (
            <button
              key={p.left.id}
              disabled={disabled}
              onClick={() => { sfx('click'); setActiveLeft(p.left.id); }}
              className={`flex min-h-[64px] items-center justify-center rounded-2xl border-4 bg-white px-2 shadow transition ${activeLeft === p.left.id ? 'scale-105 ring-4 ring-violet-300' : ''} ${wrong ? 'border-rose-500' : ''}`}
              style={{ borderColor: wrong ? undefined : paired ? colorOf(p.left.id) : '#e2e8f0' }}
              aria-label={`Simbol ${q.pairs!.indexOf(p) + 1}`}
            >
              {p.left.symbol ? <SymbolView symbol={p.left.symbol} size="sm" /> : <span className="font-bold">{p.left.label}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        {rights.map((r) => {
          const l = leftForRight(r);
          return (
            <button
              key={r}
              disabled={disabled}
              onClick={() => {
                sfx('click');
                if (!activeLeft) return;
                const next = { ...value };
                for (const k of Object.keys(next)) if (next[k] === r) delete next[k];
                next[activeLeft] = r;
                onChange(next);
                setActiveLeft(null);
              }}
              className={`min-h-[64px] rounded-2xl border-4 bg-white px-3 text-sm font-bold text-slate-800 shadow transition sm:text-base ${activeLeft ? 'hover:border-violet-400' : ''}`}
              style={{ borderColor: l ? colorOf(l) : '#e2e8f0' }}
            >
              {r}
            </button>
          );
        })}
      </div>
      <p className="col-span-2 text-center text-xs text-violet-200">Ketik simbol di kiri, kemudian ketik namanya di kanan.</p>
    </div>
  );
}

// ===================== SUSUNAN =====================
export function OrderView({ q, value, onChange, disabled }: { q: Question; value: string[]; onChange: (v: string[]) => void; disabled: boolean }) {
  const items = q.items!;
  const pool = items.filter((i) => !value.includes(i.id));
  const render = (id: string) => {
    const it = items.find((x) => x.id === id)!;
    if (it.rhythm) return <div className="w-24"><Rhythm tokens={it.rhythm} compact /></div>;
    if (it.symbol) return <div className="flex flex-col items-center"><SymbolView symbol={it.symbol} size="sm" />{it.label && <span className="text-xs font-bold">{it.label}</span>}</div>;
    return <span className="font-display text-xl font-bold">{displayName(it.label ?? it.id)}</span>;
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[84px] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-950/30 p-2">
        {value.length === 0 && <span className="w-full text-center text-sm text-violet-200">Ketik item di bawah mengikut urutan…</span>}
        {value.map((id, i) => (
          <button key={id} disabled={disabled} onClick={() => { sfx('click'); onChange(value.filter((v) => v !== id)); }}
            className="relative flex min-h-[64px] min-w-[56px] items-center justify-center rounded-xl bg-white px-2 text-slate-800 shadow">
            <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">{i + 1}</span>
            {render(id)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {pool.map((it) => (
          <button key={it.id} disabled={disabled} onClick={() => { sfx('click'); onChange([...value, it.id]); }}
            className="flex min-h-[64px] min-w-[56px] items-center justify-center rounded-xl border-2 border-white bg-white/90 px-2 text-slate-800 shadow transition hover:-translate-y-0.5">
            {render(it.id)}
          </button>
        ))}
      </div>
      {value.length > 0 && !disabled && (
        <button onClick={() => onChange([])} className="mx-auto flex items-center gap-1 text-xs text-violet-200 hover:text-white"><RotateCcw size={14} /> Kosongkan</button>
      )}
    </div>
  );
}

// ===================== BINA TRIAD =====================
export function TriadView({ q, value, onChange, disabled }: { q: Question; value: string[]; onChange: (v: string[]) => void; disabled: boolean }) {
  const choices = q.choices ?? [];
  const toNote = (n: string) => `${n}4`;
  const FLAT_TO_SHARP: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
  const toKey = (n: string) => `${FLAT_TO_SHARP[n] ?? n}4`;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {choices.map((c) => {
          const sel = value.includes(c);
          return (
            <button key={c} disabled={disabled}
              onClick={() => {
                playNote(toNote(c), 0.4);
                if (sel) onChange(value.filter((v) => v !== c));
                else if (value.length < 3) onChange([...value, c]);
              }}
              className={`h-14 w-14 rounded-2xl border-2 font-display text-xl font-bold shadow transition ${sel ? 'scale-110 border-amber-400 bg-amber-300 text-amber-950' : 'border-white bg-white text-slate-800 hover:-translate-y-0.5'}`}
              aria-pressed={sel}
            >
              {displayName(c)}
            </button>
          );
        })}
      </div>
      <div className="w-full max-w-sm rounded-2xl bg-white p-2"><PianoKeyboard highlight={value.map(toKey)} labels /></div>
      <div className="flex items-center gap-3 text-sm text-violet-100">
        <span>Dipilih: <b>{value.length}/3</b></span>
        {value.length > 0 && (
          <button onClick={() => playChord(value.map(toNote))} className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 hover:bg-white/25"><Volume2 size={14} /> Dengar kord</button>
        )}
      </div>
    </div>
  );
}
