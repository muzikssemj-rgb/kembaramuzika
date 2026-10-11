import { useState } from 'react';
import { Download, Maximize, Minimize, Share, ShieldCheck, SquarePlus, X } from 'lucide-react';
import { fullscreenSupported, isEmbedded, isIOS, promptInstall, toggleFullscreen, usePwa } from '../utils/pwa';
import { sfx } from '../audio/audioEngine';

/** Notis privasi: data hanya dalam peranti */
export function DeviceStorageNotice({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={`flex items-start gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-left text-emerald-50 ${className}`} role="note">
      <ShieldCheck size={compact ? 16 : 18} className="mt-0.5 shrink-0 text-emerald-300" />
      <p className={compact ? 'text-xs' : 'text-sm'}>
        <b>Mod Peranti:</b> Semua data dan skor disimpan <b>dalam peranti ini sahaja</b>. Tiada simpanan di cloud.
        {!compact && ' Jika data pelayar dipadam atau peranti ditukar, kemajuan akan bermula semula — simpan PDF skor untuk dihantar kepada guru.'}
      </p>
    </div>
  );
}

export function FullscreenButton({ className = '', label = false }: { className?: string; label?: boolean }) {
  const fs = usePwa((s) => s.fullscreen);
  if (!fullscreenSupported()) return null;
  return (
    <button
      onClick={() => { sfx('click'); void toggleFullscreen(); }}
      className={className}
      aria-label={fs ? 'Keluar skrin penuh' : 'Skrin penuh'}
      title={fs ? 'Keluar skrin penuh' : 'Skrin penuh'}
    >
      {fs ? <Minimize size={20} /> : <Maximize size={20} />}
      {label && <span>{fs ? 'Keluar Skrin Penuh' : 'Skrin Penuh'}</span>}
    </button>
  );
}

/** Butang "Pasang Aplikasi" — Android/Chrome guna dialog pemasangan; iPhone/iPad tunjuk panduan. */
export function InstallButton({ className = '' }: { className?: string }) {
  const { canPrompt, installed } = usePwa();
  const [help, setHelp] = useState(false);
  if (installed || isEmbedded()) return null;
  const ios = isIOS();
  if (!canPrompt && !ios) return null;
  return (
    <>
      <button
        className={className}
        onClick={async () => {
          sfx('click');
          if (!(await promptInstall())) setHelp(true);
        }}
      >
        <Download size={20} /> <span>Pasang Aplikasi</span>
      </button>
      {help && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Cara memasang aplikasi">
          <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-indigo-950 p-5 text-white shadow-2xl animate-pop">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Pasang di iPhone / iPad</h3>
              <button onClick={() => setHelp(false)} className="rounded-full bg-white/15 p-1.5" aria-label="Tutup"><X size={18} /></button>
            </div>
            <ol className="mt-3 space-y-3 text-sm">
              <li className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-300 font-bold text-amber-950">1</span>Buka halaman ini dalam <b>Safari</b>.</li>
              <li className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-300 font-bold text-amber-950">2</span>Ketik butang <Share size={16} className="inline" /> <b>Kongsi</b>.</li>
              <li className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-300 font-bold text-amber-950">3</span>Pilih <SquarePlus size={16} className="inline" /> <b>Tambah ke Skrin Utama</b>.</li>
            </ol>
            <p className="mt-3 text-xs text-white/70">Ikon Kembara Muzika akan muncul di skrin utama dan permainan dibuka dalam skrin penuh.</p>
          </div>
        </div>
      )}
    </>
  );
}
