// The island's shape as one analytic function y = height(x, z), built from
// LR.ISLAND, plus the mesh that shows it with height-and-slope vertex colors.
window.LR = window.LR || {};
LR.Terrain = class Terrain {
  constructor(data) {
    this.data = data;
    this.height = this.height.bind(this);
  }

  // Signed "coast coordinate": < 1 is land, > 1 is sea.
  _coast(x, z) {
    const c = this.data.coast;
    const ex = (x - c.cx) / c.rx, ez = (z - c.cz) / c.rz;
    let e = Math.sqrt(ex * ex + ez * ez);
    e += LR.Seeded.fbm(x * c.noiseScale, z * c.noiseScale, this.data.seed, 3) * c.noiseAmp;
    for (const b of this.data.bays) {
      const d = Math.hypot(x - b.x, z - b.z) / b.r;
      if (d < 1) e += b.s * LR.Seeded.smooth(1 - d);
    }
    return e;
  }

  height(x, z) {
    const c = this.data.coast;
    const e = this._coast(x, z);
    // Beach ramp: sea shelf (-2) up to beachHeight (3) across the coastline.
    const land = LR.Seeded.smooth(Math.max(0, Math.min(1, (1.08 - e) / 0.2)));
    let h = c.shelfDepth + (c.beachHeight - c.shelfDepth) * land;
    // Sea floor falls away offshore.
    const off = LR.Seeded.smooth(Math.max(0, Math.min(1, (e - 1.08) / 0.5)));
    h += (c.seaFloor - c.shelfDepth) * off;
    // Hills.
    for (const hill of this.data.hills) {
      const d = Math.hypot(x - hill.x, z - hill.z) / hill.r;
      if (d >= 1) continue;
      const s = Math.pow(LR.Seeded.smooth(1 - d), hill.p);
      if (hill.standalone) h = Math.max(h, c.seaFloor + hill.h * s * 1.35);   // rises from the sea floor
      else h += hill.h * s * land;                                            // only on land
    }
    // Rolling detail on land only.
    const dd = this.data.detail;
    h += LR.Seeded.fbm(x * dd.scale, z * dd.scale, this.data.seed + 9, dd.octaves) * dd.amp * land;
    // Flats.
    for (const f of this.data.flats || []) {
      const d = Math.hypot(x - f.x, z - f.z) / f.r;
      if (d >= 1) continue;
      const k = LR.Seeded.smooth(1 - d) * f.s * land;
      h += (f.y - h) * k;
    }
    return h;
  }

  // Which zone contains (x, z), if any.
  zoneAt(x, z) {
    let best = null, bd = Infinity;
    for (const zn of this.data.zones) {
      const d = Math.hypot(x - zn.x, z - zn.z);
      if (d < zn.r && d < bd) { best = zn; bd = d; }
    }
    return best;
  }

  buildMesh() {
    const P = LR.PALETTE, { w, d, step } = this.data.patch;
    const nx = Math.round(w / step), nz = Math.round(d / step);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
    const col = new Float32Array((nx + 1) * (nz + 1) * 3);
    const idx = new Uint32Array(nx * nz * 6);
    const sandWet = new THREE.Color(P.sandWet), sandDry = new THREE.Color(P.sandDry);
    const grassL = new THREE.Color(P.grassLight), grassD = new THREE.Color(P.grassDark);
    const rockL = new THREE.Color(P.rockLight), rockD = new THREE.Color(P.rockDark);
    const shallow = new THREE.Color(P.waterShallow), deep = new THREE.Color(P.waterDeep), foam = new THREE.Color(P.foam);
    const seaSand = new THREE.Color(P.sandWet).lerp(shallow, 0.35);
    const tmp = new THREE.Color(), tmp2 = new THREE.Color();
    const n = new THREE.Vector3();
    const seed = this.data.seed;
    let k = 0;
    for (let i = 0; i <= nz; i++) {
      for (let j = 0; j <= nx; j++) {
        const x = -w / 2 + j * step, z = -d / 2 + i * step;
        const y = this.height(x, z);
        pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
        // Color by height and slope.
        const e = 0.8;
        n.set(this.height(x - e, z) - this.height(x + e, z), 2 * e, this.height(x, z - e) - this.height(x, z + e)).normalize();
        const grassNoise = LR.Seeded.fbm(x * 0.05, z * 0.05, seed + 3, 2) * 0.5 + 0.5;
        if (y < -0.35) {
          // Sea floor: sandy cyan in the shallows, cobalt in the deep.
          const t = LR.Seeded.smooth(Math.max(0, Math.min(1, -y / 11)));
          tmp.copy(seaSand).lerp(deep, t);
        } else if (y < 0.18) {
          tmp.copy(foam).lerp(sandWet, LR.Seeded.smooth((y + 0.35) / 0.53));
        } else if (y < 2.2) {
          tmp.copy(sandWet).lerp(sandDry, LR.Seeded.smooth((y - 0.18) / 1.0));
        } else {
          // Sand gives way to grass along a wobbly line, the way painted
          // beach textures met grass textures in the era: a short blend,
          // pushed around by noise so it isn't a contour line.
          tmp.copy(grassL).lerp(grassD, grassNoise);
          const edge = 2.2 + LR.Seeded.fbm(x * 0.08, z * 0.08, seed + 11, 2) * 0.5;
          const t = LR.Seeded.smooth(Math.max(0, Math.min(1, (y - edge) / 0.5)));
          tmp2.copy(sandDry).lerp(tmp, t); tmp.copy(tmp2);
        }
        // Steep slopes are rock, with a little noise in the rock tone.
        const steep = LR.Seeded.smooth(Math.max(0, Math.min(1, (0.78 - n.y) / 0.18)));
        if (steep > 0 && y > 0.18) {
          tmp2.copy(rockL).lerp(rockD, LR.Seeded.noise2(x * 0.11, z * 0.11, seed + 5));
          tmp.lerp(tmp2, steep);
        }
        col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b;
        k++;
      }
    }
    let q = 0;
    for (let i = 0; i < nz; i++) {
      for (let j = 0; j < nx; j++) {
        const a = i * (nx + 1) + j, b = a + 1, c = a + nx + 1, dd = c + 1;
        idx[q++] = a; idx[q++] = c; idx[q++] = b;
        idx[q++] = b; idx[q++] = c; idx[q++] = dd;
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.name = 'terrain';
    return mesh;
  }
};
