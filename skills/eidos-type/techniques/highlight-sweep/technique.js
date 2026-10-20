(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  const r3 = E.util.r3;
  const ring = (w, h, px, py) => {
    const cx = w / 2, cy = h / 2, ry = h / 2 + py;
    const rx = w / 2 / Math.sqrt(1 - (h / 2 / ry) ** 2) + px;
    const ct = Math.cos(-0.015), st = Math.sin(-0.015);
    const n = 64, pts = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n, a = (-100 + 400 * s) * (Math.PI / 180);
      const k = 1 + 0.025 * Math.sin(2 * a + 1.1) + 0.015 * Math.sin(3 * a - 0.4);
      const x = (rx + 3 * s) * k * Math.cos(a), y = (ry + 1.8 * s) * k * Math.sin(a);
      pts.push(`${r3(cx + x * ct - y * st)} ${r3(cy + x * st + y * ct)}`);
    }
    return "M " + pts.join(" L ");
  };
  E.fx["highlight-sweep"] = (stage, o = {}) => {
    const { tl } = stage;
    const els = E.$all(o.targets ?? o.target, stage.world);
    const circle = !!o.circle;
    const dur = o.dur ?? (circle ? 0.8 : 0.55);
    const each = o.each ?? 0.12;
    const ease = o.ease ?? (circle ? "inOut" : "out");
    const color = o.color ?? (circle ? "var(--eidos-accent)" : "color-mix(in oklab, var(--eidos-accent) 32%, transparent)");
    const start = tl.resolveAt(o.at);
    const items = els.map((el, i) => {
      const at = start + i * each;
      el.style.position = "relative";
      el.style.isolation = "isolate";
      let mark;
      if (circle) {
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("class", "eidos-circle");
        svg.setAttribute("aria-hidden", "true");
        svg.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;z-index:-1;pointer-events:none";
        mark = document.createElementNS(NS, "path");
        mark.style.cssText = `fill:none;stroke:${color};stroke-width:${o.width ?? 2.5};stroke-linecap:round;stroke-linejoin:round`;
        svg.appendChild(mark);
        el.appendChild(svg);
        stage.onLayout(() => {
          const r = svg.getBoundingClientRect();
          const fs = parseFloat(getComputedStyle(el).fontSize);
          const ry = r.height / 2 + fs * 0.6;
          const rx = r.width / 2 / Math.sqrt(1 - (r.height / 2 / ry) ** 2) + fs * 0.15;
          const room = `${r3(Math.max(0, rx * 1.05 - r.width / 2 + 3))}px`;
          el.style.marginLeft = room;
          el.style.marginRight = room;
          mark.setAttribute("d", ring(r.width, r.height, fs * 0.15, fs * 0.6));
        });
        tl.tween(mark, { draw: [0, 1], opacity: (p) => (p > 0 ? 1 : 0) }, { at, dur, ease });
      } else {
        mark = document.createElement("span");
        mark.className = "eidos-sweep";
        mark.setAttribute("aria-hidden", "true");
        mark.style.cssText = `position:absolute;left:-0.15em;right:-0.15em;top:0.1em;bottom:-0.02em;border-radius:0.22em;background:${color};z-index:-1;transform-origin:left center;pointer-events:none`;
        el.insertBefore(mark, el.firstChild);
        const props = { scaleX: [0, 1] };
        if (o.tilt) props.rotate = o.tilt;
        tl.tween(mark, props, { at, dur, ease });
      }
      return { el, mark, start: at, end: at + dur };
    });
    return { start, end: items.length ? items[items.length - 1].end : start, items };
  };
})();
