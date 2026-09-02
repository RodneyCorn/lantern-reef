// Natural things: rocks, bushes, the big tree with its tree house, and the
// waterfall (a scrolling ribbon that hugs the cliff, with mist at the base).
window.LR = window.LR || {};
LR.Props = LR.Props || {};

LR.Props.rockGeometry = function (r, seed) {
  const g = new THREE.IcosahedronGeometry(r, 1);
  LR.Geo.roughen(g, 0.28, seed);
  g.scale(1, 0.65 + LR.Seeded.hash2(seed, 3, 9) * 0.4, 1);
  return g;
};

LR.Props.bush = function (r, seed) {
  const g = new THREE.SphereGeometry(r, 9, 7);
  LR.Geo.roughen(g, 0.12, seed);
  g.scale(1, 0.72, 1);
  return g;
};

// Big banyan-like tree: tapered trunk, roots, branches, a canopy of leaf
// blobs, a plank platform with railing and a small hut, and a spiral of
// plank steps up the trunk so you can climb to the tree house.
LR.Props.bigTree = function (o) {
  const P = LR.PALETTE, g = new THREE.Group(), colliders = [];
  const H = 16, platY = 9.5;
  const rnd = LR.Seeded.rng(99);
  const bark = LR.Materials.painted('bark', 0x8A6A4A, { repeat: [3, 6] });
  const pts = [];
  for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push(new THREE.Vector3(Math.sin(t * 5) * 0.5, H * t, Math.cos(t * 4) * 0.4)); }
  const trunk = new THREE.Mesh(LR.Geo.taperedTube(new THREE.CatmullRomCurve3(pts), 2.5, 1.3, 12, 10), bark);
  trunk.castShadow = trunk.receiveShadow = true; g.add(trunk);
  const rootPieces = [], branchPieces = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rnd() * 0.4, r = 3.5 + rnd() * 1.5;
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a) * 1.6, 2.2, Math.sin(a) * 1.6), new THREE.Vector3(Math.cos(a) * 2.6, 0.9, Math.sin(a) * 2.6), new THREE.Vector3(Math.cos(a) * r, -0.6, Math.sin(a) * r)]);
    rootPieces.push({ geometry: LR.Geo.taperedTube(c, 0.7, 0.25, 6, 6) });
  }
  const canopy = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rnd() * 0.6, y0 = 10.5 + rnd() * 3.5, r = 5.5 + rnd() * 2.5;
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, y0, 0), new THREE.Vector3(Math.cos(a) * r * 0.5, y0 + 1.2, Math.sin(a) * r * 0.5), new THREE.Vector3(Math.cos(a) * r, y0 + 2.6, Math.sin(a) * r)]);
    branchPieces.push({ geometry: LR.Geo.taperedTube(c, 0.7, 0.3, 6, 6) });
    canopy.push({ x: Math.cos(a) * r, y: y0 + 3.2, z: Math.sin(a) * r, r: 3.6 + rnd() * 1.4 });
  }
  canopy.push({ x: 0, y: H + 1.5, z: 0, r: 5.2 });
  canopy.push({ x: 0, y: H - 1.5, z: 0, r: 4.2 });
  const rm = new THREE.Mesh(LR.Geo.merge(rootPieces), bark); rm.castShadow = true; g.add(rm);
  const bm = new THREE.Mesh(LR.Geo.merge(branchPieces), bark); bm.castShadow = true; g.add(bm);
  const leafPieces = canopy.map((c, i) => ({ geometry: LR.Props.bush(c.r, 500 + i), position: new THREE.Vector3(c.x, c.y, c.z), color: new THREE.Color(P.frondLight).lerp(new THREE.Color(P.frondDark), 0.3 + rnd() * 0.45) }));
  const leaves = new THREE.Mesh(LR.Geo.merge(leafPieces), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] }));
  leaves.castShadow = true; g.add(leaves);
  // Platform + railing + hut.
  const plank = LR.Materials.painted('planks', P.trunk, { repeat: [4, 4] });
  const S = 9;
  const plat = new THREE.Mesh(new THREE.BoxGeometry(S, 0.35, S), plank); plat.position.y = platY; plat.castShadow = plat.receiveShadow = true; g.add(plat);
  const rail = [];
  for (let i = 0; i <= 8; i++) for (const side of [[-S / 2, 0], [S / 2, 0], [0, -S / 2], [0, S / 2]]) {
    const t = -S / 2 + (i / 8) * S;
    const px = side[0] !== 0 ? side[0] : t, pz = side[1] !== 0 ? side[1] : t;
    rail.push({ geometry: new THREE.BoxGeometry(0.14, 1.1, 0.14), position: new THREE.Vector3(px, platY + 0.7, pz) });
  }
  for (const [rx, rz, sx, sz] of [[-S / 2, 0, 0.12, S], [S / 2, 0, 0.12, S], [0, -S / 2, S, 0.12], [0, S / 2, S, 0.12]]) {
    rail.push({ geometry: new THREE.BoxGeometry(sx, 0.1, sz), position: new THREE.Vector3(rx, platY + 1.2, rz) });
  }
  const railM = new THREE.Mesh(LR.Geo.merge(rail), LR.Materials.painted('bark', P.driftwood)); g.add(railM);
  const hut = LR.Props.hut({ x: 3.0, y: platY + 0.17, z: -3.0, rot: Math.PI * 0.75, w: 3.2, d: 2.8, h: 2.2, wall: 0xB98A5E });
  g.add(hut.group);
  // Spiral steps around the trunk.
  const steps = [];
  const nSteps = 16;
  for (let i = 0; i < nSteps; i++) {
    const t = i / (nSteps - 1), a = -0.4 + t * Math.PI * 2.1, r = 3.4 - t * 0.6, y = 0.55 + t * (platY - 0.7);
    const px = Math.cos(a) * r, pz = Math.sin(a) * r;
    steps.push({ geometry: new THREE.BoxGeometry(1.7, 0.18, 1.1), position: new THREE.Vector3(px, y, pz), rotation: new THREE.Euler(0, -a, 0) });
    colliders.push({ minX: o.x + px - 0.95, maxX: o.x + px + 0.95, minY: o.y + y - 0.4, maxY: o.y + y + 0.09, minZ: o.z + pz - 0.95, maxZ: o.z + pz + 0.95 });
    // A post under every other step.
    if (i % 2 === 0) steps.push({ geometry: new THREE.CylinderGeometry(0.1, 0.12, y + 0.6, 6), position: new THREE.Vector3(px, y / 2 - 0.3, pz) });
  }
  const stepM = new THREE.Mesh(LR.Geo.merge(steps), plank); stepM.castShadow = true; g.add(stepM);
  g.position.set(o.x, o.y, o.z);
  colliders.push({ minX: o.x - S / 2, maxX: o.x + S / 2, minY: o.y + platY - 0.5, maxY: o.y + platY + 0.18, minZ: o.z - S / 2, maxZ: o.z + S / 2 });
  for (const c of hut.colliders) colliders.push({ minX: c.minX + o.x, maxX: c.maxX + o.x, minY: c.minY + o.y, maxY: c.maxY + o.y, minZ: c.minZ + o.z, maxZ: c.maxZ + o.z });
  const cylinders = [{ x: o.x, z: o.z, r: 2.3, y0: o.y - 1, y1: o.y + platY - 0.6 }, { x: o.x, z: o.z, r: 1.6, y0: o.y + platY, y1: o.y + H }];
  return { group: g, colliders, cylinders, platformY: o.y + platY };
};

// Waterfall: from a pool point up the cliff toward a hill center, following
// the terrain surface. Returns { group, update }.
LR.Props.waterfall = function (terrain, physics, o) {
  const g = new THREE.Group();
  // March from the pool toward the hill until the cliff tops out.
  const dx = o.hillX - o.poolX, dz = o.hillZ - o.poolZ, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  let topDist = 0, prev = terrain.height(o.poolX, o.poolZ);
  for (let s = 1; s < L; s += 1) {
    const h = terrain.height(o.poolX + ux * s, o.poolZ + uz * s);
    if (h >= o.topHeight || (s > 6 && h > 5 && h - prev < 0.1)) { topDist = s; break; }
    prev = h; topDist = s;
  }
  const N = 18, W = o.width || 6;
  const build = (offset) => {
    const pos = [], uv = [], idx = [], n = new THREE.Vector3();
    for (let i = 0; i <= N; i++) {
      const t = i / N, s = topDist * t;
      const x = o.poolX + ux * s, z = o.poolZ + uz * s;
      physics.groundNormal(x, z, n);
      const y = Math.max(terrain.height(x, z), -0.3);
      const ox = x + n.x * offset, oy = y + n.y * offset, oz = z + n.z * offset;
      const widen = 1 + (1 - t) * 0.6;  // fans out toward the pool
      pos.push(ox - uz * W / 2 * widen, oy, oz + ux * W / 2 * widen, ox + uz * W / 2 * widen, oy, oz - ux * W / 2 * widen);
      uv.push(0, t * 3, 1, t * 3);
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  };
  const tex1 = LR.Textures.waterfall().clone(), tex2 = LR.Textures.waterfall().clone();
  tex1.needsUpdate = tex2.needsUpdate = true; tex2.repeat.set(1.7, 1);
  const mat1 = new THREE.MeshBasicMaterial({ map: tex1, color: 0xDDF6FF, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
  const mat2 = new THREE.MeshBasicMaterial({ map: tex2, color: 0xBFEFFF, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const m1 = new THREE.Mesh(build(0.45), mat1), m2 = new THREE.Mesh(build(0.9), mat2);
  m1.renderOrder = m2.renderOrder = 6; g.add(m1); g.add(m2);
  // Mist at the base: soft sprites that rise and fade.
  const mist = [];
  const mistMat = new THREE.SpriteMaterial({ map: LR.Textures.sunGlint(), transparent: true, opacity: 0.5, depthWrite: false, color: 0xf0fbff });
  const rnd = LR.Seeded.rng(12);
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(mistMat.clone());
    s.userData = { phase: rnd() * 4, x: o.poolX + (rnd() - 0.5) * W * 1.4, z: o.poolZ + (rnd() - 0.5) * W * 1.0, size: 2.5 + rnd() * 3 };
    g.add(s); mist.push(s);
  }
  return {
    group: g,
    update: (t) => {
      tex1.offset.y = -t * 1.4; tex2.offset.y = -t * 0.9;
      for (const s of mist) {
        const k = ((t * 0.5 + s.userData.phase) % 1);
        s.position.set(s.userData.x + ux * 1.5, -0.2 + k * 4.5, s.userData.z + uz * 1.5);
        const sz = s.userData.size * (0.6 + k);
        s.scale.set(sz, sz, 1); s.material.opacity = 0.45 * (1 - k) * Math.min(1, k * 4);
      }
    },
    top: { x: o.poolX + ux * topDist, z: o.poolZ + uz * topDist },
  };
};
