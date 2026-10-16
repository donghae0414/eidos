(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  const { r3 } = E.util;
  // file:// reports errors thrown from another script file as "Script error.", so record the message first.
  const fail = (message) => {
    window.__eidosErrors.push(message);
    throw new Error(message);
  };
  const make = (tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    parent.appendChild(node);
    return node;
  };

  E.fx["exploded-view"] = (stage, o = {}) => {
    const allowed = { el: 1, parts: 1, side: 1, labelX: 1, size: 1, mono: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`exploded-view: unknown option ${String(key)}`);
    const { tl } = stage;
    const timing = (r) => {
      if (r.at != null && !(typeof r.at === "number" && Number.isFinite(r.at) && r.at >= 0) &&
          !(typeof r.at === "string" && /^(?:<|(?:<\+=|[+-]=)?(?:\d+(?:\.\d+)?|\.\d+))$/.test(r.at)))
        fail("exploded-view: at must be a nonnegative time or a timeline offset");
      for (const key of ["dur", "each", "total"]) if (r[key] != null && (!Number.isFinite(r[key]) || r[key] < 0))
        fail("exploded-view: " + key + " must be a finite number >= 0");
      for (const key of ["dim", "labelDim", "stagger"]) if (r[key] != null && (!Number.isFinite(r[key]) || r[key] < 0 || r[key] > 1))
        fail("exploded-view: " + key + " must be a finite number between 0 and 1");
      if (r.ease != null && typeof r.ease !== "function" && !(typeof r.ease === "string" && Object.hasOwn(E.ease, r.ease)))
        fail("exploded-view: ease must name an Eidos easing or be a function");
    };
    const add = (fn, r) => {
      timing(r);
      const at = tl.resolveAt(r.at), dur = r.dur ?? 0.6;
      if (!Number.isFinite(at) || at < 0) fail("exploded-view: resolved at must be a nonnegative finite number");
      return tl.add((p) => {
        const q = dur === 0 ? (tl.sourceTime(tl.t) > at ? 1 : 0) : E.reduced ? (p >= 0.5 ? 1 : 0) : p;
        fn(q);
      }, r);
    };
    const tween = (els, props, r) => add(E.tween(els, props), r);
    timing(o);
    const svg = E.$all(o.el, stage.world)[0];
    if (!(svg instanceof SVGSVGElement)) fail("exploded-view: el must be the <svg> that holds the parts");
    if (!Array.isArray(o.parts) || o.parts.length < 2) fail("exploded-view: parts needs at least two { el, vector, label }");
    const side = o.side ?? "right";
    if (side !== "right" && side !== "left") fail('exploded-view: side must be "right" or "left"');
    const size = o.size ?? 22, dir = side === "right" ? 1 : -1;
    if (!Number.isFinite(size) || size <= 0) fail("exploded-view: size must be a finite number > 0");
    if (o.labelX != null && !Number.isFinite(o.labelX)) fail("exploded-view: labelX must be a finite number");
    if (o.mono != null && typeof o.mono !== "boolean") fail("exploded-view: mono must be a boolean");
    const ids = new Set();
    const parts = o.parts.map((spec, i) => {
      const el = E.$all(spec?.el, svg)[0];
      const id = spec?.id ?? el?.id;
      const v = spec?.vector;
      if (!el || typeof id !== "string" || !id || ids.has(id) || !Array.isArray(v) || v.length !== 2 || !v.every(Number.isFinite))
        fail(`exploded-view: part ${i + 1} needs an el inside the svg, a unique id and a finite [dx, dy] vector`);
      ids.add(id);
      el.style.opacity = "1";
      return { id, el, v, box: el.getBBox(), lab: 1, shown: 0, op: 1 };
    });
    const edge = side === "right" ? Math.max(...parts.map((p) => p.box.x + p.box.width)) : Math.min(...parts.map((p) => p.box.x));
    const lx = o.labelX ?? edge + dir * 48;
    const layer = make("g", { class: "eidos-exploded-labels" }, svg);
    o.parts.forEach((spec, i) => {
      const p = parts[i];
      const ax = (side === "right" ? p.box.x + p.box.width : p.box.x) + p.v[0];
      const ay = p.box.y + p.box.height / 2 + p.v[1];
      p.annot = make("g", { class: "eidos-exploded-annot" }, layer);
      p.annot.style.opacity = "0";
      p.leader = make("path", { d: `M ${r3(ax + dir * 6)} ${r3(ay)} H ${r3(lx - dir * 10)}`, fill: "none" }, p.annot);
      p.leader.style.cssText = "stroke:var(--eidos-muted-fg);stroke-width:1.5;visibility:hidden";
      make("circle", { cx: r3(ax), cy: r3(ay), r: 4 }, p.annot).style.fill = "var(--eidos-fg)";
      p.label = make("g", {}, p.annot);
      const anchor = side === "right" ? "start" : "end";
      p.title = make("text", { x: r3(lx), y: r3(ay - 5), "text-anchor": anchor }, p.label);
      p.title.style.cssText = `font:600 ${size}px ${o.mono ? "var(--eidos-font-mono)" : "var(--eidos-font-sans)"};fill:var(--eidos-fg)`;
      p.title.textContent = spec.label ?? p.id;
      p.detail = make("text", { x: r3(lx), y: r3(ay + size * 1.1), "text-anchor": anchor }, p.label);
      p.detail.style.cssText = `font-size:${r3(size * 0.82)}px;fill:var(--eidos-muted-fg)`;
      p.detail.textContent = spec.detail ?? "";
    });

    let open = false;
    const explode = (r = {}) => {
      timing(r);
      if (open) fail("exploded-view: explode() was called twice without assemble()");
      const start = tl.resolveAt(r.at), dur = r.dur ?? 0.9, each = r.each ?? 0.08;
      parts.forEach((p, k) => tween(p.el, { x: [0, p.v[0]], y: [0, p.v[1]] }, { at: start + k * each, dur, ease: r.ease ?? "out" }));
      const settle = start + (parts.length - 1) * each + dur * 0.7;
      parts.forEach((p, k) => {
        const t0 = settle + k * 0.06;
        tween(p.annot, { opacity: [0, p.lab] }, { at: t0, dur: 0.3 });
        tween(p.leader, { draw: [0, 1] }, { at: t0, dur: 0.35, ease: "out" });
        tween(p.label, { x: [-dir * 8, 0] }, { at: t0 + 0.05, dur: 0.35, ease: "out" });
        p.shown = p.lab;
      });
      open = true;
      tl.prevStart = start;
      return { start, end: tl.end };
    };
    const assemble = (r = {}) => {
      timing(r);
      if (!open) fail("exploded-view: assemble() needs a previous explode()");
      const start = tl.resolveAt(r.at), dur = r.dur ?? 0.8, each = r.each ?? 0.06;
      for (const p of parts) {
        tween(p.annot, { opacity: [p.shown, 0] }, { at: start, dur: 0.25 });
        tween(p.leader, { draw: [1, 0] }, { at: start, dur: 0.3, ease: "in" });
        p.shown = 0;
      }
      [...parts].reverse().forEach((p, k) => tween(p.el, { x: [p.v[0], 0], y: [p.v[1], 0] }, { at: start + 0.3 + k * each, dur, ease: r.ease ?? "inOut" }));
      open = false;
      tl.prevStart = start;
      return { start, end: tl.end };
    };
    const focus = (sel, r = {}) => {
      timing(r);
      if (sel != null && (!Array.isArray(sel) || sel.some((id) => !ids.has(id))))
        fail(`exploded-view: focus() takes null or an array of part ids (${[...ids].join(", ")})`);
      const start = tl.resolveAt(r.at), dur = r.dur ?? 0.45, dim = r.dim ?? 0.3, labelDim = r.labelDim ?? 0.75;
      for (const p of parts) {
        const on = sel == null || sel.includes(p.id);
        const op = on ? 1 : dim;
        if (op !== p.op) tween(p.el, { opacity: [p.op, op] }, { at: start, dur });
        p.op = op;
        p.lab = on ? 1 : labelDim;
        if (p.shown > 0 && p.shown !== p.lab) {
          tween(p.annot, { opacity: [p.shown, p.lab] }, { at: start, dur });
          p.shown = p.lab;
        }
      }
      tl.extend(start + dur);
      tl.prevStart = start;
      return { start, end: start + dur };
    };
    const part = (id) => {
      const p = parts.find((x) => x.id === id);
      if (!p) fail(`exploded-view: unknown part "${id}"`);
      return { el: p.el, annot: p.annot, leader: p.leader, title: p.title, detail: p.detail };
    };
    return { parts: parts.map((p) => p.el), explode, assemble, focus, part };
  };
})();
