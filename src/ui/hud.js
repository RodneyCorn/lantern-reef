// Lantern Reef — minimal HUD for the gray-box milestone.
window.LR = window.LR || {};
LR.HUD = class HUD {
  constructor() {
    this.clock = document.getElementById('clock');
    this.fps = document.getElementById('fps');
    this.zone = document.getElementById('zone');
    this.prompt = document.getElementById('prompt');
    this._promptText = null;
    this.zoneName = this.zone.querySelector('.name');
    this.zoneSub = this.zone.querySelector('.sub');
    this._zoneId = null;
    this._zoneTimer = 0;
    this._fpsAcc = 0; this._fpsN = 0; this._fpsT = 0;
  }
  showPrompt(text) {
    if (text === this._promptText) return;
    this._promptText = text;
    if (text) { this.prompt.textContent = text; this.prompt.classList.add('show'); } else this.prompt.classList.remove('show');
  }
  setHour(h) {
    const hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60);
    this.clock.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
  tickFps(dt) {
    this._fpsAcc += dt; this._fpsN++;
    if (this._fpsAcc >= 0.5) {
      this.fps.textContent = `${Math.round(this._fpsN / this._fpsAcc)} fps`;
      this._fpsAcc = 0; this._fpsN = 0;
    }
  }
  showZone(zone, dt) {
    if (zone && zone.id !== this._zoneId) {
      this._zoneId = zone.id;
      this.zoneName.textContent = zone.name;
      this.zoneSub.textContent = zone.sub || '';
      this.zone.classList.add('show');
      this._zoneTimer = 3.2;
    }
    if (this._zoneTimer > 0) {
      this._zoneTimer -= dt;
      if (this._zoneTimer <= 0) this.zone.classList.remove('show');
    }
  }
};
