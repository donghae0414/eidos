(() => {
  const E = window.Eidos;
  const fail = (msg) => {
    (window.__eidosErrors ||= []).push(msg);
    throw new Error(msg);
  };
  const { r3 } = E.util;

  // A slot is an inline-block window clipped to its own line box. A hidden sizer holds the widest word, so
  // the sentence around the slot never reflows; every word occurrence has its own positioned layer.
  // State lives on the element, so a later call continues from the word the previous call left in the slot.
  function setup(stage, el) {
    if (el.__eidosSlot) return el.__eidosSlot;
    const box = document.createElement("span");
    box.className = "eidos-slot";
    box.style.cssText = "display:inline-block;position:relative;white-space:nowrap;clip-path:inset(0)";
    const sizer = document.createElement("span");
    sizer.className = "eidos-slot-size";
    sizer.setAttribute("aria-hidden", "true");
    sizer.style.visibility = "hidden";
    sizer.textContent = el.textContent;
    el.textContent = "";
    box.appendChild(sizer);
    el.appendChild(box);
    const st = { box, sizer, spans: new Map(), last: null, h: 0 };
    stage.onLayout(() => {
      let widest = "", max = -1;
      for (const word of st.spans.keys()) {
        sizer.textContent = word;
        const w = sizer.getBoundingClientRect().width;
        if (w > max) {
          max = w;
          widest = word;
        }
      }
      sizer.textContent = widest;
      st.h = box.offsetHeight;
    });
    return (el.__eidosSlot = st);
  }

  function layer(st, word, reuse) {
    let span = reuse ? st.spans.get(word) : null;
    if (span) return span;
    span = document.createElement("span");
    span.className = "eidos-slot-word";
    span.textContent = word;
    span.style.cssText = `position:absolute;left:0;top:0;width:100%;white-space:nowrap;opacity:${st.spans.size ? 0 : 1}`;
    st.box.appendChild(span);
    st.spans.set(word, span);
    return span;
  }

  E.fx["word-slot-cycle"] = (stage, o = {}) => {
    const allowed = { targets: 1, target: 1, words: 1, each: 1, dur: 1, stopEach: 1, at: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`word-slot-cycle: unknown option ${String(key)}`);
    const { tl } = stage;
    const slots = E.$all(o.targets ?? o.target, stage.world);
    if (!slots.length) fail(`word-slot-cycle: no element for targets ${o.targets ?? o.target}`);
    const words = o.words;
    if (!Array.isArray(words) || words.length < 2 || !words.every((w) => typeof w === "string" && w.trim())) {
      fail("word-slot-cycle: words must be an array of at least 2 non-empty strings");
    }
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1]) fail(`word-slot-cycle: words[${i - 1}] and words[${i}] are both "${words[i]}"`);
    }
    const each = o.each ?? 0.5;
    const dur = o.dur ?? 0.35;
    for (const [k, v] of [["each", each], ["dur", dur]]) if (!(Number.isFinite(v) && v >= 0)) fail(`word-slot-cycle: ${k} must be a number >= 0`);
    const stopEach = o.stopEach ?? false;
    if (typeof stopEach !== "boolean") fail("word-slot-cycle: stopEach must be true or false");
    const states = slots.map((el) => setup(stage, el));
    for (const st of states) {
      if (st.last != null && st.last !== words[0]) fail(`word-slot-cycle: words[0] must be the word already in the slot ("${st.last}"), got "${words[0]}"`);
    }
    // With stopEach the stop itself is the pause, so swaps follow each other directly.
    const hold = stopEach ? 0 : each;
    const start = tl.resolveAt(o.at);
    const layers = states.map((st) => words.map((w, i) => layer(st, w, i === 0)));
    if (stopEach) {
      tl.extend(start);
      tl.stop(words[0]);
    }
    const swaps = [];
    for (let i = 1; i < words.length; i++) {
      const at = start + (i - 1) * (dur + hold);
      const pairs = layers.map((ls) => [ls[i - 1], ls[i]]);
      // Outgoing and incoming share one eased progress, so the two layers always abut and never overlap:
      // the old word leaves through the top edge while the new one enters through the bottom edge.
      tl.add(
        E.reduced
          ? (p) => {
              for (const [out, inn] of pairs) {
                out.style.opacity = String(r3(1 - p));
                inn.style.opacity = String(r3(p));
              }
            }
          : (p) => {
              for (let k = 0; k < pairs.length; k++) {
                const [out, inn] = pairs[k], h = states[k].h;
                out.style.transform = `translateY(${r3(-h * p)}px)`;
                out.style.opacity = String(r3(1 - p));
                inn.style.transform = `translateY(${r3(h * (1 - p))}px)`;
                inn.style.opacity = String(r3(p));
              }
            },
        { at, dur, ease: "inOut" },
      );
      if (stopEach) tl.stop(words[i]);
      swaps.push({ at, end: at + dur });
    }
    const end = swaps[swaps.length - 1].end;
    for (const st of states) st.last = words[words.length - 1];
    tl.prevStart = start;
    const items = states.flatMap((st, k) =>
      words.map((word, i) => ({
        el: layers[k][i],
        slot: slots[k],
        word,
        start: i ? swaps[i - 1].at : start,
        end: i ? swaps[i - 1].end : start,
      })),
    );
    return { start, end, items };
  };
})();
