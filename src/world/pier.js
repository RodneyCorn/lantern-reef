// Builds the Long Pier and the islet with the Sun Gate from LR.PIER.
window.LR = window.LR || {};
LR.Pier = class Pier {
  constructor(scene, terrain, physics) {
    const D = LR.PIER;
    this.group = new THREE.Group(); this.group.name = 'pier';
    const dx = D.to.x - D.from.x, dz = D.to.z - D.from.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
    // Start where the beach meets the water; end at the islet's shore.
    let s0 = 0; while (s0 < L && terrain.height(D.from.x + ux * s0, D.from.z + uz * s0) > 0.35) s0 += 0.5;
    let s1 = L; while (s1 > 0 && terrain.height(D.from.x + ux * s1, D.from.z + uz * s1) > 0.35) s1 -= 0.5;
    const x1 = D.from.x + ux * (s0 - 6), z1 = D.from.z + uz * (s0 - 6), x2 = D.from.x + ux * (s1 + 5), z2 = D.from.z + uz * (s1 + 5);
    const dock = LR.Props.dock({ x1, z1, x2, z2, y: D.y, w: D.w, groundAt: terrain.height });
    this.group.add(dock.group); for (const b of dock.colliders) physics.addBox(b);
    const gy = terrain.height(D.sunGate.x, D.sunGate.z);
    const gate = LR.Props.sunGate({ x: D.sunGate.x, y: gy, z: D.sunGate.z, rot: Math.atan2(-ux, -uz) });
    this.group.add(gate.group); for (const c of gate.cylinders) physics.addCylinder(c);
    D.palms.forEach((p, i) => { const r = LR.Props.palm({ ...p, y: terrain.height(p.x, p.z), seed: 500 + i }); this.group.add(r.group); physics.addCylinder(r.collider); });
    this.start = { x: x1, z: z1 }; this.end = { x: x2, z: z2 };
    scene.add(this.group);
  }
};
