(() => {
  const E = window.Eidos;
  const ARGS = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
  const NUM = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
  const r2 = (v) => Math.round(v * 100) / 100;
  const lin = (p) => p;
  // A stop at a tween's end sees x = ((at + dur) - at) / dur, which floats can leave a hair under 1.
  const snap = (x) => (x > 1 - 1e-9 ? 1 : x < 1e-9 ? 0 : x);
  const shapes = new WeakMap();
  const fail = (m) => {
    throw new Error(`shape-morph: ${m}`);
  };
  const name = (el) => (el.id ? `#${el.id}` : `<${el.tagName.toLowerCase()}>`);

  // Path data -> [command, ...args]. Arc flags are single digits, so "a1 1 0 01 9 9" parses.
  function commands(d) {
    const s = String(d), out = [];
    let i = 0, cmd = null;
    const skip = () => {
      while (i < s.length && /[\s,]/.test(s[i])) i++;
    };
    const num = () => {
      skip();
      NUM.lastIndex = i;
      const m = NUM.exec(s);
      if (!m) fail(`expected a number at ${i} in "${s.slice(0, 48)}"`);
      i = NUM.lastIndex;
      return parseFloat(m[0]);
    };
    const flag = () => {
      skip();
      if (s[i] !== "0" && s[i] !== "1") fail(`expected an arc flag at ${i} in "${s.slice(0, 48)}"`);
      return s[i++] === "1" ? 1 : 0;
    };
    for (;;) {
      skip();
      if (i >= s.length) break;
      if (/[MmLlHhVvCcSsQqTtAaZz]/.test(s[i])) cmd = s[i++];
      else if (!cmd || cmd === "z" || cmd === "Z") fail(`unexpected "${s[i]}" at ${i} in "${s.slice(0, 48)}"`);
      if (!out.length && cmd !== "M" && cmd !== "m") fail("path data must start with M");
      const lc = cmd.toLowerCase();
      const a = [];
      for (let k = 0; k < ARGS[lc]; k++) a.push(lc === "a" && (k === 3 || k === 4) ? flag() : num());
      out.push([cmd, ...a]);
      if (lc === "m") cmd = cmd === "m" ? "l" : "L";
    }
    if (!out.length) fail("empty path data");
    return out;
  }

  function contours(d) {
    const list = [];
    let cur = null, x = 0, y = 0, sx = 0, sy = 0, pc = null, pq = null;
    const begin = () => {
      if (!cur || cur.closed) list.push((cur = { pts: [[x, y]], closed: false }));
    };
    const lineTo = (nx, ny) => {
      begin();
      cur.pts.push([nx, ny]);
      x = nx;
      y = ny;
    };
    const cubic = (x1, y1, x2, y2, nx, ny) => {
      begin();
      const x0 = x, y0 = y;
      for (let k = 1; k <= 16; k++) {
        const t = k / 16, u = 1 - t;
        cur.pts.push([
          u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * nx,
          u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ny,
        ]);
      }
      x = nx;
      y = ny;
    };
    const quad = (qx, qy, nx, ny) =>
      cubic(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), nx + (2 / 3) * (qx - nx), ny + (2 / 3) * (qy - ny), nx, ny);
    // SVG endpoint arc -> center form (SVG 2 implementation notes B.2.4), then <=90 degree cubics.
    const arc = (rx, ry, rot, large, sweep, nx, ny) => {
      if (x === nx && y === ny) return;
      rx = Math.abs(rx);
      ry = Math.abs(ry);
      if (!rx || !ry) return lineTo(nx, ny);
      const phi = (rot * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
      const dx = (x - nx) / 2, dy = (y - ny) / 2;
      const x1 = cos * dx + sin * dy, y1 = -sin * dx + cos * dy;
      const lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
      if (lam > 1) {
        rx *= Math.sqrt(lam);
        ry *= Math.sqrt(lam);
      }
      const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
      let k = Math.sqrt(Math.max(0, num) / (rx * rx * y1 * y1 + ry * ry * x1 * x1));
      if (large === sweep) k = -k;
      const ux = (k * rx * y1) / ry, uy = (-k * ry * x1) / rx;
      const cx = cos * ux - sin * uy + (x + nx) / 2, cy = sin * ux + cos * uy + (y + ny) / 2;
      const ang = (ax, ay, bx, by) => Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
      const t1 = ang(1, 0, (x1 - ux) / rx, (y1 - uy) / ry);
      let dt = ang((x1 - ux) / rx, (y1 - uy) / ry, (-x1 - ux) / rx, (-y1 - uy) / ry);
      if (!sweep && dt > 0) dt -= 2 * Math.PI;
      else if (sweep && dt < 0) dt += 2 * Math.PI;
      const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
      const step = dt / n, kk = (4 / 3) * Math.tan(step / 4);
      const P = (px, py) => [cx + cos * rx * px - sin * ry * py, cy + sin * rx * px + cos * ry * py];
      for (let i = 0; i < n; i++) {
        const a0 = t1 + i * step, a1 = a0 + step;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const [p1x, p1y] = P(c0 - kk * s0, s0 + kk * c0);
        const [p2x, p2y] = P(c1 + kk * s1, s1 - kk * c1);
        const [ex, ey] = i === n - 1 ? [nx, ny] : P(c1, s1);
        cubic(p1x, p1y, p2x, p2y, ex, ey);
      }
    };
    for (const [c, ...a] of commands(d)) {
      const C = c.toUpperCase(), rel = c !== C;
      const ax = (v) => (rel ? x + v : v), ay = (v) => (rel ? y + v : v);
      let nc = null, nq = null;
      if (C === "M") {
        x = ax(a[0]);
        y = ay(a[1]);
        sx = x;
        sy = y;
        list.push((cur = { pts: [[x, y]], closed: false }));
      } else if (C === "L") lineTo(ax(a[0]), ay(a[1]));
      else if (C === "H") lineTo(ax(a[0]), y);
      else if (C === "V") lineTo(x, ay(a[0]));
      else if (C === "C") {
        nc = [ax(a[2]), ay(a[3])];
        cubic(ax(a[0]), ay(a[1]), nc[0], nc[1], ax(a[4]), ay(a[5]));
      } else if (C === "S") {
        const [rx, ry] = pc ? [2 * x - pc[0], 2 * y - pc[1]] : [x, y];
        nc = [ax(a[0]), ay(a[1])];
        cubic(rx, ry, nc[0], nc[1], ax(a[2]), ay(a[3]));
      } else if (C === "Q") {
        nq = [ax(a[0]), ay(a[1])];
        quad(nq[0], nq[1], ax(a[2]), ay(a[3]));
      } else if (C === "T") {
        nq = pq ? [2 * x - pq[0], 2 * y - pq[1]] : [x, y];
        quad(nq[0], nq[1], ax(a[0]), ay(a[1]));
      } else if (C === "A") arc(a[0], a[1], a[2], a[3], a[4], ax(a[5]), ay(a[6]));
      else if (C === "Z") {
        if (cur && !cur.closed) {
          if (x !== sx || y !== sy) cur.pts.push([sx, sy]);
          cur.closed = true;
        }
        x = sx;
        y = sy;
      }
      pc = nc;
      pq = nq;
    }
    // A subpath that ends exactly where it began is closed even without Z.
    for (const c of list) {
      const p = c.pts, q = p[p.length - 1];
      if (!c.closed && p.length > 2 && Math.hypot(q[0] - p[0][0], q[1] - p[0][1]) < 1e-6) c.closed = true;
    }
    return list;
  }

  // n points at equal arc-length spacing (closed: n distinct points, the closing edge is implied).
  function resample(c, n) {
    const p = c.pts;
    if (p.length < 2) return Array.from({ length: n }, () => [p[0][0], p[0][1]]);
    const L = [0];
    for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    const total = L[L.length - 1], m = c.closed ? n : n - 1, out = [];
    let j = 1;
    for (let k = 0; k < n; k++) {
      const s = m > 0 ? (total * k) / m : 0;
      while (j < p.length - 1 && L[j] < s) j++;
      const seg = L[j] - L[j - 1];
      const f = seg > 0 ? Math.min(1, Math.max(0, (s - L[j - 1]) / seg)) : 0;
      out.push([p[j - 1][0] + (p[j][0] - p[j - 1][0]) * f, p[j - 1][1] + (p[j][1] - p[j - 1][1]) * f]);
    }
    return out;
  }
  const area = (p) => {
    let a = 0;
    for (let i = 0; i < p.length; i++) {
      const q = p[(i + 1) % p.length];
      a += p[i][0] * q[1] - q[0] * p[i][1];
    }
    return a / 2;
  };
  const centroid = (p) => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
  const dist2 = (a, b, k = 0) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) {
      const q = b[(i + k) % b.length];
      s += (q[0] - a[i][0]) ** 2 + (q[1] - a[i][1]) ** 2;
    }
    return s;
  };

  // Matches b to a: same winding for closed contours, then the start rotation with the least travel.
  function align(a, b, closed) {
    if (!closed) {
      const r = [...b].reverse();
      return dist2(a, r) < dist2(a, b) ? r : b;
    }
    const q = area(a) * area(b) < 0 ? [b[0], ...b.slice(1).reverse()] : b;
    let best = 0, bestD = Infinity;
    for (let k = 0; k < q.length; k++) {
      const s = dist2(a, q, k);
      if (s < bestD - 1e-9) {
        bestD = s;
        best = k;
      }
    }
    return best ? [...q.slice(best), ...q.slice(0, best)] : q;
  }

  // Contour pairs; unpaired source contours collapse to their centroid, unpaired targets grow from theirs.
  function plan(fromD, toD, pairs, n) {
    const A = contours(fromD), B = contours(toD);
    const list = pairs ?? Array.from({ length: Math.min(A.length, B.length) }, (_, i) => [i, i]);
    const usedA = new Set(), usedB = new Set(), parts = [];
    for (const pr of list) {
      const [i, j] = Array.isArray(pr) ? pr : [];
      if (!Number.isInteger(i) || !Number.isInteger(j) || !A[i] || !B[j])
        fail(`pair ${JSON.stringify(pr)} is out of range (from has ${A.length} contours, to has ${B.length})`);
      if (A[i].closed !== B[j].closed) fail(`pair [${i}, ${j}] mixes an open and a closed contour`);
      const a = resample(A[i], n);
      parts.push({ a, b: align(a, resample(B[j], n), A[i].closed), closed: A[i].closed });
      usedA.add(i);
      usedB.add(j);
    }
    A.forEach((c, i) => {
      if (usedA.has(i)) return;
      const a = resample(c, n), m = centroid(a);
      parts.push({ a, b: a.map(() => m), closed: c.closed });
    });
    B.forEach((c, j) => {
      if (usedB.has(j)) return;
      const b = resample(c, n), m = centroid(b);
      parts.push({ a: b.map(() => m), b, closed: c.closed });
    });
    return parts;
  }
  const frame = (parts, q) =>
    parts
      .map(({ a, b, closed }) => "M" + a.map((p, i) => `${r2(p[0] + (b[i][0] - p[0]) * q)} ${r2(p[1] + (b[i][1] - p[1]) * q)}`).join("L") + (closed ? "Z" : ""))
      .join("");

  const isData = (v) => typeof v === "string" && /^\s*[Mm]\s*[-+.\d]/.test(v);

  E.fx["shape-morph"] = (stage, o = {}) => {
    const { tl } = stage;
    const n = Math.max(8, Math.round(o.points ?? 128));
    const dur = o.dur ?? 1.2;
    const each = o.each ?? 0;
    const ease = typeof o.ease === "function" ? o.ease : E.ease[o.ease ?? "inOut"] ?? E.ease.inOut;
    if (o.from == null || isData(o.from)) fail("from must select the visible <path> whose d changes");
    if (o.to == null) fail("to is required (a <path> selector or path data)");
    const froms = E.$all(o.from, stage.world);
    if (!froms.length) fail(`no element for from ${o.from}`);
    const tos = isData(o.to) ? [o.to] : E.$all(o.to, document);
    if (tos.length !== froms.length) fail(`from has ${froms.length} paths but to has ${tos.length}`);
    const start = tl.resolveAt(o.at);
    const items = froms.map((el, k) => {
      const fromD = shapes.get(el) ?? el.getAttribute("d");
      if (!fromD) fail(`${name(el)} has no d attribute (use a <path>)`);
      const toD = typeof tos[k] === "string" ? tos[k] : tos[k].getAttribute("d");
      if (!toD) fail(`${name(tos[k])} has no d attribute (use a <path>)`);
      const parts = plan(fromD, toD, o.pairs, n);
      shapes.set(el, toD);
      const at = start + k * each;
      // Linear progress in, own easing inside: exact original d at both ends even with overshooting eases.
      tl.add(
        (x) => {
          const p = snap(x);
          el.setAttribute("d", E.reduced ? (p < 0.5 ? fromD : toD) : p <= 0 ? fromD : p >= 1 ? toD : frame(parts, ease(p)));
        },
        { at, dur, ease: lin },
      );
      return { el, start: at, end: at + dur, from: fromD, to: toD };
    });
    const end = items.length ? items[items.length - 1].end : start;
    tl.prevStart = start;
    tl.extend(end);
    return { start, end, items };
  };
})();
