// Read Playwright JSON reports (reporter: ['json', { outputFile }]) into a flat list of tests.

import { readFileSync, existsSync } from "node:fs";

const ANSI = /\u001b\[[0-9;]*m/g;
export const clean = (s, max = 1200) => {
  const t = String(s || "")
    .replace(ANSI, "")
    .trim();
  return t.length > max ? `${t.slice(0, max)}\n... (${t.length - max} more chars)` : t;
};

export function loadReports(paths) {
  const reports = [];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      reports.push({ path: p, data: JSON.parse(readFileSync(p, "utf8")) });
    } catch (e) {
      console.error(`Skipping ${p}: ${e.message}`);
    }
  }
  return reports;
}

function caseIdsOf(test) {
  const ids = [];
  for (const a of test.annotations || []) {
    if (a.type === "test_id" && a.description) ids.push(...a.description.split(",").map((s) => s.trim()));
  }
  return ids;
}

// Yields one entry per spec x project.
export function flatten(report) {
  const out = [];
  const walk = (suite, path) => {
    // The top-level suite per file is titled with the file path; skip it in titles.
    const here = suite.title && suite.title !== suite.file ? [...path, suite.title] : path;
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const last = (test.results || []).at(-1) || {};
        out.push({
          key: `${spec.file}::${[...here, spec.title].join(" > ")}`,
          title: [...here, spec.title].join(" > "),
          file: spec.file,
          line: spec.line,
          project: test.projectName || test.projectId || "",
          status: test.status, // expected | unexpected | flaky | skipped
          tags: spec.tags || [],
          caseIds: caseIdsOf(test),
          annotations: test.annotations || [],
          attempts: (test.results || []).length,
          last,
        });
      }
    }
    for (const child of suite.suites || []) walk(child, here);
  };
  for (const s of report.suites || []) walk(s, []);
  return out;
}

export function stats(reports) {
  const s = { expected: 0, unexpected: 0, flaky: 0, skipped: 0, duration: 0 };
  for (const { data } of reports) {
    const st = data.stats || {};
    for (const k of Object.keys(s)) s[k] += Number(st[k] || 0);
  }
  return s;
}
