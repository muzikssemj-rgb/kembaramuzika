import { useMemo, useState } from 'react';
import { FileDown, Trophy } from 'lucide-react';
import { Bar, Copyright, GlowButton, PanelShell } from './ui';
import { useGame } from '../store/gameStore';
import { buildScorePdf, computeScore, saveFile } from '../utils/scoreReport';
import { TOPICS } from '../questions';
import { DeviceStorageNotice } from './AppControls';

/** Ruangan skor: murid isi nama, lihat skor dan simpan PDF untuk dihantar kepada guru. */
export function ScorePanel({ onClose }: { onClose: () => void }) {
  const g = useGame();
  const sc = useMemo(() => computeScore(g), [g]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const missing = !g.student.nama.trim() || !g.student.kelas.trim();

  const save = async () => {
    if (missing) { setMsg({ ok: false, text: 'Sila isi Nama Murid dan Kelas dahulu.' }); return; }
    setBusy(true);
    setMsg(null);
    try {
      const { blob, filename } = buildScorePdf(useGame.getState());
      const r = await saveFile(blob, filename);
      setMsg(r === 'saved'
        ? { ok: true, text: `PDF disimpan: ${filename}. Hantar fail ini kepada guru kamu.` }
        : r === 'declined' ? { ok: false, text: 'Simpanan dibatalkan. Tekan butang sekali lagi untuk cuba semula.' }
          : { ok: false, text: 'PDF tidak dapat disimpan di paparan ini. Cuba buka permainan dalam pelayar lain.' });
    } catch (e) {
      setMsg({ ok: false, text: `Ralat semasa menjana PDF: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const field = (id: keyof typeof g.student, label: string, placeholder: string, required = false) => (
    <label className="block" htmlFor={`murid-${id}`}>
      <span className="mb-1 block text-sm font-bold text-white/85">{label}{required && <span className="text-amber-300"> *</span>}</span>
      <input
        id={`murid-${id}`}
        value={g.student[id]}
        maxLength={60}
        onChange={(e) => g.setStudent({ [id]: e.target.value })}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 font-semibold text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-amber-300"
      />
    </label>
  );

  const tile = (label: string, value: string, sub: string, hi = false) => (
    <div className={`rounded-2xl border p-3 ${hi ? 'border-amber-300/60 bg-amber-300/15' : 'border-white/15 bg-white/5'}`}>
      <div className="text-xs text-white/70">{label}</div>
      <div className="font-display text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-white/60">{sub}</div>
    </div>
  );

  return (
    <PanelShell title="Skor Saya" icon={<Trophy />} onClose={onClose} wide>
      <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-lg font-bold text-amber-200">Maklumat Murid</h3>
          {field('nama', 'Nama Murid', 'Nama penuh', true)}
          {field('kelas', 'Kelas', 'cth. 1 Seni Muzik', true)}
          {field('sekolah', 'Sekolah', 'Nama sekolah')}
          {field('guru', 'Nama Guru', 'Nama guru muzik')}
          <GlowButton onClick={save} disabled={busy} className="mt-1"><FileDown size={20} />{busy ? 'Menjana PDF…' : 'Simpan Skor (PDF)'}</GlowButton>
          {msg && <p role="status" className={`rounded-xl px-3 py-2 text-sm font-semibold ${msg.ok ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>{msg.text}</p>}
          <DeviceStorageNotice compact />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-lg font-bold text-amber-200">Ringkasan Skor</h3>
          <div className="grid grid-cols-2 gap-2">
            {tile('Ujian Penguasaan Akhir', sc.finalAttempts ? `${sc.finalBest}/10` : '—', sc.finalAttempts ? (sc.finalPassed ? 'LULUS' : 'Belum lulus') : 'Belum dicuba', true)}
            {tile('Ketepatan Keseluruhan', sc.accuracy === null ? '—' : `${Math.round(sc.accuracy * 100)}%`, `${sc.firstCorrect}/${sc.attempted} betul pada cubaan pertama`)}
            {tile('Tahap', String(sc.level), `${sc.xp} XP · ${sc.coins} syiling`)}
            {tile('Kristal & Quest', `${sc.crystals}/7`, `${sc.questsDone}/${sc.questsTotal} quest selesai`)}
          </div>
          <div className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-3">
            {sc.topics.map((t) => (
              <div key={t.id}>
                <div className="flex justify-between text-xs"><span className="font-bold">{t.name}</span><span className="text-white/70">{t.accuracy === null ? 'Belum dicuba' : `${Math.round(t.accuracy * 100)}%`} · {t.mastered}/{t.total}</span></div>
                <Bar value={t.total ? t.mastered / t.total : 0} color={TOPICS.find((x) => x.id === t.id)!.color} label={t.name} />
              </div>
            ))}
          </div>
          <p className="text-xs text-white/60">Lencana: {sc.badges.length ? sc.badges.join(', ') : 'belum ada'}</p>
        </div>
      </div>
      <Copyright className="mt-4" />
    </PanelShell>
  );
}
