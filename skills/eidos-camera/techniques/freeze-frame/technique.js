(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  E.fx["freeze-frame"] = (stage, o = {}) => {
    const { tl, world } = stage;
    const { r3 } = E.util;
    const start = tl.resolveAt(o.at);
    const gray = (p) => ({ filter: p > 0.001 ? `grayscale(${r3(p * 0.85)})` : "none" });

    const flash = document.createElement("div");
    flash.className = "eidos-freeze-flash";
    flash.style.cssText = "position:absolute;inset:0;background:var(--eidos-bg);pointer-events:none;z-index:20";
    world.appendChild(flash);

    const layer = document.createElementNS(NS, "svg");
    layer.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:21";
    world.appendChild(layer);

    let badge = null;
    if (o.badge !== false) {
      badge = document.createElement("div");
      badge.className = "eidos-freeze-badge";
      badge.textContent = o.badge ?? "일시정지";
      badge.style.cssText = "position:absolute;left:0;top:0;padding:3px 10px;border-radius:999px;background:var(--eidos-fg);color:var(--eidos-bg);font-size:0.75rem;font-weight:600;letter-spacing:0.04em;z-index:22;white-space:nowrap";
      world.appendChild(badge);
    }

    const notes = (o.annotations ?? []).map((a) => {
      const card = document.createElement("div");
      card.className = "eidos-freeze-note eidos-card";
      card.textContent = a.text;
      card.style.cssText = `position:absolute;left:0;top:0;max-width:${a.width ?? 240}px;padding:0.45rem 0.7rem;font-size:0.85rem;line-height:1.4;border-color:var(--eidos-accent);z-index:22;word-break:keep-all`;
      world.appendChild(card);
      const line = document.createElementNS(NS, "path");
      line.style.cssText = "fill:none;stroke:var(--eidos-accent);stroke-width:1.5;stroke-linecap:round";
      layer.appendChild(line);
      return { a, card, line, pos: { x: 0, y: 0 } };
    });

    stage.onLayout(() => {
      const scope = stage.measure(o.target ?? world);
      if (badge) badge.__pos = { x: scope.x + scope.w - badge.offsetWidth, y: scope.y - badge.offsetHeight - 8 };
      for (const n of notes) {
        const r = stage.measure(n.a.target);
        const w = n.card.offsetWidth, h = n.card.offsetHeight;
        const below = n.a.place === "below";
        const dx = n.a.dx ?? 0;
        const maxX = world.clientWidth - w - 8;
        n.pos = { x: Math.min(Math.max(8, r.x + r.w / 2 - w / 2 + dx), maxX), y: below ? r.y + r.h + 26 : r.y - h - 26 };
        const ax = r.x + r.w / 2, ay = below ? r.y + r.h + 2 : r.y - 2;
        const bx = n.pos.x + w / 2, by = below ? n.pos.y : n.pos.y + h;
        n.line.setAttribute("d", `M ${r3(bx)} ${r3(by)} L ${r3(ax)} ${r3(ay)}`);
      }
    });

    tl.tween(flash, { opacity: (p) => (p < 0.35 ? p / 0.35 : (1 - p) / 0.65) * 0.7 }, { at: start, dur: 0.35, ease: "linear" });
    if (o.dim) tl.tween(o.dim, { opacity: [1, 0.55], style: gray }, { at: start, dur: 0.3 });
    if (badge) tl.tween(badge, { x: () => badge.__pos?.x ?? 0, y: () => badge.__pos?.y ?? 0, opacity: [0, 1], scale: [0.6, 1] }, { at: start + 0.1, dur: 0.35, ease: "pop" });
    notes.forEach((n, i) => {
      const t0 = start + 0.3 + i * (o.each ?? 0.35);
      tl.tween(n.line, { draw: [0, 1] }, { at: t0, dur: 0.3, ease: "out" });
      tl.tween(n.card, { x: () => n.pos.x, y: (p) => n.pos.y + (1 - p) * 6, opacity: [0, 1] }, { at: t0 + 0.15, dur: 0.35, ease: "out" });
    });
    const end = start + 0.3 + notes.length * (o.each ?? 0.35) + 0.2 + (o.hold ?? 0);
    tl.extend(end);

    return {
      start,
      end,
      release(r = {}) {
        const s2 = tl.resolveAt(r.at);
        const d = r.dur ?? 0.4;
        if (o.dim) tl.tween(o.dim, { opacity: [0.55, 1], style: (p) => gray(1 - p) }, { at: s2, dur: d });
        if (badge) tl.tween(badge, { opacity: [1, 0] }, { at: s2, dur: d });
        for (const n of notes) {
          tl.tween(n.card, { opacity: [1, 0] }, { at: s2, dur: d });
          tl.tween(n.line, { draw: [1, 0] }, { at: s2, dur: d });
        }
        tl.extend(s2 + d);
        return { start: s2, end: s2 + d };
      },
    };
  };
})();
