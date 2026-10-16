(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  const { r3, lerp, clamp01 } = E.util;
  const errors = window.__eidosErrors;
  // file:// reports errors thrown from another script file as "Script error.", so record the message first.
  const fail = (message) => {
    errors.push(message);
    throw new Error(message);
  };
  const report = (message) => {
    errors.push(message);
    console.error("[eidos]", message);
  };
  const make = (tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    parent.appendChild(node);
    return node;
  };
  const STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const nice = (v) => {
    const base = 10 ** Math.floor(Math.log10(v));
    return base * STEPS.find((s) => s * base >= v * (1 - 1e-9));
  };
  const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const SUB = 8;

  E.fx["bar-race"] = (stage, o = {}) => {
    const { tl } = stage;
    const timing = (r) => {
      if (r.at != null && !(typeof r.at === "number" && Number.isFinite(r.at) && r.at >= 0) &&
          !(typeof r.at === "string" && /^(?:<|(?:<\+=|[+-]=)?(?:\d+(?:\.\d+)?|\.\d+))$/.test(r.at)))
        fail("bar-race: at must be a nonnegative time or a timeline offset");
      for (const key of ["dur", "each", "total"]) if (r[key] != null && (!Number.isFinite(r[key]) || r[key] < 0))
        fail("bar-race: " + key + " must be a finite number >= 0");
      for (const key of ["dim", "labelDim", "stagger"]) if (r[key] != null && (!Number.isFinite(r[key]) || r[key] < 0 || r[key] > 1))
        fail("bar-race: " + key + " must be a finite number between 0 and 1");
      if (r.ease != null && typeof r.ease !== "function" && !(typeof r.ease === "string" && Object.hasOwn(E.ease, r.ease)))
        fail("bar-race: ease must name an Eidos easing or be a function");
    };
    const add = (fn, r) => {
      timing(r);
      const at = tl.resolveAt(r.at), dur = r.dur ?? 0.6;
      if (!Number.isFinite(at) || at < 0) fail("bar-race: resolved at must be a nonnegative finite number");
      return tl.add((p) => {
        const q = dur === 0 ? (tl.sourceTime(tl.t) > at ? 1 : 0) : E.reduced ? (p >= 0.5 ? 1 : 0) : p;
        fn(q);
      }, r);
    };
    timing(o);
    if (o.format != null && typeof o.format !== "function") fail("bar-race: format must be a function");
    if (o.mono != null && typeof o.mono !== "boolean") fail("bar-race: mono must be a boolean");
    const root = E.$all(o.el, stage.world)[0];
    const items = o.items;
    if (!root || !Array.isArray(items) || items.length < 2) fail("bar-race: el and at least two items of { id, label } are required");
    const ids = items.map((it) => it?.id);
    if (ids.some((id) => typeof id !== "string" || !id) || new Set(ids).size !== ids.length) fail("bar-race: item ids must be unique non-empty strings");
    const top = o.top ?? Math.min(items.length, 5);
    if (!Number.isInteger(top) || top < 1 || top > items.length) fail(`bar-race: top must be an integer from 1 to ${items.length}`);
    if (!Array.isArray(o.rows)) fail("bar-race: rows must be an array of { time, label, values }");

    const known = new Set(ids), seen = new Set(), rows = [];
    o.rows.forEach((row, k) => {
      const where = `row ${k + 1}`;
      if (!Number.isFinite(row?.time)) return report(`bar-race: ${where} has no finite time; dropped`);
      if (seen.has(row.time)) return report(`bar-race: duplicate time ${row.time} in ${where}; kept the first row`);
      seen.add(row.time);
      const given = row.values;
      if (given == null || typeof given !== "object" || Array.isArray(given)) fail(`bar-race: ${where} needs a values object`);
      for (const key of Object.keys(given ?? {})) if (!known.has(key)) report(`bar-race: ${where} has unknown id "${key}"; ignored`);
      const values = Object.create(null);
      for (const id of ids) {
        const v = Object.hasOwn(given, id) ? given[id] : 0;
        if (!Number.isFinite(v)) report(`bar-race: ${where} value of "${id}" is not a finite number; used 0`);
        values[id] = Number.isFinite(v) ? v : 0;
      }
      rows.push({ time: row.time, label: String(row.label ?? row.time), values });
    });
    rows.sort((a, b) => a.time - b.time);
    if (rows.length < 2) fail("bar-race: at least two rows with distinct finite times are required");

    let lo = 0, hi = 0;
    for (const row of rows) for (const id of ids) {
      lo = Math.min(lo, row.values[id]);
      hi = Math.max(hi, row.values[id]);
    }
    let domain = [lo < 0 ? -nice(-lo) : 0, hi > 0 ? nice(hi) : lo < 0 ? 0 : 1];
    if (o.domain != null) {
      const [a, b] = Array.isArray(o.domain) && o.domain.length === 2 ? o.domain : [];
      if (Number.isFinite(a) && Number.isFinite(b) && a <= lo && b >= hi && a < b) domain = [a, b];
      else report(`bar-race: domain ${JSON.stringify(o.domain)} must include 0 and every value; used [${domain.join(", ")}]`);
    }
    const [d0, d1] = domain;

    const rowH = Math.min(64, 320 / top), bh = rowH * 0.66;
    const plotTop = 56, plotBottom = plotTop + top * rowH, H = r3(plotBottom + 70);
    const x0 = 150, x1 = 556;
    const X = (v) => x0 + ((v - d0) / (d1 - d0)) * (x1 - x0);
    const fmt = o.format ?? ((v) => (Math.round(v) || 0).toLocaleString("ko-KR"));

    const svg = make("svg", { viewBox: `0 0 600 ${H}`, preserveAspectRatio: "xMidYMid meet", role: "img" }, root);
    svg.style.cssText = "display:block;width:100%;height:100%;font-family:var(--eidos-font-sans);font-variant-numeric:tabular-nums";
    make("title", {}, svg).textContent = `${items.map((it) => it.label ?? it.id).join(", ")}: ${rows[0].label} - ${rows[rows.length - 1].label}`;
    const muted = "font-size:18px;fill:var(--eidos-muted-fg)";
    const step = nice((d1 - d0) / 4);
    for (let i = Math.ceil(d0 / step - 1e-9); i * step <= d1 + 1e-9; i++) {
      const v = i * step, x = r3(X(v));
      make("path", { d: `M ${x} ${plotTop - 10} V ${r3(plotBottom)}`, fill: "none" }, svg).style.cssText =
        `stroke:${v === 0 ? "var(--eidos-muted-fg)" : "var(--eidos-border)"};stroke-width:${v === 0 ? 1.5 : 1}`;
      const label = make("text", { x, y: plotTop - 18, "text-anchor": "middle" }, svg);
      label.style.cssText = muted;
      label.textContent = fmt(v);
    }
    if (o.unit) {
      const unit = make("text", { x: 12, y: plotTop - 18 }, svg);
      unit.style.cssText = muted;
      unit.textContent = o.unit;
    }
    const bars = Object.create(null);
    items.forEach((it, i) => {
      const g = make("g", { "data-eidos-item": it.id }, svg);
      const rect = make("rect", { rx: 4, height: r3(bh) }, g);
      rect.style.fill = it.color ?? `var(--eidos-cat-${(i % 5) + 1})`;
      const name = make("text", { x: x0 - 12, "text-anchor": "end" }, g);
      name.style.cssText = `font:600 20px ${o.mono ? "var(--eidos-font-mono)" : "var(--eidos-font-sans)"};fill:var(--eidos-fg)`;
      name.textContent = it.label ?? it.id;
      const value = make("text", {}, g);
      value.style.cssText = muted;
      bars[it.id] = { g, rect, name, value };
    });
    const ticker = make("text", { x: 584, y: r3(H - 20), "text-anchor": "end" }, svg);
    ticker.style.cssText = "font-size:44px;font-weight:700;fill:var(--eidos-muted-fg)";

    const valuesAt = (k, f) => (f <= 0 ? rows[k].values : f >= 1 ? rows[k + 1].values
      : Object.fromEntries(ids.map((id) => [id, lerp(rows[k].values[id], rows[k + 1].values[id], f)])));
    const ranking = (vals) => Object.fromEntries([...ids].sort((a, b) => vals[b] - vals[a] || byId(a, b)).map((id, r) => [id, r]));
    // Ranks are re-sorted at SUB points per segment and slots move linearly between them, so a pass happens near the real crossing.
    const ranks = rows.slice(1).map((_, k) => Array.from({ length: SUB + 1 }, (_, m) => ranking(valuesAt(k, m / SUB))));
    const locate = (time) => {
      let k = 0;
      while (k < rows.length - 2 && rows[k + 1].time <= time) k++;
      return { k, f: clamp01((time - rows[k].time) / (rows[k + 1].time - rows[k].time)) };
    };
    const draw = (time) => {
      const { k, f } = locate(time);
      const vals = valuesAt(k, f), now = ranking(vals);
      const s = f * SUB, m = Math.min(SUB - 1, Math.floor(s)), u = s - m;
      for (const id of ids) {
        const b = bars[id], v = vals[id];
        const r = lerp(ranks[k][m][id], ranks[k][m + 1][id], u);
        const y = plotTop + Math.min(r, top) * rowH;
        const xa = X(Math.min(0, v)), xb = X(Math.max(0, v));
        b.g.setAttribute("data-eidos-rank", String(now[id]));
        b.g.style.opacity = String(r3(clamp01(top - r)));
        b.rect.setAttribute("x", r3(xa));
        b.rect.setAttribute("y", r3(y + (rowH - bh) / 2));
        b.rect.setAttribute("width", r3(xb - xa));
        b.name.setAttribute("y", r3(y + rowH / 2 + 7));
        b.value.setAttribute("x", r3(v < 0 ? xa - 8 : xb + 8));
        b.value.setAttribute("y", r3(y + rowH / 2 + 6));
        b.value.setAttribute("text-anchor", v < 0 ? "end" : "start");
        b.value.textContent = fmt(v);
      }
      ticker.textContent = rows[f < 0.5 ? k : k + 1].label;
    };

    const start = tl.resolveAt(o.at), firstTime = rows[0].time, span = rows[rows.length - 1].time - firstTime;
    add(() => draw(firstTime), { at: start, dur: 0 });
    let cursor = firstTime;
    const to = (time, r = {}) => {
      timing(r);
      if (!Number.isFinite(time) || time < firstTime || time > rows[rows.length - 1].time)
        fail(`bar-race: to(${time}) is outside ${firstTime}..${rows[rows.length - 1].time}`);
      const from = cursor, at = tl.resolveAt(r.at);
      const dur = r.dur ?? Math.max(0.6, (Math.abs(time - from) / span) * (o.total ?? 6));
      add((p) => draw(p >= 1 ? time : lerp(from, time, p)), { at, dur, ease: r.ease ?? "inOut" });
      cursor = time;
      return { start: at, end: at + dur, time };
    };
    const order = (time) => {
      const { k, f } = locate(time);
      return Object.entries(ranking(valuesAt(k, f))).sort((a, b) => a[1] - b[1]).map(([id]) => id);
    };
    return { start, end: start, svg, domain: [...domain], rows: rows.map((row) => ({ ...row, values: { ...row.values } })), to, order };
  };
})();
