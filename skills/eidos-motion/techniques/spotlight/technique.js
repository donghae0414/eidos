(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const { r3, clamp01 } = E.util;
  const HOME = "translate(0px, 0px)";
  // One overlay per stage. Every lit region is its own hole layer (a box-shadow cutout toward the page
  // background), so moving the light is transform + opacity on two layers, never a width/height tween.
  const states = new WeakMap();

  function overlayFor(stage) {
    let st = states.get(stage);
    if (st) return st;
    const el = document.createElement("div");
    el.className = "eidos-spotlight";
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:10";
    stage.world.appendChild(el);
    st = { el, visits: [], current: null };
    states.set(stage, st);
    // Hole geometry follows the target's layout box (offsets ignore transforms, so a row that slid in gets
    // its resting rect) and is re-measured on resize; the corner stays concentric with the target's own radius.
    stage.onLayout(() => {
      for (const v of st.visits) {
        const r = stage.measure(v.target);
        const radius = parseFloat(getComputedStyle(v.target).borderTopLeftRadius) || 0;
        v.cx = r.x + r.w / 2;
        v.cy = r.y + r.h / 2;
        v.hole.style.left = `${r3(r.x - v.pad)}px`;
        v.hole.style.top = `${r3(r.y - v.pad)}px`;
        v.hole.style.width = `${r3(r.w + 2 * v.pad)}px`;
        v.hole.style.height = `${r3(r.h + 2 * v.pad)}px`;
        v.hole.style.borderRadius = `${r3(radius + v.pad)}px`;
      }
    });
    return st;
  }

  function visit(st, target, pad, dim) {
    const hole = document.createElement("div");
    hole.className = "eidos-spotlight-hole";
    hole.style.cssText = `position:absolute;left:0;top:0;width:0;height:0;box-shadow:0 0 0 9999px var(--eidos-bg);opacity:0;transform:${HOME}`;
    st.el.appendChild(hole);
    const v = { target, pad, dim, hole, cx: 0, cy: 0 };
    st.visits.push(v);
    return v;
  }

  const set = (v, opacity, transform = HOME) => {
    v.hole.style.transform = transform;
    v.hole.style.opacity = String(r3(opacity));
  };

  // Where both shadows overlap, the layers stack as 1 - (1 - a)(1 - b); holding that product on the straight
  // line from the old dim to the new one keeps the surroundings steady while the light travels.
  function hop(prev, cur, q, slide) {
    const a = prev.dim * (1 - q);
    const c = prev.dim + (cur.dim - prev.dim) * q;
    const b = clamp01(1 - (1 - c) / Math.max(1 - a, 1e-6));
    const dx = (prev.cx - cur.cx) * slide, dy = (prev.cy - cur.cy) * slide;
    set(prev, a, `translate(${r3(-dx * q)}px, ${r3(-dy * q)}px)`);
    set(cur, b, `translate(${r3(dx * (1 - q))}px, ${r3(dy * (1 - q))}px)`);
  }

  E.fx["spotlight"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, pad: 1, dim: 1, dur: 1, each: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`spotlight: unknown option ${String(key)}`);
    const { tl } = stage;
    const els = E.$all(o.targets ?? o.target, stage.world);
    if (!els.length) fail(`spotlight: no element for targets ${String(o.targets ?? o.target)}`);
    if (!els.every((el) => el instanceof Element)) fail("spotlight: targets must be a selector, an element, or a list of elements");
    const pad = o.pad ?? 12;
    if (!Number.isFinite(pad) || pad < 0) fail(`spotlight: pad must be a nonnegative number of px, got ${String(o.pad)}`);
    const dim = o.dim ?? 0.55;
    if (!Number.isFinite(dim) || dim < 0 || dim > 1) fail(`spotlight: dim must be a number from 0 to 1, got ${String(o.dim)}`);
    const dur = o.dur ?? 0.5;
    if (!Number.isFinite(dur) || dur < 0) fail(`spotlight: dur must be a nonnegative number of seconds, got ${String(o.dur)}`);
    const each = o.each ?? dur * 2;
    if (!Number.isFinite(each) || each < dur) fail(`spotlight: each must be a number of seconds >= dur (${dur}) so one move ends before the next starts, got ${String(o.each)}`);
    const st = overlayFor(stage);
    const start = tl.resolveAt(o.at);
    const slide = E.reduced ? 0 : 1;
    const items = els.map((target, i) => {
      const at = start + i * each;
      const cur = visit(st, target, pad, dim);
      const prev = st.current;
      if (prev) tl.add((q) => hop(prev, cur, q, slide), { at, dur, ease: "inOut" });
      else tl.add((q) => set(cur, dim * q), { at, dur, ease: "out" });
      st.current = cur;
      return { el: cur.hole, target, start: at, end: at + dur };
    });
    const end = items[items.length - 1].end;
    tl.prevStart = start;
    tl.extend(end);
    return {
      start,
      end,
      items,
      release(r = {}) {
        for (const key of Reflect.ownKeys(r)) if (key !== "at" && key !== "dur") fail(`spotlight.release: unknown option ${String(key)}`);
        const lit = st.current;
        if (!lit) fail("spotlight.release: nothing is lit");
        const d = r.dur ?? dur;
        if (!Number.isFinite(d) || d < 0) fail(`spotlight.release: dur must be a nonnegative number of seconds, got ${String(r.dur)}`);
        const at = tl.resolveAt(r.at);
        tl.add((q) => set(lit, lit.dim * (1 - q)), { at, dur: d, ease: "inOut" });
        st.current = null;
        return { start: at, end: at + d };
      },
    };
  };
})();
