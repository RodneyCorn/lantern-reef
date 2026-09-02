// Boots Lantern Reef in headless Chromium, drives Milo around, checks the
// world behaves, and (with --shots) writes screenshots to shots/.
// Usage: node test/smoke.js [--shots]
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.argv.includes('--shots');
const PW_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const executablePath = process.env.LR_CHROME || (fs.existsSync(PW_CHROME) ? PW_CHROME : undefined);

let failures = 0;
function check(cond, msg) {
  console.log(`${cond ? '  ok ' : ' FAIL'} ${msg}`);
  if (!cond) failures++;
}

(async () => {
  const browser = await chromium.launch({
    executablePath,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('  console:', m.text()); });

  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForFunction(() => window.LR && LR.game && LR.game.ready, null, { timeout: 30000 });
  await page.waitForFunction(() => LR.game.frames > 2, null, { timeout: 30000 });
  check(errors.length === 0, `no page errors on boot${errors.length ? ': ' + errors.join(' | ') : ''}`);

  const shot = async (name) => {
    if (!SHOTS) return;
    await page.evaluate(() => { LR.game.step(1 / 60); LR.game.step(1 / 60); });
    await page.waitForTimeout(150);
    fs.mkdirSync(path.join(ROOT, 'shots'), { recursive: true });
    await page.screenshot({ path: path.join(ROOT, 'shots', name + '.png') });
    console.log('  shot', name);
  };
  const state = () => page.evaluate(() => {
    const p = LR.game.player;
    return { x: p.pos.x, y: p.pos.y, z: p.pos.z, grounded: p.grounded, swimming: p.swimming, speed: p.speed,
             ground: LR.game.terrain.height(p.pos.x, p.pos.z), hour: LR.game.sky.hour };
  });
  // Run n simulated frames without rendering (deterministic, fast).
  const sim = (n, dt = 1 / 60) => page.evaluate(([n, dt]) => { for (let i = 0; i < n; i++) LR.game.step(dt, false); }, [n, dt]);

  // --- spawn ---
  let s = await state();
  check(s.ground > 0.2 && s.ground < 6, `spawn is on the beach (ground ${s.ground.toFixed(2)} m)`);
  check(Math.abs(s.y - s.ground) < 0.05, 'Milo starts standing on the ground');
  await page.evaluate(() => LR.game.setCamera(Math.PI, 0.22, 8));
  await shot('01-spawn-cove');

  // --- run forward for 2 simulated seconds ---
  await page.keyboard.down('w');
  await sim(120);
  await page.keyboard.up('w');
  const s2 = await state();
  const moved = Math.hypot(s2.x - s.x, s2.z - s.z);
  check(moved > 8, `running moved Milo ${moved.toFixed(1)} m in 2 s`);
  check(Math.abs(s2.y - s2.ground) < 0.3 || !s2.grounded, 'Milo stays on the terrain while running');
  await shot('02-running');

  // --- jump and double jump ---
  await page.keyboard.down(' ');            // held: a full-height jump
  await sim(12);
  const j1 = await state();
  check(j1.y - j1.ground > 0.8, `held jump lifts Milo (${(j1.y - j1.ground).toFixed(2)} m after 0.2 s)`);
  await page.keyboard.up(' ');
  await page.keyboard.down(' ');            // second press in the air: double jump
  await sim(10);
  await page.keyboard.up(' ');
  const j2 = await state();
  check(j2.y - j1.y > 0.3, `double jump adds height (${(j2.y - j1.y).toFixed(2)} m more)`);
  await shot('03-double-jump');
  await sim(120);
  const j3 = await state();
  check(j3.grounded && Math.abs(j3.y - j3.ground) < 0.05, 'Milo lands back on the ground');

  // --- swim: walk into the cove ---
  await page.evaluate(() => LR.game.teleport(-130, 150, 0));
  await sim(5);
  await page.keyboard.down('w');
  await sim(240);
  await page.keyboard.up('w');
  const sw = await state();
  check(sw.swimming, `walking into the sea switches to swimming (depth ${(-sw.ground).toFixed(1)} m)`);
  check(sw.y < -0.8 && sw.y > -1.6, `Milo floats at the surface (y ${sw.y.toFixed(2)})`);
  await shot('04-swimming');

  // --- pier: stand on the Long Pier over deep water ---
  await page.evaluate(() => LR.game.teleport(160, 182, Math.atan2(86, 90)));
  await sim(30);
  const pr = await state();
  check(pr.y > 1.2 && pr.y < 2.0 && !pr.swimming, `Milo stands on the Long Pier deck (y ${pr.y.toFixed(2)})`);
  await page.evaluate(() => LR.game.setCamera(Math.atan2(86, 90) + Math.PI, 0.3, 9));
  await shot('05-long-pier');

  // --- zones ---
  const zones = await page.evaluate(() => LR.ISLAND.zones.map((z) => ({ id: z.id, name: z.name, x: z.x, z: z.z })));
  for (const z of zones) {
    await page.evaluate((z) => { LR.game.teleport(z.x, z.z, 0); LR.game.setCamera(Math.PI * 0.85, 0.35, 10); }, z);
    await sim(20);
    const st = await state();
    const found = await page.evaluate((z) => { const q = LR.game.zoneAt(z.x, z.z); return q && q.id; }, z);
    check(found === z.id, `zone ${z.name} is at its data position (ground ${st.ground.toFixed(1)} m)`);
    await shot(`zone-${z.id}`);
  }

  // --- time of day ---
  await page.evaluate(() => { LR.game.teleport(-120, 95, 0); LR.game.setCamera(Math.PI, 0.2, 8); });
  await sim(10);
  for (const [name, hour] of [['sunset', 18.1], ['dusk', 19.1], ['night', 22.0], ['sunrise', 6.4]]) {
    await page.evaluate((h) => LR.game.setHour(h), hour);
    await sim(5);
    await shot(`time-${name}`);
  }
  await page.evaluate(() => LR.game.setHour(10));
  // The clock advances at the day rate: 10 hours over 12 minutes.
  const h0 = (await state()).hour;
  await sim(60);
  const h1 = (await state()).hour;
  check(Math.abs((h1 - h0) - 10 / (12 * 60)) < 1e-3, `day clock runs at the planned rate (+${((h1 - h0) * 60).toFixed(2)} min per real second)`);

  // --- wide establishing shots (free camera) ---
  if (SHOTS) {
    const wide = async (name, cam, look) => {
      await page.evaluate(([cam, look]) => {
        const g = LR.game; g.pause(true);
        g.camera.position.set(...cam); g.camera.lookAt(...look);
        g.sky.follow(g.player.pos, g.camera.position);
        g.renderer.render(g.scene, g.camera);
      }, [cam, look]);
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(ROOT, 'shots', name + '.png') });
      console.log('  shot', name);
      await page.evaluate(() => LR.game.pause(false));
    };
    await page.evaluate(() => { LR.game.setHour(10); LR.game.teleport(-120, 95, 0); });
    await wide('wide-from-southwest', [-520, 220, 520], [40, 0, -20]);
    await wide('wide-from-northeast', [520, 240, -420], [-40, 0, 40]);
    await wide('wide-cove-from-above', [-150, 120, 260], [-140, 0, 60]);
    await wide('postcard-cove', [-122, 4, 158], [-140, 6, 70]);
    await wide('postcard-waterfall', [-140, 6, 100], [-172, 12, 52]);
    await page.evaluate(() => LR.game.setHour(18.1));
    await wide('wide-sunset-from-sea', [-80, 40, 520], [0, 20, 0]);
  }

  check(errors.length === 0, `no page errors during play${errors.length ? ': ' + errors.join(' | ') : ''}`);
  const fps = await page.evaluate(() => document.getElementById('fps').textContent);
  console.log(`  info headless render rate: ${fps} (software GPU; not a performance measure)`);
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
