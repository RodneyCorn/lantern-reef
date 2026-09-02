// Keyboard, mouse (pointer lock), and gamepad, folded into one intent:
// move (x, y in -1..1), look (dx, dy), jump, interact, pause.
window.LR = window.LR || {};
LR.Input = class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();      // keys pressed this frame
    this.lookDX = 0; this.lookDY = 0;
    this.wheel = 0;
    this.dragging = false;
    this.lookedAt = 0;             // last time the player touched the camera
    this.gamepadIndex = null;
    this.pad = { moveX: 0, moveY: 0, lookX: 0, lookY: 0, jump: false, jumpPrev: false, interact: false, interactPrev: false };

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code); this.pressed.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('mousedown', (e) => {
      canvas.focus();
      this.dragging = true;
      if (e.button === 0 && canvas.requestPointerLock && document.pointerLockElement !== canvas) {
        try { canvas.requestPointerLock(); } catch (_) { /* not available (headless) */ }
      }
    });
    window.addEventListener('mouseup', () => { this.dragging = false; });
    window.addEventListener('mousemove', (e) => {
      const locked = document.pointerLockElement === canvas;
      if (locked || this.dragging) {
        this.lookDX += e.movementX || 0;
        this.lookDY += e.movementY || 0;
        this.lookedAt = performance.now() / 1000;
      }
    });
    canvas.addEventListener('wheel', (e) => { this.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    window.addEventListener('gamepadconnected', (e) => { this.gamepadIndex = e.gamepad.index; });
    window.addEventListener('gamepaddisconnected', () => { this.gamepadIndex = null; });
  }

  pollGamepad() {
    const p = this.pad;
    p.jumpPrev = p.jump; p.interactPrev = p.interact;
    p.moveX = p.moveY = p.lookX = p.lookY = 0; p.jump = p.interact = false;
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    const gp = this.gamepadIndex != null ? pads[this.gamepadIndex] : Array.from(pads).find(Boolean);
    if (!gp) return;
    const dz = (v) => (Math.abs(v) < 0.18 ? 0 : v);
    p.moveX = dz(gp.axes[0] || 0); p.moveY = dz(gp.axes[1] || 0);
    p.lookX = dz(gp.axes[2] || 0); p.lookY = dz(gp.axes[3] || 0);
    p.jump = !!(gp.buttons[0] && gp.buttons[0].pressed);
    p.interact = !!(gp.buttons[2] && gp.buttons[2].pressed);
    if (p.lookX || p.lookY) this.lookedAt = performance.now() / 1000;
  }

  // Call once per frame, before reading intent.
  begin() { this.pollGamepad(); }
  // Call once per frame, after reading intent.
  end() { this.pressed.clear(); this.lookDX = 0; this.lookDY = 0; this.wheel = 0; }

  down(code) { return this.keys.has(code); }
  justPressed(code) { return this.pressed.has(code); }

  get move() {
    let x = 0, y = 0;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    if (this.down('KeyW') || this.down('ArrowUp')) y -= 1;
    if (this.down('KeyS') || this.down('ArrowDown')) y += 1;
    x += this.pad.moveX; y += this.pad.moveY;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y, len: Math.min(1, len) };
  }
  get jump() { return this.justPressed('Space') || (this.pad.jump && !this.pad.jumpPrev); }
  get jumpHeld() { return this.down('Space') || this.pad.jump; }
  get interact() { return this.justPressed('KeyE') || (this.pad.interact && !this.pad.interactPrev); }
  get look() { return { dx: this.lookDX + this.pad.lookX * 14, dy: this.lookDY + this.pad.lookY * 14 }; }
  get secondsSinceLook() { return performance.now() / 1000 - this.lookedAt; }
};
