#!/usr/bin/env bun
import { Glob } from "bun";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const shotsDir = opt("--shots");
const expect = opt("--expect") ? Number(opt("--expect")) : undefined;
const allStops = args.includes("--all-stops");
const files = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && ["--shots", "--expect"].includes(args[i - 1])));

const targets = files.length
  ? files.map((f) => resolve(f))
  : [...new Glob("skills/*/techniques/*/template.html").scanSync({ cwd: root })].sort().map((f) => join(root, f));

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

const READY = `new Promise((r) => { const t0 = performance.now(); const c = () => window.__eidos?.started ? requestAnimationFrame(() => requestAnimationFrame(() => r(true))) : performance.now() - t0 > 5000 ? r(false) : requestAnimationFrame(c); c(); })`;

async function open(view, file, query) {
  await view.navigate(`file://${file}?${query}`);
  return view.evaluate(READY);
}

async function runOne(file) {
  const name = file.replace(root + "/", "");
  const res = { name, errors: [], structure: checkStructure(file), determinism: [], reduced: [], shots: [] };
  const consoleErrors = [];
  const view = new Bun.WebView({ width: 1280, height: 800, console: (type, ...a) => type === "error" && consoleErrors.push(a.map(String).join(" ")) });
  try {
    if (!(await open(view, file, "motion=full&hud=0"))) {
      res.errors.push("stage did not start within 5s (window.__eidos.started is false)");
      return res;
    }
    const info = await view.evaluate(`({ end: __eidos.end, stops: __eidos.stops.map(s => s.t), errors: window.__eidosErrors })`);
    res.errors.push(...info.errors);
    res.stops = info.stops.length - 1;
    if (!(info.end > 0)) res.errors.push("timeline has zero length");

    const ts = [0, info.end * 0.23, info.end * 0.5, info.end * 0.77, info.end].map((t) => Math.round(t * 1000) / 1000);
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
      const slug = name.replace(/\//g, "__").replace(/\.html$/, "");
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
    }
  } catch (e) {
    res.errors.push(`qa exception: ${e?.message ?? e}`);
  } finally {
    view.close();
  }
  res.errors.push(...consoleErrors.filter((m) => !res.errors.some((x) => m.includes(x))));
  return res;
}

if (shotsDir) mkdirSync(shotsDir, { recursive: true });
const results = [];
const queue = [...targets];
await Promise.all(
  Array.from({ length: Math.min(4, queue.length) }, async () => {
    while (queue.length) results.push(await runOne(queue.shift()));
  }),
);
results.sort((a, b) => a.name.localeCompare(b.name));

let ok = 0, det = 0, red = 0;
for (const r of results) {
  const pass = !r.errors.length && !r.structure.length;
  ok += pass;
  det += !r.determinism.length;
  red += !r.reduced.length;
  const flag = pass && !r.determinism.length && !r.reduced.length ? "PASS" : "FAIL";
  console.log(`${flag}  ${r.name}  (stops ${r.stops ?? "?"})`);
  for (const [k, list] of [["error", r.errors], ["structure", r.structure], ["determinism", r.determinism], ["reduced", r.reduced]])
    for (const m of list) console.log(`      ${k}: ${m}`);
}
const n = results.length;
console.log(`\nTEMPLATES ${ok}/${n} ${ok === n ? "PASS" : "FAIL"}`);
console.log(`DETERMINISM ${det}/${n}`);
console.log(`REDUCED ${red}/${n}`);
if (shotsDir) console.log(`SHOTS ${results.reduce((s, r) => s + r.shots.length, 0)} -> ${shotsDir}`);
if (expect != null && n !== expect) console.log(`EXPECTED ${expect} files, found ${n}`);
Bun.WebView.closeAll();
process.exit(ok === n && det === n && red === n && (expect == null || n === expect) ? 0 : 1);
