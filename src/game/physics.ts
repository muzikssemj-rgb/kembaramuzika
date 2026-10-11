import type { WorldDef } from '../types';

/** Platform pejal yang boleh dipijak */
export interface Platform { kind: 'cyl' | 'box'; x: number; z: number; r: number; w: number; d: number; top: number }
/** Halangan bulat (dinding menegak) */
export interface Obstacle { x: number; z: number; r: number; minY: number; maxY: number; id?: string }

export interface CollisionWorld { platforms: Platform[]; obstacles: Obstacle[] }

export const BRIDGE_WIDTH = 3.6;

export function buildCollision(w: WorldDef, closedGates: string[]): CollisionWorld {
  const platforms: Platform[] = w.islands.map((i) => ({
    kind: i.shape === 'box' ? 'box' : 'cyl', x: i.x, z: i.z, r: i.r, w: i.w ?? 0, d: i.d ?? 0, top: i.top,
  }));
  for (const b of w.bridges) {
    const [x1, z1] = b.from;
    const [x2, z2] = b.to;
    const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
    platforms.push({
      kind: 'box', x: (x1 + x2) / 2, z: (z1 + z2) / 2, r: 0,
      w: alongX ? Math.abs(x2 - x1) + 1 : BRIDGE_WIDTH,
      d: alongX ? BRIDGE_WIDTH : Math.abs(z2 - z1) + 1,
      top: b.y,
    });
  }
  const obstacles: Obstacle[] = [];
  for (const d of w.decor) {
    if (d.solid) obstacles.push({ x: d.pos[0], z: d.pos[2], r: d.solid * (d.s ?? 1), minY: d.pos[1] - 1, maxY: d.pos[1] + 6 });
  }
  // kuil: dinding belakang dan tiang
  for (const d of w.decor.filter((x) => x.kind === 'temple')) {
    const [x, y, z] = d.pos;
    for (const px of [-5, -2.5, 2.5, 5]) obstacles.push({ x: x + px, z: z + 3, r: 0.7, minY: y - 1, maxY: y + 8 });
    for (let px = -6; px <= 6; px += 1.5) obstacles.push({ x: x + px, z: z - 3.5, r: 0.8, minY: y - 1, maxY: y + 8 });
  }
  for (const n of w.npcs) obstacles.push({ x: n.pos[0], z: n.pos[2], r: 0.7, minY: n.pos[1] - 1, maxY: n.pos[1] + 3 });
  for (const o of w.objects) {
    if (o.kind === 'board') obstacles.push({ x: o.pos[0], z: o.pos[2], r: 0.9, minY: o.pos[1] - 1, maxY: o.pos[1] + 3 });
    if (o.kind === 'stone') obstacles.push({ x: o.pos[0], z: o.pos[2], r: 0.9, minY: o.pos[1] - 1, maxY: o.pos[1] + 2 });
    if (o.kind === 'gate' && closedGates.includes(o.id)) {
      for (let k = -2; k <= 2; k++) obstacles.push({ id: o.id, x: o.pos[0] + k * 0.9, z: o.pos[2], r: 0.7, minY: -5, maxY: 10 });
    }
  }
  return { platforms, obstacles };
}

function onPlatform(p: Platform, x: number, z: number, pad = 0): boolean {
  if (p.kind === 'cyl') {
    const dx = x - p.x;
    const dz = z - p.z;
    return dx * dx + dz * dz <= (p.r + pad) * (p.r + pad);
  }
  return Math.abs(x - p.x) <= p.w / 2 + pad && Math.abs(z - p.z) <= p.d / 2 + pad;
}

/** Ketinggian tanah tertinggi di bawah (x,z) yang tidak melebihi y + step. -Infinity jika tiada. */
export function groundHeight(cw: CollisionWorld, x: number, z: number, y: number, step = 0.6): number {
  let best = -Infinity;
  for (const p of cw.platforms) {
    if (p.top <= y + step && p.top > best && onPlatform(p, x, z, 0.25)) best = p.top;
  }
  return best;
}

/** Ketinggian tanah tertinggi di (x,z) tanpa had (untuk kamera & penempatan objek) */
export function topHeight(cw: CollisionWorld, x: number, z: number): number {
  let best = -Infinity;
  for (const p of cw.platforms) if (p.top > best && onPlatform(p, x, z)) best = p.top;
  return best;
}

/** Tolak pemain keluar daripada halangan dan tepi platform yang lebih tinggi (dinding). */
export function resolveCollisions(cw: CollisionWorld, pos: { x: number; y: number; z: number }, radius = 0.45) {
  for (const o of cw.obstacles) {
    if (pos.y > o.maxY || pos.y + 1.6 < o.minY) continue;
    const dx = pos.x - o.x;
    const dz = pos.z - o.z;
    const min = o.r + radius;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      pos.x = o.x + (dx / d) * min;
      pos.z = o.z + (dz / d) * min;
    }
  }
  // dinding platform: jika masuk ke platform yang terlalu tinggi untuk dipijak, tolak keluar
  for (const p of cw.platforms) {
    if (p.top <= pos.y + 0.6 || p.top - 3 > pos.y + 1.6) continue;
    if (p.kind === 'cyl') {
      const dx = pos.x - p.x;
      const dz = pos.z - p.z;
      const min = p.r + radius * 0.6;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 1e-6) {
        const d = Math.sqrt(d2);
        pos.x = p.x + (dx / d) * min;
        pos.z = p.z + (dz / d) * min;
      }
    }
  }
}

export function closestPlatformTop(cw: CollisionWorld, x: number, z: number) {
  let best: Platform = cw.platforms[0];
  let bd = Infinity;
  for (const p of cw.platforms) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}
