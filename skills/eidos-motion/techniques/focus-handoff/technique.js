(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const { r3 } = E.util;
  const RING_PAD_PX = 6;
  const FOCUS_SCALE = 1.02;

  E.fx["focus-handoff"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, order: 1, stopEach: 1, labels: 1, hold: 1, dimTo: 1, dur: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`focus-handoff: unknown option ${String(key)}`);
    const { tl } = stage;
    const items = E.$all(o.targets ?? o.target, stage.world);
    if (!items.length) fail(`focus-handoff: no element for targets ${o.targets ?? o.target}`);
    const order = o.order ?? items.map((_, i) => i);
    if (!Array.isArray(order) || !order.length) fail("focus-handoff: order must be a non-empty array of item indices");
    for (const i of order) {
      if (!Number.isInteger(i) || i < 0 || i >= items.length) fail(`focus-handoff: order index ${String(i)} is outside 0..${items.length - 1}`);
    }
    const stopEach = o.stopEach ?? true;
    if (typeof stopEach !== "boolean") fail("focus-handoff: stopEach must be true or false");
    if (o.labels != null) {
      if (!stopEach) fail("focus-handoff: labels needs stopEach: true");
      if (!Array.isArray(o.labels) || o.labels.some((l) => typeof l !== "string")) fail("focus-handoff: labels must be an array of strings");
      if (o.labels.length > order.length) fail(`focus-handoff: ${o.labels.length} labels for ${order.length} focus steps`);
    }
    if (o.hold != null && stopEach) fail("focus-handoff: hold needs stopEach: false");
    const hold = o.hold ?? 0.5;
    if (!(Number.isFinite(hold) && hold >= 0)) fail("focus-handoff: hold must be a number >= 0");
    const dimTo = o.dimTo ?? 0.45;
    if (!(Number.isFinite(dimTo) && dimTo >= 0 && dimTo < 1)) fail("focus-handoff: dimTo must be a number from 0 to below 1");
    const dur = o.dur ?? 0.35;
    if (!(Number.isFinite(dur) && dur > 0)) fail("focus-handoff: dur must be a number > 0");
    const labels = o.labels ?? [];
    const lift = E.reduced ? 1 : FOCUS_SCALE;

    const rings = new Map();
    for (const el of items) {
      const ring = document.createElement("span");
      ring.className = "eidos-focus";
      ring.setAttribute("aria-hidden", "true");
      ring.style.cssText =
        `position:absolute;inset:${-RING_PAD_PX}px;border:2px solid var(--eidos-accent);border-radius:${RING_PAD_PX}px;` +
        "background:color-mix(in oklab, var(--eidos-accent) 9%, transparent);opacity:0;z-index:-1;pointer-events:none";
      el.insertBefore(ring, el.firstChild);
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.style.isolation = "isolate";
      stage.onLayout(() => {
        const r = getComputedStyle(el).borderTopLeftRadius;
        ring.style.borderRadius = `${r3((r.endsWith("px") ? parseFloat(r) : 0) + RING_PAD_PX)}px`;
      });
      rings.set(el, ring);
    }

    // Opacity level shared with stagger-reveal (el.__eidosLevel), so a list dimmed there hands off correctly here.
    const level = (el) => el.__eidosLevel ?? 1;
    const fade = (el, to, at, d) => {
      const from = level(el);
      if (Math.abs(from - to) < 1e-9) return;
      tl.tween(el, { opacity: [from, to] }, { at, dur: d, ease: "inOut" });
      el.__eidosLevel = to;
    };
    const focusIn = (el, at, d) => {
      fade(el, 1, at, d);
      tl.tween(rings.get(el), { opacity: [0, 1] }, { at, dur: d, ease: "inOut" });
      if (lift !== 1) tl.tween(el, { scale: [1, lift] }, { at, dur: d, ease: "overshoot" });
    };
    const focusOut = (el, to, at, d) => {
      fade(el, to, at, d);
      tl.tween(rings.get(el), { opacity: [1, 0] }, { at, dur: d, ease: "inOut" });
      if (lift !== 1) tl.tween(el, { scale: [lift, 1] }, { at, dur: d, ease: "inOut" });
    };

    const start = tl.resolveAt(o.at);
    const steps = [];
    let focused = null;
    let t = start;
    order.forEach((index, k) => {
      const el = items[index];
      const at = k === 0 ? start : stopEach ? tl.end : t;
      if (k === 0) for (const other of items) if (other !== el) fade(other, dimTo, at, dur);
      if (el !== focused) {
        if (focused) focusOut(focused, dimTo, at, dur);
        focusIn(el, at, dur);
        focused = el;
      }
      t = at + dur;
      tl.extend(t);
      steps.push({ el, index, start: at, end: t });
      if (stopEach) tl.stop(labels[k] ?? "");
      else t += hold;
    });
    const end = steps[steps.length - 1].end;
    return {
      start,
      end,
      items: steps,
      restore(r = {}) {
        for (const key of Reflect.ownKeys(r)) if (key !== "at" && key !== "dur") fail(`focus-handoff: restore: unknown option ${String(key)}`);
        const at = tl.resolveAt(r.at);
        const d = r.dur ?? dur;
        if (!(Number.isFinite(d) && d > 0)) fail("focus-handoff: restore: dur must be a number > 0");
        if (focused) {
          focusOut(focused, 1, at, d);
          focused = null;
        }
        for (const el of items) fade(el, 1, at, d);
        tl.extend(at + d);
        return { start: at, end: at + d };
      },
    };
  };
})();
