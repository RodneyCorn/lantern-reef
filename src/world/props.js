// Gray-box props for milestone 1: docks and blocks you can stand on, and
// the Long Pier, all registered with physics. Real props come in M3.
window.LR = window.LR || {};
LR.GrayboxProps = class GrayboxProps {
  constructor(scene, physics, terrain) {
    this.group = new THREE.Group();
    this.group.name = 'graybox';
    const wood = new THREE.MeshLambertMaterial({ color: LR.PALETTE.trunk });
    const stone = new THREE.MeshLambertMaterial({ color: LR.PALETTE.rockLight });
    const post = new THREE.MeshLambertMaterial({ color: LR.PALETTE.driftwood });
    for (const p of LR.ISLAND.grayboxProps) {
      if (p.kind === 'dock') this._plank(scene, physics, terrain, wood, post, p.x, p.z, p.x + Math.sin(p.dir) * p.len, p.z + Math.cos(p.dir) * p.len, p.w, 1.1);
      else if (p.kind === 'pier') this._plank(scene, physics, terrain, wood, post, p.x1, p.z1, p.x2, p.z2, p.w, 1.6);
      else if (p.kind === 'block') {
        const y0 = terrain.height(p.x, p.z);
        const m = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), stone);
        m.position.set(p.x, y0 + p.h / 2, p.z); m.castShadow = m.receiveShadow = true;
        this.group.add(m);
        physics.addBox({ minX: p.x - p.w / 2, maxX: p.x + p.w / 2, minY: y0, maxY: y0 + p.h, minZ: p.z - p.d / 2, maxZ: p.z + p.d / 2 });
      }
    }
    scene.add(this.group);
  }
  // A straight deck from (x1,z1) to (x2,z2) at height y, on posts. Physics
  // gets it as a chain of axis-aligned boxes so the player can walk it.
  _plank(scene, physics, terrain, wood, post, x1, z1, x2, z2, w, y) {
    const len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(x2 - x1, z2 - z1);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, len), wood);
    deck.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); deck.rotation.y = ang;
    deck.castShadow = deck.receiveShadow = true;
    this.group.add(deck);
    const segs = Math.ceil(len / 3);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, cx = x1 + (x2 - x1) * t, cz = z1 + (z2 - z1) * t;
      const half = Math.max(w, 3) / 2 + 0.2;
      physics.addBox({ minX: cx - half, maxX: cx + half, minY: y - 0.15 - 3, maxY: y + 0.15, minZ: cz - half, maxZ: cz + half });
      if (i % 2 === 0) {
        for (const side of [-1, 1]) {
          const px = cx + Math.cos(ang) * side * (w / 2 - 0.3), pz = cz - Math.sin(ang) * side * (w / 2 - 0.3);
          const bottom = Math.min(terrain.height(px, pz), y) - 1;
          const h = y + 0.6 - bottom;
          const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, h, 8), post);
          m.position.set(px, bottom + h / 2, pz); m.castShadow = true;
          this.group.add(m);
        }
      }
    }
  }
};
