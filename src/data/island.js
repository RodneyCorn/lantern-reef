// Lantern Reef — the island as data. Terrain shape, zones, and spawn.
// This file (not the rendering code) is the description of the world, so
// it can move to another engine later unchanged. Units are meters.
// Axes: +x east, -z north (so +z is south), +y up. Sea level is y = 0.
window.LR = window.LR || {};
LR.ISLAND = {
  seed: 1987,
  // The terrain patch that gets a mesh and collision. Covers the island and
  // enough sea around it that the shallows show sand under the water.
  patch: { w: 960, d: 760, step: 4 },
  // The base landmass: an ellipse with a noisy coastline. Land rises to
  // `beachHeight` inside it, and the sea floor drops to `seaFloor` outside.
  coast: { cx: 0, cz: 0, rx: 290, rz: 190, noiseAmp: 0.13, noiseScale: 1 / 85,
           beachHeight: 2.6, shelfDepth: -2.0, seaFloor: -16 },
  // Bays push the coastline inland (crescent cove, harbor notch).
  bays: [
    { name: 'sunrise-cove', x: -130, z: 175, r: 120, s: 0.42 },
    { name: 'harbor-notch', x: 305, z: -10, r: 80, s: 0.26 },
  ],
  // Hills add height. `p` shapes the profile: <1 is a steep-sided plateau,
  // >1 is a soft rounded hill. `cliff: w` makes a sheer wall: the hill
  // rises to full height across the outer `w` fraction of its radius, so
  // the top is a plateau with a near-vertical face (the waterfall cliff).
  // `standalone` hills rise from the sea floor on their own (the islet).
  // Heights are deliberately exaggerated (about twice real-world scale):
  // the era's islands were tall and dramatic for their footprint.
  hills: [
    { name: 'cove-cliff',   x: -245, z: -25,  r: 105, h: 34, p: 0.5, cliff: 0.16 },
    { name: 'ridge-west',   x: -110, z: -130, r: 130, h: 82, p: 1.25 },
    { name: 'ridge-east',   x: 0,    z: -155, r: 105, h: 58, p: 1.3 },
    { name: 'town-slope',   x: 150,  z: -60,  r: 115, h: 18, p: 1.5 },
    { name: 'lighthouse',   x: 200,  z: -145, r: 78,  h: 46, p: 0.35, standalone: true },
    { name: 'islet',        x: 250,  z: 290,  r: 42,  h: 19, p: 0.8, standalone: true },
  ],
  // Flats pull the land toward one height: wide level beaches and the
  // town's building ground. Only affects land, never the sea floor.
  flats: [
    { name: 'cove-beach',   x: -125, z: 110, r: 95, y: 1.4, s: 0.95 },
    { name: 'resort-beach', x: 50,   z: 150, r: 80, y: 1.5, s: 0.95 },
    { name: 'town-plaza',   x: 190,  z: -10, r: 45, y: 6.0, s: 0.85 },
    { name: 'waterfall-pool', x: -172, z: 58, r: 9, y: -0.9, s: 1.0 },
  ],
  // Gentle rolling detail on land.
  detail: { amp: 1.6, scale: 1 / 38, octaves: 3 },
  zones: [
    { id: 'cove',       name: 'Sunrise Cove',     sub: 'Docks, huts, and the big tree',   x: -130, z: 80,  r: 120 },
    { id: 'resort',     name: 'Resort Beach',     sub: 'Umbrellas and the rock arch',     x: 50,   z: 150, r: 85 },
    { id: 'pier',       name: 'The Long Pier',    sub: 'A long walk over deep blue',      x: 200,  z: 235, r: 110 },
    { id: 'town',       name: 'Harbor Town',      sub: 'Pastel houses and the ferry',     x: 175,  z: -20, r: 100 },
    { id: 'lighthouse', name: 'Lighthouse Point', sub: 'The whole island from up here',   x: 200,  z: -145, r: 78 },
    { id: 'ridge',      name: 'Windmill Ridge',   sub: 'Grass, wind, and slow sails',     x: -70,  z: -140, r: 130 },
  ],
  spawn: { x: -120, z: 95, heading: 0 },
  // Gray-box stand-ins so the milestone has something to climb on.
  // Real props replace these in milestone 3.
  grayboxProps: [
    { kind: 'pier',  x1: 150, z1: 172, x2: 236, z2: 262, w: 4 },
  ],
};
