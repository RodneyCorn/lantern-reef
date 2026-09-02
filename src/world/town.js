// Builds Harbor Town from LR.TOWN.
window.LR = window.LR || {};
LR.Town = class Town {
  constructor(scene, terrain, physics) {
    const T = LR.TOWN, P = LR.PALETTE;
    this.group = new THREE.Group(); this.group.name = 'town';
    this.updaters = [];
    const add = (r) => { this.group.add(r.group); for (const b of r.colliders || []) physics.addBox(b); for (const c of r.cylinders || []) physics.addCylinder(c); if (r.update) this.updaters.push(r.update); return r; };
    const foundations = [];
    for (const h of T.houses) {
      // Sit each house on the highest ground under its footprint, with a stone foundation below.
      let y = -Infinity;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) y = Math.max(y, terrain.height(h.x + sx * h.w * 0.45, h.z + sz * h.d * 0.45));
      add(LR.Props.house({ ...h, y: y + 0.05 }));
      foundations.push({ geometry: new THREE.BoxGeometry(h.w + 0.6, 3, h.d + 0.6), position: new THREE.Vector3(h.x, y - 1.4, h.z), rotation: new THREE.Euler(0, h.rot || 0, 0) });
    }
    const fm = new THREE.Mesh(LR.Geo.merge(foundations), LR.Materials.painted('rock', P.rockLight, { repeat: [2, 1] }));
    fm.receiveShadow = true; this.group.add(fm);
    const py = terrain.height(T.plaza.x, T.plaza.z);
    // Plaza paving.
    const paving = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 0.3, 28), LR.Materials.painted('rock', 0xE6D8C4, { repeat: [8, 8] }));
    paving.position.set(T.plaza.x, py + 0.02, T.plaza.z); paving.receiveShadow = true; this.group.add(paving);
    add(LR.Props.fountain({ x: T.fountain.x, y: py + 0.15, z: T.fountain.z }));
    add(LR.Props.bellTower({ x: T.bellTower.x, y: terrain.height(T.bellTower.x, T.bellTower.z), z: T.bellTower.z }));
    for (const s of T.stalls) add(LR.Props.stall({ ...s, y: terrain.height(s.x, s.z) + 0.1 }));
    const trunks = [], leaves = [];
    T.trees.forEach((t, i) => { const b = LR.Props.broadleafPieces(t.x, terrain.height(t.x, t.z), t.z, 600 + i); trunks.push(...b.trunk); leaves.push(...b.leaves); physics.addCylinder({ x: t.x, z: t.z, r: 0.45, y0: -1, y1: terrain.height(t.x, t.z) + b.h }); });
    const tm = new THREE.Mesh(LR.Geo.merge(trunks), LR.Materials.painted('bark', 0x8A6A4A, { repeat: [1, 3] })); tm.castShadow = true; this.group.add(tm);
    const lm = new THREE.Mesh(LR.Geo.merge(leaves), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] })); lm.castShadow = true; this.group.add(lm);
    T.palms.forEach((p, i) => { const r = LR.Props.palm({ ...p, y: terrain.height(p.x, p.z), seed: 400 + i }); this.group.add(r.group); physics.addCylinder(r.collider); });
    add(LR.Props.stonePier(T.pier));
    add(LR.Props.ferry(T.ferry));
    scene.add(this.group);
    this._t = 0;
  }
  update(dt) { this._t += dt; for (const u of this.updaters) u(this._t); }
};
