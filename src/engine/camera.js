// Third-person follow camera: orbits a point above the player, eases back
// behind them when they run, never goes under the ground, pulls in when
// the terrain would block the view.
window.LR = window.LR || {};
LR.FollowCamera = class FollowCamera {
  constructor(camera, physics) {
    this.camera = camera;
    this.physics = physics;
    this.yaw = Math.PI;          // camera looks along -z when yaw = 0
    this.pitch = 0.26;
    this.dist = 7.5;
    this.targetDist = 7.5;
    this.height = 1.3;           // look-at point above the player's feet
    this.pos = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this._smoothTarget = new THREE.Vector3();
    this._tmp = new THREE.Vector3();
    this._first = true;
  }

  update(dt, playerPos, playerHeading, moving, input) {
    // Manual look.
    const look = input.look;
    this.yaw -= look.dx * 0.0022;
    this.pitch = Math.max(-0.3, Math.min(1.15, this.pitch + look.dy * 0.0018));
    if (input.wheel) this.targetDist = Math.max(3.5, Math.min(13, this.targetDist + input.wheel * 0.9));
    this.dist += (this.targetDist - this.dist) * Math.min(1, dt * 6);

    // Auto-follow: drift the camera behind the player once they've been
    // running for a moment without touching the stick.
    if (moving && input.secondsSinceLook > 1.2) {
      const want = playerHeading + Math.PI;    // behind the player
      let diff = Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw));
      this.yaw += diff * Math.min(1, dt * 1.6);
    }

    // Smooth look-at target.
    this.target.set(playerPos.x, playerPos.y + this.height, playerPos.z);
    if (this._first) { this._smoothTarget.copy(this.target); this._first = false; }
    else this._smoothTarget.lerp(this.target, Math.min(1, dt * 10));

    // Desired position on the orbit sphere.
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const dir = this._tmp.set(Math.sin(this.yaw) * cp, sp, Math.cos(this.yaw) * cp);
    // Terrain occlusion: walk out along the ray, stop before the ground.
    let d = this.dist;
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      const t = (this.dist * i) / steps;
      const x = this._smoothTarget.x + dir.x * t, y = this._smoothTarget.y + dir.y * t, z = this._smoothTarget.z + dir.z * t;
      if (y < this.physics.height(x, z) + 0.7) { d = Math.max(1.2, t - this.dist / steps); break; }
    }
    this.pos.copy(this._smoothTarget).addScaledVector(dir, d);
    const floor = this.physics.height(this.pos.x, this.pos.z) + 0.6;
    if (this.pos.y < floor) this.pos.y = floor;
    if (this.pos.y < 0.5) this.pos.y = 0.5;       // never under the water surface
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this._smoothTarget);
  }
};
