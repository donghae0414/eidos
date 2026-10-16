(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };

  E.fx["jump-cut"] = (stage, o = {}) => {
    const { tl, world } = stage;
    const { r3 } = E.util;
    const flash = o.flash ?? true;
    if (typeof flash !== "boolean") fail(`jump-cut: flash must be true or false (got ${JSON.stringify(o.flash)})`);
    // The swap is instant; dur is only the length of the flash after it (80 ms).
    const lit = flash && !E.reduced;
    const dur = lit ? o.dur ?? 0.08 : 0;
    if (!Number.isFinite(dur) || dur < 0) fail(`jump-cut: dur must be a finite number >= 0 (got ${JSON.stringify(o.dur)})`);
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
      const peak = o.strength ?? 0.22;
      tl.tween(veil, { style: (p) => ({ opacity: String(p > 0 && p < 1 ? r3(peak * (1 - p)) : 0) }) }, at);
    }
    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
  E.fx["jump-cut"].kind = "transition";
})();
