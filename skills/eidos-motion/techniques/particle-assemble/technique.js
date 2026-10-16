(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  const { clamp01 } = E.util;
  const r2 = (v) => Math.round(v * 100) / 100;
  const lin = (p) => p;
  // A stop at a tween's end sees x = ((at + dur) - at) / dur, which floats can leave a hair under 1.
  const snap = (x) => (x > 1 - 1e-9 ? 1 : x < 1e-9 ? 0 : x);
  const MAX = 400;
  const systems = new WeakMap();
  const fail = (m) => {
    const text = `particle-assemble: ${m}`;
    (window.__eidosErrors ||= []).push(text);
    throw new Error(text);
  };
  const name = (el) => (el.id ? `#${el.id}` : `<${el.tagName.toLowerCase()}>`);
  const region = (svg, sel) => {
    const el = E.$all(sel, svg)[0];
    if (!el || typeof el.getBBox !== "function") fail(`no SVG element for cloud ${sel}`);
    const b = el.getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  };

  // Hex lattice rows in reading order (top to bottom, left to right), kept only inside the shape's fill.
  function lattice(b, h, inside) {
    const out = [], dy = h * 0.866;
    for (let j = 0, y = b.y + dy / 2; y < b.y + b.height; j++, y += dy)
      for (let x = b.x + (j % 2 ? h : h / 2); x < b.x + b.width; x += h) if (inside(x, y)) out.push([x, y]);
    return out;
  }
  // m evenly spread points: shrink the spacing until m fit, bisect for the widest such spacing, then thin evenly.
  function sample(svg, el, m) {
    if (!m) return [];
    const b = el.getBBox();
    if (!(b.width > 0 && b.height > 0)) fail(`${name(el)} has no area`);
    const pt = svg.createSVGPoint();
    const inside = typeof el.isPointInFill === "function" ? (x, y) => ((pt.x = x), (pt.y = y), el.isPointInFill(pt)) : () => true;
    let hi = Math.sqrt((b.width * b.height) / m) * 1.2, lo = hi, got = lattice(b, lo, inside);
    while (got.length < m) {
      if ((b.width * b.height) / (lo * lo) > 60 * m) fail(`${name(el)} has no fill area for ${m} particles (display: none?)`);
      hi = lo;
      lo *= 0.85;
      got = lattice(b, lo, inside);
    }
    for (let k = 0; k < 10 && hi > lo; k++) {
      const mid = (lo + hi) / 2, g = lattice(b, mid, inside);
      if (g.length >= m) {
        lo = mid;
        got = g;
      } else hi = mid;
    }
    return Array.from({ length: m }, (_, j) => got[Math.floor((j * got.length) / m)]);
  }
  function formation(sys, sel) {
    const shapes = E.$all(sel, sys.svg).filter((el) => typeof el.getBBox === "function");
    if (!shapes.length) fail(`no SVG shape for to ${sel}`);
    const areas = shapes.map((el) => {
      const b = el.getBBox();
      return b.width * b.height;
    });
    const total = areas.reduce((a, b) => a + b, 0);
    if (!(total > 0)) fail(`${sel} has no area`);
    const raw = areas.map((a) => (sys.n * a) / total), cnt = raw.map(Math.floor);
    raw
      .map((r, k) => [r - cnt[k], k])
      .sort((a, b) => b[0] - a[0] || a[1] - b[1])
      .slice(0, sys.n - cnt.reduce((a, b) => a + b, 0))
      .forEach(([, k]) => cnt[k]++);
    const pts = [], owner = [];
    shapes.forEach((el, k) => sample(sys.svg, el, cnt[k]).forEach((p) => (pts.push(p), owner.push(k))));
    return { pts, owner };
  }

  function system(svg, o) {
    const vb = svg.viewBox.baseVal;
    if (!vb || !(vb.width > 0) || !(vb.height > 0)) fail("svg needs a viewBox");
    const n = Math.max(1, Math.min(MAX, Math.round(o.count ?? 200)));
    const seed = o.seed ?? 1, rng = E.rng(seed);
    const b = o.cloud != null ? region(svg, o.cloud) : { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
    const fill = typeof o.color === "string" ? o.color : "var(--eidos-fg)";
    const g = svg.appendChild(document.createElementNS(NS, "g"));
    g.setAttribute("class", "eidos-particles");
    const sys = { svg, g, n, seed, calls: 0, shown: false, dots: [], home: [], delay: [], bend: [] };
    for (let i = 0; i < n; i++) {
      const p = [b.x + rng() * b.w, b.y + rng() * b.h];
      sys.home.push(p);
      sys.delay.push(rng());
      sys.bend.push(rng() * 2 - 1);
      const c = g.appendChild(document.createElementNS(NS, "circle"));
      c.setAttribute("cx", r2(p[0]));
      c.setAttribute("cy", r2(p[1]));
      c.setAttribute("r", r2(o.r ?? 4));
      c.style.fill = fill;
      c.style.opacity = "0";
      sys.dots.push(c);
    }
    sys.pos = sys.home.map((p) => p.slice());
    sys.color = sys.dots.map(() => fill);
    systems.set(svg, sys);
    return sys;
  }

  E.fx["particle-assemble"] = (stage, o = {}) => {
    const allowed = { svg: 1, to: 1, count: 1, seed: 1, cloud: 1, color: 1, r: 1, order: 1, spread: 1, bend: 1, ease: 1, fade: 1, dur: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`unknown option ${String(key)}`);
    const { tl } = stage;
    const svg = E.$all(o.svg, stage.world)[0];
    if (!(svg instanceof SVGSVGElement)) fail(`svg must select an <svg> (got ${o.svg})`);
    if (o.to == null) fail('to is required (a shape selector or "scatter")');
    const order = o.order ?? "keep";
    if (order !== "keep" && order !== "random") fail(`unknown order "${order}" (keep, random)`);
    const sys = systems.get(svg) ?? system(svg, o);
    const n = sys.n;
    const call = sys.calls + 1;
    const rng = E.rng(o.seed != null && sys.calls ? o.seed : sys.seed + 101 * call);
    const scatter = o.to === "scatter";
    let to, owner = null;
    if (scatter) {
      const b = o.cloud != null ? region(svg, o.cloud) : null;
      to = b ? sys.dots.map(() => [b.x + rng() * b.w, b.y + rng() * b.h]) : sys.home.map((p) => p.slice());
    } else {
      ({ pts: to, owner } = formation(sys, o.to));
      if (order === "random") {
        const idx = to.map((_, i) => i);
        for (let i = idx.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [idx[i], idx[j]] = [idx[j], idx[i]];
        }
        to = idx.map((i) => to[i]);
        owner = idx.map((i) => owner[i]);
      }
    }
    sys.calls = call;
    const first = !sys.shown, fade = scatter && !!o.fade;
    const from = sys.pos;
    const c1 = sys.dots.map((_, i) =>
      Array.isArray(o.color) ? (owner ? o.color[owner[i] % o.color.length] : sys.color[i]) : o.color ?? sys.color[i],
    );
    const c0 = first ? c1 : sys.color;
    const sp = Math.min(0.9, Math.max(0, o.spread ?? 0.4));
    const bend = o.bend ?? 0.25;
    const ease = typeof o.ease === "function" ? o.ease : E.ease[o.ease ?? "inOut"] ?? E.ease.inOut;
    // Scatter is assembly run backwards: mirrored delays (last to arrive leaves first) and the same curve traversed in reverse.
    const dl = sys.delay.map((d) => (scatter ? 1 - d : d) * sp);
    const ctrl = from.map((a, i) => {
      const b = to[i], k = (scatter ? -1 : 1) * bend * sys.bend[i];
      return [(a[0] + b[0]) / 2 - (b[1] - a[1]) * k, (a[1] + b[1]) / 2 + (b[0] - a[0]) * k];
    });
    sys.pos = to;
    sys.color = c1;
    sys.shown = !fade;
    const dur = o.dur ?? 1.4;
    const start = tl.resolveAt(o.at);
    tl.add(
      (x) => {
        const p = snap(x);
        for (let i = 0; i < n; i++) {
          const q = E.reduced ? (p < 0.5 ? 0 : 1) : clamp01((p - dl[i]) / (1 - sp));
          const s = E.reduced ? q : ease(q), u = 1 - s;
          const a = from[i], b = to[i], c = ctrl[i], dot = sys.dots[i];
          dot.setAttribute("cx", r2(q <= 0 ? a[0] : q >= 1 ? b[0] : u * u * a[0] + 2 * u * s * c[0] + s * s * b[0]));
          dot.setAttribute("cy", r2(q <= 0 ? a[1] : q >= 1 ? b[1] : u * u * a[1] + 2 * u * s * c[1] + s * s * b[1]));
          dot.style.fill = c0[i] === c1[i] || q >= 1 ? c1[i] : q <= 0 ? c0[i] : `color-mix(in oklab, ${c1[i]} ${r2(clamp01(s) * 100)}%, ${c0[i]})`;
          dot.style.opacity = String(first ? r2(E.reduced ? q : clamp01(q / 0.3)) : fade ? r2(E.reduced ? 1 - q : 1 - clamp01((q - 0.7) / 0.3)) : 1);
        }
      },
      { at: E.reduced ? start + dur / 2 : start, dur: E.reduced ? 0 : dur, ease: lin },
    );
    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur, items: [{ el: sys.g, start, end: start + dur }], count: n };
  };
})();
