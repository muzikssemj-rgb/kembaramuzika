import { useMemo, useState } from 'react';
import { BookOpen, GraduationCap, Play, Swords, X } from 'lucide-react';
import { useUI } from '../store/uiStore';
import { useGame } from '../store/gameStore';
import { NPCS } from '../worlds/worldData';
import { QUEST_BY_ID, QUESTS } from '../quests/questData';
import { launchPractice, launchQuestChallenge, pendingChallengeAt } from '../game/interactions';
import { pickFinalQuestions } from '../questions';
import { sfx } from '../audio/audioEngine';
import { WORLDS } from '../worlds/worldData';

type Action = { label: string; icon: React.ReactNode; run: () => void; primary?: boolean };

export function DialoguePanel() {
  const npcId = useUI((s) => s.dialogueNpc);
  if (!npcId) return null;
  return <Dialogue key={npcId} npcId={npcId} />;
}

function Dialogue({ npcId }: { npcId: string }) {
  const npc = NPCS[npcId];
  const g = useGame();
  const close = () => useUI.getState().openDialogue(null);
  const [lineIdx, setLineIdx] = useState(0);

  const { lines, actions, questTitle } = useMemo(() => {
    const acts: Action[] = [];
    let ls: string[] = [];
    let qt: string | undefined;
    // 1) quest aktif menunggu di NPC ini
    for (const [qid, st] of Object.entries(g.quests)) {
      if (st.status !== 'active') continue;
      const q = QUEST_BY_ID[qid];
      const step = q.steps[st.step];
      if (step.type === 'talk' && step.npc === npcId) {
        qt = q.title;
        const finishing = st.step === q.steps.length - 1;
        ls = finishing
          ? ['Kamu sudah kembali! Biar aku lihat…', 'Ya! Kerja yang sangat baik, Penjelajah Muzik.']
          : ['Bagus, kamu datang!', step.text];
        acts.push({ label: finishing ? 'Selesaikan Quest' : 'Teruskan', icon: <Play size={18} />, primary: true, run: () => { close(); g.completeTalkStep(npcId); } });
        return { lines: ls, actions: acts, questTitle: qt };
      }
      const set = pendingChallengeAt(npcId, g);
      if (set && step.type === 'challenge') {
        qt = q.title;
        ls = ['Kamu sudah bersedia? Tunjukkan apa yang kamu tahu!', 'Jangan risau jika tersilap — setiap kesilapan ialah peluang untuk belajar.'];
        acts.push({ label: 'Mula Cabaran', icon: <Swords size={18} />, primary: true, run: () => launchQuestChallenge(set) });
        return { lines: ls, actions: acts, questTitle: qt };
      }
    }
    // 2) quest baharu ditawarkan
    const offer = QUESTS.find((q) => q.giver === npcId && g.questAvailable(q.id));
    if (offer) {
      qt = offer.title;
      ls = [offer.story];
      acts.push({
        label: 'Mula Quest', icon: <Play size={18} />, primary: true,
        run: () => { g.startQuest(offer.id); close(); },
      });
      acts.push({ label: 'Nanti dulu', icon: <X size={18} />, run: close });
      return { lines: ls, actions: acts, questTitle: qt };
    }
    // 3) Ujian akhir (Penjaga Harmoni)
    if (npcId === 'penjaga' && g.quests.w5q?.status === 'done') {
      const ready = g.crystals.filter((c) => c !== 'crystal7').length >= 6;
      ls = g.final.passed
        ? ['Kamu telah memulihkan harmoni dunia ini. Kamu boleh mengambil ujian ini lagi untuk berlatih bila-bila masa.']
        : ready
          ? ['Enam kristal bersinar di sekelilingmu. Kini tibalah Ujian Penguasaan Akhir: 10 soalan daripada semua topik.', 'Jawab sekurang-kurangnya 7 soalan dengan betul pada cubaan pertama untuk memulihkan Kristal Harmoni Agung!']
          : ['Kumpul keenam-enam kristal terlebih dahulu. Semak Log Quest untuk melihat kristal yang masih tiada.'];
      if (ready) acts.push({
        label: g.final.passed ? 'Ulang Ujian Akhir' : 'Mula Ujian Akhir', icon: <GraduationCap size={18} />, primary: true,
        run: () => { sfx('open'); useUI.getState().startChallenge({ mode: 'final', title: 'Ujian Penguasaan Akhir', questions: pickFinalQuestions() }); },
      });
    }
    // 4) quest aktif di tempat lain: beri petunjuk
    if (!ls.length) {
      const mine = Object.entries(g.quests).find(([qid, st]) => st.status === 'active' && QUEST_BY_ID[qid].giver === npcId);
      if (mine) {
        const q = QUEST_BY_ID[mine[0]];
        const step = q.steps[mine[1].step];
        qt = q.title;
        ls = [`Ingat misi kita: ${step.text.toLowerCase()}.`, npc.idle[0]];
      } else {
        ls = [...npc.idle];
      }
    }
    acts.push({ label: 'Latihan', icon: <BookOpen size={18} />, run: () => launchPractice([npc.tip.topic], `Latihan bersama ${npc.name}`) });
    return { lines: ls, actions: acts, questTitle: qt };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npcId, g.quests, g.crystals, g.final]);

  const lastLine = lineIdx >= lines.length - 1;
  const worldName = WORLDS[g.world].name;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-2 sm:p-4" role="dialog" aria-label={`Perbualan dengan ${npc.name}`}>
      <div className="flex w-full max-w-3xl gap-3 rounded-3xl border border-white/25 bg-gradient-to-br from-indigo-950/95 to-violet-900/95 p-3 text-white shadow-2xl backdrop-blur-md animate-fadeup sm:gap-4 sm:p-5">
        {/* potret */}
        <div className="hidden shrink-0 flex-col items-center sm:flex">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/40" style={{ background: `radial-gradient(circle at 50% 35%, ${npc.accent}, ${npc.color})` }}>
            <Portrait color={npc.color} accent={npc.accent} hat={npc.hat} />
          </div>
          <span className="mt-1 max-w-[6rem] text-center text-[10px] text-white/70">{worldName}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="font-display text-xl font-bold leading-none text-amber-300 sm:text-2xl">{npc.name}</div>
              <div className="text-xs text-white/70">{npc.title}{questTitle ? ` · Quest: ${questTitle}` : ''}</div>
            </div>
            <button onClick={close} className="rounded-full bg-white/15 p-1.5 hover:bg-white/25" aria-label="Tutup"><X size={18} /></button>
          </div>
          <p className="mt-2 min-h-[3.5rem] text-base leading-relaxed sm:text-lg" aria-live="polite">{lines[lineIdx]}</p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {!lastLine ? (
              <button onClick={() => { sfx('click'); setLineIdx((i) => i + 1); }} className="rounded-2xl bg-white px-5 py-2.5 font-display font-bold text-violet-700 shadow hover:scale-105">
                Seterusnya ▸
              </button>
            ) : (
              actions.map((a) => (
                <button key={a.label} onClick={() => { sfx('click'); a.run(); }}
                  className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 font-display font-bold shadow transition hover:scale-105 ${a.primary ? 'bg-gradient-to-r from-amber-300 to-yellow-300 text-amber-950' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                  {a.icon} {a.label}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Portrait({ color, accent, hat }: { color: string; accent: string; hat: string }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <ellipse cx="50" cy="105" rx="38" ry="30" fill={color} />
      <circle cx="50" cy="52" r="24" fill="#f1c27d" />
      <circle cx="41" cy="52" r="3.6" fill="#1e1b4b" />
      <circle cx="59" cy="52" r="3.6" fill="#1e1b4b" />
      <path d="M42 62 Q50 69 58 62" stroke="#7f1d1d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="35" cy="60" r="3.5" fill="#fb7185" opacity=".5" />
      <circle cx="65" cy="60" r="3.5" fill="#fb7185" opacity=".5" />
      {hat === 'conductor' && <><rect x="33" y="14" width="34" height="20" rx="3" fill="#111827" /><rect x="25" y="31" width="50" height="5" rx="2" fill="#111827" /><rect x="33" y="27" width="34" height="4" fill={accent} /></>}
      {hat === 'beret' && <ellipse cx="54" cy="31" rx="26" ry="9" fill={accent} />}
      {hat === 'cap' && <><path d="M26 40 Q50 12 74 40 Z" fill={accent} /><rect x="48" y="37" width="30" height="5" rx="2" fill={accent} /></>}
      {hat === 'crown' && <path d="M30 34 L34 18 L42 28 L50 14 L58 28 L66 18 L70 34 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />}
      {hat === 'hood' && <path d="M22 60 Q22 20 50 20 Q78 20 78 60 Q72 34 50 32 Q28 34 22 60 Z" fill={accent} />}
    </svg>
  );
}
