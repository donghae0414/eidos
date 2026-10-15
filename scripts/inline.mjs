#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/inline.mjs <input.html> <output.html>");
  process.exit(2);
}

const base = dirname(resolve(input));
const local = (p) => !/^(https?:)?\/\//.test(p) && !p.startsWith("data:");
const load = (p) => readFileSync(isAbsolute(p) ? p : resolve(base, p), "utf8");
let html = readFileSync(input, "utf8");
let count = 0;

html = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/g, (tag) => {
  const href = /href=["']([^"']+)["']/.exec(tag)?.[1];
  if (!href || !local(href)) return tag;
  count++;
  return `<style>\n${load(href)}\n</style>`;
});
html = html.replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/g, (tag, a, src, b) => {
  if (!local(src)) return tag;
  count++;
  return `<script${a}${b}>\n${load(src).replace(/<\/script/gi, "<\\/script")}\n</script>`;
});

const remote = [...html.matchAll(/<(?:script|link|img)\b[^>]*(?:src|href)=["'](https?:)?\/\/[^"']+["']/g)].map((m) => m[0]);
writeFileSync(output, html);
console.log(`INLINED ${count} file(s) -> ${output}`);
if (remote.length) {
  console.error(`REMOTE REFERENCES (not self-contained):\n${remote.join("\n")}`);
  process.exit(1);
}
