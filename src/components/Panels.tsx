import { useState } from 'react';
import { Award, BarChart3, BookOpen, CalendarCheck, CheckCircle2, Circle, Gamepad2, Home, Keyboard, Lock, Map, Pause, Play, RotateCcw, ScrollText, Settings as SettingsIcon, User, FileText } from 'lucide-react';
import { Bar, GlowButton, PanelShell } from './ui';
import { useGame, levelInfo, todayKey } from '../store/gameStore';
import { useUI } from '../store/uiStore';
import { BADGES, CRYSTALS, QUESTS, QUEST_BY_ID } from '../quests/questData';
import { WORLDS, WORLD_ORDER, NPCS } from '../worlds/worldData';
import { TOPICS, allQuestions, pickQuestions } from '../questions';
import { travelTo } from '../game/interactions';
import { AvatarEditor } from './AvatarEditor';
import { TheoryBook } from './TheoryBook';
import { ScorePanel } from './ScorePanel';
import { DeviceStorageNotice, FullscreenButton } from './AppControls';

import { Copyright } from './ui';
import { sfx, stopMusic } from '../audio/audioEngine';
import type { TopicId } from '../types';

export function PanelHost() {
  const panel = useUI((s) => s.panel);
  const close = () => useUI.getState().setPanel(null);
  switch (panel) {
    case 'pause': return <PauseMenu onClose={close} />;
    case 'quests': return <QuestLog onClose={close} />;
    case 'book': return <TheoryBook onClose={close} />;
    case 'achievements': return <Achievements onClose={close} />;
    case 'progress': return <ProgressDashboard onClose={close} />;
    case 'settings': return <SettingsPanel onClose={close} />;
    case 'worlds': return <WorldSelect onClose={close} />;
    case 'help': return <HelpPanel onClose={close} />;
    case 'avatar': return <AvatarPanel onClose={close} />;
    case 'score': return <ScorePanel onClose={close} />;
    default: return null;
  }
}

function PauseMenu({ onClose }: { onClose: () => void }) {
  const ui = useUI();
  const g = useGame();
  const daily = g.daily.date === todayKey() && g.daily.done;
  const item = (label: string, icon: React.ReactNode, run: () => void) => (
    <GlowButton variant="secondary" onClick={run} className="w-full justify-start">{icon}{label}</GlowButton>
  );
  return (
    <PanelShell title="Permainan Dijeda" icon={<Pause />} onClose={onClose}>
      <div className="grid gap-2 sm:grid-cols-2">
        <GlowButton onClick={onClose} className="sm:col-span-2"><Play size={20} />Sambung Permainan</GlowButton>
        {item('Log Quest', <ScrollText size={20} />, () => ui.setPanel('quests'))}
        {item('Buku Teori Muzik', <BookOpen size={20} />, () => ui.setPanel('book'))}
        {item('Peta Dunia', <Map size={20} />, () => ui.setPanel('worlds'))}
        {item('Kemajuan Pembelajaran', <BarChart3 size={20} />, () => ui.setPanel('progress'))}
        {item('Pencapaian', <Award size={20} />, () => ui.setPanel('achievements'))}
        {item('Avatar Saya', <User size={20} />, () => ui.setPanel('avatar'))}
        {item(daily ? 'Cabaran Harian ✓' : 'Cabaran Harian', <CalendarCheck size={20} />, () => startDaily())}
        {item('Tetapan', <SettingsIcon size={20} />, () => ui.setPanel('settings'))}
        {item('Skor Saya (PDF)', <FileText size={20} />, () => ui.setPanel('score'))}
        {item('Kawalan', <Keyboard size={20} />, () => ui.setPanel('help'))}
        {item('Kembali ke Titik Mula', <RotateCcw size={20} />, () => { ui.respawn(); onClose(); })}
        <FullscreenButton label className="flex w-full items-center justify-start gap-2 rounded-2xl border border-white/25 bg-white/15 px-5 py-3 font-display text-lg font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/25" />
        {item('Menu Utama', <Home size={20} />, () => { stopMusic(); ui.setScreen('menu'); })}
      </div>
      <DeviceStorageNotice compact className="mt-4" />
      <Copyright className="mt-1" />
    </PanelShell>
  );
}

export function startDaily() {
  const g = useGame.getState();
  const topics: TopicId[] = ['notasi'];
  for (const w of WORLD_ORDER) if (g.isWorldUnlocked(w)) topics.push(...WORLDS[w].topics);
  const mastered = new Set(Object.entries(g.qlog).filter(([, v]) => v.mastered).map(([k]) => k));
  sfx('open');
  useUI.getState().setPanel(null);
  useUI.getState().startChallenge({
    mode: 'daily',
    title: g.daily.date === todayKey() && g.daily.done ? 'Cabaran Harian (latihan tambahan)' : 'Cabaran Harian',
    questions: pickQuestions([...new Set(topics)], 5, mastered),
  });
}

function QuestLog({ onClose }: { onClose: () => void }) {
  const g = useGame();
  return (
    <PanelShell title="Log Quest" icon={<ScrollText />} onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-white/80">Kristal Muzik:</span>
        {CRYSTALS.map((c) => (
          <span key={c.id} title={c.name} className={`rounded-full px-2.5 py-1 text-xs font-bold ${g.crystals.includes(c.id) ? 'text-slate-900' : 'bg-white/10 text-white/50'}`} style={g.crystals.includes(c.id) ? { background: c.color } : undefined}>
            {g.crystals.includes(c.id) ? '◆' : '◇'} {c.name}
          </span>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {QUESTS.map((q) => {
          const st = g.quests[q.id];
          const avail = g.questAvailable(q.id);
          const status = st?.status === 'done' ? 'Selesai' : st ? 'Aktif' : avail ? 'Tersedia' : 'Terkunci';
          return (
            <div key={q.id} className={`rounded-2xl border p-4 ${st?.status === 'done' ? 'border-emerald-300/40 bg-emerald-500/10' : st ? 'border-amber-300/60 bg-amber-400/10' : 'border-white/15 bg-white/5'}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-xs text-white/60">{WORLDS[q.world].name} · {NPCS[q.giver].name}</div>
                  <div className="font-display text-lg font-bold">{q.title}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${status === 'Selesai' ? 'bg-emerald-400 text-emerald-950' : status === 'Aktif' ? 'bg-amber-300 text-amber-950' : status === 'Tersedia' ? 'bg-sky-300 text-sky-950' : 'bg-white/15 text-white/70'}`}>{status}</span>
              </div>
              {(st || avail) && (
                <ul className="mt-2 space-y-1 text-sm">
                  {q.steps.map((s, i) => {
                    const done = st?.status === 'done' || (st && i < st.step);
                    const cur = st?.status === 'active' && i === st.step;
                    return (
                      <li key={i} className={`flex items-start gap-1.5 ${done ? 'text-emerald-200 line-through decoration-emerald-300/60' : cur ? 'font-bold text-amber-200' : 'text-white/70'}`}>
                        {done ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <Circle size={15} className="mt-0.5 shrink-0" />}
                        <span>{s.text}{cur && s.type === 'collect' ? ` (${st.progress.length}/${s.count})` : ''}{cur && s.type === 'interact' && s.objects.length > 1 ? ` (${st.progress.length}/${s.objects.length})` : ''}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!st && !avail && <p className="mt-1 text-sm text-white/60">Selesaikan: {q.requires.map((r) => QUEST_BY_ID[r].title).join(', ')}</p>}
              <div className="mt-2 text-xs text-amber-200">Ganjaran: {q.reward.xp} XP · {q.reward.coins} syiling{q.reward.badge ? ` · Lencana ${BADGES.find((b) => b.id === q.reward.badge)?.name}` : ''}</div>
            </div>
          );
        })}
        <div className={`rounded-2xl border p-4 ${g.final.passed ? 'border-emerald-300/40 bg-emerald-500/10' : 'border-rose-300/40 bg-rose-500/10'}`}>
          <div className="text-xs text-white/60">Kuil Triad · Penjaga Harmoni</div>
          <div className="font-display text-lg font-bold">Ujian Penguasaan Akhir</div>
          <p className="mt-1 text-sm text-white/80">10 soalan daripada semua topik. Lulus 70% untuk memulihkan Kristal Harmoni Agung.</p>
          <p className="mt-1 text-sm">Markah terbaik: <b>{g.final.best}/10</b> · Cubaan: {g.final.attempts}</p>
        </div>
      </div>
    </PanelShell>
  );
}

function Achievements({ onClose }: { onClose: () => void }) {
  const g = useGame();
  return (
    <PanelShell title="Pencapaian" icon={<Award />} onClose={onClose} wide>
      <p className="mb-3 text-white/80">Lencana dibuka: <b>{g.badges.length}/{BADGES.length}</b></p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {BADGES.map((b) => {
          const has = g.badges.includes(b.id);
          return (
            <div key={b.id} className={`flex flex-col items-center rounded-2xl border p-3 text-center transition ${has ? 'border-amber-300/60 bg-gradient-to-b from-amber-400/25 to-transparent' : 'border-white/10 bg-white/5 opacity-60'}`}>
              <div className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl ${has ? 'bg-amber-300/30 shadow-[0_0_25px_rgba(251,191,36,.4)]' : 'bg-white/10 grayscale'}`}>{has ? b.icon : <Lock size={24} />}</div>
              <div className="mt-2 font-display font-bold leading-tight">{b.name}</div>
              <div className="mt-1 text-xs text-white/70">{b.desc}</div>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}

export function ProgressDashboard({ onClose }: { onClose: () => void }) {
  const g = useGame();
  const lv = levelInfo(g.xp);
  const totals = Object.values(g.stats).reduce((a, s) => ({ attempted: a.attempted + s.attempted, first: a.first + s.correctFirst }), { attempted: 0, first: 0 });
  const acc = totals.attempted ? totals.first / totals.attempted : 0;
  const questsDone = QUESTS.filter((q) => g.quests[q.id]?.status === 'done').length;
  const worldsOpen = WORLD_ORDER.filter((w) => g.isWorldUnlocked(w)).length;
  const coinsTotal = WORLD_ORDER.reduce((a, w) => a + WORLDS[w].objects.filter((o) => o.kind === 'coin').length, 0);
  const coinsGot = g.collected.filter((c) => c.includes('-coin')).length;
  const mastered = (t: TopicId) => {
    const ids = allQuestions().filter((q) => q.topic === t).map((q) => q.id);
    return { got: ids.filter((id) => g.qlog[id]?.mastered).length, total: ids.length };
  };
  const stat = (label: string, value: string, sub?: string) => (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
      <div className="text-xs text-white/70">{label}</div>
      <div className="font-display text-2xl font-extrabold">{value}</div>
      {sub && <div className="text-xs text-white/60">{sub}</div>}
    </div>
  );
  return (
    <PanelShell title="Kemajuan Pembelajaran" icon={<BarChart3 />} onClose={onClose} wide>
      <h3 className="mb-2 font-display text-lg font-bold text-amber-200">Penguasaan Teori (berdasarkan jawapan)</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {stat('Soalan dicuba', String(totals.attempted))}
        {stat('Betul cubaan pertama', String(totals.first))}
        {stat('Ketepatan', totals.attempted ? `${Math.round(acc * 100)}%` : '—', 'betul pada cubaan pertama')}
        {stat('Ujian akhir terbaik', g.final.attempts ? `${g.final.best}/10` : '—', g.final.passed ? 'LULUS' : 'belum lulus')}
      </div>
      <div className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
        {TOPICS.map((t) => {
          const s = g.stats[t.id];
          const m = mastered(t.id);
          const a = s.attempted ? s.correctFirst / s.attempted : 0;
          return (
            <div key={t.id}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className="font-bold">{t.name}</span>
                <span className="text-white/70">
                  {s.attempted ? `Ketepatan ${Math.round(a * 100)}% (${s.correctFirst}/${s.attempted})` : 'Belum dicuba'} · Dikuasai {m.got}/{m.total} soalan
                </span>
              </div>
              <Bar value={m.total ? m.got / m.total : 0} color={t.color} label={`Penguasaan ${t.name}`} />
            </div>
          );
        })}
        <p className="text-xs text-white/60">Soalan "dikuasai" = pernah dijawab betul pada cubaan pertama. Ketepatan dikira daripada cubaan pertama sahaja.</p>
      </div>
      <h3 className="mb-2 mt-5 font-display text-lg font-bold text-sky-200">Penerokaan Permainan</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {stat('Tahap', String(lv.level), `${g.xp} XP keseluruhan`)}
        {stat('Quest selesai', `${questsDone}/${QUESTS.length}`)}
        {stat('Dunia dibuka', `${worldsOpen}/5`)}
        {stat('Kristal', `${g.crystals.length}/7`)}
        {stat('Lencana', `${g.badges.length}/${BADGES.length}`)}
        {stat('Simbol muzik dikutip', `${coinsGot}/${coinsTotal}`)}
        {stat('Syiling Muzik', String(g.coins))}
        {stat('Cabaran Harian', g.daily.date === todayKey() && g.daily.done ? 'Selesai hari ini' : 'Belum')}
      </div>
    </PanelShell>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const g = useGame();
  const s = g.settings;
  const [confirm, setConfirm] = useState(false);
  const row = (label: string, child: React.ReactNode) => (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 py-3">
      <span className="font-semibold">{label}</span>
      {child}
    </div>
  );
  const seg = <T extends string>(value: T, opts: [T, string][], on: (v: T) => void) => (
    <div className="flex overflow-hidden rounded-xl border border-white/20">
      {opts.map(([v, l]) => (
        <button key={v} onClick={() => { sfx('click'); on(v); }} className={`px-3 py-1.5 text-sm font-bold ${value === v ? 'bg-amber-300 text-amber-950' : 'bg-white/5 hover:bg-white/15'}`}>{l}</button>
      ))}
    </div>
  );
  return (
    <PanelShell title="Tetapan" icon={<SettingsIcon />} onClose={onClose}>
      {row('Muzik latar', <input aria-label="Kelantangan muzik" type="range" min={0} max={1} step={0.05} value={s.musicVol} onChange={(e) => g.updateSettings({ musicVol: Number(e.target.value) })} className="w-48 accent-amber-300" />)}
      {row('Kesan bunyi', <input aria-label="Kelantangan kesan bunyi" type="range" min={0} max={1} step={0.05} value={s.sfxVol} onChange={(e) => g.updateSettings({ sfxVol: Number(e.target.value) })} className="w-48 accent-amber-300" />)}
      {row('Senyapkan semua', seg(s.muted ? 'y' : 'n', [['n', 'Tidak'], ['y', 'Ya']], (v) => g.updateSettings({ muted: v === 'y' })))}
      {row('Kualiti grafik', seg(s.quality, [['rendah', 'Rendah'], ['sederhana', 'Sederhana'], ['tinggi', 'Tinggi']], (v) => g.updateSettings({ quality: v })))}
      {row('Kawalan sentuh', seg(s.touchControls, [['auto', 'Auto'], ['on', 'Hidup'], ['off', 'Mati']], (v) => g.updateSettings({ touchControls: v })))}
      {row('Terbalikkan paksi Y kamera', seg(s.invertY ? 'y' : 'n', [['n', 'Tidak'], ['y', 'Ya']], (v) => g.updateSettings({ invertY: v === 'y' })))}
      <DeviceStorageNotice className="mt-5" />
      <div className="mt-3 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3">
        <div className="font-bold">Set semula kemajuan</div>
        <p className="text-sm text-white/70">Memadam semua XP, quest, kristal dan statistik dalam pelayar ini.</p>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} className="mt-2 rounded-xl bg-rose-500/80 px-4 py-2 text-sm font-bold hover:bg-rose-500">Set semula…</button>
        ) : (
          <div className="mt-2 flex gap-2">
            <button onClick={() => { g.resetProgress(); stopMusic(); useUI.getState().setScreen('menu'); }} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold">Ya, padam semua</button>
            <button onClick={() => setConfirm(false)} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold">Batal</button>
          </div>
        )}
      </div>
    </PanelShell>
  );
}

function WorldSelect({ onClose }: { onClose: () => void }) {
  const g = useGame();
  const ui = useUI();
  const inGame = ui.screen === 'game';
  return (
    <PanelShell title="Pilih Dunia" icon={<Map />} onClose={onClose} wide>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WORLD_ORDER.map((w, i) => {
          const wd = WORLDS[w];
          const open = g.isWorldUnlocked(w);
          const here = g.world === w && inGame;
          return (
            <button key={w} disabled={!open || here}
              onClick={() => {
                if (inGame) travelTo(w);
                else { g.setWorld(w); ui.setScreen('game'); }
              }}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition ${open ? 'border-white/25 hover:-translate-y-1 hover:shadow-xl' : 'cursor-not-allowed border-white/10 opacity-60'}`}
              style={{ background: open ? `linear-gradient(135deg, ${wd.sky[0]}55, ${wd.sky[1]}88)` : undefined }}>
              <div className="text-xs font-bold uppercase tracking-wider text-white/70">Dunia {i + 1}</div>
              <div className="font-display text-2xl font-extrabold">{wd.name}</div>
              <div className="text-sm text-white/85">{wd.subtitle}</div>
              <div className="mt-3 text-xs font-bold">
                {here ? <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-emerald-950">Kamu di sini</span>
                  : open ? <span className="rounded-full bg-white px-2 py-0.5 text-violet-800">Pergi ▸</span>
                    : <span className="flex items-center gap-1 text-white/80"><Lock size={12} /> {wd.unlockText}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </PanelShell>
  );
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ['W A S D / Anak panah', 'Bergerak'], ['Shift', 'Berlari'], ['Space', 'Melompat'], ['E', 'Berinteraksi / bercakap / ketuk'],
    ['Seret tetikus', 'Putar kamera'], ['Roda tetikus', 'Zum kamera'], ['Esc', 'Jeda / tutup panel'], ['Q · B · M', 'Log Quest · Buku Teori · Peta'],
    ['1–4 dan Enter', 'Pilih & hantar jawapan dalam cabaran'],
  ];
  return (
    <PanelShell title="Kawalan Permainan" icon={<Gamepad2 />} onClose={onClose}>
      <div className="grid gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
            <kbd className="rounded-lg border-b-4 border-amber-500 bg-amber-300 px-2 py-0.5 font-display font-bold text-amber-950">{k}</kbd>
            <span>{v}</span>
          </div>
        ))}
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-amber-200">Peranti sentuh</h3>
      <p className="text-sm text-white/80">Guna kayu bedik di kiri bawah untuk bergerak (tolak hingga hujung untuk berlari), butang ⬆ untuk melompat, butang ✋ untuk berinteraksi, dan seret skrin untuk memutar kamera.</p>
      <h3 className="mt-4 font-display text-lg font-bold text-amber-200">Petua</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-white/80">
        <li>Ikut anak panah kuning dalam penjejak quest untuk mencari objektif.</li>
        <li>NPC dengan tanda <b className="text-yellow-300">!</b> ada quest baharu; tanda <b className="text-sky-300">?</b> bermaksud mereka menunggu kamu.</li>
        <li>Berjalan di atas Jambatan Piano untuk mendengar skel C major!</li>
      </ul>
    </PanelShell>
  );
}

function AvatarPanel({ onClose }: { onClose: () => void }) {
  const g = useGame();
  return (
    <PanelShell title="Avatar Saya" icon={<User />} onClose={onClose} wide>
      <AvatarEditor initial={g.avatar} confirmLabel="Simpan Avatar" onConfirm={(a) => { g.setAvatar(a); onClose(); }} />
    </PanelShell>
  );
}
