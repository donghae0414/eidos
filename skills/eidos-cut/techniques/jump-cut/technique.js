(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  // A transition never takes 0 s: a 0 s track starting at the previous stop's time would already
  // be applied (p = 1) while the viewer is parked on that stop, showing the next scene too early.
  const FRAME = 1 / 60;
  const durOf = (v) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) fail(`jump-cut: dur must be a finite number >= 0 (got ${JSON.stringify(v)})`);
    return Math.max(v, FRAME);
  };

  E.fx["jump-cut"] = (stage, o = {}) => {
    const { tl, world } = stage;
    const { r3 } = E.util;
    const flash = o.flash ?? true;
    if (typeof flash !== "boolean") fail(`jump-cut: flash must be true or false (got ${JSON.stringify(o.flash)})`);
    const peak = o.strength ?? 0.22;
    if (typeof peak !== "number" || !(peak >= 0 && peak <= 1)) fail(`jump-cut: strength must be a number in [0, 1] (got ${JSON.stringify(o.strength)})`);
    // The swap happens on the first frame after start; dur is the flash length (80 ms), or one frame without it.
    const lit = flash && !E.reduced;
    const flashDur = durOf(o.dur ?? 0.08);
    const dur = lit ? flashDur : FRAME;
    const start = tl.resolveAt(o.at);
    const at = { at: start, dur, ease: "linear" };
    if (o.from) tl.tween(o.from, { opacity: (p) => (p > 0 ? 0 : 1) }, at);
    if (o.to) tl.tween(o.to, { opacity: (p) => (p > 0 ? 1 : 0) }, at);
    if (lit) {
      const veil = document.createElement("div");
      veil.className = "eidos-fx-jump-cut";
      veil.setAttribute("aria-hidden", "true");
      Object.assign(veil.style, { position: "absolute", inset: "0", pointerEvents: "none", background: "var(--eidos-fg)", opacity: "0" });
      world.after(veil);
      tl.tween(veil, { style: (p) => ({ opacity: String(p > 0 && p < 1 ? r3(peak * (1 - p)) : 0) }) }, at);
    }
    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
  E.fx["jump-cut"].kind = "transition";
})();
