// A jointed cartoon character built from primitives, cel-shaded with ink
// outlines. One builder makes Milo and every islander from a spec. The
// character faces +z; feet at y = 0. Joints are Groups the animator turns.
window.LR = window.LR || {};
LR.Rig = (function () {
  const faceCache = {};
  const hex = (n) => '#' + n.toString(16).padStart(6, '0');

  // Painted face: big outlined cartoon eyes, thick brows, freckles, smile.
  function faceTexture(spec) {
    const key = `${spec.eyes}|${spec.hair}|${spec.beard || 0}|${spec.freckles === false ? 0 : 1}|${spec.smile || 'smile'}|${spec.skin}`;
    if (faceCache[key]) return faceCache[key];
    const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
    const ctx = c.getContext('2d');
    const eye = (x, tilt) => {
      ctx.save(); ctx.translate(x, 118); ctx.rotate(tilt);
      ctx.fillStyle = '#1A1210'; ctx.beginPath(); ctx.ellipse(0, 0, 25, 34, 0, 0, Math.PI * 2); ctx.fill();     // outline
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(0, 0, 21, 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hex(spec.eyes); ctx.beginPath(); ctx.ellipse(1, 6, 15, 21, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10151F'; ctx.beginPath(); ctx.ellipse(1, 9, 9, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(-5, -4, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(7, 12, 3, 0, Math.PI * 2); ctx.fill();
      // Upper lid line, thick.
      ctx.strokeStyle = '#1A1210'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(0, 0, 24, 33, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.restore();
    };
    eye(86, -0.06); eye(170, 0.06);
    // Brows.
    ctx.strokeStyle = hex(spec.hair); ctx.lineWidth = 11; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(58, 68); ctx.quadraticCurveTo(86, 54, 112, 66); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(144, 66); ctx.quadraticCurveTo(170, 54, 198, 68); ctx.stroke();
    if (spec.freckles !== false) { ctx.fillStyle = 'rgba(110,55,25,0.55)'; for (let i = 0; i < 14; i++) { const x = 60 + (i * 41) % 140 + (i % 3) * 5, y = 158 + (i % 4) * 6 - Math.abs(i - 7) * 1.5; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); } }
    // Nose: a small curve.
    ctx.strokeStyle = 'rgba(80,40,20,0.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(124, 150); ctx.quadraticCurveTo(130, 160, 122, 164); ctx.stroke();
    // Mouth.
    ctx.strokeStyle = '#4A2412'; ctx.lineWidth = 5; ctx.beginPath();
    if (spec.smile === 'grin') { ctx.moveTo(98, 186); ctx.quadraticCurveTo(128, 222, 158, 186); ctx.closePath(); ctx.fillStyle = '#4A2412'; ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(108, 188, 40, 8); }
    else { ctx.moveTo(104, 190); ctx.quadraticCurveTo(128, 210, 152, 190); ctx.stroke(); }
    if (spec.beard) { ctx.fillStyle = hex(spec.beard); ctx.beginPath(); ctx.moveTo(40, 176); ctx.quadraticCurveTo(128, 300, 216, 176); ctx.quadraticCurveTo(200, 228, 128, 240); ctx.quadraticCurveTo(56, 228, 40, 176); ctx.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return (faceCache[key] = t);
  }

  // Chunky hair spike: a bevelled triangular wedge.
  function spikeGeometry(w, h, d) {
    const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(w * 0.1, h); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: d * 0.4, bevelSize: w * 0.18, bevelSegments: 2 });
    g.translate(0, 0, -d / 2);
    return g;
  }
  // Egg-shaped head with a chin, via a lathe profile.
  function headGeometry(r) {
    const pts = [[0, -0.9], [0.45, -0.86], [0.78, -0.62], [0.96, -0.25], [1.0, 0.15], [0.94, 0.55], [0.68, 0.85], [0.3, 0.98], [0, 1.0]].map(([x, y]) => new THREE.Vector2(x * r, y * r));
    return new THREE.LatheGeometry(pts, 22);
  }
  // Lathe profiles must run upward in y, or the surface winds inside-out.
  function limbGeometry(r0, r1, len) {
    const pts = [];
    for (let i = 8; i >= 0; i--) { const t = i / 8; const r = r0 + (r1 - r0) * t; pts.push(new THREE.Vector2(r * (1 - Math.pow(Math.abs(t - 0.5) * 2, 6) * 0.15), -len * t)); }
    return new THREE.LatheGeometry(pts, 12);
  }

  function hatMesh(spec, mats) {
    const g = new THREE.Group();
    const type = spec.hat ? spec.hat.type : 'none';
    const M = (c) => LR.Materials.flat(c, { cel: true });
    if (type === 'straw') {
      const pts = [];
      for (const [x, y] of [[0, 0.3], [0.2, 0.3], [0.24, 0.16], [0.25, 0.06], [0.42, 0.0], [0.45, -0.04], [0.46, -0.05], [0.43, -0.02], [0.26, 0.04], [0.23, 0.14], [0.19, 0.28], [0, 0.28]]) pts.push(new THREE.Vector2(x, y));
      const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), LR.Materials.painted('thatch', spec.hat.color || LR.PALETTE.miloStraw, { repeat: [4, 1], side: THREE.DoubleSide, cel: true }));
      m.castShadow = true; g.add(m);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.035, 6, 20), M(spec.hat.band || LR.PALETTE.miloVest));
      band.rotation.x = Math.PI / 2; band.position.y = 0.09; g.add(band);
    } else if (type === 'cap') {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.235, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), M(spec.hat.color)); m.castShadow = true; g.add(m);
      const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 14, 1, false, -Math.PI * 0.35, Math.PI * 0.7), M(spec.hat.band || spec.hat.color));
      peak.position.set(0, 0.02, 0.06); peak.scale.set(1, 1, 1.5); g.add(peak);
      if (spec.hat.badge) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10), M(spec.hat.badge)); b.rotation.x = Math.PI / 2; b.position.set(0, 0.12, 0.22); g.add(b); }
    } else if (type === 'bandana') {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.225, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), M(spec.hat.color)); g.add(m);
      const knot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.14), M(spec.hat.color)); knot.position.set(0.05, 0.02, -0.2); knot.rotation.y = 0.5; g.add(knot);
    } else if (type === 'chef') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.3, 14), M(0xFFFFFF)); m.position.y = 0.15; g.add(m);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 9), M(0xFFFFFF)); puff.position.y = 0.32; puff.scale.set(1, 0.6, 1); g.add(puff);
    } else if (type === 'bucket') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.22, 14), LR.Materials.painted('thatch', spec.hat.color, { repeat: [3, 1], cel: true })); m.position.y = 0.04; g.add(m);
    }
    return g;
  }

  function build(spec) {
    const P = LR.PALETTE;
    const S = spec.scale || 1, W = spec.width || 1;
    const M = (c, o) => LR.Materials.flat(c, { cel: true, ...(o || {}) });
    const skin = M(spec.skin), shirt = M(spec.shirt), shorts = M(spec.shorts);
    const hair = M(spec.hair), hairLight = M(spec.hairLight || spec.hair);
    const mesh = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
    const joint = (geo, mat, x, y, z, parent) => { const m = mesh(geo, mat, x, y, z, parent); m.userData.noOutline = true; return m; };
    const root = new THREE.Group();
    const body = new THREE.Group(); root.add(body);
    const HIP = 0.78;
    const hips = new THREE.Group(); hips.position.y = HIP; body.add(hips);
    // Shorts: a rounded block that flares a little.
    const shortsMesh = mesh(new THREE.CylinderGeometry(0.25 * W, 0.22 * W, 0.34, 12), shorts, 0, -0.06, 0, hips); shortsMesh.scale.set(1, 1, 0.72);
    mesh(new THREE.TorusGeometry(0.03, 0.012, 5, 10), M(0xE8DCC0), -0.03, -0.02, 0.17 * W, hips);   // drawstring loops
    mesh(new THREE.TorusGeometry(0.03, 0.012, 5, 10), M(0xE8DCC0), 0.03, -0.02, 0.17 * W, hips);
    const torso = new THREE.Group(); hips.add(torso);
    // Torso: a rounded barrel, wider at the shoulders.
    const torsoMesh = mesh(new THREE.CapsuleGeometry(0.22 * W, 0.24, 6, 14), shirt, 0, 0.3, 0, torso); torsoMesh.scale.set(1.05, 1, 0.8);
    if (spec.vest) {
      const vest = M(spec.vest, { side: THREE.DoubleSide });
      const shell = mesh(new THREE.CylinderGeometry(0.245 * W, 0.26 * W, 0.46, 16, 1, true, 0.55, Math.PI * 2 - 1.1), vest, 0, 0.28, 0, torso);
      shell.scale.set(1, 1, 0.82);
      const lapelL = mesh(new THREE.BoxGeometry(0.12 * W, 0.44, 0.05), vest, -0.15 * W, 0.26, 0.18 * W, torso); lapelL.rotation.y = 0.45;
      const lapelR = mesh(new THREE.BoxGeometry(0.12 * W, 0.44, 0.05), vest, 0.15 * W, 0.26, 0.18 * W, torso); lapelR.rotation.y = -0.45;
    }
    if (spec.apron) { mesh(new THREE.BoxGeometry(0.34 * W, 0.62, 0.05), M(spec.apron), 0, 0.02, 0.19 * W, torso); }
    if (spec.necklace !== false) {
      const cord = mesh(new THREE.TorusGeometry(0.15 * W, 0.012, 5, 16), M(0xE8DCC0), 0, 0.5, 0.02, torso); cord.rotation.x = Math.PI / 2 - 0.35;
      mesh(new THREE.SphereGeometry(0.045, 8, 6), M(0xFFF8EC), 0, 0.4, 0.2 * W, torso).scale.set(1, 1.2, 0.6);
    }
    joint(new THREE.CylinderGeometry(0.075, 0.09, 0.12, 10), skin, 0, 0.56, 0, torso);   // neck
    // Head.
    const head = new THREE.Group(); head.position.set(0, 0.6, 0); torso.add(head);
    const R = 0.29;
    const headMesh = mesh(headGeometry(R), skin, 0, 0.24, 0, head); headMesh.scale.set(1, 1, 0.94);
    const face = new THREE.Mesh(new THREE.SphereGeometry(R * 1.01, 22, 16, Math.PI * 0.2, Math.PI * 0.6, Math.PI * 0.28, Math.PI * 0.5),
      new THREE.MeshBasicMaterial({ map: faceTexture(spec), transparent: true, depthWrite: false }));
    face.position.y = 0.26; face.scale.set(1, 1.02, 0.94); face.renderOrder = 2; face.userData.noOutline = true; head.add(face);
    joint(new THREE.SphereGeometry(0.05, 8, 6), skin, -0.27, 0.22, 0.0, head);   // ears
    joint(new THREE.SphereGeometry(0.05, 8, 6), skin, 0.27, 0.22, 0.0, head);
    // Hair: a cap plus chunky wedges. Bangs sweep down over the brow.
    const hairCap = joint(new THREE.SphereGeometry(R * 1.04, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 0.3, -0.01, head);
    hairCap.scale.set(1, 0.95, 0.98);
    if (spec.bangs !== false) {
      for (let i = 0; i < 5; i++) {
        const a = (i - 2) * 0.42;
        const sp = mesh(spikeGeometry(0.14, 0.26, 0.07), i % 2 ? hairLight : hair, Math.sin(a) * R * 0.92, 0.47, Math.cos(a) * R * 0.86, head);
        sp.rotation.set(Math.PI - 0.55 - Math.abs(a) * 0.3, a, (i - 2) * 0.28);   // pointing down and outward
      }
      for (const s of [-1, 1]) { const sp = mesh(spikeGeometry(0.13, 0.24, 0.07), hair, s * R * 0.98, 0.42, 0.02, head); sp.rotation.set(Math.PI - 0.7, s * Math.PI / 2, s * 0.5); }
    }
    for (let i = 0; i < 4; i++) { const sp = mesh(spikeGeometry(0.14, 0.26, 0.07), i % 2 ? hair : hairLight, (i - 1.5) * 0.13, 0.43, -R * 0.9, head); sp.rotation.set(-Math.PI + 0.9, Math.PI, (i - 1.5) * 0.3); }
    const hat = hatMesh(spec, null); hat.position.y = 0.5; hat.scale.set(1.3, 1.25, 1.3); head.add(hat);
    // Arms: smooth tapered limbs with round joints and mitten hands.
    const arm = (side) => {
      const sh = new THREE.Group(); sh.position.set(side * 0.28 * W, 0.47, 0); torso.add(sh);
      joint(new THREE.SphereGeometry(0.1, 10, 8), shirt, 0, 0, 0, sh);                               // shoulder
      mesh(limbGeometry(0.085, 0.07, 0.3), skin, 0, -0.02, 0, sh);
      mesh(new THREE.CylinderGeometry(0.105, 0.1, 0.16, 12), shirt, 0, -0.09, 0, sh);                 // rolled sleeve
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      joint(new THREE.SphereGeometry(0.072, 10, 8), skin, 0, 0, 0, el);                                // elbow
      mesh(limbGeometry(0.07, 0.06, 0.24), skin, 0, 0, 0, el);
      const hand = mesh(new THREE.SphereGeometry(0.095, 10, 8), skin, 0, -0.28, 0, el); hand.scale.set(0.9, 1.05, 1.2);
      joint(new THREE.SphereGeometry(0.045, 8, 6), skin, side * 0.07, -0.26, 0.06, el);                // thumb
      return { upper: sh, lower: el };
    };
    const leg = (side) => {
      const hp = new THREE.Group(); hp.position.set(side * 0.12 * W, -0.02, 0); hips.add(hp);
      mesh(limbGeometry(0.1, 0.085, 0.36), skin, 0, 0, 0, hp);
      const kn = new THREE.Group(); kn.position.y = -0.36; hp.add(kn);
      joint(new THREE.SphereGeometry(0.09, 10, 8), skin, 0, 0, 0, kn);                                  // knee
      mesh(limbGeometry(0.085, 0.075, 0.3), skin, 0, 0, 0, kn);
      const foot = mesh(new THREE.CapsuleGeometry(0.085, 0.16, 4, 10), skin, 0, -0.32, 0.07, kn); foot.rotation.x = Math.PI / 2; foot.scale.set(1.1, 1, 0.75);
      joint(new THREE.SphereGeometry(0.05, 8, 6), skin, side * 0.05, -0.33, 0.2, kn);                  // big toe
      return { upper: hp, lower: kn };
    };
    const rig = { root, body, hips, torso, head, hat, armL: arm(-1), armR: arm(1), legL: leg(-1), legR: leg(1), spec, scale: S, hipHeight: HIP };
    LR.Toon.addOutlines(root, 0.015);
    root.scale.set(S, S, S);
    return rig;
  }

  return { build, faceTexture };
})();
