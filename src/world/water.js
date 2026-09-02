// The sea: one big plane at y = 0 with gentle vertex waves, a shallow/deep
// tint, a moving sparkle, and fog so it melts into the horizon.
window.LR = window.LR || {};
LR.Water = class Water {
  constructor(scene, terrain) {
    const P = LR.PALETTE;
    const patch = LR.ISLAND.patch;
    this.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      time: { value: 0 },
      shallow: { value: new THREE.Color(P.waterShallow) },
      deep: { value: new THREE.Color(P.waterDeep) },
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
      sunColor: { value: new THREE.Color(0xffffff) },
      tint: { value: new THREE.Color(0xffffff) },
      skyColor: { value: new THREE.Color(P.skyHorizon) },
      foamColor: { value: new THREE.Color(P.foam) },
      depthTex: { value: terrain.buildDepthTexture() },
      patchSize: { value: new THREE.Vector2(patch.w, patch.d) },
    }]);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false, fog: true,
      vertexShader: `
        uniform float time;
        varying vec3 vWorld; varying vec3 vNormalW;
        #include <fog_pars_vertex>
        void main() {
          vec3 p = position;
          vec4 w = modelMatrix * vec4(p, 1.0);
          float h = sin(w.x * 0.12 + time * 1.1) * 0.10 + sin(w.z * 0.09 - time * 0.8) * 0.08
                  + sin((w.x + w.z) * 0.05 + time * 0.6) * 0.12;
          w.y += h;
          float dx = cos(w.x * 0.12 + time * 1.1) * 0.012 + cos((w.x + w.z) * 0.05 + time * 0.6) * 0.006;
          float dz = cos(w.z * 0.09 - time * 0.8) * 0.0072 + cos((w.x + w.z) * 0.05 + time * 0.6) * 0.006;
          vNormalW = normalize(vec3(-dx, 1.0, -dz));
          vWorld = w.xyz;
          vec4 mvPosition = viewMatrix * w;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `
        uniform vec3 shallow, deep, sunDir, sunColor, tint, skyColor, foamColor; uniform float time;
        uniform sampler2D depthTex; uniform vec2 patchSize;
        varying vec3 vWorld; varying vec3 vNormalW;
        #include <fog_pars_fragment>
        float depthAt(vec2 xz) {
          vec2 uv = xz / patchSize + 0.5;
          if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 25.0;
          return texture2D(depthTex, uv).r * 25.0;
        }
        void main() {
          vec3 V = normalize(cameraPosition - vWorld);
          float fres = pow(1.0 - max(dot(V, vNormalW), 0.0), 2.2);
          float d = depthAt(vWorld.xz);
          // Cyan over the sand, cobalt over the deep, a little sky at grazing angles.
          vec3 col = mix(shallow, deep, smoothstep(0.0, 9.0, d));
          col = mix(col, skyColor, fres * 0.45);
          // Sun glitter: a stripe pattern that drifts, gated by the sun's reflection.
          vec3 R = reflect(-V, vNormalW);
          float spec = pow(max(dot(R, sunDir), 0.0), 60.0);
          // Fine drifting glitter, strongest where the sun reflects.
          float g1 = sin(vWorld.x * 1.9 + time * 1.6) * sin(vWorld.z * 1.7 - time * 1.1);
          float g2 = sin(vWorld.x * 1.1 - time * 0.9 + vWorld.z * 0.6) * sin(vWorld.z * 1.3 + time * 0.7);
          float stripes = smoothstep(0.80, 1.0, g1 * 0.5 + 0.5) * smoothstep(0.55, 1.0, g2 * 0.5 + 0.5);
          col += sunColor * (spec * 0.7 + stripes * (0.15 + spec * 3.0));
          // Foam: a bright wobbling band right at the shore, and a fainter
          // wave line that creeps in and out a couple of meters further off.
          float wob = sin(vWorld.x * 0.35 + time * 1.4) * 0.2 + sin(vWorld.z * 0.29 - time * 1.1) * 0.2;
          float shoreFoam = smoothstep(0.8, 0.05, d + wob);
          float wavePos = 1.7 + 0.7 * sin(time * 0.8 + vWorld.x * 0.12 + vWorld.z * 0.09);
          float waveLine = (1.0 - smoothstep(0.0, 0.3, abs(d - wavePos))) * (0.4 + 0.3 * sin(time * 1.7 + vWorld.x * 0.5));
          float foam = clamp(max(shoreFoam, waveLine), 0.0, 1.0) * step(0.02, d);
          col = mix(col, foamColor, foam);
          col *= tint;
          float alpha = mix(0.38, 0.86, smoothstep(0.0, 3.5, d)) + fres * 0.1;
          alpha = max(alpha, foam * 0.95);
          gl_FragColor = vec4(col, alpha);
          #include <fog_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400, 120, 120), mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.renderOrder = 5;
    this.mesh.name = 'water';
    scene.add(this.mesh);
    // Deep sea floor under everything, so the sea looks the same beyond the
    // edge of the terrain patch as it does over the patch's deep water.
    const floorCol = new THREE.Color(P.waterDeep);   // must match the terrain's deepest floor color, or the patch edge shows
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshLambertMaterial({ color: floorCol }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = LR.ISLAND.coast.seaFloor - 0.5;
    this.floor.name = 'seafloor';
    scene.add(this.floor);
  }
  update(dt, sky) {
    this.uniforms.time.value += dt;
    this.uniforms.sunDir.value.copy(sky.sunDir);
    this.uniforms.sunColor.value.copy(sky._c.sun).multiplyScalar(Math.min(1, sky.sun.intensity));
    // Dim the water at night along with the sky.
    this.uniforms.tint.value.setRGB(1, 1, 1).lerp(sky._c.horizon, 0.35);
    this.uniforms.skyColor.value.copy(sky._c.horizon);
    this.uniforms.fogColor.value.copy(sky.scene.fog.color);
    this.uniforms.fogNear.value = sky.scene.fog.near;
    this.uniforms.fogFar.value = sky.scene.fog.far;
  }
};
