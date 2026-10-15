(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  E.fx["chart-grow"] = (stage, o = {}) => {
    const { tl } = stage;
    const el = E.$all(o.el, stage.world)[0];
    const categories = o.categories;
    const values = o.values;
    const kind = o.kind ?? "bar";
    if (!el || !Array.isArray(categories) || !Array.isArray(values) || !values.length ||
        categories.length !== values.length || values.some((v) => !Number.isFinite(v) || v < 0) ||
        !["bar", "line"].includes(kind)) throw new Error("chart-grow: el, kind and matching non-negative data are required");
    const peak = Math.max(...values);
    const max = o.max ?? Math.max(1, Math.ceil(peak / 4) * 4);
    if (!Number.isFinite(max) || max <= 0 || max < peak) throw new Error("chart-grow: max must be positive and cover all values");
    const start = tl.resolveAt(o.at);
    const dur = o.dur ?? 1.2;
    const each = o.each ?? 0.12;
    const color = o.color ?? "var(--eidos-cat-1)";
    const unit = o.unit ?? "";
    const fmt = (v) => v.toLocaleString("ko-KR", { maximumFractionDigits: 2 }) + unit;
    const make = (tag, attrs, parent) => {
      const node = document.createElementNS(NS, tag);
      for (const key in attrs) node.setAttribute(key, attrs[key]);
      parent.appendChild(node);
      return node;
    };
    const svg = make("svg", { viewBox: "0 0 600 320", preserveAspectRatio: "xMidYMid meet", role: "img" }, el);
    svg.style.cssText = "display:block;width:100%;height:auto;font-family:var(--eidos-font-sans);font-variant-numeric:tabular-nums";
    const title = make("title", {}, svg);
    title.textContent = categories.map((c, i) => `${c}: ${fmt(values[i])}`).join(", ");
    const text = (x, y, value, parent = svg, anchor = "middle") => {
      const node = make("text", { x, y, fill: "var(--eidos-fg)", "font-size": 22, "text-anchor": anchor }, parent);
      node.textContent = value;
      return node;
    };
    for (let i = 0; i <= 4; i++) {
      const y = 264 - i * 54;
      make("path", { d: `M 76 ${y} H 574`, fill: "none", stroke: "var(--eidos-border)" }, svg);
      text(64, y + 7, fmt(max * i / 4), svg, "end");
    }
    make("path", { d: "M 76 48 V 264 H 574", fill: "none", stroke: "var(--eidos-muted-fg)" }, svg);
    const coords = values.map((v, i) => ({
      x: kind === "bar" ? 76 + (i + 0.5) * 498 / values.length : 92 + i * 466 / Math.max(1, values.length - 1),
      y: 264 - v / max * 216,
    }));
    categories.forEach((c, i) => text(coords[i].x, 304, c));
    const series = make("g", { class: "eidos-chart-series" }, svg);
    const points = [];
    const items = [];
    let end = start;
    if (kind === "bar") {
      coords.forEach((pt, i) => {
        const width = 498 / values.length * 0.58;
        const bar = make("rect", { x: pt.x - width / 2, y: pt.y, width, height: 264 - pt.y, rx: 3, fill: color }, series);
        const at = start + i * each;
        tl.tween(bar, { attr: (p) => ({ y: 264 - (264 - pt.y) * p, height: (264 - pt.y) * p }) }, { at, dur, ease: "out" });
        const label = text(pt.x, pt.y - 12, fmt(values[i]), series);
        tl.tween(label, { opacity: [0, 1] }, { at: at + dur * 0.8, dur: dur * 0.2, ease: "out" });
        points.push(bar);
        items.push({ el: bar, label, start: at, end: at + dur });
        end = at + dur;
      });
    } else {
      const path = make("path", { d: coords.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" "), fill: "none", stroke: color, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, series);
      tl.tween(path, { draw: [0, 1] }, { at: start, dur, ease: "linear" });
      const distances = [0];
      coords.slice(1).forEach((p, i) => distances.push(distances[i] + Math.hypot(p.x - coords[i].x, p.y - coords[i].y)));
      const length = distances[distances.length - 1];
      coords.forEach((pt, i) => {
        const dot = make("circle", { cx: pt.x, cy: pt.y, r: 5, fill: color }, series);
        const label = text(pt.x, pt.y - 15, fmt(values[i]), series);
        const at = start + (length ? distances[i] / length : 0) * dur;
        tl.tween(dot, { opacity: [0, 1], scale: [0.5, 1] }, { at, dur: 0.2, ease: "out" });
        tl.tween(label, { opacity: [0, 1] }, { at, dur: 0.2, ease: "out" });
        points.push(dot);
        items.push({ el: dot, label, start: at, end: at + 0.2 });
      });
      end = start + dur + 0.2;
    }
    tl.extend(end);
    return { start, end, svg, points, items };
  };
})();
