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
  scene.add(terrain.buildMesh());
  const props = new LR.GrayboxProps(scene, physics, terrain);
  const scatter = new LR.Scatter(scene, terrain, physics);
  const cove = new LR.Cove(scene, terrain, physics);
  const ridge = new LR.Ridge(scene, terrain, physics);
  const player = new LR.Player(scene, physics, LR.ISLAND.spawn);
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
    ready: false, scene, camera, renderer, terrain, physics, sky, water, clouds, cove, ridge, scatter, player, follow, input, hud, props,
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
      const moving = player.update(dt, input, follow.yaw);
      follow.update(dt, player.pos, player.heading, moving, input);
      sky.follow(player.pos, camera.position);
      water.update(dt, sky);
      clouds.update(dt, sky);
      cove.update(dt);
      ridge.update(dt);
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
