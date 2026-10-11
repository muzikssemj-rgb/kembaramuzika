import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Clef, NoteName } from '../types';
import { staffStep } from './music';

const cache = new Map<string, CanvasTexture>();

export const MUSIC_FONT = '"Noto Music", "Bravura", "Segoe UI Symbol", "Apple Symbols", serif';

/** Pastikan fon simbol muzik dimuatkan sebelum melukis pada kanvas */
export async function ensureMusicFont() {
  try {
    await document.fonts.load(`64px "Noto Music"`, '𝄞𝄢');
  } catch {
    /* abaikan */
  }
}

/** Tekstur baluk kecil dengan satu not (untuk Batu Not dan papan tanda) */
export function staffNoteTexture(note: NoteName | null, clef: Clef, title: string, bg = '#fffbeb'): CanvasTexture {
  const key = `${note}|${clef}|${title}|${bg}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 384;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#7c2d12';
  g.lineWidth = 10;
  g.strokeRect(5, 5, c.width - 10, c.height - 10);
  g.fillStyle = '#4c1d95';
  g.font = 'bold 38px Nunito, sans-serif';
  g.textAlign = 'center';
  g.fillText(title, c.width / 2, 58);
  const gap = 26;
  const bottom = 290;
  g.strokeStyle = '#1e1b4b';
  g.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.moveTo(40, bottom - i * gap);
    g.lineTo(c.width - 40, bottom - i * gap);
    g.stroke();
  }
  g.fillStyle = '#1e1b4b';
  g.textAlign = 'left';
  if (clef === 'treble') {
    g.font = `${gap * 4.5}px ${MUSIC_FONT}`;
    g.fillText('𝄞', 48, bottom - gap * 1 + gap * 1.1);
  } else {
    g.font = `${gap * 4.5}px ${MUSIC_FONT}`;
    g.fillText('𝄢', 50, bottom - gap * 3 + gap * 2.83);
  }
  if (note) {
    const step = staffStep(note, clef);
    const x = 320;
    const y = bottom - (step * gap) / 2;
    // garisan tambahan
    g.lineWidth = 3;
    for (let s = -2; s >= step; s -= 2) {
      g.beginPath(); g.moveTo(x - 30, bottom - (s * gap) / 2); g.lineTo(x + 30, bottom - (s * gap) / 2); g.stroke();
    }
    for (let s = 10; s <= step; s += 2) {
      g.beginPath(); g.moveTo(x - 30, bottom - (s * gap) / 2); g.lineTo(x + 30, bottom - (s * gap) / 2); g.stroke();
    }
    g.save();
    g.translate(x, y);
    g.rotate(-0.35);
    g.beginPath();
    g.ellipse(0, 0, gap * 0.68, gap * 0.48, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
    // batang
    g.lineWidth = 4;
    g.beginPath();
    if (step >= 4) { g.moveTo(x - gap * 0.62, y + 4); g.lineTo(x - gap * 0.62, y + gap * 3.4); }
    else { g.moveTo(x + gap * 0.62, y - 4); g.lineTo(x + gap * 0.62, y - gap * 3.4); }
    g.stroke();
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

/** Tekstur teks ringkas (papan tanda) */
export function signTexture(lines: string[], bg = '#fef3c7', fg = '#7c2d12'): CanvasTexture {
  const key = `sign|${lines.join('|')}|${bg}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.font = 'bold 54px Nunito, sans-serif';
  g.fillText(lines[0], 256, 110);
  g.font = '600 34px Nunito, sans-serif';
  if (lines[1]) g.fillText(lines[1], 256, 175);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export function clearTextureCache() {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
