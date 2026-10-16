(() => {
  const E = window.Eidos;
  E.fx["time-lapse"] = (stage, o = {}) => {
    const { tl } = stage;
    const frames = Array.isArray(o.frames) ? o.frames : [];
    const sorted = frames.length > 0 && frames.every((f, i) => Number.isFinite(f?.at) && (i === 0 || f.at >= frames[i - 1].at));
    let cursor = o.from ?? frames[0]?.at;
    if (!sorted || typeof o.render !== "function" || !Number.isFinite(cursor)) {
      window.__eidosErrors.push("time-lapse needs frames sorted by a finite at, a render(frame, u) function and a finite from");
      const at = tl.resolveAt(o.at);
      return { start: at, end: at, to: () => ({ start: at, end: at }) };
    }
    const counter = o.counter ? E.$all(o.counter, stage.world)[0] : null;
    const format = o.format ?? ((u) => String(Math.round(u)));
    const pick = (u) => {
      let lo = 0, hi = frames.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (frames[mid].at <= u) lo = mid;
        else hi = mid - 1;
      }
      return frames[lo];
    };
    const segment = (to, s) => {
      const at = tl.resolveAt(s.at);
      if (!Number.isFinite(to)) {
        window.__eidosErrors.push(`time-lapse target time must be a finite number, got ${String(to)}`);
        return { start: at, end: at };
      }
      const from = cursor, dur = s.dur ?? o.dur ?? 4;
      tl.add((p) => {
        const u = from + (to - from) * p;
        o.render(pick(u), u);
        if (counter) counter.textContent = format(u);
      }, { at, dur, ease: s.ease ?? o.ease ?? "linear" });
      cursor = to;
      return { start: at, end: at + dur };
    };
    return { ...segment(o.to ?? frames[frames.length - 1].at, o), to: (u, s = {}) => segment(u, s) };
  };
})();
