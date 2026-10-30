#!/usr/bin/env node
// The --grep for a PR run: @smoke plus the tests of every area whose paths the PR changed (`areas` in
// .qa/config.json). Without `areas`, or when git can't list the changed files, just @smoke (with a warning).
// The nightly still runs everything.
//   node .qa/scripts/areas.mjs --base origin/main     # prints the pattern, e.g. @smoke|@area-(?:purchases)(?![\w-])
//   node .qa/scripts/areas.mjs --files a.ts,b.rb --json

import { execFileSync } from "node:child_process";
import { loadQaConfig } from "./lib/specs.mjs";
import { validatedAreas, touchedAreas, grepFor } from "./lib/areas.mjs";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const done = (result) => {
  if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else console.log(result.grep);
  process.exit(0);
};

let areas;
try {
  areas = validatedAreas(loadQaConfig());
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
// Without areas there's nothing to choose, so don't need git (or the base branch) at all.
if (!Object.keys(areas).length) done({ grep: grepFor([]), touched: [], outside: [], areas: [] });

let files;
if (opt("files") !== undefined) files = opt("files").split(",").filter(Boolean);
else {
  const base = opt("base") || "origin/main";
  try {
    files = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
      .split("\n")
      .filter(Boolean);
  } catch (e) {
    // Smoke tests still run; only the area selection is lost.
    console.error(
      `warning: can't list the changed files against ${base} (${
        String(e.stderr || e.message).split("\n")[0]
      }); running @smoke only. Fetch the base branch (fetch-depth: 0) to run the touched areas too.`
    );
    done({ grep: grepFor([]), touched: [], outside: [], areas: Object.keys(areas), error: "no diff" });
  }
}
const { touched, outside } = touchedAreas(files, areas);
console.error(`Areas touched: ${touched.join(", ") || "none"}; ${outside.length} changed file(s) in no area.`);
done({ grep: grepFor(touched), touched, outside, areas: Object.keys(areas) });
