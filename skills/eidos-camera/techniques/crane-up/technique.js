(() => {
  const E = window.Eidos;
  E.fx["crane-up"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const { clamp01, r3 } = E.util;
    const fail = (message) => {
      const error = `crane-up: ${message}`;
      window.__eidosErrors.push(error);
      throw new TypeError(error);
    };
    const nodes = (v) => {
      try { return (typeof v === "string" || v instanceof Element || Array.isArray(v) || v instanceof NodeList || v instanceof HTMLCollection) && E.$all(v, stage.world).length > 0 && E.$all(v, stage.world).every((el) => el instanceof Element); }
      catch { return false; }
    };
    const finite = Number.isFinite, nonnegative = (v) => finite(v) && v >= 0;
    const atTime = (v) => (nonnegative(v) || (typeof v === "string" && /^(?:<(?:[+-]?(?:\d+(?:\.\d*)?|\.\d+)|\+=(?:\d+(?:\.\d*)?|\.\d+))?|[+-]=(?:\d+(?:\.\d*)?|\.\d+)|(?:\d+(?:\.\d*)?|\.\d+))$/.test(v))) && nonnegative(tl.resolveAt(v));
    const easing = (v) => typeof v === "function" || (typeof v === "string" && Object.hasOwn(E.ease, v));
    const validate = (options, rules) => {
      if (!options || typeof options !== "object" || Array.isArray(options) || ![Object.prototype, null].includes(Object.getPrototypeOf(options))) fail("options must be a plain object");
      for (const key of Reflect.ownKeys(options)) {
        if (!Object.hasOwn(rules, key)) fail(`unknown option ${String(key)}`);
        if (options[key] !== undefined && !rules[key](options[key])) fail(`invalid ${String(key)} (${typeof options[key]})`);
      }
    };
    validate(o, { from: nodes, context: nodes, rig: nodes, tilt: finite, introDur: nonnegative, openZoom: (v) => finite(v) && v > 0, pad: nonnegative, at: atTime });
    if (!nodes(o.from)) fail("from must select a detail element");
    const rig = E.$all(o.rig ?? stage.world.firstElementChild, stage.world)[0];
    if (!rig) fail("rig must select an element");
    const context = E.$all(o.context, stage.world);
    const tilt = stage.reduced ? 0 : o.tilt ?? 12;
    const introDur = o.introDur ?? 0.6;
    const start = tl.resolveAt(o.at);
    const heightRank = new Map();
    let risen = false;

    stage.onLayout(() => {
      if (tilt) {
        const f = stage.measure(o.from), r = stage.measure(rig);
        rig.style.transformOrigin = `${r3(f.x + f.w / 2 - r.x)}px ${r3(f.y + f.h / 2 - r.y)}px`;
      }
      const bottoms = context.map((el) => { const m = stage.measure(el); return m.y + m.h; });
      const lowestFirst = context.map((_, i) => i).sort((a, b) => bottoms[b] - bottoms[a] || a - b);
      lowestFirst.forEach((i, k) => heightRank.set(context[i], lowestFirst.length > 1 ? k / (lowestFirst.length - 1) : 0));
    });

    camera.to(o.from, { at: start, dur: 0, zoom: o.openZoom, pad: o.pad });
    if (tilt) tl.tween(rig, { rotateX: [tilt, tilt] }, { at: start, dur: 0 });
    if (context.length) tl.tween(context, { opacity: [0, 0] }, { at: start, dur: 0 });
    tl.tween(o.from, { opacity: [0, 1], y: [10, 0] }, { at: start, dur: introDur, ease: "out" });
    tl.extend(start + introDur);

    return {
      start,
      end: start + introDur,
      rise(b = {}) {
        validate(b, { to: (v) => v === "world" || nodes(v), dur: nonnegative, ease: easing, pad: nonnegative, zoom: (v) => finite(v) && v > 0, at: atTime });
        const at = tl.resolveAt(b.at);
        const dur = b.dur ?? 2.2;
        // Capture this rise's starting state; later calls must not change its tracks.
        const fromTilt = risen ? 0 : tilt, fromOpacity = risen ? 1 : 0;
        risen = true;
        camera.to(b.to ?? "world", { at, dur, pad: b.pad, zoom: b.zoom, ease: b.ease ?? "camera" });
        if (tilt) tl.tween(rig, { rotateX: [fromTilt, 0] }, { at, dur: dur * 0.85, ease: "inOut" });
        for (const el of context) {
          tl.tween(el, { opacity: (p) => fromOpacity + (1 - fromOpacity) * clamp01((p - 0.1 - 0.55 * (heightRank.get(el) ?? 0)) / 0.3) }, { at, dur, ease: "linear" });
        }
        tl.extend(at + dur);
        return { start: at, end: at + dur };
      },
    };
  };
})();
