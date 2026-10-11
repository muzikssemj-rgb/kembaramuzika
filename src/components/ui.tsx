import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { sfx } from '../audio/audioEngine';

export const COPYRIGHT = 'Copyright © dzurrihensem';
export function Copyright({ className = '' }: { className?: string }) {
  return <p className={`text-center text-xs font-semibold text-white/70 ${className}`}>{COPYRIGHT}</p>;
}

export function PanelShell({ title, icon, onClose, children, wide }: { title: string; icon?: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`flex max-h-[94vh] w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} flex-col overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-indigo-900/95 to-violet-950/95 text-white shadow-2xl animate-pop`}>
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-5 py-3">
          <span className="text-amber-300">{icon}</span>
          <h2 className="flex-1 font-display text-2xl font-bold">{title}</h2>
          <button onClick={() => { sfx('click'); onClose(); }} className="rounded-full bg-white/15 p-2 hover:bg-white/25" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function Bar({ value, color = '#a78bfa', label }: { value: number; color?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function GlowButton({ children, onClick, variant = 'primary', disabled, className = '', ariaLabel }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean; className?: string; ariaLabel?: string;
}) {
  const styles = {
    primary: 'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-amber-950 shadow-[0_8px_30px_rgba(251,191,36,.45)]',
    secondary: 'bg-white/15 text-white border border-white/25 hover:bg-white/25',
    ghost: 'text-white/80 hover:text-white hover:bg-white/10',
  }[variant];
  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      onMouseEnter={() => sfx('hover')}
      onClick={() => { sfx('click'); onClick?.(); }}
      className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-display text-lg font-bold transition hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
