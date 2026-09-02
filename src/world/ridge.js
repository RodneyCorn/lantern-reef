// Builds Windmill Ridge from LR.RIDGE.
window.LR = window.LR || {};
LR.Ridge = class Ridge {
  constructor(scene, terrain, physics) {
    this.group = new THREE.Group(); this.group.name = 'ridge';
    this.updaters = [];
    for (const w of LR.RIDGE.windmills) {
      // The plinth top is the highest ground under the footprint, so the
      // tower is level and nothing floats.
      const rb = 4.2 * (w.scale || 1) + 2.6;
      let top = terrain.height(w.x, w.z);
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; top = Math.max(top, terrain.height(w.x + Math.cos(a) * rb, w.z + Math.sin(a) * rb)); }
      top += 0.1;
      const r = LR.Props.windmill({ ...w, plinthTop: top });
      this.group.add(r.group);
      for (const c of r.cylinders) physics.addCylinder(c);
      this.updaters.push(r.update);
    }
    scene.add(this.group);
    this._t = 0;
  }
  update(dt) { this._t += dt; for (const u of this.updaters) u(this._t); }
};
