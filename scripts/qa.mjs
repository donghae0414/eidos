#!/usr/bin/env bun
import { Glob } from "bun";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const args = process.argv.slice(2);
const VALUE_FLAGS = ["--shots", "--expect", "--only", "--contact", "--step"];
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
const stepRe = opt("--step") ? new RegExp(opt("--step")) : null;
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
// After readiness, two more animation frames so screenshots never capture a pre-paint (blank) frame.
async function open(view, file, query, hash = "") {
  await view.navigate(`file://${file}?${query}&_qa=${++navSeq}${hash ? `#${hash}` : ""}`);
  if (!(await view.evaluate(READY))) return false;
  return view.evaluate(`new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))`);
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
  const frames = () => new Promise((z) => requestAnimationFrame(() => requestAnimationFrame(z)));
  // Visible scene state without snapshot()'s params line, so a params-only change is not a visual change.
  const GEO = ["cx", "cy", "r", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points", "transform", "d"];
  const scene = () => [A.world, ...A.world.querySelectorAll("*")].map((n) => { let txt = ""; for (const c of n.childNodes) if (c.nodeType === 3) txt += c.nodeValue; const cls = [...n.classList].filter((c) => c !== "eidos-fade").join(" "); const at = [...n.attributes].filter((x) => GEO.includes(x.name) || x.name.startsWith("data-eidos-")).map((x) => x.name + "=" + x.value).join(","); return [n.getAttribute("style") || "", cls, at, txt.trim(), "value" in n ? n.value : "", n.checked ?? ""].join("|"); }).join("\\n");
  const settle = (i, ms = 5000) => waitFor(() => A.index === i && near(A.t, A.stops[i].t, 1e-6), ms);
`;
async function ev(view, body) {
  const r = await view.evaluate(
    `(async () => { ${PRELUDE} try { return { ok: await (async () => { ${body} })() }; } catch (e) { return { err: String((e && e.message) || e).split(". (In ")[0] }; } })()`,
  );
  if (r && "err" in r) throw new Error(r.err);
  return r?.ok;
}

// Trusted keyboard input. WebKit's Bun.WebView press() delivers no arrow keys to a range input
// (probed), so these steps open the page in a Chrome-backed view, whose press() sends trusted
// keydown/input/keyup. No Chrome means the step fails: the criterion is never certified without it.
const CHROME_MS = 20000;
const within = (p, ms, what) => {
  let t;
  const late = new Promise((_, no) => {
    t = setTimeout(() => no(new Error(`${what} timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([p, late]).finally(() => clearTimeout(t));
};
async function trustedArrow(c, query, sel, param) {
  let view;
  try {
    try {
      view = new Bun.WebView({ backend: { type: "chrome", url: false }, width: 1280, height: 800 });
      if (!(await within(open(view, c.file, query), CHROME_MS, "Chrome page load"))) return "stage did not start in the Chrome-backed view";
    } catch (e) {
      return `chrome backend unavailable: ${e?.message ?? e}`;
    }
    const S = JSON.stringify(sel), P = JSON.stringify(param);
    const m = await within(ev(view, `const r = $(${S}); if (!r) return "no range input " + ${S}; if (r.disabled) return "slider is disabled"; await frames(); r.focus(); if (document.activeElement !== r) return "slider did not take focus (activeElement is " + (document.activeElement && document.activeElement.tagName) + ")"; window.__qaKey = { v0: Number(r.value), step: Number(r.step) || 1, p0: ${P} && A.params[${P}], s0: scene(), i0: A.index, up: new Promise((z) => r.addEventListener("keyup", (e) => e.key === "ArrowRight" && z(e.isTrusted))) }; return "";`), 10000, "slider setup");
    if (m) return m;
    await within(view.press("ArrowRight"), 10000, "press(ArrowRight)");
    // Listeners run in registration order, so this keyup resolves after any runtime keyup handler.
    return await within(ev(view, `const k = window.__qaKey, r = $(${S}); const up = await Promise.race([k.up, new Promise((z) => setTimeout(() => z(null), 2000))]); if (up === null) return "no ArrowRight keyup reached the slider within 2s"; if (!up) return "ArrowRight keyup was not trusted"; await frames(); const bad = [], want = k.v0 + k.step; if (Number(r.value) !== want) bad.push("slider value " + k.v0 + " -> " + r.value + " (want " + want + ")"); if (${P} && A.params[${P}] !== want) bad.push("params." + ${P} + " " + k.p0 + " -> " + A.params[${P}] + " (want " + want + ")"); if (scene() === k.s0) bad.push("visible scene unchanged"); if (A.index !== k.i0) bad.push("index " + k.i0 + " -> " + A.index); if (errs().length) bad.push("__eidosErrors: " + errs().join(" | ")); return bad.length ? "trusted ArrowRight on focused slider: " + bad.join("; ") : "";`), 10000, "slider verify");
  } finally {
    view?.close();
  }
}

// ---------------------------------------------------------------------------
// Runtime feature checks (fixtures in scripts/fixtures declare window.__eidosFixture).
// Each check is a list of [label, step]; a step returns a failure string or "".
// They encode the assertions of plan todos 3-7 against docs/runtime-api.md and are
// expected to FAIL until those runtime features land (TDD red phase).
// ---------------------------------------------------------------------------
const Q = "motion=full&hud=0";
// Controls fixture helpers: the time where declared controls are live, and a control's min/max declared values.
const at = (c) => c.fixture.controlsAt ?? c.end;
const note = (k, what, vs) => console.log(`      controls ${k}: ${what} ok (${vs.join(", ")})`);
const bounds = (vs) => (vs.every((v) => typeof v === "number") ? [Math.min(...vs), Math.max(...vs)] : [vs[0], vs[vs.length - 1]]);
const QM = "clock=manual&autoplay=0&hud=0&motion=full";

const HUB_ORDER = ["hub.0", "A.0", "A.1", "hub.ret-A", "B.0", "B.1", "hub.ret-B", "outro.0"];
// Stop keys (scene.(id ?? local)) by index; computed once per fixture run so any hub step can run alone.
async function hubIdx(c) {
  if (c.idx) return c.idx;
  await c.open(`${Q}&stop=0`);
  c.keys = await ev(c.view, `return A.stops.map((s, i) => { A.jump(i); const w = A.where(); return w.scene + "." + (s.id ?? w.local); });`);
  c.idx = Object.fromEntries(c.keys.map((k, i) => [k, i]));
  return c.idx;
}
async function needIdx(c) {
  const I = await hubIdx(c);
  const miss = HUB_ORDER.filter((k) => !(k in I));
  if (miss.length) throw new Error(`hub stop keys lack ${miss.join(", ")} (keys ${JSON.stringify(c.keys)})`);
  return I;
}

const FEATURES = {
  hubReturn: {
    api: `return ["scene", "spoke", "back", "enter", "exit"].filter((k) => typeof A[k] !== "function");`,
    steps: [1280, 390].flatMap((width) => [1, 4].flatMap((depth) => [1, 2].flatMap((count) =>
      ["cut", "cross-dissolve", "camera"].flatMap((via) => [0.4, 0].flatMap((dur) =>
        ["full", "reduce"].map((motion) => [
          `${width} depth=${depth} spokes=${count} ${via} dur=${dur} ${motion}`,
          async (c) => {
            await c.view.resize(width, width === 390 ? 844 : 800);
            const query = `clock=manual&autoplay=0&motion=${motion}&via=${via}&dur=${dur}&depth=${depth}&count=${count}`;
            await c.open(`${query}&stop=1`);
            const baseline = await ev(c.view, `return A.snapshot();`);
            const result = await ev(c.view, `
              const hub = ${JSON.stringify(baseline)}, bad = [];
              const visible = (el) => {
                const r = el.getBoundingClientRect(), v = A.el.getBoundingClientRect();
                let opacity = 1;
                for (let n = el; n; n = n.parentElement) {
                  const cs = getComputedStyle(n);
                  if (cs.display === "none" || cs.visibility === "hidden") return false;
                  opacity *= Number(cs.opacity);
                }
                return opacity > 0 && r.width > 0 && r.height > 0 && r.right > v.left && r.left < v.right && r.bottom > v.top && r.top < v.bottom;
              };
              if (!visible($("#branch-A")) || (${count} === 2 && !visible($("#branch-B")))) bad.push("initial hub is not visible");
              for (const id of ${JSON.stringify(["A", "B"].slice(0, count))}) {
                const record = A.scenes.find((s) => s.id === id);
                A.seek(record.t0);
                if (A.snapshot() !== hub) bad.push(id + " entry boundary != hub.0");
                A.jump(1); A.enter(id); A.advance(10000);
                if (A.where().scene !== id || !visible($("#branch-" + id))) bad.push(id + " entry destination");
                A.exit(); A.advance(10000);
                if (A.snapshot() !== hub) bad.push(id + " return != hub.0");
                if (location.hash !== "#hub.ret-" + id) bad.push(id + " return hash " + location.hash);
                A.seek(record.t0);
                if (A.snapshot() !== hub) bad.push(id + " backward boundary != hub.0");
                A.jump(1); A.enter(id); A.advance(10000); A.exit(); A.advance(10000);
                if (A.snapshot() !== hub) bad.push(id + " repeated return != hub.0");
              }
              return bad;
            `);
            for (const id of ["A", "B"].slice(0, count)) {
              await c.open(query, `hub.ret-${id}`);
              const bad = await ev(c.view, `return A.snapshot() !== ${JSON.stringify(baseline)} || A.where().scene !== "hub" || A.stops[A.index].id !== ${JSON.stringify(`ret-${id}`)};`);
              if (bad) result.push(`${id} fresh #hub.ret-${id} != hub.0`);
            }
            await c.view.resize(1280, 800);
            return result.join("; ");
          },
        ])))))),
  },
  stopIdentity: {
    api: `return [typeof A.scene === "function" ? "" : "s.scene"].filter(Boolean);`,
    steps: ["cut", "camera"].flatMap((via) => ["full", "reduce"].map((motion) => [
      `${via} dur 0 ${motion} stop identity and boundary reseek`,
      async (c) => {
        await c.open(`clock=manual&autoplay=0&hud=0&motion=${motion}&via=${via}`);
        return ev(c.view, `
          const bad = [], roots = [...A.world.querySelectorAll("[data-scene]")];
          const visible = () => {
            const viewport = A.el.getBoundingClientRect();
            return roots.filter((el) => {
              const cs = getComputedStyle(el), r = el.getBoundingClientRect();
              return Number(cs.opacity) > 0 && cs.visibility !== "hidden" && cs.display !== "none" &&
                r.right > viewport.left && r.left < viewport.right && r.bottom > viewport.top && r.top < viewport.bottom;
            }).map((el) => el.dataset.scene).join();
          };
          const check = (want, label) => { const got = visible(); if (got !== want) bad.push(label + ": visible=" + got + " want=" + want); };
          for (let i = 0; i < A.stops.length; i++) {
            const stop = A.stops[i], want = stop.scene ?? "a";
            A.seek(stop.t); check(want, "stop " + i + " t=" + stop.t);
            const next = A.stops[i + 1];
            if (next && next.scene !== want) {
              const entry = A.scenes.find((s) => s.id === next.scene);
              if (entry.t0 !== stop.t) bad.push("fixture boundary does not equal previous stop");
              A.seek(stop.t + 1e-6); check(next.scene, "after stop " + i);
              A.seek(stop.t); check(want, "reseek stop " + i);
            }
          }
          for (const stop of [...A.stops].reverse()) {
            A.seek(stop.t); check(stop.scene ?? "a", "backward t=" + stop.t);
          }
          return bad.join("; ");
        `);
      },
    ])),
  },
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
        return ev(c.view, `const r = $("#r"); if (r.disabled) return "range input is disabled"; r.focus(); if (document.activeElement !== r) return "range input did not take focus"; const i = A.index; const untouched = key(r, "ArrowRight"); if (A.index !== i) return "ArrowRight on a focused range input changed __eidos.index " + i + " -> " + A.index; return untouched ? "" : "keydown on a focused range input was canceled (slider cannot move)";`);
      }],
      ["focused range + trusted ArrowRight (Chrome)", (c) => trustedArrow(c, `${Q}&stop=1`, "#r", null)],
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
      ["malformed stop values start at stop 0", async (c) => {
        const bad = [];
        for (const v of ["abc", "", "NaN"]) {
          const ok = await c.open(`${Q}&stop=${v}`).catch((e) => e.message);
          if (ok !== true) { bad.push(`stop=${v}: stage did not start (${ok})`); continue; }
          const m = await ev(c.view, `return errs().length || A.index !== 0 || !near(A.t, A.stops[0].t) ? JSON.stringify({ errs: errs(), index: A.index, t: A.t }) : "";`);
          if (m) bad.push(`stop=${v}: ${m}`);
        }
        return bad.join("; ");
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
    apiQuery: `${QM}&t=0.1`, // advance() is only promised on ?clock=manual pages
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
      // Generic steps iterate every control the fixture declares: controls: { name: [values...] }
      // (non-sticky overrides clear when a seek crosses a stop, so the page seeks, sets, then re-seeks the same t;
      // min/max = numeric min/max, else first/last) and optional controlsAt: a time inside the scene where they are live.
      ["setControls+seek == fresh ?c load", async (c) => {
        const out = [];
        const ts = [...new Set([c.stops[1], c.end / 2, c.end, ...(c.fixture.controlsAt == null ? [] : [c.fixture.controlsAt])].map((t) => Math.round(t * 1000) / 1000))];
        for (const [k, vs] of Object.entries(c.fixture.controls)) {
          const n0 = out.length;
          for (const v of vs) {
            await c.open(`${Q}&t=0`);
            const snaps = await ev(c.view, `return ${JSON.stringify(ts)}.map((t) => (A.seek(t), A.setControls({ [${JSON.stringify(k)}]: ${JSON.stringify(v)} }), A.seek(t), A.snapshot()));`);
            for (let i = 0; i < ts.length; i++) {
              await c.open(`${Q}&t=${ts[i]}&c.${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
              if ((await ev(c.view, `return A.snapshot();`)) !== snaps[i]) out.push(`${k}=${v} t=${ts[i]}`);
            }
          }
          if (out.length === n0) note(k, "setControls+seek == fresh ?c", vs);
        }
        return out.length ? `in-page setControls+seek != fresh load at ${out.join(", ")}` : "";
      }],
      ["every control changes the scene", async (c) => {
        await c.open(`${Q}&t=${at(c)}`);
        // scene() excludes the params line of snapshot(), so a control that only updates params fails.
        return ev(c.view, `const S = ${JSON.stringify(c.fixture.controls)}, dead = []; for (const k in S) { const seen = new Set(); for (const v of S[k]) { A.setControls({ [k]: v }); await frames(); seen.add(scene()); } if (seen.size < 2) dead.push(k); } return dead.length ? "controls never change the visible scene: " + dead.join(", ") : "";`);
      }],
      ["fresh ?c min vs max differ", async (c) => {
        const out = [];
        for (const [k, vs] of Object.entries(c.fixture.controls)) {
          const [lo, hi] = bounds(vs), seen = [];
          for (const v of [lo, hi]) {
            await c.open(`${Q}&t=${at(c)}&c.${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
            await ev(c.view, `await frames(); return 0;`);
            seen.push(await ev(c.view, `return scene();`));
          }
          if (seen[0] === seen[1]) out.push(`${k}=${lo} and ${k}=${hi} load the same scene`);
          else note(k, "fresh min vs max differ", [lo, hi]);
        }
        return out.join("; ");
      }],
      ["A->B->A restores", async (c) => {
        const out = [];
        for (const [k, vs] of Object.entries(c.fixture.controls)) {
          const [lo, hi] = bounds(vs);
          await c.open(`${Q}&t=${at(c)}`);
          const m = await ev(c.view, `const k = ${JSON.stringify(k)}; A.setControls({ [k]: ${JSON.stringify(lo)} }); await frames(); const a = scene(), sa = A.snapshot(); A.setControls({ [k]: ${JSON.stringify(hi)} }); await frames(); if (scene() === a) return k + " ${lo}->${hi} did not change the scene"; A.setControls({ [k]: ${JSON.stringify(lo)} }); await frames(); return a === scene() && sa === A.snapshot() ? "" : k + " ${lo}->${hi}->${lo} did not restore the scene/snapshot";`);
          if (m) out.push(m);
          else note(k, "A->B->A restores", [lo, hi]);
        }
        return out.join("; ");
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
        // Guard only: in WebKit, a synthetic keydown never moves a range input and Bun.WebView
        // press() delivers no arrow keys to it (probed). Asserted here: the slider is enabled and really
        // focused, the runtime neither cancels nor stops the key, and the stage does not navigate.
        // The full keyboard outcome is checked with trusted input in the Chrome step below.
        return ev(c.view, `const r = $(".eidos-dock input[type=range]"); if (!r) return "no range input in .eidos-dock"; if (r.disabled) return "dock slider is disabled"; r.focus(); if (document.activeElement !== r) return "dock slider did not take focus (activeElement is " + (document.activeElement && document.activeElement.tagName) + ")"; let seen = false; const probe = () => (seen = true); addEventListener("keydown", probe); const e = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }); r.dispatchEvent(e); removeEventListener("keydown", probe); if (A.index !== 1) return "ArrowRight on focused dock slider changed index 1 -> " + A.index; if (e.defaultPrevented) return "keydown on focused dock slider was preventDefault()ed (slider cannot move)"; return seen ? "" : "keydown on focused dock slider was stopped before reaching window";`);
      }],
      ["focused slider + trusted ArrowRight (Chrome)", (c) => trustedArrow(c, `${Q}&stop=1`, ".eidos-dock input[type=range]", "n")],
      ["dock slider input drives params and scene", async (c) => {
        await c.open(`${Q}&stop=1`);
        // Input wiring, not keyboard operation: the input event a slider fires must update params and the scene.
        return ev(c.view, `const r = $(".eidos-dock input[type=range]"); if (!r) return "no range input in .eidos-dock"; if (r.disabled) return "dock slider is disabled"; await frames(); const n0 = A.params.n, s0 = scene(); r.stepUp(); r.dispatchEvent(new Event("input", { bubbles: true })); await frames(); return A.params.n === n0 + 1 && scene() !== s0 && A.index === 1 ? "" : "slider input did not update params and scene (n " + n0 + " -> " + A.params.n + ", index " + A.index + ")";`);
      }],
      ["sticky keeps, non-sticky clears, drive < override", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const last = A.stops.length - 1; if (!near(A.params.w, 0.2)) return "default w at stop 1 = " + A.params.w + " (want 0.2)"; A.setControls({ w: 0.5, n: 6 }); await frames(); if (!near(A.params.w, 0.5)) return "override w=0.5 not applied (w=" + A.params.w + ")"; A.jump(last); await frames(); if (A.params.n !== 6) return "sticky n lost on stop change (n=" + A.params.n + ")"; if (!near(A.params.w, 0.9)) return "non-sticky w after stop change = " + A.params.w + " (want drive value 0.9: override must clear)"; A.setControls({ w: 0.5 }); await frames(); if (!near(A.params.w, 0.5)) return "override did not beat the drive at the same stop (w=" + A.params.w + ")"; A.jump(1); await frames(); return near(A.params.w, 0.2) ? "" : "w back at stop 1 = " + A.params.w + " (want default 0.2)";`);
      }],
      ["control edits pause playback", async (c) => {
        await c.open(`${QM}&stop=1`);
        return ev(c.view, `if (typeof A.play !== "function") return "needs the todo 4 transport (__eidos.play)"; A.play(); A.setControls({ n: 5 }); if (A.playing) return "setControls did not pause playback"; const r = $(".eidos-dock input[type=range]"); if (!r) return "no range input in .eidos-dock"; A.play(); r.stepUp(); r.dispatchEvent(new Event("input", { bubbles: true })); return A.playing ? "dock slider input did not pause playback" : "";`);
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
        await hubIdx(c);
        const at = c.keys.indexOf("hub.0");
        return at >= 0 && HUB_ORDER.every((k, j) => c.keys[at + j] === k) ? "" : `stop keys ${JSON.stringify(c.keys)} do not contain ${JSON.stringify(HUB_ORDER)} in order`;
      }],
      ["next() chain + hash", async (c) => {
        const I = await needIdx(c);
        await c.open(`${Q}&stop=${I["hub.0"]}`);
        return ev(c.view, `const want = ${JSON.stringify(HUB_ORDER)}, got = []; for (let j = 1; j < want.length; j++) { const i = A.index; A.next(); if (!(await settle(i + 1))) return "next() after " + want[j - 1] + " did not settle on the following stop (index " + A.index + ")"; const w = A.where(), k = w.scene + "." + (A.stops[A.index].id ?? w.local); got.push(k); if (k !== want[j]) return "next() chain reached " + JSON.stringify(got) + " (want " + JSON.stringify(want.slice(1, j + 1)) + ")"; await waitFor(() => location.hash === "#" + k, 1000); if (location.hash !== "#" + k) return "URL hash at " + k + " is '" + location.hash + "'"; } return "";`);
      }],
      ["hub invariant", async (c) => {
        const I = await needIdx(c);
        await c.open(`${Q}&stop=0`);
        return ev(c.view, `const I = ${JSON.stringify(I)}, snap = (t) => (A.seek(t), A.snapshot()); const h = snap(A.stops[I["hub.0"]].t), bad = []; for (const id of ["A", "B"]) { const sp = A.scenes.find((s) => s.id === id); if (!sp) bad.push("no scene record for spoke " + id); else if (snap(sp.t0) !== h) bad.push("spoke " + id + " t0"); } if (snap(A.stops[I["hub.ret-A"]].t) !== h) bad.push("hub.ret-A"); if (snap(A.stops[I["hub.ret-B"]].t) !== h) bad.push("hub.ret-B"); return bad.length ? "snapshot differs from hub.0 at " + bad.join(", ") : "";`);
      }],
      ["exit() returns to the hub state", async (c) => {
        const I = await needIdx(c);
        await c.open(Q, "hub.0");
        // Full snapshots (params line included): exit() and a fresh #hub.ret-A must both equal the
        // original #hub.0 snapshot taken before any enter().
        const diff = `const diff = (a, b) => { const x = a.split("\\n"), y = b.split("\\n"); const i = Math.max(0, x.findIndex((l, k) => l !== y[k])); return " (line " + i + ": " + JSON.stringify(x[i]) + " vs " + JSON.stringify(y[i]) + ")"; };`;
        const r = await ev(c.view, `${diff} const I = ${JSON.stringify(I)}; if (A.index !== I["hub.0"]) return { err: "#hub.0 loaded index " + A.index }; await frames(); const hub = A.snapshot(); A.enter("A"); if (!(await settle(I["A.0"]))) return { err: "enter('A') did not land on A.0 (index " + A.index + ")" }; A.exit(); if (!(await settle(I["hub.ret-A"]))) return { err: "exit() did not land on hub.ret-A (index " + A.index + ")" }; await frames(); await waitFor(() => location.hash === "#hub.ret-A", 1000); if (location.hash !== "#hub.ret-A") return { err: "URL hash after exit() is '" + location.hash + "' (want #hub.ret-A)" }; const ex = A.snapshot(); if (ex !== hub) return { err: "snapshot after exit() != original #hub.0 snapshot" + diff(hub, ex) }; A.next(); if (!(await settle(I["B.0"]))) return { err: "next() after exit() did not land on B.0 (index " + A.index + ")" }; return { hub };`);
        if (r.err) return r.err;
        await c.open(Q, "hub.ret-A");
        return ev(c.view, `${diff} const I = ${JSON.stringify(I)}, hub = ${JSON.stringify(r.hub)}; if (A.index !== I["hub.ret-A"]) return "fresh #hub.ret-A loaded index " + A.index; await frames(); const fr = A.snapshot(); if (fr !== hub) return "fresh #hub.ret-A snapshot != original #hub.0 snapshot" + diff(hub, fr); A.next(); return (await settle(I["B.0"])) ? "" : "next() from fresh #hub.ret-A did not land on B.0 (index " + A.index + ")";`);
      }],
      ["fresh #hub.0 next -> A.0", async (c) => {
        const I = await needIdx(c);
        await c.open(Q, "hub.0");
        return ev(c.view, `const I = ${JSON.stringify(I)}; if (A.index !== I["hub.0"]) return "#hub.0 loaded index " + A.index; A.next(); return (await settle(I["A.0"])) ? "" : "next() from #hub.0 did not land on A.0 (index " + A.index + ")";`);
      }],
      ["#A.1 == ?stop", async (c) => {
        const I = await needIdx(c);
        await c.open(`${Q}&stop=${I["A.1"]}`);
        const want = await ev(c.view, `return A.snapshot();`);
        await c.open(Q, "A.1");
        return ev(c.view, `if (A.index !== ${I["A.1"]}) return "#A.1 loaded index " + A.index + " (want ${I["A.1"]})"; return A.snapshot() === ${JSON.stringify(want)} ? "" : "#A.1 snapshot != ?stop=${I["A.1"]} snapshot";`);
      }],
      ["nested enter/exit stack", async (c) => {
        const I = await needIdx(c);
        await c.open(`${Q}&stop=${I["hub.0"]}`);
        return ev(c.view, `const I = ${JSON.stringify(I)}; A.enter("A"); if (!(await settle(I["A.0"]))) return "enter A failed"; A.enter("B"); if (!(await settle(I["B.0"]))) return "enter B from A failed (index " + A.index + ")"; A.exit(); if (!(await settle(I["hub.ret-B"]))) return "first exit() did not land on hub.ret-B (index " + A.index + ")"; A.exit(); return (await settle(I["hub.ret-A"])) ? "" : "second exit() did not land on hub.ret-A (index " + A.index + ")";`);
      }],
      ["empty exit() is a no-op", async (c) => {
        const I = await needIdx(c);
        await c.open(`${Q}&stop=${I["hub.0"]}`);
        return ev(c.view, `const t = A.t; A.exit(); await frames(); return A.index === ${I["hub.0"]} && A.t === t ? "" : "exit() with an empty return stack moved to index " + A.index + " t=" + A.t;`);
      }],
      ["spoke tag, origin click, keys 1-9, Esc", async (c) => {
        const I = await needIdx(c);
        await c.open(`${Q}&stop=${I["hub.0"]}`);
        // Clicking B's origin must enter B; a plain next() from hub.0 would land on A.0 instead.
        const m = await ev(c.view, `const I = ${JSON.stringify(I)}; if ($("#node-a").dataset.eidosSpoke !== "A" || $("#node-b").dataset.eidosSpoke !== "B") return "spoke origins lack data-eidos-spoke"; click($("#node-b")); return (await settle(I["B.0"])) ? "" : "click on spoke origin #node-b did not enter B (index " + A.index + ")";`);
        if (m) return m;
        await c.open(`${Q}&stop=${I["hub.0"]}`);
        return ev(c.view, `const I = ${JSON.stringify(I)}; key(document.body, "2"); if (!(await settle(I["B.0"]))) return "key 2 did not enter B (index " + A.index + ")"; key(document.body, "Escape"); return (await settle(I["hub.ret-B"])) ? "" : "Esc did not exit to hub.ret-B (index " + A.index + ")";`);
      }],
      ["breadcrumb + eidos:scene", async (c) => {
        const I = await needIdx(c);
        await c.open(`motion=full&stop=${I["hub.0"]}`);
        // The breadcrumb element itself must sit outside the world: ancestors of the world
        // (stage, body) are excluded so text inside the world cannot satisfy the check.
        return ev(c.view, `const I = ${JSON.stringify(I)}; let got = null; addEventListener("eidos:scene", (e) => (got = got || e.detail)); A.enter("A"); await settle(I["A.0"]); if (!got || got.id !== "A") return "no eidos:scene {id: 'A'} on enter (got " + JSON.stringify(got) + ")"; const crumb = [...document.querySelectorAll("body *")].find((n) => !n.contains(A.world) && !n.closest(".eidos-world") && /(hub|지도)\\s*›\\s*A\\b/.test(n.textContent)); return crumb ? "" : "no 'hub › A' breadcrumb outside .eidos-world";`);
      }],
      ["wheel inside a spoke, then Esc", async (c) => {
        const I = await needIdx(c);
        await c.open(`${Q}&stop=${I["hub.0"]}`);
        return ev(c.view, `const I = ${JSON.stringify(I)}; key(document.body, "1"); if (!(await settle(I["A.0"]))) return "key 1 did not enter A (index " + A.index + ")"; wheel(A.el, { deltaY: 100 }); if (!(await settle(I["A.1"]))) return "wheel inside spoke A did not reach A.1 (index " + A.index + ")"; key(document.body, "Escape"); return (await settle(I["hub.ret-A"])) ? "" : "Esc after a wheel step did not return to hub.ret-A (index " + A.index + ")";`);
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

  // Cross-feature checks. The fixture declares what it authored (window.__eidosFixture.integration);
  // scripts/fixtures/bad-integration.html declares the same but violates each, and must fail each step.
  integration: {
    api: `return [...["setControls", "onLayout", "goto"].filter((k) => typeof A[k] !== "function").map((k) => "__eidos." + k + "()"), ...(Array.isArray(A.scenes) ? [] : ["__eidos.scenes"])];`,
    skipOnMissing: true,
    steps: [
      ["control when visibility", async (c) => {
        await c.open(`${Q}&stop=0`);
        return ev(c.view, `const W = ${JSON.stringify(c.fixture.integration.when)}, bad = [], dock = $(".eidos-dock"); if (!dock) return "no .eidos-dock"; const idx = (v) => typeof v === "number" ? v : A.stops.findIndex((s) => s.id === v); const shown = (n) => { const r = n.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0) || getComputedStyle(n).visibility !== "visible") return false; let o = 1; for (let m = n; m; m = m.parentElement) { const cs = getComputedStyle(m); if (cs.display === "none") return false; o *= Number(cs.opacity); } return o > 0.01; }; for (let i = 0; i < A.stops.length; i++) { A.jump(i); await frames(); let any = false; for (const [name, w] of Object.entries(W)) { const inp = dock.querySelector('[name="' + name + '"]'); if (!inp) { bad.push("no dock input " + name); continue; } const want = Array.isArray(w) ? i >= idx(w[0]) && i <= idx(w[1]) : A.stops[i].scene === w; any ||= want; if (shown(inp) !== want) bad.push(name + " at stop " + i + " shown=" + shown(inp) + " (want " + want + ")"); } if (!any && shown(dock)) bad.push("dock shown at stop " + i + " with no control in range"); } return [...new Set(bad)].join("; ");`);
      }],
      ["layout:true re-measures", async (c) => {
        await c.open(`${Q}&stop=1`);
        const { layout, plain } = c.fixture.integration;
        return ev(c.view, `const other = (n) => { const r = $('.eidos-dock [name="' + n + '"]'); return A.params[n] === Number(r.max) ? Number(r.min) : Number(r.max); }; await frames(); let c0 = window.__qaLayouts; A.setControls({ ${JSON.stringify(layout)}: other(${JSON.stringify(layout)}) }); await frames(); const dl = window.__qaLayouts - c0; c0 = window.__qaLayouts; A.setControls({ ${JSON.stringify(plain)}: other(${JSON.stringify(plain)}) }); await frames(); const dp = window.__qaLayouts - c0; return dl >= 1 && dp === 0 ? "" : "layout() runs: layout control -> " + dl + " (want >= 1), plain control -> " + dp + " (want 0)";`);
      }],
      ["URL writes only on stop and change", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `let n = 0; const orig = history.replaceState; history.replaceState = function (...a) { n++; return orig.apply(this, a); }; try { const r = $(".eidos-dock input[type=range]:not([hidden])") || $(".eidos-dock input[type=range]"); if (!r) return "no range input in .eidos-dock"; const got = {}; const lo = Number(r.min), span = Number(r.max) - lo + 1; for (let k = 0; k < 200; k++) { r.value = String(lo + (k % span)); r.dispatchEvent(new Event("input", { bubbles: true })); } await frames(); got.input200 = n; n = 0; r.dispatchEvent(new Event("change", { bubbles: true })); got.change = n; n = 0; A.seek((A.stops[1].t + A.stops[2].t) / 2); A.layout(); await frames(); got.seekMid_layout = n; n = 0; A.goto(2); if (!(await settle(2))) return "goto(2) did not settle"; await frames(); got.arrive = n; const want = { input200: 0, change: 1, seekMid_layout: 0, arrive: 1 }; const bad = Object.keys(want).filter((k) => got[k] !== want[k]); return bad.length ? "replaceState calls " + JSON.stringify(got) + " (want " + JSON.stringify(want) + ")" : ""; } finally { history.replaceState = orig; }`);
      }],
      ["J/L caption timing", async (c) => {
        await c.open("motion=full&stop=0");
        return ev(c.view, `const C = ${JSON.stringify(c.fixture.integration.captions)}, el = $(".eidos-hud-caption"); if (!el) return "no .eidos-hud-caption (HUD on)"; const bad = []; for (const x of C) { const sc = A.scenes.find((s) => s.id === x.scene); if (!sc) { bad.push("no scene " + x.scene); continue; } const at = sc.t0 - (x.lead ?? 0) + (x.trail ?? 0); for (const [t, want] of [[at - 0.02, x.prev], [at, x.label], [at + 0.02, x.label]]) { A.seek(t); await frames(); if (el.textContent !== want) bad.push(x.scene + " t=" + t.toFixed(3) + " caption '" + el.textContent + "' (want '" + want + "')"); } } return bad.join("; ");`);
      }],
      ["click mid-transition lands like ArrowRight", async (c) => {
        const out = [];
        for (const [what, code] of [["ArrowRight", `key(document.body, "ArrowRight")`], ["click", "click(A.world)"]]) {
          await c.open(`${Q}&stop=1`);
          const m = await ev(c.view, `A.goto(2); if (near(A.t, A.stops[2].t, 1e-6)) return "goto(2) finished instantly; nothing to interrupt"; ${code}; await frames(); return A.index === 2 && near(A.t, A.stops[2].t, 1e-9) ? "" : "${what} during goto(1 -> 2): index " + A.index + " t=" + A.t + " (want index 2 at t=" + A.stops[2].t + ")";`);
          if (m) out.push(m);
        }
        return out.join("; ");
      }],
      ["control edit mid-transition still arrives", async (c) => {
        const out = [];
        const P = JSON.stringify(c.fixture.integration.plain);
        for (const [what, code] of [["setControls", `A.setControls({ [${P}]: 1 })`], ["dock input event", `const r = $('.eidos-dock [name=' + ${P} + ']'); r.value = r.max; r.dispatchEvent(new Event("input", { bubbles: true }))`]]) {
          await c.open(`${Q}&stop=1`);
          const m = await ev(c.view, `A.goto(2); ${code}; return (await settle(2, 4000)) ? "" : "${what} during goto(1 -> 2) stranded the stage at index " + A.index + " t=" + A.t + " (want arrival at stop 2, t=" + A.stops[2].t + ")";`);
          if (m) out.push(m);
        }
        return out.join("; ");
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
          a = run([{ dy: 81, t: 0 }]); if (a.join() !== "next") bad.push("81px -> " + JSON.stringify(a) + " (want next)");
          a = run([{ dy: 79, t: 0 }]); if (a.length) bad.push("79px -> " + JSON.stringify(a) + " (want none)");
          a = run([...flick(0), ...flick(80 + 150)]); if (a.join() !== "next") bad.push("150ms gap (same burst) -> " + JSON.stringify(a));
          a = run([...flick(0), ...flick(80 + 170)]); if (a.join() !== "next,next") bad.push("170ms gap (new burst) -> " + JSON.stringify(a));
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
      ["DOM deltaMode line/page", async (c) => {
        const out = [];
        for (const [dy, mode, want, what] of [[6, 1, 2, "6 lines (96px)"], [4, 1, 1, "4 lines (64px)"], [1, 2, 2, "1 page"]]) {
          await c.open(`${Q}&stop=1`);
          const m = await ev(c.view, `wheel(A.world, { deltaY: ${dy}, deltaMode: ${mode} }); return A.index === ${want} ? "" : "wheel ${what}: index 1 -> " + A.index + " (want ${want})";`);
          if (m) out.push(m);
        }
        return out.join("; ");
      }],
      ["swipe directions", async (c) => {
        const out = [];
        for (const [dx, dy, want, what] of [[0, -60, 2, "up 60px"], [60, 0, 0, "right 60px"], [0, 60, 0, "down 60px"]]) {
          await c.open(`${Q}&stop=1`);
          const m = await ev(c.view, `swipe(A.world, ${dx}, ${dy}); await settle(${want}, 2000); return A.index === ${want} ? "" : "swipe ${what}: index 1 -> " + A.index + " (want ${want})";`);
          if (m) out.push(m);
        }
        return out.join("; ");
      }],
      ["nested child of scrollable panel", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `$("#panel").scrollTop = 0; for (let i = 0; i < 5; i++) wheel($("#panel .tall"), { deltaY: 60 }); return A.index === 1 ? "" : "wheel on a child of a scrollable panel navigated (index " + A.index + ")";`);
      }],
      ["preventDefault only when stage owns", async (c) => {
        await c.open(`${Q}&stop=1`);
        const m = await ev(c.view, `return wheel(A.world, { deltaY: 100 }) ? "stage-owned wheel was not preventDefault()ed" : "";`);
        if (m) return m;
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `$("#panel").scrollTop = 0; return wheel($("#panel"), { deltaY: 100 }) ? "" : "wheel owned by a scrollable panel was preventDefault()ed";`);
      }],
      ["ownership released on a new burst", async (c) => {
        await c.open(`${Q}&stop=1`);
        // The 160 ms quiet period is the behavior under test, so a real 250 ms gap is required.
        return ev(c.view, `const p = $("#panel"); p.scrollTop = 0; for (let i = 0; i < 5; i++) wheel(p, { deltaY: 60 }); p.scrollTop = p.scrollHeight; wheel(p, { deltaY: 60 }); if (A.index !== 1) return "panel-owned burst navigated"; await new Promise((z) => setTimeout(z, 250)); for (let i = 0; i < 3; i++) wheel(p, { deltaY: 60 }); return A.index === 2 ? "" : "new burst at the panel bottom did not navigate (index " + A.index + ")";`);
      }],
      ["touch-action and body overflow", async (c) => {
        await c.open(`${Q}&stop=1`);
        return ev(c.view, `const ta = getComputedStyle(A.el).touchAction, ov = getComputedStyle(document.body).overflow; return /pan-y/.test(ta) && /pinch-zoom/.test(ta) && ov === "hidden" ? "" : "stage touch-action '" + ta + "', body overflow '" + ov + "' (want 'pan-y pinch-zoom' and hidden)";`);
      }],
      ["gestures pause playback", async (c) => {
        await c.open(`${QM}&stop=1`);
        return ev(c.view, `if (typeof A.play !== "function") return "needs the todo 4 transport (__eidos.play)"; A.play(); wheel(A.world, { deltaY: 100 }); if (A.playing) return "wheel navigation did not pause playback"; A.play(); swipe(A.world, -60, 0); return A.playing ? "swipe navigation did not pause playback" : "";`);
      }],
    ],
  },
};

// The remaining controls steps probe behaviour of the fixture's own control `n`; pages that declare other controls skip them.
const GENERIC_CONTROLS = new Set(["setControls+seek == fresh ?c load", "every control changes the scene", "fresh ?c min vs max differ", "A->B->A restores"]);
FEATURES.controls.steps = FEATURES.controls.steps.map(([label, fn]) => GENERIC_CONTROLS.has(label) ? [label, fn] : [label, (c) => ("n" in c.fixture.controls ? fn(c) : "")]);

async function runFeature(name, ctx) {
  const spec = FEATURES[name];
  if (!spec) return [`unknown fixture feature "${name}"`];
  const out = [];
  await ctx.open(spec.apiQuery ?? `${Q}&stop=0`);
  const missing = await ev(ctx.view, spec.api);
  if (missing.length) {
    out.push(`missing runtime API: ${missing.join(", ")}`);
    if (spec.skipOnMissing) return out;
  }
  for (const [label, step] of spec.steps) {
    if (stepRe && !stepRe.test(label)) continue;
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
    .map((c) => (c ? `<figure class="${c.stop ? "stop" : ""}"><img src="${esc(c.src)}" loading="eager" decoding="sync"><figcaption>${esc(c.cap)}</figcaption></figure>` : "<div></div>"))
    .join("")}</div>`;
  const page = join(dir, "contact.html");
  await Bun.write(page, html);
  await view.resize(4 * CW + 5 * GAP + 8, 40 + rows.length * (CH + CAP + 4 + GAP) + GAP);
  await view.navigate(`file://${page}`);
  // Every grid image loaded and decoded, fonts ready, then two frames so the composed grid is painted.
  const painted = await view.evaluate(`new Promise((done) => {
    const t0 = performance.now(), imgs = [...document.images];
    const loaded = () => imgs.every((i) => i.complete && i.naturalWidth > 0);
    const wait = () => loaded() ? Promise.all(imgs.map((i) => i.decode().catch(() => null))).then(() => document.fonts.ready).then(() => requestAnimationFrame(() => requestAnimationFrame(() => done(true)))) : performance.now() - t0 > 10000 ? done(false) : requestAnimationFrame(wait);
    wait();
  })`);
  if (!painted) throw new Error(`contact sheet images did not load: ${page}`);
  await Bun.write(png, await view.screenshot());
  await view.resize(1280, 800);
  return png;
}

async function runOne(file) {
  const name = file.startsWith(root + "/") ? file.slice(root.length + 1) : file;
  const slug = name.replace(/\//g, "__").replace(/\.html$/, "");
  const res = { name, errors: [], structure: checkStructure(file), determinism: [], reduced: [], features: {}, expected: [], shots: [], stopDiff: [] };
  // A check that never ran (stage never started, qa exception) is a failure, not a pass.
  const ran = { determinism: false, reduced: false };
  const addErrors = (list) => res.errors.push(...(list || []).filter((m) => !res.errors.includes(m)));
  const consoleErrors = [];
  const view = new Bun.WebView({ width: 1280, height: 800, console: (type, ...a) => type === "error" && consoleErrors.push(a.map(String).join(" ")) });
  try {
    if (!(await open(view, file, "motion=full&hud=0"))) {
      res.errors.push("stage did not start within 5s (window.__eidos.started is false)");
      addErrors(await view.evaluate("window.__eidosErrors || []"));
      const fx = await view.evaluate("window.__eidosFixture ?? null");
      if (fx && Array.isArray(fx.expectFail)) res.expectFailList = fx.expectFail;
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
    ran.determinism = true;

    if (stopDiff) res.stopDiff = await view.evaluate(STOP_DIFF);

    await open(view, file, "motion=reduce&hud=0&stop=0");
    // Under ?motion=reduce: every stop is reached instantly; no 3D or blur in the COMPUTED style of the
    // world, its ancestors and its descendants; wheel/swipe and autoplay only ever land on stop times.
    const red = await view.evaluate(`(() => {
      const a = __eidos, out = [];
      if (!a.reduced) out.push("reduced flag not set by ?motion=reduce");
      const FLAT = /perspective\\(|rotateX|rotateY|matrix3d|blur\\(/;
      const chain = [a.world];
      for (let n = a.world.parentElement; n; n = n.parentElement) chain.push(n);
      const tag = (n) => n.tagName.toLowerCase() + (n.id ? "#" + n.id : "") + [...n.classList].map((c) => "." + c).join("");
      const flat = (where) => {
        for (const n of [...chain, ...a.world.querySelectorAll("*")]) {
          const cs = getComputedStyle(n);
          for (const p of ["transform", "filter", "backdrop-filter", "-webkit-backdrop-filter"]) {
            const v = cs.getPropertyValue(p);
            if (FLAT.test(v)) return out.push(where + ": computed " + p + " of " + tag(n) + " is " + v.slice(0, 80));
          }
        }
      };
      flat("stop 0");
      for (let i = 1; i < a.stops.length; i++) {
        a.goto(i);
        if (Math.abs(a.t - a.stops[i].t) > 1e-9) out.push("stop " + i + ": not reached instantly (t=" + a.t + ")");
        if (/blur\\(/.test(a.snapshot())) out.push("stop " + i + ": blur filter present under reduced motion");
        flat("stop " + i);
      }
      return out;
    })()`);
    res.reduced.push(...red);
    const AT_STOP = `const atStop = () => A.stops.findIndex((s) => Math.abs(s.t - A.t) < 1e-9);`;
    res.reduced.push(...(await ev(view, `${AT_STOP} const bad = []; A.jump(0); if (A.stops.length > 1) { wheel(A.el, { deltaY: 100 }); if (A.index !== 1 || atStop() !== 1) bad.push("reduced wheel next: index " + A.index + " t=" + A.t + " (want stop 1 at once)"); } if (A.stops.length > 2) { swipe(A.el, -60, 0); if (A.index !== 2 || atStop() !== 2) bad.push("reduced swipe next: index " + A.index + " t=" + A.t + " (want stop 2 at once)"); } return bad;`)));
    addErrors(await view.evaluate("window.__eidosErrors"));
    await open(view, file, "clock=manual&autoplay=0&motion=reduce&hud=0&stop=0");
    res.reduced.push(...(await ev(view, `${AT_STOP} if (typeof A.play !== "function") return ["no __eidos.play() for the reduced autoplay check"]; A.play({ speed: 1 }); let k = 0; for (; k < 2000 && A.playing; k++) { A.advance(100); if (atStop() < 0) return ["reduced autoplay passed through t=" + A.t + " between stops"]; } return A.index === A.stops.length - 1 ? [] : ["reduced autoplay did not reach the last stop (index " + A.index + " after " + k * 100 + " ms)"];`)));
    addErrors(await view.evaluate("window.__eidosErrors"));
    ran.reduced = true;

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
      for (const feat of Object.keys(fx).filter((k) => k !== "expectFail" && k !== "controlsAt")) {
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
    for (const k of ["determinism", "reduced"]) if (!ran[k]) res[k].push(`not run (${res.stops == null ? "stage never started" : "qa aborted before this check"}): counted as failed`);
  }
  res.errors.push(...consoleErrors.filter((m) => !res.errors.some((x) => m.includes(x))));
  return res;
}

// expectFail inversion: a declared check that fails is reported as EXPECTED-FAIL ok;
// a declared check that passes is itself a failure (the negative fixture lost its teeth).
function applyExpectFail(r, fixtureExpect) {
  for (const check of fixtureExpect) {
    // "feature:step label" inverts one step of a feature; the feature's other steps must still pass.
    const sep = check.indexOf(":");
    if (sep > 0 && check.slice(0, sep) in r.features) {
      const list = r.features[check.slice(0, sep)], label = `${check.slice(sep + 1)}: `;
      const hit = list.filter((m) => m.startsWith(label));
      if (hit.length) {
        r.expected.push(`${check} (${hit[0].slice(label.length)})`);
        list.splice(0, list.length, ...list.filter((m) => !m.startsWith(label)));
      } else r.errors.push(`expectFail "${check}" declared but the check passed`);
      continue;
    }
    const list = check === "errors" ? r.errors : check in r.features ? r.features[check] : r[check];
    if (!Array.isArray(list)) {
      r.errors.push(`expectFail names unknown check "${check}"`);
      continue;
    }
    if (list.length) {
      r.expected.push(`${check} (${list[0]})`);
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
