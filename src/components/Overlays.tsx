import { useEffect, useRef } from 'react';
import { Award, CheckCircle2, Hand, Info, TriangleAlert, ArrowUp } from 'lucide-react';
import { useUI } from '../store/uiStore';
import { BADGES, CRYSTALS } from '../quests/questData';
import { input } from '../hooks/input';
import { useIsTouch } from '../hooks/useIsTouch';
import { sfx } from '../audio/audioEngine';

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed right-2 top-16 z-[60] flex w-[min(92vw,340px)] flex-col gap-2 sm:right-3 sm:top-20" aria-live="polite">
      {toasts.map((t) => {
        const badge = t.badge ? BADGES.find((b) => b.id === t.badge) : null;
        return (
          <div key={t.id} className={`flex items-start gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold text-white shadow-xl backdrop-blur-md animate-fadeup
            ${t.kind === 'good' ? 'border-emerald-300/40 bg-emerald-700/80' : t.kind === 'warn' ? 'border-amber-300/50 bg-amber-700/85' : 'border-white/25 bg-slate-900/75'}`}>
            {badge ? <span className="text-2xl">{badge.icon}</span> : t.kind === 'good' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : t.kind === 'warn' ? <TriangleAlert size={18} className="mt-0.5 shrink-0" /> : <Info size={18} className="mt-0.5 shrink-0" />}
            <div>
              {badge ? <><div className="text-xs uppercase tracking-wide text-amber-200">Lencana baharu!</div><div className="font-display text-base">{badge.name}</div></> : t.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CelebrationOverlay() {
  const c = useUI((s) => s.celebration);
  const close = () => { sfx('click'); useUI.getState().celebrate(null); };
  useEffect(() => {
    if (!c) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === 'Escape' || e.code === 'KeyE') close(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [c]);
  if (!c) return null;
  const crystal = c.crystal ? CRYSTALS.find((x) => x.id === c.crystal) : null;
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={c.title}>
      <Confetti />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-200/40 bg-gradient-to-b from-violet-700 to-indigo-950 p-6 text-center text-white shadow-[0_0_80px_rgba(251,191,36,.35)] animate-pop">
        <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center">
          {crystal ? (
            <div className="h-24 w-16 animate-floaty" style={{ clipPath: 'polygon(50% 0, 100% 45%, 50% 100%, 0 45%)', background: `linear-gradient(160deg, #fff, ${crystal.color})`, boxShadow: `0 0 40px ${crystal.color}` }} />
          ) : (
            <Award size={84} className="animate-floaty text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,.7)]" />
          )}
        </div>
        <div className="font-display text-sm font-bold uppercase tracking-[0.2em] text-amber-200">{c.subtitle}</div>
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{c.title}</h2>
        {crystal && <div className="mt-1 font-bold" style={{ color: crystal.color }}>{crystal.name}</div>}
        <p className="mx-auto mt-3 max-w-sm text-white/90">{c.text}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {c.rewards.map((r) => <span key={r} className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">{r}</span>)}
        </div>
        <button onClick={close} className="mt-5 rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 px-8 py-3 font-display text-lg font-bold text-amber-950 shadow-lg hover:scale-105">
          Teruskan
        </button>
      </div>
    </div>
  );
}

/** Konfeti CSS terhad (bilangan tetap, tiada penciptaan tanpa had) */
function Confetti() {
  const pieces = 40;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: pieces }, (_, i) => (
        <span key={i} className="absolute top-[-5%] block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 97) % 100}%`,
            background: ['#fde047', '#a78bfa', '#34d399', '#f472b6', '#38bdf8'][i % 5],
            animation: `confetti ${2.2 + (i % 5) * 0.4}s linear ${(i % 10) * 0.12}s infinite`,
          }} />
      ))}
    </div>
  );
}

export function TransitionOverlay() {
  const t = useUI((s) => s.transition);
  return (
    <div className={`pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-br from-violet-700 via-fuchsia-600 to-indigo-800 transition-opacity duration-500 ${t ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!t}>
      {t && (
        <div className="text-center text-white animate-pop">
          <div className="text-6xl animate-spin [animation-duration:2s]">🌀</div>
          <div className="mt-2 font-display text-sm uppercase tracking-[0.3em] text-white/80">Memasuki</div>
          <div className="font-display text-4xl font-extrabold">{t}</div>
        </div>
      )}
    </div>
  );
}

// ===================== KAWALAN SENTUH =====================
export function MobileControls() {
  const touch = useIsTouch();
  const nearby = useUI((s) => s.nearby);
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);
  if (!touch) return null;

  const update = (cx: number, cy: number) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = cx - (r.left + r.width / 2);
    const dy = cy - (r.top + r.height / 2);
    const max = r.width / 2;
    const len = Math.hypot(dx, dy);
    const k = len > max ? max / len : 1;
    input.joyX = (dx * k) / max;
    input.joyY = (dy * k) / max;
    if (knob.current) knob.current.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
  };
  const reset = () => {
    pid.current = null;
    input.joyX = 0;
    input.joyY = 0;
    if (knob.current) knob.current.style.transform = 'translate(0,0)';
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex items-end justify-between p-5 pb-6" style={{ paddingLeft: 'max(1.25rem, env(safe-area-inset-left, 0px))', paddingRight: 'max(1.25rem, env(safe-area-inset-right, 0px))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}>
      <div
        ref={base}
        className="pointer-events-auto relative h-32 w-32 touch-none rounded-full border-2 border-white/40 bg-slate-900/30 backdrop-blur"
        onPointerDown={(e) => { pid.current = e.pointerId; (e.target as HTMLElement).setPointerCapture(e.pointerId); update(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (pid.current === e.pointerId) update(e.clientX, e.clientY); }}
        onPointerUp={reset}
        onPointerCancel={reset}
        aria-label="Kayu bedik maya untuk bergerak"
      >
        <div ref={knob} className="absolute left-1/2 top-1/2 -ml-8 -mt-8 h-16 w-16 rounded-full border-2 border-white/70 bg-white/40 shadow-lg" />
      </div>
      <div className="pointer-events-auto flex items-end gap-3">
        <button
          className={`flex h-16 w-16 touch-none items-center justify-center rounded-full border-2 text-white shadow-lg backdrop-blur transition ${nearby ? 'scale-110 border-amber-200 bg-amber-400/80' : 'border-white/40 bg-slate-900/35'}`}
          onPointerDown={(e) => { e.preventDefault(); input.interactQueued = true; }}
          aria-label="Berinteraksi"
        >
          <Hand size={28} />
        </button>
        <button
          className="flex h-20 w-20 touch-none items-center justify-center rounded-full border-2 border-white/50 bg-violet-500/60 text-white shadow-lg backdrop-blur active:scale-95"
          onPointerDown={(e) => { e.preventDefault(); input.jumpQueued = true; }}
          aria-label="Lompat"
        >
          <ArrowUp size={34} />
        </button>
      </div>
    </div>
  );
}
