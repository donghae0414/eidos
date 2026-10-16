(() => {
  const E = window.Eidos;
  const { r3 } = E.util;
  const fail = (message) => {
    const text = `dolly-zoom: ${message}`;
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

  E.fx["dolly-zoom"] = (stage, o = {}) => {
    const { tl, world } = stage;
    const rig = select(o.rig ?? ".dolly-rig", world)[0];
    if (!rig) fail("rig must identify an element");
    const unit = o.unit ?? "var(--u)";
    const len = (v) => `calc(${unit} * ${r3(v)})`;
    const num = (el, k) => number(Number(el.dataset[k] ?? 0), `data-${k}`);
    const planes = (o.planes ? select(o.planes, world) : [...rig.children]).map((el) => {
      const p = { el, x: num(el, "x"), y: num(el, "y"), z: num(el, "z") };
      Object.assign(el.style, { position: "absolute", left: "0", top: "0", transformOrigin: "0 0", zIndex: String(1000 + Math.round(p.z * 100)) });
      return p;
    });
    if (!planes.length || planes.some((p) => p.el.parentElement !== rig)) fail("planes must be children of rig");
    const nearest = Math.max(...planes.map((p) => p.z));
    const check = (P) => {
      number(P, "perspective");
      if (!(P > 0 && P * 0.9 > nearest)) fail(`perspective ${P} must be positive and exceed the nearest plane z (${nearest}) / 0.9`);
    };

    // The eye sits P units in front of the z = 0 plane, so a layer parallel to the screen at depth z
    // projects with scale P / (P - z) about the rig origin. That projection is exact, so it is written
    // as a 2D transform: z = 0 never changes size and z < 0 recedes as P shrinks.
    const render = (P) => {
      for (const p of planes) {
        const s = P / (P - p.z);
        p.el.style.transform = `translate(${len(p.x * s)}, ${len(p.y * s)}) scale(${r3(s)}) translate(-50%, -50%)`;
      }
    };

    const start = tl.resolveAt(o.at);
    if (!Number.isFinite(start) || start < 0) fail("at must be finite and nonnegative");
    const first = o.from ?? 6;
    check(first);
    let cur = first;
    tl.add(() => render(first), { at: start, dur: 0 });

    return {
      start,
      end: start,
      to(P, t = {}) {
        check(P);
        const a = cur;
        const at = tl.resolveAt(t.at);
        const dur = number(t.dur ?? 2.4, "dur");
        if (!Number.isFinite(at) || at < 0 || dur < 0) fail("at and dur must be finite and nonnegative");
        tl.add((p) => {
          // Keep the parked source stop; a zero-duration destination owns only t > at.
          if (dur === 0 && tl.t <= at) p = 0;
          render(E.reduced ? (p < 0.5 ? a : P) : a * Math.pow(P / a, p));
        }, { at, dur, ease: t.ease ?? "inOut" });
        cur = P;
        return { start: at, end: at + dur };
      },
    };
  };
  E.fx["dolly-zoom"].kind = "technique";
})();
