#!/usr/bin/env bun
// Checks that pi-compatible harnesses (pi, omo) load the EIDOS skills from this
// checkout as a pi package. No model call: it compares the skill count reported by
// `--print-prompt-sizes` with and without `-e <repo>`. Nothing is installed; `-e`
// loads the package for that one run only.
//
// Usage: bun scripts/pi-smoke.mjs
// Exit codes: 0 pass (or skipped when no harness is on PATH), 1 a check failed.
import { existsSync, readdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const expected = readdirSync(join(root, "skills"), { withFileTypes: true }).filter(
  (entry) => entry.isDirectory() && existsSync(join(root, "skills", entry.name, "SKILL.md")),
).length;

// Agent state dirs whose `--no-session` goal buckets this script may create.
const goalDirs = {
  pi: join(process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent"), "extensions", "goal", "no-session"),
  omo: join(homedir(), ".omo", "agent", "extensions", "goal", "no-session"),
};
const listDir = (dir) => (existsSync(dir) ? new Set(readdirSync(dir)) : new Set());
// The goal dirs this run created, deepest first, so empty ones can be removed afterwards.
const missingDirs = (dir) => {
  const missing = [];
  for (let current = dir; !existsSync(current); current = dirname(current)) missing.push(current);
  return missing;
};

async function skillCount(cli, extraArgs) {
  const proc = Bun.spawn([cli, "--no-session", "--print-prompt-sizes", ...extraArgs], {
    cwd: root,
    env: { ...process.env, PI_OFFLINE: "1" },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) throw new Error(`${cli} exited ${code}: ${stderr.trim()}`);
  const skills = JSON.parse(stdout).sections.find((section) => section.name === "skills");
  return skills?.count ?? 0;
}

const clis = ["pi", "omo"].filter((cli) => Bun.which(cli));
if (clis.length === 0) {
  console.log("SKIP: neither pi nor omo is on PATH");
  process.exit(0);
}

let failed = false;
for (const cli of clis) {
  const goalDir = goalDirs[cli];
  const before = listDir(goalDir);
  const created = missingDirs(goalDir);
  try {
    const base = await skillCount(cli, []);
    const withPackage = await skillCount(cli, ["-e", root]);
    const ok = withPackage - base === expected;
    failed ||= !ok;
    console.log(`${ok ? "PASS" : "FAIL"} ${cli}: skills ${base} -> ${withPackage} (expected +${expected})`);
  } catch (error) {
    failed = true;
    console.log(`FAIL ${cli}: ${error.message}`);
  } finally {
    // Remove only the goal buckets this run created.
    for (const name of listDir(goalDir)) if (!before.has(name)) rmSync(join(goalDir, name), { recursive: true, force: true });
    for (const dir of created) if (existsSync(dir) && readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
  }
}
process.exit(failed ? 1 : 0);
