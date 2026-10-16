(() => {
  const E = window.Eidos;
  const NS = "http://www.w3.org/2000/svg";
  const { r3, lerp, clamp01 } = E.util;
  // file:// reports errors thrown from another script file as "Script error.", so record the message first.
  const fail = (message) => {
    window.__eidosErrors.push(message);
    throw new Error(message);
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
  // Largest remainder: whole counts proportional to the values that sum to exactly n; equal remainders go to the smaller id.
  const allot = (items, total, n) => {
    const quota = items.map((it) => (it.value * n) / total);
    const out = quota.map((q) => Math.floor(q));
    const rest = n - out.reduce((a, b) => a + b, 0);
    const order = items.map((_, i) => i).sort((a, b) => quota[b] - out[b] - (quota[a] - out[a]) || (items[a].id < items[b].id ? -1 : 1));
    for (let k = 0; k < rest; k++) out[order[k]]++;
    return out;
  };
  const LAYOUTS = ["bars", "strip", "waffle"];

  E.fx["chart-morph"] = (stage, o = {}) => {
    const allowed = { el: 1, items: 1, layout: 1, cells: 1, unit: 1, max: 1, ticks: 1, at: 1, dur: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`chart-morph: unknown option ${String(key)}`);
    const { tl } = stage;
    const timing = (r) => {
      if (r.at != null && !(typeof r.at === "number" && Number.isFinite(r.at) && r.at >= 0) &&
          !(typeof r.at === "string" && /^(?:<|(?:<\+=|[+-]=)?(?:\d+(?:\.\d+)?|\.\d+))$/.test(r.at)))
        fail("chart-morph: at must be a nonnegative time or a timeline offset");
      for (const key of ["dur", "each", "total"]) if (r[key] != null && (!Number.isFinite(r[key]) || r[key] < 0))
        fail("chart-morph: " + key + " must be a finite number >= 0");
      for (const key of ["dim", "labelDim", "stagger"]) if (r[key] != null && (!Number.isFinite(r[key]) || r[key] < 0 || r[key] > 1))
        fail("chart-morph: " + key + " must be a finite number between 0 and 1");
      if (r.ease != null && typeof r.ease !== "function" && !(typeof r.ease === "string" && Object.hasOwn(E.ease, r.ease)))
        fail("chart-morph: ease must name an Eidos easing or be a function");
    };
    const add = (fn, r) => {
      timing(r);
      const at = tl.resolveAt(r.at), dur = r.dur ?? 0.6;
      if (!Number.isFinite(at) || at < 0) fail("chart-morph: resolved at must be a nonnegative finite number");
      return tl.add((p) => {
        const q = dur === 0 ? (tl.sourceTime(tl.t) > at ? 1 : 0) : E.reduced ? (p >= 0.5 ? 1 : 0) : p;
        fn(q);
      }, r);
    };
    timing(o);
    const root = E.$all(o.el, stage.world)[0];
    const items = o.items;
    if (!root || !Array.isArray(items) || items.length < 2 || items.length > 6)
      fail("chart-morph: el and 2-6 items of { id, label, value } are required");
    const ids = new Set();
    for (const it of items) {
      if (typeof it?.id !== "string" || !it.id || ids.has(it.id) || !Number.isFinite(it.value) || it.value < 0)
        fail(`chart-morph: item ${JSON.stringify(it?.id)} needs a unique id and a finite value >= 0`);
      ids.add(it.id);
    }
    const total = items.reduce((sum, it) => sum + it.value, 0);
    if (!Number.isFinite(total) || !(total > 0)) fail("chart-morph: total must be finite and positive");
    const N = o.cells ?? 100;
    if (!Number.isInteger(N) || N < 10 || N > 400) fail("chart-morph: cells must be an integer from 10 to 400");
    const peak = Math.max(...items.map((it) => it.value));
    const max = o.max ?? nice(peak);
    if (!Number.isFinite(max) || max < peak) fail("chart-morph: max must cover every value");
    const ticks = o.ticks ?? [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
    if (!Array.isArray(ticks) || ticks.some((v) => !Number.isFinite(v) || v < 0 || v > max))
      fail("chart-morph: ticks must be an array of finite numbers between 0 and max");
    let layout = o.layout ?? "bars";
    if (!LAYOUTS.includes(layout)) fail(`chart-morph: layout must be one of ${LAYOUTS.join(", ")}`);
    const first = layout;

    const unit = o.unit ?? "";
    const num = (v) => v.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
    const amount = (v) => (unit ? `${num(v)} ${unit}` : num(v));
    const counts = allot(items, total, N);
    const pct = N === 100 ? counts : allot(items, total, 100);
    const valueText = {
      bars: (i) => amount(items[i].value),
      strip: (i) => `${pct[i]}%`,
      waffle: (i) => `${counts[i]}칸 · ${amount(items[i].value)}`,
    };
    const owner = [], local = [];
    counts.forEach((c, i) => {
      for (let j = 0; j < c; j++) {
        owner.push(i);
        local.push(j);
      }
    });

    const n = items.length;
    const slot = 500 / n, bw = Math.min(slot * 0.56, 110);
    const cx = (i) => 80 + (i + 0.5) * slot;
    const barTop = (i) => 320 - (items[i].value / max) * 260;
    const used = counts.filter((c) => c > 0).length;
    const cw = (520 - 4 * (used - 1)) / N;
    const segStart = [];
    counts.reduce((x, c, i) => {
      segStart[i] = x;
      return c ? x + c * cw + 4 : x;
    }, 40);
    const stripRow = Math.ceil(n / 2) <= 2 ? 64 : 52;
    const stripAt = (i) => ({ x: 40 + (i % 2) * 270, y: 262 + Math.floor(i / 2) * stripRow });
    const pitch = Math.min(30, 300 / Math.ceil(N / 10));
    const waffleAt = (i) => ({ x: 372, y: 96 + i * Math.min(70, 250 / (n - 1)) });
    const legend = (at) => ({
      name: (i) => ({ x: at(i).x + 28, y: at(i).y, anchor: "start" }),
      value: (i) => ({ x: at(i).x + 28, y: at(i).y + 28, anchor: "start" }),
      swatch: (i) => ({ x: at(i).x, y: at(i).y - 18 }),
    });
    const G = {
      bars: {
        cell: (g) => {
          const i = owner[g], j = local[g], ch = (320 - barTop(i)) / counts[i];
          return { x: cx(i) - bw / 2, y: 320 - (j + 1) * ch, w: bw, h: ch + (j ? 0.6 : 0), rx: 0 };
        },
        name: (i) => ({ x: cx(i), y: 358, anchor: "middle" }),
        value: (i) => ({ x: cx(i), y: barTop(i) - 12, anchor: "middle" }),
        swatch: () => null,
      },
      strip: {
        cell: (g) => {
          const i = owner[g], j = local[g];
          return { x: segStart[i] + j * cw, y: 104, w: cw + (j < counts[i] - 1 ? 0.6 : 0), h: 72, rx: 0 };
        },
        ...legend(stripAt),
      },
      waffle: {
        cell: (g) => ({ x: 40 + (g % 10) * pitch, y: 44 + Math.floor(g / 10) * pitch, w: pitch - 4, h: pitch - 4, rx: 3 }),
        ...legend(waffleAt),
      },
    };

    const svg = make("svg", { viewBox: "0 0 600 400", preserveAspectRatio: "xMidYMid meet", role: "img" }, root);
    svg.style.cssText = "display:block;width:100%;height:100%;font-family:var(--eidos-font-sans);font-variant-numeric:tabular-nums";
    make("title", {}, svg).textContent = items.map((it, i) => `${it.label ?? it.id} ${amount(it.value)} (${pct[i]}%)`).join(", ");
    const muted = "font-size:20px;fill:var(--eidos-muted-fg)";
    const note = (parent, x, y, anchor, label) => {
      const t = make("text", { x, y, "text-anchor": anchor }, parent);
      t.style.cssText = muted;
      t.textContent = label;
    };
    const deco = Object.fromEntries(LAYOUTS.map((L) => [L, make("g", {}, svg)]));
    for (const v of ticks) {
      const y = r3(320 - (v / max) * 260);
      make("path", { d: `M 80 ${y} H 580`, fill: "none" }, deco.bars).style.cssText = "stroke:var(--eidos-border);stroke-width:1";
      note(deco.bars, 70, r3(y + 7), "end", num(v));
    }
    make("path", { d: "M 80 320 H 580", fill: "none" }, deco.bars).style.cssText = "stroke:var(--eidos-muted-fg);stroke-width:1.5";
    if (unit) note(deco.bars, 70, 36, "end", unit);
    make("path", { d: "M 40 192 H 560 M 40 186 V 198 M 300 186 V 198 M 560 186 V 198", fill: "none" }, deco.strip).style.cssText = "stroke:var(--eidos-muted-fg);stroke-width:1.5";
    note(deco.strip, 40, 222, "start", "0%");
    note(deco.strip, 300, 222, "middle", "50%");
    note(deco.strip, 560, 222, "end", "100%");
    note(deco.waffle, 40, 382, "start", `1칸 = ${N === 100 ? "1% = " : ""}${amount(total / N)}`);

    const color = (i) => items[i].color ?? `var(--eidos-cat-${(i % 5) + 1})`;
    const cellLayer = make("g", {}, svg);
    const cells = owner.map((i, g) => {
      const rect = make("rect", { "data-eidos-item": items[i].id, "data-eidos-cell": g }, cellLayer);
      rect.style.fill = color(i);
      return rect;
    });
    const labelLayer = make("g", {}, svg);
    const labels = items.map((it, i) => {
      const sw = make("rect", { width: 18, height: 18, rx: 4 }, labelLayer);
      sw.style.fill = color(i);
      const name = make("text", {}, labelLayer);
      name.style.cssText = "font-size:24px;font-weight:600;fill:var(--eidos-fg)";
      name.textContent = it.label ?? it.id;
      const value = make("text", {}, labelLayer);
      value.style.cssText = "font-size:22px;fill:var(--eidos-muted-fg)";
      return { sw, name, value };
    });

    const fade = (el, a) => {
      el.style.opacity = String(r3(a));
    };
    const box = (rect, b) => {
      rect.setAttribute("x", r3(b.x));
      rect.setAttribute("y", r3(b.y));
      rect.setAttribute("width", r3(Math.max(0, b.w)));
      rect.setAttribute("height", r3(Math.max(0, b.h)));
      rect.setAttribute("rx", r3(b.rx));
    };
    const tone = (s) => Math.max(s, 0.45);
    const place = (L, alpha, shades) => labels.forEach((lb, i) => {
      const a = alpha * tone(shades[i]);
      for (const [el, at] of [[lb.name, G[L].name(i)], [lb.value, G[L].value(i)]]) {
        el.setAttribute("x", r3(at.x));
        el.setAttribute("y", r3(at.y));
        el.setAttribute("text-anchor", at.anchor);
        fade(el, a);
      }
      lb.value.textContent = valueText[L](i);
      const sw = G[L].swatch(i);
      lb.sw.setAttribute("x", r3(sw ? sw.x : 0));
      lb.sw.setAttribute("y", r3(sw ? sw.y : 0));
      fade(lb.sw, sw ? a : 0);
    });
    const showDeco = (alphaOf) => LAYOUTS.forEach((L) => fade(deco[L], alphaOf(L)));

    const start = tl.resolveAt(o.at), dur = o.dur ?? 1.4;
    const tallest = Math.max(...counts);
    const full = items.map(() => 1);
    add((p) => {
      cells.forEach((rect, g) => {
        const delay = (first === "bars" ? local[g] / tallest : g / N) * 0.6;
        const q = E.ease.out(clamp01((p - delay) / 0.4));
        const b = G[first].cell(g);
        box(rect, { ...b, y: b.y - 14 * (1 - q) });
        fade(rect, q);
      });
      place(first, clamp01((p - 0.6) / 0.4), full);
      showDeco((L) => (L === first ? clamp01(p / 0.3) : 0));
    }, { at: start, dur, ease: "linear" });

    let shade = full;
    const to = (next, r = {}) => {
      timing(r);
      if (!LAYOUTS.includes(next) || next === layout)
        fail(`chart-morph: to() takes a layout other than "${layout}" (${LAYOUTS.join(", ")})`);
      const from = layout, at = tl.resolveAt(r.at), d = r.dur ?? 1.4, spread = r.stagger ?? 0.45, shades = shade;
      if (!(spread >= 0 && spread <= 0.9)) fail("chart-morph: stagger must be between 0 and 0.9");
      add((p) => {
        cells.forEach((rect, g) => {
          const q = E.ease.inOut(clamp01((p - (g / Math.max(1, N - 1)) * spread) / (1 - spread)));
          const a = G[from].cell(g), b = G[next].cell(g);
          box(rect, { x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), w: lerp(a.w, b.w, q), h: lerp(a.h, b.h, q), rx: lerp(a.rx, b.rx, q) });
        });
        place(p < 0.5 ? from : next, Math.abs(1 - 2 * p), shades);
        showDeco((L) => (L === from ? clamp01(1 - 2 * p) : L === next ? clamp01(2 * p - 1) : 0));
      }, { at, dur: d, ease: "linear" });
      layout = next;
      return { start: at, end: at + d, layout: next };
    };
    const focus = (sel, r = {}) => {
      timing(r);
      if (sel != null && (!Array.isArray(sel) || sel.some((id) => !ids.has(id))))
        fail(`chart-morph: focus() takes null or an array of item ids (${[...ids].join(", ")})`);
      const at = tl.resolveAt(r.at), d = r.dur ?? 0.5, dim = r.dim ?? 0.22, L = layout;
      const before = shade, after = items.map((it) => (sel == null || sel.includes(it.id) ? 1 : dim));
      add((p) => {
        cells.forEach((rect, g) => fade(rect, lerp(before[owner[g]], after[owner[g]], p)));
        labels.forEach((lb, i) => {
          const a = lerp(tone(before[i]), tone(after[i]), p);
          fade(lb.name, a);
          fade(lb.value, a);
          fade(lb.sw, G[L].swatch(i) ? a : 0);
        });
      }, { at, dur: d });
      shade = after;
      return { start: at, end: at + d };
    };
    return { start, end: start + dur, svg, cells, counts: Object.fromEntries(items.map((it, i) => [it.id, counts[i]])), to, focus };
  };
})();
