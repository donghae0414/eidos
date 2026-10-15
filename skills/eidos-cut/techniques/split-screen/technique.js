(() => {
  const E = window.Eidos;
  E.fx["split-screen"] = (stage, o = {}) => {
    const { tl } = stage;
    const { r3 } = E.util;
    const start = tl.resolveAt(o.at);
    const dur = o.dur ?? 0.8;
    const stepDur = o.stepDur ?? 0.5;
    const dimTo = o.dimTo ?? 0.3;
    const ghost = o.ghost ?? 0;
    const other = (side) => (side === "left" ? o.right : side === "right" ? o.left : null);
    let dimmed = other(o.focus);

    tl.tween(o.left, { opacity: [0, dimmed === o.left ? dimTo : 1], x: [-12, 0] }, { at: start, dur: dur * 0.75, ease: "out" });
    tl.tween(o.right, { opacity: [0, dimmed === o.right ? dimTo : 1], x: [12, 0] }, { at: start, dur: dur * 0.75, ease: "out" });

    const dividers = E.$all(o.divider, stage.world);
    let vertical = true;
    if (dividers.length) {
      stage.onLayout(() => {
        const r = stage.measure(dividers);
        vertical = r.h >= r.w;
      });
    }
    const wipe = { at: start + dur * 0.15, dur: dur * 0.85, ease: "inOut" };
    for (const el of dividers) {
      if (el instanceof SVGGeometryElement) tl.tween(el, { draw: [0, 1] }, wipe);
      else tl.tween(el, { style: (p) => ({ clipPath: vertical ? `inset(0 0 ${r3(100 - 100 * p)}% 0)` : `inset(0 ${r3(100 - 100 * p)}% 0 0)` }) }, wipe);
    }
    tl.prevStart = start;
    tl.extend(start + dur);

    const queue = [...(o.steps ?? [])];
    return {
      start,
      end: start + dur,
      get remaining() {
        return queue.length;
      },
      step(s = {}) {
        const pair = s.pair ?? queue.shift();
        if (!pair) throw new Error("split-screen: no step left");
        const [left, right, caption] = pair;
        const at = tl.resolveAt(s.at);
        const d = s.dur ?? stepDur;
        const props = ghost > 0 ? { opacity: [ghost, 1] } : { opacity: [0, 1], y: [8, 0] };
        tl.tween(left, props, { at, dur: d, ease: "out" });
        tl.tween(right, props, { at, dur: d, ease: "out" });
        tl.prevStart = at;
        if (caption != null) tl.stop(caption);
        return { start: at, end: at + d };
      },
      focus(side, s = {}) {
        const at = tl.resolveAt(s.at);
        const d = s.dur ?? 0.5;
        const next = other(side);
        if (dimmed && dimmed !== next) tl.tween(dimmed, { opacity: [dimTo, 1] }, { at, dur: d });
        if (next && next !== dimmed) tl.tween(next, { opacity: [1, dimTo] }, { at, dur: d });
        dimmed = next;
        tl.prevStart = at;
        tl.extend(at + d);
        return { start: at, end: at + d };
      },
    };
  };
})();
