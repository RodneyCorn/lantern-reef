// Windmill: whitewashed tapered tower on a stone plinth, red cap, wooden
// gallery, door and shuttered windows, four lattice sails that turn, and
// greenery: ivy spiraling up the tower, moss on the eaves, window boxes,
// bushes and flowers around the base. Returns { group, cylinders, update }.
window.LR = window.LR || {};
LR.Props = LR.Props || {};
LR.Props.windmill = function (o) {
  const P = LR.PALETTE, S = o.scale || 1, rnd = LR.Seeded.rng(o.seed || 5);
  const H = 15 * S, rb = 4.2 * S, rt = 2.9 * S, top = o.plinthTop;
  const g = new THREE.Group();
  const radiusAt = (y) => rb + (rt - rb) * Math.max(0, Math.min(1, (y - top) / H));

  const stone = LR.Materials.painted('rock', P.rockLight, { repeat: [4, 1] });
  const white = LR.Materials.painted('wall', o.wall || P.wall1, { repeat: [4, 3] });
  const wood = LR.Materials.painted('planks', P.trunk, { repeat: [2, 2] });
  const darkWood = LR.Materials.painted('bark', P.driftwood);
  const dark = LR.Materials.flat(0x2A1E14);
  const trim = LR.Materials.flat(o.trim || P.roofBlue);
  const roofMat = LR.Materials.painted('thatch', o.roof || P.roofRed, { repeat: [6, 2] });

  // Plinth: sunk into the hillside so the tower sits level.
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(rb + 2.4, rb + 2.9, 2.2, 18), stone);
  plinth.position.y = top - 1.1; plinth.receiveShadow = true; g.add(plinth);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(rb + 0.15, rb + 0.35, 2.2 * S, 16), stone);
  band.position.y = top + 1.1 * S; band.castShadow = true; g.add(band);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, H, 16), white);
  tower.position.y = top + H / 2; tower.castShadow = tower.receiveShadow = true; g.add(tower);
  // Cap.
  const capH = 3.4 * S;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(rt + 0.7, capH, 16), roofMat);
  cap.position.y = top + H + capH / 2 - 0.15; cap.castShadow = true; g.add(cap);
  const eave = new THREE.Mesh(new THREE.CylinderGeometry(rt + 0.75, rt + 0.75, 0.35, 16), darkWood);
  eave.position.y = top + H; g.add(eave);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.35 * S, 8, 6), trim);
  finial.position.y = top + H + capH; g.add(finial);
  // Gallery ring with railing.
  const gy = top + H * 0.58, gr = radiusAt(gy) + 1.7 * S;
  const deck = new THREE.Mesh(new THREE.RingGeometry(radiusAt(gy) - 0.2, gr, 20), wood);
  deck.rotation.x = -Math.PI / 2; deck.position.y = gy; g.add(deck);
  const deckUnder = new THREE.Mesh(new THREE.CylinderGeometry(gr, radiusAt(gy) + 0.6, 0.3, 20, 1, true), darkWood);
  deckUnder.position.y = gy - 0.15; g.add(deckUnder);
  const railPieces = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    railPieces.push({ geometry: new THREE.BoxGeometry(0.12, 1.1, 0.12), position: new THREE.Vector3(Math.cos(a) * (gr - 0.15), gy + 0.55, Math.sin(a) * (gr - 0.15)) });
  }
  railPieces.push({ geometry: new THREE.TorusGeometry(gr - 0.15, 0.06, 5, 28), position: new THREE.Vector3(0, gy + 1.1, 0), rotation: new THREE.Euler(Math.PI / 2, 0, 0) });
  g.add(new THREE.Mesh(LR.Geo.merge(railPieces), darkWood));
  // Door and windows on the front (+z).
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.3 * S, 2.3 * S, 0.3), dark);
  door.position.set(0, top + 2.2 * S + 1.15 * S, radiusAt(top + 3) - 0.05); g.add(door);
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.7 * S, 2.6 * S, 0.2), darkWood);
  doorFrame.position.set(0, top + 2.2 * S + 1.2 * S, radiusAt(top + 3) - 0.2); g.add(doorFrame);
  const windowBoxes = [];
  for (const [wy, wa] of [[0.3, 0.5], [0.45, -0.6], [0.75, 0.15], [0.8, 2.6]]) {
    const y = top + H * wy, r = radiusAt(y);
    const wg = new THREE.Group();
    wg.position.set(Math.sin(wa) * r, y, Math.cos(wa) * r); wg.rotation.y = wa;
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.9 * S, 1.1 * S, 0.3), dark); wg.add(pane);
    for (const sx of [-1, 1]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.42 * S, 1.15 * S, 0.12), trim); sh.position.set(sx * 0.7 * S, 0, 0.1); wg.add(sh); }
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.2 * S, 0.3, 0.45), wood); box.position.set(0, -0.72 * S, 0.25); wg.add(box);
    g.add(wg); windowBoxes.push(wg);
  }
  // Axle and sails.
  const axle = new THREE.Group();
  axle.position.set(0, top + H - 0.9 * S, rt + 0.4); axle.rotation.x = -0.18;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * S, 0.5 * S, 2.6 * S, 10), darkWood);
  hub.rotation.x = Math.PI / 2; hub.position.z = 0.6 * S; axle.add(hub);
  const sails = new THREE.Group(); sails.position.z = 1.6 * S;
  const L = 9.5 * S;
  const woodPieces = [], clothPieces = [];
  for (let k = 0; k < 4; k++) {
    const rot = new THREE.Euler(0, 0, k * Math.PI / 2);
    const m = new THREE.Matrix4().makeRotationFromEuler(rot);
    const add = (geo, x, y, z, arr) => arr.push({ geometry: geo, matrix: new THREE.Matrix4().makeTranslation(x, y, z).premultiply(m) });
    add(new THREE.BoxGeometry(0.32 * S, L, 0.32 * S), 0, L / 2 + 0.4, 0, woodPieces);                 // stock
    add(new THREE.BoxGeometry(0.12, L * 0.82, 0.12), -1.35 * S, L * 0.55, 0, woodPieces);              // outer rail
    for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(2.7 * S, 0.1, 0.1), -1.2 * S, L * 0.18 + i * L * 0.085, 0, woodPieces);  // slats
    add(new THREE.PlaneGeometry(2.3 * S, L * 0.72), -1.3 * S, L * 0.56, 0.08, clothPieces);            // cloth
  }
  const sailWood = new THREE.Mesh(LR.Geo.merge(woodPieces), darkWood); sailWood.castShadow = true; sails.add(sailWood);
  const cloth = new THREE.Mesh(LR.Geo.merge(clothPieces), new THREE.MeshLambertMaterial({ color: 0xF7EEDC, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }));
  cloth.castShadow = true; sails.add(cloth);
  axle.add(sails); g.add(axle);

  // Greenery. Ivy spirals up the tower; moss sits on the eaves; flowers
  // fill the window boxes; bushes and flowers ring the base.
  const leafPieces = [], flowerPieces = [];
  const leafA = new THREE.Color(P.leafBroad), leafB = new THREE.Color(P.frondLight), leafC = new THREE.Color(P.grassDark);
  const flowerCols = [P.flowerRed, P.flowerYellow, P.flowerPink, P.flowerWhite].map((c) => new THREE.Color(c));
  const ivyTurns = 1.7, ivyN = Math.round(60 * S);
  for (let i = 0; i < ivyN; i++) {
    const t = i / ivyN, y = top + 0.6 + t * H * 0.9, a = 1.1 + t * Math.PI * 2 * ivyTurns + (rnd() - 0.5) * 0.3;
    const r = radiusAt(y) + 0.05, k = (0.3 + rnd() * 0.3) * S * (1 - t * 0.3);
    leafPieces.push({ geometry: LR.Props.bush(k, 700 + i), position: new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r), color: leafA.clone().lerp(rnd() < 0.5 ? leafB : leafC, rnd() * 0.5) });
    if (rnd() < 0.3) flowerPieces.push({ geometry: new THREE.SphereGeometry(0.1 * S, 6, 5), position: new THREE.Vector3(Math.sin(a) * (r + k * 0.6), y + k * 0.3, Math.cos(a) * (r + k * 0.6)), color: flowerCols[Math.floor(rnd() * 4)] });
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + rnd() * 0.3, r = rt + 0.6;
    leafPieces.push({ geometry: LR.Props.bush(0.45 * S + rnd() * 0.35, 800 + i), position: new THREE.Vector3(Math.sin(a) * r, top + H + 0.1, Math.cos(a) * r), color: leafC.clone().lerp(leafB, rnd() * 0.5) });
  }
  for (const wg of windowBoxes) {
    for (let i = 0; i < 4; i++) {
      const lp = new THREE.Vector3((i - 1.5) * 0.28 * S, -0.5 * S, 0.3).applyEuler(wg.rotation).add(wg.position);
      leafPieces.push({ geometry: LR.Props.bush(0.22 * S, 850 + i), position: lp, color: leafA });
      flowerPieces.push({ geometry: new THREE.SphereGeometry(0.11 * S, 6, 5), position: lp.clone().add(new THREE.Vector3(0, 0.2, 0)), color: flowerCols[(i + windowBoxes.indexOf(wg)) % 4] });
    }
  }
  for (let i = 0; i < 18; i++) {
    const a = rnd() * Math.PI * 2, r = rb + 2.4 + rnd() * 2.4, k = 0.5 + rnd() * 0.8;
    leafPieces.push({ geometry: LR.Props.bush(k, 900 + i), position: new THREE.Vector3(Math.sin(a) * r, top + 0.15, Math.cos(a) * r), color: leafA.clone().lerp(rnd() < 0.5 ? leafB : leafC, rnd() * 0.6) });
    for (let f = 0; f < 3; f++) flowerPieces.push({ geometry: new THREE.SphereGeometry(0.13, 6, 5), position: new THREE.Vector3(Math.sin(a) * r + (rnd() - 0.5) * k, top + 0.15 + k * 0.6 + rnd() * 0.3, Math.cos(a) * r + (rnd() - 0.5) * k), color: flowerCols[Math.floor(rnd() * 4)] });
  }
  const leaves = new THREE.Mesh(LR.Geo.merge(leafPieces), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] }));
  leaves.castShadow = true; g.add(leaves);
  g.add(new THREE.Mesh(LR.Geo.merge(flowerPieces), LR.Materials.flat(0xffffff, { vertexColors: true })));

  g.position.set(o.x, 0, o.z); g.rotation.y = o.rot || 0;
  const cylinders = [
    { x: o.x, z: o.z, r: rb + 2.6, y0: top - 3, y1: top },          // plinth: you can stand on it
    { x: o.x, z: o.z, r: rb + 0.4, y0: top, y1: top + H + capH },    // tower
  ];
  const speed = (o.speed || 0.35) * (rnd() < 0.5 ? 1 : -1);
  return { group: g, cylinders, update: (t) => { sails.rotation.z = t * speed; } };
};
