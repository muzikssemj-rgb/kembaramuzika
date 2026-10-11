import type { QuestDef, WorldId } from '../types';

export const QUESTS: QuestDef[] = [
  // ===== DUNIA 1: KAMPUNG NOTASI =====
  {
    id: 'q1', world: 'w1', giver: 'maestro', requires: [],
    title: 'Misteri Klef yang Hilang',
    story:
      'Selamat datang, Penjelajah Muzik! Penjaga Kampung Notasi telah kehilangan tiga not ajaib — G, A dan C. Tanpanya, Gerbang Baluk tidak dapat dibuka dan Kristal Muzik pertama terkunci. Cari ketiga-tiga not yang bercahaya di sekitar kampung!',
    steps: [
      { type: 'talk', npc: 'maestro', text: 'Bercakap dengan Maestro Melodi' },
      { type: 'collect', group: 'q1notes', count: 3, text: 'Kumpul 3 not ajaib yang bercahaya' },
      { type: 'challenge', set: 'q1', at: 'board1', text: 'Selesaikan teka-teki di Papan Baluk (berhampiran air pancut)' },
      { type: 'interact', objects: ['gate1'], text: 'Buka Gerbang Baluk di utara kampung' },
      { type: 'collect', group: 'crystal1', count: 1, text: 'Ambil Kristal Muzik di Pulau Utara' },
      { type: 'talk', npc: 'maestro', text: 'Kembali kepada Maestro Melodi' },
    ],
    reward: { xp: 120, coins: 50, badge: 'penjelajah-not' },
    completeText: 'Hebat! Kristal pertama telah kembali. Portal ke Hutan Irama kini terbuka!',
  },
  {
    id: 'q2', world: 'w1', giver: 'komposer', requires: ['q1'],
    title: 'Rahsia Klef Bes',
    story:
      'Hai! Aku Komposer Kecil. Lagu baharuku ditulis untuk alat muzik bernada rendah, tetapi tiga skrol klef bes telah diterbangkan angin ke Pulau Barat. Bolehkah kamu dapatkannya dan buktikan kamu boleh membaca klef bes?',
    steps: [
      { type: 'talk', npc: 'komposer', text: 'Bercakap dengan Komposer Kecil' },
      { type: 'collect', group: 'q2scrolls', count: 3, text: 'Kumpul 3 skrol klef bes di Pulau Barat' },
      { type: 'challenge', set: 'q2', at: 'komposer', text: 'Jawab cabaran klef bes Komposer Kecil' },
    ],
    reward: { xp: 100, coins: 40, badge: 'pakar-klef' },
    completeText: 'Terima kasih! Kini kamu boleh membaca klef trebel DAN klef bes.',
  },
  {
    id: 'q3', world: 'w1', giver: 'maestro', requires: ['q2'],
    title: 'Jambatan Piano Ajaib',
    story:
      'Kristal kedua tersembunyi di Pulau Timur, di hujung Jambatan Piano. Di sana terdapat empat Batu Not. Setiap batu menunjukkan satu not pada baluk. Ketuk batu mengikut urutan melodi C – E – G – C (tinggi) untuk membuka laluan ke Papan Ujian!',
    steps: [
      { type: 'talk', npc: 'maestro', text: 'Bercakap dengan Maestro Melodi' },
      { type: 'interact', objects: ['stoneC', 'stoneE', 'stoneG', 'stoneC2'], ordered: true, text: 'Ketuk Batu Not mengikut urutan: C – E – G – C (tinggi)' },
      { type: 'challenge', set: 'q3', at: 'board2', text: 'Selesaikan cabaran di Papan Ujian Pulau Timur' },
      { type: 'collect', group: 'crystal2', count: 1, text: 'Ambil Kristal Muzik kedua' },
      { type: 'talk', npc: 'maestro', text: 'Kembali kepada Maestro Melodi' },
    ],
    reward: { xp: 150, coins: 60, badge: 'pemain-piano' },
    completeText: 'Luar biasa! Kampung Notasi kini kembali berharmoni sepenuhnya.',
  },
  // ===== DUNIA 2–5 =====
  {
    id: 'w2q', world: 'w2', giver: 'ritma', requires: ['q1'],
    title: 'Rentak yang Hilang',
    story:
      'Assalamualaikum, Penjelajah! Gendang-gendang ajaib Hutan Irama sudah senyap. Kumpulkan 3 Gendang Rentak yang bersepah di hutan, kemudian tunjukkan kamu faham nilai not dan irama!',
    steps: [
      { type: 'talk', npc: 'ritma', text: 'Bercakap dengan Cikgu Ritma' },
      { type: 'collect', group: 'w2items', count: 3, text: 'Kumpul 3 Gendang Rentak' },
      { type: 'challenge', set: 'w2', at: 'ritma', text: 'Jawab cabaran irama Cikgu Ritma' },
      { type: 'collect', group: 'crystal3', count: 1, text: 'Ambil Kristal Irama' },
      { type: 'talk', npc: 'ritma', text: 'Kembali kepada Cikgu Ritma' },
    ],
    reward: { xp: 150, coins: 60, badge: 'pakar-ritma' },
    completeText: 'Rentak hutan telah kembali! Pergunungan Skel kini terbuka.',
  },
  {
    id: 'w3q', world: 'w3', giver: 'tangga', requires: ['w2q'],
    title: 'Mendaki Tangga Nada',
    story:
      'Skel ialah tangga nada — setiap anak tangga ialah satu not! Panjat pelantar gunung dan kumpul 3 Batu Ton. Ingat: lompat dengan kekunci Space.',
    steps: [
      { type: 'talk', npc: 'tangga', text: 'Bercakap dengan Tok Tangga Nada' },
      { type: 'collect', group: 'w3items', count: 3, text: 'Kumpul 3 Batu Ton di pelantar gunung' },
      { type: 'challenge', set: 'w3', at: 'tangga', text: 'Jawab cabaran skel Tok Tangga Nada' },
      { type: 'collect', group: 'crystal4', count: 1, text: 'Ambil Kristal Skel di puncak' },
      { type: 'talk', npc: 'tangga', text: 'Kembali kepada Tok Tangga Nada' },
    ],
    reward: { xp: 160, coins: 60, badge: 'penakluk-skel' },
    completeText: 'Kamu telah menakluk puncak skel! Gua Jeda kini terbuka.',
  },
  {
    id: 'w4q', world: 'w4', giver: 'gema', requires: ['w3q'],
    title: 'Gema Dua Not',
    story:
      'Di dalam gua ini, setiap bunyi bergema dua kali… seperti dua not dalam satu jeda! Cari 3 Kristal Gema yang bercahaya dalam gelap, kemudian ukur jarak antara not.',
    steps: [
      { type: 'talk', npc: 'gema', text: 'Bercakap dengan Si Gema' },
      { type: 'collect', group: 'w4items', count: 3, text: 'Kumpul 3 Kristal Gema' },
      { type: 'challenge', set: 'w4', at: 'gema', text: 'Jawab cabaran jeda Si Gema' },
      { type: 'collect', group: 'crystal5', count: 1, text: 'Ambil Kristal Jeda' },
      { type: 'talk', npc: 'gema', text: 'Kembali kepada Si Gema' },
    ],
    reward: { xp: 160, coins: 60, badge: 'detektif-jeda' },
    completeText: 'Kamu Detektif Jeda sejati! Kuil Triad kini terbuka.',
  },
  {
    id: 'w5q', world: 'w5', giver: 'penjaga', requires: ['w4q'],
    title: 'Tiga Tiang Harmoni',
    story:
      'Aku Penjaga Harmoni. Kuil ini disokong oleh tiga tiang: Dasar, Ketiga dan Kelima — sama seperti triad! Kumpul 3 Permata Harmoni untuk menyalakan tiang-tiang itu.',
    steps: [
      { type: 'talk', npc: 'penjaga', text: 'Bercakap dengan Penjaga Harmoni' },
      { type: 'collect', group: 'w5items', count: 3, text: 'Kumpul 3 Permata Harmoni' },
      { type: 'challenge', set: 'w5', at: 'penjaga', text: 'Jawab cabaran triad Penjaga Harmoni' },
      { type: 'collect', group: 'crystal6', count: 1, text: 'Ambil Kristal Triad' },
      { type: 'talk', npc: 'penjaga', text: 'Kembali kepada Penjaga Harmoni' },
    ],
    reward: { xp: 180, coins: 70, badge: 'penjaga-harmoni' },
    completeText: 'Enam kristal telah kembali! Hanya Ujian Penguasaan Akhir yang tinggal.',
  },
];

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q])) as Record<string, QuestDef>;

/** Syarat buka dunia: quest yang mesti selesai */
export const WORLD_UNLOCK: Record<WorldId, string | null> = {
  w1: null, w2: 'q1', w3: 'w2q', w4: 'w3q', w5: 'w4q',
};

export const CRYSTALS = [
  { id: 'crystal1', name: 'Kristal Baluk', color: '#a78bfa' },
  { id: 'crystal2', name: 'Kristal Piano', color: '#60a5fa' },
  { id: 'crystal3', name: 'Kristal Irama', color: '#34d399' },
  { id: 'crystal4', name: 'Kristal Skel', color: '#fbbf24' },
  { id: 'crystal5', name: 'Kristal Jeda', color: '#f472b6' },
  { id: 'crystal6', name: 'Kristal Triad', color: '#fb923c' },
  { id: 'crystal7', name: 'Kristal Harmoni Agung', color: '#f8fafc' },
];

export const BADGES: { id: string; name: string; desc: string; icon: string }[] = [
  { id: 'langkah-pertama', name: 'Langkah Pertama', desc: 'Jawab soalan pertama dengan betul.', icon: '🎵' },
  { id: 'penjelajah-not', name: 'Penjelajah Not', desc: 'Selesaikan quest "Misteri Klef yang Hilang".', icon: '🧭' },
  { id: 'pakar-klef', name: 'Pakar Klef', desc: 'Kuasai klef bes bersama Komposer Kecil.', icon: '🎼' },
  { id: 'pemain-piano', name: 'Pemain Piano Ajaib', desc: 'Selesaikan quest "Jambatan Piano Ajaib".', icon: '🎹' },
  { id: 'pakar-ritma', name: 'Pakar Ritma', desc: 'Pulihkan rentak Hutan Irama.', icon: '🥁' },
  { id: 'penakluk-skel', name: 'Penakluk Skel', desc: 'Tawan puncak Pergunungan Skel.', icon: '⛰️' },
  { id: 'detektif-jeda', name: 'Detektif Jeda', desc: 'Selesaikan misteri Gua Jeda.', icon: '🔍' },
  { id: 'penjaga-harmoni', name: 'Penjaga Harmoni', desc: 'Nyalakan tiga tiang Kuil Triad.', icon: '🏛️' },
  { id: 'tepat-lima', name: 'Tepat Berturut-turut', desc: 'Jawab 5 soalan betul pada cubaan pertama berturut-turut.', icon: '🎯' },
  { id: 'pengumpul', name: 'Pengumpul Simbol', desc: 'Kumpul semua simbol muzik dalam satu dunia.', icon: '💎' },
  { id: 'rajin-berlatih', name: 'Rajin Berlatih', desc: 'Selesaikan satu Cabaran Harian.', icon: '📅' },
  { id: 'maestro-muzika', name: 'Maestro Muzika', desc: 'Lulus Ujian Penguasaan Akhir.', icon: '👑' },
];
