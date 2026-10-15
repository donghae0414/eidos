(() => {
  const E = window.Eidos;
  E.fx["stagger-reveal"] = (stage, o = {}) => {
    const { tl } = stage;
    const items = E.$all(o.targets ?? o.target, stage.world);
    const extra = E.$all(o.dim, stage.world);
    const each = o.each ?? 0.1;
    const dur = o.dur ?? 0.5;
    const dist = o.dist ?? 14;
    const dimTo = o.dimTo ?? 0.45;
    const dimDur = o.dimDur ?? dur * 0.6;
    const ease = o.ease ?? "out";
    const per = Math.max(1, o.per ?? 1);
    const offset = { up: { y: dist }, down: { y: -dist }, left: { x: dist }, right: { x: -dist }, none: {} }[o.dir ?? "up"] || {};
    const labels = Array.isArray(o.stops) ? o.stops : [];
    const groups = o.stops ? Array.from({ length: Math.ceil(items.length / per) }, (_, g) => items.slice(g * per, g * per + per)) : [items];
    const level = (el) => el.__eidosLevel ?? 1;
    const dim = (el, at) => {
      if (level(el) <= dimTo + 1e-9) return;
      tl.tween(el, { opacity: [level(el), dimTo] }, { at, dur: dimDur });
      el.__eidosLevel = dimTo;
    };
    const start = tl.resolveAt(o.at);
    const times = [];
    let prev = null;
    groups.forEach((group, g) => {
      const base = g === 0 ? start : tl.end;
      group.forEach((el, i) => {
        const at = base + i * each;
        const props = { opacity: [0, 1] };
        if (offset.x != null) props.x = [offset.x, 0];
        if (offset.y != null) props.y = [offset.y, 0];
        tl.tween(el, props, { at, dur, ease });
        el.__eidosLevel = 1;
        if (!times.length) for (const d of extra) dim(d, at);
        if (o.disclose && prev) dim(prev.el, Math.max(at, prev.at + dur));
        times.push({ el, start: at, end: at + dur });
        prev = { el, at };
      });
      if (o.stops) tl.stop(labels[g] ?? "");
    });
    const end = times.length ? Math.max(...times.map((t) => t.end)) : start;
    return {
      start,
      end,
      items: times,
      restore(r = {}) {
        const at = tl.resolveAt(r.at);
        const d = r.dur ?? dimDur;
        for (const el of [...items, ...extra]) {
          if (level(el) >= 1) continue;
          tl.tween(el, { opacity: [level(el), 1] }, { at, dur: d });
          el.__eidosLevel = 1;
        }
        tl.extend(at + d);
        return { start: at, end: at + d };
      },
    };
  };
})();
