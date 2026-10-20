#!/usr/bin/env node
// Daily QA digest, built from data with no LLM call: run results, flaky and fixme
// tests, triage outcome and open gate queues. Posts to Slack when SLACK_WEBHOOK_URL
// is set, otherwise prints.
//   node .qa/scripts/summary.mjs [--print] [results.json ...]
// Optional env: GITHUB_TOKEN + GITHUB_REPOSITORY (gate counts), QA_RUN_TITLE +
// TESTRAIL_URL/USER/API_KEY (link to the TestRail run), GITHUB_RUN_ID (CI link).

import { readFileSync, existsSync } from "node:fs";
import { loadReports, flatten, stats } from "./lib/results.mjs";
import { loadQaConfig } from "./lib/specs.mjs";

const args = process.argv.slice(2);
const printOnly = args.includes("--print");
const paths = args.filter((a) => !a.startsWith("--"));
const cfg = loadQaConfig();
const env = process.env;

const reports = loadReports(paths.length ? paths : ["reports/results.json"]);
const s = stats(reports);
const tests = reports.flatMap((r) => flatten(r.data));
const fixme = tests.filter((t) => t.status === "skipped" && t.annotations.some((a) => a.type === "fixme"));
const flaky = existsSync("reports/flaky.json") ? JSON.parse(readFileSync("reports/flaky.json", "utf8")) : null;
const triage = existsSync("reports/triage.md") ? readFileSync("reports/triage.md", "utf8") : "";

async function gateCounts() {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPOSITORY) return null;
  const labels = {
    "qa:gate-2": "Spec PRs (Gate 2)",
    "qa:heal": "Healer PRs",
    "qa:gate-3": "Escalations (Gate 3)",
    "qa:gate-4": "Bug drafts (Gate 4)",
    "qa:quarantine": "Quarantined",
    "qa:env": "Environment issues",
  };
  const out = [];
  let answered = 0;
  for (const [label, name] of Object.entries(labels)) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${
          env.GITHUB_REPOSITORY
        }/issues?state=open&per_page=100&labels=${encodeURIComponent(label)}`,
        {
          headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
        }
      );
      if (!res.ok) continue;
      answered++;
      const items = await res.json();
      if (!items.length) continue;
      const oldest = Math.max(...items.map((i) => (Date.now() - Date.parse(i.created_at)) / 864e5));
      out.push({
        name,
        count: items.length,
        oldestDays: Math.floor(oldest),
        url: `https://github.com/${env.GITHUB_REPOSITORY}/issues?q=is%3Aopen+label%3A${encodeURIComponent(label)}`,
      });
    } catch {
      /* best effort */
    }
  }
  return answered ? out : null; // null = couldn't check, so say nothing rather than "all clear"
}

async function testrailRunUrl() {
  const title = env.QA_RUN_TITLE;
  const tr = cfg.testrail || {};
  if (!title || !env.TESTRAIL_URL || !env.TESTRAIL_USER || !env.TESTRAIL_API_KEY || !tr.projectId) return null;
  try {
    const auth = Buffer.from(`${env.TESTRAIL_USER}:${env.TESTRAIL_API_KEY}`).toString("base64");
    const res = await fetch(
      `${env.TESTRAIL_URL.replace(/\/+$/, "")}/index.php?/api/v2/get_runs/${tr.projectId}&limit=20`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const runs = Array.isArray(data) ? data : data.runs || [];
    const run = runs.find((r) => r.name === title);
    return run ? run.url : null;
  } catch {
    return null;
  }
}

const total = s.expected + s.unexpected + s.flaky;
const passRate = total ? Math.round(((s.expected + s.flaky) / total) * 1000) / 10 : 0;
const icon = s.unexpected ? ":red_circle:" : s.flaky ? ":large_yellow_circle:" : ":large_green_circle:";
const project = cfg.name || env.GITHUB_REPOSITORY || "QA";

const [gates, trUrl] = await Promise.all([gateCounts(), testrailRunUrl()]);
const ciUrl = env.GITHUB_RUN_ID
  ? `${env.GITHUB_SERVER_URL || "https://github.com"}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
  : null;

const lines = [];
lines.push(`${icon} *${project}: ${env.QA_RUN_TITLE || "test run"}*`);
const took = s.duration >= 60000 ? `${Math.round(s.duration / 60000)} min` : `${Math.round(s.duration / 1000)} s`;
lines.push(
  `${s.expected} passed, ${s.unexpected} failed, ${s.flaky} flaky, ${s.skipped} skipped (${passRate}% pass) in ${took}`
);
const links = [ciUrl && `<${ciUrl}|CI run>`, trUrl && `<${trUrl}|TestRail run>`].filter(Boolean);
if (links.length) lines.push(links.join("  ·  "));
if (triage) {
  const head = triage.split("\n").find((l) => l.startsWith("## "));
  if (head) lines.push(`*Triage:* ${head.replace(/^##\s*/, "")}`);
}
if (flaky && flaky.quarantineCandidates.length) {
  lines.push(
    `*Quarantine candidates:* ${flaky.quarantineCandidates.map((q) => `${q.title} (${q.flakyRuns}x)`).join("; ")}`
  );
} else if (flaky && flaky.flakyToday.length) {
  lines.push(`*Flaky today:* ${flaky.flakyToday.length}`);
}
if (fixme.length)
  lines.push(
    `*Marked fixme (need a human):* ${fixme
      .map((t) => t.title)
      .slice(0, 5)
      .join("; ")}${fixme.length > 5 ? ` and ${fixme.length - 5} more` : ""}`
  );
if (gates && gates.length) {
  lines.push("*Waiting for review:*");
  for (const g of gates)
    lines.push(`  • <${g.url}|${g.name}>: ${g.count}${g.oldestDays >= 2 ? ` (oldest ${g.oldestDays}d)` : ""}`);
} else if (gates) {
  lines.push("Nothing waiting at the review gates.");
}

const text = lines.join("\n");
if (printOnly || !env.SLACK_WEBHOOK_URL) {
  console.log(text);
} else {
  const res = await fetch(env.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, blocks: [{ type: "section", text: { type: "mrkdwn", text } }] }),
  });
  console.log(res.ok ? "Posted digest to Slack." : `Slack returned ${res.status}`);
  console.log(text);
}
