(() => {
  const E = window.Eidos;
  // Text colour that reads on each dip colour; anything else falls back to the accent foreground.
  const ON = { fg: "bg", "surface-fg": "bg", bg: "fg", surface: "fg", "fill-warm": "fg", "fill-cool": "fg", border: "fg" };
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  // A transition never takes 0 s: a 0 s track starting at the previous stop's time would already
  // be applied (p = 1) while the viewer is parked on that stop, showing the next scene too early.
  const FRAME = 1 / 60;
  const durOf = (v) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) fail(`dip-to-color: dur must be a finite number >= 0 (got ${JSON.stringify(v)})`);
    return Math.max(v, FRAME);
  };
  // Own keys only: inherited names such as "constructor" must not pass as an ease.
  const easeOf = (e) =>
    typeof e === "function" ? e
      : typeof e === "string" && Object.hasOwn(E.ease, e) ? E.ease[e]
        : fail(`dip-to-color: ease must be a function or one of ${Object.keys(E.ease).join(", ")} (got ${JSON.stringify(e)})`);

  E.fx["dip-to-color"] = (stage, o = {}) => {
    const { tl, world } = stage;
    const { r3, clamp01 } = E.util;
    const color = o.color ?? "fg";
    if (typeof color !== "string" || !/^[a-z0-9-]+$/.test(color) || !getComputedStyle(document.documentElement).getPropertyValue(`--eidos-${color}`).trim()) {
      fail(`dip-to-color: color must name an --eidos-* token such as "fg", "accent" or "cat-4" (got ${JSON.stringify(o.color)})`);
    }
    if (o.title != null && (typeof o.title !== "string" || !o.title.trim())) fail(`dip-to-color: title must be a non-empty string (got ${JSON.stringify(o.title)})`);
    const dur = durOf(o.dur ?? (o.title ? 2 : 1.2));
    const hold = o.hold ?? (o.title ? 0.4 : 0.15);
    if (!Number.isFinite(hold) || hold < 0 || hold >= 1) fail(`dip-to-color: hold must be a fraction in [0, 1) (got ${JSON.stringify(o.hold)})`);
    const ease = easeOf(o.ease ?? "inOut");
    const start = tl.resolveAt(o.at);
    const at = { at: start, dur, ease: "linear" };
    const a = (1 - hold) / 2, b = a + hold; // fade in [0, a], hold [a, b], fade out [b, 1]
    const mid = (a + b) / 2;

    const veil = document.createElement("div");
    veil.className = "eidos-fx-dip-to-color";
    veil.setAttribute("aria-hidden", "true");
    Object.assign(veil.style, {
      position: "absolute", inset: "0", pointerEvents: "none", visibility: "hidden", background: `var(--eidos-${color})`,
      display: "grid", placeItems: "center", padding: "8vw",
    });
    let title = null;
    if (o.title) {
      title = document.createElement("div");
      title.textContent = o.title;
      Object.assign(title.style, {
        color: `var(--eidos-${Object.hasOwn(ON, color) ? ON[color] : "accent-fg"})`, fontWeight: "700", fontSize: "clamp(28px, 5.2vw, 64px)",
        lineHeight: "1.2", textAlign: "center", wordBreak: "keep-all", letterSpacing: "-0.01em",
      });
      veil.append(title);
    }
    world.after(veil);

    const cover = (p) => (p <= 0 || p >= 1 ? 0 : p < a ? ease(p / a) : p <= b ? 1 : 1 - ease((p - b) / (1 - b)));
    tl.tween(veil, { style: (p) => { const c = cover(p); return { visibility: c > 0 ? "visible" : "hidden", opacity: String(r3(c)) }; } }, at);
    if (title) {
      // Title reads only while the colour fully covers the frame.
      const span = Math.max(hold, 1e-6);
      tl.tween(title, {
        opacity: (p) => (p <= a || p >= b ? 0 : Math.min(1, ((p - a) / span) * 4, ((b - p) / span) * 4)),
        y: (p) => (E.reduced ? 0 : r3(10 * (1 - E.ease.out(clamp01((p - a) / span))))),
      }, at);
    }
    if (o.from) tl.tween(o.from, { opacity: (p) => (p < mid ? 1 : 0) }, at);
    if (o.to) tl.tween(o.to, { opacity: (p) => (p >= mid ? 1 : 0) }, at);
    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
  E.fx["dip-to-color"].kind = "transition";
})();
