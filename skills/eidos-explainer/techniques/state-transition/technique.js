(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  E.fx["state-transition"] = (stage, o = {}) => {
    const { tl } = stage;
    const { r3 } = E.util;
    const root = E.$all(o.el, stage.world)[0];
    const portrait = matchMedia("(max-aspect-ratio: 1/1)").matches;
    root.style.position = "relative";

    const svg = document.createElementNS(NS, "svg");
    svg.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none";
    root.appendChild(svg);

    const nodes = new Map();
    for (const s of o.states ?? []) {
      const el = document.createElement("div");
      el.className = "eidos-state eidos-card";
      el.dataset.state = s.id;
      el.style.cssText = "position:absolute;padding:0.65rem 1.1rem;font-weight:600;font-size:clamp(0.82rem,1.7vw,1.2rem);white-space:nowrap;z-index:1";
      el.textContent = s.label;
      if (s.kind === "end") el.style.borderStyle = "double";
      const glow = document.createElement("span");
      glow.style.cssText = "position:absolute;inset:-2px;border:2px solid var(--eidos-accent);border-radius:inherit;background:color-mix(in oklch,var(--eidos-accent) 14%,transparent);pointer-events:none";
      el.appendChild(glow);
      root.appendChild(el);
      nodes.set(s.id, { s, el, glow });
    }

    const edges = (o.edges ?? []).map((e) => {
      const base = document.createElementNS(NS, "path");
      base.style.cssText = `fill:none;stroke:${e.tone === "danger" ? "var(--eidos-danger)" : "var(--eidos-border)"};stroke-width:1.8;${e.tone === "danger" ? "stroke-dasharray:5 5" : ""}`;
      const tip = document.createElementNS(NS, "path");
      tip.style.cssText = `fill:${e.tone === "danger" ? "var(--eidos-danger)" : "var(--eidos-muted-fg)"}`;
      const hot = document.createElementNS(NS, "path");
      hot.style.cssText = "fill:none;stroke:var(--eidos-accent);stroke-width:3;stroke-linecap:round";
      svg.append(base, tip, hot);
      let label = null;
      if (e.label) {
        label = document.createElement("div");
        label.textContent = e.label;
        label.style.cssText = `position:absolute;left:0;top:0;font-size:clamp(0.68rem,1.25vw,0.92rem);white-space:nowrap;color:${e.tone === "danger" ? "var(--eidos-danger)" : "var(--eidos-muted-fg)"};background:var(--eidos-bg);padding:0 4px`;
        root.appendChild(label);
      }
      return { e, base, tip, hot, label };
    });
    const edgeOf = (a, b) => edges.find((x) => x.e.from === a && x.e.to === b);

    const dot = document.createElement("div");
    dot.style.cssText = "position:absolute;left:0;top:0;width:14px;height:14px;border-radius:50%;background:var(--eidos-accent);box-shadow:0 0 0 4px color-mix(in oklch,var(--eidos-accent) 25%,transparent);z-index:2";
    root.appendChild(dot);

    const edgePoint = (b, a) => {
      const dx = b.cx - a.cx, dy = b.cy - a.cy;
      const t = Math.min(Math.abs(a.w / 2 / (dx || 1e-9)), Math.abs(a.h / 2 / (dy || 1e-9)));
      return { x: a.cx + dx * t, y: a.cy + dy * t };
    };

    stage.onLayout(() => {
      const W = root.clientWidth, H = root.clientHeight;
      const box = new Map();
      for (const [id, n] of nodes) {
        const px = (portrait ? n.s.px ?? n.s.x : n.s.x) / 100, py = (portrait ? n.s.py ?? n.s.y : n.s.y) / 100;
        const w = n.el.offsetWidth, h = n.el.offsetHeight;
        n.el.style.left = `${r3(px * W - w / 2)}px`;
        n.el.style.top = `${r3(py * H - h / 2)}px`;
        box.set(id, { cx: px * W, cy: py * H, w: w + 8, h: h + 8 });
      }
      for (const x of edges) {
        const a = box.get(x.e.from), b = box.get(x.e.to);
        const p0 = edgePoint(b, a), p1 = edgePoint(a, b);
        const d = `M ${r3(p0.x)} ${r3(p0.y)} L ${r3(p1.x)} ${r3(p1.y)}`;
        x.base.setAttribute("d", d);
        x.hot.setAttribute("d", d);
        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x), c = Math.cos(ang), s = Math.sin(ang);
        x.tip.setAttribute("d", `M ${r3(p1.x)} ${r3(p1.y)} L ${r3(p1.x - 9 * c + 5 * s)} ${r3(p1.y - 9 * s - 5 * c)} L ${r3(p1.x - 9 * c - 5 * s)} ${r3(p1.y - 9 * s + 5 * c)} Z`);
        if (x.label) {
          x.label.style.left = `${r3((p0.x + p1.x) / 2 - x.label.offsetWidth / 2)}px`;
          x.label.style.top = `${r3((p0.y + p1.y) / 2 - x.label.offsetHeight - 4)}px`;
        }
      }
    });

    const start = tl.resolveAt(o.at);
    const all = [...nodes.values()];
    tl.stagger(all.map((n) => n.el), { opacity: [0, 1], scale: [0.92, 1] }, { at: start, dur: 0.35, each: 0.06, ease: "out" });
    tl.tween(edges.flatMap((x) => [x.base, x.tip, x.label].filter(Boolean)), { opacity: [0, 1] }, { at: start + 0.3, dur: 0.5 });
    tl.tween(edges.map((x) => x.hot), { opacity: [0, 0] }, { at: start, dur: 0 });
    tl.tween(all.map((n) => n.glow), { opacity: [0, 0] }, { at: start, dur: 0 });
    tl.extend(start + 0.3 + 0.5);

    const walk = o.walk ?? [];
    const captions = o.captions ?? [];
    const half = 7;
    const pos = (hot) => (p) => {
      const len = hot.getTotalLength();
      return hot.getPointAtLength(len * p);
    };
    if (walk.length) {
      const first = nodes.get(walk[0]);
      const at = tl.end;
      tl.tween(first.glow, { opacity: [0, 1] }, { at, dur: 0.35 });
      const n0 = edgeOf(walk[0], walk[1]) ?? null;
      tl.tween(dot, {
        opacity: [0, 1],
        x: () => (n0 ? pos(n0.hot)(0).x : 0) - half,
        y: () => (n0 ? pos(n0.hot)(0).y : 0) - half,
      }, { at, dur: 0.35 });
      tl.extend(at + 0.35);
      if (captions[0] != null) tl.stop(captions[0]);
    }
    for (let i = 0; i < walk.length - 1; i++) {
      const x = edgeOf(walk[i], walk[i + 1]);
      if (!x) throw new Error(`state-transition: no edge ${walk[i]} -> ${walk[i + 1]}`);
      const at = tl.end;
      const d = o.dur ?? 1.0;
      const at2 = pos(x.hot);
      tl.tween(x.hot, { opacity: [1, 1], draw: [0, 1] }, { at, dur: d, ease: "inOut" });
      tl.tween(dot, { x: (p) => at2(p).x - half, y: (p) => at2(p).y - half }, { at, dur: d, ease: "inOut" });
      tl.tween(nodes.get(walk[i]).glow, { opacity: [1, 0] }, { at: at + d * 0.2, dur: 0.3 });
      tl.tween(nodes.get(walk[i + 1]).glow, { opacity: [0, 1] }, { at: at + d * 0.8, dur: 0.3 });
      tl.tween(x.hot, { opacity: [1, 0.35] }, { at: at + d + 0.3, dur: 0.01 });
      tl.extend(at + d + 0.3);
      if (captions[i + 1] != null) tl.stop(captions[i + 1]);
    }
    return { start, end: tl.end, edge: edgeOf, node: (id) => nodes.get(id)?.el, glow: (id) => nodes.get(id)?.glow, dot };
  };
})();
