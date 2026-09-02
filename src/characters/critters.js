// Ambient life: gull flocks and perched gulls that take off when Milo comes
// close, crabs that scuttle sideways and flee, fish shadows in the shallows,
// and butterflies over the grass.
window.LR = window.LR || {};
LR.Critters = class Critters {
  constructor(scene, terrain, physics) {
    this.terrain = terrain;
    this.group = new THREE.Group(); this.group.name = 'critters';
    this.t = 0;
    const rnd = LR.Seeded.rng(313);
    const white = LR.Materials.flat(0xFFFFFF), gray = LR.Materials.flat(0xB8C0C8), orange = LR.Materials.flat(0xFF9A3C);
    const gullModel = () => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.3, 4, 8), white); body.rotation.x = Math.PI / 2; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), white); head.position.set(0, 0.06, 0.26); g.add(head);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 6), orange); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.05, 0.4); g.add(beak);
      const wings = [];
      for (const s of [-1, 1]) {
        const w = new THREE.Group(); w.position.set(s * 0.1, 0.04, 0);
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 0.26), white); m.position.x = s * 0.38; w.add(m);
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.22), gray); tip.position.x = s * 0.82; w.add(tip);
        g.add(w); wings.push(w);
      }
      g.userData.wings = wings;
      return g;
    };
    // Flying flocks.
    this.flocks = [];
    for (const f of [{ cx: -120, cz: 130, alt: 16, r: 34, n: 5 }, { cx: 250, cz: 290, alt: 20, r: 40, n: 4 }, { cx: 205, cz: -150, alt: 74, r: 38, n: 5 }, { cx: 40, cz: 190, alt: 14, r: 30, n: 4 }]) {
      for (let i = 0; i < f.n; i++) {
        const g = gullModel(); this.group.add(g);
        this.flocks.push({ g, cx: f.cx, cz: f.cz, alt: f.alt + rnd() * 6, r: f.r * (0.7 + rnd() * 0.6), a: rnd() * Math.PI * 2, speed: (0.25 + rnd() * 0.15) * (rnd() < 0.5 ? 1 : -1), flap: rnd() * 10 });
      }
    }
    // Perched gulls on posts along the cove docks and the pier.
    this.perched = [];
    const perchSpots = [[-152, 148], [-146, 165], [-99, 150], [-97, 172], [155, 176], [175, 200], [200, 228], [228, 258]];
    for (const [x, z] of perchSpots) {
      const g = gullModel(); const y = Math.max(terrain.height(x, z), 0) + 2.3;
      g.position.set(x, y, z); g.rotation.y = rnd() * Math.PI * 2; this.group.add(g);
      this.perched.push({ g, home: new THREE.Vector3(x, y, z), state: 'perched', timer: 0, vel: new THREE.Vector3() });
    }
    // Crabs.
    this.crabs = [];
    const crabModel = () => {
      const g = new THREE.Group(), red = LR.Materials.flat(0xE8583C), dark = LR.Materials.flat(0x1A1A1A);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 7), red); body.scale.set(1.2, 0.55, 0.9); body.position.y = 0.1; g.add(body);
      for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), red); c.position.set(s * 0.15, 0.1, 0.17); c.scale.set(1, 0.7, 1.3); g.add(c); }
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 4), red); l.position.set(s * 0.2, 0.06, -0.08 + i * 0.08); l.rotation.z = s * 1.1; g.add(l); }
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), dark); e.position.set(s * 0.06, 0.2, 0.14); g.add(e); }
      return g;
    };
    let tries = 0;
    while (this.crabs.length < 22 && tries++ < 3000) {
      const x = (rnd() - 0.5) * 620, z = (rnd() - 0.5) * 440, y = terrain.height(x, z);
      if (y < 0.5 || y > 2.0) continue;
      let shore = false; for (let a = 0; a < 6; a++) if (terrain.height(x + Math.cos(a) * 6, z + Math.sin(a) * 6) < 0) shore = true;
      if (!shore) continue;
      const g = crabModel(); g.position.set(x, y, z); g.rotation.y = rnd() * Math.PI * 2; this.group.add(g);
      this.crabs.push({ g, timer: rnd() * 2, dir: rnd() < 0.5 ? -1 : 1, moving: false });
    }
    // Fish shadows.
    this.fish = [];
    const fishGeo = new THREE.CircleGeometry(0.35, 8); fishGeo.rotateX(-Math.PI / 2); fishGeo.scale(1, 1, 2.2);
    const fishMat = new THREE.MeshBasicMaterial({ color: 0x0E2C58, transparent: true, opacity: 0.55, depthWrite: false });
    tries = 0;
    while (this.fish.length < 60 && tries++ < 6000) {
      const x = (rnd() - 0.5) * 700, z = (rnd() - 0.5) * 520, y = terrain.height(x, z);
      if (y > -1.2 || y < -7) continue;
      const m = new THREE.Mesh(fishGeo, fishMat); this.group.add(m);
      this.fish.push({ m, cx: x, cz: z, r: 2 + rnd() * 5, a: rnd() * Math.PI * 2, speed: (0.3 + rnd() * 0.5) * (rnd() < 0.5 ? 1 : -1), depth: -0.4 - rnd() * 0.8 });
    }
    // Butterflies.
    this.flies = [];
    const wingGeo = new THREE.PlaneGeometry(0.14, 0.12);
    const cols = [0xFFD23F, 0xFF9A3C, 0xFFFFFF, 0xFF8AD0, 0x9BE868];
    tries = 0;
    while (this.flies.length < 36 && tries++ < 3000) {
      const x = (rnd() - 0.5) * 600, z = (rnd() - 0.5) * 420, y = terrain.height(x, z);
      if (y < 2.8) continue;
      const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: cols[Math.floor(rnd() * cols.length)], side: THREE.DoubleSide });
      const wl = new THREE.Mesh(wingGeo, mat), wr = new THREE.Mesh(wingGeo, mat);
      wl.position.x = -0.07; wr.position.x = 0.07; wl.rotation.x = wr.rotation.x = -Math.PI / 2;
      const pl = new THREE.Group(), pr = new THREE.Group(); pl.add(wl); pr.add(wr); g.add(pl); g.add(pr);
      g.userData.w = [pl, pr]; this.group.add(g);
      this.flies.push({ g, cx: x, cz: z, base: y, a: rnd() * 10, b: rnd() * 10, flap: rnd() * 10 });
    }
    scene.add(this.group);
  }

  update(dt, playerPos) {
    this.t += dt;
    const t = this.t;
    for (const f of this.flocks) {
      f.a += dt * f.speed;
      const x = f.cx + Math.cos(f.a) * f.r, z = f.cz + Math.sin(f.a) * f.r * 0.8, y = f.alt + Math.sin(t * 0.7 + f.flap) * 2;
      const px = f.g.position.x, pz = f.g.position.z;
      f.g.position.set(x, y, z);
      f.g.rotation.y = Math.atan2(x - px, z - pz);
      f.g.rotation.z = -f.speed * 0.8;
      const glide = Math.sin(t * 0.35 + f.flap) > 0.3;
      const flap = glide ? 0.15 : Math.sin(t * 9 + f.flap) * 0.7;
      f.g.userData.wings[0].rotation.z = flap; f.g.userData.wings[1].rotation.z = -flap;
    }
    for (const p of this.perched) {
      const d = Math.hypot(playerPos.x - p.g.position.x, playerPos.z - p.g.position.z);
      if (p.state === 'perched') {
        p.g.userData.wings[0].rotation.z = 0.05; p.g.userData.wings[1].rotation.z = -0.05;
        if (d < 7) { p.state = 'fly'; p.timer = 0; const ax = p.g.position.x - playerPos.x, az = p.g.position.z - playerPos.z, al = Math.hypot(ax, az) || 1; p.vel.set(ax / al * 6, 5, az / al * 6); }
      } else if (p.state === 'fly') {
        p.timer += dt;
        p.vel.y = Math.max(1.5, p.vel.y - dt * 2);
        p.g.position.addScaledVector(p.vel, dt);
        p.g.rotation.y = Math.atan2(p.vel.x, p.vel.z);
        const flap = Math.sin(t * 11) * 0.8; p.g.userData.wings[0].rotation.z = flap; p.g.userData.wings[1].rotation.z = -flap;
        if (p.timer > 7) { p.state = 'away'; p.timer = 0; p.g.visible = false; }
      } else if (p.state === 'away') {
        p.timer += dt;
        if (p.timer > 25 && d > 12) { p.state = 'perched'; p.g.visible = true; p.g.position.copy(p.home); }
      }
    }
    for (const c of this.crabs) {
      const dx = c.g.position.x - playerPos.x, dz = c.g.position.z - playerPos.z, d = Math.hypot(dx, dz);
      let vx = 0, vz = 0;
      if (d < 4.5) {
        const s = 3.6 / (d || 1); vx = dx * s; vz = dz * s;
        c.g.rotation.y = Math.atan2(vx, vz) + Math.PI / 2;   // crabs run sideways
      } else {
        c.timer -= dt;
        if (c.timer <= 0) { c.moving = !c.moving; c.timer = c.moving ? 0.8 + Math.random() * 1.2 : 1 + Math.random() * 2.5; if (!c.moving) c.dir = Math.random() < 0.5 ? -1 : 1; }
        if (c.moving) { const side = c.g.rotation.y + Math.PI / 2; vx = Math.sin(side) * 1.1 * c.dir; vz = Math.cos(side) * 1.1 * c.dir; }
      }
      if (vx || vz) {
        const nx = c.g.position.x + vx * dt, nz = c.g.position.z + vz * dt, ny = this.terrain.height(nx, nz);
        if (ny > 0.3 && ny < 2.4) { c.g.position.set(nx, ny, nz); c.g.position.y += Math.abs(Math.sin(t * 22)) * 0.02; } else { c.dir *= -1; }
      }
    }
    for (const f of this.fish) {
      f.a += dt * f.speed;
      const x = f.cx + Math.cos(f.a) * f.r, z = f.cz + Math.sin(f.a * 1.3) * f.r * 0.6;
      f.m.rotation.y = Math.atan2(x - f.m.position.x, z - f.m.position.z);
      f.m.position.set(x, Math.min(f.depth, this.terrain.height(x, z) + 0.3 < f.depth ? f.depth : this.terrain.height(x, z) + 0.3), z);
    }
    for (const b of this.flies) {
      const x = b.cx + Math.sin(t * 0.5 + b.a) * 3 + Math.sin(t * 1.7 + b.b) * 0.6, z = b.cz + Math.cos(t * 0.4 + b.b) * 3;
      const y = Math.max(this.terrain.height(x, z), b.base - 1) + 0.8 + Math.sin(t * 2.1 + b.a) * 0.4;
      b.g.rotation.y = Math.atan2(x - b.g.position.x, z - b.g.position.z);
      b.g.position.set(x, y, z);
      const flap = Math.sin(t * 18 + b.flap) * 0.9;
      b.g.userData.w[0].rotation.z = flap; b.g.userData.w[1].rotation.z = -flap;
    }
  }
};
