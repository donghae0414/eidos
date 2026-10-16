(() => {
  const E = window.Eidos;
  E.fx["time-lapse"] = (stage, o = {}) => {
    const { tl } = stage;
    const fail = (message) => {
      const error = `time-lapse: ${message}`;
      window.__eidosErrors.push(error);
      throw new TypeError(error);
    };
    const finite = Number.isFinite, nonnegative = (v) => finite(v) && v >= 0;
    const atTime = (v) => (nonnegative(v) || (typeof v === "string" && /^(?:<(?:[+-]?(?:\d+(?:\.\d*)?|\.\d+)|\+=(?:\d+(?:\.\d*)?|\.\d+))?|[+-]=(?:\d+(?:\.\d*)?|\.\d+)|(?:\d+(?:\.\d*)?|\.\d+))$/.test(v))) && nonnegative(tl.resolveAt(v));
    const easing = (v) => typeof v === "function" || (typeof v === "string" && Object.hasOwn(E.ease, v));
    const nodes = (v) => {
      try { return (typeof v === "string" || v instanceof Element || Array.isArray(v) || v instanceof NodeList || v instanceof HTMLCollection) && E.$all(v, stage.world).length > 0 && E.$all(v, stage.world).every((el) => el instanceof Element); }
      catch { return false; }
    };
    const validate = (options, rules) => {
      if (!options || typeof options !== "object" || Array.isArray(options) || ![Object.prototype, null].includes(Object.getPrototypeOf(options))) fail("options must be a plain object");
      for (const key of Reflect.ownKeys(options)) {
        if (!Object.hasOwn(rules, key)) fail(`unknown option ${String(key)}`);
        if (options[key] !== undefined && !rules[key](options[key])) fail(`invalid ${String(key)} (${typeof options[key]})`);
      }
    };
    validate(o, { frames: Array.isArray, render: (v) => typeof v === "function", counter: nodes, format: (v) => typeof v === "function", from: finite, to: finite, dur: nonnegative, ease: easing, at: atTime });
    const frames = Array.isArray(o.frames) ? o.frames : [];
    const sorted = frames.length > 0 && Array.from(frames).every((f, i) => f && typeof f === "object" && !Array.isArray(f) && Object.hasOwn(f, "at") && finite(f.at) && (i === 0 || f.at >= frames[i - 1].at));
    let cursor = o.from ?? frames[0]?.at;
    if (!sorted || typeof o.render !== "function" || !Number.isFinite(cursor)) {
      fail("needs frames sorted by a finite numeric at, a render(frame, u) function and a finite numeric from");
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
        fail(`target time must be a finite number, got ${typeof to}`);
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
    return { ...segment(o.to ?? frames[frames.length - 1].at, o), to: (u, s = {}) => {
      validate(s, { dur: nonnegative, ease: easing, at: atTime });
      return segment(u, s);
    } };
  };
})();
