(() => {
  const E = window.Eidos;
  const MODES = ["reveal", "cover"];
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const easeOf = (e) => (typeof e === "function" ? e : E.ease[e] || fail(`iris: unknown ease ${JSON.stringify(e)}`));
  const token = (name) => {
    if (!/^[a-z0-9-]+$/.test(String(name)) || !getComputedStyle(document.documentElement).getPropertyValue(`--eidos-${name}`).trim()) {
      fail(`iris: color must name an --eidos-* token such as "accent" or "fg" (got ${JSON.stringify(name)})`);
    }
    return `var(--eidos-${name})`;
  };
  const far = (x, y, w, h) => Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y));

  E.fx["iris"] = (stage, o = {}) => {
    const { tl, world } = stage;
    const { r3, clamp01 } = E.util;
    const mode = o.mode ?? "reveal";
    if (!MODES.includes(mode)) fail(`iris: mode must be one of ${MODES.join(", ")} (got ${JSON.stringify(o.mode)})`);
    const dur = o.dur ?? (mode === "cover" ? 1.2 : 0.9);
    if (!Number.isFinite(dur) || dur < 0) fail(`iris: dur must be a finite number >= 0 (got ${JSON.stringify(o.dur)})`);
    const ease = easeOf(o.ease ?? "pop");
    const originEl = o.origin == null ? null : E.$all(o.origin, world)[0] || fail(`iris: no element for origin ${JSON.stringify(o.origin)}`);
    const color = mode === "cover" ? token(o.color ?? "accent") : null;
    const start = tl.resolveAt(o.at);
    const at = { at: start, dur, ease: "linear" };
    const toEls = E.$all(o.to, world);
    const fromEls = E.$all(o.from, world);

    // Layout: origin centre and covering radius in world coordinates, then per incoming element offsets.
    let cx = 0, cy = 0, R = 0;
    const local = new Map();
    stage.onLayout(() => {
      const w = world.offsetWidth, h = world.offsetHeight;
      if (originEl) {
        const r = stage.measure(originEl);
        cx = r.x + r.w / 2;
        cy = r.y + r.h / 2;
      } else {
        cx = w / 2;
        cy = h / 2;
      }
      R = far(cx, cy, w, h);
      for (const el of [...toEls, ...fromEls]) {
        const r = stage.measure(el);
        local.set(el, { x: cx - r.x, y: cy - r.y });
      }
    });
    const circle = (el, radius) => {
      const c = local.get(el) || { x: cx, y: cy };
      return `circle(${r3(Math.max(radius, 0))}px at ${r3(c.x)}px ${r3(c.y)}px)`;
    };

    if (E.reduced) {
      // Reduced motion: fade, no growing shape.
      if (o.from) tl.tween(o.from, { opacity: (p) => 1 - p }, { ...at, ease: "inOut" });
      for (const el of toEls) tl.tween(el, { opacity: (p) => p }, { ...at, ease: "inOut" });
    } else if (mode === "reveal") {
      // The outgoing scene keeps only what lies outside the circle, so transparent scenes never overlap.
      for (const el of fromEls) {
        tl.tween(el, {
          opacity: (p) => (p < 1 ? 1 : 0),
          style: (p) => {
            if (p <= 0 || p >= 1) return { maskImage: "none", webkitMaskImage: "none" };
            const c = local.get(el), r = r3(Math.max(R * ease(p), 0.01));
            const m = `radial-gradient(circle ${r}px at ${r3(c.x)}px ${r3(c.y)}px, transparent 99.5%, #000 100%)`;
            return { maskImage: m, webkitMaskImage: m };
          },
        }, at);
      }
      for (const el of toEls) {
        tl.tween(el, {
          opacity: (p) => (p > 0 ? 1 : 0),
          style: (p) => ({ clipPath: p > 0 && p < 1 ? circle(el, R * ease(p)) : "none" }),
        }, at);
      }
    } else {
      // Cover: a token-coloured disc pops out of the origin, the scenes swap under it, then it fades.
      const disc = document.createElement("div");
      disc.className = "eidos-fx-iris";
      disc.setAttribute("aria-hidden", "true");
      Object.assign(disc.style, { position: "absolute", inset: "0", pointerEvents: "none", background: color, visibility: "hidden" });
      world.after(disc);
      const SWAP = 0.55;
      tl.tween(disc, {
        style: (p) => {
          if (p <= 0 || p >= 1) return { visibility: "hidden", clipPath: "none", opacity: "0" };
          const grow = ease(clamp01(p / SWAP));
          const fade = p < SWAP ? 1 : 1 - E.ease.inOut((p - SWAP) / (1 - SWAP));
          return { visibility: "visible", clipPath: `circle(${r3(R * grow)}px at ${r3(cx)}px ${r3(cy)}px)`, opacity: String(r3(fade)) };
        },
      }, at);
      if (o.from) tl.tween(o.from, { opacity: (p) => (p < SWAP ? 1 : 0) }, at);
      for (const el of toEls) tl.tween(el, { opacity: (p) => (p >= SWAP ? 1 : 0) }, at);
    }
    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
  E.fx["iris"].kind = "transition";
})();
