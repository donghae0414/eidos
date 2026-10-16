(() => {
  const E = window.Eidos;
  const { r3, lerp } = E.util;
  // file:// reports errors thrown from another script file as "Script error.", so record the message first.
  const fail = (message) => {
    window.__eidosErrors.push(message);
    throw new Error(message);
  };
  const LOOK = {
    upcoming: { opacity: 0.6, bg: "var(--eidos-bg)", fg: "var(--eidos-muted-fg)", ring: "var(--eidos-border)" },
    active: { opacity: 1, bg: "var(--eidos-accent)", fg: "var(--eidos-accent-fg)", ring: "var(--eidos-accent)" },
    done: { opacity: 0.8, bg: "var(--eidos-bg)", fg: "var(--eidos-success)", ring: "var(--eidos-success)" },
  };
  const mix = (a, b, p) => (p <= 0 ? a : p >= 1 ? b : `color-mix(in oklch, ${b} ${r3(p * 100)}%, ${a})`);
  const px = (v) => `${r3(v)}px`;

  E.fx["step-panel"] = (stage, o = {}) => {
    const allowed = { el: 1, steps: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`step-panel: unknown option ${String(key)}`);
    const { tl } = stage;
    const timing = (r) => {
      if (r.at != null && !(typeof r.at === "number" && Number.isFinite(r.at) && r.at >= 0) &&
          !(typeof r.at === "string" && /^(?:<|(?:<\+=|[+-]=)?(?:\d+(?:\.\d+)?|\.\d+))$/.test(r.at)))
        fail("step-panel: at must be a nonnegative time or a timeline offset");
      for (const key of ["dur", "each", "total"]) if (r[key] != null && (!Number.isFinite(r[key]) || r[key] < 0))
        fail("step-panel: " + key + " must be a finite number >= 0");
      for (const key of ["dim", "labelDim", "stagger"]) if (r[key] != null && (!Number.isFinite(r[key]) || r[key] < 0 || r[key] > 1))
        fail("step-panel: " + key + " must be a finite number between 0 and 1");
      if (r.ease != null && typeof r.ease !== "function" && !(typeof r.ease === "string" && Object.hasOwn(E.ease, r.ease)))
        fail("step-panel: ease must name an Eidos easing or be a function");
    };
    const add = (fn, r) => {
      timing(r);
      const at = tl.resolveAt(r.at), dur = r.dur ?? 0.6;
      if (!Number.isFinite(at) || at < 0) fail("step-panel: resolved at must be a nonnegative finite number");
      return tl.add((p) => {
        const q = dur === 0 ? (tl.sourceTime(tl.t) > at ? 1 : 0) : E.reduced ? (p >= 0.5 ? 1 : 0) : p;
        fn(q);
      }, r);
    };
    const tween = (els, props, r) => add(E.tween(els, props), r);
    timing(o);
    const root = E.$all(o.el, stage.world)[0];
    const steps = o.steps;
    if (!root || !Array.isArray(steps) || !steps.length || steps.some((s) => typeof s?.title !== "string" || !s.title.trim()))
      fail("step-panel: el and a non-empty steps array of { title, detail } are required");
    const make = (tag, cls, css, parent) => {
      const node = document.createElement(tag);
      node.className = cls;
      node.style.cssText = css;
      parent.appendChild(node);
      return node;
    };
    const list = make("ol", "eidos-step-panel", "position:relative;list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:0.4rem", root);
    const slab = make("div", "eidos-step-slab", "position:absolute;left:0;right:0;top:0;height:0;opacity:0;border-radius:var(--eidos-radius-sm);border:1px solid color-mix(in oklch, var(--eidos-accent) 45%, var(--eidos-border));background:color-mix(in oklch, var(--eidos-accent) 8%, var(--eidos-surface));box-shadow:var(--eidos-shadow)", list);
    const rail = make("div", "eidos-step-rail", "position:absolute;width:2px;border-radius:1px;background:var(--eidos-border)", list);
    const fill = make("div", "eidos-step-fill", "position:absolute;width:2px;height:0;border-radius:1px;background:var(--eidos-accent)", list);
    const items = steps.map((step, i) => {
      const li = make("li", "eidos-step", `position:relative;z-index:1;display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:0.75rem;row-gap:0.15rem;padding:clamp(0.5rem,1.1vw,0.75rem) clamp(0.65rem,1.4vw,1rem);opacity:${LOOK.upcoming.opacity}`, list);
      const num = make("span", "eidos-step-num", "grid-row:1 / span 2;width:clamp(1.65rem,2.4vw,2rem);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;font:600 0.9rem/1 var(--eidos-font-mono);border:1.5px solid var(--eidos-border);background-color:var(--eidos-bg);color:var(--eidos-muted-fg)", li);
      num.textContent = String(i + 1);
      const title = make("b", "eidos-step-title", "align-self:center;font-size:clamp(0.95rem,1.5vw,1.15rem);line-height:1.35;color:var(--eidos-fg)", li);
      title.textContent = step.title;
      const detail = make("span", "eidos-step-detail", "grid-column:2;font-size:clamp(0.8rem,1.2vw,0.95rem);line-height:1.45;color:var(--eidos-muted-fg)", li);
      detail.textContent = step.detail ?? "";
      return { li, num, state: "upcoming" };
    });

    let boxes = [];
    const box = (k) => boxes[k] ?? { top: 0, h: 0, c: 0 };
    const reach = (k) => (k < 0 ? 0 : box(k).c - box(0).c);
    stage.onLayout(() => {
      boxes = items.map(({ li, num }) => ({ top: li.offsetTop, h: li.offsetHeight, c: li.offsetTop + num.offsetTop + num.offsetHeight / 2 }));
      const { li, num } = items[0];
      for (const line of [rail, fill]) {
        line.style.left = px(li.offsetLeft + num.offsetLeft + num.offsetWidth / 2 - 1);
        line.style.top = px(box(0).c);
      }
      rail.style.height = px(reach(items.length - 1));
    });

    let current = -1;
    const glyph = (k, state) => (state === "done" ? "✓" : String(k + 1));
    const to = (i, r = {}) => {
      timing(r);
      if (!Number.isInteger(i) || i < 0 || i >= items.length) fail(`step-panel: to(${i}) is outside 0..${items.length - 1}`);
      const at = tl.resolveAt(r.at), dur = r.dur ?? 0.5, ease = r.ease ?? "inOut";
      items.forEach((it, k) => {
        const next = k < i ? "done" : k === i ? "active" : "upcoming";
        if (next === it.state) return;
        const from = it.state, A = LOOK[from], B = LOOK[next];
        tween(it.li, { opacity: [A.opacity, B.opacity] }, { at, dur, ease });
        tween(it.num, {
          style: (p) => ({ backgroundColor: mix(A.bg, B.bg, p), color: mix(A.fg, B.fg, p), borderColor: mix(A.ring, B.ring, p) }),
          text: (p) => glyph(k, p < 0.5 ? from : next),
        }, { at, dur, ease });
        it.state = next;
      });
      const prev = current;
      if (prev < 0) tween(slab, { opacity: [0, 1], style: () => ({ top: px(box(i).top), height: px(box(i).h) }) }, { at, dur, ease });
      else tween(slab, { style: (p) => ({ top: px(lerp(box(prev).top, box(i).top, p)), height: px(lerp(box(prev).h, box(i).h, p)) }) }, { at, dur, ease });
      tween(fill, { style: (p) => ({ height: px(lerp(reach(prev), reach(i), p)) }) }, { at, dur, ease });
      current = i;
      tl.prevStart = at;
      return { start: at, end: at + dur, index: i };
    };
    return { list, items: items.map((it) => it.li), to };
  };
})();
