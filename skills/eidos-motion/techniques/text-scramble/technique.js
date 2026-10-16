(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const lin = (p) => p;
  // A stop at a tween's end sees x = ((at + dur) - at) / dur, which floats can leave a hair under 1.
  const snap = (x) => (x > 1 - 1e-9 ? 1 : x < 1e-9 ? 0 : x);
  const seg = typeof Intl === "object" && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  const graphemes = (s) => (seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s));
  const POOL = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    digit: "0123456789",
    hexLower: "0123456789abcdef",
    hexUpper: "0123456789ABCDEF",
    symbol: "#$%&*+-<=>?@^_~/|",
  };
  // Stateless 32-bit mix of (seed, position, phase bin): the glyph at time t never depends on earlier frames.
  const hash = (a, b, c) => {
    let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35) ^ Math.imul(c + 0x27d4eb2f, 0x165667b1);
    h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
    h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
    return (h ^ (h >>> 16)) >>> 0;
  };
  const blank = (g) => /^\s+$/.test(g);
  const poolOf = (g, hex) => {
    if (hex && /^[0-9a-f]$/.test(g)) return POOL.hexLower;
    if (hex && /^[0-9A-F]$/.test(g)) return POOL.hexUpper;
    if (/^[\uac00-\ud7a3]$/.test(g)) return "hangul";
    if (/^[A-Z]$/.test(g)) return POOL.upper;
    if (/^[a-z]$/.test(g)) return POOL.lower;
    if (/^[0-9]$/.test(g)) return POOL.digit;
    return POOL.symbol;
  };
  const pick = (pool, h) => (pool === "hangul" ? String.fromCharCode(0xac00 + (h % 11172)) : pool[h % pool.length]);
  const looksHex = (gs) => {
    const s = gs.filter((g) => !blank(g));
    return s.length >= 8 && s.every((g) => /^[0-9a-fA-F]$/.test(g)) && s.some((g) => /^[a-fA-F]$/.test(g));
  };
  const nth = (v, i) => (Array.isArray(v) ? v[i] : v);

  function setup(el) {
    if (el.__eidosScramble) return el.__eidosScramble;
    const text = el.textContent;
    el.textContent = "";
    const shown = document.createElement("span");
    const caret = document.createElement("span");
    const rest = document.createElement("span");
    shown.className = "eidos-scramble";
    caret.className = "eidos-caret";
    caret.setAttribute("aria-hidden", "true");
    caret.style.cssText =
      "display:inline-block;width:0;height:1.05em;vertical-align:-0.16em;border-left:0.08em solid currentColor;margin-right:-0.08em";
    rest.className = "eidos-scramble-rest";
    rest.setAttribute("aria-hidden", "true");
    rest.style.visibility = "hidden";
    el.append(shown, caret, rest);
    return (el.__eidosScramble = { text, last: null, shown, caret, rest });
  }

  E.fx["text-scramble"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, text: 1, mode: 1, order: 1, glyphs: 1, bins: 1, from: 1, keep: 1, reserve: 1, window: 1, caret: 1, rate: 1, seed: 1, dur: 1, each: 1, ease: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`text-scramble: unknown option ${String(key)}`);
    const { tl } = stage;
    const mode = o.mode ?? "scramble";
    if (mode !== "scramble" && mode !== "type") fail(`text-scramble: unknown mode "${mode}" (scramble, type)`);
    const order = o.order ?? "ltr";
    if (order !== "ltr" && order !== "random") fail(`text-scramble: unknown order "${order}" (ltr, random)`);
    const els = E.$all(o.targets ?? o.target, stage.world);
    if (!els.length) fail(`text-scramble: no element for targets ${o.targets ?? o.target}`);
    const ease = typeof o.ease === "function" ? o.ease : E.ease[o.ease ?? "linear"] ?? E.ease.linear;
    const seed = (o.seed ?? 1) | 0;
    const win = Math.min(1, Math.max(0, o.window ?? 0.35));
    const keep = o.keep ?? true;
    const reserve = o.reserve ?? true;
    const caretOn = mode === "type" && (o.caret ?? true);
    const custom = o.glyphs != null ? graphemes(String(o.glyphs)) : null;
    const each = o.each ?? 0.15;
    const start = tl.resolveAt(o.at);
    let t = start;
    const items = els.map((el, n) => {
      const S = setup(el);
      const text = String(nth(o.text, n) ?? S.text);
      const from = String(nth(o.from, n) ?? S.last ?? "");
      S.last = text;
      const T = graphemes(text), F = mode === "type" ? [] : graphemes(from);
      const N = Math.max(T.length, F.length);
      const hex = looksHex(T.length ? T : F);
      const dur = o.dur ?? (mode === "type" ? Math.max(0.4, 0.055 * T.length) : 1.2);
      const bins = Math.max(4, Math.round(o.bins ?? dur * (o.rate ?? 18)));
      const rank = Array.from({ length: N }, (_, i) => i);
      if (order === "random") rank.sort((a, b) => hash(seed, a, 7919) - hash(seed, b, 7919) || a - b);
      const s0 = new Array(N), s1 = new Array(N);
      rank.forEach((i, r) => {
        const u = N > 1 ? r / (N - 1) : 0;
        s0[i] = order === "random" ? 0 : u * (1 - win);
        s1[i] = order === "random" ? win + u * (1 - win) : u * (1 - win) + win;
      });
      const glyph = (i, g, bin) => {
        const h = hash(seed, i, bin);
        return custom ? custom[h % custom.length] : pick(poolOf(g, hex), h);
      };
      // Every visible unit is a whole grapheme of the target, the source or the glyph pool;
      // not-yet-reached target graphemes go to a hidden span so the box keeps its final size.
      const frame = (x) => {
        if (E.reduced) return x >= 1 ? [text, "", false] : [from, reserve ? T.slice(graphemes(from).length).join("") : "", false];
        const e = ease(x);
        if (x >= 1 || e >= 1) return [text, "", false];
        if (mode === "type") {
          const k = Math.max(0, Math.floor(e * T.length));
          return [T.slice(0, k).join(""), reserve ? T.slice(k).join("") : "", caretOn && x > 0];
        }
        const bin = Math.floor(x * bins);
        let out = "";
        for (let i = 0; i < N; i++) {
          const g = T[i], f = F[i];
          if (keep && g != null && g === f) out += g;
          else if (e >= s1[i]) out += g ?? "";
          else if (e > s0[i]) {
            const base = g ?? f;
            out += blank(base) ? base : glyph(i, base, bin);
          } else if (f != null) out += f;
          else return [out, reserve ? T.slice(i).join("") : "", false];
        }
        return [out, "", false];
      };
      const at = t;
      tl.add(
        (x) => {
          const [shown, rest, caret] = frame(snap(x));
          S.shown.textContent = shown;
          S.rest.textContent = rest;
          S.caret.style.visibility = caret ? "visible" : "hidden";
        },
        // Zero-duration tracks distinguish future (0) from started (1), including exact onset.
        { at, dur: E.reduced ? 0 : dur, ease: lin },
      );
      t = at + dur + each;
      return { el, start: at, end: at + dur, text };
    });
    const end = items.length ? Math.max(...items.map((it) => it.end)) : start;
    tl.prevStart = start;
    tl.extend(end);
    return { start, end, items };
  };
})();
