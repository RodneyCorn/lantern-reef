// Lantern Reef — boot, the frame loop, and the debug surface used by tests.
(function () {
  'use strict';
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.3, 2400);

  const terrain = new LR.Terrain(LR.ISLAND);
  const physics = new LR.Physics(terrain.height);
  const sky = new LR.Sky(scene);
  const water = new LR.Water(scene, terrain);
  const clouds = new LR.Clouds(scene);
  const terrainMesh = terrain.buildMesh();
  scene.add(terrainMesh);
  const props = new LR.GrayboxProps(scene, physics, terrain);
  const scatter = new LR.Scatter(scene, terrain, physics);
  const cove = new LR.Cove(scene, terrain, physics);
  const ridge = new LR.Ridge(scene, terrain, physics);
  const town = new LR.Town(scene, terrain, physics);
  const resort = new LR.Resort(scene, terrain, physics);
  const pier = new LR.Pier(scene, terrain, physics);
  const lighthouse = new LR.Lighthouse(scene, terrain, physics);
  const balloon = new LR.Balloon(scene);
  const player = new LR.Player(scene, physics, LR.ISLAND.spawn);
  const interact = new LR.Interact();
  const dialogue = new LR.Dialogue(camera);
  // Old Mabe sits on the first cove dock, a little way out, facing the water.
  { const d = cove.docks[0], m = LR.CHARACTERS.npcs.find((n) => n.id === 'mabe');
    m.x = d.x1 + d.ux * 11 + Math.cos(d.dir) * 0.9; m.z = d.z1 + d.uz * 11 - Math.sin(d.dir) * 0.9; m.heading = d.dir + Math.PI / 2; }
  const npcs = new LR.NPCs(scene, terrain, physics, interact, dialogue);
  const critters = new LR.Critters(scene, terrain, physics);
  for (const seat of LR.CHARACTERS.seats) {
    if (seat.id === 'gallery') seat.y = lighthouse.tower.top.y + 0.35;
    if (seat.id === 'leaning-palm' && cove.leaningSeat) Object.assign(seat, cove.leaningSeat);
    interact.add({ x: seat.x, z: seat.z, y: seat.y, r: seat.r, label: seat.label, action: (p) => p.sit(seat) });
  }
  const follow = new LR.FollowCamera(camera, physics);
  const input = new LR.Input(canvas);
  const hud = new LR.HUD();

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  let last = performance.now();
  let paused = false;
  const game = {
    ready: false, scene, camera, renderer, terrain, physics, sky, water, clouds, cove, ridge, town, resort, pier, lighthouse, balloon, scatter, player, npcs, critters, interact, dialogue, follow, input, hud, props,
    frames: 0,
    setHour: (h) => sky.setHour(h),
    teleport: (x, z, heading) => { player.teleport(x, z, heading); follow._first = true; },
    setCamera: (yaw, pitch, dist) => { follow.yaw = yaw; if (pitch != null) follow.pitch = pitch; if (dist != null) { follow.dist = dist; follow.targetDist = dist; } follow._first = true; },
    zoneAt: (x, z) => terrain.zoneAt(x, z),
    step: (dt, render) => frame(dt, render !== false),
    pause: (v) => { paused = v; },
  };
  window.LR.game = game;

  function frame(dt, render = true) {
    game.lastDt = dt;
    input.begin();
    if (input.justPressed('Escape')) paused = !paused;
    if (input.justPressed('KeyT')) sky.timeScale = sky.timeScale === 1 ? 40 : 1;   // debug: fast-forward the day
    if (!paused) {
      sky.advance(dt);
      player.frozen = dialogue.isOpen;
      const moving = player.update(dt, input, follow.yaw);
      interact.update(player, input, hud, dialogue);
      dialogue.update(dt);
      npcs.update(dt, player.pos);
      critters.update(dt, player.pos);
      follow.update(dt, player.pos, player.heading, moving, input);
      sky.follow(player.pos, camera.position);
      water.update(dt, sky);
      terrainMesh.material.userData.time.value += dt;
      clouds.update(dt, sky);
      cove.update(dt);
      ridge.update(dt);
      town.update(dt);
      lighthouse.update(dt, sky.night);
      balloon.update(dt);
      hud.showZone(terrain.zoneAt(player.pos.x, player.pos.z), dt);
    }
    hud.setHour(sky.hour);
    hud.tickFps(dt);
    input.end();
    if (render) { renderer.render(scene, camera); game.frames++; }
  }

  function loop(now) {
    // Clamp: a huge gap (tab hidden) or a negative first stamp must not explode physics.
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  game.ready = true;
})();
