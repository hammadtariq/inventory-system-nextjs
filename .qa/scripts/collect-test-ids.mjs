#!/usr/bin/env node
// List every test with its case ids (TestRail ids, or CSV keys without a tracker), tags and state, for the weekly upkeep.
//   node .qa/scripts/collect-test-ids.mjs [dirs...] > reports/test-ids.json

import { findSpecFiles, parseSpec, loadQaConfig, trackerOf } from "./lib/specs.mjs";

const cfg = loadQaConfig();
const targets = process.argv.slice(2);
const files = findSpecFiles(targets.length ? targets : [cfg.testDir || "tests"]);

const tests = [];
for (const file of files) {
  if (/(^|\/)seed\.spec\.[jt]s$/.test(file)) continue;
  for (const t of parseSpec(file)) {
    tests.push({
      file: t.file,
      line: t.line,
      title: t.title,
      caseIds: t.caseIds,
      tags: t.tags,
      quarantined: t.tags.includes("@quarantine"),
      fixme: t.fixme,
      skipped: t.modifier === "skip",
    });
  }
}

const byId = {};
for (const t of tests) for (const id of t.caseIds) (byId[id] ||= []).push(`${t.file}:${t.line}`);

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      tracker: trackerOf(cfg),
      totals: {
        tests: tests.length,
        withIds: tests.filter((t) => t.caseIds.length).length,
        quarantined: tests.filter((t) => t.quarantined).length,
        fixme: tests.filter((t) => t.fixme).length,
      },
      caseIds: Object.keys(byId).sort((a, b) => a.localeCompare(b, "en", { numeric: true })),
      duplicates: Object.fromEntries(Object.entries(byId).filter(([, l]) => l.length > 1)),
      missingIds: tests.filter((t) => !t.caseIds.length).map((t) => `${t.file}:${t.line} ${t.title}`),
      quarantined: tests
        .filter((t) => t.quarantined)
        .map((t) => ({ file: t.file, line: t.line, title: t.title, caseIds: t.caseIds })),
      fixme: tests
        .filter((t) => t.fixme)
        .map((t) => ({ file: t.file, line: t.line, title: t.title, caseIds: t.caseIds })),
      tests,
    },
    null,
    2
  )
);
