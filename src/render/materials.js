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
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.sandTex = { value: sandT };
      shader.uniforms.grassTex = { value: grassT };
      shader.uniforms.rockTex = { value: rockT };
      shader.vertexShader = 'attribute vec3 splat; varying vec3 vSplat; varying vec2 vSplatPos;\n' + shader.vertexShader
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n vSplat = splat; vSplatPos = (modelMatrix * vec4(transformed, 1.0)).xz;');
      shader.fragmentShader = 'uniform sampler2D sandTex, grassTex, rockTex; varying vec3 vSplat; varying vec2 vSplatPos;\n' + shader.fragmentShader
        .replace('#include <map_fragment>', `
          vec3 tS = texture2D(sandTex, vSplatPos / 7.0).rgb;
          vec3 tG = texture2D(grassTex, vSplatPos / 5.0).rgb;
          vec3 tR = texture2D(rockTex, vSplatPos / 9.0).rgb;
          vec3 w = vSplat / max(vSplat.x + vSplat.y + vSplat.z, 0.001);
          diffuseColor.rgb *= tS * w.x + tG * w.y + tR * w.z;
        `);
    };
    mat.customProgramCacheKey = () => 'lr-terrain-' + style.world;
    return mat;
  }
  return { painted, flat, terrain, style };
})();
