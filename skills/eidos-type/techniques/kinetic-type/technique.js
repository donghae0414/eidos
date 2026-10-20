(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const { r3, clamp01 } = E.util;
  const lin = (p) => p;
  // A stop at a tween's end sees x = ((at + dur) - at) / dur, which floats can leave a hair under 1.
  const snap = (x) => (x > 1 - 1e-9 ? 1 : x < 1e-9 ? 0 : x);
  const expo = E.bezier(0.16, 1, 0.3, 1);
  const SCALE = { slam: 2.6, "scale-in": 0.55, pulse: 1.18 };
  const DUR = { sweep: 0.6, slam: 0.55, "scale-in": 0.6, pulse: 0.5 };
  const DIR = { right: [-1, 0], left: [1, 0], up: [0, 1], down: [0, -1] };

  // Words are whitespace-separated runs, so a Korean eojeol stays whole; child elements
  // join the run they touch (<b>KV</b>캐시는 is one word) and each run becomes one nowrap inline-block.
  function words(el) {
    if (el.__eidosWords) return el.__eidosWords;
    const toks = [];
    for (const node of [...el.childNodes]) {
      if (node.nodeType === 3) {
        for (const part of node.nodeValue.split(/(\s+)/))
          if (part) toks.push(/^\s+$/.test(part) ? { gap: document.createTextNode(part) } : { node: document.createTextNode(part) });
      } else if (node.nodeType === 1 && node.tagName !== "BR") toks.push({ node });
      else toks.push({ gap: node });
    }
    el.textContent = "";
    const list = [];
    let cur = null;
    for (const t of toks) {
      if (t.gap) {
        cur = null;
        el.appendChild(t.gap);
        continue;
      }
      if (!cur) {
        cur = document.createElement("span");
        cur.className = "eidos-word";
        cur.style.cssText = "display:inline-block;white-space:nowrap";
        list.push(el.appendChild(cur));
      }
      cur.appendChild(t.node);
    }
    el.style.wordBreak = "keep-all";
    return (el.__eidosWords = list);
  }

  const MOVES = {
    sweep: (q, m) => {
      const e = expo(q);
      return { x: m.dx * (1 - e), y: m.dy * (1 - e), s: 1, op: clamp01(q / 0.45) };
    },
    slam: (q, m) => {
      const hit = 0.72;
      const s = q < hit ? 1 + (m.scale - 1) * (1 - (q / hit) ** 2) : 1 - 0.07 * Math.sin((Math.PI * (q - hit)) / (1 - hit));
      return { x: 0, y: 0, s, op: clamp01(q / 0.2) };
    },
    "scale-in": (q, m) => ({ x: 0, y: 0, s: m.scale + (1 - m.scale) * expo(q), op: clamp01(q / 0.5) }),
    pulse: (q, m) => ({ x: 0, y: 0, s: 1 + (m.scale - 1) * Math.sin(Math.PI * q), op: 1 }),
  };

  E.fx["kinetic-type"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, move: 1, emMove: 1, em: 1, each: 1, beat: 1, dir: 1, dist: 1, dur: 1, scale: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`kinetic-type: unknown option ${String(key)}`);
    const { tl } = stage;
    const move = o.move ?? "sweep";
    const emMove = o.emMove ?? "slam";
    for (const m of [move, emMove]) if (!MOVES[m]) fail(`kinetic-type: unknown move "${m}" (sweep, slam, scale-in, pulse)`);
    const lines = E.$all(o.targets ?? o.target, stage.world);
    if (!lines.length) fail(`kinetic-type: no element for targets ${o.targets ?? o.target}`);
    const list = lines.flatMap(words);
    const isEm = (w, i) =>
      Array.isArray(o.em) ? o.em.includes(i) : typeof o.em === "string" ? w.matches(o.em) || !!w.querySelector(o.em) : false;
    const each = o.each ?? 0.09;
    const beat = o.beat ?? 0.12;
    const [ux, uy] = DIR[o.dir ?? "right"] ?? DIR.right;
    const dist = o.dist ?? 40;
    const spec = (name, own) => ({
      fn: MOVES[name],
      dur: own ? o.dur ?? DUR[name] : DUR[name] * 1.1,
      m: { scale: own ? o.scale ?? SCALE[name] : SCALE[name], dx: ux * dist, dy: uy * dist },
    });
    let t = 0;
    const plan = list.map((w, i) => {
      const em = isEm(w, i);
      if (em && i > 0) t += beat;
      const sp = em ? spec(emMove, emMove === move) : spec(move, true);
      const it = { w, em, at: t, ...sp };
      t += each;
      return it;
    });
    const total = plan.length ? Math.max(...plan.map((it) => it.at + it.dur)) : 0;
    const start = tl.resolveAt(o.at);
    if (E.reduced) {
      for (const it of plan) tl.add(
        (p) => {
          it.w.style.transform = "translate(0px, 0px) scale(1)";
          it.w.style.opacity = String(it.fn === MOVES.pulse ? 1 : p);
        },
        { at: start + it.at, dur: 0, ease: lin },
      );
    } else tl.add(
      (x) => {
        const T = snap(x) * total;
        for (const it of plan) {
          const q = it.dur > 0 ? clamp01((T - it.at) / it.dur) : 1;
          const v = it.fn(q, it.m);
          it.w.style.transform = `translate(${r3(v.x)}px, ${r3(v.y)}px) scale(${r3(v.s)})`;
          it.w.style.opacity = String(r3(v.op));
        }
      },
      { at: start, dur: total, ease: lin },
    );
    tl.prevStart = start;
    tl.extend(start + total);
    return {
      start,
      end: start + total,
      items: plan.map((it) => ({ el: it.w, start: start + it.at, end: start + it.at + it.dur, em: it.em })),
    };
  };
})();
