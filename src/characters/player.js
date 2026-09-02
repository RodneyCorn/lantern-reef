// Milo's controller and, for this milestone, a chunky stand-in body that
// already carries his silhouette: the wide straw hat.
window.LR = window.LR || {};
LR.Player = class Player {
  constructor(scene, physics, spawn) {
    this.physics = physics;
    this.pos = new THREE.Vector3(spawn.x, physics.height(spawn.x, spawn.z), spawn.z);
    this.vel = new THREE.Vector3();
    this.heading = spawn.heading || 0;
    this.grounded = true;
    this.swimming = false;
    this.jumpsLeft = 2;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.radius = 0.45;
    this.height = 1.75;
    this.speed = 0;
    this._t = 0;
    this._n = new THREE.Vector3();
    this._landSquash = 0;

    // Stand-in body.
    const P = LR.PALETTE;
    const skin = new THREE.MeshLambertMaterial({ color: P.miloSkin });
    const cloth = new THREE.MeshLambertMaterial({ color: P.miloCloth });
    const vest = new THREE.MeshLambertMaterial({ color: P.miloVest });
    const straw = new THREE.MeshLambertMaterial({ color: P.miloStraw });
    const hair = new THREE.MeshLambertMaterial({ color: P.miloHair });
    const g = new THREE.Group();
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    add(new THREE.CapsuleGeometry(0.19, 0.25, 4, 10), skin, -0.16, 0.36, 0);   // legs
    add(new THREE.CapsuleGeometry(0.19, 0.25, 4, 10), skin, 0.16, 0.36, 0);
    add(new THREE.BoxGeometry(0.62, 0.34, 0.5), cloth, 0, 0.72, 0);              // shorts
    add(new THREE.CapsuleGeometry(0.34, 0.36, 4, 12), cloth, 0, 1.1, 0);        // shirt
    add(new THREE.BoxGeometry(0.72, 0.5, 0.22), vest, 0, 1.12, -0.19);          // vest back
    add(new THREE.BoxGeometry(0.2, 0.5, 0.36), vest, -0.3, 1.12, 0.05);         // vest fronts
    add(new THREE.BoxGeometry(0.2, 0.5, 0.36), vest, 0.3, 1.12, 0.05);
    this.armL = add(new THREE.CapsuleGeometry(0.11, 0.42, 4, 8), skin, -0.5, 1.02, 0);
    this.armR = add(new THREE.CapsuleGeometry(0.11, 0.42, 4, 8), skin, 0.5, 1.02, 0);
    add(new THREE.SphereGeometry(0.4, 16, 12), skin, 0, 1.72, 0);               // head
    add(new THREE.SphereGeometry(0.42, 16, 12), hair, 0, 1.84, -0.06).scale.set(1, 0.7, 1);
    add(new THREE.CylinderGeometry(0.66, 0.7, 0.06, 20), straw, 0, 2.02, 0.02);  // brim
    add(new THREE.CylinderGeometry(0.3, 0.34, 0.22, 16), straw, 0, 2.14, 0.02);  // crown
    add(new THREE.CylinderGeometry(0.325, 0.35, 0.07, 16), vest, 0, 2.06, 0.02); // band
    const eyeMat = new THREE.MeshLambertMaterial({ color: P.miloEyes });
    add(new THREE.SphereGeometry(0.07, 8, 8), eyeMat, -0.14, 1.76, 0.36);
    add(new THREE.SphereGeometry(0.07, 8, 8), eyeMat, 0.14, 1.76, 0.36);
    this.body = g;
    this.root = new THREE.Group();
    this.root.add(g);
    this.root.position.copy(this.pos);
    this.root.name = 'player';
    scene.add(this.root);
  }

  update(dt, input, camYaw) {
    const ph = this.physics;
    const mv = input.move;
    // Camera-relative move direction: forward is away from the camera.
    let dx = 0, dz = 0;
    if (mv.len > 0) {
      // The camera sits at (sin yaw, cos yaw) from the player, so forward
      // is (-sin, -cos) and camera-right is (cos, -sin). Stick up (mv.y < 0) is forward.
      const s = Math.sin(camYaw), c = Math.cos(camYaw);
      dx = mv.x * c + mv.y * s;
      dz = mv.y * c - mv.x * s;
    }
    const moving = mv.len > 0.05;
    const ground = ph.floorAt(this.pos.x, this.pos.z, this.pos.y, this.radius, 0.45);
    const depth = -ph.height(this.pos.x, this.pos.z);
    const wasSwimming = this.swimming;
    this.swimming = depth > 1.25 && this.pos.y < 0.5 && ground < 0.2;

    const maxSpeed = this.swimming ? 4.2 : (mv.len < 0.55 ? 4.5 : 9);
    const want = maxSpeed * mv.len;
    const accel = this.grounded || this.swimming ? 42 : 16, decel = this.swimming ? 10 : 32;
    // Horizontal velocity toward the wanted direction.
    const vx = this.vel.x, vz = this.vel.z;
    const tx = dx * want, tz = dz * want;
    const ax = tx - vx, az = tz - vz, al = Math.hypot(ax, az);
    const a = (moving ? accel : decel) * dt;
    if (al > a && al > 1e-6) { this.vel.x += ax / al * a; this.vel.z += az / al * a; }
    else { this.vel.x = tx; this.vel.z = tz; }
    if (moving) {
      const wantH = Math.atan2(dx, dz);
      let diff = Math.atan2(Math.sin(wantH - this.heading), Math.cos(wantH - this.heading));
      this.heading += diff * Math.min(1, dt * 14);
    }

    // Jumping.
    if (input.jump) this.jumpBuffer = 0.12;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (this.grounded) this.coyote = 0.12; else this.coyote = Math.max(0, this.coyote - dt);
    if (this.jumpBuffer > 0 && !this.swimming) {
      if (this.grounded || this.coyote > 0) {
        this.vel.y = 8.6; this.grounded = false; this.coyote = 0; this.jumpsLeft = 1; this.jumpBuffer = 0;
      } else if (this.jumpsLeft > 0) {
        this.vel.y = 8.2; this.jumpsLeft--; this.jumpBuffer = 0; this._flip = 1;
      }
    }
    // Short hop when you let go early.
    if (!this.grounded && !input.jumpHeld && this.vel.y > 3) this.vel.y -= 26 * dt;

    if (this.swimming) {
      const surface = -0.55 + Math.sin(this._t * 2.2) * 0.06;
      this.vel.y = 0; this.pos.y += (surface - this.pos.y) * Math.min(1, dt * 8);
      this.grounded = false; this.jumpsLeft = 2;
    } else {
      this.vel.y = Math.max(-40, this.vel.y - 24 * dt);
    }

    // Integrate.
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; this.pos.y += this.vel.y * dt;
    ph.resolve(this.pos, this.radius, this.height);
    // Keep inside the terrain patch.
    const { w, d } = LR.ISLAND.patch;
    this.pos.x = Math.max(-w / 2 + 6, Math.min(w / 2 - 6, this.pos.x));
    this.pos.z = Math.max(-d / 2 + 6, Math.min(d / 2 - 6, this.pos.z));

    // Ground contact.
    const floor = ph.floorAt(this.pos.x, this.pos.z, this.pos.y, this.radius, 0.45);
    if (!this.swimming) {
      if (this.pos.y <= floor + 0.001) {
        if (!this.grounded && this.vel.y < -6) this._landSquash = 1;
        this.pos.y = floor; this.grounded = true; this.jumpsLeft = 2;
        if (this.vel.y < 0) this.vel.y = 0;
        // Slide down slopes that are too steep to stand on.
        const n = ph.groundNormal(this.pos.x, this.pos.z, this._n);
        if (n.y < 0.58 && ph.height(this.pos.x, this.pos.z) >= floor - 0.01) {
          this.vel.x += n.x * 30 * dt; this.vel.z += n.z * 30 * dt;
        }
      } else if (this.pos.y > floor + 0.05) {
        this.grounded = false;
      }
    }
    if (wasSwimming && !this.swimming) this.vel.y = Math.max(this.vel.y, 2);

    this.speed = Math.hypot(this.vel.x, this.vel.z);
    this._t += dt;
    this._animate(dt, moving);
    this.root.position.copy(this.pos);
    this.root.rotation.y = this.heading;
    return moving;
  }

  _animate(dt, moving) {
    const b = this.body;
    const run = Math.min(1, this.speed / 9);
    const cycle = this._t * (6 + run * 8);
    let bob = 0, lean = 0;
    if (this.swimming) {
      b.rotation.x = 1.2; bob = -0.2; lean = 0;
      this.armL.rotation.x = Math.sin(this._t * 4) * 0.9; this.armR.rotation.x = Math.cos(this._t * 4) * 0.9;
    } else {
      b.rotation.x = 0;
      if (this.grounded && moving) { bob = Math.abs(Math.sin(cycle)) * 0.08 * run; lean = 0.12 * run; }
      else if (!this.grounded) { lean = 0.05; }
      else bob = Math.sin(this._t * 2.4) * 0.012;          // idle breathing
      const swing = this.grounded && moving ? Math.sin(cycle) * 0.9 * run : 0;
      this.armL.rotation.x = swing; this.armR.rotation.x = -swing;
      if (this._flip) { b.rotation.x = -this._flip * Math.PI * 2 * (1 - this._flip); this._flip = Math.max(0, this._flip - dt * 2.2); if (this._flip === 0) b.rotation.x = 0; }
    }
    if (this._landSquash > 0) {
      const s = this._landSquash; b.scale.set(1 + s * 0.18, 1 - s * 0.22, 1 + s * 0.18);
      this._landSquash = Math.max(0, s - dt * 6);
    } else b.scale.set(1, 1, 1);
    b.position.y = bob;
    b.rotation.x += lean;
  }

  teleport(x, z, heading) {
    // Land on whatever is highest here: terrain or the top of a prop.
    this.pos.set(x, this.physics.floorAt(x, z, 1e6, this.radius, 0) + 0.05, z);
    if (this.pos.y < 0.05) this.pos.y = 0.05;
    this.grounded = false; this.swimming = false;
    this.vel.set(0, 0, 0);
    if (heading != null) this.heading = heading;
    this.root.position.copy(this.pos);
  }
};
