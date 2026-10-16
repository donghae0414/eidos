(() => {
  const E = window.Eidos;
  const { r3, lerp, clamp01 } = E.util;
  const fail = (message) => {
    const text = `infinite-zoom: ${message}`;
    window.__eidosErrors.push(text);
    throw new Error(text);
  };
  const number = (value, name) => {
    if (!Number.isFinite(value)) fail(`${name} must be a finite number`);
    return value;
  };
  const select = (target, root) => {
    try { return E.$all(target, root); }
    catch { fail(`invalid element selector ${String(target)}`); }
  };

  E.fx["infinite-zoom"] = (stage, o = {}) => {
    const allowed = { levels: 1, min: 1, portal: 1, at: 1, from: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`unknown option ${String(key)}`);
    const { tl, world } = stage;
    const levels = select(o.levels ?? ".zoom-level", world);
    if (levels.length < 2) fail("levels must identify at least two elements");
    const min = number(o.min ?? 0.05, "min");
    if (min < 0.05 || min > 0.45) fail("min must be between 0.05 and 0.45");
    const sel = o.portal ?? "[data-portal]";
    const portals = levels.slice(0, -1).map((lv, i) => {
      let el;
      try { el = lv.querySelector(sel); }
      catch { fail(`invalid portal selector ${String(sel)}`); }
      if (!el) fail(`level ${i} has no portal matching ${sel}`);
      return el;
    });
    for (const lv of levels) lv.style.transformOrigin = "0 0";
    const fit = portals.map(() => ({ x: 0.4, y: 0.4, s: 0.2 }));

    // Level i + 1 is level i's frame scaled by s into its portal (fitted, centred). Fractions of the frame.
    stage.onLayout(() => {
      portals.forEach((el, i) => {
        const f = stage.measure(levels[i]), r = stage.measure(el);
        const pw = r.w / f.w, ph = r.h / f.h, s = Math.min(pw, ph);
        if (!Number.isFinite(s) || s < 2 * min || s > 0.9) fail(`portal of level ${i} scales by ${r3(s)} (needs ${2 * min} to 0.9)`);
        fit[i] = { x: (r.x - f.x) / f.w + (pw - s) / 2, y: (r.y - f.y) / f.h + (ph - s) / 2, s };
      });
    });

    // Rebased depth: level n = floor(z) zooms by s^-f about the fixed point of its portal map, and every
    // deeper level is chained from n, never from level 0. Levels below `min` are hidden, so no written
    // scale is smaller than `min` however deep z goes.
    const render = (z) => {
      const last = levels.length - 1;
      const n = Math.min(Math.floor(z), last), f = z - n;
      let scale = 1, x = 0, y = 0;
      if (n < last) {
        const { x: px, y: py, s } = fit[n];
        scale = Math.pow(s, -f);
        x = (px / (1 - s)) * (1 - scale);
        y = (py / (1 - s)) * (1 - scale);
      }
      levels.forEach((lv, i) => {
        if (i > n) {
          x += scale * fit[i - 1].x;
          y += scale * fit[i - 1].y;
          scale *= fit[i - 1].s;
        }
        if (i < n || scale < min) {
          lv.style.transform = "none";
          lv.style.opacity = "0";
          lv.style.visibility = "hidden";
          return;
        }
        lv.style.transform = `translate(${r3(x * 100)}%, ${r3(y * 100)}%) scale(${r3(scale)})`;
        lv.style.opacity = String(r3(clamp01((scale - min) / min)));
        lv.style.visibility = "visible";
      });
    };

    const start = tl.resolveAt(o.at);
    if (!Number.isFinite(start) || start < 0) fail("at must be finite and nonnegative");
    const clampZ = (z) => Math.min(Math.max(number(z, "depth"), 0), levels.length - 1);
    const first = clampZ(o.from ?? 0);
    let cur = first;
    tl.add(() => render(first), { at: start, dur: 0 });

    return {
      start,
      end: start,
      to(depth, t = {}) {
        const a = cur, b = clampZ(depth);
        const at = tl.resolveAt(t.at);
        const dur = number(t.dur ?? 1.2 + 0.6 * Math.abs(b - a), "dur");
        if (!Number.isFinite(at) || at < 0 || dur < 0) fail("at and dur must be finite and nonnegative");
        tl.add((p) => {
          // Keep the parked source stop; a zero-duration destination owns only t > at.
          if (dur === 0 && tl.t <= at) p = 0;
          render(E.reduced ? (p < 0.5 ? a : b) : lerp(a, b, p));
        }, { at, dur, ease: t.ease ?? "inOut" });
        cur = b;
        return { start: at, end: at + dur };
      },
    };
  };
  E.fx["infinite-zoom"].kind = "technique";
})();
