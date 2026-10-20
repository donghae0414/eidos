(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const r3 = E.util.r3;
  const rooms = new WeakMap();
  const previous = new WeakMap();
  const mix = (from, to, q) => `color-mix(in oklab, ${to} ${Math.round(q * 100)}%, ${from})`;
  const percent = (p) => `${p > 0 && p < 0.005 ? "<1" : Math.round(p * 100)}%`;
  const node = (tag, cls, css, text) => {
    const n = document.createElement(tag);
    n.className = cls;
    n.style.cssText = css;
    if (text != null) n.textContent = text;
    return n;
  };

  E.fx["next-token"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, candidates: 1, pick: 1, dur: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`next-token: unknown option ${String(key)}`);
    const sel = o.targets ?? o.target;
    if (sel == null) fail("next-token: targets is required (the empty slot at the end of a sentence)");
    const slots = E.$all(sel, stage.world);
    if (slots.length !== 1) fail(`next-token: targets must select exactly one slot (got ${slots.length} for ${sel})`);
    const slot = slots[0];
    if (slot.textContent.trim()) fail(`next-token: the slot must be empty (got "${slot.textContent.trim()}")`);
    const list = o.candidates;
    if (!Array.isArray(list) || list.length < 2 || list.length > 6)
      fail(`next-token: candidates must be an array of 2-6 { text, p } (got ${Array.isArray(list) ? `${list.length} items` : String(list)})`);
    list.forEach((c, i) => {
      if (typeof c?.text !== "string" || !c.text.trim()) fail(`next-token: candidates[${i}].text must be a non-empty string`);
      if (!(Number.isFinite(c.p) && c.p >= 0 && c.p <= 1)) fail(`next-token: candidates[${i}].p must be a probability from 0 to 1 (got ${c.p})`);
    });
    const sum = list.reduce((a, c) => a + c.p, 0);
    if (sum > 1 + 1e-9) fail(`next-token: candidate probabilities add up to ${r3(sum)}, more than 1`);
    const pick = o.pick ?? list.reduce((best, c, i) => (c.p > list[best].p ? i : best), 0);
    if (!(Number.isInteger(pick) && pick >= 0 && pick < list.length))
      fail(`next-token: pick must be a candidate index from 0 to ${list.length - 1} (got ${o.pick})`);
    const T = o.dur ?? 2.4;
    if (!(Number.isFinite(T) && T > 0)) fail(`next-token: dur must be a positive number of seconds (got ${o.dur})`);
    let block = slot.parentElement;
    while (block && block !== stage.world && /^(inline|contents)/.test(getComputedStyle(block).display)) block = block.parentElement;
    if (!block || block === stage.world) fail("next-token: the slot must sit inside a sentence block (such as <p>) in the stage world");
    const { tl } = stage;

    // The picked token waits inside the slot (invisible), so the blank is as wide as the word that lands
    // and the sentence never re-wraps; the flight transform starts it over its candidate row.
    Object.assign(slot.style, { display: "inline-block", position: "relative", whiteSpace: "nowrap" });
    const token = node("span", "eidos-nt-token", "display:inline-block;transform-origin:0 0;color:var(--eidos-accent);opacity:0", list[pick].text);
    const blank = node("span", "eidos-nt-blank", "position:absolute;left:0;right:0;bottom:0.08em;height:max(2px,0.07em);border-radius:1px;background:var(--eidos-muted-fg)");
    blank.setAttribute("aria-hidden", "true");
    slot.append(token, blank);
    let room = rooms.get(block);
    if (!room) {
      room = node("div", "eidos-nt-room", "display:grid;padding-top:0.6em");
      block.after(room);
      rooms.set(block, room);
    }
    const panel = node(
      "div",
      "eidos-nt",
      "grid-area:1/1;width:min(22em,100%);display:grid;grid-template-columns:max-content minmax(3em,1fr) max-content;column-gap:0.8em;row-gap:0.5em;align-items:center;font-size:clamp(0.95rem,1.7vw,1.2rem);line-height:1.25",
    );
    room.appendChild(panel);
    // Candidate words copy the sentence's face so the hand-off to the flying token does not jump.
    const face = getComputedStyle(slot);
    const rows = list.map((c) => {
      const word = node("span", "eidos-nt-word", `white-space:nowrap;color:var(--eidos-fg);font-family:${face.fontFamily};font-weight:${face.fontWeight}`, c.text);
      const track = node("span", "eidos-nt-track", "position:relative;display:block;height:0.5em;border-radius:999px;background:var(--eidos-border)");
      const bar = node("span", "eidos-nt-bar", "position:absolute;inset:0;border-radius:inherit;transform-origin:0 50%;background:var(--eidos-muted-fg)");
      const num = node("span", "eidos-nt-p", "text-align:right;font-variant-numeric:tabular-nums;color:var(--eidos-fg)", percent(c.p));
      track.appendChild(bar);
      panel.append(word, track, num);
      return { word, track, bar, num, p: c.p };
    });
    const rest = 1 - sum >= 0.005
      ? node("span", "eidos-nt-rest", "grid-column:1/-1;font-size:0.85em;color:var(--eidos-muted-fg)", `그 밖의 토큰 ${percent(1 - sum)}`)
      : null;
    if (rest) panel.appendChild(rest);

    let fly = null;
    stage.onLayout(() => {
      const at = stage.measure(slot), box = stage.measure(room);
      panel.style.marginLeft = `${Math.max(0, Math.min(at.x - box.x, box.w - panel.offsetWidth))}px`;
      if (E.reduced) return;
      const from = stage.measure(rows[pick].word), to = stage.measure(token);
      const k = from.w / to.w;
      const dx = from.x - to.x, dy = from.y + from.h / 2 - (to.y + (to.h * k) / 2);
      // tl.tween fixes the arc's bend direction when it is called, and this flight's direction is only known
      // after layout, so the arc tween is rebuilt here on a scratch timeline and replayed by one real track.
      const scratch = new E.Timeline();
      scratch.tween(token, { x: [dx, 0], y: [dy, 0], scale: [k, 1] }, { arc: Math.min(48, Math.max(8, 0.18 * Math.hypot(dx, dy))) });
      fly = scratch.tracks[0].fn;
    });

    const prev = previous.get(stage);
    const start = tl.resolveAt(o.at);
    const lead = prev ? 0.12 * T : 0;
    if (prev) {
      tl.tween(prev.panel, { opacity: [1, 0] }, { at: start, dur: lead, ease: "in" });
      const plain = { style: (q) => ({ color: mix("var(--eidos-accent)", "var(--eidos-fg)", q) }) };
      tl.tween(prev.token, plain, E.reduced ? { at: start + lead, dur: 0 } : { at: start, dur: lead, ease: "out" });
    }
    const t0 = start + lead;
    const each = Math.min(0.06 * T, (0.2 * T) / (rows.length - 1));
    const rise = E.reduced ? { opacity: [0, 1] } : { opacity: [0, 1], y: [10, 0] };
    const items = rows.map((r, i) => {
      const at = t0 + i * each;
      tl.tween([r.word, r.track], rise, { at, dur: 0.15 * T, ease: "out" });
      if (E.reduced) r.bar.style.transform = `scale(${r3(r.p)}, 1)`;
      else tl.tween(r.bar, { scaleX: [0, r.p] }, { at: at + 0.05 * T, dur: 0.35 * T, ease: "out" });
      tl.tween(r.num, { opacity: [0, 1] }, { at: at + 0.26 * T, dur: 0.12 * T, ease: "out" });
      return { el: r.word, bar: r.bar, p: r.p, picked: i === pick, start: at, end: at + 0.4 * T };
    });
    if (rest) tl.tween(rest, { opacity: [0, 1] }, { at: items[items.length - 1].start + 0.26 * T, dur: 0.12 * T, ease: "out" });

    const pickAt = t0 + 0.62 * T, pickDur = E.reduced ? 0 : 0.1 * T;
    const win = rows[pick];
    const toAccent = (prop, from) => (q) => ({ [prop]: mix(from, "var(--eidos-accent)", q) });
    tl.tween(win.word, { style: toAccent("color", "var(--eidos-fg)") }, { at: pickAt, dur: pickDur, ease: "out" });
    tl.tween(win.num, { style: toAccent("color", "var(--eidos-fg)") }, { at: pickAt, dur: pickDur, ease: "out" });
    tl.tween(win.bar, { style: toAccent("background", "var(--eidos-muted-fg)") }, { at: pickAt, dur: pickDur, ease: "out" });
    const others = rows.flatMap((r, i) => (i === pick ? [] : [r.word, r.track, r.num]));
    tl.tween(others, { opacity: [1, 0.5] }, { at: pickAt, dur: pickDur, ease: "out" });

    const flyAt = t0 + 0.7 * T;
    if (E.reduced) tl.tween(token, { opacity: [0, 1] }, { at: flyAt, dur: 0.15 * T, ease: "out" });
    else {
      tl.tween(token, { opacity: [0, 1] }, { at: flyAt, dur: 0 });
      // In flight the token paints above the candidate list and wears a background halo that fades as it lands,
      // so it stays readable over the bars it crosses; at rest both are cleared.
      tl.add((e) => {
        fly?.(e);
        const air = e > 1e-3 && e < 1 - 1e-3, halo = mix("transparent", "var(--eidos-bg)", 1 - e);
        slot.style.zIndex = air ? "1" : "";
        token.style.textShadow = air ? `0 0 0.12em ${halo}, 0 0 0.12em ${halo}` : "";
      }, { at: flyAt, dur: 0.3 * T, ease: "out" });
      tl.tween(win.word, { opacity: [1, 0] }, { at: flyAt, dur: 0 });
      tl.tween(win.word, { opacity: [0, 1] }, { at: flyAt + 0.2 * T, dur: 0.1 * T, ease: "out" });
    }
    tl.tween(blank, { opacity: [1, 0] }, { at: flyAt, dur: 0.05 * T, ease: "out" });

    const end = t0 + T;
    tl.prevStart = start;
    tl.extend(end);
    previous.set(stage, { panel, token });
    return { start, end, items, token, panel };
  };
})();
