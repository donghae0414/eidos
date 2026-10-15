(() => {
  const E = window.Eidos;
  E.fx["establishing-shot"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const start = tl.resolveAt(o.at);
    camera.to(o.from, { at: start, dur: 0, zoom: o.openZoom, pad: o.pad });
    if (o.context) tl.tween(o.context, { opacity: [0, 0] }, { at: start, dur: 0 });
    tl.tween(o.from, { opacity: [0, 1], scale: [0.96, 1] }, { at: start, dur: o.introDur ?? 0.6, ease: "out" });
    tl.extend(start + (o.introDur ?? 0.6));

    return {
      start,
      end: tl.end,
      pullBack(b = {}) {
        const at = tl.resolveAt(b.at);
        const dur = b.dur ?? 1.8;
        camera.to(b.target ?? "world", { at, dur, pad: b.pad, ease: b.ease ?? "camera" });
        if (o.context) tl.tween(o.context, { opacity: [0, 1] }, { at: at + dur * 0.1, dur: dur * 0.6 });
        if (b.labels) tl.stagger(b.labels, { opacity: [0, 1], y: [6, 0] }, { at: at + dur * 0.55, dur: 0.4, each: b.each ?? 0.12, ease: "out" });
        tl.extend(at + dur);
        return { start: at, end: tl.end };
      },
      focus(target, f = {}) {
        const at = tl.resolveAt(f.at);
        const d = f.dur ?? 1.3;
        camera.to(target, { at, dur: d, pad: f.pad, zoom: f.zoom, ease: "camera" });
        if (f.dim) tl.tween(f.dim, { opacity: [1, f.dimTo ?? 0.3] }, { at, dur: d * 0.6 });
        if (f.reveal) tl.tween(f.reveal, { opacity: [0, 1], y: [6, 0] }, { at: at + d * 0.55, dur: d * 0.45, ease: "out" });
        tl.extend(at + d);
        return { start: at, end: at + d };
      },
    };
  };
})();
