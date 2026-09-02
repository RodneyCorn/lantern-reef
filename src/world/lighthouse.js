// Builds Lighthouse Point from LR.LIGHTHOUSE.
window.LR = window.LR || {};
LR.Lighthouse = class Lighthouse {
  constructor(scene, terrain, physics) {
    const D = LR.LIGHTHOUSE;
    this.group = new THREE.Group(); this.group.name = 'lighthouse';
    const ty = terrain.height(D.tower.x, D.tower.z);
    this.tower = LR.Props.lighthouse({ x: D.tower.x, y: ty, z: D.tower.z });
    this.group.add(this.tower.group);
    for (const b of this.tower.colliders) physics.addBox(b);
    for (const c of this.tower.cylinders) physics.addCylinder(c);
    let cy = -Infinity;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) cy = Math.max(cy, terrain.height(D.cottage.x + sx * D.cottage.w * 0.45, D.cottage.z + sz * D.cottage.d * 0.45));
    const cottage = LR.Props.house({ ...D.cottage, y: cy });
    this.group.add(cottage.group); for (const b of cottage.colliders) physics.addBox(b);
    const trunks = [], leaves = [];
    D.trees.forEach((t, i) => { const b = LR.Props.broadleafPieces(t.x, terrain.height(t.x, t.z), t.z, 700 + i); trunks.push(...b.trunk); leaves.push(...b.leaves); });
    this.group.add(new THREE.Mesh(LR.Geo.merge(trunks), LR.Materials.painted('bark', 0x8A6A4A, { repeat: [1, 3] })));
    this.group.add(new THREE.Mesh(LR.Geo.merge(leaves), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] })));
    scene.add(this.group);
    this._t = 0;
  }
  update(dt, night) { this._t += dt; this.tower.update(this._t, night); }
};
