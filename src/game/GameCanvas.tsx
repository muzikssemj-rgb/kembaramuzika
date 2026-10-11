import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { useGame } from '../store/gameStore';
import { WORLDS } from '../worlds/worldData';
import { Player, lastDrag } from './Player';
import { NPC } from '../characters/NPC';
import { AmbientParticles, Bridge, Clouds, DecorMesh, IslandMesh, SkyDome } from '../worlds/Scenery';
import { WorldObjects } from '../worlds/WorldObjects';
import { input } from '../hooks/input';
import type { WorldDef } from '../types';

function WorldScene({ world }: { world: WorldDef }) {
  const quality = useGame((s) => s.settings.quality);
  const shadows = quality !== 'rendah';
  const dark = world.id === 'w4';
  return (
    <>
      <SkyDome top={world.sky[0]} bottom={world.sky[1]} />
      <fog attach="fog" args={[world.fog, 45, quality === 'rendah' ? 110 : 160]} />
      <hemisphereLight args={[world.sky[0], world.ground, dark ? 0.7 : 1.1]} />
      <ambientLight intensity={dark ? 0.35 : 0.25} />
      <directionalLight
        position={[30, 45, 20]}
        intensity={dark ? 0.8 : 1.6}
        castShadow={shadows}
        shadow-mapSize={quality === 'tinggi' ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-far={150}
        shadow-bias={-0.0005}
      />
      <Clouds count={quality === 'rendah' ? 5 : 10} color={dark ? '#4c1d95' : '#ffffff'} />
      {world.islands.map((i, k) => <IslandMesh key={k} island={i} world={world} />)}
      {world.bridges.map((b, k) => <Bridge key={k} {...b} />)}
      {world.decor.map((d, k) => <DecorMesh key={k} d={d} />)}
      {world.npcs.map((n) => <NPC key={n.id} npc={n} />)}
      <WorldObjects world={world} />
      <AmbientParticles color={world.accent} count={quality === 'tinggi' ? 70 : quality === 'sederhana' ? 35 : 0} />
      <Player world={world} />
    </>
  );
}

export function GameCanvas() {
  const worldId = useGame((s) => s.world);
  const quality = useGame((s) => s.settings.quality);
  const invertY = useGame((s) => s.settings.invertY);
  const world = WORLDS[worldId];
  const wrap = useRef<HTMLDivElement>(null);

  // seret untuk memutar kamera (tetikus & sentuh), roda untuk zum
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const active = new Map<number, { x: number; y: number }>();
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).tagName !== 'CANVAS') return;
      active.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { el.setPointerCapture(e.pointerId); } catch { /* abaikan */ }
    };
    const move = (e: PointerEvent) => {
      const prev = active.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      active.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const sens = e.pointerType === 'touch' ? 0.008 : 0.005;
      input.camYaw -= dx * sens;
      input.camPitch = Math.max(-0.1, Math.min(1.25, input.camPitch + dy * sens * (invertY ? -1 : 1)));
      lastDrag.t = performance.now();
    };
    const up = (e: PointerEvent) => { active.delete(e.pointerId); };
    const wheel = (e: WheelEvent) => {
      input.camDist = Math.max(4.5, Math.min(16, input.camDist + e.deltaY * 0.01));
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [invertY]);

  return (
    <div ref={wrap} className="absolute inset-0 touch-none" aria-label={`Dunia 3D: ${world.name}`}>
      <Canvas
        shadows={quality !== 'rendah'}
        dpr={quality === 'tinggi' ? [1, 2] : quality === 'sederhana' ? [1, 1.5] : [0.75, 1]}
        camera={{ fov: 55, near: 0.1, far: 900, position: [0, 6, 22] }}
        gl={{ antialias: quality !== 'rendah', powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <WorldScene key={world.id} world={world} />
        </Suspense>
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
