// Milo's controller: run, jump, double jump with a flip, short hops,
// coyote time, slope sliding, swimming, sitting, and standing still to
// talk. The body is an LR.Rig driven by LR.Animator.
window.LR = window.LR || {};
LR.Player = class Player {
  constructor(scene, physics, spawn) {
    this.physics = physics;
    this.pos = new THREE.Vector3(spawn.x, physics.height(spawn.x, spawn.z), spawn.z);
    this.vel = new THREE.Vector3();
    this.heading = spawn.heading || 0;
    this.grounded = true;
    this.swimming = false;
    this.sitting = null;
    this.frozen = false;
    this.talking = false;
    this.jumpsLeft = 2;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.radius = 0.45;
    this.height = 1.75;
    this.speed = 0;
    this._t = 0;
    this._n = new THREE.Vector3();
    this.rig = LR.Rig.build(LR.CHARACTERS.milo);
    this.anim = new LR.Animator(this.rig);
    this.root = this.rig.root;
    this.root.position.copy(this.pos);
    this.root.name = 'player';
    scene.add(this.root);
  }

  get headPos() { return new THREE.Vector3(this.pos.x, this.pos.y + 1.75, this.pos.z); }

  sit(seat) {
    this.sitting = seat;
    this.pos.set(seat.x, seat.y - 0.56, seat.z);
    this.vel.set(0, 0, 0);
    this.heading = seat.heading;
    this.grounded = false; this.swimming = false;
  }
  standUp() {
    if (!this.sitting) return;
    const s = this.sitting; this.sitting = null;
    this.pos.set(s.x + Math.sin(s.heading) * 0.6, s.y + 0.2, s.z + Math.cos(s.heading) * 0.6);
    this.vel.set(0, 0, 0);
  }

  update(dt, input, camYaw) {
    const ph = this.physics;
    this._t += dt;
    const mv = (this.frozen || this.sitting) ? { x: 0, y: 0, len: 0 } : input.move;
    if (this.sitting && !this.frozen && (input.move.len > 0.3 || input.jump)) this.standUp();
    if (this.sitting) {
      this.root.position.copy(this.pos); this.root.rotation.y = this.heading;
      this.anim.update(dt, { mode: 'sit' });
      return false;
    }
    let dx = 0, dz = 0;
    if (mv.len > 0) {
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
    const vx = this.vel.x, vz = this.vel.z;
    const tx = dx * want, tz = dz * want;
    const ax = tx - vx, az = tz - vz, al = Math.hypot(ax, az);
    const a = (moving ? accel : decel) * dt;
    if (al > a && al > 1e-6) { this.vel.x += ax / al * a; this.vel.z += az / al * a; }
    else { this.vel.x = tx; this.vel.z = tz; }
    if (moving) {
      const wantH = Math.atan2(dx, dz);
      const diff = Math.atan2(Math.sin(wantH - this.heading), Math.cos(wantH - this.heading));
      this.heading += diff * Math.min(1, dt * 14);
    }

    if (input.jump && !this.frozen) this.jumpBuffer = 0.12; else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (this.grounded) this.coyote = 0.12; else this.coyote = Math.max(0, this.coyote - dt);
    if (this.jumpBuffer > 0 && !this.swimming) {
      if (this.grounded || this.coyote > 0) {
        this.vel.y = 8.6; this.grounded = false; this.coyote = 0; this.jumpsLeft = 1; this.jumpBuffer = 0;
      } else if (this.jumpsLeft > 0) {
        this.vel.y = 8.2; this.jumpsLeft--; this.jumpBuffer = 0; this.anim.startFlip();
      }
    }
    if (!this.grounded && !input.jumpHeld && this.vel.y > 3) this.vel.y -= 26 * dt;

    if (this.swimming) {
      const surface = -1.2 + Math.sin(this._t * 2.2) * 0.06;
      this.vel.y = 0; this.pos.y += (surface - this.pos.y) * Math.min(1, dt * 8);
      this.grounded = false; this.jumpsLeft = 2;
    } else {
      this.vel.y = Math.max(-40, this.vel.y - 24 * dt);
    }

    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; this.pos.y += this.vel.y * dt;
    ph.resolve(this.pos, this.radius, this.height);
    const { w, d } = LR.ISLAND.patch;
    this.pos.x = Math.max(-w / 2 + 6, Math.min(w / 2 - 6, this.pos.x));
    this.pos.z = Math.max(-d / 2 + 6, Math.min(d / 2 - 6, this.pos.z));

    const floor = ph.floorAt(this.pos.x, this.pos.z, this.pos.y, this.radius, 0.45);
    if (!this.swimming) {
      if (this.pos.y <= floor + 0.001) {
        if (!this.grounded) this.anim.land(this.vel.y < -9);
        this.pos.y = floor; this.grounded = true; this.jumpsLeft = 2;
        if (this.vel.y < 0) this.vel.y = 0;
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
    let mode = 'idle';
    if (this.swimming) mode = 'swim';
    else if (!this.grounded) mode = this.vel.y > 0 ? 'jump' : 'fall';
    else if (this.speed > 0.6) mode = this.speed > 5 ? 'run' : 'walk';
    const run = Math.max(0, Math.min(1, (this.speed - 3.5) / 5));
    this.anim.update(dt, { mode, run, vy: this.vel.y, talking: this.talking, lookYawOverride: this.talking ? 0 : null });
    this.root.position.copy(this.pos);
    this.root.rotation.y = this.heading;
    return moving;
  }

  teleport(x, z, heading) {
    this.sitting = null;
    this.pos.set(x, this.physics.floorAt(x, z, 1e6, this.radius, 0) + 0.05, z);
    if (this.pos.y < 0.05) this.pos.y = 0.05;
    this.grounded = false; this.swimming = false;
    this.vel.set(0, 0, 0);
    if (heading != null) this.heading = heading;
    this.root.position.copy(this.pos);
  }
};
