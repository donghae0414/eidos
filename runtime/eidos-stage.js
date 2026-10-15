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
      this.stops = [{ t: 0, label: "" }];
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
    stop(label = "") {
      const last = this.stops[this.stops.length - 1];
      if (Math.abs(last.t - this.end) < 1e-9 && this.stops.length > 1) last.label = label || last.label;
      else this.stops.push({ t: this.end, label });
      return this;
    }
    onSeek(fn) {
      this.hooks.push(fn);
      return this;
    }
    // Tracks that have not started are applied first, latest-start first, at p=0;
    // started tracks are then applied in start order. The result depends only on t,
    // so seeking forward, backward or directly to t always yields the same state.
    seek(t) {
      t = Math.min(Math.max(t, 0), this.end);
      this.t = t;
      const future = [], started = [];
      for (const tr of this.tracks) (tr.at > t + 1e-9 ? future : started).push(tr);
      future.sort((a, b) => b.at - a.at || b.i - a.i);
      for (const tr of future) tr.fn(tr.ease(0));
      started.sort((a, b) => a.at - b.at || a.i - b.i);
      for (const tr of started) tr.fn(tr.ease(tr.dur > 0 ? clamp01((t - tr.at) / tr.dur) : 1));
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
      const { target, o } = kf;
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
      const st = (this.state = this.stateAt(t));
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

    const api = {
      el, world, tl, camera, index: 0, started: false,
      get reduced() { return E.reduced; },
      get stops() { return tl.stops; },
      get end() { return tl.end; },
      get t() { return tl.t; },
      measure: (target) => unionRect($all(target, world).map((n) => rectIn(n, world))),
      onLayout(fn) { layoutFns.push(fn); return api; },
      fx(name, o = {}) {
        if (!E.fx[name]) throw new Error(`Eidos.fx.${name} is not loaded`);
        return E.fx[name](api, o);
      },
      layout() {
        const tf = world.style.transform;
        world.style.transform = "none";
        camera.layout();
        for (const fn of layoutFns) fn();
        world.style.transform = tf;
        tl.seek(tl.t);
      },
      seek(t) { cancel(); tl.seek(t); api.index = stopIndexAt(tl.t); updateHud(); return api; },
      jump(i) {
        cancel();
        api.index = Math.min(Math.max(i, 0), tl.stops.length - 1);
        tl.seek(tl.stops[api.index].t);
        updateHud();
        return api;
      },
      goto(i) {
        i = Math.min(Math.max(i, 0), tl.stops.length - 1);
        if (E.reduced) {
          api.jump(i);
          world.classList.remove("eidos-fade");
          void world.offsetWidth;
          world.classList.add("eidos-fade");
          return api;
        }
        cancel();
        const from = tl.t, to = tl.stops[i].t;
        api.index = i;
        const ms = (Math.abs(to - from) * 1000) / (to < from ? 3 : 1);
        if (ms < 1) { tl.seek(to); updateHud(); return api; }
        const t0 = performance.now();
        anim = { to };
        const step = (now) => {
          const k = Math.min((now - t0) / ms, 1);
          tl.seek(lerp(from, to, k));
          updateHud();
          if (k < 1) raf = requestAnimationFrame(step);
          else anim = null;
        };
        raf = requestAnimationFrame(step);
        return api;
      },
      next() {
        if (anim) { const to = anim.to; cancel(); tl.seek(to); updateHud(); return api; }
        return api.goto(api.index + 1);
      },
      prev() { return api.goto(api.index - 1); },
      snapshot() {
        const out = [];
        for (const n of [world, ...world.querySelectorAll("*")]) {
          let txt = "";
          for (const c of n.childNodes) if (c.nodeType === 3) txt += c.nodeValue;
          out.push(`${n.getAttribute("style") || ""}|${n.getAttribute("d") || ""}|${txt.trim()}`);
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
        const qt = params.get("t"), qs = params.get("stop");
        if (qt != null) api.seek(parseFloat(qt));
        else if (qs != null) api.jump(parseInt(qs, 10));
        else if (opts.autoplay !== false) api.goto(1);
        api.started = true;
        window.__eidos = api;
        return api;
      },
    };

    function cancel() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      anim = null;
    }
    function stopIndexAt(t) {
      let idx = 0;
      tl.stops.forEach((s, i) => { if (s.t <= t + 1e-9) idx = i; });
      return idx;
    }
    function buildHud() {
      hud = document.createElement("div");
      hud.className = "eidos-hud";
      hud.innerHTML =
        '<div class="eidos-hud-caption" aria-live="polite"></div><div class="eidos-hud-count"></div><div class="eidos-hud-bar"><div class="eidos-hud-fill"></div></div>';
      document.body.appendChild(hud);
      updateHud();
    }
    function updateHud() {
      if (!hud) return;
      hud.querySelector(".eidos-hud-caption").textContent = tl.stops[stopIndexAt(tl.t)].label || "";
      hud.querySelector(".eidos-hud-count").textContent = `${api.index} / ${tl.stops.length - 1}  ·  → 다음`;
      hud.querySelector(".eidos-hud-fill").style.width = `${tl.end ? (tl.t / tl.end) * 100 : 100}%`;
    }
    function bindControls() {
      addEventListener("keydown", (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const k = e.key;
        if (["ArrowRight", "ArrowDown", " ", "Enter", "PageDown"].includes(k)) api.next();
        else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) api.prev();
        else if (k === "Home") api.jump(0);
        else if (k === "End") api.jump(tl.stops.length - 1);
        else if (k === "r" || k === "R") { api.jump(0); api.goto(1); }
        else return;
        e.preventDefault();
      });
      el.addEventListener("click", (e) => {
        if (e.target.closest("a, button, input, select, textarea, [data-eidos-noclick]")) return;
        api.next();
      });
    }
    return api;
  };
})();
