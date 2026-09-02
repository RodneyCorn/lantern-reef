// Things Milo can press E on. Shows a prompt for the nearest one in range.
window.LR = window.LR || {};
LR.Interact = class Interact {
  constructor() { this.items = []; this.current = null; }
  add(item) { this.items.push(item); return item; }
  update(player, input, hud, dialogue) {
    if (dialogue.isOpen) { hud.showPrompt(null); if (input.interact) dialogue.advance(); return; }
    if (player.sitting) { hud.showPrompt('Move to stand up'); return; }
    let best = null, bd = Infinity;
    for (const it of this.items) {
      const d = Math.hypot(it.x - player.pos.x, it.z - player.pos.z);
      if (d < it.r && d < bd && Math.abs((it.y != null ? it.y : player.pos.y) - player.pos.y) < 4) { best = it; bd = d; }
    }
    this.current = best;
    hud.showPrompt(best ? `E · ${best.label}` : null);
    if (best && input.interact) best.action(player);
  }
};
