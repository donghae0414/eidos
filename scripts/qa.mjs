#!/usr/bin/env bun
import { Glob } from "bun";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const args = process.argv.slice(2);
const VALUE_FLAGS = ["--shots", "--expect", "--only", "--contact"];
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const shotsDir = opt("--shots");
const contactDir = opt("--contact") && resolve(opt("--contact"));
const only = opt("--only");
const expect = opt("--expect") ? Number(opt("--expect")) : undefined;
const allStops = args.includes("--all-stops");
const stopDiff = args.includes("--stop-diff");
const files = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUE_FLAGS.includes(args[i - 1])));

let targets = files.length
  ? files.map((f) => resolve(f))
  : [...new Glob("skills/*/techniques/*/template.html").scanSync({ cwd: root })].sort().map((f) => join(root, f));
if (only) {
  const g = new Glob(only);
  targets = targets.filter((f) => g.match(relative(root, f)) || g.match(f));
}
if (!targets.length) {
  console.log(`no targets${only ? ` matched --only "${only}"` : ""}`);
  process.exit(1);
}

function checkStructure(file) {
  if (basename(file) !== "template.html") return [];
  const dir = dirname(file);
  const problems = [];
  for (const f of ["card.md", "technique.js", "template.html"]) if (!existsSync(join(dir, f))) problems.push(`missing ${f}`);
  if (existsSync(join(dir, "card.md"))) {
    const id = /^id:\s*(.+)$/m.exec(readFileSync(join(dir, "card.md"), "utf8"))?.[1]?.trim();
    if (id !== basename(dir)) problems.push(`card.md id "${id}" != folder "${basename(dir)}"`);
  }
  if (existsSync(join(dir, "technique.js"))) {
    const src = readFileSync(join(dir, "technique.js"), "utf8");
    if (!src.includes(`E.fx["${basename(dir)}"]`)) problems.push(`technique.js does not register Eidos.fx["${basename(dir)}"]`);
  }
  return problems;
}

// Waits for window.__eidos.ready (runtime readiness Promise); pages built on the older
// runtime have no ready promise, so fall back to polling __eidos.started + 2 rAF.
const READY = `new Promise((r) => {
  const t0 = performance.now();
  const c = () => {
    const a = window.__eidos;
    if (a && a.ready && typeof a.ready.then === "function") {
      const left = Math.max(0, 5000 - (performance.now() - t0));
      Promise.race([a.ready.then(() => true, () => false), new Promise((z) => setTimeout(() => z(false), left))]).then(r);
    } else if (a && a.started) requestAnimationFrame(() => requestAnimationFrame(() => r(true)));
    else if (performance.now() - t0 > 5000) r(false);
    else requestAnimationFrame(c);
  };
  c();
})`;

let navSeq = 0;
// A unique _qa param forces a real reload even when only the hash differs between loads.
async function open(view, file, query, hash = "") {
  await view.navigate(`file://${file}?${query}&_qa=${++navSeq}${hash ? `#${hash}` : ""}`);
  return view.evaluate(READY);
}

const PRELUDE = `
  const A = window.__eidos, E = window.Eidos;
  const errs = () => (window.__eidosErrors || []).slice();
  const near = (a, b, e = 1e-3) => Math.abs(a - b) <= e;
  const $ = (s) => document.querySelector(s);
  const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  const wheel = (el, o) => el.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaMode: 0, ...o }));
  const ptr = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
  const swipe = (el, dx, dy) => { ptr(el, "pointerdown", 640, 400); for (let k = 1; k <= 5; k++) ptr(el, "pointermove", 640 + (dx * k) / 5, 400 + (dy * k) / 5); ptr(el, "pointerup", 640 + dx, 400 + dy); };
  const waitFor = (f, ms = 4000) => new Promise((r) => {
    const t0 = performance.now();
    const c = () => { let v = false; try { v = f(); } catch {} if (v) r(true); else if (performance.now() - t0 > ms) r(false); else requestAnimationFrame(c); };
    c();
  });
  const settle = (i, ms = 5000) => waitFor(() => A.index === i && near(A.t, A.stops[i].t, 1e-6), ms);
`;
async function ev(view, body) {
  const r = await view.evaluate(
    `(async () => { ${PRELUDE} try { return { ok: await (async () => { ${body} })() }; } catch (e) { return { err: String((e && e.message) || e).split(". (In ")[0] }; } })()`,
  );
  if (r && "err" in r) throw new Error(r.err);
  return r?.ok;
}

// ---------------------------------------------------------------------------
// Runtime feature checks (fixtures in scripts/fixtures declare window.__eidosFixture).
// Each check is a list of [label, step]; a step returns a failure string or "".
// They encode the assertions of plan todos 3-7 against docs/runtime-api.md and are
// expected to FAIL until those runtime features land (TDD red phase).
// ---------------------------------------------------------------------------
const Q = "motion=full&hud=0";
const QM = "clock=manual&autoplay=0&hud=0&motion=full";

const FEATURES = {
  focus: {
    api: `return [typeof A.ready?.then === "function" ? "" : "__eidos.ready (Promise)"].filter(Boolean);`,
    skipOnMissing: false,
    steps: [
      ["tl.stop opts", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const s = A.stops.find((s) => s.id === "one"); return s && s.hold === 2 ? "" : "tl.stop(label, {id, hold}) did not store id/hold (stops[1] = " + JSON.stringify(A.stops[1]) + ")";`);
      }],
      ["default and merged stop holds", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const t = new E.Timeline(); t.wait(1).stop("x").wait(1).stop("x".repeat(40)).wait(1).stop("x".repeat(200)); if (t.stops.map((s) => s.hold).join() !== "1.5,1.5,3.1,6") return "default hold formula or bounds incorrect"; t.stop("merged", { id: "merged", hold: 0 }); return t.stops.length === 4 && t.stops[3].id === "merged" && t.stops[3].hold === 0 ? "" : "merged stop lost options or explicit zero hold";`);
      }],
      ["focused range + ArrowRight", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const r = $("#r"); r.focus(); const i = A.index; key(r, "ArrowRight"); return A.index === i ? "" : "ArrowRight on a focused range input changed __eidos.index " + i + " -> " + A.index;`);
      }],
      ["click Play then ArrowRight", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const b = $("#play"); b.focus(); click(b); if (A.index !== 1) return "click on a button navigated (index " + A.index + ")"; key(b, "ArrowRight"); return A.index === 2 ? "" : "ArrowRight with a focused button did not navigate (index " + A.index + ", want 2)";`);
      }],
      ["Space/Enter left to button", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const b = $("#play"); b.focus(); key(b, " "); key(b, "Enter"); return A.index === 1 ? "" : "Space/Enter on a focused button navigated (index 1 -> " + A.index + ")";`);
      }],
      ["editable ancestors and opt-out keys", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const bad = []; for (const html of ['<input>', '<select><option>x</option></select>', '<textarea></textarea>', '<div contenteditable="false"><span>x</span></div>', '<div data-eidos-nokeys><span>x</span></div>']) { const host = document.createElement("div"); host.innerHTML = html; A.world.appendChild(host); const target = host.querySelector("span") || host.firstElementChild; for (const k of ["ArrowRight", "ArrowLeft", " ", "Enter", "Home", "End"]) { const untouched = key(target, k); if (A.index !== 1 || !untouched) bad.push(html + ":" + k); A.jump(1); } host.remove(); } return bad.join("; ");`);
      }],
      ["dock and HUD button key ownership", async (c) => {
        await c.open("motion=reduce&hud=0&stop=1");
        return ev(c.view, `for (const cls of ["eidos-dock", "eidos-hud"]) { const host = document.createElement("div"); host.className = cls; host.innerHTML = "<button><span>control</span></button>"; A.el.appendChild(host); const target = host.querySelector("span"); click(target); if (A.index !== 1) return cls + " click navigated"; if (!key(target, " ") || !key(target, "Enter") || A.index !== 1) return cls + " button activation intercepted"; key(target, "ArrowRight"); if (A.index !== 2) return cls + " button arrows blocked"; A.jump(1); host.remove(); } return "";`);
      }],
      ["label click", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `click($("#lab")); return A.index === 1 ? "" : "click on <label> advanced the stage (index 1 -> " + A.index + ")";`);
      }],
      ["snapshot records class", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const b = $("#box"), s0 = A.snapshot(); b.classList.add("qa-mark"); const s1 = A.snapshot(); b.classList.remove("qa-mark"); return s0 !== s1 ? "" : "snapshot() ignores class changes";`);
      }],
      ["snapshot records input value", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const r = $("#r"), s0 = A.snapshot(); r.value = r.value === "7" ? "6" : "7"; return s0 !== A.snapshot() ? "" : "snapshot() ignores live input value";`);
      }],
      ["snapshot records data-eidos-*", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const s0 = A.snapshot(); $("#box").setAttribute("data-eidos-qa", "1"); return s0 !== A.snapshot() ? "" : "snapshot() ignores data-eidos-* attributes";`);
      }],
      ["snapshot records SVG geometry", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const s0 = A.snapshot(); $("#dot").setAttribute("cx", "42"); return s0 !== A.snapshot() ? "" : "snapshot() ignores SVG geometry attributes (cx)";`);
      }],
      ["snapshot geometry checked and class filtering", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const bad = [], dot = $("#dot"); for (const name of ["cx", "cy", "r", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points", "transform", "d"]) { const before = A.snapshot(); dot.setAttribute(name, "42"); if (A.snapshot() === before) bad.push(name); dot.removeAttribute(name); } const input = document.createElement("input"); input.type = "checkbox"; A.world.appendChild(input); const before = A.snapshot(); input.checked = true; if (A.snapshot() === before) bad.push("checked"); input.remove(); const base = A.snapshot(); A.world.classList.add("eidos-fade"); if (A.snapshot() !== base) bad.push("runtime class"); A.world.classList.remove("eidos-fade"); $("#box").classList.add("eidos-custom"); if (A.snapshot() === base) bad.push("authored eidos class"); if (A.snapshot().split("\\n")[0] !== JSON.stringify(A.params)) bad.push("params prefix"); return bad.join(", ");`);
      }],
      ["eidos:stop event", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `let got = null; addEventListener("eidos:stop", (e) => (got = e.detail)); A.next(); await waitFor(() => got, 2000); return got && got.index === 2 ? "" : "no eidos:stop {index: 2} after next() (got " + JSON.stringify(got) + ")";`);
      }],
      ["stop details and ended arrival once", async (c) => {
        await c.open("motion=reduce&hud=0&stop=0");
        return ev(c.view, `const stops = [], ends = []; addEventListener("eidos:stop", (e) => stops.push(e.detail)); addEventListener("eidos:ended", (e) => ends.push(e.detail)); A.jump(1); A.jump(1); const one = stops[0]; if (stops.length !== 1 || one.index !== 1 || one.id !== "one" || one.label !== "하나" || one.scene !== null) return "incorrect stop detail or duplicate event: " + JSON.stringify(stops); A.goto(A.stops.length - 1); A.goto(A.stops.length - 1); A.seek(A.end); if (ends.length !== 1 || ends[0].index !== A.stops.length - 1) return "ended not emitted once at arrival: " + JSON.stringify(ends); A.jump(1); A.goto(A.stops.length - 1); return ends.length === 2 ? "" : "ended did not reset after leaving last stop";`);
      }],
      ["rapid goto emits every index change", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const stops = [], ends = []; addEventListener("eidos:stop", (e) => stops.push(e.detail.index)); addEventListener("eidos:ended", (e) => ends.push(e.detail)); A.goto(3); A.goto(2); const result = stops.join() === "3,2" && ends.length === 0 ? "" : "index changes lost or ended emitted before arrival: " + JSON.stringify({ stops, ends }); A.jump(1); return result;`);
      }],
      ["ready waits for fonts and first layout", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `await A.ready; return document.fonts.status === "loaded" && A.camera.W === A.el.clientWidth && A.camera.H === A.el.clientHeight && near(A.t, A.stops[1].t) ? "" : "ready resolved before fonts, layout, or URL state";`);
      }],
      ["reduced goto has no fade diff", async (c) => {
        await c.open("motion=reduce&hud=0&stop=0");
        const a = await ev(c.view, `A.goto(1); return A.snapshot();`);
        await c.open("motion=reduce&hud=0&stop=1");
        const b = await ev(c.view, `return A.snapshot();`);
        return a === b ? "" : "reduced-motion goto(1) snapshot != fresh ?stop=1 snapshot (runtime-owned class leaked)";
      }],
    ],
  },

  autoplay: {
    api: `return [...["play", "pause", "speed", "advance"].filter((k) => typeof A[k] !== "function").map((k) => "__eidos." + k + "()"), ...("playing" in A ? [] : ["__eidos.playing"])];`,
    skipOnMissing: true,
    steps: [
      ["manual clock play+advance", async (c) => {
        await c.open(`${QM}&t=0.1`);
        return ev(c.view, `A.play({ speed: 1 }); A.advance(500); return near(A.t, 0.6) ? "" : "play({speed:1}); advance(500) from t=0.1 gave t=" + A.t + " (want 0.6)";`);
      }],
      ["paused advance is a no-op", async (c) => {
        await c.open(`${QM}&t=0.1`);
        return ev(c.view, `A.advance(500); if (!near(A.t, 0.1)) return "advance while paused moved t to " + A.t; A.play({ speed: 1 }); A.pause(); A.advance(500); return near(A.t, 0.1) ? "" : "advance after pause() moved t to " + A.t;`);
      }],
      ["speed 2", async (c) => {
        await c.open(`${QM}&t=0.1`);
        return ev(c.view, `A.play({ speed: 2 }); A.advance(250); return near(A.t, 0.6) ? "" : "speed 2 advance(250) from t=0.1 gave t=" + A.t + " (want 0.6)";`);
      }],
      ["duplicate play idempotent", async (c) => {
        await c.open(`${QM}&t=0.1`);
        return ev(c.view, `A.play({ speed: 1 }); A.play({ speed: 1 }); A.advance(500); return near(A.t, 0.6) && A.playing === true ? "" : "play() twice then advance(500) gave t=" + A.t + " playing=" + A.playing;`);
      }],
      ["hold at stop (hold/speed)", async (c) => {
        await c.open(`${QM}&t=0.5`);
        const a = await ev(c.view, `A.play({ speed: 1 }); A.advance(500); const r1 = A.t; A.advance(900); const r2 = A.t; A.advance(600); return near(r1, 1) && near(r2, 1) && near(A.t, 1.5) ? "" : "speed 1 hold 1s: t after 500/1400/2000 ms = " + [r1, r2, A.t].join("/") + " (want 1/1/1.5)";`);
        if (a) return a;
        await c.open(`${QM}&t=0.5`);
        return ev(c.view, `A.play({ speed: 2 }); A.advance(250); const r1 = A.t; A.advance(400); const r2 = A.t; A.advance(350); return near(r1, 1) && near(r2, 1) && near(A.t, 1.5) ? "" : "speed 2 hold 1s (0.5s wall): t after 250/650/1000 ms = " + [r1, r2, A.t].join("/") + " (want 1/1/1.5)";`);
      }],
      ["eidos:ended once", async (c) => {
        await c.open(`${QM}&t=2.5`);
        return ev(c.view, `let n = 0; addEventListener("eidos:ended", () => n++); A.play({ speed: 1 }); for (let k = 0; k < 10; k++) A.advance(1000); const last = A.stops.length - 1; return n === 1 && A.index === last && A.playing === false ? "" : "after playing to the end: ended events=" + n + " index=" + A.index + "/" + last + " playing=" + A.playing;`);
      }],
      ["manual input pauses", async (c) => {
        const out = [];
        for (const [what, code] of [["next()", "A.next()"], ["prev()", "A.prev()"], ["seek()", "A.seek(0.2)"], ["click", "click(A.world)"], ["ArrowRight", "key(document.body, 'ArrowRight')"]]) {
          await c.open(`${QM}&t=1.5`);
          const m = await ev(c.view, `A.play({ speed: 1 }); ${code}; return A.playing === false ? "" : "${what} did not pause playback";`);
          if (m) out.push(m);
        }
        return out.join("; ");
      }],
      ["P key toggles play", async (c) => {
        await c.open(`${QM}&t=0.1`);
        return ev(c.view, `key(document.body, "p"); const p1 = A.playing; key(document.body, "p"); return p1 === true && A.playing === false ? "" : "P key did not toggle playing (" + p1 + ", " + A.playing + ")";`);
      }],
      ["] key raises speed", async (c) => {
        await c.open(`${QM}&t=0.1`);
        return ev(c.view, `key(document.body, "]"); A.play(); A.advance(200); return near(A.t, 0.4) ? "" : "] then play; advance(200) gave t=" + A.t + " (want 0.4 at speed 1.5)";`);
      }],
      ["?autoplay=1&speed=1.5", async (c) => {
        await c.open("clock=manual&autoplay=1&speed=1.5&hud=0&motion=full&t=0.1");
        return ev(c.view, `if (A.playing !== true) return "?autoplay=1 did not start playback"; A.advance(200); return near(A.t, 0.4) ? "" : "?speed=1.5 advance(200) gave t=" + A.t + " (want 0.4)";`);
      }],
      ["invalid ?speed keeps 1", async (c) => {
        const out = [];
        for (const v of ["0", "abc"]) {
          await c.open(`clock=manual&autoplay=1&speed=${v}&hud=0&motion=full&t=0.1`);
          const m = await ev(c.view, `const e = errs().length; A.advance(200); return e > 0 && near(A.t, 0.3) ? "" : "?speed=${v}: errors=" + e + " t after advance(200)=" + A.t + " (want error and t=0.3)";`);
          if (m) out.push(m);
        }
        return out.join("; ");
      }],
      ["?t beats ?stop", async (c) => {
        await c.open(`${QM}&t=0.5&stop=2`);
        return ev(c.view, `return near(A.t, 0.5, 1e-9) ? "" : "?t=0.5&stop=2 loaded t=" + A.t;`);
      }],
    ],
  },

  controls: {
    api: `return [...["control", "setControls", "onParams"].filter((k) => typeof A[k] !== "function").map((k) => "__eidos." + k + "()"), ...(A.params && typeof A.params === "object" ? [] : ["__eidos.params"])];`,
    skipOnMissing: true,
    steps: [
      ["setControls+seek == fresh ?c load", async (c) => {
        const out = [];
        const ts = [c.stops[1], c.end / 2, c.end].map((t) => Math.round(t * 1000) / 1000);
        for (const v of c.fixture.controls.n ?? []) {
          await c.open(`${Q}&t=0`);
          const snaps = await ev(c.view, `return ${JSON.stringify(ts)}.map((t) => (A.setControls({ n: ${JSON.stringify(v)} }), A.seek(t), A.snapshot()));`);
          for (let i = 0; i < ts.length; i++) {
            await c.open(`${Q}&t=${ts[i]}&c.n=${encodeURIComponent(v)}`);
            if ((await ev(c.view, `return A.snapshot();`)) !== snaps[i]) out.push(`n=${v} t=${ts[i]}`);
          }
        }
        return out.length ? `in-page setControls+seek != fresh load at ${out.join(", ")}` : "";
      }],
      ["every control changes the snapshot", async (c) => {
        await c.open(`${Q}&t=${c.end}`);
        return ev(c.view, `const S = ${JSON.stringify(c.fixture.controls)}, dead = []; for (const k in S) { const seen = new Set(S[k].map((v) => (A.setControls({ [k]: v }), A.snapshot()))); if (seen.size < 2) dead.push(k); } return dead.length ? "controls never change the snapshot: " + dead.join(", ") : "";`);
      }],
      ["A->B->A restores", async (c) => {
        await c.open(`${Q}&t=${c.end}`);
        return ev(c.view, `A.setControls({ n: 2 }); const a = A.snapshot(); A.setControls({ n: 7 }); A.setControls({ n: 2 }); return a === A.snapshot() ? "" : "n 2->7->2 did not restore the snapshot";`);
      }],
      ["URL clamp", async (c) => {
        await c.open(`${Q}&t=${c.end}&c.n=99`);
        const hi = await ev(c.view, `return A.params.n;`);
        await c.open(`${Q}&t=${c.end}&c.n=0`);
        const lo = await ev(c.view, `return A.params.n;`);
        return hi === 8 && lo === 1 ? "" : `?c.n=99 -> ${hi} (want 8), ?c.n=0 -> ${lo} (want 1)`;
      }],
      ["step tie rounds up", async (c) => {
        await c.open(`${Q}&t=${c.end}`);
        return ev(c.view, `A.setControls({ n: 2.5 }); return A.params.n === 3 ? "" : "setControls({n: 2.5}) -> " + A.params.n + " (want 3)";`);
      }],
      ["bad URL values error", async (c) => {
        const out = [];
        for (const q of ["c.zzz=1", "c.n=x"]) {
          await c.open(`${Q}&t=${c.end}&${q}`);
          const m = await ev(c.view, `return errs().length > 0 && A.params.n === 4 ? "" : "?${q}: errors=" + errs().length + " n=" + A.params.n + " (want an error and n=4)";`);
          if (m) out.push(m);
        }
        return out.join("; ");
      }],
      ["setControls is atomic", async (c) => {
        await c.open(`${Q}&t=${c.end}`);
        return ev(c.view, `const e = errs().length; try { A.setControls({ n: 6, zzz: 1 }); } catch {} return A.params.n === 4 && errs().length > e ? "" : "setControls({n: 6, zzz: 1}) gave n=" + A.params.n + " new errors=" + (errs().length - e) + " (want n=4 and an error)";`);
      }],
      ["eidos:params event", async (c) => {
        await c.open(`${Q}&t=${c.end}`);
        return ev(c.view, `let got = null; addEventListener("eidos:params", (e) => (got = e.detail)); A.setControls({ n: 5 }); await waitFor(() => got, 2000); return got && got.params && got.params.n === 5 ? "" : "no eidos:params {params: {n: 5}} (got " + JSON.stringify(got) + ")";`);
      }],
      ["dock outside world, labelled", async (c) => {
        await c.open(`${Q}&t=${c.end}`);
        return ev(c.view, `const d = $(".eidos-dock"); if (!d) return "no .eidos-dock element"; if (d.closest(".eidos-world")) return ".eidos-dock is inside .eidos-world"; const bad = [...d.querySelectorAll("input, select")].filter((i) => !(i.labels && i.labels.length) && !i.getAttribute("aria-label")); return bad.length ? bad.length + " dock inputs without a label" : "";`);
      }],
      ["200 slider inputs, URL on change only", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const r = $(".eidos-dock input[type=range]"); if (!r) return "no range input in .eidos-dock"; const href = location.href; for (let k = 0; k < 200; k++) { r.value = String(1 + (k % 8)); r.dispatchEvent(new Event("input", { bubbles: true })); } await new Promise((z) => requestAnimationFrame(() => requestAnimationFrame(z))); if (errs().length) return "slider input burst produced errors: " + errs()[0]; if (location.href !== href) return "URL rewritten on slider input (should wait for change)"; r.value = "6"; r.dispatchEvent(new Event("input", { bubbles: true })); r.dispatchEvent(new Event("change", { bubbles: true })); await waitFor(() => /c\\.n=6/.test(location.href), 1000); return /c\\.n=6/.test(location.href) ? "" : "URL not written on change (" + location.href + ")";`);
      }],
      ["focused slider + ArrowRight", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const r = $(".eidos-dock input[type=range]"); if (!r) return "no range input in .eidos-dock"; r.focus(); key(r, "ArrowRight"); return A.index === 1 ? "" : "ArrowRight on focused dock slider changed index 1 -> " + A.index;`);
      }],
      ["wheel over dock", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const d = $(".eidos-dock"); if (!d) return "no .eidos-dock element"; for (let k = 0; k < 10; k++) wheel(d, { deltaY: 60 }); return A.index === 1 ? "" : "wheel over the dock navigated (index 1 -> " + A.index + ")";`);
      }],
    ],
  },

  hub: {
    api: `return [...["scene", "spoke", "back", "enter", "exit", "where"].filter((k) => typeof A[k] !== "function").map((k) => "__eidos." + k + "()"), ...(Array.isArray(A.scenes) ? [] : ["__eidos.scenes"])];`,
    skipOnMissing: true,
    steps: [
      ["stop order", async (c) => {
        await c.open(`${Q}&stop=0`);
        c.keys = await ev(c.view, `return A.stops.map((s, i) => { A.jump(i); const w = A.where(); return w.scene + "." + (s.id ?? w.local); });`);
        const want = ["hub.0", "A.0", "A.1", "hub.ret-A", "B.0", "B.1", "hub.ret-B", "outro.0"];
        const at = c.keys.indexOf("hub.0");
        c.idx = Object.fromEntries(c.keys.map((k, i) => [k, i]));
        return at >= 0 && want.every((k, j) => c.keys[at + j] === k) ? "" : `stop keys ${JSON.stringify(c.keys)} do not contain ${JSON.stringify(want)} in order`;
      }],
      ["hub invariant", async (c) => {
        if (!c.idx) return "skipped: stop order unknown";
        await c.open(`${Q}&stop=0`);
        return ev(c.view, `const I = ${JSON.stringify(c.idx)}, snap = (t) => (A.seek(t), A.snapshot()); const h = snap(A.stops[I["hub.0"]].t), bad = []; const sp = A.scenes.find((s) => s.id === "A"); if (!sp) return "no scene record for spoke A"; if (snap(sp.t0) !== h) bad.push("spoke A t0"); if (snap(A.stops[I["hub.ret-A"]].t) !== h) bad.push("hub.ret-A"); if (snap(A.stops[I["hub.ret-B"]].t) !== h) bad.push("hub.ret-B"); return bad.length ? "snapshot differs from hub.0 at " + bad.join(", ") : "";`);
      }],
      ["enter/exit + hash", async (c) => {
        if (!c.idx) return "skipped: stop order unknown";
        await c.open(`${Q}&stop=${c.idx["hub.0"]}`);
        const r = await ev(c.view, `const I = ${JSON.stringify(c.idx)}; A.enter("A"); if (!(await settle(I["A.0"]))) return "enter('A') did not land on A.0 (index " + A.index + ")"; A.exit(); if (!(await settle(I["hub.ret-A"]))) return "exit() did not land on hub.ret-A (index " + A.index + ")"; await waitFor(() => location.hash === "#hub.ret-A", 1000); if (location.hash !== "#hub.ret-A") return "URL hash after exit() is '" + location.hash + "' (want #hub.ret-A)"; window.__qaSnap = A.snapshot(); A.next(); return (await settle(I["B.0"])) ? "" : "next() from hub.ret-A did not land on B.0 (index " + A.index + ")";`);
        return r;
      }],
      ["fresh #hub.ret-A", async (c) => {
        if (!c.idx) return "skipped: stop order unknown";
        await c.open(`${Q}&stop=${c.idx["hub.ret-A"]}`);
        const want = await ev(c.view, `return A.snapshot();`);
        await c.open(Q, "hub.ret-A");
        return ev(c.view, `const I = ${JSON.stringify(c.idx)}; if (A.index !== I["hub.ret-A"]) return "#hub.ret-A loaded index " + A.index; if (A.snapshot() !== ${JSON.stringify(want)}) return "#hub.ret-A snapshot != ?stop snapshot"; A.next(); return (await settle(I["B.0"])) ? "" : "next() from fresh #hub.ret-A did not land on B.0 (index " + A.index + ")";`);
      }],
      ["fresh #hub.0 next -> A.0", async (c) => {
        if (!c.idx) return "skipped: stop order unknown";
        await c.open(Q, "hub.0");
        return ev(c.view, `const I = ${JSON.stringify(c.idx)}; if (A.index !== I["hub.0"]) return "#hub.0 loaded index " + A.index; A.next(); return (await settle(I["A.0"])) ? "" : "next() from #hub.0 did not land on A.0 (index " + A.index + ")";`);
      }],
      ["#A.1 == ?stop", async (c) => {
        if (!c.idx) return "skipped: stop order unknown";
        await c.open(`${Q}&stop=${c.idx["A.1"]}`);
        const want = await ev(c.view, `return A.snapshot();`);
        await c.open(Q, "A.1");
        return ev(c.view, `return A.snapshot() === ${JSON.stringify(want)} ? "" : "#A.1 snapshot != ?stop=${c.idx["A.1"]} snapshot (index " + A.index + ")";`);
      }],
      ["nested enter/exit stack", async (c) => {
        if (!c.idx) return "skipped: stop order unknown";
        await c.open(`${Q}&stop=${c.idx["hub.0"]}`);
        return ev(c.view, `const I = ${JSON.stringify(c.idx)}; A.enter("A"); if (!(await settle(I["A.0"]))) return "enter A failed"; A.enter("B"); if (!(await settle(I["B.0"]))) return "enter B from A failed (index " + A.index + ")"; A.exit(); if (!(await settle(I["hub.ret-B"]))) return "first exit() did not land on hub.ret-B (index " + A.index + ")"; A.exit(); return (await settle(I["hub.ret-A"])) ? "" : "second exit() did not land on hub.ret-A (index " + A.index + ")";`);
      }],
      ["spoke tag, keys 1-9, Esc", async (c) => {
        if (!c.idx) return "skipped: stop order unknown";
        await c.open(`${Q}&stop=${c.idx["hub.0"]}`);
        return ev(c.view, `const I = ${JSON.stringify(c.idx)}; if ($("#node-a").dataset.eidosSpoke !== "A") return "#node-a lacks data-eidos-spoke=A"; key(document.body, "1"); if (!(await settle(I["A.0"]))) return "key 1 did not enter A (index " + A.index + ")"; key(document.body, "Escape"); return (await settle(I["hub.ret-A"])) ? "" : "Esc did not exit to hub.ret-A (index " + A.index + ")";`);
      }],
      ["breadcrumb + eidos:scene", async (c) => {
        if (!c.idx) return "skipped: stop order unknown";
        await c.open(`motion=full&stop=${c.idx["hub.0"]}`);
        return ev(c.view, `const I = ${JSON.stringify(c.idx)}; let got = null; addEventListener("eidos:scene", (e) => (got = got || e.detail)); A.enter("A"); await settle(I["A.0"]); if (!got || got.id !== "A") return "no eidos:scene {id: 'A'} on enter (got " + JSON.stringify(got) + ")"; const crumb = [...document.querySelectorAll("body *")].some((n) => !n.closest(".eidos-world") && /›/.test(n.textContent)); return crumb ? "" : "no 'hub › A' breadcrumb outside .eidos-world";`);
      }],
      ["scene without via errors", async (c) => {
        await c.open(`${Q}&bad=novia`);
        return ev(c.view, `return errs().some((m) => /via/i.test(m)) ? "" : "s.scene without via did not report a via error (errors: " + JSON.stringify(errs()) + ")";`);
      }],
      ["via non-transition errors", async (c) => {
        await c.open(`${Q}&bad=kind`);
        return ev(c.view, `return errs().some((m) => /transition|kind/i.test(m)) ? "" : "via naming a non-transition fx did not report a kind error (errors: " + JSON.stringify(errs()) + ")";`);
      }],
    ],
  },

  gestures: {
    api: `return typeof E.gesture === "function" ? [] : ["Eidos.gesture()"];`,
    skipOnMissing: true,
    steps: [
      ["reducer traces", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `
          const run = (evs) => { let st; const acts = []; for (const e of evs) { const r = E.gesture(st, { dx: 0, mode: 0, kind: "wheel", ...e }); st = r.state; if (r.action) acts.push(r.action); } return acts; };
          const bad = [];
          const inertia = Array.from({ length: 30 }, (_, i) => ({ dy: 60 * 0.85 ** i + 0.5, t: i * 16 }));
          let a = run(inertia); if (a.join() !== "next") bad.push("30-event inertia trace -> " + JSON.stringify(a) + " (want one next)");
          const flick = (t0) => Array.from({ length: 6 }, (_, i) => ({ dy: 40, t: t0 + i * 16 }));
          a = run([...flick(0), ...flick(80 + 200)]); if (a.join() !== "next,next") bad.push("two flicks 200ms apart -> " + JSON.stringify(a));
          a = run([{ dy: 6, mode: 1, t: 0 }]); if (a.join() !== "next") bad.push("deltaMode 1 (6 lines = 96px) -> " + JSON.stringify(a));
          a = run([{ dy: -100, t: 0 }]); if (a.join() !== "prev") bad.push("dy -100 -> " + JSON.stringify(a));
          a = run([{ dy: 30, t: 0 }, { dy: 30, t: 16 }]); if (a.length) bad.push("60px below threshold -> " + JSON.stringify(a));
          return bad.join("; ");`);
      }],
      ["DOM wheel burst -> one next", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `for (let i = 0; i < 30; i++) wheel(A.world, { deltaY: 60 * 0.85 ** i + 0.5, clientX: 640, clientY: 400 }); return A.index === 2 ? "" : "30-event wheel burst on stage: index 1 -> " + A.index + " (want 2)";`);
      }],
      ["ctrl+wheel ignored", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `for (let i = 0; i < 10; i++) wheel(A.world, { deltaY: 60, ctrlKey: true }); return A.index === 1 ? "" : "ctrl+wheel navigated (index " + A.index + ")";`);
      }],
      ["scrollable panel owns burst", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const p = $("#panel"); p.scrollTop = 0; for (let i = 0; i < 5; i++) wheel(p, { deltaY: 60 }); if (A.index !== 1) return "wheel in scrollable panel navigated"; p.scrollTop = p.scrollHeight; for (let i = 0; i < 10; i++) wheel(p, { deltaY: 60 }); return A.index === 1 ? "" : "wheel at panel bottom within the same burst navigated (index " + A.index + ")";`);
      }],
      ["wheel over range input", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `for (let i = 0; i < 10; i++) wheel($("#rng"), { deltaY: 60 }); return A.index === 1 ? "" : "wheel over range input navigated (index " + A.index + ")";`);
      }],
      ["touch swipe", async (c) => {
        const out = [];
        for (const [dx, dy, want, what] of [[-60, 0, 2, "left 60px"], [-30, 0, 1, "left 30px"], [-60, -60, 1, "diagonal"]]) {
          await c.open(`${Q}&stop=1`);
          const m = await ev(c.view, `swipe(A.world, ${dx}, ${dy}); return A.index === ${want} ? "" : "swipe ${what}: index 1 -> " + A.index + " (want ${want})";`);
          if (m) out.push(m);
        }
        return out.join("; ");
      }],
      ["final state == ?stop load", async (c) => {
        await c.open(`${Q}&stop=2`);
        const want = await ev(c.view, `return A.snapshot();`);
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `for (let i = 0; i < 6; i++) wheel(A.world, { deltaY: 40 }); if (!(await settle(2))) return "wheel next did not settle on stop 2 (index " + A.index + ")"; return A.snapshot() === ${JSON.stringify(want)} ? "" : "snapshot after wheel next != fresh ?stop=2";`);
      }],
      ["reduced motion same actions", async (c) => {
        await c.open("motion=reduce&hud=0&stop=1");
        return ev(c.view, `for (let i = 0; i < 30; i++) wheel(A.world, { deltaY: 60 * 0.85 ** i + 0.5 }); const w = A.index; swipe(A.world, -60, 0); return w === 2 && A.index === 3 ? "" : "reduced motion: wheel burst -> " + w + " (want 2), then swipe -> " + A.index + " (want 3)";`);
      }],
    ],
  },
};

async function runFeature(name, ctx) {
  const spec = FEATURES[name];
  if (!spec) return [`unknown fixture feature "${name}"`];
  const out = [];
  await ctx.open(`${Q}&stop=0`);
  const missing = await ev(ctx.view, spec.api);
  if (missing.length) {
    out.push(`missing runtime API: ${missing.join(", ")}`);
    if (spec.skipOnMissing) return out;
  }
  for (const [label, step] of spec.steps) {
    try {
      const m = await step(ctx);
      if (m) out.push(`${label}: ${m}`);
    } catch (e) {
      out.push(`${label}: ${e?.message ?? e}`);
    }
  }
  return out;
}

// Per-element state used by --stop-diff; independent of snapshot() so it works on old runtimes.
const STOP_DIFF = `(() => {
  const a = __eidos, w = a.world;
  const GEO = ["cx", "cy", "r", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points", "transform", "d"];
  const sig = () => [...w.querySelectorAll("*")].map((n) => {
    let txt = "";
    for (const c of n.childNodes) if (c.nodeType === 3) txt += c.nodeValue;
    const cls = [...n.classList].filter((c) => c !== "eidos-fade").join(" ");
    const attrs = [...n.attributes].filter((x) => GEO.includes(x.name) || x.name.startsWith("data-eidos-")).map((x) => x.name + "=" + x.value).join(",");
    return [n.getAttribute("style") || "", cls, attrs, txt.trim(), "value" in n ? n.value : "", n.checked ?? ""].join("|");
  });
  const scenes = Array.isArray(a.scenes) ? a.scenes : [];
  const sceneOf = (s) => s.scene ?? scenes.find((sc) => s.t >= sc.t0 - 1e-9 && s.t < (sc.t1 ?? Infinity) - 1e-9)?.id ?? (scenes.length ? "?" : "_");
  const states = a.stops.map((s) => { a.seek(s.t); return { scene: sceneOf(s), el: sig(), cam: w.style.transform }; });
  const out = [];
  for (let i = 0; i + 1 < states.length; i++) {
    const p = states[i], q = states[i + 1];
    if (p.scene !== q.scene) continue;
    let n = 0;
    for (let k = 0; k < p.el.length; k++) if (p.el[k] !== q.el[k]) n++;
    out.push("scene=" + p.scene + " stops=" + i + "->" + (i + 1) + " changed=" + n + "/" + p.el.length + " cameraChanged=" + (p.cam !== q.cam));
  }
  return out;
})()`;

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

async function contactSheet(view, file, slug, stops) {
  const dir = join(contactDir, slug);
  const png = join(contactDir, `${slug}.contact.png`);
  rmSync(dir, { recursive: true, force: true });
  rmSync(png, { force: true });
  mkdirSync(dir, { recursive: true });
  await view.resize(1280, 800);
  const shot = async (query, nameOut) => {
    await open(view, file, `motion=full&theme=light&hud=0&${query}`);
    await Bun.write(join(dir, nameOut), await view.screenshot());
    return nameOut;
  };
  const rows = [];
  for (let i = 0; i < stops.length; i++) {
    const cells = [];
    if (i > 0)
      for (const f of [0.25, 0.5, 0.75]) {
        const t = stops[i - 1].t + (stops[i].t - stops[i - 1].t) * f;
        cells.push({ src: await shot(`t=${t}`, `s${i - 1}-${i}-${f * 100}.png`), cap: `${f * 100}% ${i - 1}\u2192${i} (t=${t.toFixed(2)})` });
      }
    else cells.push(null, null, null);
    cells.push({ src: await shot(`stop=${i}`, `s${i}.png`), cap: `stop ${i}: ${stops[i].label || "(no label)"}`, stop: true });
    rows.push(cells);
  }
  const CW = 320, CH = 200, CAP = 34, GAP = 8;
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:${GAP}px;background:#e9e9ee;font:12px/1.3 -apple-system,system-ui,sans-serif;color:#222}
    h1{font-size:13px;margin:0 0 ${GAP}px}
    .g{display:grid;grid-template-columns:repeat(4,${CW}px);gap:${GAP}px}
    figure{margin:0;background:#fff;border:1px solid #ccc}
    figure.stop{border:2px solid #2a6df4}
    img{display:block;width:${CW}px;height:${CH}px;object-fit:cover}
    figcaption{height:${CAP}px;padding:2px 6px;overflow:hidden}
  </style><h1>${esc(slug)} - per-stop frames with 25/50/75% boundary frames</h1><div class="g">${rows
    .flat()
    .map((c) => (c ? `<figure class="${c.stop ? "stop" : ""}"><img src="${esc(c.src)}"><figcaption>${esc(c.cap)}</figcaption></figure>` : "<div></div>"))
    .join("")}</div>`;
  const page = join(dir, "contact.html");
  await Bun.write(page, html);
  await view.resize(4 * CW + 5 * GAP + 8, 40 + rows.length * (CH + CAP + 4 + GAP) + GAP);
  await view.navigate(`file://${page}`);
  await view.evaluate(`Promise.all([...document.images].map((i) => i.decode().catch(() => null))).then(() => true)`);
  await Bun.write(png, await view.screenshot());
  await view.resize(1280, 800);
  return png;
}

async function runOne(file) {
  const name = file.startsWith(root + "/") ? file.slice(root.length + 1) : file;
  const slug = name.replace(/\//g, "__").replace(/\.html$/, "");
  const res = { name, errors: [], structure: checkStructure(file), determinism: [], reduced: [], features: {}, expected: [], shots: [], stopDiff: [] };
  const consoleErrors = [];
  const view = new Bun.WebView({ width: 1280, height: 800, console: (type, ...a) => type === "error" && consoleErrors.push(a.map(String).join(" ")) });
  try {
    if (!(await open(view, file, "motion=full&hud=0"))) {
      res.errors.push("stage did not start within 5s (window.__eidos.started is false)");
      return res;
    }
    const info = await view.evaluate(
      `({ end: __eidos.end, stops: __eidos.stops.map(s => ({ t: s.t, label: s.label || "" })), errors: window.__eidosErrors, fixture: window.__eidosFixture ?? null, build: window.__eidosFixtureBuild ?? [] })`,
    );
    res.errors.push(...info.errors);
    res.stops = info.stops.length - 1;
    if (!(info.end > 0)) res.errors.push("timeline has zero length");
    const stopTs = info.stops.map((s) => s.t);

    // 5 spread samples plus every stop time and its +/-1e-6 neighbours.
    const base = [0, info.end * 0.23, info.end * 0.5, info.end * 0.77, info.end].map((t) => Math.round(t * 1000) / 1000);
    const around = stopTs.flatMap((t) => [t - 1e-6, t, t + 1e-6]).filter((t) => t >= 0 && t <= info.end);
    const ts = [...base, ...around.filter((t) => !base.includes(t))];
    const seq = await view.evaluate(`(() => {
      const a = __eidos, ts = ${JSON.stringify(ts)};
      const fwd = ts.map(t => (a.seek(t), a.snapshot()));
      const bwd = [...ts].reverse().map(t => (a.seek(t), a.snapshot())).reverse();
      const mixed = [3, 0, 4, 1, 2].map(i => [i, (a.seek(ts[i]), a.snapshot())]);
      return { fwd, bwd, mixed };
    })()`);
    for (let i = 0; i < ts.length; i++) {
      await open(view, file, `motion=full&hud=0&t=${ts[i]}`);
      const fresh = await view.evaluate("__eidos.snapshot()");
      if (fresh !== seq.fwd[i]) res.determinism.push(`t=${ts[i]}: forward seek != fresh load`);
      if (fresh !== seq.bwd[i]) res.determinism.push(`t=${ts[i]}: backward seek != fresh load`);
      for (const [j, snap] of seq.mixed) if (j === i && snap !== fresh) res.determinism.push(`t=${ts[i]}: out-of-order seek != fresh load`);
    }

    if (stopDiff) res.stopDiff = await view.evaluate(STOP_DIFF);

    await open(view, file, "motion=reduce&hud=0&stop=0");
    const red = await view.evaluate(`(() => {
      const a = __eidos, out = [];
      if (!a.reduced) out.push("reduced flag not set by ?motion=reduce");
      for (let i = 1; i < a.stops.length; i++) {
        a.goto(i);
        if (Math.abs(a.t - a.stops[i].t) > 1e-9) out.push("stop " + i + ": not reached instantly (t=" + a.t + ")");
        if (/blur\\(/.test(a.snapshot())) out.push("stop " + i + ": blur filter present under reduced motion");
      }
      return out;
    })()`);
    res.reduced.push(...red);
    const lateErrors = await view.evaluate("window.__eidosErrors");
    res.errors.push(...lateErrors);

    if (shotsDir) {
      const variants = [
        ["desktop", 1280, 800, "light"],
        ["desktop", 1280, 800, "dark"],
        ["mobile", 390, 844, "light"],
        ["mobile", 390, 844, "dark"],
      ];
      for (const [vp, w, h, theme] of variants) {
        await view.resize(w, h);
        const stops = allStops && vp === "desktop" && theme === "light" ? [...Array(res.stops + 1).keys()].slice(1) : [res.stops];
        for (const st of stops) {
          await open(view, file, `motion=full&theme=${theme}&stop=${st}`);
          const out = join(shotsDir, `${slug}__${vp}-${theme}-s${st}.png`);
          await Bun.write(out, await view.screenshot());
          res.shots.push(out);
        }
      }
      await view.resize(1280, 800);
    }

    if (contactDir) res.contact = await contactSheet(view, file, slug, info.stops);

    // Feature checks own the errors they provoke (e.g. ?c.zzz=1), so console errors
    // logged from here on are judged by the checks, not by the generic error list.
    const fx = info.fixture;
    if (fx) {
      res.expectFailList = Array.isArray(fx.expectFail) ? fx.expectFail : [];
      const keep = consoleErrors.length;
      const ctx = { view, file, fixture: fx, stops: stopTs, end: info.end, open: (q, h) => open(view, file, q, h) };
      for (const feat of Object.keys(fx).filter((k) => k !== "expectFail")) {
        const build = [...new Set(info.build.filter((m) => m.startsWith(`${feat}: `)).map((m) => `build: ${m.slice(feat.length + 2).split(". (In ")[0]}`))];
        res.features[feat] = [...build, ...(await runFeature(feat, ctx))];
      }
      consoleErrors.length = keep;
      for (const m of info.build.filter((m) => !Object.keys(fx).some((f) => m.startsWith(`${f}: `)))) res.errors.push(`fixture build: ${m}`);
    }
  } catch (e) {
    res.errors.push(`qa exception: ${e?.message ?? e}`);
  } finally {
    view.close();
  }
  res.errors.push(...consoleErrors.filter((m) => !res.errors.some((x) => m.includes(x))));
  return res;
}

// expectFail inversion: a declared check that fails is reported as EXPECTED-FAIL ok;
// a declared check that passes is itself a failure (the negative fixture lost its teeth).
function applyExpectFail(r, fixtureExpect) {
  for (const check of fixtureExpect) {
    const list = check === "errors" ? r.errors : check in r.features ? r.features[check] : r[check];
    if (!Array.isArray(list)) {
      r.errors.push(`expectFail names unknown check "${check}"`);
      continue;
    }
    if (list.length) {
      r.expected.push(check);
      list.length = 0;
    } else r.errors.push(`expectFail "${check}" declared but the check passed`);
  }
}

if (shotsDir) mkdirSync(shotsDir, { recursive: true });
if (contactDir) mkdirSync(contactDir, { recursive: true });
const results = [];
const queue = [...targets];
await Promise.all(
  Array.from({ length: Math.min(4, queue.length) }, async () => {
    while (queue.length) {
      const file = queue.shift();
      results.push(await runOne(file));
    }
  }),
);
results.sort((a, b) => a.name.localeCompare(b.name));

let ok = 0, det = 0, red = 0, featOk = 0, featN = 0;
for (const r of results) {
  if (r.expectFailList) applyExpectFail(r, r.expectFailList);
  const featFail = Object.values(r.features).some((l) => l.length);
  featN += Object.keys(r.features).length;
  featOk += Object.values(r.features).filter((l) => !l.length).length;
  const pass = !r.errors.length && !r.structure.length;
  ok += pass;
  det += !r.determinism.length;
  red += !r.reduced.length;
  const flag = pass && !r.determinism.length && !r.reduced.length && !featFail ? "PASS" : "FAIL";
  console.log(`${flag}  ${r.name}  (stops ${r.stops ?? "?"})`);
  for (const [k, list] of [["error", r.errors], ["structure", r.structure], ["determinism", r.determinism], ["reduced", r.reduced]])
    for (const m of list) console.log(`      ${k}: ${m}`);
  for (const [feat, list] of Object.entries(r.features)) for (const m of list) console.log(`      ${feat}: ${m}`);
  for (const c of r.expected) console.log(`      EXPECTED-FAIL ok  ${c}`);
  for (const m of r.stopDiff) console.log(`      ${m}`);
  if (r.contact) console.log(`      contact: ${r.contact}`);
}
const n = results.length;
console.log(`\nTEMPLATES ${ok}/${n} ${ok === n ? "PASS" : "FAIL"}`);
console.log(`DETERMINISM ${det}/${n}`);
console.log(`REDUCED ${red}/${n}`);
if (featN) console.log(`FEATURES ${featOk}/${featN}`);
if (shotsDir) console.log(`SHOTS ${results.reduce((s, r) => s + r.shots.length, 0)} -> ${shotsDir}`);
if (contactDir) console.log(`CONTACT ${results.filter((r) => r.contact).length} -> ${contactDir}`);
if (expect != null && n !== expect) console.log(`EXPECTED ${expect} files, found ${n}`);
Bun.WebView.closeAll();
process.exit(ok === n && det === n && red === n && featOk === featN && (expect == null || n === expect) ? 0 : 1);
