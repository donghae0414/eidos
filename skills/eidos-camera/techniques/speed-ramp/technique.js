(() => {
  const E = window.Eidos;
  E.fx["speed-ramp"] = (stage, o = {}) => {
    const { tl } = stage;
    const fail = (message) => {
      const error = `speed-ramp: ${message}`;
      window.__eidosErrors.push(error);
      throw new TypeError(error);
    };
    const nonnegative = (v) => Number.isFinite(v) && v >= 0;
    const atTime = (v) => (nonnegative(v) || (typeof v === "string" && /^(?:<(?:[+-]?(?:\d+(?:\.\d*)?|\.\d+)|\+=(?:\d+(?:\.\d*)?|\.\d+))?|[+-]=(?:\d+(?:\.\d*)?|\.\d+)|(?:\d+(?:\.\d*)?|\.\d+))$/.test(v))) && nonnegative(tl.resolveAt(v));
    const rules = { at: atTime, dur: nonnegative, focus: (v) => Array.isArray(v) && v.length === 2 && Array.from(v).every(Number.isFinite), rate: (v) => Number.isFinite(v) && v > 0 && v < 1 };
    if (!o || typeof o !== "object" || Array.isArray(o) || ![Object.prototype, null].includes(Object.getPrototypeOf(o))) fail("options must be a plain object");
    for (const key of Reflect.ownKeys(o)) {
      if (!Object.hasOwn(rules, key)) fail(`unknown option ${String(key)}`);
      if (o[key] !== undefined && !rules[key](o[key])) fail(`invalid ${String(key)} (${typeof o[key]})`);
    }
    const w0 = o.at != null ? tl.resolveAt(o.at) : tl.stops[tl.stops.length - 1].t;
    const W = o.dur ?? tl.end - w0;
    const [f0, f1] = Array.isArray(o.focus) ? o.focus : [];
    const rate = o.rate ?? 0.5;
    const F = f1 - f0, slow = F / rate, restShown = W - slow;
    const clash = tl.ramps.some((r) => r.at < w0 + W && w0 < r.at + r.dur) || tl.stops.some((s) => s.t > w0 + 1e-9 && s.t < w0 + W - 1e-9);
    if (![w0, W, f0, f1, rate].every(Number.isFinite) || !(F > 0 && f0 >= w0 && f1 <= w0 + W) || !(rate > 0 && rate < 1) || !(restShown > 0) || clash) {
      fail(`needs focus [a, b] inside [at, at + dur], 0 < rate < 1, focus / rate shorter than dur, and no stop or ramp inside the window (got focus ${JSON.stringify(o.focus)}, rate ${String(o.rate)}, at ${w0}, dur ${W})`);
    }
    const fast = (W - F) / restShown;
    const pre = (f0 - w0) / fast, post = restShown - pre;
    if (pre > 0) tl.ramp({ at: w0, dur: pre, rate: fast });
    tl.ramp({ at: w0 + pre, dur: slow, rate });
    if (post > 0) tl.ramp({ at: w0 + pre + slow, dur: post, rate: fast });
    tl.extend(w0 + W);
    return { start: w0, end: w0 + W, slowFrom: w0 + pre, slowTo: w0 + pre + slow, rate, fast };
  };
})();
