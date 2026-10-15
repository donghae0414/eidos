(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  E.fx["sequence-message"] = (stage, o = {}) => {
    const { tl } = stage;
    const { r3 } = E.util;
    const root = E.$all(o.el, stage.world)[0];
    const actors = o.actors ?? [];
    const messages = o.messages ?? [];
    root.classList.add("eidos-seq");
    root.style.position = "relative";

    const head = document.createElement("div");
    head.className = "eidos-seq-actors";
    head.style.cssText = `display:grid;grid-template-columns:repeat(${actors.length},1fr);gap:8px;position:relative;z-index:1`;
    const actorEls = actors.map((a) => {
      const d = document.createElement("div");
      d.className = "eidos-seq-actor eidos-card";
      d.textContent = a.label;
      d.style.cssText = "text-align:center;padding:0.5rem 0.4rem;font-weight:600;font-size:clamp(0.72rem,1.4vw,0.95rem);word-break:keep-all";
      head.appendChild(d);
      return d;
    });
    root.appendChild(head);

    const svg = document.createElementNS(NS, "svg");
    svg.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none";
    root.appendChild(svg);
    const lifelines = actors.map(() => {
      const l = document.createElementNS(NS, "path");
      l.style.cssText = "fill:none;stroke:var(--eidos-border);stroke-width:1.5;stroke-dasharray:3 5";
      svg.appendChild(l);
      return l;
    });

    const rows = messages.map((m) => {
      const line = document.createElementNS(NS, "path");
      const color = m.reply ? "var(--eidos-cat-2)" : "var(--eidos-accent)";
      line.style.cssText = `fill:none;stroke:${color};stroke-width:${m.reply ? 1.6 : 2.2};stroke-linecap:round`;
      const tip = document.createElementNS(NS, "path");
      tip.style.cssText = `fill:${m.reply ? "none" : color};stroke:${color};stroke-width:1.6;stroke-linejoin:round`;
      svg.appendChild(line);
      svg.appendChild(tip);
      const label = document.createElement("div");
      label.className = "eidos-seq-label";
      label.textContent = m.label;
      label.style.cssText = "position:absolute;left:0;top:0;text-align:center;font-size:clamp(0.74rem,1.35vw,0.95rem);line-height:1.3;word-break:keep-all;color:var(--eidos-fg)";
      root.appendChild(label);
      return { m, line, tip, label };
    });

    const idx = (id) => actors.findIndex((a) => a.id === id);
    stage.onLayout(() => {
      const box = stage.measure(root);
      const top = actorEls[0].offsetHeight + 14;
      const xs = actorEls.map((el) => el.offsetLeft + el.offsetWidth / 2);
      const step = (box.h - top - 10) / Math.max(messages.length, 1);
      lifelines.forEach((l, i) => l.setAttribute("d", `M ${r3(xs[i])} ${r3(top - 8)} V ${r3(box.h)}`));
      rows.forEach((r, i) => {
        const a = xs[idx(r.m.from)], b = xs[idx(r.m.to)];
        const y = top + step * (i + 0.72);
        const dir = Math.sign(b - a) || 1;
        r.line.setAttribute("d", `M ${r3(a)} ${r3(y)} H ${r3(b - dir * 2)}`);
        r.tip.setAttribute("d", `M ${r3(b - dir * 9)} ${r3(y - 5)} L ${r3(b)} ${r3(y)} L ${r3(b - dir * 9)} ${r3(y + 5)}${r.m.reply ? "" : " Z"}`);
        const w = Math.max(Math.abs(b - a) - 10, Math.min(150, box.w * 0.4));
        r.label.style.width = `${r3(w)}px`;
        r.label.style.left = `${r3((a + b) / 2 - w / 2)}px`;
        r.label.style.top = `${r3(y - r.label.offsetHeight - 6)}px`;
      });
    });

    const start = tl.resolveAt(o.at);
    tl.stagger(actorEls, { opacity: [0, 1], y: [-6, 0] }, { at: start, dur: 0.4, each: 0.08, ease: "out" });
    tl.tween(lifelines, { opacity: [0, 1] }, { at: start + 0.2, dur: 0.5 });
    tl.extend(start + 0.2 + 0.5);
    if (o.intro) tl.stop(o.intro);

    const dur = o.dur ?? 0.7;
    rows.forEach((r, i) => {
      const at = tl.end;
      tl.tween(r.line, { draw: [0, 1] }, { at, dur, ease: "inOut" });
      tl.tween(r.tip, { opacity: [0, 1] }, { at: at + dur * 0.85, dur: 0.15, ease: "linear" });
      tl.tween(r.label, { opacity: [0, 1], y: [4, 0] }, { at: at + dur * 0.3, dur: dur * 0.6, ease: "out" });
      if (i > 0) {
        const prev = rows[i - 1];
        tl.tween([prev.line, prev.tip], { opacity: [1, 0.35] }, { at, dur: 0.3 });
        tl.tween(prev.label, { opacity: [1, 0.45] }, { at, dur: 0.3 });
      }
      tl.extend(at + dur);
      if (o.perStop !== false) tl.stop(r.m.note ?? r.m.label);
    });
    return { start, end: tl.end, rows };
  };
})();
