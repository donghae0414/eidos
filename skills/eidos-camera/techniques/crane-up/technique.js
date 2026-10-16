(() => {
  const E = window.Eidos;
  E.fx["crane-up"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const { clamp01, r3 } = E.util;
    const rig = E.$all(o.rig ?? stage.world.firstElementChild, stage.world)[0];
    const context = E.$all(o.context, stage.world);
    const tilt = stage.reduced ? 0 : o.tilt ?? 12;
    const introDur = o.introDur ?? 0.6;
    const start = tl.resolveAt(o.at);
    const heightRank = new Map();

    stage.onLayout(() => {
      if (tilt) {
        const f = stage.measure(o.from), r = stage.measure(rig);
        rig.style.transformOrigin = `${r3(f.x + f.w / 2 - r.x)}px ${r3(f.y + f.h / 2 - r.y)}px`;
      }
      const bottoms = context.map((el) => { const m = stage.measure(el); return m.y + m.h; });
      const lowestFirst = context.map((_, i) => i).sort((a, b) => bottoms[b] - bottoms[a] || a - b);
      lowestFirst.forEach((i, k) => heightRank.set(context[i], lowestFirst.length > 1 ? k / (lowestFirst.length - 1) : 0));
    });

    camera.to(o.from, { at: start, dur: 0, zoom: o.openZoom, pad: o.pad });
    if (tilt) tl.tween(rig, { rotateX: [tilt, tilt] }, { at: start, dur: 0 });
    if (context.length) tl.tween(context, { opacity: [0, 0] }, { at: start, dur: 0 });
    tl.tween(o.from, { opacity: [0, 1], y: [10, 0] }, { at: start, dur: introDur, ease: "out" });
    tl.extend(start + introDur);

    return {
      start,
      end: start + introDur,
      rise(b = {}) {
        const at = tl.resolveAt(b.at);
        const dur = b.dur ?? 2.2;
        camera.to(b.to ?? "world", { at, dur, pad: b.pad, zoom: b.zoom, ease: b.ease ?? "camera" });
        if (tilt) tl.tween(rig, { rotateX: [tilt, 0] }, { at, dur: dur * 0.85, ease: "inOut" });
        for (const el of context) {
          tl.tween(el, { opacity: (p) => clamp01((p - 0.1 - 0.55 * (heightRank.get(el) ?? 0)) / 0.3) }, { at, dur, ease: "linear" });
        }
        tl.extend(at + dur);
        return { start: at, end: at + dur };
      },
    };
  };
})();
