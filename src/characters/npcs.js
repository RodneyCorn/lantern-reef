// The islanders: rigged from LR.CHARACTERS, standing (or sitting) where
// the data says, glancing at Milo when he is near, turning to face him
// when they talk. Each one registers an interaction.
window.LR = window.LR || {};
LR.NPC = class NPC {
  constructor(scene, terrain, physics, data) {
    this.data = data;
    this.rig = LR.Rig.build(data.look);
    this.anim = new LR.Animator(this.rig);
    this.root = this.rig.root;
    this.heading = data.heading || 0;
    this.baseHeading = this.heading;
    const y = physics.floorAt(data.x, data.z, 1e6, 0.4, 0);
    this.pos = new THREE.Vector3(data.x, y, data.z);
    if (data.pose === 'sit') {
      const seat = data.seat || 0.5;
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, seat, 0.9), LR.Materials.painted('planks', LR.PALETTE.trunk));
      crate.position.set(data.x - Math.sin(this.heading) * 0.15, y + seat / 2, data.z - Math.cos(this.heading) * 0.15); crate.castShadow = true; scene.add(crate);
      this.pos.y = y + seat - 0.62 * (data.look.scale || 1);
    }
    this.root.position.copy(this.pos); this.root.rotation.y = this.heading;
    this.talking = false;
    this.talkCount = 0;
    scene.add(this.root);
    physics.addCylinder({ x: data.x, z: data.z, r: 0.45, y0: y - 1, y1: y + 1.6 });
  }
  get headPos() { return new THREE.Vector3(this.pos.x, this.pos.y + 1.75 * (this.data.look.scale || 1), this.pos.z); }
  nextLine() { const l = this.data.lines; const s = l[this.talkCount % l.length]; return s; }
  update(dt, playerPos) {
    const dx = playerPos.x - this.pos.x, dz = playerPos.z - this.pos.z, dist = Math.hypot(dx, dz);
    const toPlayer = Math.atan2(dx, dz);
    let lookYaw = null;
    if (this.talking) {
      const diff = Math.atan2(Math.sin(toPlayer - this.heading), Math.cos(toPlayer - this.heading));
      if (this.data.pose !== 'sit') this.heading += diff * Math.min(1, dt * 6);
      lookYaw = Math.max(-0.8, Math.min(0.8, Math.atan2(Math.sin(toPlayer - this.heading), Math.cos(toPlayer - this.heading))));
    } else if (dist < 9) {
      const rel = Math.atan2(Math.sin(toPlayer - this.heading), Math.cos(toPlayer - this.heading));
      lookYaw = Math.abs(rel) < 1.4 ? Math.max(-0.9, Math.min(0.9, rel)) : null;
      const back = Math.atan2(Math.sin(this.baseHeading - this.heading), Math.cos(this.baseHeading - this.heading));
      if (this.data.pose !== 'sit') this.heading += back * Math.min(1, dt * 2);
    }
    this.root.rotation.y = this.heading;
    this.anim.update(dt, { mode: this.data.pose === 'sit' ? 'sit' : 'idle', talking: this.talking, lookYawOverride: lookYaw });
    if (this.data.pose === 'sit' && lookYaw != null) this.anim.lookYaw = lookYaw * 0.6; else this.anim.lookYaw = 0;
  }
};

LR.NPCs = class NPCs {
  constructor(scene, terrain, physics, interact, dialogue) {
    this.list = LR.CHARACTERS.npcs.map((d) => new LR.NPC(scene, terrain, physics, d));
    for (const npc of this.list) {
      interact.add({ x: npc.pos.x, z: npc.pos.z, r: 3.2, label: `Talk to ${npc.data.name}`,
        action: (player) => { npc.talking = true; player.talking = true; dialogue.open(npc, [npc.nextLine()], () => { npc.talking = false; player.talking = false; npc.talkCount++; }); } });
    }
  }
  update(dt, playerPos) { for (const n of this.list) n.update(dt, playerPos); }
};
