#!/usr/bin/env node
// Keep a rolling 7-day history of flaky tests (passed only on retry) and list the
// ones that crossed the quarantine threshold. The nightly workflow persists the
// history file between runs with actions/cache.
//   node .qa/scripts/flaky-history.mjs <results.json> <history.json> <out.json>
// Writes `quarantine=true|false` to $GITHUB_OUTPUT when it is set.

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadReports, flatten } from "./lib/results.mjs";
import { loadQaConfig } from "./lib/specs.mjs";

const [
  resultsPath = "reports/results.json",
  historyPath = ".qa-cache/flaky-history.json",
  outPath = "reports/flaky.json",
] = process.argv.slice(2);
const cfg = loadQaConfig();
const threshold = Number((cfg.triage && cfg.triage.quarantineAfter) || 3);
const windowDays = Number((cfg.triage && cfg.triage.flakyWindowDays) || 7);

const reports = loadReports([resultsPath]);
const tests = reports.flatMap((r) => flatten(r.data));
const flakyToday = tests
  .filter((t) => t.status === "flaky" && !t.tags.includes("@quarantine"))
  .map((t) => ({
    key: t.key,
    title: t.title,
    location: `${t.file}:${t.line}`,
    project: t.project,
    caseIds: t.caseIds,
  }));

let history = { runs: [] };
if (existsSync(historyPath)) {
  try {
    history = JSON.parse(readFileSync(historyPath, "utf8"));
  } catch {
    /* start over */
  }
}
const now = Date.now();
history.runs = (history.runs || []).filter((r) => now - Date.parse(r.at) < windowDays * 864e5);
history.runs.push({
  at: new Date(now).toISOString(),
  runId: process.env.GITHUB_RUN_ID || null,
  flaky: [...new Set(flakyToday.map((f) => f.key))],
});

const counts = new Map();
for (const r of history.runs) for (const k of r.flaky) counts.set(k, (counts.get(k) || 0) + 1);
const byKey = new Map(flakyToday.map((f) => [f.key, f]));
const quarantineCandidates = [...counts.entries()]
  .filter(([k, n]) => n >= threshold && byKey.has(k))
  .map(([k, n]) => ({ ...byKey.get(k), flakyRuns: n, windowDays }));

mkdirSync(dirname(historyPath), { recursive: true });
writeFileSync(historyPath, JSON.stringify(history, null, 2));
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify(
    {
      at: new Date(now).toISOString(),
      threshold,
      windowDays,
      runsInWindow: history.runs.length,
      flakyToday,
      quarantineCandidates,
    },
    null,
    2
  )
);

if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT, `quarantine=${quarantineCandidates.length > 0}\n`);
console.log(
  `Flaky today: ${flakyToday.length}. Quarantine candidates (${threshold}+ in ${windowDays} days): ${quarantineCandidates.length}.`
);
