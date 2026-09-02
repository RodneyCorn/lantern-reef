// Harbor Town: pastel houses stacked up the slope, a plaza with a fountain
// and market stalls, a bell tower, and a stone pier with the ferry.
// Houses face along their `rot` (0 = south, PI/2 = east, PI = north).
window.LR = window.LR || {};
LR.TOWN = {
  plaza: { x: 190, z: -10 },
  fountain: { x: 190, z: -10 },
  bellTower: { x: 214, z: -30 },
  stalls: [
    { x: 177, z: -3, rot: Math.PI / 2, color: 0xD9583A }, { x: 177, z: 5, rot: Math.PI / 2, color: 0x3D7AC4 },
    { x: 203, z: -3, rot: -Math.PI / 2, color: 0x2F9E3C }, { x: 203, z: 5, rot: -Math.PI / 2, color: 0xFFD23F },
  ],
  houses: [
    // Waterfront row, facing the harbour.
    { x: 238, z: -36, rot: Math.PI / 2, w: 8, d: 6, floors: 2, wall: 0xFFF3E0, roof: 0xD9583A, shutter: 0x3D7AC4 },
    { x: 238, z: -24, rot: Math.PI / 2, w: 7, d: 6, floors: 3, wall: 0xCFE9F3, roof: 0x3D7AC4, shutter: 0xD9583A },
    { x: 238, z: 8,   rot: Math.PI / 2, w: 9, d: 6, floors: 2, wall: 0xF6E7A1, roof: 0xD9583A, shutter: 0x2F9E3C },
    { x: 238, z: 20,  rot: Math.PI / 2, w: 7, d: 6, floors: 2, wall: 0xF9D5B5, roof: 0x3D7AC4, shutter: 0xFFFFFF },
    { x: 238, z: 32,  rot: Math.PI / 2, w: 8, d: 6, floors: 3, wall: 0xFFF3E0, roof: 0xD9583A, shutter: 0x3D7AC4 },
    // Around the plaza.
    { x: 174, z: -36, rot: 0, w: 8, d: 6, floors: 2, wall: 0xF9D5B5, roof: 0xD9583A, shutter: 0x3D7AC4 },
    { x: 192, z: -36, rot: 0, w: 9, d: 6, floors: 3, wall: 0xFFF3E0, roof: 0x3D7AC4, shutter: 0xD9583A },
    { x: 174, z: 16,  rot: Math.PI, w: 8, d: 6, floors: 2, wall: 0xCFE9F3, roof: 0xD9583A, shutter: 0xFFFFFF },
    { x: 192, z: 16,  rot: Math.PI, w: 8, d: 6, floors: 2, wall: 0xF6E7A1, roof: 0x3D7AC4, shutter: 0x2F9E3C },
    { x: 210, z: 16,  rot: Math.PI, w: 7, d: 6, floors: 3, wall: 0xFFF3E0, roof: 0xD9583A, shutter: 0x3D7AC4 },
    { x: 162, z: -20, rot: Math.PI / 2, w: 7, d: 6, floors: 2, wall: 0xF9D5B5, roof: 0x3D7AC4, shutter: 0xD9583A },
    { x: 162, z: 0,   rot: Math.PI / 2, w: 7, d: 6, floors: 3, wall: 0xCFE9F3, roof: 0xD9583A, shutter: 0x3D7AC4 },
    // Up the slope.
    { x: 142, z: -44, rot: Math.PI / 2, w: 7, d: 6, floors: 2, wall: 0xFFF3E0, roof: 0xD9583A, shutter: 0x2F9E3C },
    { x: 140, z: -16, rot: Math.PI / 2, w: 8, d: 6, floors: 2, wall: 0xF6E7A1, roof: 0x3D7AC4, shutter: 0xD9583A },
    { x: 140, z: 14,  rot: Math.PI / 2, w: 7, d: 6, floors: 3, wall: 0xF9D5B5, roof: 0xD9583A, shutter: 0x3D7AC4 },
    { x: 122, z: -30, rot: Math.PI / 2, w: 7, d: 6, floors: 2, wall: 0xCFE9F3, roof: 0x3D7AC4, shutter: 0xFFFFFF },
  ],
  trees: [ { x: 170, z: -22 }, { x: 210, z: -22 }, { x: 170, z: 4 }, { x: 210, z: 4 }, { x: 224, z: -46 }, { x: 226, z: 42 }, { x: 150, z: -30 }, { x: 150, z: 0 } ],
  palms: [ { x: 250, z: -30 }, { x: 250, z: 26 }, { x: 250, z: 40 }, { x: 250, z: -46 } ],
  pier: { x1: 256, z1: -6, x2: 300, z2: -6, y: 1.9, w: 6 },
  ferry: { x: 286, z: 4, rot: Math.PI / 2 },
};
