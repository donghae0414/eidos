(() => {
  const E = window.Eidos;
  E.fx["fly-to"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const { r3 } = E.util;
    const fail = (message) => {
      const error = `fly-to: ${message}`;
      window.__eidosErrors.push(error);
      throw new TypeError(error);
    };
    const nodes = (v) => {
      try { return (typeof v === "string" || v instanceof Element || Array.isArray(v) || v instanceof NodeList || v instanceof HTMLCollection) && E.$all(v, stage.world).length > 0 && E.$all(v, stage.world).every((el) => el instanceof Element); }
      catch { return false; }
    };
    const finite = Number.isFinite, nonnegative = (v) => finite(v) && v >= 0;
    const target = (v) => {
      if (v && typeof v === "object" && !(v instanceof Element) && !Array.isArray(v) && !(v instanceof NodeList) && !(v instanceof HTMLCollection)) {
        return Reflect.ownKeys(v).every((k) => ["x", "y", "w", "h"].includes(k)) && ["x", "y", "w", "h"].every((k) => Object.hasOwn(v, k) && finite(v[k])) && v.w > 0 && v.h > 0;
      }
      return v === "world" || nodes(v);
    };
    const atTime = (v) => (nonnegative(v) || (typeof v === "string" && /^(?:<(?:[+-]?(?:\d+(?:\.\d*)?|\.\d+)|\+=(?:\d+(?:\.\d*)?|\.\d+))?|[+-]=(?:\d+(?:\.\d*)?|\.\d+)|(?:\d+(?:\.\d*)?|\.\d+))$/.test(v))) && nonnegative(tl.resolveAt(v));
    const rules = {
      target, from: target, route: (v) => nodes(v) && E.$all(v, stage.world).every((el) => el instanceof SVGPathElement),
      reveal: nodes, arc: (v) => finite(v) && v >= 0 && v <= 1, dur: nonnegative,
      zoom: (v) => finite(v) && v > 0, pad: nonnegative, bend: finite, at: atTime,
      ease: (v) => typeof v === "function" || (typeof v === "string" && Object.hasOwn(E.ease, v)),
    };
    if (!o || typeof o !== "object" || Array.isArray(o) || ![Object.prototype, null].includes(Object.getPrototypeOf(o))) fail("options must be a plain object");
    for (const key of Reflect.ownKeys(o)) {
      if (!Object.hasOwn(rules, key)) fail(`unknown option ${String(key)}`);
      if (o[key] !== undefined && !rules[key](o[key])) fail(`invalid ${String(key)} (${typeof o[key]})`);
    }
    if (!target(o.target)) fail("target must be an element, selector, world or finite {x, y, w, h} rectangle");
    const start = tl.resolveAt(o.at);
    const dur = o.dur ?? 2.4;
    const route = o.route ? E.$all(o.route, stage.world)[0] : null;
    const box = (t) => (t && typeof t === "object" && "w" in t ? t : stage.measure(t));
    if (route && o.from != null) {
      const bend = o.bend ?? 0.2;
      stage.onLayout(() => {
        const a = box(o.from), b = box(o.target), svg = stage.measure(route.ownerSVGElement ?? route);
        const ax = a.x + a.w / 2 - svg.x, ay = a.y + a.h / 2 - svg.y, bx = b.x + b.w / 2 - svg.x, by = b.y + b.h / 2 - svg.y;
        const cx = (ax + bx) / 2 + bend * (by - ay), cy = (ay + by) / 2 - bend * (bx - ax);
        route.setAttribute("d", `M ${r3(ax)} ${r3(ay)} Q ${r3(cx)} ${r3(cy)} ${r3(bx)} ${r3(by)}`);
      });
    }
    camera.to(o.target, { at: start, dur, arc: o.arc ?? 0.6, pad: o.pad, zoom: o.zoom, ease: o.ease ?? "camera" });
    if (route) tl.tween(route, { draw: [0, 1] }, { at: start + dur * 0.15, dur: dur * 0.7, ease: "inOut" });
    if (o.reveal) tl.tween(o.reveal, { opacity: [0, 1], y: [6, 0] }, { at: start + dur * 0.8, dur: dur * 0.2, ease: "out" });
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
})();
