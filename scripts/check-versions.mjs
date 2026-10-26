#!/usr/bin/env node
// Fails when the plugin manifests disagree on the version.
// Usage: node scripts/check-versions.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifests = [".claude-plugin/plugin.json", ".codex-plugin/plugin.json", "package.json"];

const versions = manifests.map((file) => [file, JSON.parse(readFileSync(join(root, file), "utf8")).version]);
for (const [file, version] of versions) console.log(`${version ?? "(missing)"}  ${file}`);

if (new Set(versions.map(([, version]) => version)).size !== 1 || versions.some(([, version]) => !version)) {
  console.error("FAIL: manifest versions differ");
  process.exit(1);
}
console.log("PASS");
