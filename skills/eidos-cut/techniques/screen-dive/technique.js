(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const easeOf = (e) => (typeof e === "function" ? e : Object.hasOwn(E.ease, e) ? E.ease[e] : fail(`screen-dive: unknown ease ${JSON.stringify(e)}`));
  const find = (stage, target, what) => {
    let els = [];
    try {
      els = E.$all(target, stage.world);
    } catch {
      fail(`screen-dive: ${what} is not a valid selector (got ${JSON.stringify(target)})`);
    }
    return els.length ? els : fail(`screen-dive: no element for ${what} ${JSON.stringify(target)}`);
  };
  const span = (p, a, b) => (p <= a ? 0 : p >= b ? 1 : (p - a) / (b - a));
  // Phases on q, the dive progress (q = p going in, q = 1 - p with out: true): the inner scene appears in the
  // screen over [0, INNER], the dive runs over [DIVE, 1], the outer scene lets go over [OUTER, 1].
  const INNER = 0.3, DIVE = 0.2, OUTER = 0.8;

  E.fx["screen-dive"] = (stage, o = {}) => {
    const { tl } = stage;
    const { r3 } = E.util;
    const allowed = { from: 1, to: 1, at: 1, dur: 1, ease: 1, screen: 1, content: 1, out: 1 };
    if (!o || typeof o !== "object" || Array.isArray(o)) fail("screen-dive: options must be an object");
    for (const key of Object.keys(o)) if (!Object.hasOwn(allowed, key)) fail(`screen-dive: unknown option ${key}`);
    if (o.out != null && typeof o.out !== "boolean") fail(`screen-dive: out must be true or false (got ${JSON.stringify(o.out)})`);
    const out = o.out === true;
    if (o.from == null || o.to == null) {
      fail('screen-dive: needs from and to as two separate full-frame scenes; when the next scene is an element inside the screen, use via: "camera"');
    }
    const dur = o.dur ?? 1.4;
    if (!Number.isFinite(dur) || dur < 0) fail(`screen-dive: dur must be a finite number >= 0 (got ${JSON.stringify(o.dur)})`);
    const ease = easeOf(o.ease ?? "camera");
    const fromEls = find(stage, o.from, "from");
    const toEls = find(stage, o.to, "to");
    const host = out ? "to" : "from";
    if (o.screen == null) fail(`screen-dive: screen is required: the window or device screen element inside the ${host} scene`);
    const screen = find(stage, o.screen, "screen")[0];
    const outer = out ? toEls : fromEls, inner = out ? fromEls : toEls;
    if (!outer.some((el) => el !== screen && el.contains(screen))) fail(`screen-dive: screen must be inside the ${host} scene (got ${JSON.stringify(o.screen)})`);
    if (inner.some((el) => el.contains(screen) || screen.contains(el))) fail("screen-dive: the scene seen in the screen must be a separate layer, not nested in or around the screen");
    const content = o.content == null ? [...screen.children] : find(stage, o.content, "content");
    const start = tl.resolveAt(o.at);
    if (!Number.isFinite(start) || start < 0) fail("screen-dive: at must resolve to finite nonnegative seconds");
    const at = { at: start, dur, ease: "linear" };
    const first = tl.tracks.length;
    const finish = () => {
      for (const tr of tl.tracks.slice(first)) {
        const fn = tr.fn;
        tr.fn = (p) => fn(tl.t <= start ? 0 : p < 1e-9 ? 0 : p > 1 - 1e-9 ? 1 : p);
      }
      tl.prevStart = start;
      tl.extend(start + dur);
      return { start, end: start + dur };
    };

    if (E.reduced) {
      tl.tween(fromEls, { opacity: (p) => (p < 0.5 ? 1 : 0) }, at);
      tl.tween(toEls, { opacity: (p) => (p < 0.5 ? 0 : 1) }, at);
      return finish();
    }

    // Layout, in world coordinates with transforms ignored: the screen rect S, the inner scene rect V and
    // k, the zoom at which S covers V (4% over, so the screen's rounded corners leave the frame).
    // The dive is a camera-style move from V's centre at scale 1 to S's centre at scale k.
    let cS = { x: 0, y: 0 }, cV = { x: 0, y: 0 }, k = 1, gen = 0, warned = false;
    const centre = new Map();
    stage.onLayout(() => {
      gen++;
      const S = stage.measure(screen), V = stage.measure(inner);
      cS = { x: S.x + S.w / 2, y: S.y + S.h / 2 };
      cV = { x: V.x + V.w / 2, y: V.y + V.h / 2 };
      if (S.w < 1 || S.h < 1) {
        if (!warned) (window.__eidosErrors ||= []).push("screen-dive: screen has no size at layout (display: none?)");
        warned = true;
        k = 1;
      } else k = Math.min(Math.max(V.w / S.w, V.h / S.h) * 1.04, 60);
      for (const el of [...outer, ...inner]) {
        const r = stage.measure(el);
        centre.set(el, { x: r.x + r.w / 2, y: r.y + r.h / 2 });
      }
    });
    const q = (p) => (out ? 1 - p : p);
    const view = (qq) => E.Camera.mix({ x: cV.x, y: cV.y, s: 1, r: 0 }, { x: cS.x, y: cS.y, s: k, r: 0 }, ease(span(qq, DIVE, 1)));
    const ID = { x: 0, y: 0, s: 1 };
    // The outer scene rides the dive: the screen centre goes to the frame centre while it scales by k.
    const outerAt = (el, v) => {
      const c = centre.get(el) || cV;
      return { x: cV.x - c.x + v.s * (c.x - v.x), y: cV.y - c.y + v.s * (c.y - v.y), s: v.s };
    };
    // The inner scene is the dive composed with the inverse of its end state: it starts fitted inside the
    // screen (scale 1/k) and arrives untransformed (scale 1) exactly when the screen fills the frame.
    const innerAt = (el, v) => {
      const c = centre.get(el) || cV, sc = v.s / k;
      return { x: cV.x - c.x + v.s * (cS.x - v.x) + sc * (c.x - cV.x), y: cV.y - c.y + v.s * (cS.y - v.y) + sc * (c.y - cV.y), s: sc };
    };
    const memoPose = (fn) => {
      let lp = NaN, lg = -1, val = ID;
      return (p) => (p === lp && gen === lg ? val : ((lp = p), (lg = gen), (val = fn(p))));
    };
    const props = (tf, opacity) => ({ x: (p) => r3(tf(p).x), y: (p) => r3(tf(p).y), scale: (p) => tf(p).s, opacity });

    // Every element is untransformed at both ends of the transition; the zoomed poses exist only while the
    // element is invisible at that end, so reusing a scene later with another transition finds no residue.
    for (const el of outer) {
      const tf = memoPose((p) => (q(p) >= 1 ? ID : outerAt(el, view(q(p)))));
      tl.tween(el, props(tf, (p) => 1 - E.ease.inOut(span(q(p), OUTER, 1))), at);
    }
    for (const el of inner) {
      const tf = memoPose((p) => (q(p) <= 0 ? ID : innerAt(el, view(q(p)))));
      tl.tween(el, props(tf, (p) => E.ease.out(span(q(p), 0, INNER))), at);
    }
    const screenContentOpacity = (p) => (q(p) >= 1 ? 1 : 1 - E.ease.out(span(q(p), 0, INNER)));
    if (content.length) tl.tween(content, { opacity: screenContentOpacity }, at);

    return finish();
  };
  E.fx["screen-dive"].kind = "transition";
})();
