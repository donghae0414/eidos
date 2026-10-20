(() => {
  const E = window.Eidos;
  // file:// reports errors thrown from another script file as "Script error.", so record the message first.
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const { r3, clamp01, lerp } = E.util;
  const px = (v) => `${r3(v)}px`;
  const mix = (a, b, p) => (p <= 0 ? a : p >= 1 ? b : `color-mix(in oklab, ${b} ${r3(p * 100)}%, ${a})`);
  const FORGOTTEN_OPACITY = 0.5;
  const GAP_EM = 0.35;
  const PAD_EM = 0.4;
  const FADE_SLOTS = 0.5;
  const FRAME_PX = 2;
  const CHIP_BORDERS_PX = 3;
  const SNAP = 1e-6;
  const NEW = "color-mix(in oklab, var(--eidos-accent) 16%, var(--eidos-surface))";

  const quote = (els) => {
    const words = els.map((c) => `‘${c.textContent.trim()}’`);
    return words.length > 3 ? `${words.slice(0, 3).join(" ")} 외 ${words.length - 3}개` : words.join(" ");
  };

  // Every chip sits in an equal slot sized to the widest chip ("one token, one slot"); the frame border is centred
  // on a slot boundary, inside the gap between two chips. The group [fade][kept forgotten][size] is centred in the
  // track. A narrow track keeps fewer forgotten slots first and shrinks the type only when one kept slot won't fit.
  function layout(track, st) {
    const { chips, size, frame } = st;
    for (const c of chips) {
      c.style.fontSize = "";
      c.style.width = "";
      c.style.height = "";
    }
    const fs = parseFloat(getComputedStyle(track).fontSize) || 16;
    const need = Math.max(...chips.map((c) => c.offsetWidth)) + GAP_EM * fs;
    const W = track.clientWidth;
    const room = W - FRAME_PX;
    let keep = st.shift, fade = 0;
    while (keep > 1 && (size + keep + fade) * need > room) {
      keep--;
      fade = FADE_SLOTS;
    }
    const slots = size + keep + fade;
    const s = Math.min(1, (room / slots - CHIP_BORDERS_PX) / (need - CHIP_BORDERS_PX));
    const slot = (need - CHIP_BORDERS_PX) * s + CHIP_BORDERS_PX, gap = GAP_EM * fs * s, pad = PAD_EM * fs * s;
    for (const c of chips) {
      if (s < 1) c.style.fontSize = `${r3(s)}em`;
      c.style.width = px(slot - gap);
    }
    const h = Math.max(...chips.map((c) => c.offsetHeight));
    const x0 = (W - slots * slot) / 2 + (keep + fade) * slot;
    for (const c of chips) {
      c.style.height = px(h);
      c.style.top = px(FRAME_PX + pad);
    }
    const H = h + 2 * pad + 2 * FRAME_PX;
    Object.assign(frame.style, { left: px(x0 - FRAME_PX / 2), width: px(size * slot + FRAME_PX), height: px(H) });
    track.style.height = px(H);
    st.g = { x0, slot, gap, keep, fade };
  }

  // One state per track, so a later call continues from where the previous call left the window.
  function setup(stage, track, size) {
    const chips = [...track.children];
    if (chips.length <= size) fail(`context-window: the track needs more chips than size (${size}), it has ${chips.length}`);
    for (const node of track.childNodes)
      if (node.nodeType === 3 && node.nodeValue.trim()) fail("context-window: wrap every token of the track in its own element");
    if (getComputedStyle(track).position === "static") track.style.position = "relative";
    const frame = document.createElement("div");
    frame.className = "eidos-cw-frame";
    frame.style.cssText = `position:absolute;left:0;top:0;box-sizing:border-box;border:${FRAME_PX}px solid var(--eidos-fg);border-radius:var(--eidos-radius-sm);background:color-mix(in oklab, var(--eidos-fill-warm) 55%, transparent);pointer-events:none`;
    track.insertBefore(frame, track.firstChild);
    for (const c of chips) {
      c.classList.add("eidos-cw-chip");
      c.style.cssText += `;position:absolute;left:0;top:0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:0 0.3em;white-space:nowrap;border:${CHIP_BORDERS_PX / 2}px solid var(--eidos-border);border-radius:var(--eidos-radius-sm);background-color:var(--eidos-surface)`;
    }
    const st = { size, chips, frame, shift: 0, lastPush: 0, g: null };
    stage.onLayout(() => layout(track, st));
    return (track.__eidosContextWindow = st);
  }

  // A step moves the window from shift a to shift b. Opacity follows each chip's slot position: it fades in through
  // the frame's right edge, dims while crossing the left edge, and the oldest kept forgotten chip fades out over
  // FADE_SLOTS. `fresh` tints the chips this step brings in and untints the ones the previous step brought.
  // Progress within SNAP of either end counts as that end, so a stop's state also holds at t +/- 1e-6; under reduced
  // motion every value jumps to the step's end state as soon as the step starts, and nothing is interpolated.
  function paint(st, a, b, prev, p) {
    const { chips, size, g } = st;
    if (!g) return;
    const q = p < SNAP ? 0 : p > 1 - SNAP ? 1 : p;
    const e = E.reduced ? (q > 0 ? 1 : 0) : q;
    const shift = lerp(a, b, e);
    chips.forEach((c, i) => {
      const pos = i - shift;
      const out = clamp01(-pos);
      let op = pos < 0 ? lerp(1, FORGOTTEN_OPACITY, out) : clamp01(size - pos);
      if (g.fade && pos < -g.keep) op = FORGOTTEN_OPACITY * clamp01((pos + g.keep + g.fade) / g.fade);
      const fresh = i >= a + size && i < b + size ? e : i >= a + size - prev && i < a + size ? 1 - e : 0;
      c.style.transform = `translate(${r3(g.x0 + pos * g.slot + g.gap / 2)}px, 0px)`;
      c.style.opacity = String(r3(op));
      c.style.borderStyle = out > 0.5 ? "dashed" : "solid";
      c.style.borderColor = out > 0.5 ? "var(--eidos-muted-fg)" : mix("var(--eidos-border)", "var(--eidos-accent)", fresh);
      c.style.backgroundColor = mix(mix("var(--eidos-surface)", NEW, fresh), "transparent", out);
    });
  }

  E.fx["context-window"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, size: 1, push: 1, steps: 1, stopEach: 1, dur: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`context-window: unknown option ${String(key)}`);
    if (o.targets == null && o.target == null) fail("context-window: targets is required");
    if (o.size == null) fail("context-window: size is required");
    const { tl } = stage;
    const size = o.size, push = o.push ?? 1, dur = o.dur ?? 0.7, stopEach = o.stopEach ?? false;
    if (!Number.isInteger(size) || size < 1) fail("context-window: size must be an integer >= 1");
    if (!Number.isInteger(push) || push < 1 || push > size) fail(`context-window: push must be an integer from 1 to size (${size})`);
    if (!(typeof dur === "number" && Number.isFinite(dur) && dur > 0)) fail("context-window: dur must be a number > 0");
    if (typeof stopEach !== "boolean") fail("context-window: stopEach must be true or false");
    const tracks = E.$all(o.targets ?? o.target, stage.world);
    if (tracks.length !== 1) fail(`context-window: targets must match one track element, got ${tracks.length} for ${o.targets ?? o.target}`);
    const st = tracks[0].__eidosContextWindow ?? setup(stage, tracks[0], size);
    if (st.size !== size) fail(`context-window: this track was set up with size ${st.size}, got ${size}`);
    const left = st.chips.length - (st.shift + size);
    if (left < 1) fail("context-window: no chips are left to push");
    const most = Math.ceil(left / push);
    const steps = o.steps ?? most;
    if (!Number.isInteger(steps) || steps < 1 || steps > most)
      fail(`context-window: steps must be an integer from 1 to ${most} (${left} chips left, push ${push})`);

    const start = tl.resolveAt(o.at);
    const items = [];
    let at = start;
    for (let k = 0; k < steps; k++) {
      const a = st.shift, n = Math.min(push, st.chips.length - (a + size)), b = a + n, prev = st.lastPush;
      tl.add((p) => paint(st, a, b, prev, p), { at, dur, ease: "inOut" });
      const item = { start: at, end: at + dur, added: st.chips.slice(a + size, b + size), forgotten: st.chips.slice(a, b) };
      items.push(item);
      st.shift = b;
      st.lastPush = n;
      at += dur;
      if (stopEach) tl.stop(`${quote(item.added)} 들어옴 · ${quote(item.forgotten)} 밀려남`);
    }
    tl.prevStart = start;
    return { start, end: at, items, frame: st.frame };
  };
})();
