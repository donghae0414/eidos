(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const { r3 } = E.util;
  const PLACES = ["after", "below"];
  const DIM_DUR = 0.25;
  const RISE_DUR = 0.3;
  const LIFT_PX = 12;

  // The strike is a positioned span inside the old phrase, so it follows the text's own box in any font size;
  // only its scaleX moves. The old phrase keeps its glyphs and only loses color, so what changed stays readable.
  E.fx["strikethrough-replace"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, to: 1, place: 1, dur: 1, gap: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`strikethrough-replace: unknown option ${String(key)}`);
    if (o.to == null) fail("strikethrough-replace: option to is required (the new phrase element)");
    const place = o.place ?? "after";
    if (!PLACES.includes(place)) fail(`strikethrough-replace: unknown place "${place}" (after, below)`);
    const dur = o.dur ?? 0.45;
    const gap = o.gap ?? 0.15;
    if (!(Number.isFinite(dur) && dur >= 0)) fail(`strikethrough-replace: dur must be a number >= 0, got ${String(o.dur)}`);
    if (!(Number.isFinite(gap) && gap >= 0)) fail(`strikethrough-replace: gap must be a number >= 0, got ${String(o.gap)}`);
    const { tl } = stage;
    const olds = E.$all(o.targets ?? o.target, stage.world);
    if (!olds.length) fail(`strikethrough-replace: no element for targets ${o.targets ?? o.target}`);
    const news = E.$all(o.to, stage.world);
    if (news.length !== olds.length) fail(`strikethrough-replace: to matched ${news.length} element(s) for ${olds.length} target(s)`);
    const start = tl.resolveAt(o.at);
    const struck = start + dur;
    const end = struck + gap + RISE_DUR;
    const items = olds.map((el, i) => {
      const to = news[i];
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      const mark = document.createElement("span");
      mark.className = "eidos-strike";
      mark.setAttribute("aria-hidden", "true");
      mark.style.cssText =
        "position:absolute;left:-0.08em;right:-0.08em;top:50%;height:max(2px, 0.1em);margin-top:calc(max(2px, 0.1em) / -2);border-radius:1px;background:var(--eidos-fg);transform-origin:left center;pointer-events:none";
      el.appendChild(mark);
      if (place === "below") {
        to.style.display = "block";
        to.style.marginTop = "0.2em";
      } else {
        to.style.display = "inline-block";
        to.style.marginLeft = "0.5em";
      }
      // Read once at build time so the mix stays a pure function of p (QA determinism); p = 0 clears the inline color.
      const from = getComputedStyle(el).color;
      const dim = (p) => ({
        color: p >= 1 ? "var(--eidos-muted-fg)" : E.reduced || p <= 0 ? "" : `color-mix(in oklab, var(--eidos-muted-fg) ${r3(100 * p)}%, ${from})`,
      });
      if (E.reduced) tl.tween(mark, { opacity: [0, 1] }, { at: start, dur, ease: "linear" });
      else tl.tween(mark, { scaleX: [0, 1] }, { at: start, dur, ease: "inOut" });
      tl.tween(el, { style: dim }, { at: struck, dur: DIM_DUR, ease: "out" });
      tl.tween(to, E.reduced ? { opacity: [0, 1] } : { opacity: [0, 1], y: [LIFT_PX, 0] }, { at: struck + gap, dur: RISE_DUR, ease: "out" });
      return { el, to, mark, start, end };
    });
    tl.prevStart = start;
    return { start, end, items };
  };
  E.fx["strikethrough-replace"].kind = "technique";
})();
