// Sky dome, sun, hemisphere light, fog, and the time-of-day driver.
// One `hour` value drives everything, blended from LR.DAY.keys.
window.LR = window.LR || {};
LR.Sky = class Sky {
  constructor(scene) {
    this.scene = scene;
    this.hour = LR.DAY.startHour;
    this.night = 0;
    this.timeScale = 1;
    this.sunDir = new THREE.Vector3(0, 1, 0);
    this._c = { zenith: new THREE.Color(), horizon: new THREE.Color(), sun: new THREE.Color(),
                hemiSky: new THREE.Color(), hemiGround: new THREE.Color(), fog: new THREE.Color() };
    this._tmpA = new THREE.Color(); this._tmpB = new THREE.Color();

    this.uniforms = {
      zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() },
      sunDir: { value: this.sunDir }, sunColor: { value: new THREE.Color() }, sunVis: { value: 1 },
      night: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 zenith, horizon, sunDir, sunColor; uniform float sunVis, night;
        varying vec3 vDir;
        float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
        void main() {
          vec3 d = normalize(vDir);
          float t = clamp(d.y, -0.1, 1.0);
          float k = pow(smoothstep(-0.08, 0.55, t), 0.85);
          vec3 col = mix(horizon, zenith, k);
          // A pale haze band hugging the horizon.
          col = mix(col, horizon * 1.06, (1.0 - smoothstep(0.0, 0.09, abs(t - 0.015))) * 0.6);
          float sd = max(dot(d, sunDir), 0.0);
          col += sunColor * pow(sd, 90.0) * 0.55 * sunVis;                 // glow
          col += sunColor * smoothstep(0.9990, 0.9996, sd) * 1.4 * sunVis;   // disc
          // Stars at night: sparse hashed points on a coarse grid.
          if (night > 0.0 && d.y > 0.02) {
            vec3 g = floor(d * 140.0);
            float s = hash(g);
            float star = step(0.992, s) * smoothstep(0.55, 1.0, hash(g + 1.7));
            col += vec3(star) * night * 0.9;
          }
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 18), mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
    scene.add(this.mesh);

    this.sun = new THREE.DirectionalLight(0xffffff, 1.3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -48; sc.right = 48; sc.top = 48; sc.bottom = -48; sc.near = 1; sc.far = 420;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.6;
    scene.add(this.sun); scene.add(this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 0.75);
    scene.add(this.hemi);

    scene.fog = new THREE.Fog(0xa9ddf5, 220, 1500);
    this.apply();
  }

  // Real seconds -> game hours, at the rate of whichever phase we are in.
  advance(dt) {
    const h24 = this.hour % 24;
    let rate = 10 / (12 * 60);   // fallback: same as daytime
    for (const p of LR.DAY.phases) {
      const inPhase = (h24 >= p.from && h24 < p.to) || (h24 + 24 >= p.from && h24 + 24 < p.to);
      if (inPhase) { rate = (p.to - p.from) / (p.minutes * 60); break; }
    }
    this.hour = (this.hour + dt * rate * this.timeScale) % 24;
    this.apply();
  }

  _blend() {
    const keys = LR.DAY.keys, h = this.hour % 24;
    let i = 0;
    while (i < keys.length - 2 && keys[i + 1].h <= h) i++;
    const a = keys[i], b = keys[i + 1];
    const t = LR.Seeded.smooth(Math.max(0, Math.min(1, (h - a.h) / (b.h - a.h))));
    for (const name of ['zenith', 'horizon', 'sun', 'hemiSky', 'hemiGround', 'fog']) {
      this._tmpA.setHex(a[name]); this._tmpB.setHex(b[name]);
      this._c[name].copy(this._tmpA).lerp(this._tmpB, t);
    }
    return { sunI: a.sunI + (b.sunI - a.sunI) * t, hemiI: a.hemiI + (b.hemiI - a.hemiI) * t };
  }

  apply() {
    const k = this._blend();
    const h = this.hour % 24;
    // Sun arc: rises in the east (+x) at 6, sets in the west at 18, leaning south (+z).
    const day = h >= 6 && h <= 18;
    const ang = ((day ? h : (h + 12) % 24) - 6) / 12 * Math.PI;
    this.sunDir.set(Math.cos(ang), Math.max(0.06, Math.sin(ang)), 0.42 * Math.sin(ang) + 0.1).normalize();
    // Night amount for the stars: fully on from 20:00 to 05:00, fading around it.
    let n = 0;
    if (h >= 20 || h < 5) n = 1;
    else if (h >= 19 && h < 20) n = h - 19;
    else if (h >= 5 && h < 6) n = 6 - h;

    this.uniforms.zenith.value.copy(this._c.zenith);
    this.uniforms.horizon.value.copy(this._c.horizon);
    this.uniforms.sunColor.value.copy(this._c.sun);
    this.uniforms.sunVis.value = day ? 1 : 0.35;
    this.uniforms.night.value = n;
    this.night = n;

    this.sun.color.copy(this._c.sun);
    this.sun.intensity = k.sunI;
    this.hemi.color.copy(this._c.hemiSky);
    this.hemi.groundColor.copy(this._c.hemiGround);
    this.hemi.intensity = k.hemiI;
    this.scene.fog.color.copy(this._c.fog);
    this.scene.background = null;
  }

  // Keep the dome and the shadow frustum centered on the player.
  follow(playerPos, cameraPos) {
    this.mesh.position.copy(cameraPos);
    this.sun.target.position.copy(playerPos);
    this.sun.position.copy(playerPos).addScaledVector(this.sunDir, 180);
  }

  setHour(h) { this.hour = ((h % 24) + 24) % 24; this.apply(); }
};
