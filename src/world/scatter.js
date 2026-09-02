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
    const tufts = sample(2000, (x, y, z, n) => y > 2.7 && n.y > 0.72 && !inZone(x, z, 'town'));
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
    const bushes = sample(90, (x, y, z, n) => y > 2.8 && n.y > 0.8 && !inZone(x, z, 'town'));
    const bushPieces = bushes.map((b, i) => ({ geometry: LR.Props.bush(0.9 + rnd() * 1.3, 900 + i), position: new THREE.Vector3(b.x, b.y - 0.2, b.z),
      color: new THREE.Color(P.grassLight).lerp(new THREE.Color(P.frondDark), rnd() * 0.7) }));
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

    // Palms along the beaches, spaced out.
    const placed = [];
    // Palms stand where the sand meets the grass: on sand, with grass within ~9 m.
    const palms = sample(90, (x, y, z, n) => {
      if (y < 1.2 || y > 3.2 || n.y < 0.8 || inZone(x, z, 'town')) return false;
      let nearGrass = false;
      for (let a = 0; a < 6; a++) if (terrain.height(x + Math.cos(a) * 9, z + Math.sin(a) * 9) > 3.2) nearGrass = true;
      if (!nearGrass) return false;
      for (const q of placed) if (Math.hypot(q.x - x, q.z - z) < 9) return false;
      placed.push({ x, z }); return true;
    });
    palms.forEach((t, i) => {
      const palm = LR.Props.palm({ x: t.x, y: t.y, z: t.z, seed: 1000 + i });
      this.group.add(palm.group); physics.addCylinder(palm.collider);
    });
    scene.add(this.group);
  }
};
