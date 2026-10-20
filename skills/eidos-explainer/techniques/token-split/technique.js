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
  const ID_FADE_SEC = 0.3;
  const TINT_PCT = 20;
  const RING_PCT = 55;
  // Eased move progress after which neighbouring padded chips no longer overlap, so tints start there.
  const TINT_FROM = 0.35;
  const color = (i) => `var(--eidos-cat-${(i % 5) + 1})`;

  E.fx["token-split"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, tokens: 1, ids: 1, gap: 1, dur: 1, each: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`token-split: unknown option ${String(key)}`);
    const { tl } = stage;
    const tokens = o.tokens;
    if (!Array.isArray(tokens) || !tokens.length) fail("token-split: tokens is required (a non-empty array of strings whose join equals the target text)");
    tokens.forEach((t, i) => {
      if (typeof t !== "string" || !t) fail(`token-split: tokens[${i}] must be a non-empty string`);
    });
    const ids = o.ids ?? null;
    if (ids && (!Array.isArray(ids) || ids.length !== tokens.length)) fail(`token-split: ids must be an array with one entry per token (${tokens.length})`);
    ids?.forEach((v, i) => {
      if (typeof v !== "string" && !Number.isFinite(v)) fail(`token-split: ids[${i}] must be a string or a number`);
    });
    const gap = o.gap ?? 8, dur = o.dur ?? 0.6, each = o.each ?? 0.04;
    if (!(Number.isFinite(gap) && gap >= 0)) fail(`token-split: gap must be a number >= 0 (got ${String(o.gap)})`);
    if (!(Number.isFinite(dur) && dur > 0)) fail(`token-split: dur must be a number > 0 (got ${String(o.dur)})`);
    if (!(Number.isFinite(each) && each >= 0)) fail(`token-split: each must be a number >= 0 (got ${String(o.each)})`);
    const els = E.$all(o.targets ?? o.target, stage.world);
    if (els.length !== 1) fail(`token-split: targets must match exactly one sentence element (matched ${els.length})`);
    const el = els[0];
    if (el.children.length) fail(`token-split: the target must hold plain text only (found <${el.children[0].tagName.toLowerCase()}>)`);
    const text = el.textContent;
    const joined = tokens.join("");
    if (joined !== text) {
      let k = 0;
      while (k < text.length && text[k] === joined[k]) k++;
      fail(`token-split: tokens.join("") must equal the target text; they differ at character ${k} ("${joined}" vs "${text}")`);
    }

    // Preserve token-edge whitespace between nowrap word spans, so Korean eojeol never split.
    // A whitespace-only token keeps its exact text in a chip of its own.
    el.textContent = "";
    el.style.wordBreak = "keep-all";
    el.style.whiteSpace = "pre-wrap";
    const items = [];
    let word = null;
    const space = (text) => {
      word = null;
      el.appendChild(document.createTextNode(text));
    };
    tokens.forEach((tok, i) => {
      const core = tok.trim();
      if (core && /^\s/.test(tok)) space(tok.match(/^\s+/)[0]);
      if (!core || !word) {
        word = el.appendChild(document.createElement("span"));
        word.className = "eidos-token-word";
        word.style.cssText = "display:inline-block;white-space:nowrap";
      }
      const chip = word.appendChild(document.createElement("span"));
      chip.className = "eidos-token";
      chip.textContent = core || tok;
      chip.style.cssText =
        "display:inline-block;position:relative;white-space:pre;padding:0.06em 0.16em;border-radius:var(--eidos-radius-sm)" +
        (i < tokens.length - 1 ? `;margin-right:${gap}px` : "") +
        (ids ? ";margin-bottom:1.15em" : "");
      let idEl = null;
      if (ids) {
        idEl = chip.appendChild(document.createElement("span"));
        idEl.className = "eidos-token-id";
        idEl.setAttribute("aria-hidden", "true");
        idEl.textContent = String(ids[i]);
        idEl.style.cssText =
          "position:absolute;left:0;right:0;top:100%;display:flex;justify-content:center;margin-top:0.2em;padding-top:0.2em;" +
          `border-top:2px solid color-mix(in oklab, ${color(i)} 60%, transparent);` +
          "font-family:var(--eidos-font-mono);font-size:max(0.75rem, 0.4em);font-weight:500;line-height:1.2;color:var(--eidos-muted-fg);white-space:nowrap";
      }
      if (!core) word = null;
      if (core && /\s$/.test(tok)) space(tok.match(/\s+$/)[0]);
      items.push({ el: chip, idEl, token: tok, id: ids?.[i], i, at: i * each, idAt: i * each + 0.75 * dur, dx: 0 });
    });

    // Joined state: on each rendered line the token texts abut as in the plain sentence (only the real
    // spaces stay), anchored like the line's text-align; each chip slides from there to its gapped spot.
    stage.onLayout(() => {
      const align = getComputedStyle(el).textAlign;
      const anchor = /center/.test(align) ? 0.5 : align === "right" || align === "end" ? 1 : 0;
      for (const it of items) it.el.style.transform = "none";
      const lines = [];
      for (const it of items) {
        const r = it.el.getBoundingClientRect(), cs = getComputedStyle(it.el);
        const c = { it, x: r.left, w: r.width, pl: parseFloat(cs.paddingLeft), pr: parseFloat(cs.paddingRight), ml: parseFloat(cs.marginLeft), mr: parseFloat(cs.marginRight) };
        const line = lines[lines.length - 1];
        if (line && r.top < line.top + r.height / 2) line.chips.push(c);
        else lines.push({ top: r.top, chips: [c] });
      }
      for (const { chips } of lines) {
        let width = 0;
        const rel = chips.map((c, k) => {
          const p = chips[k - 1];
          const spaceWidth = p ? c.x - (p.x + p.w) - p.mr - c.ml : 0;
          width += spaceWidth;
          const x = width;
          width += c.w - c.pl - c.pr;
          return x;
        });
        const a = chips[0], b = chips[chips.length - 1];
        const x0 = a.x + (b.x + b.w - a.x - width) * anchor;
        chips.forEach((c, k) => (c.it.dx = x0 + rel[k] - (c.x + c.pl)));
      }
    });

    const total = (items.length - 1) * each + (ids ? Math.max(dur, 0.75 * dur + ID_FADE_SEC) : dur);
    const start = tl.resolveAt(o.at);
    const inOut = E.ease.inOut, out = E.ease.out;
    tl.add(
      (x) => {
        const T = snap(x) * total;
        // Reduced motion: no in-between frames; the split state replaces the sentence halfway through.
        const step = x >= 0.5 ? 1 : 0;
        // Every chip moves on one shared progress so gaps only widen (a staggered move lets an early chip
        // run into a later, farther-travelling one); each only staggers the tint and id reveal.
        const move = E.reduced ? step : inOut(clamp01(T / dur));
        for (const it of items) {
          const q = E.reduced ? step : clamp01((T - it.at) / dur);
          const k = clamp01((inOut(q) - TINT_FROM) / (1 - TINT_FROM));
          it.el.style.transform = `translateX(${r3(it.dx * (1 - move))}px)`;
          it.el.style.backgroundColor = k > 0 ? `color-mix(in oklab, ${color(it.i)} ${r3(TINT_PCT * k)}%, transparent)` : "transparent";
          it.el.style.boxShadow = k > 0 ? `inset 0 0 0 1px color-mix(in oklab, ${color(it.i)} ${r3(RING_PCT * k)}%, transparent)` : "none";
          if (it.idEl) {
            const v = E.reduced ? q : clamp01((T - it.idAt) / ID_FADE_SEC);
            it.idEl.style.opacity = String(r3(v));
            it.idEl.style.transform = `translateY(${r3(E.reduced ? 0 : 0.3 * (1 - out(v)))}em)`;
          }
        }
      },
      { at: start, dur: total, ease: lin },
    );
    return {
      start,
      end: start + total,
      items: items.map((it) => ({ el: it.el, token: it.token, id: it.id, start: start + it.at, end: start + (it.idEl ? it.idAt + ID_FADE_SEC : it.at + dur) })),
    };
  };
})();
