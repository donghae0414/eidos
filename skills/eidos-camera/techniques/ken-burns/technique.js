(() => {
  const E = window.Eidos;
  E.fx["ken-burns"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const fail = (message) => {
      const error = `ken-burns: ${message}`;
      window.__eidosErrors.push(error);
      throw new TypeError(error);
    };
    const nodes = (v) => {
      try { return (typeof v === "string" || v instanceof Element || v instanceof NodeList || v instanceof HTMLCollection) && E.$all(v, stage.world).length > 0 && E.$all(v, stage.world).every((el) => el instanceof Element); }
      catch { return false; }
    };
    const finite = Number.isFinite, nonnegative = (v) => finite(v) && v >= 0;
    const framing = (v) => {
      if (Array.isArray(v)) return v.length === 4 && Array.from(v).every(finite) && v[2] > 0 && v[3] > 0;
      if (v && typeof v === "object" && !(v instanceof Element) && !(v instanceof NodeList) && !(v instanceof HTMLCollection)) {
        return Reflect.ownKeys(v).every((k) => ["x", "y", "w", "h"].includes(k)) && ["x", "y", "w", "h"].every((k) => Object.hasOwn(v, k) && finite(v[k])) && v.w > 0 && v.h > 0;
      }
      return v === "world" || nodes(v);
    };
    const atTime = (v) => (nonnegative(v) || (typeof v === "string" && /^(?:<(?:[+-]?(?:\d+(?:\.\d*)?|\.\d+)|\+=(?:\d+(?:\.\d*)?|\.\d+))?|[+-]=(?:\d+(?:\.\d*)?|\.\d+)|(?:\d+(?:\.\d*)?|\.\d+))$/.test(v))) && nonnegative(tl.resolveAt(v));
    const easing = (v) => typeof v === "function" || (typeof v === "string" && Object.hasOwn(E.ease, v));
    const rules = { to: framing, from: framing, in: nodes, dur: nonnegative, ease: easing, pad: nonnegative, at: atTime };
    const validate = (options, allowed) => {
      if (!options || typeof options !== "object" || Array.isArray(options) || ![Object.prototype, null].includes(Object.getPrototypeOf(options))) fail("options must be a plain object");
      for (const key of Reflect.ownKeys(options)) {
        if (!Object.hasOwn(allowed, key)) fail(`unknown option ${String(key)}`);
        if (options[key] !== undefined && !allowed[key](options[key])) fail(`invalid ${String(key)} (${typeof options[key]})`);
      }
    };
    validate(o, rules);
    const glide = E.bezier(0.37, 0, 0.63, 1);
    const frame = (rect) => {
      if (!Array.isArray(rect)) return rect;
      const [fx, fy, fw, fh] = rect;
      return () => {
        const box = stage.measure(o.in ?? stage.world.firstElementChild);
        return { x: box.x + fx * box.w, y: box.y + fy * box.h, w: fw * box.w, h: fh * box.h };
      };
    };
    const padFor = (rect, pad) => pad ?? (Array.isArray(rect) ? 0 : undefined);
    const move = (to, m) => {
      if (!framing(to)) fail("to must be a selector, element or finite [x, y, w, h] / {x, y, w, h} framing with positive width and height");
      const at = tl.resolveAt(m.at);
      const dur = m.dur ?? o.dur ?? 4.5;
      if (m.from != null) camera.to(frame(m.from), { at, dur: 0, pad: padFor(m.from, m.pad) });
      camera.to(frame(to), { at, dur, pad: padFor(to, m.pad), ease: m.ease ?? o.ease ?? glide });
      tl.extend(at + dur);
      return { start: at, end: at + dur };
    };
    return { ...move(o.to, o), drift: (to, m = {}) => {
      validate(m, { from: framing, dur: nonnegative, ease: easing, pad: nonnegative, at: atTime });
      return move(to, m);
    } };
  };
})();
