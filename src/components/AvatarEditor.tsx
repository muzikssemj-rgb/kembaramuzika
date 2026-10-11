import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Check, Shuffle } from 'lucide-react';
import type { AvatarConfig } from '../types';
import { Avatar } from '../characters/Avatar';
import { GlowButton } from './ui';

const BODY = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];
const SKIN = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'];
const ACCENT = ['#fde047', '#f472b6', '#67e8f9', '#a3e635', '#fdba74', '#ffffff'];
const HATS: [AvatarConfig['hat'], string][] = [['cap', 'Topi'], ['headphones', 'Fon Kepala'], ['beret', 'Beret'], ['crown', 'Mahkota'], ['none', 'Tiada']];

export function AvatarEditor({ initial, onConfirm, confirmLabel }: { initial: AvatarConfig; onConfirm: (a: AvatarConfig) => void; confirmLabel: string }) {
  const [a, setA] = useState<AvatarConfig>(initial);
  const swatch = (colors: string[], key: 'body' | 'skin' | 'accent', label: string) => (
    <div>
      <div className="mb-1 text-sm font-bold text-white/80">{label}</div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {colors.map((c) => (
          <button key={c} role="radio" aria-checked={a[key] === c} aria-label={c} onClick={() => setA({ ...a, [key]: c })}
            className={`h-9 w-9 rounded-full border-2 transition ${a[key] === c ? 'scale-110 border-white ring-4 ring-amber-300/60' : 'border-white/30 hover:scale-105'}`} style={{ background: c }} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-64 overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-sky-300/40 to-violet-500/40 md:h-[360px]">
        <Canvas camera={{ position: [0, 1.4, 4.2], fov: 40 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 5, 4]} intensity={1.4} />
          <group position-y={-0.9}>
            <Avatar config={a} idleWave />
            <mesh rotation-x={-Math.PI / 2}>
              <circleGeometry args={[1.2, 32]} />
              <meshStandardMaterial color="#c4b5fd" />
            </mesh>
          </group>
          <OrbitControls enablePan={false} enableZoom={false} target={[0, 0.2, 0]} autoRotate autoRotateSpeed={1.5} />
        </Canvas>
      </div>
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-white/80">Nama Penjelajah</span>
          <input value={a.name} maxLength={16} onChange={(e) => setA({ ...a, name: e.target.value })}
            className="w-full rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 font-display text-xl font-bold text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-amber-300" placeholder="Nama kamu" />
        </label>
        {swatch(BODY, 'body', 'Warna baju')}
        {swatch(SKIN, 'skin', 'Warna kulit')}
        {swatch(ACCENT, 'accent', 'Warna aksesori')}
        <div>
          <div className="mb-1 text-sm font-bold text-white/80">Aksesori kepala</div>
          <div className="flex flex-wrap gap-2">
            {HATS.map(([h, l]) => (
              <button key={h} onClick={() => setA({ ...a, hat: h })}
                className={`rounded-xl px-3 py-1.5 text-sm font-bold ${a.hat === h ? 'bg-amber-300 text-amber-950' : 'bg-white/10 hover:bg-white/20'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="mt-auto flex gap-2">
          <GlowButton variant="secondary" onClick={() => setA({
            ...a, body: BODY[Math.floor(Math.random() * BODY.length)], skin: SKIN[Math.floor(Math.random() * SKIN.length)],
            accent: ACCENT[Math.floor(Math.random() * ACCENT.length)], hat: HATS[Math.floor(Math.random() * HATS.length)][0],
          })} ariaLabel="Rawak"><Shuffle size={18} /></GlowButton>
          <GlowButton className="flex-1" disabled={!a.name.trim()} onClick={() => onConfirm({ ...a, name: a.name.trim() })}><Check size={20} />{confirmLabel}</GlowButton>
        </div>
      </div>
    </div>
  );
}
