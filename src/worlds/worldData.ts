import type { Decor, NPCDef, WorldDef, WorldId, WorldObject } from '../types';

// ===== NPC =====
export const NPCS: Record<string, NPCDef> = {
  maestro: {
    id: 'maestro', name: 'Maestro Melodi', title: 'Mentor Kampung Notasi',
    pos: [-3.5, 0, 5], color: '#5b3fd1', accent: '#fcd34d', hat: 'conductor',
    idle: [
      'Baluk mempunyai 5 garisan dan 4 ruang. Setiap garisan dan ruang mewakili satu not.',
      'Ingat: garisan klef trebel E – G – B – D – F, ruangnya F – A – C – E.',
    ],
    tip: { topic: 'notasi', text: 'Mahu berlatih membaca not? Aku boleh beri 5 soalan latihan.' },
  },
  komposer: {
    id: 'komposer', name: 'Komposer Kecil', title: 'Pemandu Melodi & Notasi',
    pos: [-12, 0, -2], color: '#0ea5e9', accent: '#f472b6', hat: 'beret',
    idle: [
      'Klef bes digunakan untuk not rendah — seperti suara bes, tuba dan tangan kiri piano.',
      'Garisan klef bes: G – B – D – F – A. Ruangnya: A – C – E – G.',
    ],
    tip: { topic: 'notasi', text: 'Mari latih klef bes dan simbol muzik!' },
  },
  ritma: {
    id: 'ritma', name: 'Cikgu Ritma', title: 'Jurulatih Irama',
    pos: [-4, 0, 4], color: '#059669', accent: '#fde047', hat: 'cap',
    idle: [
      'Krotchet = 1 detik, minim = 2 detik, semibrif = 4 detik.',
      'Tanda masa 4/4: empat detik krotchet dalam setiap bar.',
    ],
    tip: { topic: 'irama', text: 'Mahu latihan irama? Dengar dan kira detiknya!' },
  },
  tangga: {
    id: 'tangga', name: 'Tok Tangga Nada', title: 'Penjaga Pergunungan Skel',
    pos: [-4, 0, 6], color: '#b45309', accent: '#fef3c7', hat: 'hood',
    idle: [
      'Skel major: Ton – Ton – Semiton – Ton – Ton – Ton – Semiton.',
      'G major ada satu syap (F♯). F major ada satu flet (B♭).',
    ],
    tip: { topic: 'skel', text: 'Mari panjat tangga skel dengan latihan!' },
  },
  gema: {
    id: 'gema', name: 'Si Gema', title: 'Penghuni Gua Jeda',
    pos: [-4, 0, 5], color: '#7c3aed', accent: '#67e8f9', hat: 'hood',
    idle: [
      'Untuk mengira jeda, kira semua huruf dari not bawah ke not atas — termasuk kedua-duanya!',
      'C ke E ialah Major ke-3. C ke G ialah Perfek ke-5.',
    ],
    tip: { topic: 'jeda', text: 'Gema… gema… mahu berlatih jeda?' },
  },
  penjaga: {
    id: 'penjaga', name: 'Penjaga Harmoni', title: 'Penjaga Cabaran Agung',
    pos: [0, 0.6, 2], color: '#9a3412', accent: '#fde68a', hat: 'crown',
    idle: [
      'Triad dibina daripada not dasar, not ketiga dan not kelima.',
      'Kumpul enam kristal, dan aku akan membuka Ujian Penguasaan Akhir.',
    ],
    tip: { topic: 'triad', text: 'Mahu berlatih membina triad?' },
  },
};

const coinRing = (prefix: string, pts: [number, number, number][]): WorldObject[] =>
  pts.map((p, i) => ({ id: `${prefix}-coin${i}`, kind: 'coin', pos: p }));

// ===== DUNIA 1 =====
const w1Decor: Decor[] = [
  { kind: 'bigNote', pos: [0, 0, 0], s: 1.2, solid: 2.4 },
  { kind: 'house', pos: [-14, 0, 12], rotY: 0.6, color: '#f472b6', solid: 2.6 },
  { kind: 'house', pos: [15, 0, 12], rotY: -0.6, color: '#60a5fa', solid: 2.6 },
  { kind: 'house', pos: [-17, 0, -6], rotY: 1.4, color: '#fbbf24', solid: 2.6 },
  { kind: 'house', pos: [17, 0, 2], rotY: -1.5, color: '#34d399', solid: 2.6 },
  { kind: 'house', pos: [-8, 0, -15], rotY: 0.3, color: '#a78bfa', solid: 2.6 },
  ...([
    [-6, 0, 16], [7, 0, 17], [-19, 0, 4], [19, 0, -7], [-12, 0, -12], [4, 0, -17],
    [11, 0, 8], [-9, 0, 8], [-40, 0.5, 6], [-45, 0.5, 2], [44, 1, 6], [36, 1, -8],
  ] as [number, number, number][]).map((pos, i): Decor => ({ kind: 'noteTree', pos, s: 0.9 + (i % 3) * 0.15, rotY: i, solid: 0.6 })),
  ...([[3, 0, 9], [-3, 0, -6], [6, 0, -3], [-2, 0, -20], [2, 0, -20], [21, 0, -2], [21, 0, 2]] as [number, number, number][]).map(
    (pos): Decor => ({ kind: 'lamp', pos, solid: 0.25 }),
  ),
  { kind: 'pillar', pos: [-4, 0, -42], s: 1, solid: 0.6 },
  { kind: 'pillar', pos: [4, 0, -42], s: 1, solid: 0.6 },
  { kind: 'mushroom', pos: [-12, 0, 5], s: 1 },
  { kind: 'mushroom', pos: [12, 0, -4], s: 0.8 },
];

const w1: WorldDef = {
  id: 'w1', name: 'Kampung Notasi', subtitle: 'Baluk, klef & nama not',
  topics: ['notasi'],
  sky: ['#7dd3fc', '#c4b5fd'], fog: '#c7d2fe', ground: '#8b5a3c', grass: '#86efac', accent: '#a78bfa',
  spawn: [0, 0, 14],
  islands: [
    { x: 0, z: 0, r: 22, top: 0 },
    { x: 0, z: -42, r: 8, top: 0, color: '#c4b5fd' },
    { x: -40, z: 0, r: 10, top: 0.5, color: '#bef264' },
    { x: 40, z: 0, r: 10, top: 1, color: '#93c5fd' },
  ],
  bridges: [
    { from: [0, -21], to: [0, -34.5], y: 0, piano: true },
    { from: [-21, 0], to: [-30.5, 0], y: 0.25 },
    { from: [21, 0], to: [30.5, 0], y: 0.5, piano: true },
  ],
  decor: w1Decor,
  npcs: [NPCS.maestro, NPCS.komposer],
  objects: [
    { id: 'n-G', kind: 'collectible', pos: [15, 0, 5], group: 'q1notes', quest: 'q1', label: 'G' },
    { id: 'n-A', kind: 'collectible', pos: [-15, 0, 9], group: 'q1notes', quest: 'q1', label: 'A' },
    { id: 'n-C', kind: 'collectible', pos: [10, 0, -14], group: 'q1notes', quest: 'q1', label: 'C' },
    { id: 'board1', kind: 'board', pos: [4.5, 0, 5], rotY: -0.4, label: 'Papan Baluk', set: 'q1' },
    { id: 'gate1', kind: 'gate', pos: [0, 0, -21.5], label: 'Gerbang Baluk' },
    { id: 'crystal1', kind: 'crystal', pos: [0, 0, -42], group: 'crystal1', quest: 'q1' },
    { id: 'scroll1', kind: 'collectible', pos: [-40, 0.5, 6], group: 'q2scrolls', quest: 'q2', symbol: 'bass' },
    { id: 'scroll2', kind: 'collectible', pos: [-46, 0.5, -3], group: 'q2scrolls', quest: 'q2', symbol: 'bass' },
    { id: 'scroll3', kind: 'collectible', pos: [-35, 0.5, -6], group: 'q2scrolls', quest: 'q2', symbol: 'bass' },
    { id: 'stoneG', kind: 'stone', pos: [36, 1, -5], note: 'G4', label: 'Batu Not' },
    { id: 'stoneC2', kind: 'stone', pos: [44, 1, -4], note: 'C5', label: 'Batu Not' },
    { id: 'stoneC', kind: 'stone', pos: [37, 1, 5], note: 'C4', label: 'Batu Not' },
    { id: 'stoneE', kind: 'stone', pos: [44, 1, 5], note: 'E4', label: 'Batu Not' },
    { id: 'board2', kind: 'board', pos: [40, 1, 0], rotY: -Math.PI / 2, label: 'Papan Ujian', set: 'q3' },
    { id: 'crystal2', kind: 'crystal', pos: [47, 1, 0], group: 'crystal2', quest: 'q3' },
    { id: 'portal-w2', kind: 'portal', pos: [14, 0, -13], target: 'w2', rotY: -0.8, label: 'Portal ke Hutan Irama' },
    ...coinRing('w1', [
      [8, 0, 12], [-8, 0, 13], [-18, 0, -1], [18, 0, -3], [0, 0, -12], [-4, 0, -30], [0, 0, -46], [-25, 0.25, 0], [26, 0.5, 0], [-42, 0.5, -6],
    ]),
  ],
  unlockText: 'Sentiasa terbuka',
};

// ===== Pembina dunia 2–5 =====
const ringDecor = (kind: Decor['kind'], n: number, radius: number, y: number, color?: string, solid = 0.7, s = 1): Decor[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + 0.3;
    return { kind, pos: [Math.cos(a) * radius, y, Math.sin(a) * radius] as [number, number, number], s: s * (0.85 + (i % 3) * 0.15), rotY: a, color, solid };
  });

const w2: WorldDef = {
  id: 'w2', name: 'Hutan Irama', subtitle: 'Nilai not, tanda rehat & meter',
  topics: ['nilai', 'irama'],
  sky: ['#6ee7b7', '#fde68a'], fog: '#bbf7d0', ground: '#6b4423', grass: '#4ade80', accent: '#34d399',
  spawn: [0, 0, 13],
  islands: [
    { x: 0, z: 0, r: 20, top: 0 },
    { x: 30, z: -18, r: 8, top: 1, color: '#86efac' },
    { x: -30, z: -16, r: 8, top: 0.5, color: '#86efac' },
    { x: 0, z: -36, r: 7, top: 1.5, color: '#fde68a' },
  ],
  bridges: [
    { from: [0, -19.5], to: [0, -29.5], y: 0.75, piano: true },
  ],
  decor: [
    ...ringDecor('pine', 14, 17, 0, '#15803d', 0.6, 1.1),
    ...ringDecor('drum', 5, 9, 0, '#dc2626', 1.1),
    ...ringDecor('mushroom', 4, 5, 0, undefined, 0.5),
    { kind: 'pine', pos: [32, 1, -20], s: 1.2, solid: 0.6 },
    { kind: 'pine', pos: [-32, 0.5, -13], s: 1.1, solid: 0.6 },
  ],
  npcs: [NPCS.ritma],
  objects: [
    { id: 'drumA', kind: 'collectible', pos: [30, 1, -18], group: 'w2items', quest: 'w2q', symbol: 'quarter' },
    { id: 'drumB', kind: 'collectible', pos: [-30, 0.5, -16], group: 'w2items', quest: 'w2q', symbol: 'half' },
    { id: 'drumC', kind: 'collectible', pos: [12, 0, 10], group: 'w2items', quest: 'w2q', symbol: 'eighth' },
    { id: 'crystal3', kind: 'crystal', pos: [0, 1.5, -37], group: 'crystal3', quest: 'w2q' },
    { id: 'board-w2', kind: 'board', pos: [5, 0, 6], rotY: -0.5, label: 'Papan Latihan Irama' },
    { id: 'portal-w1-from2', kind: 'portal', pos: [-12, 0, 10], target: 'w1', rotY: 0.8, label: 'Portal ke Kampung Notasi' },
    { id: 'portal-w3', kind: 'portal', pos: [13, 0, -8], target: 'w3', rotY: -1, label: 'Portal ke Pergunungan Skel' },
    ...coinRing('w2', [[6, 0, 14], [-6, 0, -10], [16, 0, 2], [-16, 0, 0], [0, 0.75, -24], [30, 1, -22], [-32, 0.5, -18], [0, 1.5, -40]]),
  ],
  unlockText: 'Selesaikan quest "Misteri Klef yang Hilang"',
};

// Pelantar tangga gunung: setiap satu 1.2 unit lebih tinggi
const stairs = Array.from({ length: 7 }, (_, i) => {
  const a = -0.4 - 0.28 * i;
  return { x: Math.cos(a) * 24, z: Math.sin(a) * 24, r: 3.4, top: 1.2 * (i + 1), color: ['#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#fbbf24', '#fde68a'][i] };
});
const SA = -0.4 - 0.28 * 7 - 0.12;
const summit = { x: Math.cos(SA) * 25.5, z: Math.sin(SA) * 25.5, r: 4.5, top: 9.6, color: '#fff7ed' };

const w3: WorldDef = {
  id: 'w3', name: 'Pergunungan Skel', subtitle: 'Skel major, ton & semiton',
  topics: ['skel'],
  sky: ['#fcd34d', '#fb7185'], fog: '#fed7aa', ground: '#78716c', grass: '#d9f99d', accent: '#fbbf24',
  spawn: [0, 0, 12],
  islands: [{ x: 0, z: 0, r: 20, top: 0 }, ...stairs, summit],
  bridges: [],
  decor: [
    ...ringDecor('rock', 8, 16, 0, '#a8a29e', 1.2, 1.3),
    ...ringDecor('pine', 6, 12, 0, '#166534', 0.6, 0.9),
    { kind: 'pillar', pos: [summit.x - 2.5, 9.6, summit.z], solid: 0.6 },
    { kind: 'pillar', pos: [summit.x + 2.5, 9.6, summit.z], solid: 0.6 },
  ],
  npcs: [NPCS.tangga],
  objects: [
    { id: 'ton1', kind: 'collectible', pos: [stairs[1].x, stairs[1].top, stairs[1].z], group: 'w3items', quest: 'w3q', label: 'T' },
    { id: 'ton2', kind: 'collectible', pos: [stairs[3].x, stairs[3].top, stairs[3].z], group: 'w3items', quest: 'w3q', label: 'S' },
    { id: 'ton3', kind: 'collectible', pos: [stairs[5].x, stairs[5].top, stairs[5].z], group: 'w3items', quest: 'w3q', label: 'T' },
    { id: 'crystal4', kind: 'crystal', pos: [summit.x, 9.6, summit.z], group: 'crystal4', quest: 'w3q' },
    { id: 'board-w3', kind: 'board', pos: [5, 0, 7], rotY: -0.5, label: 'Papan Latihan Skel' },
    { id: 'portal-w1-from3', kind: 'portal', pos: [-12, 0, 10], target: 'w1', rotY: 0.8, label: 'Portal ke Kampung Notasi' },
    { id: 'portal-w4', kind: 'portal', pos: [13, 0, 6], target: 'w4', rotY: -1.2, label: 'Portal ke Gua Jeda' },
    ...coinRing('w3', stairs.map((s) => [s.x, s.top, s.z] as [number, number, number]).map(([x, y, z]) => [x * 1.06, y, z * 1.06] as [number, number, number]).concat([[0, 0, -8], [summit.x, 9.6, summit.z + 2.5]])),
  ],
  unlockText: 'Selesaikan quest "Rentak yang Hilang"',
};

const w4: WorldDef = {
  id: 'w4', name: 'Gua Jeda', subtitle: 'Jarak antara dua not',
  topics: ['jeda'],
  sky: ['#1e1b4b', '#312e81'], fog: '#312e81', ground: '#3f3f46', grass: '#6d28d9', accent: '#f472b6',
  spawn: [0, 0, 13],
  islands: [
    { x: 0, z: 0, r: 22, top: 0 },
    { x: -28, z: -22, r: 7, top: 1, color: '#7c3aed' },
    { x: 28, z: -22, r: 7, top: 1, color: '#7c3aed' },
  ],
  bridges: [],
  decor: [
    ...ringDecor('stalagmite', 16, 19, 0, '#a78bfa', 0.9, 1.2),
    ...ringDecor('crystalCluster', 6, 11, 0, '#67e8f9', 0.8),
    { kind: 'crystalCluster', pos: [-28, 1, -25], color: '#f472b6', solid: 0.8 },
    { kind: 'crystalCluster', pos: [28, 1, -25], color: '#f472b6', solid: 0.8 },
  ],
  npcs: [NPCS.gema],
  objects: [
    { id: 'gema1', kind: 'collectible', pos: [-28, 1, -21], group: 'w4items', quest: 'w4q', label: '2' },
    { id: 'gema2', kind: 'collectible', pos: [28, 1, -21], group: 'w4items', quest: 'w4q', label: '5' },
    { id: 'gema3', kind: 'collectible', pos: [-14, 0, 12], group: 'w4items', quest: 'w4q', label: '3' },
    { id: 'crystal5', kind: 'crystal', pos: [0, 0, -17], group: 'crystal5', quest: 'w4q' },
    { id: 'board-w4', kind: 'board', pos: [5, 0, 7], rotY: -0.5, label: 'Papan Latihan Jeda' },
    { id: 'portal-w1-from4', kind: 'portal', pos: [-12, 0, 6], target: 'w1', rotY: 0.8, label: 'Portal ke Kampung Notasi' },
    { id: 'portal-w5', kind: 'portal', pos: [13, 0, -6], target: 'w5', rotY: -1, label: 'Portal ke Kuil Triad' },
    ...coinRing('w4', [[8, 0, 14], [-8, 0, -8], [16, 0, 4], [-17, 0, -2], [0, 0, -8], [-30, 1, -20], [30, 1, -24], [10, 0, -14]]),
  ],
  unlockText: 'Selesaikan quest "Mendaki Tangga Nada"',
};

const w5: WorldDef = {
  id: 'w5', name: 'Kuil Triad', subtitle: 'Triad: dasar, ketiga & kelima',
  topics: ['triad'],
  sky: ['#fda4af', '#a78bfa'], fog: '#fbcfe8', ground: '#9a3412', grass: '#fde68a', accent: '#fb923c',
  spawn: [0, 0, 12],
  islands: [
    { x: 0, z: 0, r: 22, top: 0 },
    { x: 0, z: -4, r: 9, top: 0.6, color: '#fef3c7' },
    { x: -30, z: 14, r: 6, top: 1, color: '#fed7aa' },
    { x: 30, z: 14, r: 6, top: 1, color: '#fed7aa' },
  ],
  bridges: [
    { from: [-21.5, 12], to: [-24.5, 12], y: 0.5 },
    { from: [21.5, 12], to: [24.5, 12], y: 0.5 },
  ],
  decor: [
    { kind: 'temple', pos: [0, 0.6, -7], s: 1, solid: 0 },
    ...ringDecor('pillar', 10, 19.5, 0, '#fde68a', 0.6),
    ...ringDecor('lamp', 6, 13, 0, undefined, 0.25),
  ],
  npcs: [NPCS.penjaga],
  objects: [
    { id: 'gem1', kind: 'collectible', pos: [-30, 1, 14], group: 'w5items', quest: 'w5q', label: '1' },
    { id: 'gem2', kind: 'collectible', pos: [30, 1, 14], group: 'w5items', quest: 'w5q', label: '3' },
    { id: 'gem3', kind: 'collectible', pos: [0, 0, -18], group: 'w5items', quest: 'w5q', label: '5' },
    { id: 'crystal6', kind: 'crystal', pos: [0, 0.6, -6], group: 'crystal6', quest: 'w5q' },
    { id: 'board-w5', kind: 'board', pos: [7, 0, 10], rotY: -0.5, label: 'Papan Latihan Triad' },
    { id: 'portal-w1-from5', kind: 'portal', pos: [-12, 0, 12], target: 'w1', rotY: 0.8, label: 'Portal ke Kampung Notasi' },
    ...coinRing('w5', [[8, 0, 16], [-8, 0, 8], [16, 0, 0], [-16, 0, -4], [-30, 1, 10], [30, 1, 10], [0, 0, 12], [12, 0, -14]]),
  ],
  unlockText: 'Selesaikan quest "Gema Dua Not"',
};

export const WORLDS: Record<WorldId, WorldDef> = { w1, w2, w3, w4, w5 };
export const WORLD_ORDER: WorldId[] = ['w1', 'w2', 'w3', 'w4', 'w5'];
