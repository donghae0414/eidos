(() => {
  const E = window.Eidos;
  E.fx["pan"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const items = E.$all(o.items, stage.world);
    const axis = o.axis === "y" ? "y" : "x";
    const zoom = o.zoom ?? 1;
    const dur = o.dur ?? 1.2;
    const line = o.line ?? items[0]?.parentElement;
    const captions = o.captions ?? [];
    const start = tl.resolveAt(o.at);
    const at0 = (i) => (i === 0 ? start : tl.end);

    const frame = (el) => () => {
      const r = stage.measure(el);
      const l = stage.measure(line);
      return axis === "x"
        ? { x: r.x + r.w / 2, y: l.y + l.h / 2, s: zoom }
        : { x: l.x + l.w / 2, y: r.y + r.h / 2, s: zoom };
    };

    items.forEach((el, i) => {
      const at = at0(i);
      const d = i === 0 ? (o.enterDur ?? dur) : dur;
      camera.to(frame(el), { at, dur: d, ease: o.ease ?? "camera" });
      if (o.active) {
        const dimTo = o.dimTo ?? 0.45;
        if (i === 0) tl.tween(items.slice(1), { opacity: [1, dimTo] }, { at, dur: d * 0.5 });
        else {
          tl.tween(el, { opacity: [dimTo, 1] }, { at: at + d * 0.5, dur: d * 0.5 });
          tl.tween(items[i - 1], { opacity: [1, dimTo] }, { at, dur: d * 0.5 });
        }
      }
      tl.extend(at + d);
      if (captions[i] != null) tl.stop(captions[i]);
    });

    return { start, end: tl.end };
  };
})();
