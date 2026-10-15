(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  E.fx["chart-annotate"] = (stage, o = {}) => {
    const { tl, world } = stage;
    const target = E.$all(o.target, world)[0];
    const slot = E.$all(o.slot, world)[0];
    if (!target || typeof o.text !== "string") throw new Error("chart-annotate: target and text are required");
    const start = tl.resolveAt(o.at);
    const dur = o.dur ?? 0.9;
    const end = start + dur;
    const color = o.color ?? "var(--eidos-cat-4)";
    const layer = document.createElementNS(NS, "svg");
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:2";
    world.appendChild(layer);
    const line = document.createElementNS(NS, "path");
    line.style.cssText = `fill:none;stroke:${color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round`;
    layer.appendChild(line);
    const marker = document.createElementNS(NS, "circle");
    marker.setAttribute("r", "7");
    marker.style.cssText = `fill:var(--eidos-bg);stroke:${color};stroke-width:3;transform-box:fill-box;transform-origin:center`;
    layer.appendChild(marker);
    const card = document.createElement("div");
    card.className = "eidos-chart-note eidos-card";
    card.textContent = o.text;
    card.style.cssText = `position:absolute;left:0;top:0;width:${o.width ?? 260}px;max-width:calc(100% - 32px);padding:0.65rem 0.85rem;font-size:0.9rem;line-height:1.5;font-weight:600;word-break:keep-all;z-index:3;pointer-events:none`;
    world.appendChild(card);
    let pos = { x: 0, y: 0 };
    stage.onLayout(() => {
      const point = stage.measure(target);
      const ax = point.x + point.w / 2;
      const ay = point.y + point.h / 2;
      card.style.width = `${Math.min(o.width ?? 260, slot ? stage.measure(slot).w : world.clientWidth - 32)}px`;
      const w = card.offsetWidth, h = card.offsetHeight;
      const below = o.place === "below";
      const reserved = slot ? stage.measure(slot) : null;
      pos = {
        x: Math.max(16, Math.min(world.clientWidth - w - 16, reserved ? reserved.x + (reserved.w - w) / 2 : ax - w / 2)),
        y: Math.max(16, Math.min(world.clientHeight * 0.86 - h, reserved ? reserved.y : below ? ay + 32 : ay - h - 32)),
      };
      const bx = pos.x + w / 2;
      const by = pos.y > ay ? pos.y : pos.y + h;
      line.setAttribute("d", `M ${ax} ${ay} L ${ax} ${pos.y > ay ? by - 12 : by + 12} L ${bx} ${by}`);
      marker.setAttribute("cx", ax);
      marker.setAttribute("cy", ay);
    });
    if (o.dim) tl.tween(o.dim, { opacity: [1, o.dimTo ?? 0.3] }, { at: start, dur: dur * 0.35, ease: "out" });
    tl.tween(marker, { scale: [0, 1], opacity: (p) => Math.min(1, Math.max(0, p)) }, { at: start, dur: dur * 0.4, ease: "pop" });
    tl.tween(line, { draw: [0, 1] }, { at: start + dur * 0.25, dur: dur * 0.45, ease: "out" });
    tl.tween(card, { x: () => pos.x, y: (p) => pos.y + (1 - p) * 6, opacity: [0, 1] }, { at: start + dur * 0.6, dur: dur * 0.4, ease: "out" });
    tl.extend(end);
    return { start, end, marker, line, card };
  };
})();
