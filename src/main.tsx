import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/noto-music/400.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/baloo-2/latin-500.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import { initPwa } from './utils/pwa';
import './styles/index.css';
import App from './App';
import { useGame } from './store/gameStore';
import { useUI } from './store/uiStore';
import { playerPos, teleportReq } from './game/playerState';
import { input } from './hooks/input';
import * as questions from './questions';

// Cangkuk penyahpepijat untuk ujian automatik (mod pembangunan sahaja)
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__gm = { useGame, useUI, playerPos, teleportReq, input, questions };
}

initPwa();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
