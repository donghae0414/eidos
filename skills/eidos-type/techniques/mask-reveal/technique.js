(() => {
  const E = window.Eidos;
  const r3 = E.util.r3;
  const expo = E.bezier(0.16, 1, 0.3, 1);
  const clip = (dir, v) =>
    dir === "left" ? `inset(0 0 0 ${v}%)` : dir === "down" ? `inset(0 0 ${v}% 0)` : dir === "up" ? `inset(${v}% 0 0 0)` : `inset(0 ${v}% 0 0)`;
  E.fx["mask-reveal"] = (stage, o = {}) => {
    const { tl } = stage;
    const lines = E.$all(o.targets ?? o.target, stage.world);
    const mode = o.mode ?? "slide";
    const dir = o.dir ?? (mode === "wipe" ? "right" : "up");
    const dur = o.dur ?? (mode === "wipe" ? 0.6 : 0.8);
    const each = o.each ?? 0.14;
    const ease = o.ease ?? expo;
    const start = tl.resolveAt(o.at);
    const items = lines.map((line, i) => {
      const at = start + i * each;
      const inline = getComputedStyle(line).display === "inline";
      if (inline) line.style.display = "inline-block";
      if (mode === "wipe") {
        tl.tween(line, { style: (p) => ({ clipPath: clip(dir, r3((1 - p) * 100)) }) }, { at, dur, ease });
      } else {
        const wrap = document.createElement(inline ? "span" : "div");
        wrap.className = "eidos-mask";
        wrap.style.cssText = `display:${inline ? "inline-block" : "block"};overflow:hidden;vertical-align:bottom;padding:0.1em 0.12em 0.16em;margin:-0.1em -0.12em -0.16em`;
        line.parentNode.insertBefore(wrap, line);
        wrap.appendChild(line);
        const sign = dir === "down" ? -1 : 1;
        tl.tween(line, { style: (p) => ({ transform: `translateY(${r3(sign * (1 - p) * 120)}%)` }) }, { at, dur, ease });
      }
      return { el: line, start: at, end: at + dur };
    });
    return { start, end: items.length ? items[items.length - 1].end : start, items };
  };
})();
