(() => {
  const E = window.Eidos;
  const { r3, lerp, clamp01 } = E.util;
  const RAD = Math.PI / 180;
  const fail = (message) => {
    const text = `fpv-flight: ${message}`;
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

  E.fx["fpv-flight"] = (stage, o = {}) => {
    const allowed = { rig: 1, planes: 1, unit: 1, lens: 1, bank: 1, at: 1, from: 1 };
    for (const key of Reflect.ownKeys(o)) if (!Object.hasOwn(allowed, key)) fail(`unknown option ${String(key)}`);
    const { tl, world } = stage;
    const rig = select(o.rig ?? ".fpv-rig", world)[0];
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
    const lens = number(o.lens ?? 1.6, "lens");
    const bank = number(o.bank ?? 0.3, "bank");
    if (lens <= 0) fail("lens must be positive");

    const poseOf = (target, dist = lens) => {
      number(dist, "dist");
      if (dist <= 0) fail("dist must be positive");
      if (typeof target === "string" || target instanceof Element) {
        const el = select(target, world)[0];
        const pl = planes.find((p) => p.el === el);
        if (!pl) fail(`${target} is not a plane of this rig`);
        return { x: pl.x + Math.sin(pl.ry) * dist, y: pl.y, z: pl.z + Math.cos(pl.ry) * dist, yaw: pl.ry / RAD, pitch: 0, roll: 0 };
      }
      if (!target || typeof target !== "object") fail("target must be a plane selector or pose object");
      const { x = 0, y = 0, z = 0, roll = 0, look } = target;
      for (const [name, value] of Object.entries({ x, y, z, roll })) number(value, name);
      if (!look) return { x, y, z, yaw: number(target.yaw ?? 0, "yaw"), pitch: number(target.pitch ?? 0, "pitch"), roll };
      if (!Array.isArray(look) || look.length !== 3 || !look.every(Number.isFinite)) fail("look must contain three finite coordinates");
      const dx = look[0] - x, dy = look[1] - y, dz = look[2] - z;
      if (!Math.hypot(dx, dy, dz)) fail("look must differ from camera position");
      return { x, y, z, yaw: Math.atan2(-dx, Math.hypot(dy, dz)) / RAD, pitch: Math.atan2(dy, -dz) / RAD, roll };
    };

    const mix = (a, b, p) => {
      const turn = b.yaw - a.yaw;
      return {
        x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), z: lerp(a.z, b.z, p),
        yaw: a.yaw + turn * p, pitch: lerp(a.pitch, b.pitch, p),
        roll: lerp(a.roll, b.roll, p) - bank * turn * Math.sin(Math.PI * p),
      };
    };

    // Fixed CSS matrix product Rz(-roll) Ry(-yaw) Rx(-pitch); rightmost rotation acts first.
    const render = (c) => {
      const L = lens * U;
      const cy = Math.cos(c.yaw * RAD), sy = Math.sin(c.yaw * RAD), cp = Math.cos(c.pitch * RAD), sp = Math.sin(c.pitch * RAD);
      const cr = Math.cos(c.roll * RAD), sr = Math.sin(c.roll * RAD);
      const view = (x, y, z) => {
        const y1 = y * cp + z * sp, z1 = -y * sp + z * cp;
        const x2 = x * cy - z1 * sy, z2 = x * sy + z1 * cy;
        return [x2 * cr + y1 * sr, -x2 * sr + y1 * cr, z2];
      };
      for (const p of planes) {
        const v = view((p.x - c.x) * U, (p.y - c.y) * U, (p.z - c.z) * U);
        const depth = -v[2] / L;
        const facing = Math.sin(p.ry) * (c.x - p.x) + Math.cos(p.ry) * (c.z - p.z) > 0;
        const alpha = facing ? clamp01((depth - 0.3) / 0.5) * (1 - 0.75 * clamp01((depth - 2.5) / 5)) : 0;
        if (alpha < 0.01) {
          p.wrap.style.transform = "none";
          p.el.style.transform = "none";
          p.wrap.style.opacity = "0";
          p.wrap.style.visibility = "hidden";
          p.wrap.style.zIndex = "0";
          continue;
        }
        place(p, project(L, [v[0], v[1], v[2] + L], view(Math.cos(p.ry), 0, -Math.sin(p.ry)), view(0, 1, 0)));
        p.wrap.style.opacity = String(r3(alpha));
        p.wrap.style.visibility = "visible";
        p.wrap.style.zIndex = String(10000 - Math.round(depth * 100));
      }
    };

    const start = tl.resolveAt(o.at);
    if (!Number.isFinite(start) || start < 0) fail("at must be finite and nonnegative");
    const first = o.from ? poseOf(o.from) : poseOf(planes[0].el);
    let pose = first;
    tl.add(() => render(first), { at: start, dur: 0 });

    return {
      start,
      end: start,
      to(target, t = {}) {
        const a = pose, b = poseOf(target, t.dist);
        const at = tl.resolveAt(t.at);
        const dur = number(t.dur ?? 1.6, "dur");
        if (!Number.isFinite(at) || at < 0 || dur < 0) fail("at and dur must be finite and nonnegative");
        tl.add((p) => {
          // Keep the parked source stop; a zero-duration destination owns only t > at.
          if (dur === 0 && tl.t <= at) p = 0;
          render(mix(a, b, E.reduced ? (p < 0.5 ? 0 : 1) : p));
        }, { at, dur, ease: t.ease ?? "inOut" });
        pose = b;
        return { start: at, end: at + dur };
      },
    };
  };
  E.fx["fpv-flight"].kind = "technique";
})();
