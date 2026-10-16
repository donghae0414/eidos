(() => {
  const E = window.Eidos;
  const { r3, lerp } = E.util;
  const RAD = Math.PI / 180;
  const fail = (message) => {
    const text = `orbit: ${message}`;
    window.__eidosErrors.push(text);
    throw new Error(text);
  };
  const number = (value, name) => {
    if (!Number.isFinite(value)) fail(`${name} must be a finite number`);
    return value;
  };
  const select = (target, root) => {
    try { return E.$all(target, root); }
    catch { fail(`invalid element selector ${String(target)}`); }
  };

  // Perspective of one plane (centre c, unit axes a and b, eye at (0, 0, F) looking down -z, px).
  // The wrapper takes the projected centre as a 2D translate and the plane a homography centred
  // there. Its affine part is the first-order term, the only part WebKit snapshots paint, so QA
  // screenshots keep the depth scale while browsers render the exact perspective.
  const project = (F, c, a, b) => {
    const D = F - c[2], X = (F * c[0]) / D, Y = (F * c[1]) / D;
    return { D, X, Y, m: [(F * a[0] + X * a[2]) / D, (F * a[1] + Y * a[2]) / D, (F * b[0] + X * b[2]) / D, (F * b[1] + Y * b[2]) / D], w: [-a[2] / D, -b[2] / D] };
  };
  const place = (pl, q) => {
    const m = q.m.map((v) => v.toFixed(5));
    pl.wrap.style.transform = `translate(${r3(q.X)}px, ${r3(q.Y)}px)`;
    pl.el.style.transform = E.reduced
      ? `matrix(${m[0]}, ${m[1]}, ${m[2]}, ${m[3]}, 0, 0) translate(-50%, -50%)`
      : `matrix3d(${m[0]}, ${m[1]}, 0, ${q.w[0].toFixed(7)}, ${m[2]}, ${m[3]}, 0, ${q.w[1].toFixed(7)}, 0, 0, 1, 0, 0, 0, 0, 1) translate(-50%, -50%)`;
  };

  E.fx["orbit"] = (stage, o = {}) => {
    const { tl, world } = stage;
    const rig = select(o.rig ?? ".orbit-rig", world)[0];
    if (!rig) fail("rig must identify an element");
    const els = o.planes ? select(o.planes, world) : [...rig.children];
    if (!els.length || els.some((el) => el.parentElement !== rig)) fail("planes must be children of rig");
    const probe = document.createElement("i");
    probe.style.cssText = `position: absolute; width: ${o.unit ?? "var(--u)"}; height: 0; visibility: hidden`;
    rig.appendChild(probe);
    let U = 1;
    stage.onLayout(() => { U = probe.offsetWidth || 1; });
    const num = (el, k) => number(Number(el.dataset[k] ?? 0), `data-${k}`);
    const planes = els.map((el) => {
      const wrap = document.createElement("div");
      wrap.style.cssText = "position: absolute; left: 0; top: 0";
      el.replaceWith(wrap);
      wrap.appendChild(el);
      Object.assign(el.style, { position: "absolute", left: "0", top: "0", transformOrigin: "0 0" });
      return { el, wrap, x: num(el, "x"), y: num(el, "y"), z: num(el, "z"), ry: num(el, "ry") * RAD };
    });
    const P = number(o.perspective ?? 3, "perspective");
    if (P <= 0 || planes.some((p) => Math.hypot(p.x, p.y, p.z) >= P)) fail("perspective must be positive and exceed every plane centre's distance from rig");

    const render = ({ yaw, pitch }) => {
      const F = P * U;
      const cy = Math.cos(yaw * RAD), sy = Math.sin(yaw * RAD), cp = Math.cos(pitch * RAD), sp = Math.sin(pitch * RAD);
      const rot = (x, y, z) => {
        const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
        return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
      };
      for (const p of planes) {
        const cr = Math.cos(p.ry), sr = Math.sin(p.ry);
        const c = rot(p.x * U, p.y * U, p.z * U), n = rot(sr, 0, cr);
        const q = project(F, c, rot(cr, 0, -sr), rot(0, 1, 0));
        place(p, q);
        const facing = n[2] * (F - c[2]) - n[0] * c[0] - n[1] * c[1] > 0.001 * U;
        // opacity as well: a descendant animated with `draw` sets visibility: visible and would show through.
        p.wrap.style.visibility = facing ? "visible" : "hidden";
        p.wrap.style.opacity = facing ? "1" : "0";
        p.wrap.style.zIndex = String(10000 - Math.round((q.D / U) * 100));
      }
    };

    const start = tl.resolveAt(o.at);
    if (!Number.isFinite(start) || start < 0) fail("at must be finite and nonnegative");
    const first = { yaw: number(o.yaw ?? 0, "yaw"), pitch: number(o.pitch ?? -12, "pitch") };
    let pose = first;
    tl.add(() => render(first), { at: start, dur: 0 });

    return {
      start,
      end: start,
      to(yaw, t = {}) {
        const a = pose, b = { yaw: number(yaw, "yaw"), pitch: number(t.pitch ?? pose.pitch, "pitch") };
        const at = tl.resolveAt(t.at);
        const dur = number(t.dur ?? 1.6, "dur");
        if (!Number.isFinite(at) || at < 0 || dur < 0) fail("at and dur must be finite and nonnegative");
        tl.add((p) => render(E.reduced ? (p < 0.5 ? a : b) : { yaw: lerp(a.yaw, b.yaw, p), pitch: lerp(a.pitch, b.pitch, p) }), { at, dur, ease: t.ease ?? "camera" });
        pose = b;
        return { start: at, end: at + dur };
      },
    };
  };
  E.fx["orbit"].kind = "technique";
})();
