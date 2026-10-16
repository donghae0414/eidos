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
  const durOf = (v) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) fail(`wipe: dur must be a finite number >= 0 (got ${JSON.stringify(v)})`);
    return v;
  };
  // Own keys only: inherited names such as "constructor" must not pass as an ease.
  const easeOf = (e) =>
    typeof e === "function" ? e
      : typeof e === "string" && Object.hasOwn(E.ease, e) ? E.ease[e]
        : fail(`wipe: ease must be a function or one of ${Object.keys(E.ease).join(", ")} (got ${JSON.stringify(e)})`);

  E.fx["wipe"] = (stage, o = {}) => {
    const { tl } = stage;
    const { r3, lerp } = E.util;
    const dir = o.dir ?? "left";
    if (typeof dir !== "string" || !DIRS.includes(dir)) fail(`wipe: dir must be one of ${DIRS.join(", ")} (got ${JSON.stringify(o.dir)})`);
    const dur = durOf(o.dur ?? 0.7);
    const soft = o.soft === true ? 48 : o.soft == null || o.soft === false ? 0 : typeof o.soft === "number" ? o.soft : NaN;
    if (!Number.isFinite(soft) || soft < 0) fail(`wipe: soft must be true, false or px >= 0 (got ${JSON.stringify(o.soft)})`);
    const ease = easeOf(o.ease ?? "inOut");
    const start = tl.resolveAt(o.at);
    const at = { at: start, dur, ease: "linear" };
    const first = tl.tracks.length;

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
      // Endpoints are decided on the runtime-snapped progress p (exactly 0 or 1 at the ends), the same value
      // that drives opacity, so visibility and clipping always agree; ease only shapes the moving edge.
      const toStyle = (p) => {
        const e = ease(p);
        if (p >= 1) return { clipPath: "none", ...mask("none") };
        // Fully hidden: a closed clip, not a transparent mask (WebKit can skip painting the first frame).
        if (p <= 0 || !soft) return { clipPath: inset(side, 1 - e), ...mask("none") };
        const [a, b] = band(e);
        return { clipPath: "none", ...mask(`linear-gradient(to ${toward}, transparent ${a}, #000 ${b})`) };
      };
      const fromStyle = (p) => {
        const e = ease(p);
        if (p <= 0 || p >= 1) return { clipPath: "none", ...mask("none") };
        if (!soft) return { clipPath: inset((side + 2) % 4, e), ...mask("none") };
        const [a, b] = band(e);
        return { clipPath: "none", ...mask(`linear-gradient(to ${toward}, #000 ${a}, transparent ${b})`) };
      };
      if (o.from) tl.tween(o.from, { opacity: (p) => (p < 1 ? 1 : 0), style: fromStyle }, at);
      if (o.to) tl.tween(o.to, { opacity: (p) => (p > 0 ? 1 : 0), style: toStyle }, at);
    }
    // Same rule the runtime uses for zero-duration scene entries (openScene): a track starting exactly
    // at a stop time takes effect only for t > start, so a viewer parked on the previous stop still sees
    // that stop's scene while dur: 0 keeps end === start.
    for (const tr of tl.tracks.slice(first)) {
      const fn = tr.fn;
      tr.fn = (p) => fn(tl.t <= start ? 0 : p);
    }
    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
  E.fx["wipe"].kind = "transition";
})();
