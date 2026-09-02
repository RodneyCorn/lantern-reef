// Puffy cumulus made of soft sprite clusters, drifting slowly over the
// island and tinted by the time of day (white at noon, pink at sunset).
window.LR = window.LR || {};
LR.Clouds = class Clouds {
  constructor(scene, count = 18) {
    this.group = new THREE.Group();
    this.group.name = 'clouds';
    this.clouds = [];
    const rnd = LR.Seeded.rng(4242);
    this.material = new THREE.SpriteMaterial({ map: LR.Textures.cloudPuff(), transparent: true, depthWrite: false, fog: true });
    for (let i = 0; i < count; i++) {
      const c = new THREE.Group();
      const cx = (rnd() - 0.5) * 1900, cz = (rnd() - 0.5) * 1900, cy = 150 + rnd() * 90;
      const width = 60 + rnd() * 110, puffs = 5 + Math.floor(rnd() * 6);
      for (let k = 0; k < puffs; k++) {
        const s = new THREE.Sprite(this.material);
        const t = (k / (puffs - 1)) - 0.5;
        const size = (width * 0.35) * (0.75 + rnd() * 0.5) * (1 - Math.abs(t) * 0.7);
        s.position.set(t * width + (rnd() - 0.5) * 12, (rnd() - 0.3) * size * 0.35 + (1 - Math.abs(t) * 1.4) * size * 0.25, (rnd() - 0.5) * width * 0.25);
        s.scale.set(size, size * 0.8, 1);
        c.add(s);
      }
      c.position.set(cx, cy, cz);
      c.userData.speed = 2.5 + rnd() * 2.5;
      this.group.add(c);
      this.clouds.push(c);
    }
    scene.add(this.group);
  }
  update(dt, sky) {
    for (const c of this.clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 1000) c.position.x -= 2000;
    }
    // Lit by the sun: warm white by day, orange-pink at sunset, dim blue at night.
    const k = Math.max(0.28, Math.min(1, sky.sun.intensity / 1.3));
    this.material.color.setRGB(1, 1, 1).lerp(sky._c.sun, 0.55).multiplyScalar(k);
  }
};
