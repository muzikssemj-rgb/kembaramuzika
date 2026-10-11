import { useEffect, useRef, useState } from 'react';
import { Trophy, BookOpen, Coins, HelpCircle, Map, Navigation, Pause, ScrollText, Volume2, VolumeX } from 'lucide-react';
import { useGame, levelInfo } from '../store/gameStore';
import { useUI } from '../store/uiStore';
import { CRYSTALS } from '../quests/questData';
import { WORLDS } from '../worlds/worldData';
import { getObjective } from '../game/objective';
import { playerPos } from '../game/playerState';
import { input } from '../hooks/input';
import { sfx } from '../audio/audioEngine';
import { useIsTouch } from '../hooks/useIsTouch';
import { FullscreenButton } from './AppControls';

export function HUD() {
  const g = useGame();
  const setPanel = useUI((s) => s.setPanel);
  const nearby = useUI((s) => s.nearby);
  const blocked = useUI((s) => !!(s.panel || s.dialogueNpc || s.challenge || s.celebration));
  const touch = useIsTouch();
  const lv = levelInfo(g.xp);
  const world = WORLDS[g.world];
  const objective = getObjective(g, playerPos.x, playerPos.z);
  const [banner, setBanner] = useState<string | null>(world.name);

  useEffect(() => {
    setBanner(world.name);
    const t = setTimeout(() => setBanner(null), 3200);
    return () => clearTimeout(t);
  }, [world.name]);

  const btn = (label: string, icon: React.ReactNode, onClick: () => void, key?: string) => (
    <button
      onClick={() => { sfx('click'); onClick(); }}
      className="group relative flex h-9 w-9 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl border border-white/25 bg-slate-900/45 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-slate-900/65"
      aria-label={label}
      title={key ? `${label} (${key})` : label}
    >
      {icon}
    </button>
  );

  return (
    <div className="pointer-events-none absolute z-20 select-none font-body" style={{ inset: 'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)' }}>
      {/* Kiri atas: pemain */}
      <div className="pointer-events-auto absolute left-2 top-2 flex items-center gap-2 rounded-2xl border border-white/20 bg-slate-900/45 p-2 pr-3 text-white shadow-lg backdrop-blur-md sm:left-3 sm:top-3">
        <div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl leading-none" style={{ background: `linear-gradient(135deg, ${g.avatar.body}, ${g.avatar.accent})` }} aria-label={`Tahap ${lv.level}`}>
          <span className="text-[8px] font-extrabold tracking-wide">TAHAP</span>
          <span className="font-display text-xl font-extrabold">{lv.level}</span>
        </div>
        <div className="w-[4.5rem] sm:w-36">
          <div className="truncate text-sm font-bold">{g.avatar.name}</div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20" aria-label={`XP ${lv.into} daripada ${lv.need}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all" style={{ width: `${(lv.into / lv.need) * 100}%` }} />
          </div>
          <div className="mt-0.5 flex justify-between text-[10px] text-white/75"><span>{lv.into}/{lv.need} XP</span><span className="flex items-center gap-0.5 text-amber-200"><Coins size={10} />{g.coins}</span></div>
        </div>
      </div>

      {/* Tengah atas: kristal */}
      <div className="absolute left-1/2 top-2 hidden -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/20 bg-slate-900/40 px-3 py-1.5 backdrop-blur-md xl:flex sm:top-3" aria-label={`Kristal: ${g.crystals.length} daripada 7`}>
        {CRYSTALS.map((c) => {
          const has = g.crystals.includes(c.id);
          return (
            <div key={c.id} title={c.name} className="h-5 w-3.5 rotate-0 transition" style={{ clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)', background: has ? c.color : 'rgba(255,255,255,.18)', boxShadow: has ? `0 0 12px ${c.color}` : undefined }} />
          );
        })}
        <span className="ml-1 text-xs font-bold text-white/90">{g.crystals.length}/7</span>
      </div>

      {/* Kanan atas: butang */}
      <div className="pointer-events-auto absolute right-2 top-2 flex gap-1 sm:right-3 sm:top-3 sm:gap-1.5">
        {btn('Log Quest', <ScrollText size={20} />, () => setPanel('quests'), 'Q')}
        {btn('Buku Teori Muzik', <BookOpen size={20} />, () => setPanel('book'), 'B')}
        {btn('Peta Dunia', <Map size={20} />, () => setPanel('worlds'), 'M')}
        {btn('Skor Saya', <Trophy size={20} />, () => setPanel('score'), 'K')}
        <span className="hidden sm:block">{btn('Bantuan Kawalan', <HelpCircle size={20} />, () => setPanel('help'), 'H')}</span>
        {btn(g.settings.muted ? 'Hidupkan bunyi' : 'Senyapkan', g.settings.muted ? <VolumeX size={20} /> : <Volume2 size={20} />, () => g.updateSettings({ muted: !g.settings.muted }))}
        <FullscreenButton className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-slate-900/45 text-white shadow-lg backdrop-blur-md transition hover:scale-105 sm:h-11 sm:w-11 sm:rounded-2xl" />
        {btn('Jeda', <Pause size={20} />, () => setPanel('pause'), 'Esc')}
      </div>

      {/* Kiri: penjejak quest */}
      {objective && (
        <div className="absolute left-2 top-[76px] w-[min(64vw,290px)] rounded-2xl border border-white/20 bg-slate-900/45 p-2.5 text-white sm:p-3 shadow-lg backdrop-blur-md sm:left-3 sm:top-[84px]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-300">
            <ScrollText size={13} /> {objective.questTitle}
          </div>
          <div className="mt-1 text-xs font-semibold leading-snug sm:text-sm">{objective.text}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {Array.from({ length: objective.totalSteps }, (_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < objective.stepIndex ? 'bg-emerald-400' : i === objective.stepIndex ? 'bg-amber-300' : 'bg-white/20'}`} />
              ))}
            </div>
            {objective.counter && <span className="rounded-full bg-amber-300 px-2 text-xs font-extrabold text-amber-950">{objective.counter}</span>}
          </div>
          {objective.target && <ObjectiveArrow target={objective.target} />}
        </div>
      )}

      {/* Gesaan interaksi */}
      {nearby && !blocked && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 animate-fadeup sm:bottom-24">
          <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-slate-900/70 px-4 py-2 text-white shadow-xl backdrop-blur-md">
            {!touch && <kbd className="rounded-lg border-b-4 border-amber-500 bg-amber-300 px-2.5 py-0.5 font-display text-lg font-extrabold text-amber-950">E</kbd>}
            <span className="font-semibold">
              {touch ? 'Ketik ✋ untuk ' : 'Tekan E untuk '}
              {nearby.kind === 'npc' ? `berinteraksi dengan ${nearby.label}` : nearby.kind === 'portal' ? `masuk ${nearby.label}` : nearby.kind === 'stone' ? 'mengetuk Batu Not' : nearby.kind === 'gate' ? `membuka ${nearby.label}` : `menggunakan ${nearby.label}`}
            </span>
          </div>
        </div>
      )}

      {/* Sepanduk nama dunia */}
      {banner && (
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 text-center animate-fadeup">
          <div className="font-display text-4xl font-extrabold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,.5)] sm:text-6xl">{banner}</div>
          <div className="mt-1 font-semibold text-white/90 drop-shadow">{world.subtitle}</div>
        </div>
      )}

      {/* Panduan kawalan ringkas (desktop) */}
      {!touch && (
        <div className="absolute bottom-3 left-3 hidden rounded-xl bg-slate-900/40 px-3 py-1.5 text-[11px] text-white/85 backdrop-blur md:block">
          <b>WASD</b> gerak · <b>Shift</b> lari · <b>Space</b> lompat · <b>E</b> interaksi · <b>Seret tetikus</b> putar kamera · <b>Esc</b> jeda
        </div>
      )}
    </div>
  );
}

/** Anak panah kompas ke arah objektif, relatif kepada kamera */
function ObjectiveArrow({ target }: { target: [number, number, number] }) {
  const arrow = useRef<HTMLDivElement>(null);
  const dist = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const dx = target[0] - playerPos.x;
      const dz = target[2] - playerPos.z;
      const d = Math.hypot(dx, dz);
      // arah dunia → arah skrin: kamera memandang ke (-sin yaw, -cos yaw)
      const worldAng = Math.atan2(dx, -dz);
      const camAng = Math.atan2(-Math.sin(input.camYaw), Math.cos(input.camYaw));
      const rel = worldAng - camAng;
      if (arrow.current) arrow.current.style.transform = `rotate(${rel}rad)`;
      if (dist.current) dist.current.textContent = d < 3 ? 'Di sini!' : `${Math.round(d)} m`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-white/85">
      <div ref={arrow} className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-300/90 text-amber-950 shadow">
        <Navigation size={15} fill="currentColor" className="-rotate-45" />
      </div>
      <span>Arah objektif · <span ref={dist} className="font-bold" /></span>
    </div>
  );
}
