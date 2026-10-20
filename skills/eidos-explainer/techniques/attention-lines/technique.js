(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  const { r3 } = E.util;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const svgEl = (tag, css) => {
    const el = document.createElementNS(NS, tag);
    el.style.cssText = css;
    return el;
  };
  const mix = (color, base, p) => `color-mix(in oklch, ${color} ${r3(p * 100)}%, ${base})`;
  const patternsByWorld = new WeakMap();

  E.fx["attention-lines"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, from: 1, weights: 1, labels: 1, dur: 1, each: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`attention-lines: unknown option ${String(key)}`);
    const { tl, world } = stage;
    const toks = E.$all(o.targets ?? o.target, world);
    const n = toks.length;
    if (n < 2) fail(`attention-lines: targets must match at least 2 token elements, got ${n}`);
    const from = o.from ?? n - 1;
    if (!Number.isInteger(from) || from < 0 || from >= n) fail(`attention-lines: from must be a token index from 0 to ${n - 1}, got ${String(from)}`);
    const weights = o.weights;
    if (!Array.isArray(weights)) fail("attention-lines: weights is required (one number per token)");
    if (weights.length !== n) fail(`attention-lines: weights has ${weights.length} values for ${n} tokens`);
    if (!weights.every((v) => typeof v === "number" && Number.isFinite(v) && v >= 0)) fail("attention-lines: weights must be finite numbers >= 0");
    const labels = o.labels ?? true;
    if (typeof labels !== "boolean") fail(`attention-lines: labels must be true or false, got ${String(labels)}`);
    const dur = o.dur ?? 0.9;
    const each = o.each ?? 0.12;
    if (!(Number.isFinite(dur) && dur > 0)) fail(`attention-lines: dur must be a positive number, got ${String(dur)}`);
    if (!(Number.isFinite(each) && each >= 0)) fail(`attention-lines: each must be a number >= 0, got ${String(each)}`);
    const arcTargets = [];
    for (let i = 0; i < n; i++) if (i !== from && weights[i] > 0) arcTargets.push(i);
    if (!arcTargets.length) fail("attention-lines: weights need a positive value for a token other than from");
    const max = Math.max(...arcTargets.map((i) => weights[i]));

    // The overlay lives in the tokens' nearest common parent, so it follows their scene and camera.
    let host = toks[0].parentElement;
    while (host !== world && !toks.every((el) => host.contains(el))) host = host.parentElement;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    const svg = svgEl("svg", "position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none");
    svg.setAttribute("class", "eidos-attention");
    svg.setAttribute("aria-hidden", "true");
    const ring = (color) => svgEl("rect", `fill:none;stroke:${color}`);
    const query = ring("var(--eidos-fg)");
    const items = arcTargets.map((index) => {
      const k = weights[index] / max;
      const top = k >= 1 - 1e-9;
      const label = labels
        ? svgEl("text", "fill:var(--eidos-muted-fg);font-family:var(--eidos-font-sans);font-weight:600;font-variant-numeric:tabular-nums;text-anchor:middle")
        : null;
      if (label) label.textContent = weights[index].toFixed(2);
      return {
        el: toks[index], index, weight: weights[index], k, top, label,
        path: svgEl("path", "fill:none;stroke:var(--eidos-fg);stroke-linecap:round"),
        ring: top ? ring("var(--eidos-accent)") : null,
      };
    });
    for (const it of items) svg.appendChild(it.path);
    for (const r of [query, ...items.map((it) => it.ring)]) if (r) svg.appendChild(r);
    for (const it of items) if (it.label) svg.appendChild(it.label);
    host.appendChild(svg);

    stage.onLayout(() => {
      const fs = parseFloat(getComputedStyle(toks[from]).fontSize) || 16;
      const thick = Math.min(Math.max(fs * 0.2, 2.5), 6);
      const ringW = Math.max(1.5, fs * 0.08);
      const lfs = Math.max(11, Math.round(fs * 0.6));
      const hostBox = stage.measure(host);
      const boxes = toks.map((el) => {
        const r = stage.measure(el);
        return { x: r.x - hostBox.x, y: r.y - hostBox.y, w: r.w, h: r.h };
      });
      let space = Infinity;
      for (let i = 0; i + 1 < n; i++) {
        const a = boxes[i], b = boxes[i + 1];
        if (Math.abs(a.y - b.y) < a.h / 2) space = Math.min(space, b.x - a.x - a.w);
      }
      const ringGap = Math.max(1.5, Math.min(fs * 0.2, (space - ringW - 2) / 2));
      const frame = (rect, el, b) => {
        rect.setAttribute("x", r3(b.x - ringGap));
        rect.setAttribute("y", r3(b.y - ringGap));
        rect.setAttribute("width", r3(b.w + 2 * ringGap));
        rect.setAttribute("height", r3(b.h + 2 * ringGap));
        rect.setAttribute("rx", r3((parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0) + ringGap));
        rect.style.strokeWidth = `${r3(ringW)}px`;
      };
      const q = boxes[from];
      frame(query, toks[from], q);
      const qx = q.x + q.w / 2, qy = q.y - ringGap;
      for (const it of items) {
        const b = boxes[it.index];
        const x = b.x + b.w / 2, y = b.y - ringGap;
        // A quadratic's apex sits halfway to its control point, so the arc rises `lift` above its ends.
        const lift = fs * 0.5 + Math.abs(x - qx) * 0.3;
        it.path.setAttribute("d", `M ${r3(qx)} ${r3(qy)} Q ${r3((qx + x) / 2)} ${r3(Math.min(qy, y) - 2 * lift)} ${r3(x)} ${r3(y)}`);
        it.path.style.strokeWidth = `${r3(Math.max(0.75, thick * it.k))}px`;
        if (it.ring) frame(it.ring, it.el, b);
        if (it.label) {
          it.label.setAttribute("x", r3(x));
          it.label.setAttribute("y", r3(b.y + b.h + ringGap + lfs));
          it.label.style.fontSize = `${lfs}px`;
        }
      }
    });

    const start = tl.resolveAt(o.at);
    const drawn = patternsByWorld.get(world) ?? [];
    patternsByWorld.set(world, drawn);
    for (const prev of drawn)
      if (!prev.retired && toks.some((el) => prev.toks.includes(el))) {
        prev.retired = true;
        tl.tween(prev.svg, { opacity: [1, 0] }, { at: start, dur: 0.3, ease: "in" });
      }
    drawn.push({ svg, toks, retired: false });

    tl.tween(query, { opacity: [0, 1] }, { at: start, dur: 0.3, ease: "out" });
    const first = start + 0.3;
    items.forEach((it, i) => {
      it.start = first + i * each;
      it.end = it.start + dur;
      const op = r3(0.2 + 0.75 * it.k);
      if (E.reduced) tl.tween(it.path, { opacity: [0, op] }, { at: it.start, dur, ease: "out" });
      else {
        it.path.style.opacity = String(op);
        tl.tween(it.path, { draw: [0, 1] }, { at: it.start, dur, ease: "inOut" });
      }
      if (it.label) tl.tween(it.label, E.reduced ? { opacity: [0, 1] } : { opacity: [0, 1], y: [4, 0] }, { at: it.start + dur * 0.7, dur: 0.3, ease: "out" });
    });
    const focus = first + (items.length - 1) * each + dur;
    for (const it of items.filter((x) => x.top)) {
      if (E.reduced) {
        it.path.style.stroke = "var(--eidos-accent)";
        if (it.label) it.label.style.fill = "var(--eidos-accent)";
      } else {
        tl.tween(it.path, { style: (p) => ({ stroke: mix("var(--eidos-accent)", "var(--eidos-fg)", p) }) }, { at: focus, dur: 0.35, ease: "out" });
        if (it.label) tl.tween(it.label, { style: (p) => ({ fill: mix("var(--eidos-accent)", "var(--eidos-muted-fg)", p) }) }, { at: focus, dur: 0.35, ease: "out" });
      }
      tl.tween(it.ring, { opacity: [0, 1] }, { at: focus, dur: 0.35, ease: "out" });
    }
    const end = focus + 0.35;
    tl.prevStart = start;
    tl.extend(end);
    return {
      start,
      end,
      items: items.map(({ el, index, weight, top, path, label, start, end }) => ({ el, index, weight, top, path, label, start, end })),
    };
  };
})();
