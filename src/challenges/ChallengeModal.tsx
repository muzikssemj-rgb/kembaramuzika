import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Lightbulb, RotateCcw, Sparkles, Trophy, X, XCircle } from 'lucide-react';
import { useUI } from '../store/uiStore';
import { useGame, todayKey } from '../store/gameStore';
import type { Question } from '../types';
import { TOPIC_NAME } from '../questions';
import { sfx } from '../audio/audioEngine';
import { ChoiceView, MatchView, OrderView, StaffPlaceView, StimulusView, TriadView, staffPlaceCorrect, type Verdict } from './QuestionViews';
import { describeStaffPosition, staffStep } from '../utils/music';

const TYPE_LABEL: Record<Question['type'], string> = {
  mcq: 'Pilihan Jawapan', 'staff-identify': 'Kenal Pasti Not', 'staff-place': 'Letak Not pada Baluk', match: 'Padankan',
  order: 'Susun Mengikut Urutan', 'scale-missing': 'Lengkapkan Skel', interval: 'Kenal Pasti Jeda', 'triad-build': 'Bina Triad', listen: 'Dengar & Pilih',
};

interface Answer { choice: string | null; step: number | null; match: Record<string, string>; order: string[]; triad: string[] }
const emptyAnswer = (): Answer => ({ choice: null, step: null, match: {}, order: [], triad: [] });

function isComplete(q: Question, a: Answer) {
  switch (q.type) {
    case 'staff-place': return a.step !== null;
    case 'match': return Object.keys(a.match).length === q.pairs!.length;
    case 'order': return a.order.length === q.items!.length;
    case 'triad-build': return a.triad.length === 3;
    default: return a.choice !== null;
  }
}

function grade(q: Question, a: Answer): { ok: boolean; wrongIds: string[] } {
  switch (q.type) {
    case 'staff-place': return { ok: staffPlaceCorrect(q, a.step), wrongIds: [] };
    case 'match': {
      const wrongIds = q.pairs!.filter((p) => a.match[p.left.id] !== p.right).map((p) => p.left.id);
      return { ok: wrongIds.length === 0, wrongIds };
    }
    case 'order': return { ok: JSON.stringify(a.order) === JSON.stringify(q.answer), wrongIds: [] };
    case 'triad-build': {
      const want = [...(q.answer as string[])].sort();
      return { ok: JSON.stringify([...a.triad].sort()) === JSON.stringify(want), wrongIds: [] };
    }
    default: return { ok: a.choice === q.answer, wrongIds: [] };
  }
}

/** Maklum balas khusus bagi jawapan salah (selain petunjuk umum) */
function specificFeedback(q: Question, a: Answer): string | null {
  if (q.type === 'staff-place' && a.step !== null) {
    const target = staffStep(q.answer as string, q.clef ?? 'treble');
    const where = describeStaffPosition(a.step);
    return `Kamu meletakkan not pada ${where}. ${a.step < target ? 'Cuba lebih tinggi.' : 'Cuba lebih rendah.'}`;
  }
  if (q.type === 'triad-build' && a.triad.length === 3) {
    const want = q.answer as string[];
    const hit = a.triad.filter((n) => want.includes(n)).length;
    return `${hit} daripada 3 not kamu betul.`;
  }
  if (q.type === 'order') {
    const want = q.answer as string[];
    const firstWrong = a.order.findIndex((id, i) => id !== want[i]);
    if (firstWrong >= 0) return `Urutan betul sehingga item ke-${firstWrong}. Semak semula bermula dari item ke-${firstWrong + 1}.`;
  }
  return null;
}

export function ChallengeModal() {
  const session = useUI((s) => s.challenge);
  if (!session) return null;
  return <ChallengeRunner key={session.title + session.questions.map((q) => q.id).join()} />;
}

function ChallengeRunner() {
  const session = useUI((s) => s.challenge)!;
  const close = () => useUI.getState().startChallenge(null);
  const game = useGame();
  const questions = session.questions;
  const final = session.mode === 'final';

  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<Answer>(emptyAnswer());
  const [verdict, setVerdict] = useState<Verdict>('idle');
  const [tries, setTries] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [results, setResults] = useState<{ id: string; first: boolean; solved: boolean }[]>([]);
  const [gain, setGain] = useState({ xp: 0, coins: 0 });
  const [lastGain, setLastGain] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  const feedbackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (verdict !== 'idle') setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    else scrollRef.current?.scrollTo({ top: 0 });
  }, [verdict, idx]);
  const solved = verdict === 'correct' || (final && verdict === 'wrong');

  const submit = () => {
    if (!q || !isComplete(q, answer) || solved) return;
    const { ok, wrongIds: w } = grade(q, answer);
    const first = tries === 0;
    const r = game.recordAnswer(q, ok, first, true);
    setTries((t) => t + 1);
    setWrongIds(w);
    if (ok) {
      sfx('correct');
      setVerdict('correct');
      setLastGain(r.xp);
      setGain((g) => ({ xp: g.xp + r.xp, coins: g.coins + r.coins }));
      setResults((rs) => [...rs, { id: q.id, first, solved: true }]);
    } else {
      sfx('wrong');
      setVerdict('wrong');
      if (final) setResults((rs) => [...rs, { id: q.id, first: false, solved: false }]);
    }
  };

  const retry = () => {
    setVerdict('idle');
    if (q.type === 'match') {
      // simpan padanan yang betul sahaja
      const keep: Record<string, string> = {};
      for (const [k, v] of Object.entries(answer.match)) if (!wrongIds.includes(k)) keep[k] = v;
      setAnswer((a) => ({ ...a, match: keep }));
    } else if (q.type === 'order' || q.type === 'triad-build') {
      setAnswer((a) => ({ ...a, order: [], triad: [] }));
    }
    setWrongIds([]);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      finish();
      return;
    }
    setIdx((i) => i + 1);
    setAnswer(emptyAnswer());
    setVerdict('idle');
    setTries(0);
    setWrongIds([]);
  };

  const finish = () => {
    setDone(true);
    const score = results.filter((r) => r.first).length;
    if (session.mode === 'final') game.recordFinal(score, questions.length);
    if (session.mode === 'daily' && game.daily.date !== todayKey()) game.completeDaily();
    if (session.mode === 'quest' || session.mode === 'practice') sfx('fanfareSmall');
  };

  const exitAfterDone = () => {
    close();
    if (session.mode === 'quest' && session.setId) {
      useGame.getState().completeChallengeSet(session.setId);
    }
  };

  // pintasan papan kekunci
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (done) { if (e.key === 'Enter') exitAfterDone(); return; }
      if (!q) return;
      if (['1', '2', '3', '4'].includes(e.key) && q.options && verdict === 'idle') {
        const o = q.options[Number(e.key) - 1];
        if (o) setAnswer((a) => ({ ...a, choice: o.id }));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (verdict === 'idle') submit();
        else if (solved) next();
        else retry();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const progressPct = ((idx + (solved ? 1 : 0)) / questions.length) * 100;
  const firstCorrect = results.filter((r) => r.first).length;

  const headerColor = useMemo(() => ({
    quest: 'from-violet-600 to-fuchsia-600', practice: 'from-sky-600 to-indigo-600', daily: 'from-amber-500 to-orange-600', final: 'from-rose-600 to-amber-500',
  })[session.mode], [session.mode]);

  if (questions.length === 0) {
    return (
      <Shell onClose={close} title={session.title} color={headerColor}>
        <p className="p-6 text-center text-white">Tiada soalan tersedia untuk topik ini lagi.</p>
      </Shell>
    );
  }

  if (done) {
    const pass = firstCorrect / questions.length >= 0.7;
    return (
      <Shell onClose={exitAfterDone} title={session.title} color={headerColor}>
        <div className="flex flex-col items-center gap-4 p-6 text-center text-white animate-pop">
          <Trophy size={56} className="text-amber-300 drop-shadow" />
          <h3 className="font-display text-3xl font-extrabold">
            {final ? (pass ? 'Tahniah! Kamu LULUS!' : 'Hampir berjaya!') : session.mode === 'quest' ? 'Cabaran Selesai!' : 'Latihan Selesai!'}
          </h3>
          <p className="text-lg">
            Betul pada cubaan pertama: <b>{firstCorrect}/{questions.length}</b>
          </p>
          {final && !pass && <p className="max-w-sm text-violet-100">Kamu perlukan sekurang-kurangnya 70% (7/10). Ulang kaji Buku Teori Muzik dan cuba lagi — tiada markah yang hilang!</p>}
          <div className="flex gap-3">
            <span className="rounded-full bg-white/15 px-4 py-1.5 font-bold">+{gain.xp} XP</span>
            <span className="rounded-full bg-white/15 px-4 py-1.5 font-bold">+{gain.coins} Syiling</span>
          </div>
          <button onClick={exitAfterDone} className="mt-2 flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-display text-lg font-bold text-violet-700 shadow-lg hover:scale-105">
            Kembali ke Dunia <ArrowRight size={20} />
          </button>
          {final && (
            <button onClick={() => { exitAfterDone(); useUI.getState().setPanel('score'); }} className="flex items-center gap-2 rounded-2xl bg-amber-300 px-6 py-3 font-display text-lg font-bold text-amber-950 shadow-lg hover:scale-105">
              <Trophy size={20} /> Simpan Skor (PDF) untuk Guru
            </button>
          )}
        </div>
      </Shell>
    );
  }

  const showExplain = verdict === 'correct' || (verdict === 'wrong' && (tries >= 2 || final));
  const spec = verdict === 'wrong' ? specificFeedback(q, answer) : null;

  return (
    <Shell onClose={close} title={session.title} color={headerColor} progress={progressPct} counter={`${idx + 1}/${questions.length}`}>
      <div ref={scrollRef} className="flex max-h-[78vh] flex-col gap-4 overflow-y-auto p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-violet-100">{TOPIC_NAME[q.topic]}</span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-violet-100">{TYPE_LABEL[q.type]}</span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-amber-200">{'★'.repeat(q.difficulty)}{'☆'.repeat(3 - q.difficulty)}</span>
          {tries > 0 && verdict !== 'correct' && !final && <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-amber-200">Cubaan ke-{tries + 1}</span>}
        </div>
        <h3 className="font-display text-xl font-bold leading-snug text-white sm:text-2xl">{q.prompt}</h3>
        {q.stimulus && <StimulusView s={q.stimulus} revealAudio={verdict !== 'idle'} />}

        {q.type === 'staff-place' ? (
          <StaffPlaceView q={q} value={answer.step} onChange={(step) => setAnswer((a) => ({ ...a, step }))} disabled={verdict !== 'idle'} verdict={verdict} />
        ) : q.type === 'match' ? (
          <MatchView q={q} value={answer.match} onChange={(match) => setAnswer((a) => ({ ...a, match }))} disabled={verdict !== 'idle'} wrongIds={wrongIds} />
        ) : q.type === 'order' ? (
          <OrderView q={q} value={answer.order} onChange={(order) => setAnswer((a) => ({ ...a, order }))} disabled={verdict !== 'idle'} />
        ) : q.type === 'triad-build' ? (
          <TriadView q={q} value={answer.triad} onChange={(triad) => setAnswer((a) => ({ ...a, triad }))} disabled={verdict !== 'idle'} />
        ) : (
          <ChoiceView q={q} value={answer.choice} onChange={(choice) => setAnswer((a) => ({ ...a, choice }))} verdict={verdict} disabled={verdict !== 'idle'} />
        )}

        {verdict !== 'idle' && (
          <div ref={feedbackRef} className={`scroll-mb-24 rounded-2xl border-2 p-4 animate-fadeup ${verdict === 'correct' ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-amber-300 bg-amber-50 text-amber-950'}`} role="status" aria-live="polite">
            <div className="flex items-center gap-2 font-display text-xl font-bold">
              {verdict === 'correct' ? <CheckCircle2 className="text-emerald-600" /> : final ? <XCircle className="text-rose-600" /> : <Lightbulb className="text-amber-600" />}
              {verdict === 'correct'
                ? tries === 1 ? `Betul! +${lastGain} XP` : `Betul! Bagus kerana tidak berputus asa. +${lastGain} XP`
                : final ? 'Belum tepat.' : 'Belum tepat — cuba lagi!'}
            </div>
            {spec && <p className="mt-1 text-sm">{spec}</p>}
            {verdict === 'wrong' && !final && <p className="mt-1 text-sm"><b>Petunjuk:</b> {q.hint}</p>}
            {showExplain && <p className="mt-1 text-sm"><b>Penerangan:</b> {q.explanation}</p>}
          </div>
        )}

        <div className="sticky bottom-0 flex justify-end gap-2 pt-1">
          {verdict === 'idle' && (
            <button
              onClick={submit}
              disabled={!isComplete(q, answer)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 px-6 py-3 font-display text-lg font-bold text-amber-950 shadow-lg transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            >
              <Sparkles size={20} /> Hantar Jawapan
            </button>
          )}
          {verdict === 'wrong' && !final && (
            <button onClick={retry} className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-display text-lg font-bold text-violet-700 shadow-lg hover:scale-105">
              <RotateCcw size={20} /> Cuba Lagi
            </button>
          )}
          {solved && (
            <button onClick={next} className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-display text-lg font-bold text-violet-700 shadow-lg hover:scale-105">
              {idx + 1 >= questions.length ? 'Lihat Keputusan' : 'Soalan Seterusnya'} <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children, onClose, title, color, progress, counter }: { children: React.ReactNode; onClose: () => void; title: string; color: string; progress?: number; counter?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-indigo-900/95 to-violet-950/95 shadow-2xl animate-pop">
        <div className={`flex items-center gap-3 bg-gradient-to-r ${color} px-4 py-3`}>
          <span className="text-2xl" aria-hidden>🎼</span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-bold text-white sm:text-xl">{title}</h2>
            {progress !== undefined && (
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-amber-300 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
          {counter && <span className="font-display font-bold text-white/90">{counter}</span>}
          <button onClick={onClose} className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30" aria-label="Tutup cabaran">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
