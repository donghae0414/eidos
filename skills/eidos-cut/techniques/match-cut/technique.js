(() => {
  const E = window.Eidos;
  const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;
  const parsePath = (d) => {
    const nums = [];
    const shape = d.replace(NUM, (m) => (nums.push(parseFloat(m)), "#"));
    return { shape, nums };
  };
  const one = (target, root) => {
    const el = E.$all(target, root)[0];
    if (!el) throw new Error(`match-cut: no element for ${target}`);
    return el;
  };

  E.fx["match-cut"] = (stage, o = {}) => {
    const { tl } = stage;
    const { lerp, r3 } = E.util;
    const dur = o.dur ?? 1.1;
    const start = tl.resolveAt(o.at);
    const fade = o.fade ?? dur * 0.5;
    const hold = dur * (o.hold ?? 0.2);
    const move = { at: start + hold, dur: dur - hold, ease: o.ease ?? "camera" };
    if (!o.match && !o.morph) throw new Error("match-cut: match or morph is required");

    if (o.from) tl.tween(o.from, { opacity: [1, 0] }, { at: start, dur: fade, ease: "inOut" });
    if (o.to) tl.tween(o.to, { opacity: [0, 1] }, { at: start, dur: fade, ease: "inOut" });

    if (o.match) {
      const fromEl = one(o.match[0], stage.world);
      const toEl = one(o.match[1], stage.world);
      let dx = 0, dy = 0, sx = 1, sy = 1;
      stage.onLayout(() => {
        const a = stage.measure(fromEl), b = stage.measure(toEl);
        dx = a.x + a.w / 2 - (b.x + b.w / 2);
        dy = a.y + a.h / 2 - (b.y + b.h / 2);
        sx = a.w / Math.max(b.w, 1);
        sy = a.h / Math.max(b.h, 1);
      });
      if (o.hide !== false) tl.tween(fromEl, { opacity: [1, 0] }, { at: start, dur: fade * 0.5, ease: "in" });
      tl.tween(
        toEl,
        {
          x: (p) => dx * (1 - p),
          y: (p) => dy * (1 - p),
          scaleX: (p) => lerp(sx, 1, p),
          scaleY: (p) => lerp(sy, 1, p),
        },
        move,
      );
    }

    if (o.morph) {
      const fromPath = one(o.morph[0], stage.world);
      const toPath = one(o.morph[1], stage.world);
      const a = parsePath(fromPath.getAttribute("d") || "");
      const b = parsePath(toPath.getAttribute("d") || "");
      if (a.shape !== b.shape) throw new Error("match-cut: morph paths must share the same command structure");
      const parts = b.shape.split("#");
      const dAt = (p) => {
        let d = parts[0];
        for (let i = 0; i < a.nums.length; i++) d += r3(lerp(a.nums[i], b.nums[i], p)) + parts[i + 1];
        return d;
      };
      if (o.hide !== false) tl.tween(fromPath, { opacity: [1, 0] }, { at: start, dur: fade * 0.5, ease: "in" });
      tl.tween(toPath, { attr: (p) => ({ d: dAt(p) }) }, move);
    }

    tl.prevStart = start;
    tl.extend(start + dur);
    return { start, end: start + dur };
  };
})();
