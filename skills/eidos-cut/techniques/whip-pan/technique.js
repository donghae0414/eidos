(() => {
  const E = window.Eidos;
  // dir is where the camera whips to, i.e. where the next scene sits; content slides the other way.
  const DIRS = { right: ["x", 1], left: ["x", -1], down: ["y", 1], up: ["y", -1] };
  let filters = 0;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  // A transition never takes 0 s: a 0 s track starting at the previous stop's time would already
  // be applied (p = 1) while the viewer is parked on that stop, showing the next scene too early.
  const FRAME = 1 / 60;
  const durOf = (v) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) fail(`whip-pan: dur must be a finite number >= 0 (got ${JSON.stringify(v)})`);
    return Math.max(v, FRAME);
  };
  // Own keys only: inherited names such as "constructor" must not pass as an ease.
  const easeOf = (e) =>
    typeof e === "function" ? e
      : typeof e === "string" && Object.hasOwn(E.ease, e) ? E.ease[e]
        : fail(`whip-pan: ease must be a function or one of ${Object.keys(E.ease).join(", ")} (got ${JSON.stringify(e)})`);

  E.fx["whip-pan"] = (stage, o = {}) => {
    const { tl, world } = stage;
    const { r3 } = E.util;
    const dir = o.dir ?? "right";
    if (typeof dir !== "string" || !Object.hasOwn(DIRS, dir)) fail(`whip-pan: dir must be one of ${Object.keys(DIRS).join(", ")} (got ${JSON.stringify(o.dir)})`);
    const dur = durOf(o.dur ?? 0.55);
    const blur = o.blur === false ? 0 : o.blur == null || o.blur === true ? 28 : typeof o.blur === "number" ? o.blur : NaN;
    if (!Number.isFinite(blur) || blur < 0) fail(`whip-pan: blur must be true, false or px >= 0 (got ${JSON.stringify(o.blur)})`);
    const gap = o.gap ?? 48;
    if (typeof gap !== "number" || !Number.isFinite(gap) || gap < 0) fail(`whip-pan: gap must be a finite number >= 0 (got ${JSON.stringify(o.gap)})`);
    const ease = easeOf(o.ease ?? "inOut");
    const start = tl.resolveAt(o.at);
    const at = { at: start, dur, ease: "linear" };

    if (E.reduced) {
      // Reduced motion: fade in place, no travel, no blur.
      if (o.from) tl.tween(o.from, { opacity: (p) => 1 - ease(p) }, at);
      if (o.to) tl.tween(o.to, { opacity: (p) => ease(p) }, at);
    } else {
      const [axis, sign] = DIRS[dir];
      let span = 0;
      stage.onLayout(() => {
        span = (axis === "x" ? world.offsetWidth : world.offsetHeight) + gap;
      });
      let url = "";
      if (blur > 0) {
        // Directional motion blur along the travel axis only: "s 0" for left/right, "0 s" for up/down.
        // The perpendicular axis is never blurred.
        const id = `eidos-whip-pan-${++filters}`;
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("width", "0");
        svg.setAttribute("height", "0");
        svg.style.position = "absolute";
        const f = document.createElementNS(ns, "filter");
        f.id = id;
        for (const [k, v] of Object.entries({ x: "-25%", y: "-25%", width: "150%", height: "150%", "color-interpolation-filters": "sRGB" })) f.setAttribute(k, v);
        const g = document.createElementNS(ns, "feGaussianBlur");
        g.setAttribute("stdDeviation", "0 0");
        f.append(g);
        svg.append(f);
        world.after(svg);
        url = `url(#${id})`;
        // Blur follows speed: zero at rest, strongest mid-whip.
        tl.tween(g, { attr: (p) => { const s = r3(blur * 4 * p * (1 - p)); return { stdDeviation: axis === "x" ? `${s} 0` : `0 ${s}` }; } }, at);
      }
      const moving = (p) => ({ filter: url && p > 0 && p < 1 ? url : "none" });
      if (o.from) tl.tween(o.from, { opacity: (p) => (p < 1 ? 1 : 0), [axis]: (p) => r3(-sign * ease(p) * span), style: moving }, at);
      if (o.to) tl.tween(o.to, { opacity: (p) => (p > 0 ? 1 : 0), [axis]: (p) => r3(sign * (1 - ease(p)) * span), style: moving }, at);
    }
    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
  E.fx["whip-pan"].kind = "transition";
})();
