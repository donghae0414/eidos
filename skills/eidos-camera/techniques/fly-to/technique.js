(() => {
  const E = window.Eidos;
  E.fx["fly-to"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const { r3 } = E.util;
    const start = tl.resolveAt(o.at);
    const dur = o.dur ?? 2.4;
    const route = o.route ? E.$all(o.route, stage.world)[0] : null;
    const box = (t) => (t && typeof t === "object" && "w" in t ? t : stage.measure(t));
    if (route && o.from != null) {
      const bend = o.bend ?? 0.2;
      stage.onLayout(() => {
        const a = box(o.from), b = box(o.target), svg = stage.measure(route.ownerSVGElement ?? route);
        const ax = a.x + a.w / 2 - svg.x, ay = a.y + a.h / 2 - svg.y, bx = b.x + b.w / 2 - svg.x, by = b.y + b.h / 2 - svg.y;
        const cx = (ax + bx) / 2 + bend * (by - ay), cy = (ay + by) / 2 - bend * (bx - ax);
        route.setAttribute("d", `M ${r3(ax)} ${r3(ay)} Q ${r3(cx)} ${r3(cy)} ${r3(bx)} ${r3(by)}`);
      });
    }
    camera.to(o.target, { at: start, dur, arc: o.arc ?? 0.6, pad: o.pad, zoom: o.zoom, ease: o.ease ?? "camera" });
    if (route) tl.tween(route, { draw: [0, 1] }, { at: start + dur * 0.15, dur: dur * 0.7, ease: "inOut" });
    if (o.reveal) tl.tween(o.reveal, { opacity: [0, 1], y: [6, 0] }, { at: start + dur * 0.8, dur: dur * 0.2, ease: "out" });
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
})();
