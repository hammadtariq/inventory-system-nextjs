// Static parser for Playwright spec files: finds test declarations, their case ids
// (tr('C123') annotations), tags and modifiers without running Playwright.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

export const SPEC_FILE = /\.(?:spec|test)\.[cm]?[jt]sx?$/;
const SKIP_DIRS = new Set(["node_modules", ".git", "reports", "test-results", "playwright-report", ".qa-cache"]);

export function findSpecFiles(paths) {
  const out = [];
  const visit = (p) => {
    if (!existsSync(p)) return;
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const name of readdirSync(p)) if (!SKIP_DIRS.has(name)) visit(join(p, name));
    } else if (SPEC_FILE.test(p)) out.push(p);
  };
  for (const p of paths) visit(p);
  return out.sort();
}

const DECL = /\btest(?:\.(only|skip|fixme|fail|slow))?\s*\(\s*(['"`])((?:\\.|(?!\2)[^\\])*)\2/g;

const lineOf = (text, idx) => text.slice(0, idx).split("\n").length;

function idsFrom(options) {
  const ids = new Set();
  for (const m of options.matchAll(/\btr\(\s*([^)]*)\)/g)) {
    for (const q of m[1].matchAll(/['"`]\s*(C?\d+(?:\s*,\s*C?\d+)*)\s*['"`]/gi)) {
      for (const id of q[1].split(",")) ids.add("C" + id.trim().replace(/^C/i, ""));
    }
  }
  for (const m of options.matchAll(/type:\s*['"]test_id['"]\s*,\s*description:\s*['"]([^'"]+)['"]/g)) {
    for (const id of m[1].split(",")) ids.add("C" + id.trim().replace(/^C/i, ""));
  }
  return [...ids];
}

function tagsFrom(options, title) {
  const tags = new Set();
  const m = options.match(/\btag:\s*(\[[^\]]*\]|['"`][^'"`]+['"`])/);
  if (m) for (const t of m[1].matchAll(/@[\w-]+/g)) tags.add(t[0]);
  for (const t of title.matchAll(/(?:^|\s)(@[\w-]+)/g)) tags.add(t[1]);
  return [...tags];
}

export function parseSpec(file) {
  const text = readFileSync(file, "utf8");
  const decls = [];
  DECL.lastIndex = 0;
  let m;
  while ((m = DECL.exec(text)))
    decls.push({ index: m.index, end: m.index + m[0].length, modifier: m[1] || null, title: m[3] });
  return decls.map((d, i) => {
    const next = i + 1 < decls.length ? decls[i + 1].index : text.length;
    const rest = text.slice(d.end, next);
    const arrow = rest.search(/=>|\bfunction\b/);
    const options = arrow === -1 ? "" : rest.slice(0, arrow);
    const body = arrow === -1 ? rest : rest.slice(arrow);
    return {
      file,
      line: lineOf(text, d.index),
      title: d.title,
      modifier: d.modifier,
      caseIds: idsFrom(options),
      tags: tagsFrom(options, d.title),
      fixme: d.modifier === "fixme" || /\btest\.fixme\s*\(/.test(body),
      hasAssertion: /\bexpect(?:\.soft|\.poll)?\s*\(|\bexpect\.\w+\(/.test(body),
      body,
    };
  });
}

export function loadQaConfig() {
  try {
    return JSON.parse(readFileSync(".qa/config.json", "utf8"));
  } catch {
    return {};
  }
}
