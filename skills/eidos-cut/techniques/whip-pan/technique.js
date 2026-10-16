(() => {
  const E = window.Eidos;
  // A whip pan is a horizontal camera move (fast translateX + x-axis blur). dir is where the camera
  // whips to, i.e. where the next scene sits; content slides the other way.
  const DIRS = { right: 1, left: -1 };
  let filters = 0;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const durOf = (v) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) fail(`whip-pan: dur must be a finite number >= 0 (got ${JSON.stringify(v)})`);
    return v;
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
    if (typeof dir !== "string" || !Object.hasOwn(DIRS, dir)) {
      const hint = dir === "up" || dir === "down" ? "; a whip pan only moves horizontally - use wipe with dir up/down for a vertical change" : "";
      fail(`whip-pan: dir must be "left" or "right" (got ${JSON.stringify(o.dir)})${hint}`);
    }
    const dur = durOf(o.dur ?? 0.55);
    const blur = o.blur === false ? 0 : o.blur == null || o.blur === true ? 28 : typeof o.blur === "number" ? o.blur : NaN;
    if (!Number.isFinite(blur) || blur < 0) fail(`whip-pan: blur must be true, false or px >= 0 (got ${JSON.stringify(o.blur)})`);
    const gap = o.gap ?? 48;
    if (typeof gap !== "number" || !Number.isFinite(gap) || gap < 0) fail(`whip-pan: gap must be a finite number >= 0 (got ${JSON.stringify(o.gap)})`);
    const ease = easeOf(o.ease ?? "inOut");
    const start = tl.resolveAt(o.at);
    const at = { at: start, dur, ease: "linear" };
    const first = tl.tracks.length;

    if (E.reduced) {
      // Reduced motion: fade in place, no travel, no blur.
      if (o.from) tl.tween(o.from, { opacity: (p) => 1 - ease(p) }, at);
      if (o.to) tl.tween(o.to, { opacity: (p) => ease(p) }, at);
    } else {
      const sign = DIRS[dir];
      let span = 0;
      stage.onLayout(() => {
        span = world.offsetWidth + gap;
      });
      let url = "";
      if (blur > 0) {
        // Directional motion blur on the x axis only (stdDeviation "s 0").
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
        tl.tween(g, { attr: (p) => { const s = r3(blur * 4 * p * (1 - p)); return { stdDeviation: `${s} 0` }; } }, at);
      }
      const moving = (p) => ({ filter: url && p > 0 && p < 1 ? url : "none" });
      if (o.from) tl.tween(o.from, { opacity: (p) => (p < 1 ? 1 : 0), x: (p) => r3(-sign * ease(p) * span), style: moving }, at);
      if (o.to) tl.tween(o.to, { opacity: (p) => (p > 0 ? 1 : 0), x: (p) => r3(sign * (1 - ease(p)) * span), style: moving }, at);
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
  E.fx["whip-pan"].kind = "transition";
})();
