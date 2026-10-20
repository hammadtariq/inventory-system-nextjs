#!/usr/bin/env node
// Compact list of failed and flaky tests for Claude's triage, so it reads a few KB of
// JSON instead of whole traces.
//   node .qa/scripts/failures.mjs [results.json ...]   (default: every reports/**/results.json)

import { readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative, isAbsolute } from "node:path";
import { loadReports, flatten, stats, clean } from "./lib/results.mjs";

function defaultReports(dir = "reports") {
  const found = [];
  const visit = (d) => {
    if (!existsSync(d)) return;
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) {
        if (name !== "artifacts" && name !== "html") visit(p);
      } else if (name === "results.json") found.push(p);
    }
  };
  visit(dir);
  return found;
}

const paths = process.argv.slice(2);
const reports = loadReports(paths.length ? paths : defaultReports());
if (!reports.length) {
  console.error("No Playwright JSON report found. Expected reports/results.json (see playwright.config.ts).");
  process.exit(1);
}

const globalErrors = reports.flatMap((r) => (r.data.errors || []).map((e) => clean(e.message, 600)));

const failures = [];
const flaky = [];
const seen = new Set();
for (const r of reports) {
  // Report paths are absolute on the machine that ran the tests; make them repo-relative so
  // they still resolve after the artifact is downloaded in another CI job.
  const root = r.data.config && r.data.config.configFile ? dirname(r.data.config.configFile) : process.cwd();
  const rel = (p) => (p && isAbsolute(p) ? relative(root, p) : p);
  const pick = (atts, re) => (atts || []).filter((a) => re.test(a.name || "") && a.path).map((a) => rel(a.path));
  for (const t of flatten(r.data)) {
    const id = `${t.key}::${t.project}`;
    if (seen.has(id)) continue; // the same test can appear in two PR reports
    seen.add(id);
    if (t.status === "unexpected") {
      const err = (t.last.errors && t.last.errors[0]) || t.last.error || {};
      failures.push({
        caseIds: t.caseIds,
        title: t.title,
        location: `${t.file}:${t.line}`,
        project: t.project,
        attempts: t.attempts,
        error: clean(err.message),
        errorAt: err.location ? `${rel(err.location.file)}:${err.location.line}` : null,
        errorContext: pick(t.last.attachments, /^error-context$/)[0] || null,
        trace: pick(t.last.attachments, /^trace$/)[0] || null,
        screenshot: pick(t.last.attachments, /^screenshot$/)[0] || null,
      });
    } else if (t.status === "flaky") {
      flaky.push({
        caseIds: t.caseIds,
        title: t.title,
        location: `${t.file}:${t.line}`,
        project: t.project,
        attempts: t.attempts,
      });
    }
  }
}

console.log(
  JSON.stringify(
    { summary: { ...stats(reports), reports: reports.map((r) => r.path) }, globalErrors, failures, flaky },
    null,
    2
  )
);
