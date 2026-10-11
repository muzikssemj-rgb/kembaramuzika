import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Trophy, Award, BarChart3, BookOpen, CalendarCheck, Map, Play, ScrollText, Settings, SkipForward, User, Compass } from 'lucide-react';
import { useGame, DEFAULT_AVATAR, levelInfo, todayKey } from '../store/gameStore';
import { useUI } from '../store/uiStore';
import { GlowButton, Copyright } from './ui';
import { DeviceStorageNotice, FullscreenButton, InstallButton } from './AppControls';
import { isEmbedded, isStandalone, toggleFullscreen } from '../utils/pwa';
import { AvatarEditor } from './AvatarEditor';
import { Avatar } from '../characters/Avatar';
import { Clouds, FloatingNote, SkyDome } from '../worlds/Scenery';
import { initAudio, sfx, startMusic } from '../audio/audioEngine';
import { CRYSTALS } from '../quests/questData';
import { startDaily } from './Panels';

// ===================== LATAR 3D MENU =====================
function MenuScene({ focus }: { focus: number }) {
  const rig = useRef<Group>(null);
  const crystals = useRef<Group>(null);
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.12;
    const r = 15 - focus * 4;
    camera.position.set(Math.sin(t) * r, 5 + Math.sin(t * 2) * 0.8, Math.cos(t) * r);
    camera.lookAt(0, 2, 0);
    if (crystals.current) crystals.current.rotation.y = clock.elapsedTime * 0.4;
  });
  const islands = useMemo(() => [
    [0, 0, 0, 6], [12, 2, -6, 3], [-11, 3, -4, 2.5], [5, 5, -14, 2.2], [-6, -2, 10, 2.8],
  ] as [number, number, number, number][], []);
  return (
    <group ref={rig}>
      <SkyDome top="#5b21b6" bottom="#f0abfc" />
      <fog attach="fog" args={['#c4b5fd', 25, 80]} />
      <hemisphereLight args={['#c4b5fd', '#4c1d95', 1.2]} />
      <directionalLight position={[10, 20, 10]} intensity={1.3} />
      <Clouds count={8} y={8} />
      {islands.map(([x, y, z, r], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position-y={-0.3}>
            <cylinderGeometry args={[r, r * 0.95, 0.6, 18]} />
            <meshStandardMaterial color={['#86efac', '#c4b5fd', '#fde68a', '#93c5fd', '#f9a8d4'][i]} flatShading />
          </mesh>
          <mesh position-y={-0.6 - r * 0.6}>
            <coneGeometry args={[r * 0.95, r * 1.2, 9]} />
            <meshStandardMaterial color="#7c4a1e" flatShading />
          </mesh>
          {i > 0 && <FloatingNote y={1.5} color={['#a78bfa', '#f472b6', '#38bdf8', '#fbbf24', '#34d399'][i]} scale={1.2} />}
        </group>
      ))}
      <Avatar config={useGame.getState().avatar} idleWave />
      <group ref={crystals} position-y={4.2}>
        {CRYSTALS.map((c, i) => {
          const a = (i / CRYSTALS.length) * Math.PI * 2;
          return (
            <mesh key={c.id} position={[Math.cos(a) * 3.4, Math.sin(a * 2) * 0.4, Math.sin(a) * 3.4]} scale={[0.35, 0.6, 0.35]}>
              <octahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={0.9} flatShading />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function MenuBackground({ focus = 0 }: { focus?: number }) {
  return (
    <div className="fixed inset-0">
      <Canvas camera={{ fov: 50, position: [0, 5, 15] }} dpr={[1, 1.5]}>
        <MenuScene focus={focus} />
      </Canvas>
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-indigo-950/30" />
    </div>
  );
}

function Logo() {
  return (
    <div className="text-center">
      <div className="mb-1 flex items-center justify-center gap-2 text-3xl animate-floaty [@media(max-height:520px)]:hidden" aria-hidden>🎵 🎼 🎶</div>
      <h1 className="bg-gradient-to-b from-yellow-100 via-amber-300 to-orange-400 bg-clip-text font-display text-6xl font-extrabold leading-none tracking-tight text-transparent drop-shadow-[0_6px_0_rgba(76,29,149,.8)] sm:text-8xl [@media(max-height:520px)]:text-5xl">
        KEMBARA MUZIKA
      </h1>
      <p className="mt-2 font-display text-lg font-bold tracking-[0.2em] text-violet-100 sm:text-xl [@media(max-height:520px)]:mt-1 [@media(max-height:520px)]:text-sm">PENGEMBARAAN MUZIK SECARA DIGITAL</p>
    </div>
  );
}

// ===================== MENU UTAMA =====================
export function MainMenu() {
  const g = useGame();
  const ui = useUI();
  const [started, setStarted] = useState(false);
  const lv = levelInfo(g.xp);
  const daily = g.daily.date === todayKey() && g.daily.done;

  const begin = () => {
    initAudio();
    startMusic('menu');
    setStarted(true);
    // peranti sentuh: masuk skrin penuh seperti permainan mudah alih
    if (window.matchMedia('(pointer: coarse)').matches && !isStandalone() && !isEmbedded() && !document.fullscreenElement) void toggleFullscreen();
  };

  if (!started) {
    return (
      <div className="relative h-full w-full">
        <MenuBackground />
        <button onClick={begin} className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-4" aria-label="Mula">
          <Logo />
          <span className="animate-pulse rounded-full border border-white/40 bg-white/15 px-6 py-3 font-display text-xl font-bold text-white backdrop-blur">
            Mulakan Misi ▸
          </span>
          <Copyright className="absolute bottom-4 left-0 right-0" />
        </button>
      </div>
    );
  }

  const item = (label: string, icon: React.ReactNode, run: () => void, disabled = false) => (
    <GlowButton variant="secondary" onClick={run} disabled={disabled} className="justify-start text-base sm:text-lg">{icon}{label}</GlowButton>
  );

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <MenuBackground />
      <div className="relative z-10 mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center gap-6 px-4 py-8 [@media(max-height:520px)]:gap-3 [@media(max-height:520px)]:py-4">
        <Logo />
        <div className="grid w-full max-w-3xl gap-4 md:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-3 rounded-3xl border border-white/20 bg-indigo-950/45 p-4 backdrop-blur-md">
            {g.hasSave ? (
              <>
                <GlowButton onClick={() => { sfx('portal'); ui.setScreen('game'); }} className="py-4 text-xl"><Play size={24} />Sambung Pengembaraan</GlowButton>
                <GlowButton variant="secondary" onClick={() => ui.setScreen('intro')}><Compass size={20} />Permainan Baharu</GlowButton>
              </>
            ) : (
              <GlowButton onClick={() => ui.setScreen('intro')} className="py-4 text-xl"><Play size={24} />Main Permainan</GlowButton>
            )}
            {g.hasSave && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl font-display text-2xl font-extrabold" style={{ background: `linear-gradient(135deg, ${g.avatar.body}, ${g.avatar.accent})` }}>{lv.level}</div>
                <div className="flex-1 text-sm">
                  <div className="font-bold">{g.avatar.name}</div>
                  <div className="text-white/75">Tahap {lv.level} · {g.coins} syiling · {g.crystals.length}/7 kristal</div>
                </div>
              </div>
            )}
            <GlowButton variant="secondary" disabled={!g.hasSave} onClick={() => startDailyFromMenu()}><CalendarCheck size={20} />{daily ? 'Cabaran Harian ✓' : 'Cabaran Harian'}</GlowButton>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-3xl border border-white/20 bg-indigo-950/45 p-4 backdrop-blur-md">
            {item('Pilih Dunia', <Map size={18} />, () => ui.setPanel('worlds'), !g.hasSave)}
            {item('Avatar Saya', <User size={18} />, () => ui.setPanel('avatar'), !g.hasSave)}
            {item('Log Quest', <ScrollText size={18} />, () => ui.setPanel('quests'))}
            {item('Buku Teori', <BookOpen size={18} />, () => ui.setPanel('book'))}
            {item('Pencapaian', <Award size={18} />, () => ui.setPanel('achievements'))}
            {item('Kemajuan', <BarChart3 size={18} />, () => ui.setPanel('progress'))}
            {item('Tetapan', <Settings size={18} />, () => ui.setPanel('settings'))}
            {item('Skor Saya', <Trophy size={18} />, () => ui.setPanel('score'))}
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <InstallButton className="flex items-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-4 py-2.5 font-display font-bold text-white backdrop-blur hover:bg-white/25" />
          <FullscreenButton label className="flex items-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-4 py-2.5 font-display font-bold text-white backdrop-blur hover:bg-white/25" />
        </div>
        <DeviceStorageNotice className="max-w-3xl" />
        <p className="max-w-xl text-center text-xs text-white/60">
          Permainan pembelajaran teori muzik untuk murid Tingkatan 1 Sekolah Seni Malaysia. Kandungan ialah cadangan dan boleh disesuaikan oleh guru.
        </p>
        <Copyright />
      </div>
    </div>
  );
}

function startDailyFromMenu() {
  useUI.getState().setScreen('game');
  setTimeout(() => startDaily(), 400);
}

// ===================== PENGENALAN SINEMATIK =====================
const SLIDES = [
  { title: 'KEMBARA MUZIKA', text: 'Selamat datang ke Dunia Muzik — sebuah alam terapung yang hidup dengan melodi dan irama.' },
  { title: 'Harmoni Telah Hilang!', text: 'Tujuh Kristal Muzik yang menjaga keharmonian dunia telah bertaburan ke merata pulau. Lagu-lagu mula senyap…' },
  { title: 'Misi Kamu', text: 'Sebagai Penjelajah Muzik, terokai lima wilayah, selesaikan teka-teki teori muzik dan kembalikan ketujuh-tujuh kristal!' },
];

export function IntroScreen() {
  const ui = useUI();
  const g = useGame();
  const [i, setI] = useState(0);
  const [stage, setStage] = useState<'slides' | 'avatar'>('slides');

  useEffect(() => {
    if (stage !== 'slides') return;
    const t = setTimeout(() => (i < SLIDES.length - 1 ? setI(i + 1) : setStage('avatar')), 5200);
    return () => clearTimeout(t);
  }, [i, stage]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && stage === 'slides') setStage('avatar'); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [stage]);

  if (stage === 'avatar') {
    return (
      <div className="relative h-full w-full overflow-y-auto">
        <MenuBackground focus={1} />
        <div className="relative z-10 mx-auto flex min-h-full max-w-4xl flex-col justify-center px-4 py-6">
          <div className="rounded-3xl border border-white/20 bg-indigo-950/70 p-4 text-white backdrop-blur-md sm:p-6 animate-pop">
            <h2 className="font-display text-3xl font-extrabold">Cipta Penjelajah Muzik</h2>
            <p className="mb-2 text-white/80">Pilih rupa watak kamu. Kamu boleh mengubahnya kemudian.</p>
            <DeviceStorageNotice compact className="mb-4" />
            <AvatarEditor
              initial={g.hasSave ? g.avatar : DEFAULT_AVATAR}
              confirmLabel="Mula Pengembaraan!"
              onConfirm={(a) => { g.newGame(a); sfx('portal'); ui.setScreen('game'); }}
            />
          </div>
        </div>
      </div>
    );
  }

  const s = SLIDES[i];
  return (
    <div className="relative h-full w-full">
      <MenuBackground focus={i / 2} />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div key={i} className="max-w-2xl animate-fadeup">
          <h2 className="bg-gradient-to-b from-yellow-100 to-amber-400 bg-clip-text font-display text-5xl font-extrabold text-transparent drop-shadow-[0_4px_0_rgba(76,29,149,.8)] sm:text-7xl">{s.title}</h2>
          <p className="mt-4 text-xl font-semibold leading-relaxed text-white drop-shadow-lg sm:text-2xl">{s.text}</p>
        </div>
        <div className="mt-8 flex gap-2">
          {SLIDES.map((_, k) => <span key={k} className={`h-2 rounded-full transition-all ${k === i ? 'w-8 bg-amber-300' : 'w-2 bg-white/40'}`} />)}
        </div>
      </div>
      <Copyright className="absolute bottom-2 left-0 right-0" />
      <div className="absolute bottom-6 right-6 flex gap-2">
        <GlowButton variant="secondary" onClick={() => (i < SLIDES.length - 1 ? setI(i + 1) : setStage('avatar'))}>Seterusnya ▸</GlowButton>
        <GlowButton variant="ghost" onClick={() => setStage('avatar')}><SkipForward size={18} />Langkau</GlowButton>
      </div>
    </div>
  );
}
