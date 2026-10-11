/** Kedudukan pemain dikongsi (dibaca oleh NPC, minimap, dll. tanpa render semula React) */
export const playerPos = { x: 0, y: 0, z: 0, yaw: 0 };

/** Permintaan teleport (digunakan oleh ujian automatik / alat guru) */
export const teleportReq: { pos: [number, number, number] | null } = { pos: null };
