#!/usr/bin/env node
// Check Playwright specs against the agency conventions. Runs in the PR workflow
// and before every generated-test PR. No dependencies.
//   node .qa/scripts/lint-specs.mjs [files or dirs...]   (default: testDir from .qa/config.json, else tests/)
//   --json   machine-readable output
// Exit code 1 when there are errors; warnings never fail the run.

import { readFileSync } from "node:fs";
import { findSpecFiles, parseSpec, loadQaConfig } from "./lib/specs.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const cfg = loadQaConfig();
const targets = args.filter((a) => !a.startsWith("--"));
const files = findSpecFiles(targets.length ? targets : [cfg.testDir || "tests"]);
const SEED = /(^|\/)seed\.spec\.[jt]s$/;

const findings = [];
const add = (level, file, line, rule, message) => findings.push({ level, file, line, rule, message });

const FILE_RULES = [
  ["error", "no-only", /\b(?:test|describe)\.only\s*\(/, "Remove .only before committing"],
  [
    "error",
    "no-hard-wait",
    /\bwaitForTimeout\s*\(/,
    "Use web-first assertions (await expect(...).toBeVisible()) instead of fixed waits",
  ],
  ["error", "no-pause", /\bpage\.pause\s*\(/, "Remove page.pause()"],
  [
    "warn",
    "no-absolute-url",
    /\.goto\(\s*['"`]https?:\/\/(?!localhost|127\.0\.0\.1)/,
    "Use a path relative to baseURL so the test runs against any environment",
  ],
  ["warn", "no-xpath", /\.locator\(\s*['"`](?:\/\/|xpath=)/, "Prefer getByRole / getByLabel / getByText over XPath"],
  [
    "warn",
    "no-css-chain",
    /\.locator\(\s*['"`][.#][\w-]+(?:\s*[> ]\s*[.#\w-]+){2,}/,
    "Long CSS chains break on markup changes; prefer role or test id locators",
  ],
  [
    "warn",
    "use-fixtures",
    /from\s+['"]@playwright\/test['"]/,
    "Import test and expect from the shared fixtures file, not @playwright/test",
  ],
];

const seen = new Map();
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  for (const [level, rule, re, msg] of FILE_RULES) {
    lines.forEach((l, i) => {
      if (re.test(l)) add(level, file, i + 1, rule, msg);
    });
  }
  if (SEED.test(file)) continue;
  for (const t of parseSpec(file)) {
    if (t.caseIds.length === 0) {
      add(
        "error",
        file,
        t.line,
        "test-id",
        `"${t.title}" has no TestRail id. Add { annotation: tr('C123') } so its result reaches TestRail`
      );
    }
    if (!t.hasAssertion && !t.fixme && t.modifier !== "skip") {
      add(
        "warn",
        file,
        t.line,
        "assertion",
        `"${t.title}" has no expect(...). Assert the business outcome, not just that steps ran`
      );
    }
    if (/\bC\d{2,}\b/.test(t.title)) {
      add(
        "warn",
        file,
        t.line,
        "id-in-title",
        `"${t.title}" has a case id in its title; keep it only in the tr() annotation`
      );
    }
    for (const id of t.caseIds) {
      if (!seen.has(id)) seen.set(id, []);
      seen.get(id).push(`${file}:${t.line}`);
    }
  }
}
for (const [id, locs] of seen) {
  if (locs.length > 1)
    add(
      "error",
      locs[0].split(":")[0],
      Number(locs[0].split(":")[1]),
      "duplicate-id",
      `${id} is used by ${locs.length} tests: ${locs.join(", ")}`
    );
}

const errors = findings.filter((f) => f.level === "error").length;
if (json) {
  console.log(JSON.stringify({ files: files.length, errors, warnings: findings.length - errors, findings }, null, 2));
} else {
  for (const f of findings) console.log(`${f.file}:${f.line}  ${f.level.padEnd(5)}  ${f.rule.padEnd(16)} ${f.message}`);
  console.log(`\n${files.length} spec file(s), ${errors} error(s), ${findings.length - errors} warning(s)`);
  if (files.length === 0) console.log('No spec files found. Pass a path, or set "testDir" in .qa/config.json.');
}
process.exit(errors ? 1 : 0);
