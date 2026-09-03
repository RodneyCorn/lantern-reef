// The sky: massive flat-bottomed cumulus towers built from many big
// painted puffs, and long wispy cirrus streaks high above them. Both
// layers drift slowly and take the sun's color through the day.
window.LR = window.LR || {};
LR.Clouds = class Clouds {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'clouds';
    this.clouds = [];
    const rnd = LR.Seeded.rng(4242);
    this.puffMat = new THREE.SpriteMaterial({ map: LR.Textures.cloudPuff(), transparent: true, depthWrite: false, fog: true });
    this.wispMat = new THREE.SpriteMaterial({ map: LR.Textures.cloudWisp(), transparent: true, depthWrite: false, fog: true, opacity: 0.85 });

    // Cumulus: 9 big ones. Each is a dome of puffs over a flat base line,
    // with a couple of towers pushing up out of the top.
    for (let i = 0; i < 9; i++) {
      const c = new THREE.Group();
      const cx = (rnd() - 0.5) * 2200, cz = (rnd() - 0.5) * 2200, base = 230 + rnd() * 90;
      const width = 260 + rnd() * 300, height = width * (0.28 + rnd() * 0.22);
      const puffs = 14 + Math.floor(rnd() * 8);
      for (let k = 0; k < puffs; k++) {
        const t = rnd() * 2 - 1;                                   // -1..1 across the cloud
        const dome = Math.sqrt(Math.max(0, 1 - t * t));            // dome profile
        const size = width * (0.22 + rnd() * 0.16) * (0.6 + dome * 0.6);
        const s = new THREE.Sprite(this.puffMat);
        s.position.set(t * width * 0.5 + (rnd() - 0.5) * width * 0.08, size * 0.32 + rnd() * height * dome * 0.9, (rnd() - 0.5) * width * 0.3);
        s.scale.set(size * (1.1 + rnd() * 0.3), size, 1);
        c.add(s);
      }
      for (let k = 0; k < 2 + Math.floor(rnd() * 2); k++) {        // towers
        const t = (rnd() - 0.5) * 0.9, size = width * (0.18 + rnd() * 0.12);
        const s = new THREE.Sprite(this.puffMat);
        s.position.set(t * width * 0.5, height * (0.9 + rnd() * 0.6), (rnd() - 0.5) * width * 0.15);
        s.scale.set(size, size * 1.15, 1);
        c.add(s);
      }
      // A wide flat foot so the base reads as a straight underside.
      for (let k = 0; k < 4; k++) {
        const s = new THREE.Sprite(this.puffMat);
        const size = width * 0.28;
        s.position.set((k - 1.5) * width * 0.22, size * 0.3, 0);
        s.scale.set(size * 1.6, size * 0.75, 1);
        c.add(s);
      }
      c.position.set(cx, base, cz);
      c.userData.speed = 3 + rnd() * 2.5;
      this.group.add(c); this.clouds.push(c);
    }
    // Cirrus: long stretched streaks, higher and thinner.
    this.wisps = [];
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Sprite(this.wispMat);
      const len = 700 + rnd() * 900;
      s.position.set((rnd() - 0.5) * 2600, 420 + rnd() * 160, (rnd() - 0.5) * 2600);
      s.scale.set(len, len * (0.09 + rnd() * 0.07), 1);
      s.material = this.wispMat;
      s.userData.speed = 1.5 + rnd() * 1.5;
      this.group.add(s); this.wisps.push(s);
    }
    scene.add(this.group);
  }
  update(dt, sky) {
    for (const c of this.clouds) { c.position.x += c.userData.speed * dt; if (c.position.x > 1300) c.position.x -= 2600; }
    for (const w of this.wisps) { w.position.x += w.userData.speed * dt; if (w.position.x > 1500) w.position.x -= 3000; }
    const k = Math.max(0.28, Math.min(1, sky.sun.intensity / 2.4));
    this.puffMat.color.setRGB(1, 1, 1).lerp(sky._c.sun, 0.55).multiplyScalar(k);
    this.wispMat.color.copy(this.puffMat.color);
  }
};
