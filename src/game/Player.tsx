import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import type { WorldDef } from '../types';
import { Avatar, type AnimState } from '../characters/Avatar';
import { useGame } from '../store/gameStore';
import { isBlocking, useUI, type Nearby } from '../store/uiStore';
import { input } from '../hooks/input';
import { buildCollision, groundHeight, resolveCollisions, topHeight } from './physics';
import { playerPos, teleportReq } from './playerState';
import { enterPortal, interact, isObjectVisible } from './interactions';
import { playNote, sfx } from '../audio/audioEngine';
import { PIANO_KEY_LEN } from '../worlds/Scenery';

const WALK = 6;
const RUN = 10.5;
const GRAVITY = 24;
const JUMP_V = 9.8;
const C_MAJOR = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'];

export function Player({ world }: { world: WorldDef }) {
  const avatar = useGame((s) => s.avatar);
  const opened = useGame((s) => s.opened);
  const respawnTick = useUI((s) => s.respawnTick);
  const { camera } = useThree();

  const gates = useMemo(() => world.objects.filter((o) => o.kind === 'gate' && !opened.includes(o.id)).map((o) => o.id), [world, opened]);
  const cw = useMemo(() => buildCollision(world, gates), [world, gates]);

  const group = useRef<Group>(null);
  const pos = useRef(new Vector3(...world.spawn));
  const vel = useRef(new Vector3());
  const facing = useRef(Math.PI);
  const grounded = useRef(true);
  const anim = useRef<AnimState>({ speed: 0, grounded: true, vy: 0 });
  const lastNearby = useRef<string | null>(null);
  const scanTimer = useRef(0);
  const stepTimer = useRef(0);
  const pianoKey = useRef<string>('');
  const camTarget = useRef(new Vector3());
  const lastSafe = useRef(new Vector3(...world.spawn));
  const coyote = useRef(0);

  const respawn = () => {
    pos.current.set(...world.spawn);
    pos.current.y += 0.5;
    vel.current.set(0, 0, 0);
    input.camYaw = 0;
    facing.current = Math.PI;
  };

  useEffect(() => {
    respawn();
    camera.position.set(world.spawn[0], world.spawn[1] + 5, world.spawn[2] + 10);
    camTarget.current.set(world.spawn[0], world.spawn[1] + 1.5, world.spawn[2]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.id]);

  useEffect(() => {
    if (respawnTick > 0) respawn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [respawnTick]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const ui = useUI.getState();
    const blocked = isBlocking(ui);
    const p = pos.current;
    const v = vel.current;
    if (teleportReq.pos) {
      p.set(...teleportReq.pos);
      v.set(0, 0, 0);
      teleportReq.pos = null;
    }

    // ===== Input pergerakan relatif kamera =====
    let mx = 0;
    let mz = 0;
    if (!blocked) {
      const f = input.forward + -input.joyY;
      const r = input.right + input.joyX;
      const yaw = input.camYaw;
      const fx = -Math.sin(yaw);
      const fz = -Math.cos(yaw);
      const rx = Math.cos(yaw);
      const rz = -Math.sin(yaw);
      mx = fx * f + rx * r;
      mz = fz * f + rz * r;
      const len = Math.hypot(mx, mz);
      if (len > 1) { mx /= len; mz /= len; }
    }
    const joyMag = Math.hypot(input.joyX, input.joyY);
    const sprint = input.sprint || joyMag > 0.92;
    const speed = sprint ? RUN : WALK;
    const accel = grounded.current ? 14 : 5;
    v.x += (mx * speed - v.x) * Math.min(1, dt * accel);
    v.z += (mz * speed - v.z) * Math.min(1, dt * accel);

    // ===== Lompat & graviti =====
    if (grounded.current) coyote.current = 0.12; else coyote.current -= dt;
    if (input.jumpQueued) {
      if (!blocked && coyote.current > 0) {
        v.y = JUMP_V;
        grounded.current = false;
        coyote.current = 0;
        sfx('jump');
      }
      input.jumpQueued = false;
    }
    v.y -= GRAVITY * dt;
    const prevY = p.y;
    p.x += v.x * dt;
    p.z += v.z * dt;
    resolveCollisions(cw, p);
    p.y += v.y * dt;
    const g = groundHeight(cw, p.x, p.z, Math.max(prevY, p.y), 0.65);
    const wasGrounded = grounded.current;
    if (p.y <= g && v.y <= 0) {
      if (!wasGrounded && v.y < -8) sfx('land');
      p.y = g;
      v.y = 0;
      grounded.current = true;
      lastSafe.current.set(p.x, p.y, p.z);
    } else if (g > -Infinity && p.y - g < 0.08 && v.y <= 0) {
      p.y = g;
      grounded.current = true;
    } else {
      grounded.current = false;
    }

    // ===== Jatuh: kembali ke tempat selamat =====
    if (p.y < -22) {
      const safe = lastSafe.current;
      p.set(safe.x, safe.y + 2, safe.z);
      // tolak sedikit ke arah tengah pulau supaya tidak jatuh semula
      p.x *= 0.92;
      p.z *= 0.92;
      const gg = topHeight(cw, p.x, p.z);
      if (gg === -Infinity) p.set(...world.spawn);
      v.set(0, 0, 0);
      ui.pushToast('Oops! Kamu terjatuh — kembali ke tempat selamat.', 'warn');
    }

    // ===== Arah hadapan watak =====
    const hs = Math.hypot(v.x, v.z);
    if (hs > 0.5 && !blocked) {
      const target = Math.atan2(v.x, v.z);
      let diff = target - facing.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      facing.current += diff * Math.min(1, dt * 12);
      // kamera perlahan-lahan ikut belakang watak apabila bergerak ke sisi
      const sideways = Math.abs(input.right + input.joyX) > 0.2 && Math.abs(input.forward - input.joyY) < 0.2;
      if (sideways && performance.now() - lastDrag.t > 1200) {
        let cd = facing.current + Math.PI - input.camYaw;
        cd = Math.atan2(Math.sin(cd), Math.cos(cd));
        input.camYaw += cd * Math.min(1, dt * 1.2);
      }
    }
    anim.current.speed = grounded.current ? hs : 0;
    anim.current.grounded = grounded.current;
    anim.current.vy = v.y;

    if (group.current) {
      group.current.position.copy(p);
      group.current.rotation.y = facing.current;
    }
    playerPos.x = p.x; playerPos.y = p.y; playerPos.z = p.z; playerPos.yaw = facing.current;

    // bunyi tapak kaki & kekunci piano
    if (grounded.current && hs > 1) {
      stepTimer.current -= dt;
      if (stepTimer.current <= 0) { sfx('step'); stepTimer.current = sprint ? 0.26 : 0.36; }
    }
    if (grounded.current) {
      let key = '';
      for (const b of world.bridges) {
        if (!b.piano) continue;
        const [x1, z1] = b.from;
        const [x2, z2] = b.to;
        const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
        const inside = alongX
          ? Math.abs(p.z - z1) < 1.9 && p.x >= Math.min(x1, x2) - 0.5 && p.x <= Math.max(x1, x2) + 0.5
          : Math.abs(p.x - x1) < 1.9 && p.z >= Math.min(z1, z2) - 0.5 && p.z <= Math.max(z1, z2) + 0.5;
        if (inside) {
          const d = alongX ? Math.abs(p.x - x1) : Math.abs(p.z - z1);
          const idx = Math.min(C_MAJOR.length - 1, Math.floor(d / PIANO_KEY_LEN));
          key = `${b.from.join()}:${idx}`;
          if (key !== pianoKey.current) playNote(C_MAJOR[idx], 0.4);
        }
      }
      pianoKey.current = key;
    }

    // ===== Kamera orang ketiga =====
    const desired = new Vector3(p.x, p.y + 1.6, p.z);
    camTarget.current.lerp(desired, Math.min(1, dt * 10));
    const pitch = input.camPitch;
    let dist = input.camDist;
    // elak kamera menembusi halangan (pokok, tiang, rumah): pendekkan jarak jika terhalang
    {
      const dirX = Math.sin(input.camYaw);
      const dirZ = Math.cos(input.camYaw);
      const horiz = Math.cos(pitch);
      for (const o of cw.obstacles) {
        if (o.maxY < camTarget.current.y - 0.5) continue;
        const ox = o.x - camTarget.current.x;
        const oz = o.z - camTarget.current.z;
        const along = ox * dirX + oz * dirZ;
        if (along <= 0 || along > dist * horiz) continue;
        const perp = Math.abs(ox * dirZ - oz * dirX);
        if (perp < o.r + 0.35) {
          const camYAt = camTarget.current.y + Math.tan(pitch) * along;
          if (camYAt < o.maxY) dist = Math.max(2.2, Math.min(dist, (along - o.r - 0.3) / Math.max(0.2, horiz)));
        }
      }
    }
    const cx = camTarget.current.x + Math.sin(input.camYaw) * Math.cos(pitch) * dist;
    const cz = camTarget.current.z + Math.cos(input.camYaw) * Math.cos(pitch) * dist;
    let cy = camTarget.current.y + Math.sin(pitch) * dist;
    const floor = topHeight(cw, cx, cz);
    if (floor > -Infinity && cy < floor + 0.8) cy = floor + 0.8;
    camera.position.lerp(new Vector3(cx, cy, cz), Math.min(1, dt * 8));
    camera.lookAt(camTarget.current);

    // ===== Imbasan objek berdekatan =====
    scanTimer.current -= rawDt;
    if (scanTimer.current <= 0 && !blocked) {
      scanTimer.current = 0.1;
      const gs = useGame.getState();
      let best: Nearby | null = null;
      let bestD = Infinity;
      for (const n of world.npcs) {
        const d = Math.hypot(p.x - n.pos[0], p.z - n.pos[2]);
        if (d < 3.2 && Math.abs(p.y - n.pos[1]) < 2.5 && d < bestD) { bestD = d; best = { id: n.id, kind: 'npc', label: n.name }; }
      }
      for (const o of world.objects) {
        if (!isObjectVisible(o, gs)) continue;
        const dx = p.x - o.pos[0];
        const dz = p.z - o.pos[2];
        const dy = p.y - o.pos[1];
        const d = Math.hypot(dx, dz);
        if (o.kind === 'coin' || o.kind === 'collectible' || o.kind === 'crystal') {
          if (d < 1.8 && dy > -1 && dy < 2.8) gs.collectObject(o);
          continue;
        }
        if (o.kind === 'portal') {
          if (d < 1.4 && Math.abs(dy) < 2) { enterPortal(o); continue; }
          if (d < 3.5 && d < bestD) { bestD = d; best = { id: o.id, kind: 'portal', label: o.label ?? 'Portal' }; }
          continue;
        }
        if (o.kind === 'gate' && gs.opened.includes(o.id)) continue;
        const range = o.kind === 'gate' ? 3.4 : 2.8;
        if (d < range && Math.abs(dy) < 2.5 && d < bestD) {
          bestD = d;
          best = { id: o.id, kind: o.kind, label: o.label ?? '' };
        }
      }
      const key = best ? best.id : null;
      if (key !== lastNearby.current) {
        lastNearby.current = key;
        ui.setNearby(best);
      }
    }
    if (input.interactQueued) {
      input.interactQueued = false;
      const n = useUI.getState().nearby;
      if (n && !blocked) interact(n);
    }
  });

  return (
    <group ref={group}>
      <Avatar config={avatar} anim={anim} />
    </group>
  );
}

/** Masa seretan kamera terakhir (untuk auto-ikut kamera) */
export const lastDrag = { t: 0 };
