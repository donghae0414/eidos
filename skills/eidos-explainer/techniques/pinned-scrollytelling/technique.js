(() => {
  const E = window.Eidos;
  const { r3 } = E.util;
  const errors = window.__eidosErrors;
  // file:// reports errors thrown from another script file as "Script error.", so record the message first.
  const fail = (message) => {
    errors.push(message);
    throw new Error(message);
  };
  const segment = (xs, v) => {
    let j = 0;
    while (j < xs.length - 2 && xs[j + 1] <= v) j++;
    return j;
  };
  // Clamped piecewise-linear map through strictly increasing knots xs -> ys; exact at every knot.
  const through = (xs, ys, v) => {
    const n = xs.length;
    if (v <= xs[0]) return ys[0];
    if (v >= xs[n - 1]) return ys[n - 1];
    const j = segment(xs, v);
    return ys[j] + ((ys[j + 1] - ys[j]) * (v - xs[j])) / (xs[j + 1] - xs[j]);
  };

  E.fx["pinned-scrollytelling"] = (stage, o = {}) => {
    const { tl } = stage;
    const root = E.$all(o.el, stage.world)[0];
    const column = root && E.$all(o.column ?? "[data-scrolly-column]", root)[0];
    const figure = root && E.$all(o.figure ?? "figure", root)[0];
    const cards = column ? E.$all(o.steps ?? "[data-stop]", column) : [];
    const line = o.line ?? 0.5, dim = o.dim ?? 0.4, color = o.color ?? "var(--eidos-accent)";
    if (!root || !column || !figure || column.contains(figure) || cards.length < 2) fail("pinned-scrollytelling: el, a figure outside the scroll column and at least two step cards are required");
    if (!Number.isFinite(line) || !Number.isFinite(dim) || !(line >= 0 && line <= 1) || !(dim >= 0 && dim <= 1)) fail("pinned-scrollytelling: line and dim must be finite numbers between 0 and 1");
    if (typeof color !== "string" || !CSS.supports("color", color)) fail("pinned-scrollytelling: color must be a CSS color");
    const ids = cards.map((card) => card.dataset.stop);
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) fail('pinned-scrollytelling: every step card needs a unique data-stop="<stop id>"');

    const reading = E.reduced;
    root.dataset.eidosScrolly = reading ? "reading" : "pinned";
    let slot;
    if (reading) {
      Object.assign(root.style, { overflowY: "auto", overscrollBehavior: "contain" });
      root.dataset.eidosNoclick = "";
    }
    else {
      // Keep an inert grid slot in the authored layout, but place the real figure
      // next to world so the camera can never transform the pinned graphic.
      slot = document.createElement("div");
      slot.className = figure.className;
      slot.classList.remove("eidos-card");
      slot.setAttribute("aria-hidden", "true");
      figure.before(slot);
      stage.el.appendChild(figure);
      Object.assign(figure.style, { position: "absolute", margin: "0", zIndex: "2" });
      figure.dataset.eidosPinnedFigure = "";
      Object.assign(column.style, { position: "relative", overflowY: "auto", overscrollBehavior: "contain", scrollBehavior: "auto" });
      // The runtime never turns wheel, swipe or click inside this element into next/prev, so the scrub region owns them.
      column.dataset.eidosNoclick = "";
    }

    const reported = new Set();
    const report = (message) => {
      if (reported.has(message)) return;
      reported.add(message);
      errors.push(message);
      console.error("[eidos]", message);
    };
    const offsetIn = (node) => {
      let y = 0;
      for (let n = node; n && n !== column; n = n.offsetParent) y += n.offsetTop;
      return y;
    };

    let times = [], ys = [];
    stage.onLayout(() => {
      times = [];
      ys = [];
      const ts = ids.map((id) => tl.stops.find((s) => s.id === id)?.t);
      const missing = ids.filter((_, j) => ts[j] == null);
      if (missing.length) return report(`pinned-scrollytelling: no stop with id ${missing.map((id) => `"${id}"`).join(", ")}`);
      if (ts.some((t, j) => j && t <= ts[j - 1])) return report("pinned-scrollytelling: step cards must follow their stops in strictly increasing time");
      times = ts;
      if (reading) return;
      const bounds = slot.getBoundingClientRect(), frame = stage.el.getBoundingClientRect();
      Object.assign(figure.style, {
        left: `${r3(bounds.left - frame.left)}px`, top: `${r3(bounds.top - frame.top)}px`,
        width: `${r3(bounds.width)}px`, height: `${r3(bounds.height)}px`,
      });
      const h = column.clientHeight, lineY = h * line;
      column.style.paddingTop = `${Math.round(Math.max(0, lineY - cards[0].offsetHeight / 2))}px`;
      column.style.paddingBottom = `${Math.round(Math.max(0, h - lineY - cards[cards.length - 1].offsetHeight / 2))}px`;
      const max = column.scrollHeight - h;
      const anchors = cards.map((card) => Math.round(Math.min(Math.max(offsetIn(card) + card.offsetHeight / 2 - lineY, 0), max)));
      if (anchors.some((y, j) => j && y <= anchors[j - 1]))
        return report("pinned-scrollytelling: scroll anchors are not strictly increasing; give the column a bounded height and room between cards");
      ys = anchors;
    });

    const weight = (j, t) => {
      const n = times.length;
      if (reading) {
        let k = -1;
        for (let i = 0; i < n; i++) if (times[i] <= t + 1e-9) k = i;
        return j === k ? 1 : 0;
      }
      if (t <= times[0]) return j === 0 ? 1 : 0;
      if (t >= times[n - 1]) return j === n - 1 ? 1 : 0;
      const k = segment(times, t), f = (t - times[k]) / (times[k + 1] - times[k]);
      return j === k ? 1 - f : j === k + 1 ? f : 0;
    };
    const paint = (t) => cards.forEach((card, j) => {
      const w = weight(j, t), pct = r3(w * 100);
      card.style.opacity = String(r3(reading ? 1 : dim + (1 - dim) * w));
      card.style.borderColor = w > 0 ? `color-mix(in oklab, ${color} ${pct}%, var(--eidos-border))` : "var(--eidos-border)";
      card.style.boxShadow = w > 0 ? `inset 4px 0 0 0 color-mix(in oklch, ${color} ${pct}%, transparent), var(--eidos-shadow)` : "var(--eidos-shadow)";
    });

    let expected = NaN, scrubbing = false;
    tl.onSeek((t) => {
      if (!times.length) return;
      paint(t);
      if (reading || scrubbing || !ys.length) return;
      const y = through(times, ys, t);
      if (Math.abs(column.scrollTop - y) > 0.5) column.scrollTop = y;
      expected = column.scrollTop;
    });
    // A position written by the seek hook comes back as one scroll event; only a position it did not write is the reader scrubbing.
    column.addEventListener("scroll", () => {
      if (reading || !ys.length) return;
      const y = column.scrollTop;
      if (Math.abs(y - expected) <= 0.5) return;
      expected = NaN;
      scrubbing = true;
      try {
        stage.seek(through(ys, times, y));
      } finally {
        scrubbing = false;
      }
    }, { passive: true });

    return {
      root,
      figure,
      column,
      cards,
      anchors: () => ys.map((y, j) => ({ y, t: times[j], id: ids[j] })),
      timeAt: (y) => (ys.length ? through(ys, times, y) : NaN),
      scrollAt: (t) => (ys.length ? through(times, ys, t) : NaN),
    };
  };
})();
