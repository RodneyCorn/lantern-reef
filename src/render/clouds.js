// The sky: high flat cloud sheets, like the long feathered layers over an
// island on a clear day. Each sheet is a huge horizontal plane with a
// painted wispy texture; from the ground they foreshorten into thin bands
// stacked toward the horizon. A few small distant cumulus puffs sit low
// on the horizon for depth. Everything drifts and takes the sun's color.
window.LR = window.LR || {};
LR.Clouds = class Clouds {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'clouds';
    const rnd = LR.Seeded.rng(4242);
    this.sheets = [];
    this.sheetMats = [];
    for (let i = 0; i < 9; i++) {
      const tex = LR.Textures.cloudSheet(57 + (i % 4));
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true, opacity: 0.7 + rnd() * 0.2 });
      const len = 1400 + rnd() * 1800, wid = len * (0.22 + rnd() * 0.18);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(len, wid), mat);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = (rnd() - 0.5) * 0.7;
      m.position.set((rnd() - 0.5) * 3200, 320 + rnd() * 420, (rnd() - 0.5) * 3200);
      m.renderOrder = 4;
      m.userData.speed = 2 + rnd() * 3;
      this.group.add(m); this.sheets.push(m); this.sheetMats.push(mat);
    }
    // Low distant cumulus on the horizon.
    this.puffMat = new THREE.SpriteMaterial({ map: LR.Textures.cloudPuff(), transparent: true, depthWrite: false, fog: true });
    this.puffs = [];
    for (let i = 0; i < 10; i++) {
      const c = new THREE.Group();
      const a = rnd() * Math.PI * 2, r = 1500 + rnd() * 400;
      const width = 220 + rnd() * 260;
      for (let k = 0; k < 6; k++) {
        const t = (k / 5) * 2 - 1, dome = Math.sqrt(Math.max(0, 1 - t * t));
        const size = width * 0.3 * (0.6 + dome * 0.6);
        const s = new THREE.Sprite(this.puffMat);
        s.position.set(t * width * 0.5, size * 0.3 + dome * width * 0.12, 0);
        s.scale.set(size * 1.3, size, 1); c.add(s);
      }
      c.position.set(Math.cos(a) * r, 120 + rnd() * 60, Math.sin(a) * r);
      c.userData.speed = 1.5 + rnd();
      this.group.add(c); this.puffs.push(c);
    }
    scene.add(this.group);
  }
  update(dt, sky) {
    for (const s of this.sheets) { s.position.x += s.userData.speed * dt; if (s.position.x > 1900) s.position.x -= 3800; }
    for (const c of this.puffs) { c.position.x += c.userData.speed * dt; if (c.position.x > 2000) c.position.x -= 4000; }
    const k = Math.max(0.28, Math.min(1, sky.sun.intensity / 2.4));
    const col = new THREE.Color(1, 1, 1).lerp(sky._c.sun, 0.5).multiplyScalar(k);
    for (const m of this.sheetMats) m.color.copy(col);
    this.puffMat.color.copy(col);
  }
};
