// Builds Resort Beach from LR.RESORT.
window.LR = window.LR || {};
LR.Resort = class Resort {
  constructor(scene, terrain, physics) {
    const R = LR.RESORT;
    this.group = new THREE.Group(); this.group.name = 'resort';
    const add = (r) => { this.group.add(r.group); for (const b of r.colliders || []) physics.addBox(b); for (const c of r.cylinders || []) physics.addCylinder(c); return r; };
    let hy = -Infinity;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) hy = Math.max(hy, terrain.height(R.hotel.x + sx * R.hotel.w * 0.45, R.hotel.z + sz * R.hotel.d * 0.45));
    add(LR.Props.hotel({ ...R.hotel, y: hy }));
    const slab = new THREE.Mesh(new THREE.BoxGeometry(R.hotel.w + 8, 2.5, R.hotel.d + 10), LR.Materials.painted('rock', 0xE6D8C4, { repeat: [6, 2] }));
    slab.position.set(R.hotel.x, hy - 1.15, R.hotel.z + 1); slab.receiveShadow = true; this.group.add(slab);
    physics.addBox({ minX: R.hotel.x - R.hotel.w / 2 - 4, maxX: R.hotel.x + R.hotel.w / 2 + 4, minY: hy - 3, maxY: hy + 0.1, minZ: R.hotel.z - R.hotel.d / 2 - 4, maxZ: R.hotel.z + R.hotel.d / 2 + 6 });
    for (const u of R.umbrellas) add(LR.Props.umbrella({ ...u, y: terrain.height(u.x, u.z), rot: (u.x * 0.1) % 1 }));
    add(LR.Props.volleyballNet({ ...R.net, y: terrain.height(R.net.x, R.net.z) }));
    add(LR.Props.rockArch({ ...R.arch, y: 0 }));
    scene.add(this.group);
  }
};
