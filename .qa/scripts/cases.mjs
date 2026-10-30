#!/usr/bin/env node
// Test cases as a CSV file: one row per case, reviewed in any spreadsheet before anything reaches a
// test management tool. The CSV is the source of truth for case design; the plan's scenario section
// and every export are generated from it. No dependencies.
//
//   node .qa/scripts/cases.mjs check <cases.csv> [--tier=low|medium|high] [--push] [--json]
//       Validate rows and report business-risk coverage. --tier sets the case budget (default medium).
//       --push also fails on undecided or Rewrite rows.
//   node .qa/scripts/cases.mjs plan <cases.csv> [plan.md]
//       Regenerate the plan's Test Scenarios section (between cases markers) from the CSV.
//   node .qa/scripts/cases.mjs payload <cases.csv>
//       JSON for /qa-kit:push-cases: rows to create, update and retire, with TestRail-ready text.
//   node .qa/scripts/cases.mjs testrail <cases.csv> [out.csv]
//       Export in TestRail's CSV import layout (one row per step). Other tools: see the kit docs.
//   node .qa/scripts/cases.mjs from-plan <plan.md> [cases.csv] [--prefix=PO] [--legacy] [--force]
//       One-time conversion of an existing Markdown plan into a cases CSV (Given/When/Then unless --legacy).
//       --force overwrites an existing CSV.
//   node .qa/scripts/cases.mjs migrate <cases.csv>
//       Convert preconditions/steps/expected rows into a Given/When/Then scenario. Ids and decisions stay.
//   node .qa/scripts/cases.mjs apply-scores <cases.csv> <scores.json>
//       Write the independent reviewer's scores and the Drop / Merge / Rewrite suggestions they imply.
//   node .qa/scripts/cases.mjs set <cases.csv> <KEY> <column>=<value> [...]
//       Change cells of one row (for example testrail_id=C123 after a push).
//   node .qa/scripts/cases.mjs tracker
//       Print where cases live: "testrail" or "none" (the CSV is the only record; tests use the row key).
//
// A case is a Gherkin scenario in the scenario column (Given/When/Then lines, And/But allowed), written in the
// business's words. Files from before 0.6.0 use preconditions/steps/expected instead; both are read.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { readRecords, writeCsv } from "./lib/csv.mjs";
import { trackerOf } from "./lib/specs.mjs";

const OUTER_PIPES = /^\||\|$/g; // the leading and trailing | of a Markdown table row

export const COLUMNS = [
  "key",
  "testrail_id",
  "section",
  "title",
  "priority",
  "type",
  "level",
  "risks",
  "score",
  "why_it_matters",
  "background",
  "scenario",
  "preconditions",
  "steps",
  "expected",
  "data",
  "notes",
  "known_issue",
  "source",
  "file",
  "suggestion",
  "decision",
  "review_notes",
];
const REQUIRED = ["key", "title", "priority", "decision"];
const PRIORITIES = ["P1", "P2", "P3"];
const TYPES = ["Functional", "Security", "Regression", "Performance", "Usability", "Other"];
// The cheapest test level that can catch the problem. Empty means ui. unit rows are never pushed to TestRail.
const LEVELS = ["ui", "api", "unit"];
const levelOf = (r) => (r.level || "ui").trim().toLowerCase();
const DEFAULT_BUDGET = { low: 6, medium: 12, high: 20 };
const START =
  "<!-- cases:start (generated from the cases CSV by .qa/scripts/cases.mjs; edit the CSV, not this block) -->";
const END = "<!-- cases:end -->";

// ---------------------------------------------------------------- helpers

const fail = (msg) => {
  console.error(msg);
  process.exit(2);
};
const read = (p) => {
  if (!existsSync(p)) fail(`Not found: ${p}`);
  return readFileSync(p, "utf8");
};
const slugOf = (p) => basename(p).replace(/\.(csv|md)$/i, "");

export function loadCases(path) {
  const { columns, records } = readRecords(read(path));
  return { columns, rows: records };
}

function saveCases(path, rows, extraColumns = []) {
  const cols = [...COLUMNS, ...extraColumns.filter((c) => !COLUMNS.includes(c) && c !== "_row")];
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, writeCsv(cols, rows));
}

// "1. do this\n2. then that" -> ["do this", "then that"]. Unnumbered continuation lines join the step above.
export function numbered(text) {
  const items = [];
  const nums = [];
  for (const raw of (text || "").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const m = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (m) {
      nums.push(Number(m[1]));
      items.push(m[2].trim());
    } else if (items.length) items[items.length - 1] += "\n" + line.trim();
    else {
      nums.push(0);
      items.push(line.trim());
    }
  }
  return { items, nums };
}

// Decision / suggestion grammar: blank, Keep, Rewrite, Drop, "Merge into KEY", optional ": reason".
export function parseDecision(v) {
  const t = (v || "").trim();
  if (!t) return { kind: "" };
  const m = t.match(/^(keep|rewrite|drop|merge into\s+([A-Za-z][\w-]*))\b\s*[:\-–]?\s*(.*)$/i);
  if (!m) return { kind: "invalid", raw: t };
  const kind = m[1].toLowerCase().startsWith("merge") ? "merge" : m[1].toLowerCase();
  return { kind, target: m[2] ? m[2].toUpperCase() : null, reason: m[3] || "" };
}

const kindOf = (v) => parseDecision(v).kind;
const RETIRED = ["drop", "merge"]; // decisions that take a case out of the set
const isLive = (r) => !RETIRED.includes(kindOf(r.decision));

// The ranked "What must never go wrong" list from .qa/business-context.md.
export function loadRisks(dir = process.cwd()) {
  const p = join(dir, ".qa", "business-context.md");
  if (!existsSync(p)) return [];
  const text = readFileSync(p, "utf8");
  const sec = text.split(/^## /m).find((s) => /^What must never go wrong/i.test(s));
  if (!sec) return [];
  const out = [];
  for (const m of sec.matchAll(/^(\d+)\.\s+(.*)$/gm)) {
    const bold = m[2].match(/\*\*(.+?)\*\*/);
    const title = (bold ? bold[1] : m[2]).replace(SOURCE_TAG, "").trim().replace(/\.$/, "");
    out.push({ rank: Number(m[1]), title: title.slice(0, 80) });
  }
  return out;
}

// Cases per feature, by the area's risk tier in business-context.md: .qa/config.json cases.budget over the defaults.
export function loadBudget(dir = process.cwd()) {
  const p = join(dir, ".qa", "config.json");
  let own = {};
  try {
    own = JSON.parse(readFileSync(p, "utf8")).cases?.budget ?? {};
  } catch {
    /* no config yet */
  }
  return { ...DEFAULT_BUDGET, ...own };
}

// "3x2" -> impact 3 (what the owner loses) x likelihood 2 (how plausible in real use), each 1-3.
export function parseScore(v) {
  const t = (v || "").trim();
  if (!t) return null;
  const m = t.match(/^([1-3])\s*[x×*]\s*([1-3])$/i);
  if (!m) return { invalid: true };
  return { impact: Number(m[1]), likelihood: Number(m[2]), value: m[1] * m[2] };
}

// "(owner, 2026-10-27)", "(code: src/billing/refund.ts)" or "(assumed)" after a fact in business-context.md.
const SOURCE_TAG = /\s*\((?:owner\b[^)]*|code:[^)]*|assumed)\)\s*$/i;

// .qa/glossary.md: a "| Term | Meaning | Say this, not |" table and a "Names used in examples" list.
// terms holds every word of every term and name, lower-cased; avoid maps a word to the term to use instead.
export function loadGlossary(dir = process.cwd()) {
  const p = join(dir, ".qa", "glossary.md");
  if (!existsSync(p)) return null;
  const terms = new Set();
  const avoid = [];
  const addWords = (t) =>
    t
      .toLowerCase()
      .match(/[a-z][a-z'-]*/g)
      ?.forEach((w) => terms.add(w));
  const placeholder = (t) => /^[A-Z][A-Z0-9_]*$/.test(t.trim()); // TERM, NAME: the template's own rows
  let inNames = false;
  for (const raw of readFileSync(p, "utf8").split("\n")) {
    const line = raw.trim();
    if (/^#/.test(line)) inNames = /names/i.test(line);
    if (line.startsWith("|")) {
      const cells = line
        .replace(OUTER_PIPES, "")
        .split("|")
        .map((c) => c.trim());
      if (/^term$/i.test(cells[0]) || /^[-: ]+$/.test(cells[0]) || placeholder(cells[0])) continue;
      addWords(cells[0]);
      for (const w of (cells[2] || "").split(/[,;]/)) {
        const word = w.trim().replace(/^["'“]|["'”]$/g, "");
        if (word) avoid.push({ word, use: cells[0] });
      }
    } else if (inNames) {
      const m = line.match(/^[-*]\s+\**([^:*]+)/);
      if (m && !placeholder(m[1])) addWords(m[1]);
    }
  }
  return { terms, avoid };
}

// ---------------------------------------------------------------- scenario (Gherkin)

const KEYWORD = /^(given|when|then|and|but)\b\s*(.*)$/i;

// Given/When/Then text -> { lines, given, pairs, errors }. given holds the setup lines (background first);
// each pair is one When block and the Then block after it, which become one TestRail step and its expected
// result. And/But join the block above; a repeated keyword in the same block reads as And.
export function parseScenario(text, background = "") {
  const errors = [];
  const lines = [];
  const addLines = (src, where) =>
    (src || "").split("\n").forEach((raw, i) => {
      const t = raw.trim();
      if (!t) return;
      const m = t.match(KEYWORD);
      if (!m) return errors.push(`${where} line ${i + 1} "${t}" should start with Given, When, Then, And or But`);
      lines.push({ kw: m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(), text: m[2], where });
    });
  addLines(background, "background");
  addLines(text, "scenario");

  const given = [];
  const pairs = [];
  let mode = null;
  if (lines.length && lines[0].kw !== "Given")
    errors.push("a scenario should start with Given (where the case starts)");
  for (const l of lines) {
    const joins = l.kw === "And" || l.kw === "But";
    const kind = joins ? mode : l.kw.toLowerCase();
    if (!kind) continue;
    const kw = joins || kind === mode ? (l.kw === "But" ? "But" : "And") : l.kw;
    l.line = `${kw} ${l.text}`;
    if (kind === "given") {
      if (mode && mode !== "given") errors.push(`"${l.text}" is a Given after a When or Then; put setup first`);
      else given.push(l.line);
    } else if (kind === "when") {
      if (mode === "when") pairs.at(-1).when.push(l.line);
      else pairs.push({ when: [l.line], then: [] });
    } else if (!pairs.length) {
      errors.push(`Then "${l.text}" has no When before it: say what the person does first`);
      continue;
    } else pairs.at(-1).then.push(l.line);
    mode = kind;
  }
  for (const p of pairs)
    if (!p.then.length)
      errors.push(`When "${p.when[0].replace(KEYWORD, "$2")}" has no Then: say what a person sees after it`);
  return { lines, given, pairs, errors };
}

// The case is Gherkin when the scenario cell is filled; otherwise it is a pre-0.6.0 steps/expected row.
const isScenario = (r) => !!(r.scenario || "").trim();

const placeholders = (text) => [...(text || "").matchAll(/<([^<>\n]+)>/g)].map((m) => m[1].trim());
// The app's own text ("Click here to retry") and placeholders aren't the writer's words.
const ownWords = (text) => (text || "").replace(/"[^"\n]*"|“[^”\n]*”|<[^<>\n]+>/g, " ");

const TECHNICAL = [
  ["click", /\bclick(s|ed|ing)?\b/i],
  ["button", /\bbuttons?\b/i],
  ["selector", /\bselectors?\b/i],
  ["endpoint", /\bendpoints?\b/i],
  ["status code", /\bstatus codes?\b/i],
  ["database", /\bdatabases?\b/i],
  ["xpath", /\bxpath\b/i],
  ["css", /\bcss\b/i],
];
const BORDERLINE = [
  ["page", /\bpages?\b/i],
  ["field", /\bfields?\b/i],
  ["screen", /\bscreens?\b/i],
  ["form", /\bforms?\b/i],
  ["dropdown", /\bdropdowns?\b/i],
  ["URL", /\burls?\b/i],
  ["API", /\bapis?\b/i],
];
const VAGUE = /\b(correct|correctly|proper|properly|as expected|works|working|successfully|fine)\b/i;
// What a person can check: a number, a quoted message, a STATUS, a <placeholder> filled from the data table,
// or who can see or do what.
const STATUS = /\b[A-Z]{2,}\b/;
const OBSERVABLE =
  /\d|["“]|<[^<>\n]+>|\b(sees?|seen|shows?|shown|visible|hidden|can|cannot|can't|refused|rejected|blocked|denied|appears?|disappears?|listed|receives?|status|marked|still|no longer|empty|unchanged)\b/i;

const riskList = (v) =>
  (v || "")
    .split(/[;,\s]+/)
    .filter(Boolean)
    .map(Number);

// Data cell: a pipe table without the Markdown dashes. First line is the header.
export function parseData(text) {
  const lines = (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  const split = (l) =>
    l
      .replace(OUTER_PIPES, "")
      .split(" | ")
      .map((c) => c.trim());
  return { header: split(lines[0]), rows: lines.slice(1).map(split) };
}

// ---------------------------------------------------------------- check

// The writing rules for Gherkin cases (the playbook's "Writing the case"). Old steps/expected rows skip them.
function checkScenario(r, glossary, err, warn) {
  const s = parseScenario(r.scenario, r.background);
  s.errors.forEach((m) => err(r, m));

  for (const [field, text] of [
    ["title", r.title],
    ["scenario", `${r.background || ""}\n${r.scenario}`],
  ]) {
    const own = ownWords(text);
    for (const [word, re] of TECHNICAL)
      if (re.test(own))
        err(r, `${field} uses "${word}": say what the person does in business words; UI details go in notes`);
    for (const [word, re] of BORDERLINE)
      if (re.test(own))
        warn(r, `${field} uses "${word}": fine if the owner says it, otherwise name the business thing`);
    for (const a of glossary?.avoid || [])
      if (new RegExp(`\\b${a.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(own))
        warn(r, `${field} uses "${a.word}"; the glossary says "${a.use}"`);
  }

  const words = (r.title || "").split(/\s+/).filter(Boolean).length;
  if (words > 12) warn(r, `title has ${words} words; aim for 12 or fewer`);
  const count = s.lines.filter((l) => l.where === "scenario").length;
  if (count > 7) warn(r, `scenario has ${count} lines; aim for 3-7 (split it, or move shared setup into background)`);
  if (s.pairs.length > 4) err(r, `scenario has ${s.pairs.length} When/Then pairs; a journey has at most 4, split it`);

  // A When without a Then is already an error from parseScenario.
  for (const p of s.pairs.filter((x) => x.then.length)) {
    const then = p.then.join(" ");
    const vague = ownWords(then).match(VAGUE);
    if (vague)
      warn(r, `"${p.then[0]}" says "${vague[1]}": say what a person sees (a number, a status, a quoted message)`);
    else if (!OBSERVABLE.test(then) && !STATUS.test(then.replace(/\b(Then|And|But)\b/g, "")))
      warn(
        r,
        `"${p.then[0]}" should show something a person can see: a number, a status, a quoted message, or who can see what`
      );
  }

  const names = [...new Set(placeholders(`${r.background || ""}\n${r.scenario}`))];
  const table = parseData(r.data);
  if (names.length && !table) err(r, `scenario uses <${names[0]}> but has no data table`);
  else if (names.length) {
    const header = table.header;
    for (const n of names.filter((x) => !header.includes(x)))
      err(r, `scenario uses <${n}>, which isn't a column in data`);
  }

  if (glossary?.terms.size) {
    const unknown = new Set();
    for (const l of s.lines.filter((x) => x.where === "scenario")) {
      for (const m of ownWords(l.text)
        .trim()
        .matchAll(/\b[A-Z][a-z][\w'-]*/g)) {
        if (m.index === 0) continue; // the first word is often just a capitalised sentence start
        const t = m[0];
        const w = t.toLowerCase().replace(/'s$/, "");
        if (!glossary.terms.has(w) && !glossary.terms.has(w.replace(/s$/, ""))) unknown.add(t);
      }
    }
    for (const t of unknown) warn(r, `"${t}" isn't in .qa/glossary.md: use a glossary term, or add it there`);
  }

  if (r.preconditions || r.steps || r.expected)
    warn(r, "preconditions, steps and expected are ignored when scenario is filled; clear them");
}

export function checkCases(
  rows,
  { push = false, risks = loadRisks(), glossary = loadGlossary(), tier = "medium", budget = loadBudget() } = {},
  columns = []
) {
  const errors = [];
  const warnings = [];
  const err = (r, m) => errors.push(r ? `row ${r._row} (${r.key || "no key"}): ${m}` : m);
  const warn = (r, m) => warnings.push(r ? `row ${r._row} (${r.key || "no key"}): ${m}` : m);

  const missingCols = REQUIRED.filter((c) => !columns.includes(c));
  if (!columns.includes("scenario") && !(columns.includes("steps") && columns.includes("expected")))
    missingCols.push("scenario (or steps and expected)");
  if (missingCols.length) err(null, `missing columns: ${missingCols.join(", ")} (expected: ${COLUMNS.join(", ")})`);

  const keys = new Map();
  const ids = new Map();
  for (const r of rows) {
    if (!r.key) err(r, "key is empty");
    else if (!/^[A-Z][A-Z0-9]*-\d+$/.test(r.key)) err(r, `key "${r.key}" should look like PO-01`);
    else if (keys.has(r.key)) err(r, `duplicate key ${r.key} (also row ${keys.get(r.key)})`);
    else keys.set(r.key, r._row);

    if (r.testrail_id) {
      if (!/^C\d+$/.test(r.testrail_id)) err(r, `testrail_id "${r.testrail_id}" should look like C123`);
      else if (ids.has(r.testrail_id))
        err(r, `duplicate testrail_id ${r.testrail_id} (also row ${ids.get(r.testrail_id)})`);
      else ids.set(r.testrail_id, r._row);
    }
    if (!r.title) err(r, "title is empty");
    else if (r.title.length > 250) err(r, `title is ${r.title.length} characters; TestRail allows 250`);
    if (!PRIORITIES.includes(r.priority)) err(r, `priority "${r.priority}" should be P1, P2 or P3`);
    if (r.type && !TYPES.includes(r.type)) warn(r, `type "${r.type}" isn't one of ${TYPES.join(", ")}`);
    if (!LEVELS.includes(levelOf(r))) err(r, `level "${r.level}" should be ui, api or unit (empty means ui)`);
    const sc = parseScore(r.score);
    if (sc?.invalid) err(r, `score "${r.score}" should look like 3x2 (impact x likelihood, each 1-3)`);
    else if (sc && isLive(r) && r.priority === "P1" && sc.impact < 3)
      warn(r, `P1 needs impact 3; scored ${r.score}. Make it P2, or show the bigger loss`);

    if (isScenario(r)) checkScenario(r, glossary, err, warn);
    else if (!r.steps && !r.expected) err(r, "scenario is empty: write the case as Given/When/Then lines");
    else {
      const s = numbered(r.steps);
      const e = numbered(r.expected);
      if (!s.items.length) err(r, "steps is empty");
      if (s.nums.some((n, i) => n !== i + 1)) err(r, "steps should be numbered 1., 2., 3. ... one per line");
      if (e.nums.some((n, i) => n !== i + 1)) err(r, "expected should be numbered 1., 2., 3. ... one per line");
      if (s.items.length && e.items.length !== s.items.length) {
        err(
          r,
          `${s.items.length} steps but ${e.items.length} expected results; give every step its own expected result`
        );
      }
    }
    const table = parseData(r.data);
    if (table) {
      const bad = table.rows.findIndex((x) => x.length !== table.header.length);
      if (!table.rows.length) err(r, "data has a header line but no rows");
      else if (bad >= 0)
        err(
          r,
          `data row ${bad + 1} has ${table.rows[bad].length} cells, header has ${
            table.header.length
          } (separate cells with " | ")`
        );
      if (levelOf(r) === "ui" && table.rows.length > 5)
        warn(
          r,
          `ui case with ${table.rows.length} data rows: check the table at api level, plus one ui case for the message`
        );
    }
    if (isLive(r) && !r.why_it_matters) warn(r, "why_it_matters is empty");

    if (risks.length) {
      const bad = riskList(r.risks).filter((n) => !risks.some((x) => x.rank === n));
      if (bad.length) err(r, `risks ${bad.join(", ")} not in .qa/business-context.md (1-${risks.length})`);
      if (isLive(r) && !riskList(r.risks).length && r.priority === "P1")
        warn(r, "P1 case names no business risk (risks column)");
    }

    const d = parseDecision(r.decision);
    if (d.kind === "invalid") err(r, `decision "${d.raw}" should be Keep, Rewrite, Drop or "Merge into KEY"`);
    if (push && d.kind === "") err(r, 'not reviewed yet: set decision to Keep, Rewrite, Drop or "Merge into KEY"');
    if (push && d.kind === "rewrite") err(r, "marked Rewrite: rewrite the case, then set decision to Keep");
    const sg = parseDecision(r.suggestion);
    if (sg.kind === "invalid") warn(r, `suggestion "${sg.raw}" isn't Keep, Rewrite, Drop or "Merge into KEY"`);
  }
  for (const r of rows) {
    const d = parseDecision(r.decision);
    if (d.kind !== "merge") continue;
    const target = rows.find((x) => x.key === d.target);
    if (!target) err(r, `merges into ${d.target}, which isn't in the file`);
    else if (!isLive(target)) err(r, `merges into ${d.target}, which is itself dropped or merged`);
    else if (target === r) err(r, "merges into itself");
  }

  const live = rows.filter(isLive);
  const coverage = risks.map((x) => ({
    ...x,
    cases: live.filter((r) => riskList(r.risks).includes(x.rank)).map((r) => r.key),
  }));
  for (const c of coverage)
    if (!c.cases.length)
      warnings.push(`risk ${c.rank} "${c.title}" has no case in this file (fine if this feature can't affect it)`);
  if (!budget[tier]) err(null, `tier "${tier}" should be one of ${Object.keys(budget).join(", ")}`);
  const e2e = live.filter((r) => levelOf(r) !== "unit");
  if (budget[tier] && e2e.length > budget[tier]) {
    // Lowest score first; unscored rows after scored ones, P3 before P2 before P1.
    const rank = (r) => [parseScore(r.score)?.value ?? 10, -PRIORITIES.indexOf(r.priority)];
    const lowest = [...e2e]
      .sort((a, b) => rank(a)[0] - rank(b)[0] || rank(a)[1] - rank(b)[1])
      .slice(0, e2e.length - budget[tier])
      .map((r) => (r.score ? `${r.key} (${r.score})` : r.key));
    warnings.push(
      `${e2e.length} live cases; the ${tier} budget is ${budget[tier]}. Lowest scoring: ${lowest.join(
        ", "
      )}. Each case over budget should name a risk the others don't cover.`
    );
  }

  const count = (f) => rows.filter(f).length;
  const kinds = rows.map((r) => kindOf(r.decision));
  const summary = {
    rows: rows.length,
    live: live.length,
    p1: live.filter((r) => r.priority === "P1").length,
    p2: live.filter((r) => r.priority === "P2").length,
    p3: live.filter((r) => r.priority === "P3").length,
    in_testrail: count((r) => r.testrail_id),
    ui: live.filter((r) => levelOf(r) === "ui").length,
    api: live.filter((r) => levelOf(r) === "api").length,
    unit: live.filter((r) => levelOf(r) === "unit").length,
    tier,
    budget: budget[tier] ?? null,
    decided: kinds.filter((k) => k && k !== "invalid").length,
    keep: kinds.filter((k) => k === "keep").length,
    rewrite: kinds.filter((k) => k === "rewrite").length,
    drop: kinds.filter((k) => k === "drop").length,
    merge: kinds.filter((k) => k === "merge").length,
    undecided: kinds.filter((k) => !k).length,
  };
  return { summary, coverage, errors, warnings };
}

// ---------------------------------------------------------------- text for TestRail and the plan

// Preconditions as TestRail stores them: the setup, then the business reason. Known issues, notes, risks
// and the key stay in the repo (CSV, plan, test.fixme reasons), so a push only changes TestRail when the
// case itself changed.
// A scenario's Given lines (background first) are the setup; each When block is a step and its Then block that
// step's expected result, keywords kept so TestRail reads like the CSV.
export function testrailPreconditions(r) {
  const parts = [];
  if (isScenario(r)) {
    const given = parseScenario(r.scenario, r.background).given;
    if (given.length) parts.push(given.join("\n"));
  } else if (r.preconditions) parts.push(r.preconditions);
  if (r.why_it_matters) parts.push(`Why it matters: ${r.why_it_matters}`);
  return parts.join("\n\n");
}

const dataAsText = (r) => {
  const d = parseData(r.data);
  if (!d) return "";
  const line = (cells) => "| " + cells.join(" | ") + " |";
  return "\n\n" + [line(d.header), line(d.header.map(() => "---")), ...d.rows.map(line)].join("\n");
};

export function testrailSteps(r) {
  if (isScenario(r))
    return parseScenario(r.scenario, r.background).pairs.map((p, i) => ({
      content: p.when.join("\n") + (i === 0 ? dataAsText(r) : ""),
      expected: p.then.join("\n"),
    }));
  const s = numbered(r.steps).items;
  const e = numbered(r.expected).items;
  return s.map((content, i) => ({ content: content + (i === 0 ? dataAsText(r) : ""), expected: e[i] || "" }));
}

export function buildPayload(rows) {
  const toCase = (r) => ({
    key: r.key,
    testrail_id: r.testrail_id || null,
    section: r.section || null,
    title: r.title,
    priority: r.priority,
    type: r.type || null,
    preconditions: testrailPreconditions(r),
    steps: testrailSteps(r),
  });
  const kept = rows.filter((r) => kindOf(r.decision) === "keep");
  const keep = kept.filter((r) => levelOf(r) !== "unit");
  const unit = kept.filter((r) => levelOf(r) === "unit");
  return {
    create: keep.filter((r) => !r.testrail_id).map(toCase),
    update: keep.filter((r) => r.testrail_id).map(toCase),
    retire: [
      ...rows
        .filter((r) => r.testrail_id && !isLive(r))
        .map((r) => ({ key: r.key, testrail_id: r.testrail_id, decision: r.decision })),
      // A pushed case moved to unit level leaves TestRail; the developers own it now.
      ...unit
        .filter((r) => r.testrail_id)
        .map((r) => ({
          key: r.key,
          testrail_id: r.testrail_id,
          decision: `${r.decision} (unit level: a developer test now)`,
        })),
    ],
    for_developers: unit.map((r) => ({ key: r.key, title: r.title, why_it_matters: r.why_it_matters || "" })),
    held_back: rows
      .filter((r) => kindOf(r.decision) !== "keep" && isLive(r))
      .map((r) => ({ key: r.key, decision: r.decision || "(not reviewed)" })),
  };
}

// Padded like Prettier formats Markdown tables, so regenerating the plan doesn't fight the formatter.
function mdTable(header, rows) {
  const esc = (c) => c.replace(/\|/g, "\\|");
  const all = [header, ...rows].map((r) => header.map((_, i) => esc(r[i] ?? "")));
  const len = (t) => [...t].length;
  const widths = header.map((_, i) => Math.max(3, ...all.map((r) => len(r[i]))));
  const line = (r) => "| " + r.map((c, i) => c + " ".repeat(widths[i] - len(c))).join(" | ") + " |";
  return [line(all[0]), "| " + widths.map((w) => "-".repeat(w)).join(" | ") + " |", ...all.slice(1).map(line)].join(
    "\n"
  );
}

// Escape "*" (and a "_" right before it) outside code spans, so text like DEMO_EDITOR_* isn't read as
// emphasis; Prettier would rewrite it.
const md = (t) =>
  (t || "")
    .split(/(`[^`]*`)/)
    .map((part, i) => (i % 2 ? part : part.replace(/(?<!\\)\*/g, "\\*").replace(/_(?=\\\*)/g, "\\_")))
    .join("");
const unmd = (t) => (t || "").replace(/\\([*_])/g, "$1");
// Text as written, with the Markdown escapes the plan generator adds removed.
const unescapeFields = (r, extra = []) => {
  for (const k of ["title", "why_it_matters", "data", "notes", "known_issue", "source", "section", ...extra])
    if (r[k]) r[k] = unmd(r[k]);
};

export function renderScenarios(rows) {
  const out = [];
  const sections = [];
  const live = rows.filter(isLive);
  for (const r of live.filter((x) => levelOf(x) !== "unit")) {
    const name = r.section || "Cases";
    let s = sections.find((x) => x.name === name);
    if (!s) sections.push((s = { name, rows: [] }));
    s.rows.push(r);
  }
  // Gherkin lines in a fenced block (no Markdown escaping inside), And/But indented under their keyword.
  const gherkin = (scenario, background) =>
    [
      "```gherkin",
      ...parseScenario(scenario, background).lines.map((l) =>
        /^(And|But) /.test(l.line || "") ? `  ${l.line}` : l.line || `${l.kw} ${l.text}`
      ),
      "```",
    ].join("\n");
  const renderCase = (r, heading, sharedBackground) => {
    out.push(`#### ${heading}${md(r.title)}`, "");
    const meta = [
      `**TestRail:** ${r.testrail_id || "— (not pushed yet)"}`,
      `**Key:** ${r.key}`,
      `**Priority:** ${r.priority}`,
    ];
    if (r.type) meta.push(`**Type:** ${r.type}`);
    if (levelOf(r) !== "ui") meta.push(`**Level:** ${levelOf(r)}`);
    if (levelOf(r) === "unit" && r.section) meta.push(`**Section:** ${md(r.section)}`);
    if (r.risks) meta.push(`**Risks:** ${riskList(r.risks).join(", ")}`);
    if (r.score) meta.push(`**Score:** ${r.score}`);
    if (r.source) meta.push(`**Source:** ${md(r.source)}`);
    if (r.known_issue) meta.push(`**${md(r.known_issue)}**`);
    out.push(meta.join(" · "));
    if (r.file) out.push(`**File:** \`${r.file}\``);
    if (r.why_it_matters) out.push(`**Why it matters:** ${md(r.why_it_matters)}`);
    out.push("");
    if (isScenario(r)) out.push(gherkin(r.scenario, sharedBackground ? "" : r.background));
    else {
      if (r.preconditions) out.push(`**Preconditions:** ${md(r.preconditions)}`, "");
      out.push("**Steps:**", "");
      const s = numbered(r.steps).items;
      const e = numbered(r.expected).items;
      s.forEach((step, i) => {
        out.push(`${i + 1}. ${md(step).replace(/\n/g, "\n   ")}`);
        if (e[i]) out.push(`   - expect: ${md(e[i]).replace(/\n/g, "\n     ")}`);
      });
    }
    const d = parseData(r.data);
    if (d)
      out.push(
        "",
        mdTable(
          d.header.map(md),
          d.rows.map((row) => row.map(md))
        )
      );
    if (r.notes)
      out.push(
        "",
        ...r.notes
          .split("\n")
          .filter((l) => l.trim())
          .map((l) => `- ${md(l.replace(/^[-*]\s*/, ""))}`)
      );
    out.push("");
  };
  sections.forEach((sec, si) => {
    out.push(`### ${si + 1}. ${md(sec.name)}`, "");
    const bg = sec.rows[0].background || "";
    const shared = bg && sec.rows.every((r) => (r.background || "") === bg);
    if (shared) out.push("**Background:**", "", gherkin(bg), "");
    sec.rows.forEach((r, ci) => renderCase(r, `${si + 1}.${ci + 1}. `, shared));
  });
  // unit rows aren't pushed to TestRail or automated as E2E; they're handed to the developers.
  const unit = live.filter((r) => levelOf(r) === "unit");
  if (unit.length) {
    out.push("### For developers", "", "Checks best placed in unit tests. Not pushed to TestRail.", "");
    unit.forEach((r) => renderCase(r, "", false));
  }
  return out.join("\n").trimEnd() + "\n";
}

export function writePlan(planPath, rows, csvPath) {
  const block = `${START}\n\n${renderScenarios(rows)}\n${END}`;
  let text = existsSync(planPath)
    ? readFileSync(planPath, "utf8")
    : `# ${slugOf(csvPath)} test plan\n\n## Test Scenarios\n\n`;
  if (text.includes(START.slice(0, 20)) && text.includes(END)) {
    const a = text.indexOf("<!-- cases:start");
    const b = text.indexOf(END) + END.length;
    text = text.slice(0, a) + block + text.slice(b);
  } else {
    // First run: replace the scenario headings under "## Test Scenarios", keep the intro lines above them.
    const m = text.match(/^## Test Scenarios[^\n]*\n/m);
    if (!m) text = text.trimEnd() + `\n\n## Test Scenarios\n\n${block}\n`;
    else {
      const start = m.index + m[0].length;
      const rest = text.slice(start);
      const next = rest.search(/^## /m);
      const body = next === -1 ? rest : rest.slice(0, next);
      const intro = body.slice(0, Math.max(0, body.search(/^### /m))).trimEnd();
      const tail = next === -1 ? "" : rest.slice(next);
      text = text.slice(0, start) + (intro ? `\n${intro.trim()}\n\n` : "\n") + block + "\n\n" + tail;
    }
  }
  mkdirSync(dirname(planPath), { recursive: true });
  writeFileSync(planPath, text.replace(/\n{3,}/g, "\n\n"));
}

// ---------------------------------------------------------------- from-plan

export function planToRows(md, prefix) {
  const afterHeading = md.split(/^## Test Scenarios.*$/m);
  const body = (afterHeading.length > 1 ? afterHeading[1] : md).split(/^## /m)[0];
  const rows = [];
  let section = "";
  let background = "";
  let bgLines = null;
  let buf = null;
  const flush = () => {
    if (buf) rows.push({ ...caseFromBlock(buf.join("\n"), section), ...(background ? { background } : {}) });
    buf = null;
  };
  for (const line of body.split("\n")) {
    if (/^<!-- cases:/.test(line.trim())) continue;
    if (bgLines) {
      // A section's shared Background block, before its first case.
      if (/^```/.test(line.trim())) (background = bgLines.join("\n")), (bgLines = null);
      else if (line.trim()) bgLines.push(line.trim());
    } else if (/^####\s/.test(line)) {
      flush();
      buf = [line];
    } else if (/^###\s/.test(line)) {
      flush();
      section = line.replace(/^###\s+(?:\d+\.\s+)?/, "").trim();
      background = "";
    } else if (buf) buf.push(line);
    else if (/^```gherkin/.test(line.trim())) bgLines = [];
  }
  flush();
  return rows.map((r, i) => ({ ...r, key: r.key || `${prefix}-${String(i + 1).padStart(2, "0")}` }));
}

function caseFromBlock(text, section) {
  const lines = text.split("\n");
  const r = { section, title: lines[0].replace(/^####\s+(?:[\d.]+\s+)?/, "").trim(), suggestion: "Keep", decision: "" };
  const pre = lines.find((l) => /^\*\*Preconditions:\*\*/.test(l.trim()));
  if (pre) r.preconditions = pre.trim().replace(/^\*\*Preconditions:\*\*\s*/, "");
  const metaText = lines
    .filter((l) => /^\*\*[^*]+\*\*/.test(l.trim()) && !/^\*\*(Steps|Preconditions):\*\*/.test(l.trim()))
    .join(" · ");
  const source = [];
  for (const seg of metaText.split(/\s+·\s+/)) {
    const m = seg.trim().match(/^\*\*([^*:]+):\*\*\s*(.*)$/);
    if (m) {
      const [k, v] = [m[1].trim().toLowerCase(), m[2].trim()];
      if (k === "testrail") r.testrail_id = (v.match(/C\d+/) || [""])[0];
      else if (k === "priority") r.priority = v;
      else if (k === "type") r.type = v;
      else if (k === "file") r.file = v.replace(/`/g, "");
      else if (k === "why it matters") r.why_it_matters = v;
      else if (k === "key") r.key = v;
      else if (k === "risks") r.risks = v.replace(/\s*,\s*/g, ";");
      else if (k === "level") r.level = v;
      else if (k === "score") r.score = v;
      else if (k === "section") r.section = v;
      else if (k === "source") source.push(v);
      else source.push(`${m[1].trim()} ${v}`);
    } else {
      const flag = seg.trim().match(/^\*\*(.+)\*\*$/);
      if (flag) r.known_issue = flag[1].trim();
    }
  }
  r.source = source.join("; ");

  // A Gherkin case: the fenced block is the scenario; the data table and notes follow it.
  const fence = lines.findIndex((l) => /^```gherkin/.test(l.trim()));
  if (fence !== -1) {
    const close = lines.findIndex((l, i) => i > fence && /^```/.test(l.trim()));
    const end = close === -1 ? lines.length : close;
    r.scenario = lines
      .slice(fence + 1, end)
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n");
    const table = [];
    const notes = [];
    for (const l of lines.slice(end + 1)) {
      const t = l.trim();
      if (t.startsWith("|")) {
        if (!/^\|[\s|:-]+\|$/.test(t)) table.push(tableRow(t));
      } else if (/^[-*]\s+/.test(t)) notes.push(t.replace(/^[-*]\s+/, ""));
    }
    if (table.length) r.data = table.join("\n");
    if (notes.length) r.notes = notes.join("\n");
    unescapeFields(r);
    return r;
  }

  const stepsAt = lines.findIndex((l) => /^\*\*Steps:\*\*/.test(l.trim()));
  const after = stepsAt === -1 ? [] : lines.slice(stepsAt + 1);
  const intro = stepsAt === -1 ? "" : lines[stepsAt].replace(/^\*\*Steps:\*\*\s*/, "").trim();
  const steps = [];
  const expected = [];
  const notes = [];
  const table = [];
  let eachRow = "";
  let cur = null;
  for (const raw of after) {
    const l = raw.trimEnd();
    const t = l.trim();
    if (!t) continue;
    const step = l.match(/^(\d+)\.\s+(.*)$/);
    const exp = t.match(/^-\s*expect:\s*(.*)$/i);
    const expEach = t.match(/^-\s*expect \(each row\):\s*(.*)$/i);
    if (step) {
      cur = steps.push(step[2].trim()) - 1;
      expected[cur] = "";
    } else if (exp && cur !== null) expected[cur] = (expected[cur] ? expected[cur] + "; " : "") + exp[1].trim();
    else if (expEach) eachRow = expEach[1].trim();
    else if (t.startsWith("|")) {
      if (!/^\|[\s|:-]+\|$/.test(t)) table.push(tableRow(t));
    } else if (/^[-*]\s+/.test(t)) notes.push(t.replace(/^[-*]\s+/, ""));
    else if (cur !== null) steps[cur] += " " + t;
    else notes.push(t);
  }
  if (steps.length) {
    if (intro) r.preconditions = r.preconditions ? `${r.preconditions}\n${intro}` : intro;
    if (eachRow) notes.unshift(`Each row: ${eachRow}`);
  } else {
    steps.push(intro || "Run the case as described.");
    expected.push(eachRow || (table.length ? "Each row gives its expected result." : ""));
  }
  r.steps = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  r.expected = expected.map((s, i) => `${i + 1}. ${s}`).join("\n");
  if (table.length) r.data = table.join("\n");
  if (notes.length) r.notes = notes.join("\n");
  unescapeFields(r, ["preconditions", "steps", "expected"]);
  return r;
}

// "| a | b\| c |" -> "a | b/c" (the CSV's data-cell layout).
const tableRow = (t) =>
  t
    .replace(OUTER_PIPES, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, "/"))
    .join(" | ");

// ---------------------------------------------------------------- apply-scores

// Scores from the independent reviewer (plan-feature step 5): [{ key, impact, likelihood, unique, duplicate_of,
// observable, owner_asked, reason }]. Writes the score column and, for rows that fail the rubric, a suggestion.
// The decision column stays the reviewer's. The first failing rule wins: duplicate, then impact 1 (cosmetic, kept
// only when the business context shows the owner asked for it), then low value, then unobservable, then a P1
// without impact 3.
export function applyScores(rows, scores) {
  const errors = [];
  const warnings = [];
  const changes = [];
  const out = rows.map((r) => ({ ...r }));
  const byKey = new Map(out.map((r) => [r.key, r]));
  for (const s of scores) {
    const r = byKey.get(s.key);
    if (!r) {
      errors.push(`${s.key} isn't in the file`);
      continue;
    }
    if (![1, 2, 3].includes(s.impact) || ![1, 2, 3].includes(s.likelihood)) {
      errors.push(`${s.key}: impact and likelihood must be 1, 2 or 3`);
      continue;
    }
    const target = s.duplicate_of && byKey.get(String(s.duplicate_of).toUpperCase());
    if (s.unique === false && (!target || target === r))
      errors.push(`${s.key}: duplicate_of "${s.duplicate_of || ""}" must be another key in the file`);
    const score = `${s.impact}x${s.likelihood}`;
    const why = s.reason ? `; ${s.reason}` : "";
    let suggestion = null;
    if (s.unique === false && target && target !== r)
      suggestion = `Merge into ${target.key}${s.reason ? `: ${s.reason}` : ""}`;
    else if (s.impact === 1 && s.owner_asked !== true) suggestion = `Drop: impact 1 (cosmetic or convenience)${why}`;
    else if (s.impact * s.likelihood < 3) suggestion = `Drop: score ${score} under 3${why}`;
    else if (s.observable === false) suggestion = `Rewrite: not observable${why}`;
    else if (r.priority === "P1" && s.impact < 3)
      suggestion = `Rewrite: P1 needs impact 3, scored ${score}; make it P2 or show the bigger loss`;
    r.score = score;
    // The P1 rule explains itself; the others need the reviewer's words for the owner.
    if (suggestion && !s.reason && !suggestion.startsWith("Rewrite: P1"))
      warnings.push(`${s.key}: "${suggestion}" has no reason; ask the reviewer for one or add it to review_notes`);
    if (suggestion) {
      r.suggestion = suggestion;
      changes.push({ key: r.key, score, suggestion });
    } else if (!r.suggestion) r.suggestion = "Keep";
  }
  return { rows: out, changes, errors, warnings };
}

// ---------------------------------------------------------------- migrate

const MIGRATED = "Rewrite: converted to Given/When/Then, check the wording";

// preconditions -> Given lines, each step -> When, its expected result -> Then. "; " separates lines in
// preconditions and expected results, so "APPROVED; stock + 5" becomes a Then and an And.
export function toScenario(r) {
  const out = [];
  const block = (kw, text) =>
    text
      .split(/\n|;\s+/)
      .map((t) => t.trim().replace(KEYWORD, "$2"))
      .filter(Boolean)
      .forEach((t, i) => out.push(`${i ? "And" : kw} ${t}`));
  block("Given", r.preconditions || "");
  const e = numbered(r.expected).items;
  numbered(r.steps).items.forEach((step, i) => {
    block("When", step);
    block("Then", e[i] || "");
  });
  return out.join("\n");
}

// Rows without a scenario get one built from their steps; ids, decisions and every other column stay.
export function migrateRows(rows) {
  const converted = [];
  const out = rows.map((r) => {
    if (isScenario(r) || !(r.steps || "").trim()) return r;
    converted.push(r.key);
    return { ...r, scenario: toScenario(r), preconditions: "", steps: "", expected: "", suggestion: MIGRATED };
  });
  return { rows: out, converted };
}

// ---------------------------------------------------------------- testrail export

function testrailCsv(rows) {
  const cols = ["ID", "Key", "Section", "Title", "Priority", "Type", "Preconditions", "Step", "Expected Result"];
  const out = [];
  for (const r of rows.filter((x) => kindOf(x.decision) === "keep" && levelOf(x) !== "unit")) {
    testrailSteps(r).forEach((s, i) => {
      out.push(
        i === 0
          ? {
              ID: r.testrail_id,
              Key: r.key,
              Section: r.section,
              Title: r.title,
              Priority: r.priority,
              Type: r.type,
              Preconditions: testrailPreconditions(r),
              Step: s.content,
              "Expected Result": s.expected,
            }
          : { Step: s.content, "Expected Result": s.expected }
      );
    });
  }
  return writeCsv(cols, out);
}

// ---------------------------------------------------------------- cli

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flags = Object.fromEntries(
    rest
      .filter((a) => a.startsWith("--"))
      .map((a) => {
        const [k, v] = a.slice(2).split("=");
        return [k, v ?? true];
      })
  );
  const args = rest.filter((a) => !a.startsWith("--"));

  if (cmd === "check") {
    if (!args[0]) fail("Usage: cases.mjs check <cases.csv> [--tier=low|medium|high] [--push] [--json]");
    const { columns, rows } = loadCases(args[0]);
    const res = checkCases(rows, { push: !!flags.push, ...(flags.tier ? { tier: String(flags.tier) } : {}) }, columns);
    if (flags.json) console.log(JSON.stringify(res, null, 2));
    else {
      const s = res.summary;
      console.log(
        `${args[0]}: ${s.rows} rows, ${s.live} live (P1 ${s.p1}, P2 ${s.p2}, P3 ${s.p3}), ${s.in_testrail} in TestRail`
      );
      console.log(
        `Review: ${s.keep} keep, ${s.rewrite} rewrite, ${s.merge} merge, ${s.drop} drop, ${s.undecided} not reviewed`
      );
      console.log(`Levels: ${s.ui} ui, ${s.api} api, ${s.unit} unit; ${s.tier} budget ${s.budget ?? "?"} (ui + api)`);
      if (res.coverage.length) {
        console.log("\nBusiness risk coverage (.qa/business-context.md):");
        for (const c of res.coverage)
          console.log(`  ${c.rank}. ${c.title}: ${c.cases.length ? c.cases.join(", ") : "no case"}`);
      }
      for (const w of res.warnings) console.log(`warn   ${w}`);
      for (const e of res.errors) console.log(`error  ${e}`);
      console.log(`\n${res.errors.length} error(s), ${res.warnings.length} warning(s)`);
    }
    process.exit(res.errors.length ? 1 : 0);
  }

  if (cmd === "plan") {
    if (!args[0]) fail("Usage: cases.mjs plan <cases.csv> [plan.md]");
    const plan = args[1] || join("specs", `${slugOf(args[0])}.md`);
    const { columns, rows } = loadCases(args[0]);
    const res = checkCases(rows, {}, columns);
    if (res.errors.length)
      fail(`Fix the CSV first (node .qa/scripts/cases.mjs check ${args[0]}):\n${res.errors.join("\n")}`);
    writePlan(plan, rows, args[0]);
    console.log(`Wrote ${rows.filter(isLive).length} cases to ${plan}`);
    return;
  }

  if (cmd === "payload") {
    if (!args[0]) fail("Usage: cases.mjs payload <cases.csv>");
    const { columns, rows } = loadCases(args[0]);
    const res = checkCases(rows, { push: true }, columns);
    console.log(JSON.stringify({ ok: !res.errors.length, errors: res.errors, ...buildPayload(rows) }, null, 2));
    process.exit(res.errors.length ? 1 : 0);
  }

  if (cmd === "testrail") {
    if (!args[0]) fail("Usage: cases.mjs testrail <cases.csv> [out.csv]");
    const out = args[1] || join("reports", `${slugOf(args[0])}-testrail.csv`);
    const { rows } = loadCases(args[0]);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, testrailCsv(rows));
    console.log(`Wrote ${out} (Keep rows only, one row per step)`);
    return;
  }

  if (cmd === "from-plan") {
    if (!args[0]) fail("Usage: cases.mjs from-plan <plan.md> [cases.csv] [--prefix=PO] [--legacy] [--force]");
    const out = args[1] || join("specs", "cases", `${slugOf(args[0])}.csv`);
    if (existsSync(out) && !flags.force) fail(`${out} exists; pass --force to overwrite`);
    const prefix = String(
      flags.prefix ||
        slugOf(args[0])
          .split("-")
          .map((w) => w[0])
          .join("")
          .toUpperCase() ||
        "TC"
    );
    const parsed = planToRows(read(args[0]), prefix);
    const rows = flags.legacy ? parsed : migrateRows(parsed).rows;
    saveCases(out, rows);
    console.log(
      `Wrote ${rows.length} cases to ${out}. Fill risks and type, then run: node .qa/scripts/cases.mjs check ${out}`
    );
    return;
  }

  if (cmd === "apply-scores") {
    if (!args[0] || !args[1]) fail("Usage: cases.mjs apply-scores <cases.csv> <scores.json>");
    const { columns, rows } = loadCases(args[0]);
    let scores;
    try {
      scores = JSON.parse(read(args[1]));
    } catch (e) {
      fail(`${args[1]} isn't valid JSON: ${e.message}`);
    }
    if (!Array.isArray(scores)) scores = scores.scores;
    if (!Array.isArray(scores))
      fail(`${args[1]} should be a JSON array of { key, impact, likelihood, unique, observable }`);
    const res = applyScores(rows, scores);
    if (res.errors.length) fail(`Nothing written:\n${res.errors.join("\n")}`);
    saveCases(args[0], res.rows, columns);
    console.log(`Scored ${scores.length} rows; ${res.changes.length} suggestions changed:`);
    for (const c of res.changes) console.log(`  ${c.key} ${c.score}: ${c.suggestion}`);
    for (const w of res.warnings) console.log(`warn   ${w}`);
    return;
  }

  if (cmd === "migrate") {
    if (!args[0]) fail("Usage: cases.mjs migrate <cases.csv>");
    const { columns, rows } = loadCases(args[0]);
    const res = migrateRows(rows);
    if (!res.converted.length) return console.log(`${args[0]}: every row already has a scenario`);
    saveCases(args[0], res.rows, columns);
    const noGiven = res.rows.filter((r) => res.converted.includes(r.key) && !/^Given /.test(r.scenario));
    console.log(`Converted ${res.converted.length} rows to Given/When/Then: ${res.converted.join(", ")}`);
    console.log(`Their suggestion is "${MIGRATED}"; decision and testrail_id are unchanged.`);
    if (noGiven.length)
      console.log(`Had no preconditions, so they need a Given line: ${noGiven.map((r) => r.key).join(", ")}`);
    console.log(`Next: reword them in business terms, then run node .qa/scripts/cases.mjs check ${args[0]}`);
    return;
  }

  if (cmd === "tracker") {
    console.log(trackerOf());
    return;
  }

  if (cmd === "set") {
    const [path, key, ...pairs] = args;
    if (!path || !key || !pairs.length) fail("Usage: cases.mjs set <cases.csv> <KEY> <column>=<value> [...]");
    const { columns, rows } = loadCases(path);
    const r = rows.find((x) => x.key === key);
    if (!r) fail(`No row with key ${key}`);
    for (const p of pairs) {
      const i = p.indexOf("=");
      const col = p.slice(0, i).toLowerCase();
      if (!COLUMNS.includes(col) && !columns.includes(col)) fail(`Unknown column ${col}`);
      r[col] = p.slice(i + 1);
    }
    saveCases(path, rows, columns);
    console.log(`Updated ${key}`);
    return;
  }

  fail(
    "Commands: check, plan, payload, testrail, from-plan, migrate, apply-scores, set, tracker. See the header of this file."
  );
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
