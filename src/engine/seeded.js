// Deterministic hashing and value noise. The island must be the same place
// every time you visit, so nothing here uses Math.random.
window.LR = window.LR || {};
LR.Seeded = (function () {
  function hash2(ix, iz, seed) {
    let n = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 1013904223);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n = n ^ (n >>> 16);
    return (n >>> 0) / 4294967295;
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  // Value noise in [0, 1].
  function noise2(x, z, seed) {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = smooth(x - ix), fz = smooth(z - iz);
    const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
    const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
    return (a + (b - a) * fx) * (1 - fz) + (c + (d - c) * fx) * fz;
  }
  // Fractal sum, returned in [-1, 1].
  function fbm(x, z, seed, octaves) {
    let sum = 0, amp = 0.5, norm = 0, f = 1;
    for (let i = 0; i < octaves; i++) {
      sum += (noise2(x * f, z * f, seed + i * 71) * 2 - 1) * amp;
      norm += amp; amp *= 0.5; f *= 2.07;
    }
    return sum / norm;
  }
  // A small seeded PRNG for scatter placement (mulberry32).
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  return { hash2, noise2, fbm, rng, smooth };
})();
