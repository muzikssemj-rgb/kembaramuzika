import { jsPDF } from 'jspdf';
import type { GameState } from '../store/gameStore';
import { levelInfo } from '../store/gameStore';
import { TOPICS, allQuestions } from '../questions';
import { BADGES, CRYSTALS, QUESTS } from '../quests/questData';
import type { TopicId } from '../types';
import { COPYRIGHT } from '../components/ui';

export interface ScoreSummary {
  attempted: number;
  firstCorrect: number;
  accuracy: number | null; // 0..1
  finalBest: number;
  finalAttempts: number;
  finalPassed: boolean;
  level: number;
  xp: number;
  coins: number;
  questsDone: number;
  questsTotal: number;
  crystals: number;
  badges: string[];
  topics: { id: TopicId; name: string; attempted: number; firstCorrect: number; accuracy: number | null; mastered: number; total: number }[];
}

/** Kira ringkasan skor daripada data sebenar pemain (tiada data rekaan). */
export function computeScore(s: GameState): ScoreSummary {
  const topics = TOPICS.map((t) => {
    const st = s.stats[t.id];
    const ids = allQuestions().filter((q) => q.topic === t.id).map((q) => q.id);
    return {
      id: t.id, name: t.name, attempted: st.attempted, firstCorrect: st.correctFirst,
      accuracy: st.attempted ? st.correctFirst / st.attempted : null,
      mastered: ids.filter((id) => s.qlog[id]?.mastered).length, total: ids.length,
    };
  });
  const attempted = topics.reduce((a, t) => a + t.attempted, 0);
  const firstCorrect = topics.reduce((a, t) => a + t.firstCorrect, 0);
  return {
    attempted, firstCorrect, accuracy: attempted ? firstCorrect / attempted : null,
    finalBest: s.final.best, finalAttempts: s.final.attempts, finalPassed: s.final.passed,
    level: levelInfo(s.xp).level, xp: s.xp, coins: s.coins,
    questsDone: QUESTS.filter((q) => s.quests[q.id]?.status === 'done').length, questsTotal: QUESTS.length,
    crystals: s.crystals.length,
    badges: BADGES.filter((b) => s.badges.includes(b.id)).map((b) => b.name),
    topics,
  };
}

const pct = (v: number | null) => (v === null ? '-' : `${Math.round(v * 100)}%`);

export function buildScorePdf(s: GameState): { blob: Blob; filename: string } {
  const sc = computeScore(s);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 16;
  const now = new Date();
  const tarikh = now.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  const masa = now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });

  // Kepala
  doc.setFillColor(76, 29, 149);
  doc.rect(0, 0, W, 34, 'F');
  doc.setFillColor(251, 191, 36);
  doc.rect(0, 34, W, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('KEMBARA MUZIKA', M, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text('Pengembaraan Muzik secara Digital', M, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LAPORAN SKOR MURID', W - M, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`${tarikh}, ${masa}`, W - M, 23, { align: 'right' });

  // Maklumat murid
  let y = 46;
  doc.setTextColor(30, 27, 75);
  const info: [string, string][] = [
    ['Nama Murid', s.student.nama || '-'],
    ['Kelas', s.student.kelas || '-'],
    ['Sekolah', s.student.sekolah || '-'],
    ['Nama Guru', s.student.guru || '-'],
    ['Nama Watak (dalam permainan)', s.avatar.name || '-'],
  ];
  doc.setDrawColor(221, 214, 254);
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(M, y - 6, W - 2 * M, info.length * 7.5 + 5, 2, 2, 'FD');
  doc.setFontSize(10.5);
  for (const [k, v] of info) {
    doc.setFont('helvetica', 'bold');
    doc.text(k, M + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`:  ${v}`, M + 62, y);
    y += 7.5;
  }

  // Kotak ringkasan
  y += 6;
  const boxes: [string, string, string][] = [
    ['Ujian Penguasaan Akhir', sc.finalAttempts ? `${sc.finalBest}/10` : '-', sc.finalAttempts ? (sc.finalPassed ? 'LULUS' : 'Belum lulus') : 'Belum dicuba'],
    ['Ketepatan Keseluruhan', pct(sc.accuracy), `${sc.firstCorrect}/${sc.attempted} betul (cubaan 1)`],
    ['Tahap & XP', `Tahap ${sc.level}`, `${sc.xp} XP`],
    ['Kristal Muzik', `${sc.crystals}/7`, `${sc.questsDone}/${sc.questsTotal} quest selesai`],
  ];
  const bw = (W - 2 * M - 9) / 4;
  boxes.forEach(([label, big, sub], i) => {
    const x = M + i * (bw + 3);
    doc.setFillColor(i === 0 ? 254 : 248, i === 0 ? 243 : 250, i === 0 ? 199 : 252);
    doc.setDrawColor(i === 0 ? 251 : 203, i === 0 ? 191 : 213, i === 0 ? 36 : 225);
    doc.roundedRect(x, y, bw, 26, 2, 2, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(label, x + 3, y + 6);
    doc.setTextColor(30, 27, 75);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(big, x + 3, y + 15.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(sub, x + 3, y + 22);
  });
  y += 36;

  // Jadual topik
  doc.setTextColor(76, 29, 149);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Penguasaan Mengikut Topik', M, y);
  y += 4;
  const cols = [M, M + 66, M + 90, M + 122, M + 146];
  doc.setFillColor(76, 29, 149);
  doc.rect(M, y, W - 2 * M, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  ['Topik', 'Dicuba', 'Betul (cubaan 1)', 'Ketepatan', 'Soalan dikuasai'].forEach((h, i) => doc.text(h, cols[i] + 2, y + 5.5));
  y += 8;
  doc.setFont('helvetica', 'normal');
  sc.topics.forEach((t, i) => {
    if (i % 2 === 0) { doc.setFillColor(245, 243, 255); doc.rect(M, y, W - 2 * M, 8, 'F'); }
    doc.setTextColor(30, 27, 75);
    doc.text(t.name, cols[0] + 2, y + 5.5);
    doc.text(String(t.attempted), cols[1] + 2, y + 5.5);
    doc.text(String(t.firstCorrect), cols[2] + 2, y + 5.5);
    doc.text(pct(t.accuracy), cols[3] + 2, y + 5.5);
    doc.text(`${t.mastered}/${t.total}`, cols[4] + 2, y + 5.5);
    // bar kecil
    const bx = cols[4] + 15;
    doc.setFillColor(226, 232, 240);
    doc.rect(bx, y + 2.8, 16, 3, 'F');
    doc.setFillColor(124, 58, 237);
    if (t.total) doc.rect(bx, y + 2.8, (16 * t.mastered) / t.total, 3, 'F');
    y += 8;
  });
  doc.setDrawColor(221, 214, 254);
  doc.rect(M, y - 8 * sc.topics.length - 8, W - 2 * M, 8 * sc.topics.length + 8);

  // Pencapaian
  y += 10;
  doc.setTextColor(76, 29, 149);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Pencapaian', M, y);
  y += 6;
  doc.setTextColor(30, 27, 75);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const crystalNames = CRYSTALS.filter((c) => s.crystals.includes(c.id)).map((c) => c.name).join(', ') || '-';
  const lines = [
    `Lencana (${sc.badges.length}/${BADGES.length}): ${sc.badges.join(', ') || '-'}`,
    `Kristal: ${crystalNames}`,
    `Syiling Muzik: ${sc.coins}    Percubaan Ujian Akhir: ${sc.finalAttempts}`,
  ];
  for (const l of lines) {
    const wrapped = doc.splitTextToSize(l, W - 2 * M);
    doc.text(wrapped, M, y);
    y += wrapped.length * 5 + 2;
  }

  // Nota & tandatangan
  y += 4;
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const note = doc.splitTextToSize(
    'Nota: Ketepatan dikira daripada jawapan pada cubaan pertama sahaja. "Soalan dikuasai" bermaksud soalan yang pernah dijawab betul pada cubaan pertama. Skor ini dijana secara automatik daripada aktiviti murid dalam permainan (Mod Peranti: data disimpan dalam peranti murid sahaja, tiada simpanan di cloud).',
    W - 2 * M,
  );
  doc.text(note, M, y);
  y = Math.max(y + note.length * 4 + 14, 250);
  doc.setDrawColor(148, 163, 184);
  doc.line(M, y, M + 60, y);
  doc.line(W - M - 60, y, W - M, y);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Tandatangan Murid', M, y + 5);
  doc.text('Tandatangan / Cop Guru', W - M - 60, y + 5);

  // Kaki
  doc.setFillColor(76, 29, 149);
  doc.rect(0, 287, W, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text(COPYRIGHT.replace('©', '(c)'), W / 2, 293.2, { align: 'center' });

  const safe = (s.student.nama || s.avatar.name || 'murid').trim().replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40);
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return { blob: doc.output('blob'), filename: `Skor_KembaraMuzika_${safe}_${stamp}.pdf` };
}

/** Simpan fail: guna keupayaan muat turun claude.ai jika ada, jika tidak muat turun biasa pelayar. */
export async function saveFile(blob: Blob, filename: string): Promise<'saved' | 'declined' | 'error'> {
  type DL = { save: (r: { filename: string; data: Blob }) => Promise<unknown> };
  const w = window as unknown as { claude?: { use?: (n: string) => Promise<DL | null> } };
  if (w.claude?.use) {
    try {
      const dl = await w.claude.use('downloads');
      if (dl) {
        try {
          await dl.save({ filename, data: blob });
          return 'saved';
        } catch (e) {
          const code = (e as { code?: string })?.code;
          return code === 'declined' ? 'declined' : 'error';
        }
      }
    } catch { /* teruskan ke muat turun biasa */ }
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'saved';
  } catch {
    return 'error';
  }
}
