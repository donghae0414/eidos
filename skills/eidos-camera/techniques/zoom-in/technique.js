(() => {
  const E = window.Eidos;
  E.fx["zoom-in"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const dur = o.dur ?? 1.4;
    const dimTo = o.dimTo ?? 0.25;
    const start = tl.resolveAt(o.at);
    const strength = o.depth ?? 0.6;
    const layers = o.mode === "dolly" ? E.$all(o.layers ?? "[data-depth]", stage.world) : [];
    const offsets = new Map();

    if (layers.length) {
      stage.onLayout(() => {
        const t = stage.measure(o.target);
        const tc = { x: t.x + t.w / 2, y: t.y + t.h / 2 };
        for (const el of layers) {
          const r = stage.measure(el);
          offsets.set(el, { dx: r.x + r.w / 2 - tc.x, dy: r.y + r.h / 2 - tc.y });
        }
      });
    }

    const depthOf = (el) => parseFloat(el.dataset.depth || "0");
    const passTo = (el) => (depthOf(el) >= (o.passDepth ?? 0.5) ? 0 : 1);
    const parallax = (el, from, to) => {
      const m = (p) => 1 + depthOf(el) * strength * (from + (to - from) * p);
      return {
        scale: m,
        x: (p) => (offsets.get(el)?.dx ?? 0) * (m(p) - 1),
        y: (p) => (offsets.get(el)?.dy ?? 0) * (m(p) - 1),
      };
    };

    camera.to(o.target, { at: start, dur, pad: o.pad, zoom: o.zoom, roll: o.roll, ease: o.ease ?? "camera" });
    if (o.dim) tl.tween(o.dim, { opacity: [1, dimTo] }, { at: start, dur: dur * 0.6 });
    if (o.reveal) tl.tween(o.reveal, { opacity: [0, 1], y: [6, 0] }, { at: start + dur * 0.55, dur: dur * 0.45, ease: "out" });
    for (const el of layers) {
      tl.tween(el, parallax(el, 0, 1), { at: start, dur, ease: "camera" });
      if (passTo(el) === 0) tl.tween(el, { opacity: [1, 0] }, { at: start + dur * 0.25, dur: dur * 0.5, ease: "in" });
    }
    tl.extend(start + dur);

    return {
      start,
      end: start + dur,
      back(b = {}) {
        const s2 = tl.resolveAt(b.at);
        const d2 = b.dur ?? dur * 0.85;
        camera.to(b.target ?? "world", { at: s2, dur: d2, pad: b.pad, ease: "camera" });
        if (o.reveal) tl.tween(o.reveal, { opacity: [1, 0], y: [0, 6] }, { at: s2, dur: d2 * 0.35, ease: "in" });
        if (o.dim) tl.tween(o.dim, { opacity: [dimTo, 1] }, { at: s2 + d2 * 0.3, dur: d2 * 0.6 });
        for (const el of layers) {
          tl.tween(el, parallax(el, 1, 0), { at: s2, dur: d2, ease: "camera" });
          if (passTo(el) === 0) tl.tween(el, { opacity: [0, 1] }, { at: s2 + d2 * 0.3, dur: d2 * 0.5, ease: "out" });
        }
        tl.extend(s2 + d2);
        return { start: s2, end: s2 + d2 };
      },
    };
  };
})();
