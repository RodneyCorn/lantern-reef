// Built things: thatched huts, plank docks with rope rails, rowboats.
window.LR = window.LR || {};
LR.Props = LR.Props || {};

// Hut: plank walls, a four-sided thatch roof, a door, a window, an
// optional stilt platform. Returns { group, colliders, update? }.
LR.Props.hut = function (o) {
  const P = LR.PALETTE, g = new THREE.Group();
  const w = o.w || 5, d = o.d || 4.5, h = o.h || 2.6, stilt = o.stilt ? 1.2 : 0;
  const wallMat = LR.Materials.painted('planks', o.wall || 0xC8996A, { repeat: [2, 1.2] });
  const thatchMat = LR.Materials.painted('thatch', P.thatch, { repeat: [3, 2] });
  const dark = LR.Materials.flat(0x2A1E14);
  const post = LR.Materials.painted('bark', P.driftwood);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  walls.position.y = stilt + h / 2; walls.castShadow = walls.receiveShadow = true; g.add(walls);
  const roofH = 2.3, roofR = Math.max(w, d) * 1.0;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(roofR, roofH, 4, 1), thatchMat);
  roof.position.y = stilt + h + roofH / 2 - 0.1; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  // Thatch skirt under the eaves so the roof reads thick.
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(roofR * 1.02, roofR * 1.02, 0.3, 4, 1, true), thatchMat);
  skirt.position.y = stilt + h - 0.05; skirt.rotation.y = Math.PI / 4; g.add(skirt);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.85, 0.12), dark);
  door.position.set(w * 0.15, stilt + 0.95, d / 2 + 0.02); g.add(door);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.8), dark);
  win.position.set(w / 2 + 0.02, stilt + h * 0.6, -d * 0.1); g.add(win);
  const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.45), LR.Materials.flat(o.trim || P.roofBlue));
  shutter.position.set(w / 2 + 0.06, stilt + h * 0.6, -d * 0.1 - 0.62); g.add(shutter);
  if (stilt) {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(w + 1.6, 0.25, d + 1.6), LR.Materials.painted('planks', P.trunk, { repeat: [3, 3] }));
    deck.position.y = stilt - 0.12; deck.receiveShadow = true; g.add(deck);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, stilt + 0.6, 7), post);
      p.position.set(sx * (w / 2 + 0.5), stilt / 2 - 0.3, sz * (d / 2 + 0.5)); g.add(p);
    }
    const steps = new THREE.Mesh(new THREE.BoxGeometry(1.4, stilt, 1.4), LR.Materials.painted('planks', P.trunk));
    steps.position.set(w * 0.15, stilt / 2, d / 2 + 1.5); steps.rotation.x = 0.0; g.add(steps);
  }
  g.position.set(o.x, o.y, o.z); g.rotation.y = o.rot || 0;
  g.updateMatrixWorld(true);
  // Collider: an axis-aligned box big enough for the rotated footprint.
  const hw = (Math.abs(Math.cos(o.rot || 0)) * w + Math.abs(Math.sin(o.rot || 0)) * d) / 2 + (stilt ? 0.8 : 0.1);
  const hd = (Math.abs(Math.sin(o.rot || 0)) * w + Math.abs(Math.cos(o.rot || 0)) * d) / 2 + (stilt ? 0.8 : 0.1);
  const colliders = [{ minX: o.x - hw, maxX: o.x + hw, minY: o.y - 1, maxY: o.y + stilt + h + roofH * 0.55, minZ: o.z - hd, maxZ: o.z + hd }];
  return { group: g, colliders };
};

// Dock: boards across the walkway, posts, rope rails. From (x1,z1) to (x2,z2) at height y.
LR.Props.dock = function (o) {
  const P = LR.PALETTE;
  const { x1, z1, x2, z2 } = o, y = o.y != null ? o.y : 1.1, w = o.w || 3.2;
  const len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(x2 - x1, z2 - z1);
  const g = new THREE.Group();
  g.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); g.rotation.y = ang;
  const boards = [], posts = [], ropes = [];
  const rnd = LR.Seeded.rng(Math.round(x1 * 3 + z1 * 7));
  const bw = 0.34;
  for (let s = -len / 2; s < len / 2; s += bw + 0.05) {
    const shade = 0.85 + rnd() * 0.3;
    boards.push({ geometry: new THREE.BoxGeometry(w, 0.12, bw), position: new THREE.Vector3(0, 0, s + bw / 2), color: new THREE.Color(shade, shade, shade) });
  }
  const postMat = LR.Materials.painted('bark', P.driftwood);
  const groundAt = o.groundAt || (() => -3);
  for (let s = -len / 2; s <= len / 2 + 0.01; s += 3) {
    for (const side of [-1, 1]) {
      const lx = side * (w / 2 - 0.12);
      // World position of this post to find the sea floor under it.
      const wx = g.position.x + Math.cos(ang) * lx + Math.sin(ang) * s, wz = g.position.z - Math.sin(ang) * lx + Math.cos(ang) * s;
      const bottom = Math.min(groundAt(wx, wz), y) - 1.5;
      const h = y + 1.0 - bottom;
      posts.push({ geometry: new THREE.CylinderGeometry(0.14, 0.17, h, 7), position: new THREE.Vector3(lx, (bottom + h / 2) - y, s) });
    }
    if (s + 3 <= len / 2 + 0.01) for (const side of [-1, 1]) {
      ropes.push({ geometry: new THREE.CylinderGeometry(0.035, 0.035, 3, 5), position: new THREE.Vector3(side * (w / 2 - 0.12), 0.85, s + 1.5), rotation: new THREE.Euler(Math.PI / 2, 0, 0), color: new THREE.Color(0xE8DCC0) });
    }
  }
  const deck = new THREE.Mesh(LR.Geo.merge(boards), LR.Materials.painted('planks', P.trunk, { vertexColors: true, repeat: [1, 0.5] }));
  deck.castShadow = deck.receiveShadow = true; g.add(deck);
  const pm = new THREE.Mesh(LR.Geo.merge(posts), postMat); pm.castShadow = true; g.add(pm);
  const rm = new THREE.Mesh(LR.Geo.merge(ropes), LR.Materials.flat(0xffffff, { vertexColors: true })); g.add(rm);
  // Colliders: chain of boxes along the walkway.
  const colliders = [];
  const segs = Math.ceil(len / 3);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, cx = x1 + (x2 - x1) * t, cz = z1 + (z2 - z1) * t, half = w / 2 + 0.3;
    colliders.push({ minX: cx - half, maxX: cx + half, minY: y - 3, maxY: y + 0.06, minZ: cz - half, maxZ: cz + half });
  }
  return { group: g, colliders, end: { x: x2, z: z2, ang } };
};

// Rowboat: an extruded hull outline with a seat, bobbing on the water.
LR.Props.boat = function (o) {
  const P = LR.PALETTE;
  const shape = new THREE.Shape();
  shape.moveTo(0, -1.6); shape.quadraticCurveTo(0.95, -1.2, 0.85, 0.2); shape.quadraticCurveTo(0.8, 1.2, 0.5, 1.5);
  shape.lineTo(-0.5, 1.5); shape.quadraticCurveTo(-0.8, 1.2, -0.85, 0.2); shape.quadraticCurveTo(-0.95, -1.2, 0, -1.6);
  const hullGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 2 });
  hullGeo.rotateX(-Math.PI / 2);
  const g = new THREE.Group();
  const hull = new THREE.Mesh(hullGeo, LR.Materials.painted('planks', o.color || 0xF4EBD3, { repeat: [2, 2] }));
  hull.position.y = -0.55; hull.castShadow = true; g.add(hull);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 2.4), LR.Materials.flat(0x6B4A2E));
  inner.position.y = 0.05; g.add(inner);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.35), LR.Materials.painted('planks', P.trunk));
  seat.position.y = 0.3; g.add(seat);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 3.2), LR.Materials.flat(o.stripe || P.roofRed));
  stripe.position.y = 0.02; stripe.scale.set(1.0, 1, 1); g.add(stripe);
  g.position.set(o.x, 0.05, o.z); g.rotation.y = o.rot || 0;
  const phase = (o.x * 0.7 + o.z * 0.3);
  return { group: g, update: (t) => { g.position.y = 0.02 + Math.sin(t * 1.3 + phase) * 0.07; g.rotation.z = Math.sin(t * 0.9 + phase) * 0.03; g.rotation.x = Math.cos(t * 1.1 + phase) * 0.025; } };
};
