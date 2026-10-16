(() => {
  const E = window.Eidos;
  const { r3, clamp01 } = E.util;
  const lin = (p) => p;
  // A stop at a tween's end sees x = ((at + dur) - at) / dur, which floats can leave a hair under 1.
  const snap = (x) => (x > 1 - 1e-9 ? 1 : x < 1e-9 ? 0 : x);
  const expo = E.bezier(0.16, 1, 0.3, 1);
  const MOVES = ["rise", "spread", "close"];
  const stacks = new WeakMap();
  const one = (sel, root, what) => {
    const el = sel == null ? null : E.$all(sel, root)[0];
    if (!el) throw new Error(`text-sandwich: no element for ${what} ${sel}`);
    return el;
  };

  function stack(title, back, front) {
    const known = stacks.get(title);
    if (known) {
      if (known.back !== back || known.front !== front) throw new Error("text-sandwich: a title keeps the back and front it started with");
      return known;
    }
    [back, title, front].forEach((el, i) => {
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.style.zIndex = String(i + 1);
    });
    title.parentElement.style.isolation = "isolate";
    const st = { back, front, by: 0, bs: 1, fy: 0 };
    stacks.set(title, st);
    return st;
  }

  E.fx["text-sandwich"] = (stage, o = {}) => {
    const { tl } = stage;
    const move = o.move ?? "rise";
    if (!MOVES.includes(move)) throw new Error(`text-sandwich: unknown move "${move}" (rise, spread, close)`);
    const title = one(o.title, stage.world, "title");
    const st = stack(title, one(o.back, stage.world, "back"), one(o.front, stage.world, "front"));
    const { back, front } = st;
    const dur = o.dur ?? (move === "rise" ? 0.9 : 1);
    const ease = typeof o.ease === "function" ? o.ease : o.ease ? E.ease[o.ease] ?? E.ease.inOut : move === "rise" ? expo : E.ease.inOut;
    const cut = (p) => (E.reduced ? (p < 0.5 ? 0 : 1) : p <= 0 ? 0 : p >= 1 ? 1 : ease(p));
    const start = tl.resolveAt(o.at);
    let draw, layers;
    if (move === "rise") {
      const dist = o.dist ?? 100;
      layers = [title];
      draw = (p) => {
        const q = cut(p);
        title.style.transform = `translateY(${r3(dist * (1 - q))}%)`;
        title.style.opacity = String(r3(E.reduced ? q : clamp01(p / 0.4)));
      };
    } else {
      // translateY(-50 * (1 - s)%) cancels the downward shift of a centre-origin scale(s), so the back recedes about its top edge.
      const gap = o.gap ?? 45;
      const a = { by: st.by, bs: st.bs, fy: st.fy };
      const b = move === "spread" ? { by: (-50 * gap) / 450, bs: 1 - gap / 450, fy: gap } : { by: 0, bs: 1, fy: 0 };
      Object.assign(st, b);
      layers = [back, front];
      draw = (p) => {
        const q = cut(p);
        back.style.transform = `translateY(${r3(a.by + (b.by - a.by) * q)}%) scale(${r3(a.bs + (b.bs - a.bs) * q)})`;
        front.style.transform = `translateY(${r3(a.fy + (b.fy - a.fy) * q)}%)`;
      };
    }
    tl.add((x) => draw(snap(x)), { at: E.reduced ? start + dur / 2 : start, dur: E.reduced ? 0 : dur, ease: lin });
    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur, items: layers.map((el) => ({ el, start, end: start + dur })) };
  };
})();
