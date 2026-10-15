(() => {
  const E = window.Eidos;
  E.fx["cross-dissolve"] = (stage, o = {}) => {
    const { tl } = stage;
    const dur = o.dur ?? 0.8;
    const start = tl.resolveAt(o.at);
    const ease = o.ease ?? "inOut";
    const blur = o.blur === true ? 8 : Number(o.blur) || 0;
    const out = { opacity: [1, 0] };
    const inn = { opacity: [0, 1] };
    if (blur > 0) {
      out.blur = [0, blur];
      inn.blur = [blur, 0];
    }
    if (o.from) tl.tween(o.from, out, { at: start, dur, ease });
    if (o.to) tl.tween(o.to, inn, { at: start, dur, ease });
    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
})();
