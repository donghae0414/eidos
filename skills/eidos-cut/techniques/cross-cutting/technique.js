(() => {
  const E = window.Eidos;
  const fail = (message) => {
    (window.__eidosErrors ||= []).push(`cross-cutting: ${message}`);
    throw new Error(`cross-cutting: ${message}`);
  };
  E.fx["cross-cutting"] = (stage, o = {}) => {
    const allowed = { a: 1, b: 1, beats: 1, at: 1, dur: 1 };
    if (!o || typeof o !== "object" || Array.isArray(o)) fail("options must be an object");
    for (const key of Object.keys(o)) if (!Object.hasOwn(allowed, key)) fail(`unknown option ${key}`);
    const beats = o.beats, dur = o.dur ?? 4;
    if (!Array.isArray(beats) || beats.length < 2 || !beats.every((pair) => Array.isArray(pair) && pair.length === 2 && pair.every((v) => Number.isFinite(v) && v >= 0 && v <= 1))) fail("beats must contain at least two [a, b] progress pairs in [0, 1]");
    if (!Number.isFinite(dur) || dur < 0) fail("dur must be finite nonnegative seconds");
    let a, b;
    try { a = E.$all(o.a, stage.world); b = E.$all(o.b, stage.world); }
    catch { fail("a and b must be valid pane selectors or elements"); }
    if (a.length !== 1 || b.length !== 1 || a[0] === b[0] || a[0].contains(b[0]) || b[0].contains(a[0])) fail("a and b must each select one separate pane");
    const { tl } = stage, start = tl.resolveAt(o.at);
    if (!Number.isFinite(start) || start < 0) fail("at must resolve to finite nonnegative seconds");
    const bars = [a[0], b[0]].map((pane) => [...pane.querySelectorAll("[data-eidos-cross-progress]")]);
    const counters = [a[0], b[0]].map((pane) => [...pane.querySelectorAll("[data-eidos-cross-value]")]);
    tl.add((raw) => {
      const p = tl.t <= start ? 0 : raw < 1e-9 ? 0 : raw > 1 - 1e-9 ? 1 : raw;
      const step = p * beats.length, nearest = Math.round(step);
      const beat = Math.min(beats.length - 1, Math.floor(Math.abs(step - nearest) < 1e-9 ? nearest : step));
      [a[0], b[0]].forEach((pane, track) => {
        const value = beats[beat][track], active = beat % 2 === track;
        pane.style.opacity = active ? "1" : "0";
        pane.style.visibility = active ? "visible" : "hidden";
        pane.dataset.eidosCrossProgress = String(value);
        pane.dataset.eidosCrossBeat = String(beat);
        for (const bar of bars[track]) {
          bar.style.transformOrigin = "left center";
          bar.style.transform = `scaleX(${value})`;
        }
        for (const counter of counters[track]) counter.textContent = `${Math.round(value * 100)}%`;
      });
    }, { at: start, dur, ease: "linear" });
    return { start, end: start + dur };
  };
})();
