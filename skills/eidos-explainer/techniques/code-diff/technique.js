(() => {
  const E = window.Eidos;
  E.fx["code-diff"] = (stage, o = {}) => {
    const { tl } = stage;
    const container = E.$all(o.el, stage.world)[0];
    const block = document.createElement("div");
    block.className = "eidos-diff-code";
    block.style.cssText = "font-family:var(--eidos-font-mono);font-size:inherit;line-height:1.65";
    const lines = (o.lines ?? []).map((data) => {
      const el = document.createElement("div");
      el.className = `eidos-diff-line eidos-diff-${data.t}`;
      el.style.cssText = `display:grid;grid-template-rows:${data.t === "add" ? 0 : 1}fr`;
      const inner = document.createElement("div");
      inner.style.cssText = "min-height:0;overflow:hidden";
      const row = document.createElement("div");
      row.style.cssText = "display:grid;grid-template-columns:1.4em minmax(0,1fr);padding:2px 10px";
      const sign = document.createElement("span");
      sign.textContent = { ctx: " ", del: "−", add: "+" }[data.t];
      sign.setAttribute("aria-hidden", "true");
      sign.style.color = data.t === "del" ? "var(--eidos-danger)" : data.t === "add" ? "var(--eidos-success)" : "var(--eidos-muted-fg)";
      const code = document.createElement("code");
      code.textContent = data.code;
      code.style.cssText = "font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal";
      row.append(sign, code);
      inner.appendChild(row);
      el.appendChild(inner);
      block.appendChild(el);
      return { ...data, el };
    });
    container.appendChild(block);
    const ctx = lines.filter((l) => l.t === "ctx").map((l) => l.el);
    const del = lines.filter((l) => l.t === "del").map((l) => l.el);
    const add = lines.filter((l) => l.t === "add").map((l) => l.el);
    const start = tl.resolveAt(o.at);
    const options = (r) => ({ at: tl.resolveAt(r.at ?? start), dur: r.dur ?? o.dur ?? 0.65, ease: "inOut" });
    return {
      start, end: start, lines,
      highlight(r = {}) {
        const opt = options({ ...r, at: r.at ?? tl.end });
        tl.tween(del, { style: (p) => ({ background: `color-mix(in oklch, var(--eidos-danger) ${p * 15}%, var(--eidos-surface))` }) }, opt);
        tl.tween(ctx, { opacity: [1, 0.65] }, opt);
        return { start: opt.at, end: opt.at + opt.dur };
      },
      remove(r = {}) {
        const opt = options({ ...r, at: r.at ?? tl.end });
        tl.tween(del, { style: (p) => ({ gridTemplateRows: `${1 - p}fr` }), opacity: [1, 0] }, opt);
        return { start: opt.at, end: opt.at + opt.dur };
      },
      insert(r = {}) {
        const opt = options({ ...r, at: r.at ?? tl.end });
        tl.tween(add, {
          style: (p) => ({
            gridTemplateRows: `${p}fr`,
            background: "color-mix(in oklch, var(--eidos-success) 15%, var(--eidos-surface))",
          }),
          opacity: [0, 1],
        }, opt);
        tl.tween(ctx, { opacity: [0.65, 1] }, opt);
        return { start: opt.at, end: opt.at + opt.dur };
      },
    };
  };
})();
