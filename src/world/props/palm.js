// Palm trees: a curved tapered trunk, a crown of drooping geometry fronds
// with two-tone vertex colors, and a few coconuts. `lean` bends the whole
// tree over (the leaning palm you can sit on is just a big lean).
window.LR = window.LR || {};
LR.Props = LR.Props || {};
LR.Props.frondGeometry = function (len, wmax, droop, seed) {
  const N = 9, pos = [], col = [], uv = [], idx = [];
  const light = new THREE.Color(LR.PALETTE.frondLight), dark = new THREE.Color(LR.PALETTE.frondDark);
  const rnd = LR.Seeded.rng(seed);
  const tint = 0.85 + rnd() * 0.3;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const w = wmax * Math.pow(1 - t, 0.6) * Math.min(1, t * 6 + 0.15);
    const y = -droop * t * t * len, x = t * len;
    // Center spine, then left/right edges dropped a little (V-shaped leaf).
    pos.push(x, y, -w, x, y + w * 0.35, 0, x, y, w);
    const cE = dark.clone().multiplyScalar(tint), cC = light.clone().multiplyScalar(tint);
    col.push(cE.r, cE.g, cE.b, cC.r, cC.g, cC.b, cE.r, cE.g, cE.b);
    uv.push(t * 2, 0, t * 2, 0.5, t * 2, 1);
    if (i < N) { const a = i * 3; idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
};

// Returns { group, collider } for a palm at ground point (x, y, z).
LR.Props.palm = function (opts) {
  const { x, y, z } = opts;
  const seed = opts.seed || 1;
  const rnd = LR.Seeded.rng(seed);
  const H = opts.height || 7 + rnd() * 4;
  const lean = opts.lean != null ? opts.lean : 0.6 + rnd() * 1.6;
  const leanDir = opts.leanDir != null ? opts.leanDir : rnd() * Math.PI * 2;
  const lx = Math.sin(leanDir) * lean, lz = Math.cos(leanDir) * lean;
  const pts = [];
  for (let i = 0; i <= 4; i++) { const t = i / 4; pts.push(new THREE.Vector3(lx * t * t, H * t, lz * t * t)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const trunk = new THREE.Mesh(LR.Geo.taperedTube(curve, 0.34, 0.2, 8, 7),
    LR.Materials.painted('bark', LR.PALETTE.trunk, { repeat: [1, 5] }));
  trunk.castShadow = true;
  const group = new THREE.Group();
  group.add(trunk);
  // Crown at the trunk tip, tilted with the trunk's tangent.
  const top = curve.getPoint(1), tan = curve.getTangent(1);
  const crown = new THREE.Group();
  crown.position.copy(top);
  crown.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan.normalize());
  const n = opts.fronds || 8 + Math.floor(rnd() * 3);
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const g = LR.Props.frondGeometry(2.9 + rnd() * 1.2, 0.6 + rnd() * 0.2, 0.55 + rnd() * 0.4, seed * 31 + i);
    const rot = new THREE.Euler(0, (i / n) * Math.PI * 2 + rnd() * 0.5, 0.25 + rnd() * 0.55, 'YXZ');
    pieces.push({ geometry: g, rotation: rot, position: new THREE.Vector3(0, 0.15, 0) });
  }
  for (let i = 0; i < 3; i++) {
    const a = rnd() * Math.PI * 2;
    pieces.push({ geometry: new THREE.SphereGeometry(0.17, 7, 6), position: new THREE.Vector3(Math.cos(a) * 0.3, -0.15, Math.sin(a) * 0.3), color: new THREE.Color(LR.PALETTE.driftwood) });
  }
  const fronds = new THREE.Mesh(LR.Geo.merge(pieces), LR.Materials.painted('leaf', 0xffffff, { side: THREE.DoubleSide, vertexColors: true }));
  fronds.castShadow = true;
  crown.add(fronds);
  group.add(crown);
  group.position.set(x, y - 0.15, z);
  group.rotation.y = rnd() * Math.PI * 2;   // spins the lean direction too; fine for scatter
  if (opts.leanDir != null) group.rotation.y = 0;
  return { group, collider: { x, z, r: 0.42, y0: y - 1, y1: y + 2.6 } };
};
