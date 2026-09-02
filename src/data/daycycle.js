// Lantern Reef — the day cycle as data (docs/PLAN.md §5).
// Hours are 0–24. `phases` say how many real minutes each stretch of the
// day takes; `keys` are the lighting keyframes that get blended by hour.
// Colors are sRGB hex. Intensities are for Three.js physical lights.
window.LR = window.LR || {};
LR.DAY = {
  startHour: 10,
  phases: [
    { from: 7.5,  to: 17.5, minutes: 12  },  // bright day
    { from: 17.5, to: 19.5, minutes: 3   },  // sunset
    { from: 19.5, to: 29.5, minutes: 2.5 },  // night (wraps past 24)
    { from: 5.5,  to: 7.5,  minutes: 2.5 },  // sunrise
  ],
  keys: [
    { h: 0.0,  zenith: 0x060A2A, horizon: 0x18244F, sun: 0x8FA4E6, sunI: 0.45, hemiSky: 0x1C2A5E, hemiGround: 0x0B0E1C, hemiI: 0.66, fog: 0x18244F },
    { h: 5.0,  zenith: 0x141A4A, horizon: 0x6E4C7E, sun: 0xD08A9A, sunI: 0.64, hemiSky: 0x3A3A6A, hemiGround: 0x1A1420, hemiI: 0.85, fog: 0x6E4C7E },
    { h: 6.5,  zenith: 0x3D6FD6, horizon: 0xFFB07A, sun: 0xFFD2A0, sunI: 1.94, hemiSky: 0x9BB8F0, hemiGround: 0x8A6A4A, hemiI: 1.23, fog: 0xFFC79A },
    { h: 8.5,  zenith: 0x1E5BD6, horizon: 0x9BD8F5, sun: 0xFFF4D6, sunI: 2.41, hemiSky: 0x9BD8F5, hemiGround: 0xC9B48A, hemiI: 1.42, fog: 0xA9DDF5 },
    { h: 16.5, zenith: 0x1E5BD6, horizon: 0x9BD8F5, sun: 0xFFF4D6, sunI: 2.41, hemiSky: 0x9BD8F5, hemiGround: 0xC9B48A, hemiI: 1.42, fog: 0xA9DDF5 },
    { h: 18.0, zenith: 0x2C4FC0, horizon: 0xFF9A5A, sun: 0xFFB070, sunI: 2.04, hemiSky: 0xE0A0A0, hemiGround: 0x8A5A3A, hemiI: 1.18, fog: 0xFFB08A },
    { h: 19.0, zenith: 0x1A2570, horizon: 0xD9628A, sun: 0xE08A9A, sunI: 0.96, hemiSky: 0x7A5A9A, hemiGround: 0x3A2A3A, hemiI: 0.95,  fog: 0xC96C8E },
    { h: 20.0, zenith: 0x080D33, horizon: 0x1E2A5C, sun: 0x8FA4E6, sunI: 0.45, hemiSky: 0x1C2A5E, hemiGround: 0x0B0E1C, hemiI: 0.66, fog: 0x1E2A5C },
    { h: 24.0, zenith: 0x060A2A, horizon: 0x18244F, sun: 0x8FA4E6, sunI: 0.45, hemiSky: 0x1C2A5E, hemiGround: 0x0B0E1C, hemiI: 0.66, fog: 0x18244F },
  ],
};
