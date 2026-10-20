(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const { r3 } = E.util;
  const NS = "http://www.w3.org/2000/svg";
  const MAX_WORDS = 10, MAX_GROUPS = 5;
  // Pixels: gap between chips in the start row, gap between rows, padding of a group hull around its chips.
  const GAP_X = 10, GAP_Y = 8, PAD = 10;
  // A stop at a tween's end can see an eased p a hair under 1; the endpoints must be exact.
  const snap = (p) => (p > 1 - 1e-9 ? 1 : p < 1e-9 ? 0 : p);
  const isPlain = (v) => v != null && typeof v === "object" && !Array.isArray(v);
  const isPoint = (v) => Array.isArray(v) && v.length === 2 && v.every((n) => Number.isFinite(n) && n >= 0 && n <= 1);

  E.fx["embedding-space"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, points: 1, portrait: 1, groups: 1, dur: 1, each: 1, arc: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`embedding-space: unknown option ${String(key)}`);
    const { tl } = stage;
    const boxes = E.$all(o.targets ?? o.target, stage.world);
    if (boxes.length !== 1) fail(`embedding-space: targets must resolve to one plot box, got ${boxes.length} for ${String(o.targets ?? o.target)}`);
    const box = boxes[0];
    if (!isPlain(o.points)) fail("embedding-space: points is required ({ text: [x, y] } with x and y from 0 to 1)");
    const texts = Object.keys(o.points);
    if (texts.length < 2 || texts.length > MAX_WORDS) fail(`embedding-space: points needs 2 to ${MAX_WORDS} words, got ${texts.length}`);
    for (const t of texts) if (!isPoint(o.points[t])) fail(`embedding-space: points["${t}"] must be [x, y] with x and y from 0 to 1`);
    if (o.portrait != null) {
      if (!isPlain(o.portrait)) fail("embedding-space: portrait must be { text: [x, y] } like points");
      for (const t of Object.keys(o.portrait)) {
        if (!Object.hasOwn(o.points, t)) fail(`embedding-space: portrait["${t}"] is not a word in points`);
        if (!isPoint(o.portrait[t])) fail(`embedding-space: portrait["${t}"] must be [x, y] with x and y from 0 to 1`);
      }
    }
    const dur = o.dur ?? 0.9, each = o.each ?? 0.09, arc = o.arc ?? 20;
    if (!(Number.isFinite(dur) && dur > 0)) fail("embedding-space: dur must be a positive number of seconds");
    if (!(Number.isFinite(each) && each >= 0)) fail("embedding-space: each must be a number of seconds >= 0");
    if (!Number.isFinite(arc)) fail("embedding-space: arc must be a finite number of pixels");

    const groupOf = new Map();
    const groups = [];
    if (o.groups != null) {
      if (!isPlain(o.groups)) fail("embedding-space: groups must be { label: [text, ...] }");
      const labels = Object.keys(o.groups);
      if (labels.length > MAX_GROUPS) fail(`embedding-space: at most ${MAX_GROUPS} groups (--eidos-cat-1..5), got ${labels.length}`);
      labels.forEach((label, gi) => {
        const members = o.groups[label];
        if (!Array.isArray(members) || !members.length) fail(`embedding-space: groups["${label}"] must list at least one word`);
        for (const t of members) {
          if (!Object.hasOwn(o.points, t)) fail(`embedding-space: groups["${label}"] names "${t}", which is not in points`);
          if (groupOf.has(t)) fail(`embedding-space: "${t}" is in more than one group`);
          groupOf.set(t, gi);
        }
        groups.push({ label, color: `var(--eidos-cat-${gi + 1})`, items: [] });
      });
    }

    if (getComputedStyle(box).position === "static") box.style.position = "relative";
    // Paint order: axes, group hulls, chips, then (reduced motion only) ghost chips that hold the start row.
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "eidos-emb-axes");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none";
    const axis = document.createElementNS(NS, "path");
    axis.style.cssText = "fill:none;stroke:var(--eidos-border);stroke-width:1";
    svg.appendChild(axis);
    box.appendChild(svg);
    for (const g of groups) {
      g.el = document.createElement("div");
      g.el.className = "eidos-emb-group";
      g.el.setAttribute("aria-hidden", "true");
      g.el.style.cssText = `position:absolute;left:0;top:0;border-radius:var(--eidos-radius-sm);background:color-mix(in oklab, ${g.color} 12%, transparent);border:1px solid color-mix(in oklab, ${g.color} 35%, transparent);pointer-events:none`;
      g.labelEl = document.createElement("span");
      g.labelEl.className = "eidos-emb-group-label";
      g.labelEl.textContent = g.label;
      g.labelEl.style.cssText = `position:absolute;left:0.5em;top:0.15em;font-size:0.8rem;font-weight:600;line-height:1.3;white-space:nowrap;color:${g.color}`;
      g.el.appendChild(g.labelEl);
      box.appendChild(g.el);
    }
    const items = texts.map((text) => {
      const el = document.createElement("span");
      el.className = "eidos-emb-word";
      el.textContent = text;
      el.style.cssText = "position:absolute;left:0;top:0;white-space:nowrap;line-height:1.3;padding:0.25em 0.6em;border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-sm);background:var(--eidos-surface);color:var(--eidos-fg)";
      box.appendChild(el);
      const it = { el, text, group: groupOf.has(text) ? groupOf.get(text) : null, w: 0, h: 0, fx: 0, fy: 0, tx: 0, ty: 0 };
      if (it.group != null) groups[it.group].items.push(it);
      return it;
    });
    if (E.reduced) for (const it of items) {
      it.ghost = it.el.cloneNode(true);
      it.ghost.className = "eidos-emb-word eidos-emb-ghost";
      it.ghost.setAttribute("aria-hidden", "true");
      box.appendChild(it.ghost);
    }

    // Geometry depends on the box size and the chip widths: centered start row(s) at the top of the box,
    // the plane below them. Normalized points map to the plane inset by half a chip (plus hull room), so a
    // chip at 0 or 1 still sits inside the box.
    const geom = { W: 0, H: 0 };
    stage.onLayout(() => {
      const W = box.clientWidth, H = box.clientHeight;
      geom.W = W;
      geom.H = H;
      const portrait = o.portrait != null && matchMedia("(max-aspect-ratio: 1/1)").matches;
      for (const it of items) { it.w = it.el.offsetWidth; it.h = it.el.offsetHeight; }
      const h = Math.max(...items.map((it) => it.h)), maxW = Math.max(...items.map((it) => it.w));
      const rows = [[]];
      let rowW = 0;
      for (const it of items) {
        const row = rows[rows.length - 1];
        const next = row.length ? rowW + GAP_X + it.w : it.w;
        if (row.length && next > W) { rows.push([it]); rowW = it.w; }
        else { row.push(it); rowW = next; }
      }
      const bandH = rows.length * h + (rows.length - 1) * GAP_Y;
      rows.forEach((row, ri) => {
        const sum = row.reduce((a, it) => a + it.w, 0) + GAP_X * (row.length - 1);
        let x = (W - sum) / 2;
        // The first row sits right above the plane and leaves first; later rows stack above it and
        // descend through slots that are already empty.
        const y = bandH - h - ri * (h + GAP_Y);
        for (const it of row) { it.fx = x; it.fy = y; x += it.w + GAP_X; }
      });
      const plotT = bandH + h, plotH = Math.max(0, H - plotT);
      const labelH = groups.length ? Math.max(...groups.map((g) => g.labelEl.offsetTop + g.labelEl.offsetHeight)) + 4 : 0;
      const insX = maxW / 2 + PAD, insTop = h / 2 + PAD + labelH, insBot = h / 2 + PAD;
      const ux = Math.max(0, W - 2 * insX), uy = Math.max(0, plotH - insTop - insBot);
      for (const it of items) {
        const [px, py] = (portrait && o.portrait[it.text]) || o.points[it.text];
        it.tx = insX + px * ux - it.w / 2;
        it.ty = plotT + insTop + py * uy - it.h / 2;
      }
      axis.setAttribute("d", `M 0.5 ${r3(plotT)} L 0.5 ${r3(H - 0.5)} L ${r3(W)} ${r3(H - 0.5)}`);
      for (const g of groups) {
        const l = Math.min(...g.items.map((it) => it.tx)) - PAD, r = Math.max(...g.items.map((it) => it.tx + it.w)) + PAD;
        const t = Math.min(...g.items.map((it) => it.ty)) - PAD - labelH, b = Math.max(...g.items.map((it) => it.ty + it.h)) + PAD;
        g.el.style.left = `${r3(l)}px`;
        g.el.style.top = `${r3(t)}px`;
        g.el.style.width = `${r3(r - l)}px`;
        g.el.style.height = `${r3(b - t)}px`;
      }
    });

    const start = tl.resolveAt(o.at);
    const total = (items.length - 1) * each + dur;
    const settle = start + total;
    // Axes and hull fades are opacity tweens, allowed under reduced motion too; every track that starts at
    // `start` (often a stop time) has a p=0 state equal to the state before it, so nothing changes at the stop.
    const d1 = 0.45, d2 = 0.4;
    // Curved flight: the straight lerp plus a perpendicular arc * sin(PI p) offset, the convention of tl.tween's arc
    // (positive bulges to the left of the travel direction), kept inside the box. Pixels come from the latest
    // layout, p from the timeline.
    const flight = (it) => {
      const pos = (p) => {
        p = snap(p);
        const dx = it.tx - it.fx, dy = it.ty - it.fy, len = Math.hypot(dx, dy);
        const k = len && p > 0 && p < 1 ? (arc * Math.sin(Math.PI * p)) / len : 0;
        const x = it.fx + dx * p - dy * k, y = it.fy + dy * p + dx * k;
        return [Math.min(Math.max(x, 0), Math.max(0, geom.W - it.w)), Math.min(Math.max(y, 0), Math.max(0, geom.H - it.h))];
      };
      return { x: (p) => pos(p)[0], y: (p) => pos(p)[1] };
    };
    const tint = (color) => (p) => ({
      color: `color-mix(in oklab, ${color} ${r3(100 * p)}%, var(--eidos-fg))`,
      borderColor: `color-mix(in oklab, ${color} ${r3(60 * p)}%, var(--eidos-border))`,
      background: `color-mix(in oklab, ${color} ${r3(12 * p)}%, var(--eidos-surface))`,
    });
    tl.tween(svg, { opacity: [0, 1] }, { at: start, dur: d1, ease: "out" });
    items.forEach((it, i) => {
      it.start = start + i * each;
      it.end = it.start + dur;
      if (E.reduced) {
        // Opacity only: the ghost holding the row fades out while the same chip fades in at its coordinates.
        // Both transforms are constants, so nothing but opacity interpolates.
        tl.tween(it.ghost, { x: () => it.fx, y: () => it.fy, opacity: [1, 0] }, { at: it.start, dur, ease: "out" });
        tl.tween(it.el, { x: () => it.tx, y: () => it.ty, opacity: [0, 1] }, { at: it.start, dur, ease: "out" });
      } else tl.tween(it.el, flight(it), { at: it.start, dur, ease: "inOut" });
    });
    for (const g of groups) {
      tl.tween(g.el, { opacity: [0, 1] }, { at: settle, dur: d2, ease: "out" });
      // Colors never interpolate under reduced motion: they jump to the group color as the hull starts to show.
      for (const it of g.items) tl.tween(it.el, { style: tint(g.color) }, { at: settle, dur: E.reduced ? 0 : d2, ease: "out" });
    }
    const end = groups.length ? settle + d2 : settle;
    tl.prevStart = start;
    tl.extend(end);
    return {
      start,
      end,
      items: items.map((it) => ({ el: it.el, text: it.text, start: it.start, end: it.end, group: it.group == null ? null : groups[it.group].label })),
      groups: groups.map((g) => ({ label: g.label, el: g.el, items: g.items.map((it) => it.el) })),
    };
  };
})();
