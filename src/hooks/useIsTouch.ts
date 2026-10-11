import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';

/** Kawalan sentuh: ikut tetapan (auto = kesan peranti sentuh) */
export function useIsTouch() {
  const pref = useGame((s) => s.settings.touchControls);
  const [coarse, setCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(pointer: coarse)');
    if (!mq) return;
    const h = () => setCoarse(mq.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);
  return pref === 'on' ? true : pref === 'off' ? false : !!coarse;
}
