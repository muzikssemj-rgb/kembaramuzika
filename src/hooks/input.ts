/**
 * Keadaan input dikongsi (papan kekunci + kawalan sentuh).
 * Disimpan sebagai objek boleh-ubah supaya gelung permainan (useFrame) boleh membacanya
 * tanpa memaksa React render semula setiap bingkai.
 */
export const input = {
  forward: 0,   // -1..1 (papan kekunci)
  right: 0,
  joyX: 0,      // -1..1 (joystick)
  joyY: 0,
  sprint: false,
  jumpQueued: false,
  interactQueued: false,
  camYaw: 0,
  camPitch: 0.35,
  camDist: 9,
};

const keys = new Set<string>();

function recompute() {
  const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  const r = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  input.forward = f;
  input.right = r;
  input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
}

export function onKeyDown(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return false;
  keys.add(e.code);
  if (e.code === 'Space' && !e.repeat) input.jumpQueued = true;
  if (e.code === 'KeyE' && !e.repeat) input.interactQueued = true;
  recompute();
  return ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);
}

export function onKeyUp(e: KeyboardEvent) {
  keys.delete(e.code);
  recompute();
}

export function clearInput() {
  keys.clear();
  recompute();
  input.joyX = 0;
  input.joyY = 0;
  input.jumpQueued = false;
  input.interactQueued = false;
}
