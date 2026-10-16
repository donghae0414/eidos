(() => {
  const E = window.Eidos;
  const DIRS = ["left", "right", "up", "down"];
  const SIDES = ["top", "right", "bottom", "left"];
  // Inset side of the incoming scene that shrinks to 0. dir is the way the boundary travels,
  // so "left" reveals the next scene from the right edge.
  const SIDE = { left: 3, right: 1, up: 0, down: 2 };
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const easeOf = (e) => (typeof e === "function" ? e : E.ease[e] || fail(`wipe: unknown ease ${JSON.stringify(e)}`));

  E.fx["wipe"] = (stage, o = {}) => {
    const { tl } = stage;
    const { r3, lerp } = E.util;
    const dir = o.dir ?? "left";
    if (!DIRS.includes(dir)) fail(`wipe: dir must be one of ${DIRS.join(", ")} (got ${JSON.stringify(o.dir)})`);
    const dur = o.dur ?? 0.7;
    if (!Number.isFinite(dur) || dur < 0) fail(`wipe: dur must be a finite number >= 0 (got ${JSON.stringify(o.dur)})`);
    const soft = o.soft === true ? 48 : o.soft == null || o.soft === false ? 0 : Number(o.soft);
    if (!Number.isFinite(soft) || soft < 0) fail(`wipe: soft must be true, false or px >= 0 (got ${JSON.stringify(o.soft)})`);
    const ease = easeOf(o.ease ?? "inOut");
    const start = tl.resolveAt(o.at);
    const at = { at: start, dur, ease: "linear" };

    if (E.reduced) {
      // Reduced motion: a plain fade, no moving edge.
      if (o.from) tl.tween(o.from, { opacity: (p) => 1 - ease(p) }, at);
      if (o.to) tl.tween(o.to, { opacity: (p) => ease(p) }, at);
    } else {
      const side = SIDE[dir];
      const toward = SIDES[(side + 2) % 4];
      const inset = (i, v) => {
        const a = [0, 0, 0, 0];
        a[i] = r3(v * 100);
        return `inset(${a.map((x) => x + "%").join(" ")})`;
      };
      // Soft edge: complementary gradient masks whose band centre crosses from -soft/2 to 100%+soft/2.
      const band = (e) => {
        const pct = r3((1 - e) * 100), px = r3(lerp(soft / 2, -soft / 2, e) + 0);
        const c = `calc(${pct}% + ${px}px)`;
        return [`calc(${c} - ${soft / 2}px)`, `calc(${c} + ${soft / 2}px)`];
      };
      // Always write explicit values: removing a property and re-adding it later reorders the
      // style attribute, which would make snapshot() depend on the seek path.
      const mask = (v) => ({ maskImage: v, webkitMaskImage: v });
      const toStyle = (e) => {
        if (e >= 1) return { clipPath: "none", ...mask("none") };
        // Fully hidden: a closed clip, not a transparent mask (WebKit can skip painting the first frame).
        if (e <= 0 || !soft) return { clipPath: inset(side, 1 - e), ...mask("none") };
        const [a, b] = band(e);
        return { clipPath: "none", ...mask(`linear-gradient(to ${toward}, transparent ${a}, #000 ${b})`) };
      };
      const fromStyle = (e) => {
        if (e <= 0 || e >= 1) return { clipPath: "none", ...mask("none") };
        if (!soft) return { clipPath: inset((side + 2) % 4, e), ...mask("none") };
        const [a, b] = band(e);
        return { clipPath: "none", ...mask(`linear-gradient(to ${toward}, #000 ${a}, transparent ${b})`) };
      };
      if (o.from) tl.tween(o.from, { opacity: (p) => (p < 1 ? 1 : 0), style: (p) => fromStyle(ease(p)) }, at);
      if (o.to) tl.tween(o.to, { opacity: (p) => (p > 0 ? 1 : 0), style: (p) => toStyle(ease(p)) }, at);
    }
    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
  E.fx["wipe"].kind = "transition";
})();
