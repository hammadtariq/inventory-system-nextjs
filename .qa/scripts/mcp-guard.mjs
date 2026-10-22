#!/usr/bin/env node
// Time limits for MCP tool calls, per tool. Wraps an MCP stdio server (the Playwright test agents' server)
// and answers a call with an error once it has run too long, so a browser agent gets a chance to try
// something else instead of waiting forever. No dependencies.
//
//   .mcp.json: { "command": "node", "args": [".qa/scripts/mcp-guard.mjs", "--", "npx", "playwright", "run-test-mcp-server"] }
//
// Why: the Playwright test MCP server drives a page paused at the end of the seed test. Pausing sets the
// page's default timeout to 0 and the browser tools pass no timeout of their own, so an action on an
// element that never becomes clickable (a hidden 0x0 copy of an option, an element under an overlay)
// waits forever. Claude Code's MCP_TOOL_TIMEOUT is per server, which would also cut off the slow calls
// that are fine (planner_setup_page starting the app, test_run running a spec).
//
// Limits come from .qa/config.json "agents.toolTimeouts" ({ "<tool name or glob>": ms, 0 = no limit });
// the most specific matching pattern wins. Each call is logged to .qa-cache/mcp-guard.log (one JSON line),
// so the main session can see what a background agent is doing and how long it has been waiting, and
// `--watch` turns that log into a watchdog (see the end of this file).

import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";

export const DEFAULT_TIMEOUTS = {
  "browser_*": 45_000,
  "browser_navigate*": 90_000,
  browser_wait_for: 60_000,
  "*_setup_page": 300_000,
  "test_*": 0,
};

const MESSAGES = {
  browser:
    "QA Kit guard: this browser action ran for {s}s without finishing and was abandoned. The element is " +
    "probably hidden, covered or not interactive (component libraries render hidden 0x0 copies of options). " +
    "Don't retry the same ref. Press Escape, take a fresh browser_snapshot, then try another way: type " +
    "the option's text into the field and press Enter, or use a different element. If this step times out " +
    "twice, stop trying it: record it under 'Not explored' in your plan (what you tried, what you saw) and " +
    "move on to the next scenario.",
  setup:
    "QA Kit guard: page setup ran for {s}s without finishing and was abandoned. The app or the seed test " +
    "probably didn't come up (dev server not running or still compiling, wrong BASE_URL, failed login). " +
    "Don't retry: stop and report this so a person can start the app.",
  other: "QA Kit guard: {tool} ran for {s}s without finishing and was abandoned. Don't retry it as it is.",
};

const globToRe = (g) => new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");

// Most specific pattern first: exact names, then longer globs.
export function limitFor(tool, table) {
  const entries = Object.entries(table).sort(([a], [b]) => {
    const wa = a.includes("*") ? 0 : 1;
    const wb = b.includes("*") ? 0 : 1;
    return wb - wa || b.replace(/\*/g, "").length - a.replace(/\*/g, "").length;
  });
  for (const [pattern, ms] of entries) if (globToRe(pattern).test(tool)) return Number(ms) || 0;
  return 0;
}

function loadTimeouts(dir) {
  const p = join(dir, ".qa", "config.json");
  try {
    const cfg = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
    return { ...DEFAULT_TIMEOUTS, ...(cfg.agents?.toolTimeouts || {}) };
  } catch {
    return { ...DEFAULT_TIMEOUTS };
  }
}

function main() {
  const sep = process.argv.indexOf("--");
  const cmd = sep === -1 ? [] : process.argv.slice(sep + 1);
  if (!cmd.length) {
    console.error("usage: mcp-guard.mjs -- <command> [args...]");
    process.exit(2);
  }
  const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const timeouts = loadTimeouts(dir);
  const logPath = join(dir, ".qa-cache", "mcp-guard.log");
  const log = (entry) => {
    try {
      mkdirSync(dirname(logPath), { recursive: true });
      appendFileSync(logPath, JSON.stringify({ t: new Date().toISOString(), ...entry }) + "\n");
    } catch {
      // logging must never break the server
    }
  };

  const child = spawn(cmd[0], cmd.slice(1), {
    stdio: ["pipe", "pipe", "inherit"],
    shell: process.platform === "win32",
  });
  const pending = new Map(); // client request id -> { tool, started, timer }
  const abandoned = new Set();
  const toClient = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
  const toServer = (line) => child.stdin.write(line + "\n");

  createInterface({ input: process.stdin }).on("line", (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return toServer(line);
    }
    if (msg.method === "tools/call" && msg.id !== undefined) {
      const tool = String(msg.params?.name || "");
      const limit = limitFor(tool, timeouts);
      const started = Date.now();
      const entry = { tool, started, timer: null };
      if (limit > 0) {
        entry.timer = setTimeout(() => {
          pending.delete(msg.id);
          abandoned.add(msg.id);
          const s = Math.round(limit / 1000);
          const kind = tool.endsWith("_setup_page") ? "setup" : tool.startsWith("browser_") ? "browser" : "other";
          log({ tool, status: "timeout", ms: limit });
          toClient({
            jsonrpc: "2.0",
            id: msg.id,
            result: {
              content: [{ type: "text", text: MESSAGES[kind].replace("{s}", s).replace("{tool}", tool) }],
              isError: true,
            },
          });
          // Ask the server to stop; the Playwright browser tools may keep waiting regardless.
          toServer(
            JSON.stringify({
              jsonrpc: "2.0",
              method: "notifications/cancelled",
              params: { requestId: msg.id, reason: "timeout" },
            })
          );
        }, limit);
      }
      pending.set(msg.id, entry);
      log({ tool, status: "start", limit });
    }
    toServer(line);
  });

  createInterface({ input: child.stdout }).on("line", (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return process.stdout.write(line + "\n");
    }
    const isResponse = msg.id !== undefined && msg.method === undefined;
    if (isResponse && abandoned.has(msg.id)) {
      abandoned.delete(msg.id);
      log({ id: msg.id, status: "late-response-dropped" });
      return;
    }
    if (isResponse && pending.has(msg.id)) {
      const { tool, started, timer } = pending.get(msg.id);
      clearTimeout(timer);
      pending.delete(msg.id);
      log({ tool, status: msg.result?.isError || msg.error ? "error" : "ok", ms: Date.now() - started });
    }
    process.stdout.write(line + "\n");
  });

  process.stdin.on("end", () => child.stdin.end());
  child.on("exit", (code, signal) => process.exit(signal ? 1 : code ?? 0));
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
}

// Watchdog for a background agent: exits (and so wakes the main session) as soon as the agent looks
// stuck, i.e. a call has been open longer than --stale seconds or nothing has happened for that long.
//   node .qa/scripts/mcp-guard.mjs --watch [--stale=120] [--max=3600]
function watch() {
  const arg = (k, d) => Number((process.argv.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1]) || d;
  const stale = arg("stale", 120) * 1000;
  const max = arg("max", 3600) * 1000;
  const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const logPath = join(dir, ".qa-cache", "mcp-guard.log");
  const began = Date.now();
  const lastLines = () => {
    try {
      return readFileSync(logPath, "utf8")
        .trim()
        .split("\n")
        .slice(-200)
        .map((l) => JSON.parse(l));
    } catch {
      return [];
    }
  };
  const tick = () => {
    const now = Date.now();
    const lines = lastLines().filter((l) => Date.parse(l.t) >= began - 1000);
    const open = new Map();
    for (const l of lines) {
      if (l.status === "start") open.set(l.tool, l);
      else if (l.tool) open.delete(l.tool);
    }
    const oldestOpen = [...open.values()].sort((a, b) => Date.parse(a.t) - Date.parse(b.t))[0];
    const last = lines[lines.length - 1];
    const lastAt = last ? Date.parse(last.t) : began;
    const timeouts = lines.filter((l) => l.status === "timeout").length;
    const say = (why) => {
      console.log(
        `STUCK: ${why}. Timeouts so far: ${timeouts}. Last activity: ${
          last ? `${last.tool || ""} ${last.status} at ${last.t}` : "none"
        }.`
      );
      process.exit(0);
    };
    if (oldestOpen && now - Date.parse(oldestOpen.t) > stale)
      say(`${oldestOpen.tool} has been running for ${Math.round((now - Date.parse(oldestOpen.t)) / 1000)}s`);
    if (now - lastAt > stale) say(`no browser activity for ${Math.round((now - lastAt) / 1000)}s`);
    if (now - began > max) {
      console.log(`DONE WATCHING after ${Math.round(max / 1000)}s; ${timeouts} timeout(s).`);
      process.exit(0);
    }
  };
  setInterval(tick, 5000);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (process.argv.includes("--watch")) watch();
  else main();
}
