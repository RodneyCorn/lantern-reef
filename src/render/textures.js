// Canvas-painted textures. Every texture in the game is drawn here with
// brush-like dabs and strokes at 128 or 256 px, then shown with linear
// filtering and mipmaps: soft, clean, low-detail, the "GameCube on a 4K TV"
// look from the plan. Most of these are near-neutral "stroke maps" that get
// multiplied by palette colors, so the palette stays the single source of
// color truth.
window.LR = window.LR || {};
LR.Textures = (function () {
  const cache = {};
  function canvas(size) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }
  function tex(c, opts = {}) {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 4;
    t.colorSpace = opts.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }
  function gray(v, a = 1) { const g = Math.round(Math.max(0, Math.min(255, v * 255))); return `rgba(${g},${g},${g},${a})`; }
  function rgba(r, g, b, a = 1) { return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`; }

  // Wrapped drawing: draw at (x,y) and at the wrapped offsets so tiles seam.
  function wrapped(ctx, size, fn) {
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { ctx.save(); ctx.translate(ox, oy); fn(); ctx.restore(); }
  }
  function dab(ctx, x, y, rx, ry, rot, style) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(rx, ry);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fillStyle = style; ctx.fill(); ctx.restore();
  }

  // ---- stroke maps (multiply with palette color) ------------------------
  function strokeMap(name, size, base, fn) {
    if (cache[name]) return cache[name];
    const c = canvas(size), ctx = c.getContext('2d'), rnd = LR.Seeded.rng(name.length * 7919 + size);
    ctx.fillStyle = gray(base); ctx.fillRect(0, 0, size, size);
    fn(ctx, size, rnd);
    return (cache[name] = tex(c, { data: true }));
  }
  const sand = () => strokeMap('sand', 128, 0.94, (ctx, s, rnd) => {
    for (let i = 0; i < 260; i++) wrapped(ctx, s, () => dab(ctx, rnd() * s, rnd() * s, 4 + rnd() * 10, 2 + rnd() * 4, rnd() * Math.PI, gray(0.86 + rnd() * 0.18, 0.5)));
    for (let i = 0; i < 400; i++) { ctx.fillStyle = gray(rnd() < 0.5 ? 0.8 : 1.05, 0.5); ctx.fillRect(rnd() * s, rnd() * s, 1.5, 1.5); }
    // A few faint ripple lines, the way painted beach textures had them.
    ctx.strokeStyle = gray(0.84, 0.35); ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { const y = rnd() * s; wrapped(ctx, s, () => { ctx.beginPath(); for (let x = 0; x <= s; x += 8) ctx.lineTo(x, y + Math.sin(x * 0.15 + i) * 4); ctx.stroke(); }); }
  });
  const grass = () => strokeMap('grass', 128, 0.9, (ctx, s, rnd) => {
    for (let i = 0; i < 220; i++) wrapped(ctx, s, () => dab(ctx, rnd() * s, rnd() * s, 6 + rnd() * 12, 4 + rnd() * 8, rnd() * Math.PI, gray(0.8 + rnd() * 0.3, 0.45)));
    ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (let i = 0; i < 900; i++) {
      const x = rnd() * s, y = rnd() * s, h = 3 + rnd() * 6, lean = (rnd() - 0.5) * 3;
      ctx.strokeStyle = gray(0.7 + rnd() * 0.5, 0.55);
      wrapped(ctx, s, () => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + lean, y - h); ctx.stroke(); });
    }
  });
  const rock = () => strokeMap('rock', 128, 0.9, (ctx, s, rnd) => {
    for (let i = 0; i < 90; i++) {
      const x = rnd() * s, y = rnd() * s, r = 8 + rnd() * 18, n = 4 + Math.floor(rnd() * 3), v = 0.7 + rnd() * 0.45;
      wrapped(ctx, s, () => { ctx.beginPath(); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + rnd() * 0.5; ctx.lineTo(x + Math.cos(a) * r * (0.7 + rnd() * 0.5), y + Math.sin(a) * r * (0.7 + rnd() * 0.5)); } ctx.closePath(); ctx.fillStyle = gray(v, 0.7); ctx.fill(); ctx.strokeStyle = gray(v * 0.7, 0.6); ctx.lineWidth = 1.5; ctx.stroke(); });
    }
  });
  const planks = () => strokeMap('planks', 128, 0.95, (ctx, s, rnd) => {
    const n = 5, h = s / n;
    for (let i = 0; i < n; i++) {
      const v = 0.85 + rnd() * 0.25;
      ctx.fillStyle = gray(v); ctx.fillRect(0, i * h, s, h);
      ctx.strokeStyle = gray(v * 0.8, 0.5); ctx.lineWidth = 1;
      for (let k = 0; k < 7; k++) { const y = i * h + 3 + rnd() * (h - 6); ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= s; x += 10) ctx.lineTo(x, y + (rnd() - 0.5) * 2); ctx.stroke(); }
      ctx.fillStyle = gray(0.45); ctx.fillRect(0, i * h, s, 2);            // gap
      ctx.fillStyle = gray(1.1, 0.5); ctx.fillRect(0, i * h + 2, s, 1);    // lit edge
    }
  });
  const thatch = () => strokeMap('thatch', 128, 0.9, (ctx, s, rnd) => {
    ctx.lineCap = 'round';
    for (let row = 0; row < 8; row++) for (let i = 0; i < 40; i++) {
      const x = rnd() * s, y = row * (s / 8) + rnd() * 6, len = 10 + rnd() * 14;
      ctx.strokeStyle = gray(0.55 + rnd() * 0.7, 0.8); ctx.lineWidth = 1.5 + rnd() * 2;
      wrapped(ctx, s, () => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd() - 0.5) * 6, y + len); ctx.stroke(); });
    }
    for (let row = 0; row < 8; row++) { ctx.fillStyle = gray(0.4, 0.6); ctx.fillRect(0, row * (s / 8), s, 3); }
  });
  const bark = () => strokeMap('bark', 64, 0.9, (ctx, s, rnd) => {
    for (let i = 0; i < 40; i++) { ctx.fillStyle = gray(0.65 + rnd() * 0.5, 0.7); const y = rnd() * s; wrapped(ctx, s, () => ctx.fillRect(0, y, s, 2 + rnd() * 4)); }
    for (let i = 0; i < 60; i++) { ctx.fillStyle = gray(0.55, 0.5); ctx.fillRect(rnd() * s, rnd() * s, 2 + rnd() * 3, 1); }
  });
  const leaf = () => strokeMap('leaf', 128, 0.9, (ctx, s, rnd) => {
    for (let i = 0; i < 160; i++) wrapped(ctx, s, () => dab(ctx, rnd() * s, rnd() * s, 8 + rnd() * 14, 5 + rnd() * 9, rnd() * Math.PI, gray(0.7 + rnd() * 0.5, 0.55)));
  });
  const wall = () => strokeMap('wall', 128, 0.97, (ctx, s, rnd) => {
    for (let i = 0; i < 120; i++) wrapped(ctx, s, () => dab(ctx, rnd() * s, rnd() * s, 10 + rnd() * 20, 6 + rnd() * 12, rnd() * Math.PI, gray(0.92 + rnd() * 0.12, 0.4)));
    for (let i = 0; i < 25; i++) { ctx.fillStyle = gray(0.85, 0.35); ctx.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 20, 1); }
  });

  // ---- colored / alpha textures ----------------------------------------
  function cloudPuff() {
    if (cache.cloud) return cache.cloud;
    const s = 128, c = canvas(s), ctx = c.getContext('2d');
    const P = LR.PALETTE, top = new THREE.Color(P.cloud), bot = new THREE.Color(P.cloudShade);
    const g = ctx.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    // Shade the lower half toward the cloud-shadow blue.
    const v = ctx.createLinearGradient(0, s * 0.35, 0, s);
    v.addColorStop(0, rgba(top.r * 255, top.g * 255, top.b * 255, 0)); v.addColorStop(1, rgba(bot.r * 255, bot.g * 255, bot.b * 255, 0.9));
    ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = v; ctx.fillRect(0, 0, s, s);
    const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return (cache.cloud = t);
  }
  function waterfall() {
    if (cache.waterfall) return cache.waterfall;
    const s = 128, c = canvas(s), ctx = c.getContext('2d'), rnd = LR.Seeded.rng(77);
    ctx.clearRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * s, w = 2 + rnd() * 7, a = 0.35 + rnd() * 0.5;
      ctx.fillStyle = `rgba(${230 + rnd() * 25},${245},${255},${a})`;
      wrapped(ctx, s, () => ctx.fillRect(x, 0, w, s));
    }
    for (let i = 0; i < 200; i++) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(rnd() * s, rnd() * s, 2, 6 + rnd() * 14); }
    return (cache.waterfall = tex(c));
  }
  function tuft() {
    if (cache.tuft) return cache.tuft;
    const s = 64, c = canvas(s), ctx = c.getContext('2d'), rnd = LR.Seeded.rng(31);
    const P = LR.PALETTE, a = new THREE.Color(0xA8E36A), b = new THREE.Color(P.grassLight);
    ctx.clearRect(0, 0, s, s); ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = 10 + rnd() * 44, h = 22 + rnd() * 34, lean = (rnd() - 0.5) * 26, t = rnd();
      const col = a.clone().lerp(b, t);
      ctx.strokeStyle = rgba(col.r * 255, col.g * 255, col.b * 255, 1); ctx.lineWidth = 2.5 + rnd() * 2;
      ctx.beginPath(); ctx.moveTo(x, s); ctx.quadraticCurveTo(x + lean * 0.3, s - h * 0.6, x + lean, s - h); ctx.stroke();
    }
    const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return (cache.tuft = t);
  }
  function sunGlint() {
    if (cache.glint) return cache.glint;
    const s = 64, c = canvas(s), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return (cache.glint = t);
  }

  return { sand, grass, rock, planks, thatch, bark, leaf, wall, cloudPuff, waterfall, tuft, sunGlint };
})();
