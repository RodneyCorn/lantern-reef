// Sunrise Cove: what stands where. Positions in meters (see data/island.js).
window.LR = window.LR || {};
LR.COVE = {
  huts: [
    { x: -112, z: 66,  rot: 0.35,  w: 5,   d: 4.5, wall: 0xC8996A, trim: 0x3D7AC4 },
    { x: -96,  z: 54,  rot: -0.6,  w: 4.4, d: 4,   wall: 0xD4A874, trim: 0xD9583A },
    { x: -134, z: 48,  rot: 1.1,   w: 5.6, d: 5,   wall: 0xBE8C5C, trim: 0x3D7AC4, stilt: true },
  ],
  // Docks start on the sand and run out over the water in direction `dir` (radians, 0 = +z south).
  docks: [
    { x: -150, z: 128, dir: 0.35, len: 30, boats: [{ side: 1, color: 0xF4EBD3, stripe: 0xD9583A }, { side: -1, color: 0xCFE9F3, stripe: 0x3D7AC4 }] },
    { x: -96,  z: 132, dir: -0.15, len: 24, boats: [{ side: 1, color: 0xF6E7A1, stripe: 0x2E8A3A }] },
  ],
  bigTree: { x: -150, z: 40 },
  // The palm that leans out over the water, for sitting on.
  leaningPalm: { x: -86, z: 120, lean: 5.5, leanDir: 0.2, height: 8 },
  waterfall: { poolX: -172, poolZ: 58, hillX: -245, hillZ: -25, topHeight: 26, width: 6 },
  boulders: [ { x: -176, z: 84, r: 2.4 }, { x: -170, z: 96, r: 1.5 }, { x: -158, z: 54, r: 1.2 }, { x: -78, z: 66, r: 1.9 } ],
  palms: [
    { x: -128, z: 78, lean: 1.2, leanDir: 2.4 }, { x: -142, z: 70 }, { x: -104, z: 44 }, { x: -88, z: 48 },
    { x: -70, z: 78 }, { x: -64, z: 94 }, { x: -120, z: 128 }, { x: -136, z: 116 }, { x: -76, z: 110 }, { x: -166, z: 110 }, { x: -178, z: 100 },
  ],
};
