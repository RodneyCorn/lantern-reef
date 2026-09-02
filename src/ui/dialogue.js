// Speech bubbles: letter by letter, anchored above the speaker's head.
window.LR = window.LR || {};
LR.Dialogue = class Dialogue {
  constructor(camera) {
    this.camera = camera;
    this.el = document.getElementById('bubble');
    this.nameEl = this.el.querySelector('.who');
    this.textEl = this.el.querySelector('.text');
    this.isOpen = false;
    this.lines = []; this.index = 0; this.shown = 0; this.speaker = null; this.onClose = null;
    this._v = new THREE.Vector3();
  }
  open(speaker, lines, onClose) {
    this.speaker = speaker; this.lines = lines; this.index = 0; this.shown = 0; this.onClose = onClose;
    this.isOpen = true; this.nameEl.textContent = speaker.data.name; this.textEl.textContent = '';
    this.el.classList.add('show');
    this.charsPerSecond = 34;
  }
  advance() {
    const line = this.lines[this.index];
    if (this.shown < line.length) { this.shown = line.length; return; }
    this.index++;
    if (this.index >= this.lines.length) return this.close();
    this.shown = 0;
  }
  close() {
    this.isOpen = false; this.el.classList.remove('show');
    if (this.onClose) this.onClose();
    this.speaker = null;
  }
  update(dt) {
    if (!this.isOpen) return;
    const line = this.lines[this.index];
    this.shown = Math.min(line.length, this.shown + dt * this.charsPerSecond);
    this.textEl.textContent = line.slice(0, Math.floor(this.shown));
    this.el.classList.toggle('done', this.shown >= line.length);
    // Anchor above the speaker's head.
    const p = this.speaker.headPos.add(new THREE.Vector3(0, 0.35, 0));
    this._v.copy(p).project(this.camera);
    const x = (this._v.x * 0.5 + 0.5) * window.innerWidth, y = (-this._v.y * 0.5 + 0.5) * window.innerHeight;
    const w = this.el.offsetWidth, h = this.el.offsetHeight;
    const cx = Math.max(w / 2 + 12, Math.min(window.innerWidth - w / 2 - 12, x));
    const cy = Math.max(h + 12, Math.min(window.innerHeight - 40, y));
    this.el.style.left = `${cx}px`; this.el.style.top = `${cy}px`;
  }
};
