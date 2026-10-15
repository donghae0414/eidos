(() => {
  const E = window.Eidos;
  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };

  E.fx["graph-build"] = (stage, o = {}) => {
    const { tl } = stage;
    const container = E.$all(o.el, stage.world)[0];
    const portrait = matchMedia("(max-aspect-ratio: 1/1)").matches;
    const nodes = (o.nodes ?? []).map((data) => {
      const el = document.createElement("article");
      el.className = "eidos-graph-node eidos-card";
      const pos = portrait ? data.portrait ?? data.pos : data.pos;
      el.style.cssText = `position:absolute;left:${pos[0]}%;top:${pos[1]}%`;
      const label = document.createElement("b");
      label.textContent = data.label;
      const detail = document.createElement("span");
      detail.textContent = data.detail ?? "";
      el.append(label, detail);
      container.appendChild(el);
      return { ...data, el };
    });
    const svg = svgEl("svg", { "aria-hidden": "true" });
    svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none";
    stage.world.insertBefore(svg, stage.world.firstChild);
    const edges = (o.edges ?? []).map(([from, to]) => {
      const group = svgEl("g");
      const path = svgEl("path");
      path.style.cssText = "fill:none;stroke:var(--eidos-muted-fg);stroke-width:2;stroke-linecap:round";
      const head = svgEl("path");
      head.style.fill = "var(--eidos-muted-fg)";
      group.append(path, head);
      svg.appendChild(group);
      const a = nodes.find((n) => n.id === from).el;
      const b = nodes.find((n) => n.id === to).el;
      stage.onLayout(() => {
        const ar = stage.measure(a), br = stage.measure(b);
        const dx = br.x + br.w / 2 - ar.x - ar.w / 2;
        const dy = br.y + br.h / 2 - ar.y - ar.h / 2;
        const vertical = portrait || Math.abs(dy) > Math.abs(dx);
        const sign = (vertical ? dy : dx) >= 0 ? 1 : -1;
        const ux = vertical ? 0 : sign, uy = vertical ? sign : 0;
        const x0 = ar.x + ar.w / 2 + ux * (ar.w / 2 + 5);
        const y0 = ar.y + ar.h / 2 + uy * (ar.h / 2 + 5);
        const x1 = br.x + br.w / 2 - ux * (br.w / 2 + 5);
        const y1 = br.y + br.h / 2 - uy * (br.h / 2 + 5);
        const k = Math.max(Math.abs(vertical ? y1 - y0 : x1 - x0) * 0.5, 16);
        const x = x1 - ux * 7, y = y1 - uy * 7;
        path.setAttribute("d", `M ${x0} ${y0} C ${x0 + ux * k} ${y0 + uy * k} ${x - ux * k} ${y - uy * k} ${x} ${y}`);
        head.setAttribute("d", `M ${x1} ${y1} L ${x1 - ux * 8 - uy * 4} ${y1 - uy * 8 + ux * 4} L ${x1 - ux * 8 + uy * 4} ${y1 - uy * 8 - ux * 4} Z`);
      });
      return { from, to, group, path, head };
    });
    const start = tl.resolveAt(o.at);
    tl.stagger(nodes.map((n) => n.el), { opacity: [0, 1] }, { at: start, dur: o.dur ?? 0.45, each: o.each ?? 0.1, ease: "out" });
    const end = tl.end;
    return {
      start, end, nodes, edges,
      connect(r = {}) {
        const at = tl.resolveAt(r.at), dur = r.dur ?? 0.6;
        edges.forEach(({ path, head }, i) => {
          const t = at + i * (r.each ?? 0.12);
          tl.tween(path, { draw: [0, 1] }, { at: t, dur });
          tl.tween(head, { opacity: [0, 1] }, { at: t + dur * 0.85, dur: dur * 0.15 });
        });
        return { start: at, end: tl.end };
      },
      highlight(ids, r = {}) {
        const at = tl.resolveAt(r.at), dur = r.dur ?? 0.6;
        const dimTo = r.dimTo ?? 0.28;
        nodes.forEach(({ id, el }) => {
          const selected = ids.includes(id);
          tl.tween(el, {
            opacity: [1, selected ? 1 : dimTo],
            style: (p) => ({ borderColor: selected ? `color-mix(in oklch, var(--eidos-accent) ${p * 100}%, var(--eidos-border))` : "var(--eidos-border)" }),
          }, { at, dur });
        });
        edges.forEach(({ from, to, group, path, head }) => {
          const i = ids.indexOf(from);
          const selected = i >= 0 && ids[i + 1] === to;
          tl.tween(group, { opacity: [1, selected ? 1 : dimTo] }, { at, dur });
          const color = (p) => `color-mix(in oklch, var(--eidos-accent) ${selected ? p * 100 : 0}%, var(--eidos-muted-fg))`;
          tl.tween(path, { style: (p) => ({ stroke: color(p) }) }, { at, dur });
          tl.tween(head, { style: (p) => ({ fill: color(p) }) }, { at, dur });
        });
        return { start: at, end: tl.end };
      },
    };
  };
})();
