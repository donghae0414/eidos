(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  const r3 = E.util.r3;
  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  const anchors = (a, b, gap) => {
    const dx = b.x + b.w / 2 - (a.x + a.w / 2);
    const dy = b.y + b.h / 2 - (a.y + a.h / 2);
    if (Math.abs(dx) >= Math.abs(dy)) {
      const s = dx >= 0 ? 1 : -1;
      return {
        p0: { x: s > 0 ? a.x + a.w + gap : a.x - gap, y: a.y + a.h / 2 },
        p1: { x: s > 0 ? b.x - gap : b.x + b.w + gap, y: b.y + b.h / 2 },
        dir: { x: s, y: 0 },
      };
    }
    const s = dy >= 0 ? 1 : -1;
    return {
      p0: { x: a.x + a.w / 2, y: s > 0 ? a.y + a.h + gap : a.y - gap },
      p1: { x: b.x + b.w / 2, y: s > 0 ? b.y - gap : b.y + b.h + gap },
      dir: { x: 0, y: s },
    };
  };
  const wave = (w, h) =>
    `M ${r3(w * 0.02)} ${r3(h * 0.72)} Q ${r3(w * 0.28)} ${r3(h * 0.05)} ${r3(w * 0.52)} ${r3(h * 0.6)} T ${r3(w * 0.98)} ${r3(h * 0.45)}`;

  E.fx["path-drawing"] = (stage, o = {}) => {
    const { tl } = stage;
    const dur = o.dur ?? 0.7;
    const each = o.each ?? dur * 0.9;
    const lead = o.lead ?? 0.3;
    const ease = o.ease ?? "inOut";
    const gap = o.gap ?? 6;
    const curve = o.curve ?? 0.5;
    const head = o.head ?? "arrow";
    const size = o.headSize ?? 8;
    const reveal = o.reveal ?? "to";
    const links = (o.links ?? []).map((l) => (Array.isArray(l) ? { from: l[0], to: l[1] } : l));
    let svg = o.svg ? E.$all(o.svg, stage.world)[0] : null;
    if (links.length && !svg) {
      svg = svgEl("svg", { class: "eidos-links", "aria-hidden": "true" });
      svg.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none";
      stage.world.insertBefore(svg, stage.world.firstChild);
    }
    const show = (el, at) => {
      tl.tween(el, { opacity: [0, 1], y: [8, 0] }, { at, dur: 0.35, ease: "out" });
      el.__eidosShown = true;
    };
    const start = tl.resolveAt(o.at);
    let t = start;
    const items = [];
    const draw = (path, mark) => {
      tl.tween(path, { draw: [0, 1], opacity: (p) => (p > 0 ? 1 : 0) }, { at: t, dur, ease });
      if (mark) tl.tween(mark, { opacity: [0, 1], scale: [0.4, 1] }, { at: t + dur * 0.85, dur: 0.25, ease: "pop" });
      items.push({ path, head: mark, start: t, end: t + dur });
    };
    for (const L of links) {
      const fromEl = E.$all(L.from, stage.world), toEl = E.$all(L.to, stage.world);
      const color = L.stroke ?? o.stroke ?? "var(--eidos-fg)";
      const h = L.head ?? head;
      const path = svgEl("path", { class: "eidos-link" });
      path.style.cssText = `fill:none;stroke:${color};stroke-width:${L.width ?? o.width ?? 2};stroke-linecap:round;stroke-linejoin:round`;
      svg.appendChild(path);
      let mark = null;
      if (h === "arrow" || h === "dot") {
        mark = svgEl(h === "arrow" ? "path" : "circle", { class: "eidos-link-head" });
        if (h === "dot") mark.setAttribute("r", r3(size / 2));
        mark.style.cssText = `fill:${color};stroke:none`;
        svg.appendChild(mark);
      }
      stage.onLayout(() => {
        const { p0, p1, dir } = anchors(stage.measure(fromEl), stage.measure(toEl), gap);
        const trim = h === "arrow" ? size * 0.8 : h === "dot" ? size * 0.3 : 0;
        const e = { x: p1.x - dir.x * trim, y: p1.y - dir.y * trim };
        const k = Math.max(Math.abs(dir.x ? e.x - p0.x : e.y - p0.y) * curve, 16);
        path.setAttribute("d", `M ${r3(p0.x)} ${r3(p0.y)} C ${r3(p0.x + dir.x * k)} ${r3(p0.y + dir.y * k)} ${r3(e.x - dir.x * k)} ${r3(e.y - dir.y * k)} ${r3(e.x)} ${r3(e.y)}`);
        if (h === "arrow") {
          const bx = p1.x - dir.x * size, by = p1.y - dir.y * size, nx = -dir.y * size * 0.5, ny = dir.x * size * 0.5;
          mark.setAttribute("d", `M ${r3(p1.x)} ${r3(p1.y)} L ${r3(bx + nx)} ${r3(by + ny)} L ${r3(bx - nx)} ${r3(by - ny)} Z`);
        } else if (h === "dot") {
          mark.setAttribute("cx", r3(p1.x));
          mark.setAttribute("cy", r3(p1.y));
        }
      });
      if (reveal === "all") {
        const fresh = fromEl.filter((el) => !el.__eidosShown);
        if (fresh.length) {
          for (const el of fresh) show(el, t);
          t += lead;
        }
      }
      draw(path, mark);
      if (reveal) for (const el of toEl) if (!el.__eidosShown) show(el, t + dur * 0.65);
      t += each;
    }
    for (const el of E.$all(o.underline, stage.world)) {
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      const box = svgEl("svg", { class: "eidos-underline", "aria-hidden": "true" });
      box.style.cssText = "position:absolute;left:-2%;bottom:-0.32em;width:104%;height:0.5em;overflow:visible;pointer-events:none";
      const path = svgEl("path");
      path.style.cssText = `fill:none;stroke:${o.stroke ?? "var(--eidos-accent)"};stroke-width:${o.width ?? 3};stroke-linecap:round;stroke-linejoin:round`;
      box.appendChild(path);
      el.appendChild(box);
      stage.onLayout(() => {
        const r = box.getBoundingClientRect();
        path.setAttribute("d", wave(r.width, r.height));
      });
      draw(path, null);
      t += each;
    }
    for (const path of E.$all(o.paths, stage.world)) {
      draw(path, null);
      t += each;
    }
    const end = items.length ? Math.max(...items.map((x) => x.end)) : start;
    tl.extend(end);
    return { start, end, items };
  };
})();
