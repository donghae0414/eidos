(() => {
  const E = window.Eidos;
  E.fx["count-up"] = (stage, o = {}) => {
    const { tl } = stage;
    const els = E.$all(o.targets ?? o.target, stage.world);
    const dur = o.dur ?? 1.2;
    const each = o.each ?? 0.15;
    const ease = o.ease ?? "out";
    const locale = o.locale ?? "ko-KR";
    const start = tl.resolveAt(o.at);
    const val = (ds, key, i, fallback) => {
      if (ds[key] != null && ds[key] !== "") return ds[key];
      const v = o[key];
      return (Array.isArray(v) ? v[i] : v) ?? fallback;
    };
    const items = els.map((el, i) => {
      const ds = el.dataset;
      const from = Number(val(ds, "from", i, 0));
      const to = Number(val(ds, "to", i, 0));
      const decimals = Number(val(ds, "decimals", i, 0));
      const prefix = String(val(ds, "prefix", i, ""));
      const unit = String(val(ds, "unit", i, ""));
      const fmt = (v) => prefix + v.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + unit;
      el.style.fontVariantNumeric = "tabular-nums";
      if (o.reserve) {
        el.style.display = "inline-block";
        stage.onLayout(() => {
          const keep = el.textContent;
          el.style.minWidth = "";
          let w = 0;
          for (const v of [from, to]) {
            el.textContent = fmt(v);
            w = Math.max(w, el.getBoundingClientRect().width);
          }
          el.textContent = keep;
          el.style.minWidth = `${E.util.r3(w)}px`;
        });
      }
      const at = start + i * each;
      tl.tween(el, { text: (p) => fmt(from + (to - from) * p) }, { at, dur, ease });
      const bars = E.$all(val(ds, "bar", i, null), stage.world);
      if (bars.length) {
        for (const b of bars) b.style.transformOrigin = "left center";
        tl.tween(bars, { scaleX: [Number(val(ds, "barFrom", i, 0)), Number(val(ds, "barTo", i, 1))] }, { at, dur, ease });
      }
      return { el, start: at, end: at + dur, from, to };
    });
    return { start, end: items.length ? Math.max(...items.map((x) => x.end)) : start, items };
  };
})();
