(() => {
  const E = (window.Eidos = window.Eidos || {});
  E.version = "0.1.0";
  E.fx = E.fx || {};

  const errors = (window.__eidosErrors = []);
  addEventListener("error", (e) => {
    errors.push(String(e.message));
    console.error("[eidos]", e.message);
  });
  addEventListener("unhandledrejection", (e) => {
    errors.push(String(e.reason));
    console.error("[eidos]", String(e.reason));
  });

  const params = new URLSearchParams(location.search);
  const theme = params.get("theme");
  if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme;
  const motion = params.get("motion");
  E.reduced = motion === "reduce" || (motion !== "full" && matchMedia("(prefers-reduced-motion: reduce)").matches);

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, p) => a + (b - a) * p;
  const r3 = (v) => Math.round(v * 1000) / 1000;
  E.util = { clamp01, lerp, r3 };

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 30; i++) {
        const v = sx(t);
        if (Math.abs(v - x) < 1e-6) break;
        if (v < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return sy(t);
    };
  }
  E.bezier = bezier;
  E.ease = {
    linear: (p) => p,
    in: bezier(0.4, 0, 1, 1),
    out: bezier(0, 0, 0.2, 1),
    inOut: bezier(0.65, 0, 0.35, 1),
    camera: bezier(0.7, 0, 0.2, 1),
    pop: bezier(0.34, 1.56, 0.64, 1),
    soft: bezier(0.25, 0.1, 0.25, 1),
  };
  const easeOf = (e) => (typeof e === "function" ? e : E.ease[e || "inOut"] || E.ease.inOut);

  E.rng = (seed = 1) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const $all = (t, root = document) =>
    t == null ? [] : typeof t === "string" ? [...root.querySelectorAll(t)] : t instanceof Element ? [t] : [...t];
  E.$all = $all;

  function writeStyle(el, st) {
    const tf = [];
    if (st.x != null || st.y != null) tf.push(`translate(${r3(st.x || 0)}px, ${r3(st.y || 0)}px)`);
    if (st.rotate != null) tf.push(`rotate(${r3(st.rotate)}deg)`);
    if (!E.reduced && st.rotateX != null) tf.push(`perspective(900px) rotateX(${r3(st.rotateX)}deg)`);
    if (!E.reduced && st.rotateY != null) tf.push(`perspective(900px) rotateY(${r3(st.rotateY)}deg)`);
    if (st.scale != null) tf.push(`scale(${r3(st.scale)})`);
    if (st.scaleX != null || st.scaleY != null) tf.push(`scale(${r3(st.scaleX ?? 1)}, ${r3(st.scaleY ?? 1)})`);
    if (tf.length) el.style.transform = tf.join(" ");
    if (st.opacity != null) el.style.opacity = String(r3(st.opacity));
    if (st.blur != null) el.style.filter = !E.reduced && st.blur > 0.01 ? `blur(${r3(st.blur)}px)` : "none";
    if (st.draw != null) {
      const len = r3(el.getTotalLength());
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${r3(len * (1 - st.draw))}`;
      el.style.visibility = st.draw <= 0.0005 ? "hidden" : "visible";
    }
  }

  function applyProps(el, props, p) {
    const st = el.__eidos || (el.__eidos = {});
    for (const k in props) {
      const v = props[k];
      if (k === "style") Object.assign(el.style, v(p));
      else if (k === "attr") {
        const a = v(p);
        for (const n in a) el.setAttribute(n, a[n]);
      } else if (k === "text") el.textContent = v(p);
      else st[k] = typeof v === "function" ? v(p) : Array.isArray(v) ? lerp(v[0], v[1], p) : v;
    }
    writeStyle(el, st);
  }

  E.tween = (targets, props) => {
    const els = $all(targets);
    return (p) => {
      for (const el of els) applyProps(el, props, p);
    };
  };

  class Timeline {
    constructor() {
      this.tracks = [];
      this.hooks = [];
      this.ramps = [];
      this.stops = [{ t: 0, label: "", hold: 1.5, scene: null }];
      this.end = 0;
      this.t = 0;
      this.prevStart = 0;
    }
    resolveAt(at) {
      if (at == null) return this.end;
      if (typeof at === "number") return at;
      const s = String(at);
      if (s.startsWith("<")) return this.prevStart + (parseFloat(s.slice(1).replace("+=", "")) || 0);
      if (s.startsWith("+=")) return this.end + parseFloat(s.slice(2));
      if (s.startsWith("-=")) return Math.max(0, this.end - parseFloat(s.slice(2)));
      return parseFloat(s) || 0;
    }
    extend(t) {
      if (t > this.end) this.end = t;
    }
    add(fn, o = {}) {
      const at = this.resolveAt(o.at);
      const dur = o.dur ?? 0.6;
      const ease = easeOf(o.ease);
      for (const f of Array.isArray(fn) ? fn : [fn]) this.tracks.push({ at, dur, ease, fn: f, i: this.tracks.length });
      this.prevStart = at;
      this.extend(at + dur);
      return this;
    }
    tween(targets, props, o = {}) {
      return this.add(E.tween(targets, props), o);
    }
    stagger(targets, props, o = {}) {
      const els = $all(targets);
      const base = this.resolveAt(o.at);
      const each = o.each ?? 0.08;
      els.forEach((el, i) => this.add(E.tween(el, props), { ...o, at: base + i * each }));
      this.prevStart = base;
      return this;
    }
    wait(d) {
      this.end += d;
      return this;
    }
    stop(label = "", o = {}) {
      const last = this.stops[this.stops.length - 1];
      if (Math.abs(last.t - this.end) < 1e-9 && this.stops.length > 1) {
        last.label = label || last.label;
        if (o.id != null) last.id = o.id;
        last.hold = o.hold ?? Math.min(Math.max(0.9 + 0.055 * last.label.length, 1.5), 6);
      } else this.stops.push({ t: this.end, label, id: o.id, hold: o.hold ?? Math.min(Math.max(0.9 + 0.055 * label.length, 1.5), 6), scene: null });
      return this;
    }
    onSeek(fn) {
      this.hooks.push(fn);
      return this;
    }
    ramp({ at, dur, rate }) {
      if (![at, dur, rate].every(Number.isFinite) || at < 0 || dur < 0 || rate < 0) {
        errors.push("tl.ramp requires finite nonnegative at, dur and rate");
        return this;
      }
      this.ramps.push({ at, dur, rate });
      this.ramps.sort((a, b) => a.at - b.at);
      return this;
    }
    rateAt(t) {
      return this.ramps.reduce((rate, r) => t >= r.at && t < r.at + r.dur ? rate * r.rate : rate, 1);
    }
    segments(a, b) {
      const points = [a, b];
      for (const r of this.ramps) for (const t of [r.at, r.at + r.dur]) if (t > a && t < b) points.push(t);
      return [...new Set(points)].sort((x, y) => x - y);
    }
    sourceTime(t) {
      const points = this.segments(0, t);
      let u = 0;
      for (let i = 1; i < points.length; i++) u += (points[i] - points[i - 1]) * this.rateAt((points[i] + points[i - 1]) / 2);
      return u;
    }
    // Positive rates integrate reciprocally; freezes consume presentation time.
    travel(from, to, budget) {
      const forward = to >= from;
      const points = this.segments(Math.min(from, to), Math.max(from, to));
      if (!forward) points.reverse();
      let cost = 0, t = from;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i], rate = this.rateAt((a + b) / 2) || 1;
        const duration = Math.abs(b - a) / rate;
        if (budget - cost < duration) {
          t = a + (forward ? 1 : -1) * Math.max(0, budget - cost) * rate;
          return { t, cost: budget };
        }
        cost += duration;
        t = b;
      }
      return { t, cost };
    }
    // Tracks that have not started are applied first, latest-start first, at p=0;
    // started tracks are then applied in start order. The result depends only on t,
    // so seeking forward, backward or directly to t always yields the same state.
    seek(t) {
      t = Math.min(Math.max(t, 0), this.end);
      this.t = t;
      if (this.paramsAt) this.paramsAt(t);
      const u = this.sourceTime(t);
      const future = [], started = [];
      for (const tr of this.tracks) (tr.at > u + 1e-9 ? future : started).push(tr);
      future.sort((a, b) => b.at - a.at || b.i - a.i);
      for (const tr of future) tr.fn(tr.ease(0));
      started.sort((a, b) => a.at - b.at || a.i - b.i);
      for (const tr of started) tr.fn(tr.ease(tr.dur > 0 ? clamp01((u - tr.at) / tr.dur) : 1));
      for (const h of this.hooks) h(t);
      return this;
    }
  }
  E.Timeline = Timeline;

  function rectIn(el, world) {
    if (el instanceof HTMLElement) {
      let x = 0, y = 0, n = el;
      while (n && n !== world) {
        x += n.offsetLeft;
        y += n.offsetTop;
        n = n.offsetParent;
      }
      if (n === world) return { x, y, w: el.offsetWidth, h: el.offsetHeight };
    }
    const a = el.getBoundingClientRect(), b = world.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
  }

  function unionRect(rs) {
    const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
    const x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  class Camera {
    constructor(stage, world, tl) {
      this.stage = stage;
      this.world = world;
      this.tl = tl;
      this.kfs = [];
      this.W = 0;
      this.H = 0;
      this.state = null;
    }
    home() {
      return { x: this.W / 2, y: this.H / 2, s: 1, r: 0 };
    }
    to(target, o = {}) {
      const at = this.tl.resolveAt(o.at);
      const dur = o.dur ?? 1.2;
      this.kfs.push({ target, o, at, dur, ease: easeOf(o.ease || "camera"), resolved: null });
      this.kfs.sort((a, b) => a.at - b.at);
      this.tl.prevStart = at;
      this.tl.extend(at + dur);
      return this;
    }
    resolve(kf) {
      const { o } = kf;
      const target = typeof kf.target === "function" ? kf.target(this) : kf.target;
      const roll = o.roll || 0;
      if (target == null || target === "world") return { ...this.home(), r: roll };
      if (typeof target === "object" && "s" in target && "x" in target) return { r: roll, ...target };
      const rect =
        typeof target === "object" && "w" in target ? target : unionRect($all(target, this.world).map((el) => rectIn(el, this.world)));
      const pad = o.pad ?? Math.min(this.W, this.H) * 0.08;
      let s = o.zoom ?? Math.min((this.W - 2 * pad) / Math.max(rect.w, 1), (this.H - 2 * pad - 48) / Math.max(rect.h, 1));
      s = Math.min(Math.max(s, 0.05), o.maxZoom ?? 8);
      return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 + 24 / s, s, r: roll };
    }
    layout() {
      this.W = this.stage.clientWidth;
      this.H = this.stage.clientHeight;
      for (const kf of this.kfs) kf.resolved = this.resolve(kf);
    }
    static mix(a, b, e) {
      const s = a.s * Math.pow(b.s / a.s, e);
      const w = Math.abs(b.s - a.s) > 1e-6 ? (1 / a.s - 1 / s) / (1 / a.s - 1 / b.s) : e;
      return { x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), s, r: lerp(a.r, b.r, e) };
    }
    stateAt(t) {
      let st = this.home();
      for (const kf of this.kfs) {
        if (t < kf.at) break;
        const p = kf.dur > 0 ? clamp01((t - kf.at) / kf.dur) : 1;
        st = Camera.mix(st, kf.resolved, kf.ease(p));
        if (p < 1) break;
      }
      return st;
    }
    apply(t) {
      const st = (this.state = this.stateAt(this.tl.sourceTime(t)));
      this.world.style.transform =
        `translate(${r3(this.W / 2)}px, ${r3(this.H / 2)}px) rotate(${r3(st.r)}deg) scale(${r3(st.s)}) translate(${r3(-st.x)}px, ${r3(-st.y)}px)`;
    }
  }
  E.Camera = Camera;

  E.stage = (sel = ".eidos-stage", opts = {}) => {
    const el = typeof sel === "string" ? document.querySelector(sel) : sel;
    const world = el.querySelector(".eidos-world");
    const tl = new Timeline();
    const camera = new Camera(el, world, tl);
    tl.onSeek((t) => camera.apply(t));
    const layoutFns = [];
    let hud = null, raf = 0, anim = null;
    const manual = params.get("clock") === "manual";
    let playing = false, speed = 1, holding = null, lastFrame = 0;
    let ended = false, generation = 0;
    const controls = new Map(), overrides = new Map(), paramFns = [];
    let values = Object.freeze({}), renderedValues = values, paramStop = 0, paramsRaf = 0, needsLayout = false, dock = null;
    tl.paramsAt = resolveParams;

    const api = {
      el, world, tl, camera, index: 0, started: false,
      get params() { return values; },
      onParams(fn) { paramFns.push(fn); return api; },
      control(name, o) {
        if (!name || controls.has(name) || !["range", "toggle", "select"].includes(o.type)) {
          errors.push(`Invalid control: ${name}`);
          return;
        }
        const c = { ...o, tracks: [], input: null, row: null };
        if (c.type === "range") {
          c.min ??= 0; c.max ??= 1; c.step ??= 1;
          if (![c.min, c.max, c.step].every(Number.isFinite) || c.max < c.min || c.step <= 0) {
            errors.push(`Invalid range: ${name}`);
            return;
          }
        }
        if (c.type === "select") {
          if (!Array.isArray(c.options) || !c.options.length) { errors.push(`Invalid options: ${name}`); return; }
          c.options = c.options.map((v) => typeof v === "object" ? v : { value: v, label: String(v) });
        }
        const initial = normalize(c, c.value ?? (c.type === "range" ? c.min : c.type === "toggle" ? false : c.options[0].value));
        if (!initial.ok) { errors.push(`Invalid default for control: ${name}`); return; }
        c.value = initial.value;
        controls.set(name, c);
        values = Object.freeze({ ...values, [name]: c.value });
        const handle = {
          get value() { return values[name]; },
          set(v) { api.setControls({ [name]: v }); return handle; },
          drive(a, b, o = {}) {
            const from = normalize(c, a), to = normalize(c, b);
            const at = tl.resolveAt(o.at), dur = o.dur ?? 0.6;
            if (!from.ok || !to.ok || !Number.isFinite(at) || !Number.isFinite(dur) || dur < 0) {
              errors.push(`Invalid drive for control: ${name}`);
              return handle;
            }
            c.tracks.push({ a: from.value, b: to.value, at, dur, ease: easeOf(o.ease), i: c.tracks.length });
            c.tracks.sort((a, b) => a.at - b.at || a.i - b.i);
            tl.prevStart = at;
            tl.extend(at + dur);
            return handle;
          },
        };
        return handle;
      },
      setControls(patch) {
        const next = [];
        for (const [name, v] of Object.entries(patch)) {
          const c = controls.get(name), result = c && normalize(c, v);
          if (!result?.ok) { errors.push(`Invalid control value: ${name}=${String(v)}`); return api; }
          next.push([name, result.value]);
        }
        api.pause();
        for (const [name, v] of next) {
          overrides.set(name, v);
          if (controls.get(name).layout) needsLayout = true;
        }
        resolveParams(tl.t, false, false);
        queueParams();
        return api;
      },
      get reduced() { return E.reduced; },
      get stops() { return tl.stops; },
      get end() { return tl.end; },
      get t() { return tl.t; },
      get playing() { return playing; },
      speed(x) {
        if (x == null && arguments.length === 0) return speed;
        if (typeof x !== "number" || !Number.isFinite(x) || x <= 0) {
          errors.push(`Invalid playback speed: ${String(x)}`);
          speed = 1;
        } else speed = x;
        updateHud();
        return api;
      },
      play(o = {}) {
        if (o.speed !== undefined) api.speed(o.speed);
        if (playing) return api;
        playing = true;
        ended = false;
        const current = tl.stops[stopIndexAt(tl.t)];
        if (!anim && holding == null && Math.abs(tl.t - current.t) < 1e-9) holding = current.hold;
        if (!anim && tl.t >= tl.end) finish();
        schedule();
        updateHud();
        return api;
      },
      pause() {
        playing = false;
        cancel();
        updateHud();
        return api;
      },
      advance(ms) {
        if (manual && Number.isFinite(ms) && ms >= 0) tick(ms / 1000);
        return api;
      },
      measure: (target) => unionRect($all(target, world).map((n) => rectIn(n, world))),
      onLayout(fn) { layoutFns.push(fn); return api; },
      fx(name, o = {}) {
        if (!E.fx[name]) throw new Error(`Eidos.fx.${name} is not loaded`);
        return E.fx[name](api, o);
      },
      layout() {
        resolveParams(tl.t);
        needsLayout = false;
        const tf = world.style.transform;
        world.style.transform = "none";
        for (const fn of layoutFns) fn();
        camera.layout();
        world.style.transform = tf;
        tl.seek(tl.t);
      },
      seek(t) { api.pause(); holding = null; tl.seek(t); setIndex(stopIndexAt(tl.t)); reachedStop(); updateHud(); return api; },
      jump(i) {
        api.pause();
        holding = null;
        i = Math.min(Math.max(i, 0), tl.stops.length - 1);
        tl.seek(tl.stops[i].t);
        setIndex(i);
        reachedStop();
        updateHud();
        return api;
      },
      goto(i) {
        api.pause();
        holding = null;
        i = Math.min(Math.max(i, 0), tl.stops.length - 1);
        if (E.reduced) {
          api.jump(i);
          world.classList.remove("eidos-fade");
          void world.offsetWidth;
          world.classList.add("eidos-fade");
          return api;
        }
        const from = tl.t, to = tl.stops[i].t;
        setIndex(i);
        anim = { to };
        if (Math.abs(to - from) < 1e-9) { anim = null; tl.seek(to); reachedStop(); updateHud(); return api; }
        schedule();
        return api;
      },
      next() {
        if (anim) { const to = anim.to; api.pause(); tl.seek(to); setIndex(stopIndexAt(to)); reachedStop(); updateHud(); return api; }
        return api.goto(api.index + 1);
      },
      prev() { return api.goto(api.index - 1); },
      snapshot() {
        const out = [JSON.stringify(api.params)];
        const geometry = ["cx", "cy", "r", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points", "transform", "d"];
        for (const n of [world, ...world.querySelectorAll("*")]) {
          let txt = "";
          for (const c of n.childNodes) if (c.nodeType === 3) txt += c.nodeValue;
          const cls = [...n.classList].filter((c) => c !== "eidos-fade").join(" ");
          const attrs = [...n.attributes]
            .filter((a) => geometry.includes(a.name) || a.name.startsWith("data-eidos-"))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => [a.name, a.value]);
          const input = n instanceof HTMLInputElement ? { value: n.value, checked: n.checked } : null;
          out.push(`${n.getAttribute("style") || ""}|${n.getAttribute("d") || ""}|${txt.trim()}|${JSON.stringify([cls, attrs, input])}`);
        }
        return out.join("\n");
      },
      start() {
        if (tl.stops[tl.stops.length - 1].t < tl.end - 1e-9) tl.stop("");
        api.layout();
        tl.seek(0);
        if (opts.hud !== false && params.get("hud") !== "0") buildHud();
        bindControls();
        addEventListener("resize", () => api.layout());
        addEventListener("visibilitychange", () => { if (document.hidden) api.pause(); });
        if (params.has("speed")) api.speed(Number(params.get("speed")));
        const qt = params.get("t"), qs = params.get("stop");
        const [scene, local] = location.hash.slice(1).split("&")[0].split(".");
        const sceneStops = tl.stops.map((s, i) => ({ ...s, i })).filter((s) => s.scene === scene);
        const hashStop = sceneStops.find((s, i) => s.id === local || (s.id == null && String(i) === local));
        if (qt != null) api.seek(parseFloat(qt));
        else if (qs != null) api.jump(parseInt(qs, 10));
        else if (hashStop) api.jump(hashStop.i);
        else if (opts.intro !== false) api.goto(1);
        readControls();
        resolveParams(tl.t, true);
        if (controls.size) buildDock();
        if (needsLayout) { needsLayout = false; api.layout(); }
        if (params.get("autoplay") === "1") api.play();
        api.started = true;
        window.__eidos = api;
        api.ready = document.fonts.ready.then(() => { api.layout(); });
        return api;
      },
    };

    function normalize(c, v, url = false) {
      if (url) {
        if (c.type === "range") v = v.trim() === "" ? NaN : Number(v);
        else if (c.type === "toggle") v = v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : null;
        else {
          const option = c.options.find((o) => String(o.value) === v);
          return option ? { ok: true, value: option.value } : { ok: false };
        }
      }
      if (c.type === "range") {
        if (typeof v !== "number" || !Number.isFinite(v)) return { ok: false };
        v = Math.min(Math.max(v, c.min), c.max);
        const units = (v - c.min) / c.step;
        v = c.min + Math.floor(units + 0.5 + Number.EPSILON * Math.max(1, Math.abs(units)) * 4) * c.step;
        return { ok: true, value: Number(Math.min(Math.max(v, c.min), c.max).toPrecision(15)) };
      }
      if (c.type === "toggle") return { ok: typeof v === "boolean", value: v };
      return { ok: c.options.some((o) => o.value === v), value: v };
    }
    function resolveParams(t, force = false, render = true) {
      const stop = stopIndexAt(t), next = {};
      if (stop !== paramStop) {
        for (const [name, c] of controls) if (!c.sticky) overrides.delete(name);
        paramStop = stop;
      }
      let changed = force;
      for (const [name, c] of controls) {
        let v = c.value;
        for (const tr of c.tracks) {
          if (t < tr.at) break;
          const p = tr.ease(tr.dur > 0 ? clamp01((t - tr.at) / tr.dur) : 1);
          v = c.type === "range" ? normalize(c, lerp(tr.a, tr.b, p)).value : p < 1 ? tr.a : tr.b;
        }
        next[name] = overrides.has(name) ? overrides.get(name) : v;
        if (next[name] !== values[name]) {
          changed = true;
          if (c.layout) needsLayout = true;
        }
      }
      if (changed) values = Object.freeze(next);
      if (render && (force || [...controls.keys()].some((name) => values[name] !== renderedValues[name]))) {
        renderedValues = values;
        for (const fn of paramFns) fn(values);
        dispatchEvent(new CustomEvent("eidos:params", { detail: { params: values } }));
      }
      updateDock(stop);
      if (needsLayout && api.started) queueParams();
    }
    function queueParams() {
      if (paramsRaf) return;
      paramsRaf = requestAnimationFrame(() => {
        paramsRaf = 0;
        if (needsLayout) { needsLayout = false; api.layout(); }
        else tl.seek(tl.t);
      });
    }
    function readControls() {
      const hash = new URLSearchParams(location.hash.slice(1).split("&").slice(1).join("&"));
      for (const source of [params, hash]) for (const [key, v] of source) {
        if (!key.startsWith("c.")) continue;
        const name = key.slice(2), c = controls.get(name), result = c && normalize(c, v, true);
        if (!result?.ok) errors.push(`Invalid URL control: ${key}=${v}`);
        else overrides.set(name, result.value);
      }
    }
    function writeControls() {
      if (!api.started || !controls.size) return;
      const url = new URL(location.href), i = stopIndexAt(tl.t), stop = tl.stops[i];
      for (const key of [...url.searchParams.keys()]) if (key.startsWith("c.") || key === "t" || key === "stop") url.searchParams.delete(key);
      if (!stop.scene) url.searchParams.set("stop", String(i));
      const local = tl.stops.slice(0, i).filter((s) => s.scene === stop.scene).length;
      const state = new URLSearchParams();
      for (const [name, v] of overrides) state.set(`c.${name}`, String(v));
      url.hash = (stop.scene ? `${stop.scene}.${stop.id ?? local}` : String(i)) + (state.size ? `&${state}` : "");
      try { history.replaceState(null, "", url); } catch {}
    }
    function reachedStop() {
      if (Math.abs(tl.t - tl.stops[stopIndexAt(tl.t)].t) < 1e-9) writeControls();
    }
    function updateDock(stop) {
      if (!dock) return;
      let visible = false;
      for (const [name, c] of controls) {
        const index = (v) => typeof v === "number" ? v : tl.stops.findIndex((s) => s.id === v);
        c.row.hidden = c.when == null ? false : Array.isArray(c.when)
          ? !(stop >= index(c.when[0]) && stop <= index(c.when[1]))
          : tl.stops[stop].scene !== c.when;
        visible ||= !c.row.hidden;
        if (c.type === "toggle") c.input.checked = values[name];
        else c.input.value = c.type === "select" ? String(c.options.findIndex((o) => o.value === values[name])) : String(values[name]);
        if (c.output) c.output.value = String(values[name]);
      }
      dock.hidden = !visible;
    }
    function buildDock() {
      dock = document.createElement("div");
      dock.className = "eidos-dock";
      dock.setAttribute("role", "group");
      dock.setAttribute("aria-label", "Controls");
      dock.dataset.eidosNokeys = "";
      for (const [name, c] of controls) {
        const row = c.row = document.createElement("label");
        row.className = `eidos-control eidos-control-${c.type}`;
        const label = document.createElement("span");
        label.textContent = c.label ?? name;
        row.appendChild(label);
        const input = c.input = document.createElement(c.type === "select" ? "select" : "input");
        input.id = `eidos-control-${document.querySelectorAll(".eidos-dock").length}-${dock.children.length}`;
        row.htmlFor = input.id;
        input.name = name;
        if (c.type === "select") c.options.forEach((o, i) => {
          const option = document.createElement("option");
          option.value = String(i); option.textContent = o.label ?? String(o.value);
          input.appendChild(option);
        });
        else input.type = c.type === "toggle" ? "checkbox" : "range";
        if (c.type === "range") {
          input.min = c.min; input.max = c.max; input.step = c.step;
          c.output = document.createElement("output");
          row.appendChild(c.output);
        }
        row.appendChild(input);
        const edit = () => api.setControls({ [name]: c.type === "toggle" ? input.checked : c.type === "select" ? c.options[Number(input.value)].value : Number(input.value) });
        input.addEventListener("input", edit);
        input.addEventListener("change", () => { edit(); writeControls(); });
        dock.appendChild(row);
      }
      document.body.appendChild(dock);
      updateDock(stopIndexAt(tl.t));
    }
    function cancel() {
      generation++;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      anim = null;
      lastFrame = 0;
    }
    function schedule() {
      if (manual || raf || (!playing && !anim)) return;
      lastFrame = performance.now();
      const token = generation;
      raf = requestAnimationFrame((now) => frame(now, token));
    }
    function frame(now, token) {
      if (token !== generation) return;
      raf = 0;
      const elapsed = (now - lastFrame) / 1000;
      lastFrame = now;
      tick(elapsed);
      if (token === generation) schedule();
    }
    function finish() {
      playing = false;
      anim = null;
      holding = 0;
      if (!ended) {
        ended = true;
        dispatchEvent(new CustomEvent("eidos:ended", { detail: { index: api.index } }));
      }
    }
    function tick(seconds) {
      let budget = seconds * speed;
      while (budget > 0 && (playing || anim)) {
        if (holding > 0 && playing) {
          const spent = Math.min(holding, budget);
          holding -= spent;
          if (holding < 1e-9) holding = 0;
          budget -= spent;
          if (holding > 0 || (budget <= 0 && !E.reduced)) break;
        }
        if (!anim) {
          const current = stopIndexAt(tl.t);
          if (current === tl.stops.length - 1) { finish(); break; }
          anim = { to: tl.stops[current + 1].t };
        }
        const to = anim.to;
        if (E.reduced && playing) {
          tl.seek(to);
        } else {
          const reverse = to < tl.t ? 3 : 1;
          const step = tl.travel(tl.t, to, budget * reverse);
          tl.seek(step.t);
          budget = Math.max(0, budget - step.cost / reverse);
          if (Math.abs(tl.t - to) > 1e-9) break;
        }
        anim = null;
        setIndex(stopIndexAt(to));
        reachedStop();
        if (playing) {
          if (api.index === tl.stops.length - 1) { finish(); break; }
          holding = tl.stops[api.index].hold;
        }
      }
      updateHud();
    }
    function stopIndexAt(t) {
      let idx = 0;
      tl.stops.forEach((s, i) => { if (s.t <= t + 1e-9) idx = i; });
      return idx;
    }
    function setIndex(i) {
      if (api.index === i) return;
      api.index = i;
      const { id, label, scene } = tl.stops[i];
      dispatchEvent(new CustomEvent("eidos:stop", { detail: { index: i, id, label, scene } }));
    }
    function buildHud() {
      hud = document.createElement("div");
      hud.className = "eidos-hud";
      hud.innerHTML =
        '<div class="eidos-hud-caption" aria-live="polite"></div><div class="eidos-hud-transport" data-eidos-noclick><button type="button" class="eidos-hud-play" data-eidos-noclick></button><span class="eidos-hud-speed"></span></div><div class="eidos-hud-count"></div><div class="eidos-hud-bar"><div class="eidos-hud-fill"></div></div>';
      hud.querySelector("button").addEventListener("click", () => playing ? api.pause() : api.play());
      document.body.appendChild(hud);
      updateHud();
    }
    function updateHud() {
      const atEnd = api.index === tl.stops.length - 1 && tl.t >= tl.stops[api.index].t;
      if (atEnd && !ended) {
        ended = true;
        dispatchEvent(new CustomEvent("eidos:ended", { detail: { index: api.index } }));
      } else if (!atEnd) ended = false;
      if (!hud) return;
      const button = hud.querySelector(".eidos-hud-play");
      button.textContent = playing ? "Pause" : "Play";
      button.setAttribute("aria-pressed", String(playing));
      hud.querySelector(".eidos-hud-speed").textContent = `${speed}x`;
      hud.querySelector(".eidos-hud-caption").textContent = tl.stops[stopIndexAt(tl.t)].label || "";
      hud.querySelector(".eidos-hud-count").textContent = `${api.index} / ${tl.stops.length - 1}  ·  →/Space 다음 · ← 이전 · P 재생 · 스크롤`;
      hud.querySelector(".eidos-hud-fill").style.width = `${tl.end ? (tl.t / tl.end) * 100 : 100}%`;
    }
    function bindControls() {
      addEventListener("keydown", (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.target.closest("input, select, textarea, [contenteditable], [data-eidos-nokeys]")) return;
        const k = e.key;
        if (e.target.closest("button") && (k === " " || k === "Enter")) return;
        if (["ArrowRight", "ArrowDown", " ", "Enter", "PageDown"].includes(k)) api.next();
        else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) api.prev();
        else if (k === "Home") api.jump(0);
        else if (k === "End") api.jump(tl.stops.length - 1);
        else if (k === "r" || k === "R") { api.jump(0); api.goto(1); }
        else if (k === "p" || k === "P") { playing ? api.pause() : api.play(); }
        else if (k === "[" || k === "]") {
          const steps = [0.5, 1, 1.5, 2];
          api.speed(k === "]" ? steps.find((s) => s > speed) ?? 2 : steps.findLast((s) => s < speed) ?? 0.5);
        }
        else return;
        e.preventDefault();
      });
      el.addEventListener("click", (e) => {
        api.pause();
        if (e.target.closest("a, button, input, select, textarea, label, .eidos-dock, .eidos-hud button, [data-eidos-noclick]")) return;
        api.next();
      });
      addEventListener("input", () => api.pause());
      addEventListener("change", () => api.pause());
    }
    return api;
  };
})();
