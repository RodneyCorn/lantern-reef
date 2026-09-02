// Island-wide scatter, all seeded: grass tufts, bushes, rocks on the cliffs
// and shore, palms along the beaches. Everything merges into a handful of
// draw calls except the palms.
window.LR = window.LR || {};
LR.Scatter = class Scatter {
  constructor(scene, terrain, physics) {
    const P = LR.PALETTE, D = LR.ISLAND;
    this.group = new THREE.Group(); this.group.name = 'scatter';
    const n = new THREE.Vector3();
    const rnd = LR.Seeded.rng(D.seed + 77);
    const inZone = (x, z, id) => { const zn = terrain.zoneAt(x, z); return zn && zn.id === id; };
    const sample = (count, accept) => {
      const out = [];
      let tries = 0;
      while (out.length < count && tries++ < count * 40) {
        const x = (rnd() - 0.5) * 640, z = (rnd() - 0.5) * 460;
        const y = terrain.height(x, z);
        physics.groundNormal(x, z, n);
        if (accept(x, y, z, n)) out.push({ x, y, z, ny: n.y });
      }
      return out;
    };

    // Grass tufts: instanced cross-quads.
    const tufts = sample(4500, (x, y, z, n) => y > 2.7 && n.y > 0.72 && !inZone(x, z, 'town'));
    const quad = new THREE.PlaneGeometry(1.2, 0.9); quad.translate(0, 0.42, 0);
    const cross = LR.Geo.merge([{ geometry: quad }, { geometry: quad, rotation: new THREE.Euler(0, Math.PI / 2, 0) }]);
    const tuftMat = new THREE.MeshLambertMaterial({ map: LR.Textures.tuft(), transparent: true, alphaTest: 0.45, side: THREE.DoubleSide });
    const inst = new THREE.InstancedMesh(cross, tuftMat, tufts.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    tufts.forEach((t, i) => {
      const k = 1.1 + rnd() * 1.0;
      e.set(0, rnd() * Math.PI, 0); q.setFromEuler(e); s.set(k, k, k); p.set(t.x, t.y - 0.05, t.z);
      inst.setMatrixAt(i, m.compose(p, q, s));
    });
    inst.instanceMatrix.needsUpdate = true;
    this.group.add(inst);

    // Bushes.
    const bushes = sample(260, (x, y, z, n) => y > 2.6 && n.y > 0.78 && !inZone(x, z, 'town'));
    const bushPieces = bushes.map((b, i) => ({ geometry: LR.Props.bush(0.9 + rnd() * 1.6, 900 + i), position: new THREE.Vector3(b.x, b.y - 0.2, b.z),
      color: new THREE.Color(P.leafBroad).lerp(new THREE.Color(rnd() < 0.5 ? P.frondLight : P.grassDark), rnd() * 0.6) }));
    const bushMesh = new THREE.Mesh(LR.Geo.merge(bushPieces), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] }));
    bushMesh.castShadow = true; this.group.add(bushMesh);

    // Rocks: cliffs and shoreline. Big ones get colliders.
    const cliffRocks = sample(240, (x, y, z, n) => y > 0.8 && n.y < 0.72);
    const shoreRocks = sample(90, (x, y, z, n) => y > -0.9 && y < 0.9 && n.y > 0.6);
    const rockPieces = [];
    const rockL = new THREE.Color(P.rockLight), rockD = new THREE.Color(P.rockDark);
    [...cliffRocks, ...shoreRocks].forEach((r, i) => {
      const size = 0.5 + rnd() * rnd() * 3.2;
      rockPieces.push({ geometry: LR.Props.rockGeometry(size, 300 + i), position: new THREE.Vector3(r.x, r.y - size * 0.25, r.z),
        rotation: new THREE.Euler(rnd() * 0.4, rnd() * Math.PI, rnd() * 0.4), color: rockL.clone().lerp(rockD, rnd() * 0.6) });
      if (size > 1.5) physics.addCylinder({ x: r.x, z: r.z, r: size * 0.8, y0: r.y - 1, y1: r.y + size * 0.55 });
    });
    const rockMesh = new THREE.Mesh(LR.Geo.merge(rockPieces), LR.Materials.painted('rock', 0xffffff, { vertexColors: true, flatShading: true, repeat: [1, 1] }));
    rockMesh.castShadow = rockMesh.receiveShadow = true; this.group.add(rockMesh);

    // Broadleaf trees on the grassy hills: trunks in one mesh, canopies in another.
    const treeSpots = [];
    const trees = sample(150, (x, y, z, n) => {
      if (y < 3.2 || n.y < 0.74 || inZone(x, z, 'town') || inZone(x, z, 'cove')) return false;
      for (const q of treeSpots) if (Math.hypot(q.x - x, q.z - z) < 9) return false;
      treeSpots.push({ x, z }); return true;
    });
    const trunkPieces = [], leafPieces = [];
    trees.forEach((t, i) => {
      const b = LR.Props.broadleafPieces(t.x, t.y, t.z, 2000 + i);
      trunkPieces.push(...b.trunk); leafPieces.push(...b.leaves);
      physics.addCylinder({ x: t.x, z: t.z, r: 0.45, y0: t.y - 1, y1: t.y + b.h - 1 });
    });
    const trunks = new THREE.Mesh(LR.Geo.merge(trunkPieces), LR.Materials.painted('bark', 0x8A6A4A, { repeat: [1, 3] }));
    trunks.castShadow = true; this.group.add(trunks);
    const canopies = new THREE.Mesh(LR.Geo.merge(leafPieces), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] }));
    canopies.castShadow = true; this.group.add(canopies);

    // Ferns: under the tree line, at cliff feet, in the shade of the cove.
    const ferns = sample(220, (x, y, z, n) => y > 1.6 && y < 9 && n.y > 0.7 && !inZone(x, z, 'town'));
    const fernPieces = [];
    ferns.forEach((f, i) => fernPieces.push(...LR.Props.fernPieces(f.x, f.y, f.z, 3000 + i)));
    const fernMesh = new THREE.Mesh(LR.Geo.merge(fernPieces), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, side: THREE.DoubleSide }));
    this.group.add(fernMesh);

    // Flowers: instanced petals in four colors, in patches on the low grass.
    const flowerSpots = sample(70, (x, y, z, n) => y > 2.6 && y < 12 && n.y > 0.8 && !inZone(x, z, 'town'));
    const petals = [];
    for (const f of flowerSpots) for (let k = 0; k < 12; k++) {
      const a = rnd() * Math.PI * 2, d = rnd() * 4.5, x = f.x + Math.cos(a) * d, z = f.z + Math.sin(a) * d;
      petals.push({ x, y: terrain.height(x, z), z, c: [P.flowerRed, P.flowerYellow, P.flowerPink, P.flowerWhite][Math.floor(rnd() * 4)] });
    }
    const petalGeo = new THREE.PlaneGeometry(0.5, 0.5); petalGeo.rotateX(-Math.PI / 2); petalGeo.translate(0, 0.28, 0);
    const stemGeo = new THREE.PlaneGeometry(0.06, 0.3); stemGeo.translate(0, 0.14, 0);
    const petalMesh = new THREE.InstancedMesh(petalGeo, new THREE.MeshLambertMaterial({ map: LR.Textures.flower(), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }), petals.length);
    const col = new THREE.Color();
    petals.forEach((f, i) => {
      const k = 0.7 + rnd() * 0.6;
      e.set(0, rnd() * Math.PI, 0); q.setFromEuler(e); s.set(k, k, k); p.set(f.x, f.y, f.z);
      petalMesh.setMatrixAt(i, m.compose(p, q, s)); petalMesh.setColorAt(i, col.setHex(f.c));
    });
    petalMesh.instanceMatrix.needsUpdate = true; petalMesh.instanceColor.needsUpdate = true;
    this.group.add(petalMesh);

    // Leafy clumps clinging to the cliff walls and ledges.
    const clumpSpots = sample(160, (x, y, z, n) => y > 3 && n.y < 0.6);
    const clumpPieces = clumpSpots.map((c, i) => { physics.groundNormal(c.x, c.z, n); const k = 0.8 + rnd() * 1.4;
      return { geometry: LR.Props.bush(k, 5000 + i), position: new THREE.Vector3(c.x + n.x * k * 0.7, c.y + n.y * k * 0.5, c.z + n.z * k * 0.7),
        color: new THREE.Color(P.leafBroad).lerp(new THREE.Color(P.frondLight), rnd() * 0.5) }; });
    const clumpMesh = new THREE.Mesh(LR.Geo.merge(clumpPieces), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] }));
    clumpMesh.castShadow = true; this.group.add(clumpMesh);

    // Palms along the beaches, spaced out.
    const placed = [];
    // Palms stand where the sand meets the grass: on sand, with grass within ~9 m.
    const palms = sample(130, (x, y, z, n) => {
      if (y < 1.2 || y > 3.2 || n.y < 0.8 || inZone(x, z, 'town')) return false;
      let nearGrass = false;
      for (let a = 0; a < 6; a++) if (terrain.height(x + Math.cos(a) * 9, z + Math.sin(a) * 9) > 3.2) nearGrass = true;
      if (!nearGrass) return false;
      for (const q of placed) if (Math.hypot(q.x - x, q.z - z) < 7.5) return false;
      placed.push({ x, z }); return true;
    });
    palms.forEach((t, i) => {
      const palm = LR.Props.palm({ x: t.x, y: t.y, z: t.z, seed: 1000 + i });
      this.group.add(palm.group); physics.addCylinder(palm.collider);
    });
    scene.add(this.group);
  }
};
