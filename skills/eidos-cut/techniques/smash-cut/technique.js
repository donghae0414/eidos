(() => {
  const E = window.Eidos;
  const FLASHES = ["invert", "contrast", false];
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const durOf = (v) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) fail(`smash-cut: dur must be a finite number >= 0 (got ${JSON.stringify(v)})`);
    return v;
  };
  const layer = (cls, css) => {
    const el = document.createElement("div");
    el.className = cls;
    el.setAttribute("aria-hidden", "true");
    Object.assign(el.style, { position: "absolute", inset: "0", pointerEvents: "none", visibility: "hidden", ...css });
    return el;
  };

  E.fx["smash-cut"] = (stage, o = {}) => {
    const { tl, world } = stage;
    const { r3, clamp01, lerp } = E.util;
    const flash = o.flash ?? "invert";
    if (!FLASHES.some((f) => f === flash)) fail(`smash-cut: flash must be "invert", "contrast" or false (got ${JSON.stringify(o.flash)})`);
    if (o.slam != null && (typeof o.slam !== "string" || !o.slam.trim())) fail(`smash-cut: slam must be a non-empty string (got ${JSON.stringify(o.slam)})`);
    const slam = E.reduced ? null : o.slam ?? null;
    const lit = !E.reduced && flash !== false;
    // The swap happens right after start; dur is how long the flash or slam card lasts, 0 for a pure cut.
    const want = durOf(o.dur ?? (slam ? 1.1 : 0.45));
    const dur = !lit && !slam ? 0 : want;
    const start = tl.resolveAt(o.at);
    const at = { at: start, dur, ease: "linear" };
    const first = tl.tracks.length;
    const cut = (p) => p > 0;
    if (o.from) tl.tween(o.from, { opacity: (p) => (cut(p) ? 0 : 1) }, at);
    if (o.to) tl.tween(o.to, { opacity: (p) => (cut(p) ? 1 : 0) }, at);
    const on = (p) => p > 0 && p < 1;

    if (slam) {
      // Slam card: full-bleed inverted panel with one huge line, then it drops away to the new scene.
      const card = layer("eidos-fx-smash-cut-slam", {
        display: "grid", placeItems: "center", padding: "6vw", background: "var(--eidos-fg)",
      });
      const word = document.createElement("div");
      word.textContent = slam;
      Object.assign(word.style, {
        color: "var(--eidos-bg)", fontWeight: "800", fontSize: "clamp(48px, 13vw, 190px)", lineHeight: "1",
        letterSpacing: "-0.03em", textAlign: "center", wordBreak: "keep-all", fontVariantNumeric: "tabular-nums",
      });
      card.append(word);
      world.after(card);
      const HOLD = 0.62;
      tl.tween(card, {
        style: (p) => {
          if (!on(p)) return { visibility: "hidden", opacity: "0" };
          return { visibility: "visible", opacity: String(r3(p < HOLD ? 1 : 1 - E.ease.in(clamp01((p - HOLD) / (1 - HOLD))))) };
        },
      }, at);
      tl.tween(word, { scale: (p) => (on(p) ? lerp(1.18, 1, E.ease.out(clamp01(p / 0.25))) : 1) }, at);
    } else if (lit && flash === "invert") {
      // Invert flash: white with difference blending flips every colour, then decays.
      const inv = layer("eidos-fx-smash-cut-flash", { background: "#fff", mixBlendMode: "difference" });
      world.after(inv);
      tl.tween(inv, {
        style: (p) => (on(p) ? { visibility: "visible", opacity: String(r3(p < 0.35 ? 1 : 1 - E.ease.out((p - 0.35) / 0.65))) } : { visibility: "hidden", opacity: "0" }),
      }, at);
    } else if (lit && flash === "contrast") {
      if (o.to) tl.tween(o.to, { style: (p) => ({ filter: on(p) ? `contrast(${r3(lerp(2.2, 1, E.ease.out(p)))}) saturate(${r3(lerp(1.6, 1, E.ease.out(p)))})` : "none" }) }, at);
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
  E.fx["smash-cut"].kind = "transition";
})();
