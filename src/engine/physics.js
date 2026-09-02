// Ground sampling and a small capsule-vs-prop collision system.
// The ground is the analytic terrain function (see world/terrain.js), so
// physics and the visible mesh can never disagree.
window.LR = window.LR || {};
LR.Physics = class Physics {
  constructor(heightFn) {
    this.height = heightFn;           // (x, z) -> y
    this.boxes = [];                  // { minX, maxX, minY, maxY, minZ, maxZ }
    this.cylinders = [];              // { x, z, r, y0, y1 }
    this._n = new THREE.Vector3();
  }
  addBox(b) { this.boxes.push(b); return b; }
  addCylinder(c) { this.cylinders.push(c); return c; }

  groundNormal(x, z, out) {
    const e = 0.6;
    const hl = this.height(x - e, z), hr = this.height(x + e, z);
    const hd = this.height(x, z - e), hu = this.height(x, z + e);
    out = out || this._n;
    out.set(hl - hr, 2 * e, hd - hu).normalize();
    return out;
  }

  // Highest walkable surface under (x, z) at or below `y + stepUp`:
  // terrain, or the top of a prop the capsule is standing on.
  floorAt(x, z, y, radius, stepUp) {
    let best = this.height(x, z);
    for (const b of this.boxes) {
      if (x > b.minX - radius && x < b.maxX + radius && z > b.minZ - radius && z < b.maxZ + radius) {
        if (b.maxY <= y + stepUp && b.maxY > best) best = b.maxY;
      }
    }
    for (const c of this.cylinders) {
      if (Math.hypot(x - c.x, z - c.z) < c.r + radius && c.y1 <= y + stepUp && c.y1 > best) best = c.y1;
    }
    return best;
  }

  // Push a capsule (feet at pos, radius r, height h) out of props sideways.
  resolve(pos, r, h) {
    const feet = pos.y, head = pos.y + h;
    for (const b of this.boxes) {
      if (head <= b.minY || feet >= b.maxY - 0.05) continue;     // above or below it
      const cx = Math.max(b.minX, Math.min(pos.x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
      let dx = pos.x - cx, dz = pos.z - cz;
      let d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d < 1e-4) {                                             // inside: exit the nearest face
        const ex = Math.min(pos.x - b.minX, b.maxX - pos.x), ez = Math.min(pos.z - b.minZ, b.maxZ - pos.z);
        if (ex < ez) { dx = pos.x - b.minX < b.maxX - pos.x ? -1 : 1; dz = 0; }
        else { dz = pos.z - b.minZ < b.maxZ - pos.z ? -1 : 1; dx = 0; }
        d = 0;
      } else { dx /= d; dz /= d; }
      pos.x += dx * (r - d); pos.z += dz * (r - d);
    }
    for (const c of this.cylinders) {
      if (head <= c.y0 || feet >= c.y1 - 0.05) continue;
      let dx = pos.x - c.x, dz = pos.z - c.z;
      const d = Math.hypot(dx, dz), want = c.r + r;
      if (d >= want) continue;
      if (d < 1e-4) { dx = 1; dz = 0; } else { dx /= d; dz /= d; }
      pos.x += dx * (want - d); pos.z += dz * (want - d);
    }
  }
};
