// Built things for the rest of the island: pastel houses, the hotel, the
// bell tower, fountain, market stalls, umbrellas and chairs, the
// lighthouse, the ferry, the Sun Gate ring, and the rock arch.
window.LR = window.LR || {};
LR.Props = LR.Props || {};
(function () {
  const P = () => LR.PALETTE;
  const dark = () => LR.Materials.flat(0x2A1E14);
  const white = () => LR.Materials.flat(0xFFFFFF);

  // Gable roof over a w × d footprint, ridge along z, height h, with overhang.
  function gableRoofGeometry(w, d, h, over = 0.5) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 - over, 0); shape.lineTo(w / 2 + over, 0); shape.lineTo(0, h); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: d + over * 2, bevelEnabled: false });
    g.translate(0, 0, -(d + over * 2) / 2);
    return g;
  }
  LR.Props.gableRoofGeometry = gableRoofGeometry;

  // Window with white frame and dark pane, facing +z. Returns merge pieces.
  function windowPieces(x, y, z, rotY, w = 0.9, h = 1.1, shutterHex) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0));
    const at = (lx, ly, lz) => new THREE.Vector3(lx, ly, lz).applyQuaternion(q).add(new THREE.Vector3(x, y, z));
    const rot = new THREE.Euler(0, rotY, 0);
    const out = [
      { geometry: new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.1), position: at(0, 0, 0.02), rotation: rot, color: new THREE.Color(0xFFFFFF) },
      { geometry: new THREE.BoxGeometry(w, h, 0.12), position: at(0, 0, 0.06), rotation: rot, color: new THREE.Color(0x2A3A4A) },
      { geometry: new THREE.BoxGeometry(0.06, h, 0.14), position: at(0, 0, 0.08), rotation: rot, color: new THREE.Color(0xFFFFFF) },
      { geometry: new THREE.BoxGeometry(w, 0.06, 0.14), position: at(0, 0, 0.08), rotation: rot, color: new THREE.Color(0xFFFFFF) },
    ];
    if (shutterHex) for (const sx of [-1, 1]) out.push({ geometry: new THREE.BoxGeometry(0.4, h, 0.08), position: at(sx * (w / 2 + 0.32), 0, 0.03), rotation: rot, color: new THREE.Color(shutterHex) });
    return out;
  }

  // Pastel house. o: x, y, z, rot, w, d, floors, wall, roof, shutter, flowers.
  LR.Props.house = function (o) {
    const g = new THREE.Group(), floors = o.floors || 2, fh = 2.9, w = o.w || 7, d = o.d || 6, H = floors * fh;
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), LR.Materials.painted('wall', o.wall || P().wall1, { repeat: [2, 2] }));
    walls.position.y = H / 2; walls.castShadow = walls.receiveShadow = true; g.add(walls);
    const roofH = 2.2 + Math.min(w, d) * 0.15;
    const roof = new THREE.Mesh(gableRoofGeometry(w, d, roofH), LR.Materials.painted('planks', o.roof || P().roofRed, { repeat: [3, 2] }));
    roof.position.y = H - 0.05; roof.castShadow = true; g.add(roof);
    // Gable ends: fill the triangles with wall color.
    const gable = new THREE.Shape(); gable.moveTo(-w / 2, 0); gable.lineTo(w / 2, 0); gable.lineTo(0, roofH); gable.closePath();
    for (const sz of [-1, 1]) { const m = new THREE.Mesh(new THREE.ShapeGeometry(gable), LR.Materials.painted('wall', o.wall || P().wall1)); m.position.set(0, H - 0.06, sz * (d / 2 - 0.01)); if (sz < 0) m.rotation.y = Math.PI; g.add(m); }
    const pieces = [];
    const shutter = o.shutter || P().roofBlue;
    // Windows on the long faces (front +z, back -z) and door on the front.
    const nWin = Math.max(1, Math.floor(w / 2.6));
    for (let f = 0; f < floors; f++) for (let i = 0; i < nWin; i++) {
      const x = (i - (nWin - 1) / 2) * (w / nWin);
      if (f === 0 && i === Math.floor(nWin / 2)) continue;  // door goes here
      pieces.push(...windowPieces(x, f * fh + 1.7, d / 2, 0, 0.9, 1.1, shutter));
      pieces.push(...windowPieces(x, f * fh + 1.7, -d / 2, Math.PI, 0.9, 1.1, shutter));
      if (f > 0 || o.flowers !== false) pieces.push({ geometry: new THREE.BoxGeometry(1.2, 0.28, 0.4), position: new THREE.Vector3(x, f * fh + 1.0, d / 2 + 0.2), color: new THREE.Color(P().trunk) });
    }
    for (let f = 0; f < floors; f++) {
      pieces.push(...windowPieces(w / 2, f * fh + 1.7, 0, Math.PI / 2, 0.8, 1.0, shutter));
    }
    const doorX = (Math.floor(nWin / 2) - (nWin - 1) / 2) * (w / nWin);
    pieces.push({ geometry: new THREE.BoxGeometry(1.1, 2.2, 0.12), position: new THREE.Vector3(doorX, 1.1, d / 2 + 0.04), color: new THREE.Color(o.door || 0x6B4A2E) });
    pieces.push({ geometry: new THREE.BoxGeometry(1.4, 2.35, 0.08), position: new THREE.Vector3(doorX, 1.15, d / 2 + 0.01), color: new THREE.Color(0xFFFFFF) });
    pieces.push({ geometry: new THREE.BoxGeometry(1.6, 0.2, 0.9), position: new THREE.Vector3(doorX, 0.1, d / 2 + 0.45), color: new THREE.Color(P().rockLight) });
    // Chimney.
    pieces.push({ geometry: new THREE.BoxGeometry(0.8, 2.2, 0.8), position: new THREE.Vector3(w * 0.3, H + roofH * 0.55, -d * 0.2), color: new THREE.Color(P().rockLight) });
    const details = new THREE.Mesh(LR.Geo.merge(pieces), LR.Materials.flat(0xffffff, { vertexColors: true }));
    details.castShadow = true; g.add(details);
    // Greenery: window-box flowers and bushes by the door.
    const green = [], fl = [];
    const cols = [P().flowerRed, P().flowerYellow, P().flowerPink, P().flowerWhite].map((c) => new THREE.Color(c));
    let k = 0;
    for (let f = 0; f < floors; f++) for (let i = 0; i < nWin; i++) {
      if (f === 0 && i === Math.floor(nWin / 2)) continue;
      const x = (i - (nWin - 1) / 2) * (w / nWin);
      for (let j = 0; j < 3; j++) { green.push({ geometry: LR.Props.bush(0.22, 60 + k), position: new THREE.Vector3(x + (j - 1) * 0.35, f * fh + 1.2, d / 2 + 0.25), color: new THREE.Color(P().leafBroad) }); fl.push({ geometry: new THREE.SphereGeometry(0.1, 6, 5), position: new THREE.Vector3(x + (j - 1) * 0.35, f * fh + 1.38, d / 2 + 0.3), color: cols[(k + j) % 4] }); k++; }
    }
    for (const sx of [-1, 1]) green.push({ geometry: LR.Props.bush(0.6, 70 + (sx + 1)), position: new THREE.Vector3(doorX + sx * 1.5, 0.3, d / 2 + 0.8), color: new THREE.Color(P().leafBroad).lerp(new THREE.Color(P().frondLight), 0.3) });
    g.add(new THREE.Mesh(LR.Geo.merge(green), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] })));
    g.add(new THREE.Mesh(LR.Geo.merge(fl), LR.Materials.flat(0xffffff, { vertexColors: true })));
    g.position.set(o.x, o.y, o.z); g.rotation.y = o.rot || 0;
    const c = Math.abs(Math.cos(o.rot || 0)), s = Math.abs(Math.sin(o.rot || 0));
    const hw = (c * w + s * d) / 2 + 0.2, hd = (s * w + c * d) / 2 + 0.2;
    return { group: g, colliders: [{ minX: o.x - hw, maxX: o.x + hw, minY: o.y - 1, maxY: o.y + H + roofH * 0.5, minZ: o.z - hd, maxZ: o.z + hd }] };
  };

  // The resort hotel: long white block, blue balconies, ground-floor arches, roof deck.
  LR.Props.hotel = function (o) {
    const g = new THREE.Group(), w = o.w || 34, d = o.d || 13, floors = 4, fh = 3.2, H = floors * fh;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), LR.Materials.painted('wall', 0xFFFFFF, { repeat: [6, 3] }));
    body.position.y = H / 2; body.castShadow = body.receiveShadow = true; g.add(body);
    const pieces = [];
    const blue = new THREE.Color(P().roofBlue), whiteC = new THREE.Color(0xFFFFFF), glass = new THREE.Color(0x3A5A7A);
    const n = Math.floor(w / 3.4);
    for (let f = 1; f < floors; f++) for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 3.4, y = f * fh;
      pieces.push({ geometry: new THREE.BoxGeometry(2.8, 0.18, 1.4), position: new THREE.Vector3(x, y + 0.1, d / 2 + 0.7), color: whiteC });        // balcony slab
      pieces.push({ geometry: new THREE.BoxGeometry(2.8, 0.9, 0.08), position: new THREE.Vector3(x, y + 0.6, d / 2 + 1.36), color: blue });          // railing
      pieces.push({ geometry: new THREE.BoxGeometry(1.6, 2.2, 0.1), position: new THREE.Vector3(x, y + 1.3, d / 2 + 0.02), color: glass });          // glass door
      pieces.push({ geometry: new THREE.BoxGeometry(1.2, 1.1, 0.1), position: new THREE.Vector3(x, y + 1.9, -d / 2 - 0.02), color: glass });          // back window
    }
    for (let i = 0; i < n; i++) {   // ground floor arches
      const x = (i - (n - 1) / 2) * 3.4;
      pieces.push({ geometry: new THREE.BoxGeometry(2.0, 2.6, 0.3), position: new THREE.Vector3(x, 1.3, d / 2 + 0.05), color: new THREE.Color(0x2A3A4A) });
      pieces.push({ geometry: new THREE.CylinderGeometry(1.0, 1.0, 0.3, 12, 1, false, 0, Math.PI), position: new THREE.Vector3(x, 2.6, d / 2 + 0.05), rotation: new THREE.Euler(Math.PI / 2, 0, 0), color: new THREE.Color(0x2A3A4A) });
    }
    pieces.push({ geometry: new THREE.BoxGeometry(w + 1, 0.5, d + 1), position: new THREE.Vector3(0, H + 0.2, 0), color: whiteC });               // parapet slab
    pieces.push({ geometry: new THREE.BoxGeometry(w + 1, 1.0, 0.2), position: new THREE.Vector3(0, H + 0.9, d / 2 + 0.4), color: blue });
    pieces.push({ geometry: new THREE.BoxGeometry(w + 1, 1.0, 0.2), position: new THREE.Vector3(0, H + 0.9, -d / 2 - 0.4), color: blue });
    pieces.push({ geometry: new THREE.BoxGeometry(0.2, 1.0, d + 1), position: new THREE.Vector3(w / 2 + 0.4, H + 0.9, 0), color: blue });
    pieces.push({ geometry: new THREE.BoxGeometry(0.2, 1.0, d + 1), position: new THREE.Vector3(-w / 2 - 0.4, H + 0.9, 0), color: blue });
    pieces.push({ geometry: new THREE.BoxGeometry(10, 2.4, 0.4), position: new THREE.Vector3(0, H + 2.4, 0), color: blue });                     // sign block
    const details = new THREE.Mesh(LR.Geo.merge(pieces), LR.Materials.flat(0xffffff, { vertexColors: true }));
    details.castShadow = true; g.add(details);
    // Planters along the front.
    const green = [];
    for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 3.4 + 1.7; green.push({ geometry: LR.Props.bush(0.7, 80 + i), position: new THREE.Vector3(x, 0.5, d / 2 + 1.3), color: new THREE.Color(P().leafBroad) }); }
    for (let i = 0; i < 6; i++) green.push({ geometry: LR.Props.bush(0.9, 90 + i), position: new THREE.Vector3((i - 2.5) * 5.5, H + 0.9, 0), color: new THREE.Color(P().frondLight).lerp(new THREE.Color(P().leafBroad), 0.5) });
    g.add(new THREE.Mesh(LR.Geo.merge(green), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] })));
    g.position.set(o.x, o.y, o.z); g.rotation.y = o.rot || 0;
    const c = Math.abs(Math.cos(o.rot || 0)), s = Math.abs(Math.sin(o.rot || 0));
    const hw = (c * w + s * d) / 2 + 0.3, hd = (s * w + c * d) / 2 + 0.3;
    return { group: g, colliders: [{ minX: o.x - hw, maxX: o.x + hw, minY: o.y - 1, maxY: o.y + H + 0.45, minZ: o.z - hd, maxZ: o.z + hd }] };
  };

  LR.Props.bellTower = function (o) {
    const g = new THREE.Group(), H = 15, w = 3.4;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, H, w), LR.Materials.painted('wall', P().wall2, { repeat: [1, 4] }));
    body.position.y = H / 2; body.castShadow = true; g.add(body);
    const pieces = [];
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2, q = new THREE.Euler(0, a, 0);
      const px = Math.sin(a) * (w / 2 + 0.02), pz = Math.cos(a) * (w / 2 + 0.02);
      pieces.push({ geometry: new THREE.BoxGeometry(1.2, 2.4, 0.1), position: new THREE.Vector3(px, H - 2.2, pz), rotation: q, color: new THREE.Color(0x2A1E14) });
      pieces.push({ geometry: new THREE.CylinderGeometry(0.6, 0.6, 0.1, 10, 1, false, 0, Math.PI), position: new THREE.Vector3(px, H - 1.0, pz), rotation: new THREE.Euler(Math.PI / 2, a, 0), color: new THREE.Color(0x2A1E14) });
      pieces.push({ geometry: new THREE.BoxGeometry(0.7, 0.9, 0.1), position: new THREE.Vector3(px, H * 0.45, pz), rotation: q, color: new THREE.Color(0x2A3A4A) });
    }
    pieces.push({ geometry: new THREE.CylinderGeometry(0.35, 0.55, 0.8, 10), position: new THREE.Vector3(0, H - 1.6, 0), color: new THREE.Color(0xC9A227) });  // bell
    pieces.push({ geometry: new THREE.BoxGeometry(w + 0.6, 0.3, w + 0.6), position: new THREE.Vector3(0, H + 0.1, 0), color: new THREE.Color(P().rockLight) });
    g.add(new THREE.Mesh(LR.Geo.merge(pieces), LR.Materials.flat(0xffffff, { vertexColors: true })));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.8, 3.2, 4), LR.Materials.painted('planks', P().roofRed, { repeat: [2, 1] }));
    roof.position.y = H + 1.8; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    g.position.set(o.x, o.y, o.z);
    return { group: g, colliders: [{ minX: o.x - w / 2 - 0.2, maxX: o.x + w / 2 + 0.2, minY: o.y - 1, maxY: o.y + H + 0.3, minZ: o.z - w / 2 - 0.2, maxZ: o.z + w / 2 + 0.2 }] };
  };

  LR.Props.fountain = function (o) {
    const g = new THREE.Group(), stone = LR.Materials.painted('rock', P().rockLight, { repeat: [4, 1] });
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.9, 20), stone); basin.position.y = 0.45; basin.castShadow = true; g.add(basin);
    const waterMat = new THREE.MeshLambertMaterial({ color: P().waterShallow, transparent: true, opacity: 0.8 });
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.1, 20), waterMat); pool.position.y = 0.8; g.add(pool);
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 2.2, 10), stone); column.position.y = 1.9; g.add(column);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.6, 0.5, 14), stone); bowl.position.y = 3.0; g.add(bowl);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.06, 14), waterMat); top.position.y = 3.25; g.add(top);
    const jet = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.6, 8), new THREE.MeshLambertMaterial({ color: 0xF6FFFF, transparent: true, opacity: 0.75 }));
    jet.position.y = 4.0; g.add(jet);
    // Falling water sheets from the bowl.
    const sheets = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.2), new THREE.MeshLambertMaterial({ color: 0xE8FDFF, transparent: true, opacity: 0.55, side: THREE.DoubleSide })); s.position.set(Math.cos(a) * 1.35, 2.1, Math.sin(a) * 1.35); s.rotation.y = -a + Math.PI / 2; g.add(s); sheets.push(s); }
    g.position.set(o.x, o.y, o.z);
    return { group: g, cylinders: [{ x: o.x, z: o.z, r: 3.9, y0: o.y - 1, y1: o.y + 0.9 }], update: (t) => { jet.scale.y = 1 + Math.sin(t * 6) * 0.08; } };
  };

  // Market stall: table, posts, striped awning.
  LR.Props.stall = function (o) {
    const g = new THREE.Group(), wood = LR.Materials.painted('planks', P().trunk);
    const table = new THREE.Mesh(new THREE.BoxGeometry(3, 0.9, 1.4), wood); table.position.y = 0.45; table.castShadow = true; g.add(table);
    const posts = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) posts.push({ geometry: new THREE.BoxGeometry(0.12, 2.6, 0.12), position: new THREE.Vector3(sx * 1.45, 1.3, sz * 0.75) });
    g.add(new THREE.Mesh(LR.Geo.merge(posts), LR.Materials.painted('bark', P().driftwood)));
    const awning = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 2.0), new THREE.MeshLambertMaterial({ map: LR.Textures.stripes(o.color || P().roofRed, 8), side: THREE.DoubleSide }));
    awning.position.set(0, 2.62, 0.1); awning.rotation.x = 0.18; awning.castShadow = true; g.add(awning);
    const goods = [];
    const cols = [P().flowerRed, P().flowerYellow, 0xFF9A3C, P().leafBroad, 0xF6E7A1];
    for (let i = 0; i < 9; i++) goods.push({ geometry: new THREE.SphereGeometry(0.16, 7, 6), position: new THREE.Vector3(-1.1 + (i % 5) * 0.55, 1.05, -0.35 + Math.floor(i / 5) * 0.6), color: new THREE.Color(cols[i % cols.length]) });
    g.add(new THREE.Mesh(LR.Geo.merge(goods), LR.Materials.flat(0xffffff, { vertexColors: true })));
    g.position.set(o.x, o.y, o.z); g.rotation.y = o.rot || 0;
    return { group: g, colliders: [{ minX: o.x - 1.7, maxX: o.x + 1.7, minY: o.y - 1, maxY: o.y + 0.9, minZ: o.z - 1.0, maxZ: o.z + 1.0 }] };
  };

  LR.Props.umbrella = function (o) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), white()); pole.position.y = 1.3; g.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.7, 10, 1, true), new THREE.MeshLambertMaterial({ map: LR.Textures.stripes(o.color || P().roofRed, 10), side: THREE.DoubleSide }));
    top.position.y = 2.5; top.castShadow = true; g.add(top);
    const chair = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 1.6), new THREE.MeshLambertMaterial({ map: LR.Textures.stripes(o.color || P().roofRed, 6) })); seat.position.y = 0.4; chair.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.8), seat.material); back.position.set(0, 0.7, -0.95); back.rotation.x = -0.9; chair.add(back);
    const legs = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) legs.push({ geometry: new THREE.BoxGeometry(0.06, 0.4, 0.06), position: new THREE.Vector3(sx * 0.3, 0.2, sz * 0.7) });
    chair.add(new THREE.Mesh(LR.Geo.merge(legs), white()));
    chair.position.set(1.3, 0, 0.2); chair.rotation.y = -0.3; g.add(chair);
    g.position.set(o.x, o.y, o.z); g.rotation.y = o.rot || 0;
    return { group: g, cylinders: [{ x: o.x, z: o.z, r: 0.15, y0: o.y - 1, y1: o.y + 2.2 }] };
  };

  LR.Props.volleyballNet = function (o) {
    const g = new THREE.Group();
    const posts = [{ geometry: new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6), position: new THREE.Vector3(-4, 1.25, 0) }, { geometry: new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6), position: new THREE.Vector3(4, 1.25, 0) }];
    g.add(new THREE.Mesh(LR.Geo.merge(posts), white()));
    const net = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.0), new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
    net.position.y = 1.9; g.add(net);
    const tape = new THREE.Mesh(new THREE.BoxGeometry(8, 0.08, 0.02), white()); tape.position.y = 2.4; g.add(tape);
    g.position.set(o.x, o.y, o.z); g.rotation.y = o.rot || 0;
    return { group: g, cylinders: [] };
  };

  // Lighthouse: white tower with red bands, gallery, lantern room, red cap,
  // a spiral of plank steps up the outside, and a beam that shows at night.
  LR.Props.lighthouse = function (o) {
    const g = new THREE.Group(), H = 24, rb = 3.4, rt = 2.4;
    const radiusAt = (y) => rb + (rt - rb) * Math.max(0, Math.min(1, y / H));
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, H, 18), LR.Materials.painted('wall', 0xFFFFFF, { repeat: [4, 5] }));
    tower.position.y = H / 2; tower.castShadow = tower.receiveShadow = true; g.add(tower);
    for (const by of [0.28, 0.62]) { const y = H * by, r = radiusAt(y) + 0.03; const band = new THREE.Mesh(new THREE.CylinderGeometry(radiusAt(y + 1.6) + 0.03, r, 3.2, 18), LR.Materials.flat(P().roofRed)); band.position.y = y + 1.6; g.add(band); }
    const base = new THREE.Mesh(new THREE.CylinderGeometry(rb + 0.6, rb + 1.0, 1.4, 18), LR.Materials.painted('rock', P().rockLight, { repeat: [4, 1] })); base.position.y = 0.7; g.add(base);
    const gal = new THREE.Mesh(new THREE.CylinderGeometry(rt + 1.4, rt + 1.0, 0.4, 18), LR.Materials.flat(0xE8E8EC)); gal.position.y = H; g.add(gal);
    const rail = [];
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; rail.push({ geometry: new THREE.BoxGeometry(0.08, 1.0, 0.08), position: new THREE.Vector3(Math.cos(a) * (rt + 1.25), H + 0.7, Math.sin(a) * (rt + 1.25)) }); }
    rail.push({ geometry: new THREE.TorusGeometry(rt + 1.25, 0.05, 5, 30), position: new THREE.Vector3(0, H + 1.2, 0), rotation: new THREE.Euler(Math.PI / 2, 0, 0) });
    g.add(new THREE.Mesh(LR.Geo.merge(rail), LR.Materials.flat(0x2A3A4A)));
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(rt - 0.4, rt - 0.4, 3.0, 12), new THREE.MeshLambertMaterial({ color: 0xFFF3C0, emissive: 0xFFD060, emissiveIntensity: 0.0, transparent: true, opacity: 0.85 }));
    lantern.position.y = H + 1.7; g.add(lantern);
    const frame = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; frame.push({ geometry: new THREE.BoxGeometry(0.12, 3.0, 0.12), position: new THREE.Vector3(Math.cos(a) * (rt - 0.4), H + 1.7, Math.sin(a) * (rt - 0.4)) }); }
    g.add(new THREE.Mesh(LR.Geo.merge(frame), LR.Materials.flat(0x2A3A4A)));
    const cap = new THREE.Mesh(new THREE.ConeGeometry(rt + 0.2, 2.4, 12), LR.Materials.flat(P().roofRed)); cap.position.y = H + 4.3; cap.castShadow = true; g.add(cap);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), dark()); door.position.set(0, 2.4, rb - 0.05); g.add(door);
    // Beam: two long translucent cones from the lantern, rotating; opacity set by night.
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xFFF0B0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const beams = new THREE.Group(); beams.position.y = H + 1.7;
    for (const s of [1, -1]) { const b = new THREE.Mesh(new THREE.ConeGeometry(9, 140, 12, 1, true), beamMat); b.rotation.z = s * Math.PI / 2; b.position.x = s * 70; beams.add(b); }
    g.add(beams);
    // Spiral steps.
    const steps = [], colliders = [];
    const n = 30, ty = H - 0.6;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), a = 0.3 + t * Math.PI * 3.4, y = 0.9 + t * ty, r = radiusAt(y) + 0.75;
      const px = Math.cos(a) * r, pz = Math.sin(a) * r;
      steps.push({ geometry: new THREE.BoxGeometry(1.6, 0.16, 1.0), position: new THREE.Vector3(px, y, pz), rotation: new THREE.Euler(0, -a, 0) });
      steps.push({ geometry: new THREE.BoxGeometry(0.08, 1.0, 0.08), position: new THREE.Vector3(Math.cos(a) * (r + 0.7), y + 0.55, Math.sin(a) * (r + 0.7)) });
      colliders.push({ minX: o.x + px - 0.85, maxX: o.x + px + 0.85, minY: o.y + y - 0.35, maxY: o.y + y + 0.08, minZ: o.z + pz - 0.85, maxZ: o.z + pz + 0.85 });
    }
    const stepMesh = new THREE.Mesh(LR.Geo.merge(steps), LR.Materials.painted('planks', P().trunk, { repeat: [1, 1] })); stepMesh.castShadow = true; g.add(stepMesh);
    // Gallery walkable ring: approximate with boxes around the top.
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, px = Math.cos(a) * (rt + 0.8), pz = Math.sin(a) * (rt + 0.8); colliders.push({ minX: o.x + px - 0.9, maxX: o.x + px + 0.9, minY: o.y + H - 0.5, maxY: o.y + H + 0.2, minZ: o.z + pz - 0.9, maxZ: o.z + pz + 0.9 }); }
    // Moss and flowers at the base.
    const green = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; green.push({ geometry: LR.Props.bush(0.5 + (i % 3) * 0.2, 120 + i), position: new THREE.Vector3(Math.cos(a) * (rb + 1.4), 0.3, Math.sin(a) * (rb + 1.4)), color: new THREE.Color(P().leafBroad) }); }
    g.add(new THREE.Mesh(LR.Geo.merge(green), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] })));
    g.position.set(o.x, o.y, o.z);
    return {
      group: g, colliders, cylinders: [{ x: o.x, z: o.z, r: rb + 0.2, y0: o.y - 1, y1: o.y + H + 6 }],
      update: (t, night) => { beams.rotation.y = t * 0.6; beamMat.opacity = 0.28 * night; lantern.material.emissiveIntensity = night; },
      top: { x: o.x, y: o.y + H, z: o.z },
    };
  };

  // Ferry: white hull with a red stripe, cabin decks, funnel, windows.
  LR.Props.ferry = function (o) {
    const g = new THREE.Group(), L = 24, W = 7;
    const shape = new THREE.Shape();
    shape.moveTo(0, -L / 2); shape.quadraticCurveTo(W / 2, -L / 2 + 3, W / 2, 0); shape.lineTo(W / 2, L / 2 - 1); shape.quadraticCurveTo(W / 2, L / 2, W / 2 - 1, L / 2);
    shape.lineTo(-W / 2 + 1, L / 2); shape.quadraticCurveTo(-W / 2, L / 2, -W / 2, L / 2 - 1); shape.lineTo(-W / 2, 0); shape.quadraticCurveTo(-W / 2, -L / 2 + 3, 0, -L / 2);
    const hullGeo = new THREE.ExtrudeGeometry(shape, { depth: 3.2, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2 });
    hullGeo.rotateX(-Math.PI / 2);
    const hull = new THREE.Mesh(hullGeo, LR.Materials.flat(0xFFFFFF)); hull.position.y = -1.6; hull.castShadow = true; g.add(hull);
    const pieces = [], red = new THREE.Color(P().roofRed), whiteC = new THREE.Color(0xFFFFFF), glass = new THREE.Color(0x2A3A4A), blue = new THREE.Color(P().roofBlue);
    pieces.push({ geometry: new THREE.BoxGeometry(W + 0.1, 0.5, L * 0.78), position: new THREE.Vector3(0, 0.6, 0.5), color: red });
    pieces.push({ geometry: new THREE.BoxGeometry(W - 1.2, 2.6, L * 0.6), position: new THREE.Vector3(0, 2.9, 0.5), color: whiteC });
    pieces.push({ geometry: new THREE.BoxGeometry(W - 2.4, 2.2, L * 0.4), position: new THREE.Vector3(0, 5.3, -0.5), color: whiteC });
    pieces.push({ geometry: new THREE.CylinderGeometry(0.7, 0.8, 2.6, 10), position: new THREE.Vector3(0, 7.4, -2.5), color: red });
    pieces.push({ geometry: new THREE.CylinderGeometry(0.75, 0.75, 0.4, 10), position: new THREE.Vector3(0, 8.5, -2.5), color: blue });
    for (let i = 0; i < 8; i++) for (const sx of [-1, 1]) { pieces.push({ geometry: new THREE.BoxGeometry(0.1, 0.9, 1.1), position: new THREE.Vector3(sx * (W / 2 - 0.55), 3.2, -5.5 + i * 1.7), color: glass }); }
    for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) { pieces.push({ geometry: new THREE.BoxGeometry(0.1, 0.8, 1.0), position: new THREE.Vector3(sx * (W / 2 - 1.15), 5.6, -4 + i * 1.7), color: glass }); }
    pieces.push({ geometry: new THREE.BoxGeometry(W - 2.6, 1.0, 1.2), position: new THREE.Vector3(0, 5.2, 4.3), color: glass });   // bridge windows
    pieces.push({ geometry: new THREE.BoxGeometry(0.1, 3.2, 0.1), position: new THREE.Vector3(0, 8.0, 5), color: whiteC });         // mast
    const details = new THREE.Mesh(LR.Geo.merge(pieces), LR.Materials.flat(0xffffff, { vertexColors: true })); details.castShadow = true; g.add(details);
    g.position.set(o.x, 0.1, o.z); g.rotation.y = o.rot || 0;
    return { group: g, update: (t) => { g.position.y = 0.1 + Math.sin(t * 0.7) * 0.12; g.rotation.z = Math.sin(t * 0.5) * 0.012; } };
  };

  // Sun Gate: a weathered stone ring standing on the islet, moss on top.
  LR.Props.sunGate = function (o) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(LR.Geo.roughen(new THREE.TorusGeometry(5.2, 1.15, 9, 26), 0.06, 77), LR.Materials.painted('rock', 0xC9B79C, { repeat: [6, 1] }));
    ring.position.y = 4.2; ring.rotation.y = o.rot || 0; ring.castShadow = ring.receiveShadow = true; g.add(ring);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 1.2, 12), LR.Materials.painted('rock', P().rockLight)); plinth.position.y = 0.3; g.add(plinth);
    const green = [];
    for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.22; green.push({ geometry: LR.Props.bush(0.45 + (i % 2) * 0.25, 130 + i), position: new THREE.Vector3(Math.cos(o.rot || 0) * Math.cos(a) * 5.2, 4.2 + Math.sin(a) * 5.2 + 0.9, -Math.sin(o.rot || 0) * Math.cos(a) * 5.2), color: new THREE.Color(P().leafBroad).lerp(new THREE.Color(P().frondLight), (i % 3) * 0.3) }); }
    g.add(new THREE.Mesh(LR.Geo.merge(green), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] })));
    g.position.set(o.x, o.y, o.z);
    const dx = Math.cos(o.rot || 0), dz = -Math.sin(o.rot || 0);
    return { group: g, cylinders: [{ x: o.x - dx * 5.2, z: o.z - dz * 5.2, r: 1.3, y0: o.y - 1, y1: o.y + 5 }, { x: o.x + dx * 5.2, z: o.z + dz * 5.2, r: 1.3, y0: o.y - 1, y1: o.y + 5 }] };
  };

  // Rock arch standing in the sea.
  LR.Props.rockArch = function (o) {
    const g = new THREE.Group();
    const arch = new THREE.Mesh(LR.Geo.roughen(new THREE.TorusGeometry(o.r || 9, (o.r || 9) * 0.34, 10, 22, Math.PI), 0.16, 91), LR.Materials.painted('rock', 0xffffff, { vertexColors: false, flatShading: true, repeat: [4, 1] }));
    arch.material = LR.Materials.painted('rock', P().rockLight, { flatShading: true, repeat: [4, 1] });
    arch.position.y = 0.5; arch.rotation.y = o.rot || 0; arch.castShadow = arch.receiveShadow = true; g.add(arch);
    const green = [];
    for (let i = 0; i < 7; i++) { const a = 0.5 + i * 0.35; green.push({ geometry: LR.Props.bush(0.8 + (i % 2) * 0.5, 140 + i), position: new THREE.Vector3(Math.cos(o.rot || 0) * Math.cos(a) * (o.r || 9), 0.5 + Math.sin(a) * (o.r || 9) + 2.4, -Math.sin(o.rot || 0) * Math.cos(a) * (o.r || 9)), color: new THREE.Color(P().leafBroad) }); }
    g.add(new THREE.Mesh(LR.Geo.merge(green), LR.Materials.painted('leaf', 0xffffff, { vertexColors: true, repeat: [2, 2] })));
    g.position.set(o.x, o.y, o.z);
    const dx = Math.cos(o.rot || 0), dz = -Math.sin(o.rot || 0), r = o.r || 9;
    return { group: g, cylinders: [{ x: o.x - dx * r, z: o.z - dz * r, r: r * 0.36, y0: -20, y1: o.y + r * 0.3 }, { x: o.x + dx * r, z: o.z + dz * r, r: r * 0.36, y0: -20, y1: o.y + r * 0.3 }] };
  };

  // Stone pier for the harbour.
  LR.Props.stonePier = function (o) {
    const g = new THREE.Group(), len = Math.hypot(o.x2 - o.x1, o.z2 - o.z1), ang = Math.atan2(o.x2 - o.x1, o.z2 - o.z1), w = o.w || 6, y = o.y || 1.6;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, 3.5, len), LR.Materials.painted('rock', P().rockLight, { repeat: [2, 8] }));
    body.position.set((o.x1 + o.x2) / 2, y - 1.75, (o.z1 + o.z2) / 2); body.rotation.y = ang; body.castShadow = body.receiveShadow = true; g.add(body);
    const pieces = [];
    for (let s = -len / 2 + 2; s < len / 2; s += 5) for (const side of [-1, 1]) pieces.push({ geometry: new THREE.CylinderGeometry(0.25, 0.3, 0.9, 8), position: new THREE.Vector3(side * (w / 2 - 0.5), 0.4, s), color: new THREE.Color(0x2A3A4A) });
    for (let s = -len / 2 + 4; s < len / 2; s += 10) { pieces.push({ geometry: new THREE.CylinderGeometry(0.08, 0.1, 4, 6), position: new THREE.Vector3(w / 2 - 0.4, 2, s), color: new THREE.Color(0x2A3A4A) }); pieces.push({ geometry: new THREE.SphereGeometry(0.3, 8, 6), position: new THREE.Vector3(w / 2 - 0.4, 4.1, s), color: new THREE.Color(0xFFF3C0) }); }
    const det = new THREE.Mesh(LR.Geo.merge(pieces), LR.Materials.flat(0xffffff, { vertexColors: true }));
    det.position.copy(body.position); det.position.y = y; det.rotation.y = ang; g.add(det);
    const colliders = [], segs = Math.ceil(len / 4);
    for (let i = 0; i <= segs; i++) { const t = i / segs, cx = o.x1 + (o.x2 - o.x1) * t, cz = o.z1 + (o.z2 - o.z1) * t, half = w / 2 + 0.4; colliders.push({ minX: cx - half, maxX: cx + half, minY: y - 4, maxY: y + 0.02, minZ: cz - half, maxZ: cz + half }); }
    return { group: g, colliders };
  };
})();
