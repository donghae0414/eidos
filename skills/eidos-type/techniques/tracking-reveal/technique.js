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
  const fade = E.ease.out;
  const fadeEnd = 0.6;

  // Words are whitespace-separated runs, so a Korean eojeol stays whole; each word is one nowrap
  // inline-block holding one inline-block span per character, and a child element (<b>, <code>) is one glyph.
  function glyphs(el) {
    if (el.__eidosGlyphs) return el.__eidosGlyphs;
    const toks = [];
    for (const node of [...el.childNodes]) {
      if (node.nodeType === 3) {
        for (const part of node.nodeValue.split(/(\s+)/))
          if (part) toks.push(/^\s+$/.test(part) ? { gap: document.createTextNode(part) } : { text: part });
      } else if (node.nodeType === 1 && node.tagName !== "BR") toks.push({ node });
      else toks.push({ gap: node });
    }
    el.textContent = "";
    const list = [];
    let word = null;
    const glyph = (child) => {
      const g = document.createElement("span");
      g.className = "eidos-glyph";
      g.style.cssText = "display:inline-block";
      g.appendChild(child);
      list.push(word.appendChild(g));
    };
    for (const t of toks) {
      if (t.gap) {
        word = null;
        el.appendChild(t.gap);
        continue;
      }
      if (!word) {
        word = document.createElement("span");
        word.className = "eidos-word";
        word.style.cssText = "display:inline-block;white-space:nowrap";
        el.appendChild(word);
      }
      if (t.node) glyph(t.node);
      else for (const ch of t.text) glyph(document.createTextNode(ch));
    }
    el.style.wordBreak = "keep-all";
    return (el.__eidosGlyphs = list);
  }

  // A visual line ends where x restarts or the next glyph starts below the previous one (offsets ignore
  // transforms), so a wrapped title converges line by line, each line around its own center.
  function measure(list, spread) {
    const rows = [];
    let row = [], lastLeft = -Infinity, lastBottom = -Infinity;
    for (const g of list) {
      if (g.offsetLeft < lastLeft || g.offsetTop >= lastBottom) {
        if (row.length) rows.push(row);
        row = [];
      }
      row.push(g);
      lastLeft = g.offsetLeft;
      lastBottom = g.offsetTop + g.offsetHeight;
    }
    rows.push(row);
    for (const r of rows) {
      const center = (r.length - 1) / 2;
      r.forEach((g, i) => {
        g.__eidosDx = (i - center) * spread;
      });
    }
  }

  E.fx["tracking-reveal"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, spread: 1, dur: 1, ease: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`tracking-reveal: unknown option ${String(key)}`);
    const { tl } = stage;
    const lines = E.$all(o.targets ?? o.target, stage.world);
    if (!lines.length) fail(`tracking-reveal: no element for targets ${o.targets ?? o.target}`);
    const spread = o.spread ?? 14;
    if (!Number.isFinite(spread)) fail(`tracking-reveal: spread must be a finite number of px, got ${String(o.spread)}`);
    const dur = o.dur ?? 0.9;
    if (!Number.isFinite(dur) || dur < 0) fail(`tracking-reveal: dur must be a nonnegative number of seconds, got ${String(o.dur)}`);
    const move = typeof o.ease === "function" ? o.ease : E.ease[o.ease ?? "camera"];
    if (!move) fail(`tracking-reveal: unknown ease "${String(o.ease)}" (${Object.keys(E.ease).join(", ")} or a function)`);
    const start = tl.resolveAt(o.at);
    const items = lines.map((el) => ({ el, glyphs: glyphs(el), start, end: start + dur }));
    const all = items.flatMap((it) => it.glyphs);
    for (const g of all) g.__eidosDx = 0;
    stage.onLayout(() => {
      for (const it of items) measure(it.glyphs, spread);
    });
    tl.add(
      (x) => {
        const q = snap(x);
        const e = E.reduced ? 1 : move(q);
        const op = fade(clamp01(q / fadeEnd));
        for (const g of all) {
          g.style.transform = `translate(${r3(g.__eidosDx * (1 - e))}px, 0px)`;
          g.style.opacity = String(r3(op));
        }
      },
      { at: start, dur, ease: lin },
    );
    return { start, end: start + dur, items };
  };
})();
