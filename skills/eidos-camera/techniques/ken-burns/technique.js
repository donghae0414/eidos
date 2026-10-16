(() => {
  const E = window.Eidos;
  E.fx["ken-burns"] = (stage, o = {}) => {
    const { tl, camera } = stage;
    const glide = E.bezier(0.37, 0, 0.63, 1);
    const frame = (rect) => {
      if (!Array.isArray(rect)) return rect;
      if (rect.length !== 4 || !rect.every(Number.isFinite) || !(rect[2] > 0 && rect[3] > 0)) {
        window.__eidosErrors.push(`ken-burns rect must be [x, y, w, h] fractions with w and h above 0, got ${JSON.stringify(rect)}`);
        rect = [0, 0, 1, 1];
      }
      const [fx, fy, fw, fh] = rect;
      return () => {
        const box = stage.measure(o.in ?? stage.world.firstElementChild);
        return { x: box.x + fx * box.w, y: box.y + fy * box.h, w: fw * box.w, h: fh * box.h };
      };
    };
    const padFor = (rect, pad) => pad ?? (Array.isArray(rect) ? 0 : undefined);
    const move = (to, m) => {
      if (to == null) window.__eidosErrors.push("ken-burns needs a to framing");
      const at = tl.resolveAt(m.at);
      const dur = m.dur ?? o.dur ?? 4.5;
      if (m.from != null) camera.to(frame(m.from), { at, dur: 0, pad: padFor(m.from, m.pad) });
      camera.to(frame(to), { at, dur, pad: padFor(to, m.pad), ease: m.ease ?? o.ease ?? glide });
      tl.extend(at + dur);
      return { start: at, end: at + dur };
    };
    return { ...move(o.to, o), drift: (to, m = {}) => move(to, m) };
  };
})();
