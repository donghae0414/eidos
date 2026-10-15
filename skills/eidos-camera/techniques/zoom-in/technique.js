(() => {
  const E = window.Eidos;
  E.fx["zoom-in"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const dur = o.dur ?? 1.4;
    const dimTo = o.dimTo ?? 0.25;
    const start = tl.resolveAt(o.at);
    const layers = o.mode === "dolly" ? E.$all(o.layers ?? "[data-depth]", stage.world) : [];
    const depthScale = (el) => 1 + parseFloat(el.dataset.depth || "1") * (o.depth ?? 0.18);

    camera.to(o.target, { at: start, dur, pad: o.pad, zoom: o.zoom, roll: o.roll, ease: o.ease ?? "camera" });
    if (o.dim) tl.tween(o.dim, { opacity: [1, dimTo] }, { at: start, dur: dur * 0.6 });
    if (o.reveal) tl.tween(o.reveal, { opacity: [0, 1], y: [6, 0] }, { at: start + dur * 0.55, dur: dur * 0.45, ease: "out" });
    for (const el of layers) tl.tween(el, { scale: [1, depthScale(el)] }, { at: start, dur, ease: "camera" });
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
        for (const el of layers) tl.tween(el, { scale: [depthScale(el), 1] }, { at: s2, dur: d2, ease: "camera" });
        tl.extend(s2 + d2);
        return { start: s2, end: s2 + d2 };
      },
    };
  };
})();
