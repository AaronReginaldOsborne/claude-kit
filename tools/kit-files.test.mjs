// Tests for kit-files.mjs. Run from the repo root: node --test tools/kit-files.test.mjs
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const helper = path.join(here, "kit-files.mjs");
const source = path.join(here, "..", "files", "CLAUDE.md");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-files-"));
after(() => fs.rmSync(dir, { recursive: true, force: true }));

function run(...args) {
  try {
    const out = execFileSync(process.execPath, [helper, ...args], { encoding: "utf8" });
    return { code: 0, ...JSON.parse(out) };
  } catch (e) {
    return { code: e.status, ...JSON.parse(e.stdout) };
  }
}
const file = (name, content) => {
  const p = path.join(dir, name);
  if (content !== undefined) fs.writeFileSync(p, content);
  return p;
};

test("missing file: created, then a second add is refused", () => {
  const t = file("missing.md");
  assert.equal(run("rules-status", t, source).state, "missing");
  assert.equal(run("rules-add", t, source).done, "created");
  const s = run("rules-status", t, source);
  assert.equal(s.state, "current");
  assert.equal(s.headingCount, 1);
  assert.equal(run("rules-add", t, source).code, 2);
});

test("existing LF file without final newline: original bytes kept, remove restores them", () => {
  const orig = "# Mine\n\nmy rule — keep";
  const t = file("lf.md", orig);
  assert.equal(run("rules-add", t, source).done, "appended");
  assert.ok(fs.readFileSync(t, "utf8").startsWith(orig + "\n\n<!-- claude-kit rules: start"));
  assert.equal(run("rules-remove", t).done, "removed");
  assert.equal(fs.readFileSync(t, "utf8"), orig + "\n");
});

test("CRLF file with BOM: block uses CRLF, remove restores exact bytes", () => {
  const orig = Buffer.from("\uFEFF# Win\r\nline\r\n", "utf8");
  const t = file("crlf.md", orig);
  run("rules-add", t, source);
  const text = fs.readFileSync(t, "utf8");
  assert.equal((text.match(/\r\n/g) || []).length, (text.match(/\n/g) || []).length);
  assert.equal(run("rules-status", t, source).state, "current");
  run("rules-remove", t);
  assert.ok(fs.readFileSync(t).equals(orig));
});

test("rules already present without markers: unmarked, add and remove refused", () => {
  const t = file("unmarked.md", "# x\n" + fs.readFileSync(source, "utf8"));
  const s = run("rules-status", t, source);
  assert.equal(s.state, "unmarked");
  assert.equal(s.headingCount, 1);
  assert.equal(run("rules-add", t, source).code, 2);
  assert.equal(run("rules-remove", t).code, 2);
});

test("outdated block: update replaces only the block", () => {
  const t = file("outdated.md", "# head\n");
  run("rules-add", t, source);
  fs.writeFileSync(t, fs.readFileSync(t, "utf8").replace("Keep work deliberate", "Keep work VERY deliberate") + "after\n");
  assert.equal(run("rules-status", t, source).state, "outdated");
  assert.equal(run("rules-update", t, source).done, "updated");
  const text = fs.readFileSync(t, "utf8");
  assert.equal(run("rules-status", t, source).state, "current");
  assert.ok(text.startsWith("# head\n\n"));
  assert.ok(text.endsWith("<!-- claude-kit rules: end -->\nafter\n"));
});

test("UTF-16 and broken files are refused", () => {
  const u = file("utf16.md", Buffer.from([0xff, 0xfe, 0x23, 0x00]));
  assert.equal(run("rules-status", u, source).state, "unsupported-encoding");
  assert.equal(run("rules-add", u, source).code, 2);
  const b = file("broken.md", "x\n<!-- claude-kit rules: end -->\n");
  assert.equal(run("rules-status", b, source).state, "broken");
});

test("same compares bytes", () => {
  assert.equal(run("same", source, source).result, "same");
  assert.equal(run("same", source, file("other.md", "x")).result, "different");
  assert.equal(run("same", source, path.join(dir, "nope.md")).result, "missing");
});

// ---- snapshot / compare / keys ----

function folder(name) {
  const p = path.join(dir, name);
  fs.mkdirSync(p, { recursive: true });
  return p;
}
function put(root, rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  const later = new Date(Date.now() + 5000);
  fs.utimesSync(p, later, later); // a clearly newer time, even on coarse file systems
  return p;
}
const flaggedPaths = (res, root) => res.folders.find((f) => f.folder === root).flagged.map((x) => x.path);

test("session folder: every new or changed path under .claude/ is flagged, with key names only", () => {
  const home = folder("h1");
  const proj = folder("p1");
  const userDir = folder("h1-user");
  put(proj, ".claude/settings.json", JSON.stringify({ permissions: { allow: [] } }));
  const snap = path.join(userDir, "claude-kit-snapshot.json");
  const s = run("snapshot", snap, home, proj);
  assert.equal(s.done, "snapshot");
  assert.equal(s.folders.length, 2);
  assert.equal(run("compare", snap).result, "clean");

  put(proj, ".claude/settings.json", JSON.stringify({ permissions: { allow: [] }, enabledPlugins: { "x@y": true } }));
  put(proj, ".claude/commands/misplaced.md", "# oops\n");
  put(proj, ".claude/get-shit-done/VERSION", "1.42.3\n");
  const r = run("compare", snap);
  assert.equal(r.code, 0);
  assert.equal(r.result, "flagged");
  const paths = flaggedPaths(r, proj);
  for (const p of [".claude/settings.json", ".claude/commands", ".claude/commands/misplaced.md", ".claude/get-shit-done/VERSION"]) {
    assert.ok(paths.includes(p), `expected ${p} in ${paths}`);
  }
  const settings = r.folders.find((f) => f.folder === proj).flagged.find((x) => x.path === ".claude/settings.json");
  assert.deepEqual(settings.keysAdded, ["enabledPlugins"]);
  assert.ok(!JSON.stringify(r).includes("x@y"), "values must never be printed");
  assert.ok(!fs.readFileSync(snap, "utf8").includes("allow"), "values must never be stored");
});

test("settings.local.json: a permissions-only change is ignored, any other key is flagged", () => {
  const home = folder("h2");
  const proj = folder("p2");
  const snap = path.join(folder("h2-user"), "snap.json");
  put(proj, ".claude/settings.local.json", JSON.stringify({ permissions: { allow: ["Bash(ls)"] } }));
  run("snapshot", snap, home, proj);

  put(proj, ".claude/settings.local.json", JSON.stringify({ permissions: { allow: ["Bash(ls)", "Bash(git status)"] } }));
  const quiet = run("compare", snap);
  assert.equal(quiet.result, "clean");
  assert.equal(quiet.folders.find((f) => f.folder === proj).ignored.length, 1);

  put(proj, ".claude/settings.local.json", JSON.stringify({ permissions: {}, extraKnownMarketplaces: { m: {} } }));
  const loud = run("compare", snap);
  assert.equal(loud.result, "flagged");
  assert.deepEqual(loud.folders.find((f) => f.folder === proj).flagged[0].keysAdded, ["extraKnownMarketplaces"]);
});

test("a new session .claude/ holding only a permissions-only settings.local.json is clean; an empty new folder is flagged", () => {
  const home = folder("h7");
  const proj = folder("p7");
  const snap = path.join(folder("h7-user"), "snap.json");
  run("snapshot", snap, home, proj);
  assert.ok(!fs.existsSync(path.join(proj, ".claude")), "no .claude/ at snapshot time");

  put(proj, ".claude/settings.local.json", JSON.stringify({ permissions: { allow: ["Bash(ls)"] } }));
  const quiet = run("compare", snap);
  assert.equal(quiet.result, "clean");
  const ignoredPaths = quiet.folders.find((f) => f.folder === proj).ignored.map((x) => x.path);
  assert.deepEqual(ignoredPaths.sort(), [".claude", ".claude/settings.local.json"]);

  fs.mkdirSync(path.join(proj, ".claude", "agents"));
  const loud = run("compare", snap);
  assert.equal(loud.result, "flagged");
  assert.deepEqual(flaggedPaths(loud, proj), [".claude", ".claude/agents"]);
});

test("CLAUDE_CONFIG_DIR elsewhere: the home folder's .claude/ is watched like a project's", () => {
  const home = folder("h8");
  const userDir = folder("h8-config"); // CLAUDE_CONFIG_DIR
  put(home, ".claude/settings.json", JSON.stringify({ extraKnownMarketplaces: { old: {} } }));
  const snap = path.join(userDir, "claude-kit-snapshot.json");
  const s = run("snapshot", snap, home, home, userDir);
  assert.equal(s.folders.length, 1);
  assert.equal(s.folders[0].watchTree, true);
  assert.equal(run("compare", snap).result, "clean");

  put(userDir, "settings.json", JSON.stringify({ enabledPlugins: { a: true } }));
  put(userDir, "skills/kit-skill/SKILL.md", "x");
  assert.equal(run("compare", snap).result, "clean", "the user Claude folder itself is not watched");

  put(home, ".claude/settings.json", JSON.stringify({ extraKnownMarketplaces: { old: {}, kitm: {} } }));
  put(home, ".claude/commands/x.md", "# x\n");
  const r = run("compare", snap);
  assert.equal(r.result, "flagged");
  const paths = flaggedPaths(r, home);
  for (const p of [".claude/settings.json", ".claude/commands", ".claude/commands/x.md"]) {
    assert.ok(paths.includes(p), `expected ${p} in ${paths}`);
  }
  const settings = r.folders[0].flagged.find((x) => x.path === ".claude/settings.json");
  assert.deepEqual(settings.marketplacesAdded, ["kitm"], "only the marketplace added since the snapshot");

  const plain = run("snapshot", path.join(userDir, "plain.json"), home, home);
  assert.equal(plain.folders[0].watchTree, false, "without a user Claude folder argument, <home>/.claude is the user folder");
});

test("marketplacesAdded names only marketplaces new since the snapshot", () => {
  const home = folder("h9");
  const proj = folder("p9");
  const snap = path.join(folder("h9-user"), "snap.json");
  put(proj, ".claude/settings.local.json", JSON.stringify({ permissions: {}, extraKnownMarketplaces: { pre: {} } }));
  run("snapshot", snap, home, proj);

  put(proj, ".claude/settings.local.json", JSON.stringify({ permissions: { allow: ["Bash(ls)"] }, extraKnownMarketplaces: { pre: {} } }));
  const quiet = run("compare", snap);
  assert.equal(quiet.result, "clean", "a marketplace that was already there is not new");
  assert.equal(quiet.folders.find((f) => f.folder === proj).ignored[0].marketplacesAdded, undefined);

  put(proj, ".claude/settings.local.json", JSON.stringify({ permissions: {}, extraKnownMarketplaces: { pre: {}, kitm: {} } }));
  const loud = run("compare", snap);
  assert.equal(loud.result, "flagged");
  assert.deepEqual(loud.folders.find((f) => f.folder === proj).flagged[0].marketplacesAdded, ["kitm"]);
});

test("home folder: .claude/ is the user folder, only the fixed list is watched", () => {
  const home = folder("h3");
  put(home, ".claude/settings.json", "{}");
  const snap = path.join(home, ".claude", "claude-kit-snapshot.json");
  const s = run("snapshot", snap, home, home);
  assert.equal(s.folders.length, 1, "session folder = home folder is watched once");
  assert.equal(s.folders[0].isHome, true);

  put(home, ".claude/settings.json", JSON.stringify({ enabledPlugins: { a: true } }));
  put(home, ".claude/skills/kit-skill/SKILL.md", "x");
  put(home, ".agents/.skill-lock.json", "{}");
  put(home, ".claude/settings.local.json", JSON.stringify({ permissions: { allow: ["Bash(ls)"] } }));
  assert.equal(run("compare", snap).result, "clean");

  put(home, ".mcp.json", "{}");
  put(home, ".agents/skills/stray/SKILL.md", "x");
  put(home, "CLAUDE.md", "# home rules\n");
  const r = run("compare", snap);
  assert.equal(r.result, "flagged");
  const paths = flaggedPaths(r, home);
  for (const p of [".mcp.json", ".agents/skills", ".agents/skills/stray/SKILL.md", "CLAUDE.md"]) {
    assert.ok(paths.includes(p), `expected ${p} in ${paths}`);
  }
  assert.ok(!paths.some((p) => p.startsWith(".claude/")), "nothing under the user .claude/ is flagged");
});

test("snapshot refuses to write inside a watched path; compare refuses without a snapshot", () => {
  const home = folder("h4");
  const proj = folder("p4");
  const bad = run("snapshot", path.join(proj, ".claude", "snap.json"), home, proj);
  assert.equal(bad.code, 2);
  assert.ok(!fs.existsSync(path.join(proj, ".claude", "snap.json")));
  assert.equal(run("snapshot", path.join(home, ".agents", "skills", "snap.json"), home, proj).code, 2);
  assert.equal(run("compare", path.join(dir, "no-snapshot.json")).code, 2);
});

test("a session folder above the home folder still works, since only its watched paths count", () => {
  const top = folder("top5");
  const home = folder(path.join("top5", "home"));
  const snap = path.join(home, ".claude", "claude-kit-snapshot.json");
  const s = run("snapshot", snap, home, top);
  assert.equal(s.done, "snapshot");
  assert.equal(run("compare", snap).result, "clean", "writing the snapshot itself is not a change");
});

test("keys prints key names, never values", () => {
  const f = file("settings-keys.json", JSON.stringify({ env: { SECRET_TOKEN: "abc123secret" }, extraKnownMarketplaces: { one: { source: "s" }, two: {} } }));
  const top = run("keys", f);
  assert.deepEqual(top.keys, ["env", "extraKnownMarketplaces"]);
  const m = run("keys", f, "extraKnownMarketplaces");
  assert.equal(m.present, true);
  assert.deepEqual(m.keys, ["one", "two"]);
  const absent = run("keys", f, "enabledPlugins");
  assert.equal(absent.present, false);
  assert.ok(!JSON.stringify([top, m, absent]).includes("abc123secret"));
  assert.equal(run("keys", path.join(dir, "none.json")).result, "missing");
  assert.equal(run("keys", file("bad.json", "{not json")).result, "not-json");
});
