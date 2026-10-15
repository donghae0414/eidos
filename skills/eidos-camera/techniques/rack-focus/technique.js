(() => {
  const E = window.Eidos;
  E.fx["rack-focus"] = (stage, o = {}) => {
    const { tl } = stage;
    const subjects = (o.subjects ?? []).map((s) => E.$all(s, stage.world));
    const blur = o.blur ?? 4;
    const dimTo = o.dimTo ?? 0.4;
    const shrink = o.scale ?? 0.98;
    const dur = o.dur ?? 0.7;
    const sharp = { blur: 0, opacity: 1, scale: 1 };
    const soft = { blur, opacity: dimTo, scale: shrink };
    const indexOf = (target) => (target == null ? -1 : typeof target === "number" ? target : subjects.findIndex((els) => els.includes(E.$all(target, stage.world)[0])));
    let focused = null;

    const stateOf = (i, f) => (f === null || f === i ? sharp : soft);
    const shift = (next, at, d) => {
      subjects.forEach((els, i) => {
        const a = stateOf(i, focused), b = stateOf(i, next);
        if (a === b) return;
        tl.tween(els, { blur: [a.blur, b.blur], opacity: [a.opacity, b.opacity], scale: [a.scale, b.scale] }, { at, dur: d, ease: o.ease ?? "inOut" });
      });
      focused = next;
      tl.extend(at + d);
      return { start: at, end: at + d };
    };

    const start = tl.resolveAt(o.at);
    const first = o.focus != null ? shift(indexOf(o.focus), start, dur) : { start, end: start };

    return {
      start: first.start,
      end: first.end,
      to(target, t = {}) {
        return shift(indexOf(target), tl.resolveAt(t.at), t.dur ?? dur);
      },
      all(t = {}) {
        return shift(null, tl.resolveAt(t.at), t.dur ?? dur);
      },
    };
  };
})();
