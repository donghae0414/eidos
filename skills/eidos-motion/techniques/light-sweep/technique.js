(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const { r3 } = E.util;
  const lin = (p) => p;
  // A stop at a tween's end sees x = ((at + dur) - at) / dur, which floats can leave a hair under 1.
  const snap = (x) => (x > 1 - 1e-9 ? 1 : x < 1e-9 ? 0 : x);
  // On a 250%-wide gradient, background-position 130% puts the stripe left of the box and -30% right of it.
  // Text mode repeats the tile along x so the currentColor ends always cover the glyphs (tiles are 2.5x the box, one stripe shows).
  const FROM = 130, TO = -30;

  E.fx["light-sweep"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, mode: 1, dur: 1, each: 1, ease: 1, angle: 1, width: 1, color: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`light-sweep: unknown option ${String(key)}`);
    const { tl } = stage;
    const mode = o.mode ?? "box";
    if (mode !== "box" && mode !== "text") fail(`light-sweep: unknown mode "${mode}" (box, text)`);
    const els = E.$all(o.targets ?? o.target, stage.world);
    if (!els.length) fail(`light-sweep: no element for targets ${o.targets ?? o.target}`);
    const dur = o.dur ?? 0.9;
    const each = o.each ?? 0.12;
    const ease = typeof o.ease === "function" ? o.ease : E.ease[o.ease ?? "inOut"] ?? E.ease.inOut;
    const angle = o.angle ?? 105;
    const w = (o.width ?? (mode === "text" ? 10 : 12)) / 2;
    const glint = o.color ?? (mode === "text" ? "var(--eidos-accent)" : "color-mix(in oklab, var(--eidos-accent) 30%, transparent)");
    const start = tl.resolveAt(o.at);
    const items = els.map((el, k) => {
      const at = start + k * each;
      if (!E.reduced) {
        let layer = el;
        if (mode === "text") {
          el.style.backgroundImage = `linear-gradient(${angle}deg, currentColor ${50 - w}%, ${glint} 50%, currentColor ${50 + w}%)`;
          el.style.backgroundSize = "250% 100%";
          el.style.backgroundRepeat = "repeat-x";
          el.style.webkitBackgroundClip = "text";
          el.style.backgroundClip = "text";
          el.style.webkitTextFillColor = "transparent";
        } else {
          if (getComputedStyle(el).position === "static") el.style.position = "relative";
          layer = document.createElement("span");
          layer.className = "eidos-glint";
          layer.setAttribute("aria-hidden", "true");
          layer.style.cssText =
            `position:absolute;inset:0;z-index:1;border-radius:inherit;pointer-events:none;` +
            `background:linear-gradient(${angle}deg, transparent ${50 - w}%, ${glint} 50%, transparent ${50 + w}%) 0 0 / 250% 100% no-repeat`;
          el.appendChild(layer);
        }
        tl.add(
          (x) => {
            const p = snap(x);
            layer.style.backgroundPosition = `${r3(FROM + (TO - FROM) * (p <= 0 ? 0 : p >= 1 ? 1 : ease(p)))}% 0%`;
          },
          { at, dur, ease: lin },
        );
      }
      return { el, start: at, end: at + dur };
    });
    const end = items.length ? items[items.length - 1].end : start;
    tl.prevStart = start;
    tl.extend(end);
    return { start, end, items };
  };
})();
