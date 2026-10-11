import { useState } from 'react';
import { BookOpen, Dumbbell, Volume2 } from 'lucide-react';
import { PanelShell } from './ui';
import { PianoKeyboard, Rhythm, Staff, SymbolView } from '../challenges/Notation';
import { TOPICS } from '../questions';
import type { TopicId } from '../types';
import { rh } from '../utils/music';
import { playChord, playMelodic, playNote, playRhythm } from '../audio/audioEngine';
import { launchPractice } from '../game/interactions';
import { useUI } from '../store/uiStore';

/** Buku Teori Muzik — nota ringkas setiap topik dengan contoh notasi interaktif */
export function TheoryBook({ onClose }: { onClose: () => void }) {
  const [topic, setTopic] = useState<TopicId>('notasi');
  const inGame = useUI((s) => s.screen === 'game');
  return (
    <PanelShell title="Buku Teori Muzik" icon={<BookOpen />} onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {TOPICS.map((t) => (
          <button key={t.id} role="tab" aria-selected={topic === t.id} onClick={() => setTopic(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${topic === t.id ? 'text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
            style={topic === t.id ? { background: t.color } : undefined}>
            {t.short}
          </button>
        ))}
      </div>
      <div className="space-y-4 rounded-2xl bg-white p-4 text-slate-800 sm:p-6">
        {topic === 'notasi' && <Notasi />}
        {topic === 'nilai' && <Nilai />}
        {topic === 'irama' && <Irama />}
        {topic === 'skel' && <Skel />}
        {topic === 'jeda' && <Jeda />}
        {topic === 'triad' && <Triad />}
      </div>
      {inGame && (
        <button
          onClick={() => { onClose(); launchPractice([topic], `Latihan: ${TOPICS.find((t) => t.id === topic)!.name}`); }}
          className="mx-auto mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 px-6 py-3 font-display text-lg font-bold text-amber-950 shadow-lg hover:scale-105"
        >
          <Dumbbell size={20} /> Latih topik ini (5 soalan)
        </button>
      )}
      <p className="mt-3 text-center text-xs text-white/60">Nota ini ialah rumusan ringkas untuk sokongan pembelajaran. Guru disarankan menyemak dengan DSKP dan buku teks semasa.</p>
    </PanelShell>
  );
}

const H = ({ children }: { children: React.ReactNode }) => <h3 className="font-display text-2xl font-bold text-violet-800">{children}</h3>;
const Card = ({ children }: { children: React.ReactNode }) => <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">{children}</div>;
const PlayBtn = ({ onClick, label = 'Dengar' }: { onClick: () => void; label?: string }) => (
  <button onClick={onClick} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-sm font-bold text-white hover:bg-violet-700"><Volume2 size={14} /> {label}</button>
);

function Notasi() {
  return (
    <>
      <H>Notasi Muzik</H>
      <p><b>Baluk</b> terdiri daripada <b>5 garisan</b> dan <b>4 ruang</b>. Not ditulis pada garisan atau ruang. Semakin tinggi kedudukan not, semakin tinggi bunyinya.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <b>Klef Trebel (Klef G)</b> — untuk not tinggi. Pusarannya mengelilingi garisan ke-2 (not G).
          <Staff clef="treble" notes={['E4', 'G4', 'B4', 'D5', 'F5']} labels={['E', 'G', 'B', 'D', 'F']} />
          <p className="text-sm">Garisan: <b>E – G – B – D – F</b></p>
          <Staff clef="treble" notes={['F4', 'A4', 'C5', 'E5']} labels={['F', 'A', 'C', 'E']} />
          <p className="text-sm">Ruang: <b>F – A – C – E</b></p>
          <PlayBtn onClick={() => playMelodic(['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'], 0.35)} label="Dengar dari bawah ke atas" />
        </Card>
        <Card>
          <b>Klef Bes (Klef F)</b> — untuk not rendah. Dua titiknya mengapit garisan ke-4 (not F).
          <Staff clef="bass" notes={['G2', 'B2', 'D3', 'F3', 'A3']} labels={['G', 'B', 'D', 'F', 'A']} />
          <p className="text-sm">Garisan: <b>G – B – D – F – A</b></p>
          <Staff clef="bass" notes={['A2', 'C3', 'E3', 'G3']} labels={['A', 'C', 'E', 'G']} />
          <p className="text-sm">Ruang: <b>A – C – E – G</b></p>
        </Card>
      </div>
      <Card>
        <b>Garisan tambahan</b> digunakan untuk not di luar baluk. <b>C tengah</b> (C4) ditulis pada garisan tambahan pertama di bawah baluk klef trebel.
        <Staff clef="treble" notes={['C4', 'D4', 'A5']} labels={['C tengah', 'D', 'A']} />
        <PlayBtn onClick={() => playNote('C4')} label="Dengar C tengah" />
      </Card>
      <Card>
        <b>Aksidental</b>: <b>syap (♯)</b> menaikkan not satu semiton, <b>flet (♭)</b> menurunkan satu semiton, <b>natural (♮)</b> membatalkan syap/flet.
        <div className="mt-2 flex gap-4"><SymbolView symbol="sharp" size="sm" /><SymbolView symbol="flat" size="sm" /><SymbolView symbol="natural" size="sm" /></div>
      </Card>
    </>
  );
}

function Nilai() {
  const rows: { name: string; sym: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'; rest?: 'rest-whole' | 'rest-half' | 'rest-quarter' | 'rest-eighth'; beats: string }[] = [
    { name: 'Semibrif', sym: 'whole', rest: 'rest-whole', beats: '4' },
    { name: 'Minim', sym: 'half', rest: 'rest-half', beats: '2' },
    { name: 'Krotchet', sym: 'quarter', rest: 'rest-quarter', beats: '1' },
    { name: 'Kuaver', sym: 'eighth', rest: 'rest-eighth', beats: '½' },
    { name: 'Semikuaver', sym: 'sixteenth', beats: '¼' },
  ];
  return (
    <>
      <H>Nilai Not &amp; Tanda Rehat</H>
      <p>Setiap not mempunyai <b>nilai</b> (tempoh bunyi). <b>Tanda rehat</b> menunjukkan <b>senyap</b> untuk tempoh yang sama. Nilai di bawah adalah dalam meter x/4 (detik = krotchet).</p>
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead><tr className="text-sm text-violet-700"><th className="p-1">Nama</th><th>Not</th><th>Tanda Rehat</th><th>Detik</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-violet-100">
                <td className="p-1 font-bold">{r.name}</td>
                <td><div className="flex justify-center"><SymbolView symbol={r.sym} size="sm" /></div></td>
                <td><div className="flex justify-center">{r.rest ? <SymbolView symbol={r.rest} size="sm" /> : '—'}</div></td>
                <td className="font-display text-xl font-bold">{r.beats}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card>
        <b>Not bertitik</b>: titik menambah <b>separuh</b> nilai asal. Minim bertitik = 2 + 1 = <b>3 detik</b>. Krotchet bertitik = 1 + ½ = <b>1½ detik</b>.
        <div className="max-w-xs"><Rhythm tokens={rh('h. q.')} compact /></div>
      </Card>
    </>
  );
}

function Irama() {
  return (
    <>
      <H>Irama &amp; Meter</H>
      <p><b>Tanda masa</b> ditulis di awal lagu. <b>Angka atas</b> = bilangan detik dalam satu bar. <b>Angka bawah</b> 4 = setiap detik bernilai krotchet.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {([[2, 'q q'], [3, 'h q'], [4, 'q q e e q']] as [number, string][]).map(([n, pat]) => (
          <Card key={n}>
            <b>{n}/4</b> — {n} detik krotchet sebar
            <Rhythm tokens={rh(pat)} timeSig={[n, 4]} compact />
            <PlayBtn onClick={() => playRhythm(rh(pat), 84, n)} />
          </Card>
        ))}
      </div>
      <Card>
        <b>Garisan bar</b> membahagikan muzik kepada bar. Jumlah detik dalam setiap bar mesti sama dengan angka atas tanda masa. Detik pertama setiap bar ialah <b>detik kuat</b>.
        <p className="mt-1 text-sm">Kiraan sebutan: krotchet = <i>ta</i>, dua kuaver = <i>ti-ti</i>, minim = <i>ta-a</i>.</p>
      </Card>
    </>
  );
}

function Skel() {
  return (
    <>
      <H>Skel Major</H>
      <p><b>Skel</b> ialah susunan lapan not secara menaik atau menurun. Skel major mengikut corak <b>Ton – Ton – Semiton – Ton – Ton – Ton – Semiton</b>.</p>
      <Card>
        <b>Skel C major</b> (tiada syap/flet). Semiton antara E–F dan B–C.
        <Staff clef="treble" notes={['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']} labels={['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']} highlight={[2, 3, 6, 7]} />
        <PlayBtn onClick={() => playMelodic(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], 0.35)} />
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <b>Skel G major</b> — satu syap: <b>F♯</b>
          <Staff clef="treble" notes={['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5']} highlight={[6]} />
          <PlayBtn onClick={() => playMelodic(['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'], 0.35)} />
        </Card>
        <Card>
          <b>Skel F major</b> — satu flet: <b>B♭</b>
          <Staff clef="treble" notes={['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5']} highlight={[3]} />
          <PlayBtn onClick={() => playMelodic(['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'], 0.35)} />
        </Card>
      </div>
      <Card>
        <b>Ton dan semiton</b>: semiton = jarak terdekat (kekunci bersebelahan). Satu ton = dua semiton. Ketik kekunci untuk mendengar.
        <PianoKeyboard highlight={['E4', 'F4', 'B4', 'C5']} onPress={(n) => playNote(n)} />
      </Card>
    </>
  );
}

function Jeda() {
  const ex: [string, string, string][] = [['C4', 'D4', 'Major ke-2'], ['C4', 'E4', 'Major ke-3'], ['C4', 'F4', 'Perfek ke-4'], ['C4', 'G4', 'Perfek ke-5'], ['C4', 'A4', 'Major ke-6'], ['C4', 'C5', 'Oktaf Perfek']];
  return (
    <>
      <H>Jeda</H>
      <p><b>Jeda</b> ialah jarak antara dua not. Kira <b>semua huruf</b> dari not bawah hingga not atas, <b>termasuk kedua-duanya</b>. Contoh: C – D – E = ke-3.</p>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {ex.map(([a, b, n]) => (
          <Card key={b}>
            <b>{n}</b>
            <Staff clef="treble" notes={[a, b]} />
            <PlayBtn onClick={() => playMelodic([a, b], 0.5)} />
          </Card>
        ))}
      </div>
      <Card>
        <b>Jeda melodik</b>: not dimainkan satu demi satu. <b>Jeda harmonik</b>: not dimainkan serentak.
        <div className="max-w-xs"><Staff clef="treble" notes={[['C4', 'G4']]} /></div>
        <PlayBtn onClick={() => playChord(['C4', 'G4'])} label="Dengar jeda harmonik" />
      </Card>
    </>
  );
}

function Triad() {
  const tri: [string, string[]][] = [['C major', ['C4', 'E4', 'G4']], ['F major', ['F4', 'A4', 'C5']], ['G major', ['G4', 'B4', 'D5']]];
  return (
    <>
      <H>Triad</H>
      <p><b>Triad</b> ialah kord tiga not yang dibina daripada <b>not dasar</b>, <b>not ketiga</b> dan <b>not kelima</b>. Dalam kedudukan dasar, ketiga-tiga not berada sama ada semua pada garisan atau semua pada ruang.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {tri.map(([n, notes]) => (
          <Card key={n}>
            <b>{n}</b>
            <Staff clef="treble" notes={[notes]} />
            <p className="text-sm">{notes.map((x) => x.replace(/\d/, '')).join(' – ')}</p>
            <PlayBtn onClick={() => playChord(notes)} />
          </Card>
        ))}
      </div>
      <Card>
        Triad major = not dasar + <b>Major ke-3</b> + <b>Perfek ke-5</b>. Dalam skel C major, triad <b>I (C)</b>, <b>IV (F)</b> dan <b>V (G)</b> ialah triad utama (primer).
      </Card>
    </>
  );
}
