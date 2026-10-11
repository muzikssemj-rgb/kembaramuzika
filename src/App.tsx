import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { useGame } from './store/gameStore';
import { useUI } from './store/uiStore';
import { MainMenu, IntroScreen } from './components/MainMenu';
import { PanelHost } from './components/Panels';
import { Toasts, CelebrationOverlay, TransitionOverlay, MobileControls } from './components/Overlays';
import { HUD } from './components/HUD';
import { DialoguePanel } from './components/DialoguePanel';
import { ChallengeModal } from './challenges/ChallengeModal';
import { clearInput, onKeyDown, onKeyUp } from './hooks/input';
import { initAudio, setVolumes, startMusic } from './audio/audioEngine';
import { ensureMusicFont } from './utils/canvasTextures';

const GameCanvas = lazy(() => import('./game/GameCanvas').then((m) => ({ default: m.GameCanvas })));

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('[GamarMuzika]', error); }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center bg-indigo-950 p-6 text-center text-white">
          <div className="max-w-md">
            <div className="text-5xl">🎻💥</div>
            <h1 className="mt-3 font-display text-3xl font-bold">Alamak! Berlaku ralat.</h1>
            <p className="mt-2 text-white/80">Kemajuan kamu selamat disimpan. Cuba muat semula halaman.</p>
            <pre className="mt-3 max-h-32 overflow-auto rounded-xl bg-black/40 p-2 text-left text-xs text-rose-200">{this.state.error.message}</pre>
            <button onClick={() => location.reload()} className="mt-4 rounded-2xl bg-amber-300 px-6 py-3 font-display font-bold text-amber-950">Muat Semula</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function Loading({ text = 'Memuatkan dunia muzik…' }: { text?: string }) {
  return (
    <div className="absolute inset-0 z-[65] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-900 text-white">
      <div className="flex gap-2 text-4xl" aria-hidden>
        {['🎵', '🎶', '🎼'].map((n, i) => <span key={n} className="animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>{n}</span>)}
      </div>
      <p className="mt-4 font-display text-xl font-bold" role="status">{text}</p>
    </div>
  );
}

function GameScreen() {
  const world = useGame((s) => s.world);
  useEffect(() => { initAudio(); startMusic(world); }, [world]);
  useEffect(() => () => clearInput(), []);
  return (
    <div className="relative h-full w-full">
      <Suspense fallback={<Loading />}>
        <GameCanvas />
      </Suspense>
      <HUD />
      <MobileControls />
      <DialoguePanel />
      <ChallengeModal />
    </div>
  );
}

export default function App() {
  const screen = useUI((s) => s.screen);
  const settings = useGame((s) => s.settings);
  const [webgl] = useState(hasWebGL);

  useEffect(() => { setVolumes(settings.musicVol, settings.sfxVol, settings.muted); }, [settings.musicVol, settings.sfxVol, settings.muted]);
  useEffect(() => { void ensureMusicFont(); }, []);

  // papan kekunci global
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const ui = useUI.getState();
      if (ui.screen !== 'game') return;
      if (e.code === 'Escape') {
        if (ui.challenge) return; // modal cabaran mengurus Esc sendiri melalui butang tutup
        if (ui.dialogueNpc) { ui.openDialogue(null); return; }
        if (ui.celebration) return;
        ui.setPanel(ui.panel ? null : 'pause');
        clearInput();
        return;
      }
      const blocked = ui.panel || ui.dialogueNpc || ui.challenge || ui.celebration;
      if (!blocked) {
        if (e.code === 'KeyQ') { ui.setPanel('quests'); clearInput(); return; }
        if (e.code === 'KeyB') { ui.setPanel('book'); clearInput(); return; }
        if (e.code === 'KeyM') { ui.setPanel('worlds'); clearInput(); return; }
        if (e.code === 'KeyH') { ui.setPanel('help'); clearInput(); return; }
        if (e.code === 'KeyK') { ui.setPanel('score'); clearInput(); return; }
        if (onKeyDown(e)) e.preventDefault();
      } else if (e.code === 'KeyE' && ui.dialogueNpc) {
        // E menutup dialog hanya jika tiada tindakan; biarkan butang mengendalikan
      }
    };
    const up = (e: KeyboardEvent) => onKeyUp(e);
    const blur = () => clearInput();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);

  if (!webgl) {
    return (
      <div className="flex h-full items-center justify-center bg-indigo-950 p-6 text-center text-white">
        <div className="max-w-md">
          <h1 className="font-display text-3xl font-bold">WebGL tidak disokong</h1>
          <p className="mt-2 text-white/80">Permainan 3D ini memerlukan pelayar yang menyokong WebGL (contohnya Chrome, Edge, Firefox atau Safari versi terkini). Sila aktifkan pecutan perkakasan atau guna peranti lain.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative h-full w-full overflow-hidden bg-indigo-950 font-body text-white">
        {screen === 'menu' && <MainMenu />}
        {screen === 'intro' && <IntroScreen />}
        {screen === 'game' && <GameScreen />}
        <PanelHost />
        <CelebrationOverlay />
        <TransitionOverlay />
        <Toasts />
      </div>
    </ErrorBoundary>
  );
}
