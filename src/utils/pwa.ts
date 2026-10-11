import { create } from 'zustand';

/** Keadaan pemasangan aplikasi (PWA) dan skrin penuh */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  canPrompt: boolean;
  installed: boolean;
  fullscreen: boolean;
}

let deferred: BeforeInstallPromptEvent | null = null;

export const usePwa = create<PwaState>()(() => ({ canPrompt: false, installed: false, fullscreen: false }));

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.matchMedia?.('(display-mode: fullscreen)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

export const isEmbedded = () => {
  try { return window.self !== window.top; } catch { return true; }
};

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const fullscreenSupported = () => !!document.documentElement.requestFullscreen && document.fullscreenEnabled !== false;

export function initPwa() {
  usePwa.setState({ installed: isStandalone() });
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    usePwa.setState({ canPrompt: true });
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    usePwa.setState({ canPrompt: false, installed: true });
  });
  document.addEventListener('fullscreenchange', () => usePwa.setState({ fullscreen: !!document.fullscreenElement }));
}

/** Papar dialog pasang (Android / Chrome / Edge). Pulangkan false jika tidak tersedia. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  usePwa.setState({ canPrompt: false, installed: outcome === 'accepted' || usePwa.getState().installed });
  return true;
}

export async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      // cuba kunci orientasi landskap pada telefon (diabaikan jika tidak disokong)
      try {
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        if (window.matchMedia('(pointer: coarse)').matches) await o.lock?.('landscape');
      } catch { /* abaikan */ }
    }
  } catch { /* pelayar menolak — abaikan */ }
}
