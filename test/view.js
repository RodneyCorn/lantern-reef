// Debug camera: screenshot the island from anywhere.
// node test/view.js out.png x z yaw pitch dist [hour] [camX camY camZ  lookX lookY lookZ]
// With the optional free-camera args the camera is placed explicitly (for wide shots).
const { chromium } = require('playwright-core');
const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const PW_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const [out, x, z, yaw, pitch, dist, hour, cx, cy, cz, lx, ly, lz] = process.argv.slice(2).map((v, i) => (i === 0 ? v : parseFloat(v)));
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.LR_CHROME || (fs.existsSync(PW_CHROME) ? PW_CHROME : undefined),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('pageerror:', e.message));
  await page.goto('file://' + path.join(ROOT, 'index.html') + (process.env.LR_HASH || ''));
  await page.waitForFunction(() => window.LR && LR.game && LR.game.ready && LR.game.frames > 2);
  await page.evaluate(([x, z, yaw, pitch, dist, hour, cx, cy, cz, lx, ly, lz]) => {
    const g = LR.game;
    g.teleport(x, z, 0); g.setCamera(yaw, pitch, dist);
    if (hour != null && !Number.isNaN(hour)) g.setHour(hour);
    for (let i = 0; i < 6; i++) g.step(1 / 60, false);
    if (cx != null && !Number.isNaN(cx)) {
      g.pause(true);
      g.camera.position.set(cx, cy, cz); g.camera.lookAt(lx, ly, lz);
      g.sky.follow(g.player.pos, g.camera.position);
      g.renderer.render(g.scene, g.camera);
    } else g.step(1 / 60, true);
  }, [x, z, yaw, pitch, dist, hour, cx, cy, cz, lx, ly, lz]);
  await page.waitForTimeout(200);
  await page.screenshot({ path: out });
  await browser.close();
})();
