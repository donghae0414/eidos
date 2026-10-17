(() => {
  const E = window.Eidos;
  const fail = (message) => {
    (window.__eidosErrors ||= []).push(`pixel-dissolve: ${message}`);
    throw new Error(`pixel-dissolve: ${message}`);
  };
  E.fx["pixel-dissolve"] = (stage, o = {}) => {
    const allowed = { from: 1, to: 1, at: 1, dur: 1, ease: 1, cols: 1, seed: 1, order: 1, soft: 1 };
    if (!o || typeof o !== "object" || Array.isArray(o)) fail("options must be an object");
    for (const key of Object.keys(o)) if (!Object.hasOwn(allowed, key)) fail(`unknown option ${key}`);
    const cols = o.cols ?? 10, seed = o.seed ?? 7, dur = o.dur ?? 1.2;
    if (!Number.isInteger(cols) || cols < 2 || cols > 24) fail("cols must be an integer from 2 to 24");
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) fail("seed must be an unsigned 32-bit integer");
    if (!Number.isFinite(dur) || dur < 0) fail("dur must be finite nonnegative seconds");
    const order = o.order ?? "random", soft = o.soft ?? 0.12;
    if (!["random", "diagonal", "center"].includes(order)) fail("order must be random, diagonal, or center");
    if (typeof soft !== "number" || !Number.isFinite(soft) || soft < 0 || soft > 1) fail("soft must be a number from 0 to 1");
    const easing = o.ease ?? "linear";
    if (typeof easing !== "function" && !Object.hasOwn(E.ease, easing)) fail(`unknown ease ${String(easing)}`);
    const ease = typeof easing === "function" ? easing : E.ease[easing];
    let from, to;
    try { from = E.$all(o.from, stage.world); to = E.$all(o.to, stage.world); }
    catch { fail("from and to must be valid scene selectors or elements"); }
    if (from.length !== 1 || to.length !== 1 || from[0] === to[0]) fail("from and to must each select one distinct scene");
    const { tl } = stage, start = tl.resolveAt(o.at);
    if (!Number.isFinite(start) || start < 0) fail("at must resolve to finite nonnegative seconds");
    const snap = (p) => tl.t <= start ? 0 : p < 1e-9 ? 0 : p > 1 - 1e-9 ? 1 : p;
    const at = { at: start, dur, ease: "linear" };
    let grid, cells = [];
    const n = cols * cols;
    if (!E.reduced) {
      const seq = Array.from({ length: n }, (_, i) => i), rng = E.rng(seed), ranks = [];
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [seq[i], seq[j]] = [seq[j], seq[i]];
      }
      if (order !== "random") {
        // Directional order: a spatial key per cell plus seeded jitter, so the front reads as a flow, not noise.
        const m = cols - 1, mid = m / 2, key = [];
        for (let i = 0; i < n; i++) {
          const row = Math.floor(i / cols), col = i % cols;
          const base = order === "diagonal" ? (row + col) / (2 * m) : Math.hypot(row - mid, col - mid) / Math.hypot(mid, mid);
          key[i] = base + (rng() - 0.5) * 0.25;
        }
        seq.sort((a, b) => key[a] - key[b] || a - b);
      }
      seq.forEach((index, rank) => { ranks[index] = rank; });
      grid = document.createElement("div");
      grid.className = "eidos-fx-pixel-dissolve";
      grid.setAttribute("aria-hidden", "true");
      Object.assign(grid.style, {
        position: "absolute", inset: "0px", display: "grid", pointerEvents: "none",
        gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${cols}, 1fr)`,
        visibility: "hidden",
      });
      for (let i = 0; i < n; i++) {
        const cell = document.createElement("div"), clone = from[0].cloneNode(true);
        cell.dataset.eidosPixelRank = String(ranks[i]);
        Object.assign(cell.style, { position: "relative", overflow: "hidden", minWidth: "0px", minHeight: "0px" });
        for (const el of [clone, ...clone.querySelectorAll("*")]) {
          el.removeAttribute("id");
          el.removeAttribute("data-eidos-spoke");
          el.removeAttribute("autofocus");
        }
        clone.inert = true;
        Object.assign(clone.style, { position: "absolute", margin: "0px", opacity: "1", visibility: "visible", transform: "none", pointerEvents: "none" });
        cell.append(clone); grid.append(cell);
        cells.push({ cell, clone, rank: ranks[i], row: Math.floor(i / cols), col: i % cols });
      }
      stage.world.append(grid);
      stage.onLayout(() => {
        const r = stage.measure(from[0]);
        for (const { clone, row, col } of cells) Object.assign(clone.style, {
          width: `${r.w}px`, height: `${r.h}px`, left: `${-col * r.w / cols}px`, top: `${-row * r.h / cols}px`,
        });
      });
    }
    tl.add((raw) => {
      const p = snap(raw), e = p === 1 ? 1 : E.util.clamp01(ease(p)), count = Math.floor(e * n);
      const cut = E.reduced ? p >= 0.5 : p > 0;
      from[0].style.opacity = cut ? "0" : "1";
      to[0].style.opacity = cut ? "1" : "0";
      if (grid) {
        grid.style.visibility = p > 0 && p < 1 ? "visible" : "hidden";
        // soft=0: exactly floor(e*N) cells gone. soft>0: cell `rank` fades over [rank/(N-1)*(1-soft), +soft] of e.
        for (const { cell, rank } of cells) {
          const s0 = n > 1 ? rank / (n - 1) * (1 - soft) : 0;
          cell.style.opacity = soft === 0 ? (rank < count ? "0" : "1") : String(1 - E.util.clamp01((e - s0) / soft));
        }
      }
    }, at);
    return { start, end: start + dur };
  };
  E.fx["pixel-dissolve"].kind = "transition";
})();
