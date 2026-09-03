// Shared materials. Lambert everywhere (the era's smooth shading), with a
// stroke-map texture multiplied by a palette color.
window.LR = window.LR || {};
LR.Materials = (function () {
  const cache = new Map();
  // Style switch: 'lambert' (smooth, era-accurate) or 'toon' (cel bands).
  // Characters always use toon; this governs the world.
  const style = { world: (location.hash || '').includes('lambert') ? 'lambert' : 'toon' };
  function base(opts) {
    const { cel, flatShading, ...rest } = opts;
    const useCel = cel != null ? cel : style.world === 'toon';
    if (useCel) { const m = new THREE.MeshToonMaterial(rest); m.gradientMap = LR.Toon.gradientMap(); return m; }
    return new THREE.MeshLambertMaterial({ ...rest, flatShading: !!flatShading });
  }
  // A palette-colored Lambert with a stroke map tiled every `tile` meters
  // (uv scale is the caller's business; this just sets repeat).
  function painted(texName, colorHex, opts = {}) {
    const key = `${texName}|${colorHex}|${JSON.stringify(opts)}`;
    if (cache.has(key)) return cache.get(key);
    const map = LR.Textures[texName]().clone();
    map.needsUpdate = true;
    if (opts.repeat) map.repeat.set(opts.repeat[0], opts.repeat[1]);
    const m = base({ color: colorHex, map, side: opts.side || THREE.FrontSide,
      transparent: !!opts.transparent, alphaTest: opts.alphaTest || 0, vertexColors: !!opts.vertexColors, cel: opts.cel });
    cache.set(key, m);
    return m;
  }
  function flat(colorHex, opts = {}) {
    const key = `flat|${colorHex}|${JSON.stringify(opts)}`;
    if (cache.has(key)) return cache.get(key);
    const m = base({ color: colorHex, side: opts.side || THREE.FrontSide, vertexColors: !!opts.vertexColors, flatShading: !!opts.flatShading, cel: opts.cel });
    cache.set(key, m);
    return m;
  }

  // Terrain: Lambert with vertex colors for the palette bands, plus three
  // stroke maps (sand, grass, rock) blended by a per-vertex `splat` weight
  // and sampled in world space so they tile seamlessly across the island.
  function terrain() {
    const mat = base({ vertexColors: true });
    const sandT = LR.Textures.sand(), grassT = LR.Textures.grass(), rockT = LR.Textures.rock();
    const timeU = { value: 0 };
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.sandTex = { value: sandT };
      shader.uniforms.grassTex = { value: grassT };
      shader.uniforms.rockTex = { value: rockT };
      shader.uniforms.time = timeU;
      shader.vertexShader = 'attribute vec3 splat; varying vec3 vSplat; varying vec3 vSplatPos;\n' + shader.vertexShader
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n vSplat = splat; vSplatPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = 'uniform sampler2D sandTex, grassTex, rockTex; uniform float time; varying vec3 vSplat; varying vec3 vSplatPos;\n' + shader.fragmentShader
        .replace('#include <map_fragment>', `
          vec3 tS = texture2D(sandTex, vSplatPos.xz / 7.0).rgb;
          vec3 tG = texture2D(grassTex, vSplatPos.xz / 5.0).rgb;
          vec3 tR = texture2D(rockTex, vSplatPos.xz / 9.0).rgb;
          vec3 w = vSplat / max(vSplat.x + vSplat.y + vSplat.z, 0.001);
          diffuseColor.rgb *= tS * w.x + tG * w.y + tR * w.z;
          // Caustics: bright rippling ridges on the sea floor, fading out with depth.
          float under = smoothstep(0.1, -0.4, vSplatPos.y) * smoothstep(-9.0, -1.5, vSplatPos.y);
          if (under > 0.0) {
            vec2 q = vSplatPos.xz * 0.55;
            float c1 = sin(q.x * 1.3 + time * 1.1) * sin(q.y * 1.1 - time * 0.9);
            float c2 = sin((q.x + q.y) * 0.9 - time * 1.3) * sin((q.x - q.y) * 1.2 + time * 0.7);
            float c3 = sin(q.x * 2.1 - time * 1.7 + sin(q.y * 1.4 + time)) ;
            float caustic = pow(clamp(0.5 + 0.5 * (c1 + c2 * 0.8 + c3 * 0.5) / 1.5, 0.0, 1.0), 5.0);
            diffuseColor.rgb *= 1.0 + caustic * 1.3 * under;
          }
        `);
    };
    mat.userData.time = timeU;
    mat.customProgramCacheKey = () => 'lr-terrain-' + style.world;
    return mat;
  }
  return { painted, flat, terrain, style };
})();
