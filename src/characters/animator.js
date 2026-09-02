// Procedural animation for LR.Rig characters. Every frame the animator
// computes target joint rotations for the current state and eases the
// joints toward them, so transitions between moves blend on their own.
window.LR = window.LR || {};
LR.Animator = class Animator {
  constructor(rig) {
    this.rig = rig;
    this.t = 0;
    this.phase = 0;
    this.targets = new Map();
    this.flip = 0;          // remaining fraction of a double-jump flip
    this.squash = 0;
    this.lookYaw = 0; this.lookPitch = 0;
    this.blink = 0;
  }
  _set(obj, x, y, z, rate) {
    let e = this.targets.get(obj);
    if (!e) { e = { x: 0, y: 0, z: 0, rate: 12 }; this.targets.set(obj, e); }
    e.x = x; e.y = y; e.z = z; e.rate = rate || 12;
  }
  // state: { mode, speed, run (0..1), grounded, vy, moving, lookAt (yaw offset), talking }
  update(dt, st) {
    const r = this.rig;
    this.t += dt;
    const run = st.run || 0;
    const mode = st.mode;
    const zero = (o) => this._set(o, 0, 0, 0, 10);
    let bob = 0, lean = 0, hipY = 0;

    if (mode === 'walk' || mode === 'run') {
      this.phase += dt * (5.5 + run * 8.5);
      const A = 0.5 + run * 0.55, p = this.phase;
      const s = Math.sin(p), c = Math.sin(p + Math.PI);
      this._set(r.legL.upper, s * A, 0, 0, 20);
      this._set(r.legR.upper, c * A, 0, 0, 20);
      this._set(r.legL.lower, Math.max(0, Math.sin(p + 1.4)) * A * 1.3 + 0.15 * run, 0, 0, 20);
      this._set(r.legR.lower, Math.max(0, Math.sin(p + Math.PI + 1.4)) * A * 1.3 + 0.15 * run, 0, 0, 20);
      this._set(r.armL.upper, -c * A * 0.85, 0, 0.12, 20);
      this._set(r.armR.upper, -s * A * 0.85, 0, -0.12, 20);
      this._set(r.armL.lower, -0.35 - run * 0.7, 0, 0, 16);
      this._set(r.armR.lower, -0.35 - run * 0.7, 0, 0, 16);
      this._set(r.torso, 0.06 + run * 0.16, Math.sin(p) * 0.06 * run, 0, 14);
      this._set(r.head, -0.05 - run * 0.1 + this.lookPitch, this.lookYaw, 0, 12);
      bob = Math.abs(Math.sin(p)) * (0.03 + run * 0.05);
    } else if (mode === 'jump' || mode === 'fall') {
      const up = st.vy > 0;
      this._set(r.legL.upper, up ? -0.7 : -0.25, 0, 0.1, 14);
      this._set(r.legR.upper, up ? -0.4 : -0.1, 0, -0.1, 14);
      this._set(r.legL.lower, up ? 1.2 : 0.5, 0, 0, 14);
      this._set(r.legR.lower, up ? 0.9 : 0.4, 0, 0, 14);
      this._set(r.armL.upper, up ? -2.3 : -1.0, 0, 0.5, 12);
      this._set(r.armR.upper, up ? -2.3 : -1.0, 0, -0.5, 12);
      this._set(r.armL.lower, -0.4, 0, 0, 12); this._set(r.armR.lower, -0.4, 0, 0, 12);
      this._set(r.torso, up ? -0.1 : 0.15, 0, 0, 12);
      this._set(r.head, up ? -0.2 : 0.1, this.lookYaw, 0, 12);
    } else if (mode === 'swim') {
      const p = this.t * 4.2;
      this._set(r.torso, 1.15, 0, 0, 8);
      this._set(r.head, -0.9, this.lookYaw * 0.5, 0, 8);
      this._set(r.legL.upper, Math.sin(p * 1.5) * 0.35, 0, 0, 12);
      this._set(r.legR.upper, -Math.sin(p * 1.5) * 0.35, 0, 0, 12);
      this._set(r.legL.lower, 0.2, 0, 0, 12); this._set(r.legR.lower, 0.2, 0, 0, 12);
      // Crawl: arms windmill.
      r.armL.upper.rotation.set(-(p % (Math.PI * 2)), 0, 0.25); r.armR.upper.rotation.set(-((p + Math.PI) % (Math.PI * 2)), 0, -0.25);
      this.targets.delete(r.armL.upper); this.targets.delete(r.armR.upper);
      this._set(r.armL.lower, -0.6, 0, 0, 12); this._set(r.armR.lower, -0.6, 0, 0, 12);
      hipY = -0.15;
    } else if (mode === 'sit') {
      this._set(r.legL.upper, -1.45, 0, 0.12, 10); this._set(r.legR.upper, -1.45, 0, -0.12, 10);
      this._set(r.legL.lower, 1.25, 0, 0, 10); this._set(r.legR.lower, 1.25, 0, 0, 10);
      this._set(r.armL.upper, -0.5 + Math.sin(this.t * 1.1) * 0.04, 0, 0.2, 8); this._set(r.armR.upper, -0.5, 0, -0.2, 8);
      this._set(r.armL.lower, -0.9, 0, 0, 8); this._set(r.armR.lower, -0.9, 0, 0, 8);
      this._set(r.torso, 0.05, 0, 0, 8);
      this._set(r.head, 0.05 + this.lookPitch, this.lookYaw + Math.sin(this.t * 0.4) * 0.2, 0, 6);
    } else {   // idle / talk
      const breathe = Math.sin(this.t * 1.7) * 0.02;
      zero(r.legL.upper); zero(r.legR.upper); zero(r.legL.lower); zero(r.legR.lower);
      this._set(r.armL.upper, breathe, 0, 0.14 + breathe, 6); this._set(r.armR.upper, breathe, 0, -0.14 - breathe, 6);
      this._set(r.armL.lower, -0.2, 0, 0, 6); this._set(r.armR.lower, -0.2, 0, 0, 6);
      this._set(r.torso, breathe * 0.5, 0, 0, 6);
      // Look around now and then.
      const glance = Math.sin(this.t * 0.37) * Math.sin(this.t * 0.11 + 1.3);
      const yaw = st.lookYawOverride != null ? st.lookYawOverride : glance * 0.5;
      const nod = st.talking ? Math.sin(this.t * 6) * 0.06 : 0;
      this._set(r.head, nod + this.lookPitch, yaw + this.lookYaw, 0, 5);
      if (st.talking) { this._set(r.armR.upper, -0.9 + Math.sin(this.t * 4) * 0.25, 0, -0.5, 8); this._set(r.armR.lower, -1.1, 0, 0, 8); }
      bob = breathe * 0.4;
    }
    // Ease every joint toward its target.
    for (const [obj, e] of this.targets) {
      const k = Math.min(1, dt * e.rate);
      obj.rotation.x += (e.x - obj.rotation.x) * k;
      obj.rotation.y += (e.y - obj.rotation.y) * k;
      obj.rotation.z += (e.z - obj.rotation.z) * k;
    }
    // Whole-body: bob, lean, flip, landing squash.
    r.hips.position.y = r.hipHeight + bob + hipY;
    if (this.flip > 0) { r.body.rotation.x = -Math.PI * 2 * (1 - this.flip); this.flip = Math.max(0, this.flip - dt * 2.4); if (this.flip === 0) r.body.rotation.x = 0; }
    else r.body.rotation.x += (lean - r.body.rotation.x) * Math.min(1, dt * 10);
    if (this.squash > 0) { const s = this.squash; r.body.scale.set(1 + s * 0.16, 1 - s * 0.2, 1 + s * 0.16); this.squash = Math.max(0, s - dt * 5); }
    else r.body.scale.set(1, 1, 1);
  }
  startFlip() { this.flip = 1; }
  land(hard) { this.squash = hard ? 1 : 0.5; }
};
