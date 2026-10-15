(() => {
  const E = window.Eidos;
  E.fx["tracking"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const { lerp } = E.util;
    const nodes = (o.path ?? []).map((sel) => E.$all(sel, stage.world)[0]);
    const obj = E.$all(o.object, stage.world)[0];
    const trail = o.trail ? E.$all(o.trail, stage.world)[0] : null;
    const zoom = o.zoom ?? 1.6;
    const dur = o.dur ?? 1.1;
    const ease = o.ease ?? "inOut";
    const captions = o.captions ?? [];
    const pts = nodes.map(() => ({ x: 0, y: 0 }));
    const cum = [0];
    let total = 1;

    stage.onLayout(() => {
      nodes.forEach((n, i) => {
        const r = stage.measure(n);
        pts[i] = { x: r.x + r.w / 2, y: o.anchor === "top" ? r.y : r.y + r.h / 2 };
      });
      for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      total = cum[cum.length - 1] || 1;
      if (trail) trail.setAttribute("d", "M " + pts.map((p) => `${E.util.r3(p.x)} ${E.util.r3(p.y)}`).join(" L "));
    });

    const half = () => (obj ? obj.offsetWidth / 2 : 0);
    const follow = (i) => () => ({ x: pts[i].x, y: pts[i].y, s: zoom });
    const start = tl.resolveAt(o.at);
    const enter = o.enterDur ?? 1.2;

    camera.to(follow(0), { at: start, dur: enter, ease: "camera" });
    if (obj) tl.tween(obj, { x: () => pts[0].x - half(), y: () => pts[0].y - half(), opacity: [0, 1], scale: [0.4, 1] }, { at: start + enter * 0.6, dur: enter * 0.4, ease: "pop" });
    tl.extend(start + enter);
    if (captions[0] != null) tl.stop(captions[0]);

    for (let i = 0; i < pts.length - 1; i++) {
      const at = tl.end;
      camera.to(follow(i + 1), { at, dur, ease });
      if (obj) tl.tween(obj, { x: (p) => lerp(pts[i].x, pts[i + 1].x, p) - half(), y: (p) => lerp(pts[i].y, pts[i + 1].y, p) - half() }, { at, dur, ease });
      if (trail) tl.tween(trail, { draw: (p) => (cum[i] + p * (cum[i + 1] - cum[i])) / total }, { at, dur, ease });
      tl.tween(nodes[i + 1], { scale: (p) => 1 + 0.06 * Math.sin(p * Math.PI) }, { at: at + dur * 0.8, dur: 0.4, ease: "linear" });
      tl.extend(at + dur + 0.2);
      if (captions[i + 1] != null) tl.stop(captions[i + 1]);
    }
    return { start, end: tl.end };
  };
})();
