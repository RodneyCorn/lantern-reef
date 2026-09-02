// Small geometry helpers: merging many pieces into one draw call, with
// per-piece colors, and building tapered tubes / ribbons.
window.LR = window.LR || {};
LR.Geo = (function () {
  const _m = new THREE.Matrix4(), _n = new THREE.Matrix3(), _v = new THREE.Vector3();
  // pieces: [{ geometry, matrix?, color? (THREE.Color), position?, rotation?, scale? }]
  function merge(pieces) {
    const pos = [], nrm = [], uv = [], col = [];
    for (const p of pieces) {
      let g = p.geometry.index ? p.geometry.toNonIndexed() : p.geometry;
      const m = p.matrix || _m.compose(p.position || new THREE.Vector3(), p.rotation ? new THREE.Quaternion().setFromEuler(p.rotation) : new THREE.Quaternion(), p.scale || new THREE.Vector3(1, 1, 1));
      _n.getNormalMatrix(m);
      const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, C = g.attributes.color;
      const c = p.color || new THREE.Color(1, 1, 1);
      for (let i = 0; i < P.count; i++) {
        _v.fromBufferAttribute(P, i).applyMatrix4(m); pos.push(_v.x, _v.y, _v.z);
        _v.fromBufferAttribute(N, i).applyMatrix3(_n).normalize(); nrm.push(_v.x, _v.y, _v.z);
        if (U) uv.push(U.getX(i), U.getY(i)); else uv.push(0, 0);
        if (C) col.push(C.getX(i) * c.r, C.getY(i) * c.g, C.getZ(i) * c.b); else col.push(c.r, c.g, c.b);
      }
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return out;
  }
  // A tube along `curve` whose radius goes from r0 at the start to r1 at the end.
  function taperedTube(curve, r0, r1, segs = 8, radial = 7) {
    const g = new THREE.TubeGeometry(curve, segs, 1, radial, false);
    const P = g.attributes.position, per = radial + 1;
    for (let i = 0; i < P.count; i++) {
      const t = Math.floor(i / per) / segs;
      const c = curve.getPoint(t), r = r0 + (r1 - r0) * t;
      P.setXYZ(i, c.x + (P.getX(i) - c.x) * r, c.y + (P.getY(i) - c.y) * r, c.z + (P.getZ(i) - c.z) * r);
    }
    P.needsUpdate = true; g.computeVertexNormals();
    return g;
  }
  // Jitter a geometry's vertices radially (rocks). Shared vertices must
  // move together, so jitter by hashed position.
  function roughen(geometry, amount, seed) {
    const P = geometry.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      const h = LR.Seeded.hash2(Math.round(x * 100), Math.round(y * 100 + z * 7919), seed);
      const k = 1 + (h - 0.5) * 2 * amount;
      P.setXYZ(i, x * k, y * k, z * k);
    }
    P.needsUpdate = true; geometry.computeVertexNormals();
    return geometry;
  }
  return { merge, taperedTube, roughen };
})();
