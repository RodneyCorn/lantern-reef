// The hot-air balloon that drifts in a slow loop over the island.
window.LR = window.LR || {};
LR.Balloon = class Balloon {
  constructor(scene) {
    const P = LR.PALETTE;
    this.group = new THREE.Group(); this.group.name = 'balloon';
    const env = new THREE.SphereGeometry(7, 24, 16);
    env.scale(1, 1.2, 1);
    const pos = env.attributes.position, col = [];
    const a = new THREE.Color(P.roofRed), b = new THREE.Color(0xFFF4D8), c = new THREE.Color(P.roofBlue), d = new THREE.Color(P.flowerYellow);
    const stripes = [a, b, c, b, d, b];
    for (let i = 0; i < pos.count; i++) {
      const ang = Math.atan2(pos.getZ(i), pos.getX(i));
      const k = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 12) % stripes.length;
      const s = stripes[k]; col.push(s.r, s.g, s.b);
    }
    env.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const envelope = new THREE.Mesh(env, LR.Materials.flat(0xffffff, { vertexColors: true }));
    envelope.castShadow = true; this.group.add(envelope);
    const skirt = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.5, 12, 1, true), LR.Materials.flat(0xD9583A, { side: THREE.DoubleSide }));
    skirt.position.y = -9.2; skirt.rotation.x = Math.PI; this.group.add(skirt);
    const basket = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 2.6), LR.Materials.painted('planks', 0xA07850, { repeat: [2, 1] }));
    basket.position.y = -13.5; basket.castShadow = true; this.group.add(basket);
    const ropes = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) ropes.push({ geometry: new THREE.CylinderGeometry(0.05, 0.05, 3.2, 4), position: new THREE.Vector3(sx * 1.1, -11.2, sz * 1.1) });
    this.group.add(new THREE.Mesh(LR.Geo.merge(ropes), LR.Materials.flat(0x6B4A2E)));
    scene.add(this.group);
    this.center = { x: 60, z: -10 }; this.radius = 300; this.alt = 125; this.speed = 0.014; this.t = 1.2;
  }
  update(dt) {
    this.t += dt * this.speed;
    const x = this.center.x + Math.cos(this.t) * this.radius, z = this.center.z + Math.sin(this.t) * this.radius * 0.75;
    this.group.position.set(x, this.alt + Math.sin(this.t * 7) * 6, z);
    this.group.rotation.y = -this.t;
  }
};
