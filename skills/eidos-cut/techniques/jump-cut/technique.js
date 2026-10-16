(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const durOf = (v) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) fail(`jump-cut: dur must be a finite number >= 0 (got ${JSON.stringify(v)})`);
    return v;
  };

  E.fx["jump-cut"] = (stage, o = {}) => {
    const { tl, world } = stage;
    const { r3 } = E.util;
    const flash = o.flash ?? true;
    if (typeof flash !== "boolean") fail(`jump-cut: flash must be true or false (got ${JSON.stringify(o.flash)})`);
    const peak = o.strength ?? 0.22;
    if (typeof peak !== "number" || !(peak >= 0 && peak <= 1)) fail(`jump-cut: strength must be a number in [0, 1] (got ${JSON.stringify(o.strength)})`);
    // The swap happens right after start (exactly at start the previous state stays); dur is the flash length, 0 without it.
    const lit = flash && !E.reduced;
    const flashDur = durOf(o.dur ?? 0.08);
    const dur = lit ? flashDur : 0;
    const start = tl.resolveAt(o.at);
    const at = { at: start, dur, ease: "linear" };
    const first = tl.tracks.length;
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
    // Same rule the runtime uses for zero-duration scene entries (openScene): a track starting exactly
    // at a stop time takes effect only for t > start, so a viewer parked on the previous stop still sees
    // that stop's scene while dur: 0 keeps end === start.
    for (const tr of tl.tracks.slice(first)) {
      const fn = tr.fn;
      tr.fn = (p) => fn(tl.t <= start ? 0 : p);
    }
    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
  E.fx["jump-cut"].kind = "transition";
})();
