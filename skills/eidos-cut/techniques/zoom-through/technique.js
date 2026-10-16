(() => {
  const E = window.Eidos;
  const fail = (message) => {
    (window.__eidosErrors ||= []).push(`zoom-through: ${message}`);
    throw new Error(`zoom-through: ${message}`);
  };
  E.fx["zoom-through"] = (stage, o = {}) => {
    const allowed = { from: 1, to: 1, at: 1, dur: 1, ease: 1, glyph: 1, scale: 1 };
    if (!o || typeof o !== "object" || Array.isArray(o)) fail("options must be an object");
    for (const key of Object.keys(o)) if (!Object.hasOwn(allowed, key)) fail(`unknown option ${key}`);
    const glyph = o.glyph ?? "O", scale = o.scale ?? 120, dur = o.dur ?? 1.4;
    if (typeof glyph !== "string" || !glyph.trim() || [...glyph].length > 8) fail("glyph must be a non-empty string of at most 8 code points");
    if (!Number.isFinite(scale) || scale < 50 || scale > 200) fail("scale must be a finite number from 50 to 200");
    if (!Number.isFinite(dur) || dur < 0) fail("dur must be finite nonnegative seconds");
    const easing = o.ease ?? "in";
    if (typeof easing !== "function" && !Object.hasOwn(E.ease, easing)) fail(`unknown ease ${String(easing)}`);
    const ease = typeof easing === "function" ? easing : E.ease[easing];
    let from, to;
    try { from = E.$all(o.from, stage.world); to = E.$all(o.to, stage.world); }
    catch { fail("from and to must be valid scene selectors or elements"); }
    if (from.length !== 1 || to.length !== 1 || from[0] === to[0]) fail("from and to must each select one distinct scene");
    const { tl } = stage, start = tl.resolveAt(o.at);
    if (!Number.isFinite(start) || start < 0) fail("at must resolve to finite nonnegative seconds");
    const snap = (p) => tl.t <= start ? 0 : p < 1e-9 ? 0 : p > 1 - 1e-9 ? 1 : p;
    const at = { at: start, dur, ease: "linear" };
    let text, maskId, w = 1, h = 1;
    if (!E.reduced) {
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("aria-hidden", "true");
      Object.assign(svg.style, { position: "absolute", width: "0px", height: "0px", pointerEvents: "none" });
      const defs = document.createElementNS(ns, "defs"), mask = document.createElementNS(ns, "mask");
      maskId = `eidos-zoom-through-${stage.world.querySelectorAll("mask").length}`;
      mask.id = maskId;
      mask.setAttribute("maskUnits", "userSpaceOnUse");
      mask.setAttribute("maskContentUnits", "userSpaceOnUse");
      mask.style.maskType = "alpha";
      text = document.createElementNS(ns, "text");
      text.textContent = glyph;
      text.setAttribute("fill", "white");
      text.setAttribute("stroke", "white");
      text.setAttribute("stroke-linejoin", "round");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("font-family", "system-ui, sans-serif");
      text.setAttribute("font-weight", "900");
      mask.append(text); defs.append(mask); svg.append(defs); stage.world.append(svg);
      stage.onLayout(() => {
        const r = stage.measure(to[0]); w = r.w; h = r.h;
        mask.setAttribute("x", "0"); mask.setAttribute("y", "0");
        mask.setAttribute("width", String(w)); mask.setAttribute("height", String(h));
        text.setAttribute("x", String(w / 2)); text.setAttribute("y", String(h / 2));
        text.setAttribute("font-size", String(Math.min(w, h) * 0.18));
      });
      tl.add((raw) => {
        const p = snap(raw), k = Math.pow(scale, ease(p));
        text.setAttribute("transform", `translate(${w / 2} ${h / 2}) scale(${E.util.r3(k)}) translate(${-w / 2} ${-h / 2})`);
        // Dilate the glyph as we enter: hollow counters and inter-letter gaps must open,
        // rather than sweep back across already revealed content at a larger scale.
        text.setAttribute("stroke-width", String(E.util.r3(Math.min(w, h) * 0.18 * 0.8 * (1 - 1 / k))));
      }, at);
    }
    tl.tween(from, { opacity: (p) => snap(p) === 1 ? 0 : 1 }, at);
    tl.tween(to, {
      opacity: (p) => E.reduced ? (snap(p) < 0.5 ? 0 : 1) : (snap(p) === 0 ? 0 : 1),
      style: (p) => {
        const mask = !E.reduced && snap(p) > 0 && snap(p) < 1 ? `url("#${maskId}")` : "none";
        return { maskImage: mask, webkitMaskImage: mask };
      },
    }, at);
    // Reduced motion must also remove the outgoing scene at the same midpoint.
    if (E.reduced) tl.tween(from, { opacity: (p) => snap(p) < 0.5 ? 1 : 0 }, at);
    return { start, end: start + dur };
  };
  E.fx["zoom-through"].kind = "transition";
})();
