// Cel shading and ink outlines. A stepped gradient map gives flat tone
// bands; an inverted-hull pass draws a dark outline around each mesh.
window.LR = window.LR || {};
LR.Toon = (function () {
  let gradient = null;
  function gradientMap(steps = [0.5, 0.82, 1.0]) {
    if (gradient) return gradient;
    const data = new Uint8Array(steps.length);
    steps.forEach((v, i) => { data[i] = Math.round(v * 255); });
    gradient = new THREE.DataTexture(data, steps.length, 1, THREE.RedFormat, THREE.UnsignedByteType);
    gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
    gradient.needsUpdate = true;
    return gradient;
  }
  const outlineCache = new Map();
  function outlineMaterial(thickness = 0.02, color = 0x1E140E) {
    const key = thickness + '|' + color;
    if (outlineCache.has(key)) return outlineCache.get(key);
    const m = new THREE.ShaderMaterial({
      uniforms: { thickness: { value: thickness }, color: { value: new THREE.Color(color) } },
      vertexShader: `uniform float thickness; void main() { vec3 p = position + normal * thickness; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: 'uniform vec3 color;\nvoid main() {\n  gl_FragColor = vec4(color, 1.0);\n  #include <colorspace_fragment>\n}',
      side: THREE.BackSide,
    });
    outlineCache.set(key, m);
    return m;
  }
  // Give every opaque mesh under `root` an outline child.
  function addOutlines(root, thickness = 0.02) {
    const mat = outlineMaterial(thickness);
    const targets = [];
    root.traverse((o) => { if (o.isMesh && !o.userData.noOutline && !o.material.transparent) targets.push(o); });
    for (const m of targets) {
      const o = new THREE.Mesh(m.geometry, mat);
      o.userData.isOutline = true; o.castShadow = false; o.receiveShadow = false;
      m.add(o);
    }
  }
  return { gradientMap, outlineMaterial, addOutlines };
})();
