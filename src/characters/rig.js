// A jointed character built from primitives. One builder makes Milo and
// every islander from a spec (colors, hat, hair, proportions). Joints are
// plain Groups the animator rotates. The character faces +z; feet at y = 0.
window.LR = window.LR || {};
LR.Rig = (function () {
  const faceCache = {};
  // Painted face: eyes, brows, freckles, smile, on a transparent canvas
  // that wraps the front of the head.
  function faceTexture(spec) {
    const key = `${spec.eyes}|${spec.hair}|${spec.beard ? 1 : 0}|${spec.freckles === false ? 0 : 1}|${spec.smile || 'smile'}`;
    if (faceCache[key]) return faceCache[key];
    const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
    const ctx = c.getContext('2d');
    const eye = (x) => {
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, 60, 12, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#' + spec.eyes.toString(16).padStart(6, '0'); ctx.beginPath(); ctx.ellipse(x, 62, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10203A'; ctx.beginPath(); ctx.ellipse(x, 63, 4.5, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - 3, 57, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#' + spec.hair.toString(16).padStart(6, '0'); ctx.lineWidth = 4.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 13, 40 + (x < 64 ? 2 : 0)); ctx.quadraticCurveTo(x, 34, x + 13, 40 + (x < 64 ? 0 : 2)); ctx.stroke();
    };
    eye(40); eye(88);
    if (spec.freckles !== false) { ctx.fillStyle = 'rgba(120,60,30,0.55)'; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(30 + (i * 37) % 70 + (i % 3) * 3, 78 + (i % 4) * 3 - (Math.abs(i - 6)), 1.6, 0, Math.PI * 2); ctx.fill(); } }
    ctx.strokeStyle = '#5A2E14'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(60, 80); ctx.lineTo(64, 84); ctx.stroke();   // nose
    ctx.beginPath();
    if (spec.smile === 'grin') { ctx.moveTo(48, 96); ctx.quadraticCurveTo(64, 112, 80, 96); ctx.fillStyle = '#5A2E14'; ctx.fill(); }
    else { ctx.moveTo(52, 98); ctx.quadraticCurveTo(64, 108, 76, 98); }
    ctx.stroke();
    if (spec.beard) { ctx.fillStyle = '#' + spec.beard.toString(16).padStart(6, '0'); ctx.beginPath(); ctx.moveTo(22, 90); ctx.quadraticCurveTo(64, 150, 106, 90); ctx.quadraticCurveTo(100, 112, 64, 118); ctx.quadraticCurveTo(28, 112, 22, 90); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0)'; }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return (faceCache[key] = t);
  }

  function hatMesh(spec, mats) {
    const g = new THREE.Group();
    const type = spec.hat ? spec.hat.type : 'none';
    if (type === 'straw') {
      const pts = [];
      for (const [x, y] of [[0, 0.3], [0.2, 0.3], [0.24, 0.16], [0.25, 0.06], [0.42, 0.0], [0.45, -0.04], [0.46, -0.05], [0.43, -0.02], [0.26, 0.04], [0.23, 0.14], [0.19, 0.28], [0, 0.28]]) pts.push(new THREE.Vector2(x, y));
      const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), LR.Materials.painted('thatch', spec.hat.color || LR.PALETTE.miloStraw, { repeat: [4, 1], side: THREE.DoubleSide }));
      m.castShadow = true; g.add(m);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.035, 6, 20), LR.Materials.flat(spec.hat.band || LR.PALETTE.miloVest));
      band.rotation.x = Math.PI / 2; band.position.y = 0.09; g.add(band);
    } else if (type === 'cap') {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.235, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), LR.Materials.flat(spec.hat.color)); m.castShadow = true; g.add(m);
      const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 14, 1, false, -Math.PI * 0.35, Math.PI * 0.7), LR.Materials.flat(spec.hat.band || spec.hat.color));
      peak.position.set(0, 0.02, 0.06); peak.scale.set(1, 1, 1.5); g.add(peak);
      if (spec.hat.badge) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10), LR.Materials.flat(spec.hat.badge)); b.rotation.x = Math.PI / 2; b.position.set(0, 0.12, 0.22); g.add(b); }
    } else if (type === 'bandana') {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.225, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), LR.Materials.flat(spec.hat.color)); g.add(m);
      const knot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.14), LR.Materials.flat(spec.hat.color)); knot.position.set(0.05, 0.02, -0.2); knot.rotation.y = 0.5; g.add(knot);
    } else if (type === 'chef') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.3, 14), LR.Materials.flat(0xFFFFFF)); m.position.y = 0.15; g.add(m);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 9), LR.Materials.flat(0xFFFFFF)); puff.position.y = 0.32; puff.scale.set(1, 0.6, 1); g.add(puff);
    } else if (type === 'bucket') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.22, 14), LR.Materials.painted('thatch', spec.hat.color, { repeat: [3, 1] })); m.position.y = 0.04; g.add(m);
    }
    return g;
  }

  function build(spec) {
    const P = LR.PALETTE;
    const S = spec.scale || 1, W = spec.width || 1;
    const skin = LR.Materials.flat(spec.skin), shirt = LR.Materials.flat(spec.shirt), shorts = LR.Materials.flat(spec.shorts);
    const hair = LR.Materials.flat(spec.hair), hairLight = LR.Materials.flat(spec.hairLight || spec.hair);
    const mesh = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
    const root = new THREE.Group();
    const body = new THREE.Group(); root.add(body);            // the animator flips/leans this
    const hips = new THREE.Group(); hips.position.y = 0.82; body.add(hips);
    mesh(new THREE.BoxGeometry(0.46 * W, 0.32, 0.32 * W), shorts, 0, -0.06, 0, hips);
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 5), LR.Materials.flat(0xE8DCC0), -0.04, -0.05, 0.16, hips).rotation.z = 0.3;  // drawstring
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 5), LR.Materials.flat(0xE8DCC0), 0.04, -0.05, 0.16, hips).rotation.z = -0.3;
    const torso = new THREE.Group(); hips.add(torso);
    mesh(new THREE.CapsuleGeometry(0.2 * W, 0.26, 4, 12), shirt, 0, 0.3, 0, torso);
    if (spec.vest) {
      const vest = LR.Materials.flat(spec.vest, { side: THREE.DoubleSide });
      // One open-fronted shell around the torso, plus two lapels.
      const shell = mesh(new THREE.CylinderGeometry(0.235 * W, 0.255 * W, 0.46, 14, 1, true, 0.6, Math.PI * 2 - 1.2), vest, 0, 0.28, 0, torso);
      shell.scale.set(1, 1, 0.92);
      mesh(new THREE.BoxGeometry(0.11 * W, 0.42, 0.05), vest, -0.14 * W, 0.26, 0.2 * W, torso).rotation.y = 0.35;
      mesh(new THREE.BoxGeometry(0.11 * W, 0.42, 0.05), vest, 0.14 * W, 0.26, 0.2 * W, torso).rotation.y = -0.35;
    }
    if (spec.apron) { mesh(new THREE.BoxGeometry(0.34 * W, 0.62, 0.05), LR.Materials.flat(spec.apron), 0, 0.02, 0.2 * W, torso); }
    if (spec.necklace !== false) {
      const cord = mesh(new THREE.TorusGeometry(0.14 * W, 0.012, 5, 16), LR.Materials.flat(0xE8DCC0), 0, 0.5, 0.02, torso); cord.rotation.x = Math.PI / 2 - 0.35;
      mesh(new THREE.SphereGeometry(0.04, 8, 6), LR.Materials.flat(0xFFF8EC), 0, 0.41, 0.2 * W, torso).scale.set(1, 1.2, 0.6);
    }
    mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.1, 10), skin, 0, 0.56, 0, torso);   // neck
    // Head.
    const head = new THREE.Group(); head.position.set(0, 0.58, 0); torso.add(head);
    const headMesh = mesh(new THREE.SphereGeometry(0.25, 18, 14), skin, 0, 0.24, 0, head);
    headMesh.scale.set(1, 1.05, 0.98);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.253, 18, 14, Math.PI * 0.22, Math.PI * 0.56, Math.PI * 0.3, Math.PI * 0.45),
      new THREE.MeshLambertMaterial({ map: faceTexture(spec), transparent: true, depthWrite: false }));
    face.position.y = 0.24; face.scale.set(1, 1.05, 0.98); face.renderOrder = 2; head.add(face);
    mesh(new THREE.SphereGeometry(0.045, 8, 6), skin, -0.24, 0.22, 0.02, head);   // ears
    mesh(new THREE.SphereGeometry(0.045, 8, 6), skin, 0.24, 0.22, 0.02, head);
    // Hair: cap under the hat, spiky bangs poking out, a tuft at the back.
    const hairCap = mesh(new THREE.SphereGeometry(0.256, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, 0, 0.28, -0.01, head);
    hairCap.scale.set(1.02, 0.95, 1.02);
    const bangN = spec.bangs === false ? 0 : 6;
    for (let i = 0; i < bangN; i++) {
      const a = (i - 2.5) * 0.36;
      const c = mesh(new THREE.ConeGeometry(0.06, 0.22, 5), i % 2 ? hairLight : hair, Math.sin(a) * 0.22, 0.4, Math.cos(a) * 0.2, head);
      c.rotation.set(1.15 + Math.abs(a) * 0.4, a, (i % 2 ? 0.3 : -0.3));
    }
    for (let i = 0; i < 3; i++) { const c = mesh(new THREE.ConeGeometry(0.065, 0.22, 5), i % 2 ? hair : hairLight, (i - 1) * 0.12, 0.36, -0.2, head); c.rotation.set(-1.4, 0, (i - 1) * 0.4); }
    const hat = hatMesh(spec, null); hat.position.y = 0.44; hat.scale.set(1.18, 1.18, 1.18); head.add(hat);
    // Arms.
    const arm = (side) => {
      const sh = new THREE.Group(); sh.position.set(side * 0.27 * W, 0.48, 0); torso.add(sh);
      mesh(new THREE.CapsuleGeometry(0.075, 0.18, 4, 8), skin, 0, -0.15, 0, sh);
      mesh(new THREE.CylinderGeometry(0.105, 0.095, 0.15, 10), shirt, 0, -0.07, 0, sh);       // rolled sleeve
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      mesh(new THREE.CapsuleGeometry(0.068, 0.16, 4, 8), skin, 0, -0.12, 0, el);
      mesh(new THREE.SphereGeometry(0.09, 8, 6), skin, 0, -0.26, 0, el).scale.set(1, 0.85, 1.15);
      return { upper: sh, lower: el };
    };
    const leg = (side) => {
      const hp = new THREE.Group(); hp.position.set(side * 0.12 * W, 0, 0); hips.add(hp);
      mesh(new THREE.CapsuleGeometry(0.1, 0.22, 4, 8), skin, 0, -0.19, 0, hp);
      const kn = new THREE.Group(); kn.position.y = -0.38; hp.add(kn);
      mesh(new THREE.CapsuleGeometry(0.088, 0.2, 4, 8), skin, 0, -0.16, 0, kn);
      const foot = mesh(new THREE.BoxGeometry(0.17, 0.1, 0.3), LR.Materials.flat(spec.skin, { flatShading: true }), 0, -0.37, 0.06, kn);
      foot.scale.set(1, 1, 1);
      return { upper: hp, lower: kn };
    };
    const rig = { root, body, hips, torso, head, hat, armL: arm(-1), armR: arm(1), legL: leg(-1), legR: leg(1), spec, scale: S };
    root.scale.set(S, S, S);
    return rig;
  }

  return { build, faceTexture };
})();
