// Builds Sunrise Cove from LR.COVE.
window.LR = window.LR || {};
LR.Cove = class Cove {
  constructor(scene, terrain, physics) {
    const C = LR.COVE;
    this.group = new THREE.Group(); this.group.name = 'cove';
    this.updaters = [];
    this.docks = [];
    const addColliders = (r) => { for (const b of r.colliders || []) physics.addBox(b); for (const c of r.cylinders || []) physics.addCylinder(c); };

    for (const h of C.huts) {
      const r = LR.Props.hut({ ...h, y: terrain.height(h.x, h.z) - (h.stilt ? 0.2 : 0.15) });
      this.group.add(r.group); addColliders(r);
    }
    for (const d of C.docks) {
      // Walk from the beach point along dir until the shore, then run the dock out over the water.
      const ux = Math.sin(d.dir), uz = Math.cos(d.dir);
      let s = 0; while (s < 80 && terrain.height(d.x + ux * s, d.z + uz * s) > 0.35) s += 0.5;
      const x1 = d.x + ux * (s - 5), z1 = d.z + uz * (s - 5), x2 = x1 + ux * d.len, z2 = z1 + uz * d.len;
      const r = LR.Props.dock({ x1, z1, x2, z2, y: 1.15, groundAt: terrain.height });
      this.group.add(r.group); addColliders(r);
      this.docks.push({ x1, z1, x2, z2, ux, uz, dir: d.dir });
      for (const b of d.boats || []) {
        const bx = x2 - ux * 3 + Math.cos(d.dir) * b.side * 2.6, bz = z2 - uz * 3 - Math.sin(d.dir) * b.side * 2.6;
        const boat = LR.Props.boat({ x: bx, z: bz, rot: d.dir + b.side * 0.25, color: b.color, stripe: b.stripe });
        this.group.add(boat.group); this.updaters.push(boat.update);
      }
    }
    const bt = LR.Props.bigTree({ x: C.bigTree.x, y: terrain.height(C.bigTree.x, C.bigTree.z), z: C.bigTree.z });
    this.group.add(bt.group); addColliders(bt);
    const lp = LR.Props.palm({ ...C.leaningPalm, y: terrain.height(C.leaningPalm.x, C.leaningPalm.z), seed: 7 });
    this.group.add(lp.group); physics.addCylinder(lp.collider);
    // A seat a little way up the leaning trunk, facing the sea.
    const sp = lp.curve.getPoint(0.42), ly = terrain.height(C.leaningPalm.x, C.leaningPalm.z);
    this.leaningSeat = { x: C.leaningPalm.x + sp.x, z: C.leaningPalm.z + sp.z, y: ly - 0.15 + sp.y + 0.3, heading: C.leaningPalm.leanDir };
    C.palms.forEach((p, i) => {
      const r = LR.Props.palm({ ...p, y: terrain.height(p.x, p.z), seed: 200 + i });
      this.group.add(r.group); physics.addCylinder(r.collider);
    });
    const wf = LR.Props.waterfall(terrain, physics, C.waterfall);
    this.group.add(wf.group); this.updaters.push(wf.update);
    const P = LR.PALETTE, rockL = new THREE.Color(P.rockLight), rockD = new THREE.Color(P.rockDark);
    const pieces = C.boulders.map((b, i) => ({ geometry: LR.Props.rockGeometry(b.r, 40 + i), position: new THREE.Vector3(b.x, terrain.height(b.x, b.z) - b.r * 0.2, b.z),
      rotation: new THREE.Euler(0, i * 1.3, 0), color: rockL.clone().lerp(rockD, 0.2 + (i % 3) * 0.2) }));
    const rocks = new THREE.Mesh(LR.Geo.merge(pieces), LR.Materials.painted('rock', 0xffffff, { vertexColors: true, flatShading: true }));
    rocks.castShadow = rocks.receiveShadow = true; this.group.add(rocks);
    for (const b of C.boulders) physics.addCylinder({ x: b.x, z: b.z, r: b.r * 0.85, y0: terrain.height(b.x, b.z) - 1, y1: terrain.height(b.x, b.z) + b.r * 0.6 });
    scene.add(this.group);
    this._t = 0;
  }
  update(dt) { this._t += dt; for (const u of this.updaters) u(this._t); }
};
