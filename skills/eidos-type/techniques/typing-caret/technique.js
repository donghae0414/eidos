(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const lin = (p) => p;
  const seg = typeof Intl === "object" && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  const graphemes = (s) => (seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s));
  const SPACE = 1.6;

  // Untyped glyphs reserve the final layout; Korean eojeol stay together.
  function setup(el) {
    if (el.__eidosTyping) return el.__eidosTyping;
    const text = el.textContent.replace(/\s+/g, " ").trim();
    el.textContent = "";
    el.style.wordBreak = "keep-all";
    const units = [];
    let word = null;
    for (const g of graphemes(text)) {
      if (g === " ") {
        el.appendChild(document.createTextNode(" "));
        units.push({ g, span: null });
        word = null;
        continue;
      }
      if (!word) {
        word = document.createElement("span");
        word.className = "eidos-word";
        word.style.cssText = "display:inline-block;white-space:nowrap";
        el.appendChild(word);
      }
      const span = document.createElement("span");
      span.className = "eidos-glyph";
      span.textContent = g;
      word.appendChild(span);
      units.push({ g, span });
    }
    const caret = document.createElement("span");
    caret.className = "eidos-caret";
    caret.setAttribute("aria-hidden", "true");
    caret.style.cssText =
      "display:inline-block;width:0;height:1.05em;vertical-align:-0.16em;border-left:0.08em solid currentColor;margin-right:-0.08em";
    return (el.__eidosTyping = { text, units, caret });
  }

  // A typed space puts the caret at the head of the next nowrap word.
  const place = (S, k) => {
    const prev = k > 0 ? S.units[k - 1] : null;
    if (prev?.span) prev.span.after(S.caret);
    else S.units.slice(k).find((u) => u.span).span.before(S.caret);
  };

  E.fx["typing-caret"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, cps: 1, jitter: 1, seed: 1, caret: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`typing-caret: unknown option ${String(key)}`);
    const { tl } = stage;
    const els = E.$all(o.targets ?? o.target, stage.world);
    if (!els.length) fail(`typing-caret: no element for targets ${o.targets ?? o.target}`);
    const cps = o.cps ?? 18;
    if (!(Number.isFinite(cps) && cps > 0)) fail(`typing-caret: cps must be a positive number, got ${String(o.cps)}`);
    const jitter = o.jitter ?? 0.4;
    if (!(Number.isFinite(jitter) && jitter >= 0 && jitter <= 1)) fail(`typing-caret: jitter must be a number from 0 to 1, got ${String(o.jitter)}`);
    const seed = o.seed ?? 1;
    if (!Number.isFinite(seed)) fail(`typing-caret: seed must be a finite number, got ${String(seed)}`);
    const caretOn = o.caret ?? true;
    if (typeof caretOn !== "boolean") fail(`typing-caret: caret must be true or false, got ${String(o.caret)}`);
    const start = tl.resolveAt(o.at);
    let t = start;
    const items = els.map((el, n) => {
      const S = setup(el);
      const N = S.units.length;
      if (!N) fail(`typing-caret: ${el.id ? `#${el.id}` : el.tagName.toLowerCase()} has no text to type`);
      if (caretOn) place(S, 0);
      const rng = E.rng((seed | 0) + n);
      const times = [];
      let tau = 0;
      for (const u of S.units) {
        tau += ((1 + jitter * (2 * rng() - 1)) / cps) * (u.span ? 1 : SPACE);
        times.push(tau);
      }
      // The first glyph waits one interval; the last has one interval to settle before the end stop.
      const total = tau + 1 / cps;
      const at = t;
      tl.add((p) => {
        let elapsed = p * total;
        // Stops may be declared before or after this effect, including over a keystroke.
        const stop = tl.stops.find((s) => Math.abs(s.t - (at + elapsed)) <= 1.000001e-6);
        if (stop) elapsed = Math.max(0, stop.t - at - 2e-6);
        let k = 0;
        if (E.reduced) k = elapsed >= times[0] ? N : 0;
        else while (k < N && times[k] <= elapsed) k++;
        S.units.forEach((u, i) => {
          if (u.span) u.span.style.opacity = i < k ? "1" : "0";
        });
        if (caretOn) {
          place(S, k);
          S.caret.style.opacity = "1";
        }
      }, { at, dur: total, ease: lin });
      t = at + total;
      return { el, start: at, end: t, text: S.text, caret: caretOn ? S.caret : null };
    });
    tl.prevStart = start;
    tl.extend(t);
    return { start, end: t, items };
  };
})();
