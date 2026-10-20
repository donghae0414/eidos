(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const seg = typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  const graphemes = (s) => (seg ? [...seg.segment(s)].map((g) => g.segment) : Array.from(s));

  // Inside a word every grapheme (a Korean syllable is one) becomes its own inline-block span; child
  // elements (<b>, <code>) stay in place and only their text is split, so their styling survives.
  // Whitespace inside a child element stays a text node so it keeps its width.
  function splitChars(node, out) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of graphemes(child.nodeValue)) {
          if (/^\s+$/.test(ch)) {
            frag.appendChild(document.createTextNode(ch));
            continue;
          }
          const span = document.createElement("span");
          span.className = "eidos-char";
          span.style.cssText = "display:inline-block";
          span.textContent = ch;
          out.push(frag.appendChild(span));
        }
        child.replaceWith(frag);
      } else if (child.nodeType === 1) splitChars(child, out);
    }
  }

  // Words are whitespace-separated runs (the kinetic-type rule), so a Korean 어절 stays whole; child
  // elements join the run they touch and each run becomes one nowrap inline-block holding its char spans.
  function chars(el) {
    if (el.__eidosChars) return el.__eidosChars;
    const toks = [];
    for (const node of [...el.childNodes]) {
      if (node.nodeType === 3) {
        for (const part of node.nodeValue.split(/(\s+)/))
          if (part) toks.push(/^\s+$/.test(part) ? { gap: document.createTextNode(part) } : { node: document.createTextNode(part) });
      } else if (node.nodeType === 1 && node.tagName !== "BR") toks.push({ node });
      else toks.push({ gap: node });
    }
    el.textContent = "";
    const words = [];
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
        words.push(el.appendChild(cur));
      }
      cur.appendChild(t.node);
    }
    const list = [];
    for (const w of words) splitChars(w, list);
    el.style.wordBreak = "keep-all";
    return (el.__eidosChars = list);
  }

  E.fx["char-stagger"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, each: 1, overlap: 1, dur: 1, dist: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`char-stagger: unknown option ${String(key)}`);
    if (o.each != null && o.overlap != null) fail("char-stagger: give each or overlap, not both");
    if (o.overlap != null && !(Number.isFinite(o.overlap) && o.overlap >= 0 && o.overlap < 1)) {
      fail("char-stagger: overlap must be a number from 0 (inclusive) to 1 (exclusive)");
    }
    const { tl } = stage;
    const els = E.$all(o.targets ?? o.target, stage.world);
    if (!els.length) fail(`char-stagger: no element for targets ${o.targets ?? o.target}`);
    const list = els.flatMap(chars);
    const dur = o.dur ?? 0.4;
    if (!Number.isFinite(dur) || dur <= 0) fail(`char-stagger: dur must be a positive number of seconds, got ${String(o.dur)}`);
    const dist = o.dist ?? 12;
    if (!Number.isFinite(dist)) fail(`char-stagger: dist must be a finite number of px, got ${String(o.dist)}`);
    const each = o.overlap != null ? dur * (1 - o.overlap) : o.each ?? 0.03;
    if (!Number.isFinite(each) || each < 0) fail(`char-stagger: each must be a nonnegative number of seconds, got ${String(o.each)}`);
    const start = tl.resolveAt(o.at);
    const props = E.reduced ? { opacity: [0, 1] } : { y: [dist, 0], opacity: [0, 1] };
    const timing = o.overlap != null ? { overlap: o.overlap } : { each };
    tl.stagger(list, props, { ...timing, at: start, dur, ease: "out" });
    const end = list.length ? start + (list.length - 1) * each + dur : start;
    return {
      start,
      end,
      items: list.map((el, i) => ({ el, start: start + i * each, end: start + i * each + dur })),
    };
  };
})();
