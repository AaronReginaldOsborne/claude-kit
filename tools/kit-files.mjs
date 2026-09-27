#!/usr/bin/env node
// Small file helper for SETUP.md. It does the few file edits the kit makes in the
// human's own Claude folder, the same way on macOS, Linux and Windows (bash or
// PowerShell), without passing the file through the chat and without rewriting
// anything outside the kit's own block. It uses only Node's standard library.
//
//   node kit-files.mjs rules-status <target CLAUDE.md> <kit files/CLAUDE.md>
//   node kit-files.mjs rules-add    <target> <source>   create, or append once
//   node kit-files.mjs rules-update <target> <source>   replace the kit block (after the human's yes)
//   node kit-files.mjs rules-remove <target>            remove the kit block (Undo)
//   node kit-files.mjs same <a> <b>                     prints same, different or missing
//   node kit-files.mjs snapshot <snapshot.json> <home folder> [<session folder> [<user Claude folder>]]
//                                                       record the working folders (Step 1b)
//   node kit-files.mjs compare <snapshot.json>          what appeared or changed since (Step 5)
//   node kit-files.mjs keys <file.json> [<top-level key>]  key names only, never values
//
// Every command prints one line of JSON. Exit 0 = done, 2 = refused (nothing written).
//
// snapshot/compare: in every folder they watch .mcp.json, skills-lock.json, CLAUDE.md,
// .claude/settings.local.json and everything under .agents/skills/. They also watch every
// path under a folder's .claude/ (a project-scope plugin or marketplace writes
// .claude/settings.json; a GSD run without --global writes a whole .claude/), except when
// that .claude/ is the user Claude folder, which is expected to change: the user Claude
// folder defaults to <home>/.claude and is the folder in CLAUDE_CONFIG_DIR when that is set,
// so with CLAUDE_CONFIG_DIR set the home folder's .claude/ is watched like a project's.
// A change to settings.local.json only under its "permissions" key (the human's "don't
// ask again" approvals) is not flagged, and a new or removed folder is flagged only when
// it is empty or something inside it is flagged (its files are compared one by one).
// Settings values are never printed or stored: the snapshot keeps key names, a short hash
// of each value (only to tell which keys changed) and the key names under
// extraKnownMarketplaces (marketplace names), so compare can name marketplaces added since.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const START = "<!-- claude-kit rules: start (added by claude-kit; to change it, re-run the kit) -->";
const END = "<!-- claude-kit rules: end -->";
const HEADING = "## Anti-vibe-coding docs framework";

const out = (obj, code = 0) => {
  console.log(JSON.stringify(obj));
  process.exit(code);
};

function readText(file) {
  if (!fs.existsSync(file)) return null;
  const buf = fs.readFileSync(file);
  const utf16 =
    (buf.length >= 2 && ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff))) ||
    buf.includes(0);
  if (utf16) return { buf, text: null };
  return { buf, text: buf.toString("utf8") };
}

const count = (text, needle) => text.split(needle).length - 1;
const lf = (s) => s.replace(/\r\n/g, "\n");

function inspect(target, source) {
  const t = readText(target);
  if (t === null) return { state: "missing", headingCount: 0, kitBlocks: 0 };
  if (t.text === null) return { state: "unsupported-encoding", headingCount: 0, kitBlocks: 0 };
  const text = t.text;
  const starts = count(text, START);
  const ends = count(text, END);
  const headingCount = count(text, HEADING);
  const s = text.indexOf(START);
  const e = text.indexOf(END);
  if (starts !== ends || starts > 1 || (starts === 1 && e < s)) {
    return { state: "broken", headingCount, kitBlocks: starts };
  }
  if (starts === 0) {
    return { state: headingCount > 0 ? "unmarked" : "absent", headingCount, kitBlocks: 0 };
  }
  const inner = text.slice(s + START.length, e).replace(/^\r?\n/, "");
  const src = source ? lf(fs.readFileSync(source, "utf8")) : null;
  const state = src === null ? "present" : lf(inner) === src ? "current" : "outdated";
  return { state, headingCount, kitBlocks: 1 };
}

function block(sourceFile, eol) {
  let body = lf(fs.readFileSync(sourceFile, "utf8"));
  if (!body.endsWith("\n")) body += "\n";
  return (START + "\n" + body + END + "\n").replace(/\n/g, eol);
}

function writeAtomic(file, text) {
  const tmp = path.join(path.dirname(file), `.${path.basename(file)}.kit-tmp`);
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, file);
}

// ---- working-folder snapshot (SETUP Step 1b and Step 5) ----

const WATCHED_FILES = [".mcp.json", "skills-lock.json", "CLAUDE.md", ".claude/settings.local.json"];
const WATCHED_TREES = [".agents/skills"];
const PROJECT_TREE = ".claude"; // watched unless it is the user Claude folder
const LOCAL_SETTINGS = ".claude/settings.local.json";
const SETTINGS_FILES = [".claude/settings.json", LOCAL_SETTINGS];
const LIST_CAP = 50;

const norm = (p) => {
  const r = path.resolve(p).replace(/[\\/]+$/, "");
  return process.platform === "win32" ? r.toLowerCase() : r;
};
const isInside = (child, parent) => {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};
const slash = (rel) => rel.split(path.sep).join("/");

function statEntry(abs) {
  let st;
  try {
    st = fs.lstatSync(abs);
  } catch {
    return null;
  }
  if (st.isDirectory()) return { type: "dir" };
  if (st.isSymbolicLink()) return { type: "link", mtimeMs: Math.round(st.mtimeMs) };
  return { type: "file", mtimeMs: Math.round(st.mtimeMs), size: st.size };
}

function walk(folder, rel, entries) {
  const e = statEntry(path.join(folder, rel));
  if (!e) return;
  entries[slash(rel)] = e;
  if (e.type !== "dir") return;
  let names = [];
  try {
    names = fs.readdirSync(path.join(folder, rel));
  } catch {
    entries[slash(rel)].unreadable = true;
  }
  for (const name of names) walk(folder, path.join(rel, name), entries);
}

const shortHash = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Top-level key names with a short hash of each value, plus the key names under
// extraKnownMarketplaces. Never a value.
function readSettings(file) {
  if (!fs.existsSync(file)) return { keys: null, marketplaces: null };
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    return { keys: { "(not valid JSON)": shortHash(raw) }, marketplaces: null };
  }
  if (!isObject(json)) return { keys: { "(not an object)": shortHash(raw) }, marketplaces: null };
  const keys = {};
  for (const [k, v] of Object.entries(json)) keys[k] = shortHash(JSON.stringify(v));
  const marketplaces = isObject(json.extraKnownMarketplaces) ? Object.keys(json.extraKnownMarketplaces) : null;
  return { keys, marketplaces };
}

function takeFolder(folder, isHome, watchTree) {
  const entries = {};
  for (const f of WATCHED_FILES) walk(folder, path.normalize(f), entries);
  for (const t of WATCHED_TREES) walk(folder, path.normalize(t), entries);
  if (watchTree) walk(folder, PROJECT_TREE, entries);
  const settings = {};
  const marketplaces = {};
  for (const f of watchTree ? SETTINGS_FILES : [LOCAL_SETTINGS]) {
    const s = readSettings(path.join(folder, f));
    settings[f] = s.keys;
    marketplaces[f] = s.marketplaces;
  }
  return { folder, isHome, watchTree, entries, settings, marketplaces };
}

// Snapshots written before watchTree existed: the tree was watched in every folder but the home folder.
const watchTreeOf = (f) => (typeof f.watchTree === "boolean" ? f.watchTree : !f.isHome);

function keyDiff(before, after) {
  const b = before || {};
  const a = after || {};
  const keysAdded = Object.keys(a).filter((k) => !(k in b));
  const keysRemoved = Object.keys(b).filter((k) => !(k in a));
  const keysChanged = Object.keys(a).filter((k) => k in b && a[k] !== b[k]);
  return { keysAdded, keysRemoved, keysChanged };
}

function diffFolder(before, now) {
  const flagged = [];
  const ignored = [];
  const folders = []; // added or removed folders, decided after everything inside them
  const paths = new Set([...Object.keys(before.entries), ...Object.keys(now.entries)]);
  for (const p of [...paths].sort()) {
    const was = before.entries[p];
    const is = now.entries[p];
    let change = null;
    if (!was) change = "added";
    else if (!is) change = "removed";
    else if (was.type !== is.type) change = "changed";
    else if (is.type !== "dir" && (was.mtimeMs !== is.mtimeMs || was.size !== is.size)) change = "changed";
    if (!change) continue;
    const item = { path: p, change };
    if (change !== "changed" && (was || is).type === "dir") {
      folders.push(item);
      continue;
    }
    if (p in now.settings || p in before.settings) {
      Object.assign(item, keyDiff(before.settings[p], now.settings[p]));
      const had = (before.marketplaces || {})[p] || [];
      const added = ((now.marketplaces || {})[p] || []).filter((m) => !had.includes(m));
      if (added.length) item.marketplacesAdded = added;
      const touched = [...item.keysAdded, ...item.keysRemoved, ...item.keysChanged];
      if (p === LOCAL_SETTINGS && change !== "removed" && touched.every((k) => k === "permissions")) {
        ignored.push({ ...item, why: "no key other than permissions changed (the human's approvals)" });
        continue;
      }
    }
    flagged.push(item);
  }
  // A new or removed folder with contents is not a finding by itself: its contents were
  // compared one by one. It is flagged when it is empty or something inside it is flagged.
  // Deepest first, so a parent sees a flagged empty folder inside it.
  folders.sort((x, y) => y.path.split("/").length - x.path.split("/").length);
  for (const item of folders) {
    const side = item.change === "added" ? now.entries : before.entries;
    const inside = (q) => q.startsWith(item.path + "/");
    const empty = !Object.keys(side).some(inside);
    if (empty || flagged.some((f) => inside(f.path))) flagged.push(item);
    else ignored.push({ ...item, why: "a folder whose contents were compared one by one; none was flagged" });
  }
  flagged.sort((x, y) => (x.path < y.path ? -1 : x.path > y.path ? 1 : 0));
  return { flagged, ignored };
}

function snapshotRefusal(snapFile, folders) {
  for (const f of folders) {
    const watched = [...WATCHED_FILES, ...WATCHED_TREES, ...(f.watchTree ? [PROJECT_TREE] : [])];
    for (const w of watched) {
      if (isInside(snapFile, path.join(f.folder, w))) return `the snapshot file must not be inside a watched path (${path.join(f.folder, w)})`;
    }
  }
  return null;
}

const [cmd, a, b, c, d] = process.argv.slice(2);

if (cmd === "same") {
  if (!a || !b) out({ refused: "usage: same <a> <b>" }, 2);
  if (!fs.existsSync(a) || !fs.existsSync(b)) out({ result: "missing" });
  out({ result: fs.readFileSync(a).equals(fs.readFileSync(b)) ? "same" : "different" });
}

if (cmd === "snapshot") {
  if (!a || !b) out({ refused: "usage: snapshot <snapshot.json> <home folder> [<session folder> [<user Claude folder>]]" }, 2);
  const snapFile = path.resolve(a);
  const home = path.resolve(b);
  if (!fs.existsSync(home)) out({ refused: `home folder not found: ${home}` }, 2);
  // The user Claude folder (CLAUDE_CONFIG_DIR when set) is expected to change; any other .claude/ is watched whole.
  const userClaudeDir = path.resolve(d || path.join(home, ".claude"));
  const watchTree = (folder) => norm(path.join(folder, PROJECT_TREE)) !== norm(userClaudeDir);
  const folders = [{ folder: home, isHome: true, watchTree: watchTree(home) }];
  if (c) {
    const session = path.resolve(c);
    if (!fs.existsSync(session)) out({ refused: `session folder not found: ${session}` }, 2);
    if (norm(session) !== norm(home)) folders.push({ folder: session, isHome: false, watchTree: watchTree(session) });
  }
  const refusal = snapshotRefusal(snapFile, folders);
  if (refusal) out({ refused: refusal }, 2);
  const snap = {
    kitSnapshot: 1,
    takenAt: new Date().toISOString(),
    userClaudeDir,
    folders: folders.map((f) => takeFolder(f.folder, f.isHome, f.watchTree)),
  };
  fs.mkdirSync(path.dirname(snapFile), { recursive: true });
  writeAtomic(snapFile, JSON.stringify(snap));
  out({
    done: "snapshot",
    file: snapFile,
    userClaudeDir,
    folders: snap.folders.map((f) => ({ folder: f.folder, isHome: f.isHome, watchTree: f.watchTree, paths: Object.keys(f.entries).length })),
  });
}

if (cmd === "compare") {
  if (!a) out({ refused: "usage: compare <snapshot.json>" }, 2);
  const snapFile = path.resolve(a);
  let snap;
  try {
    snap = JSON.parse(fs.readFileSync(snapFile, "utf8"));
  } catch {
    out({ refused: `no readable snapshot at ${snapFile}; take one first (Step 1b)` }, 2);
  }
  if (!snap || snap.kitSnapshot !== 1 || !Array.isArray(snap.folders)) out({ refused: "not a kit snapshot" }, 2);
  const folders = snap.folders.map((before) => {
    const watchTree = watchTreeOf(before);
    const { flagged, ignored } = diffFolder(before, takeFolder(before.folder, before.isHome, watchTree));
    const res = { folder: before.folder, isHome: before.isHome, watchTree, flagged: flagged.slice(0, LIST_CAP), ignored };
    if (flagged.length > LIST_CAP) res.moreFlagged = flagged.length - LIST_CAP;
    res.flaggedCount = flagged.length;
    return res;
  });
  const total = folders.reduce((n, f) => n + f.flaggedCount, 0);
  out({ result: total === 0 ? "clean" : "flagged", since: snap.takenAt, folders });
}

if (cmd === "keys") {
  if (!a) out({ refused: "usage: keys <file.json> [<top-level key>]" }, 2);
  const file = path.resolve(a);
  if (!fs.existsSync(file)) out({ result: "missing", file });
  let json;
  try {
    json = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    out({ result: "not-json", file });
  }
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  if (!isObj(json)) out({ result: "not-an-object", file });
  if (!b) out({ result: "keys", file, keys: Object.keys(json) });
  if (!(b in json)) out({ result: "keys", file, key: b, present: false, keys: [] });
  out({ result: "keys", file, key: b, present: true, keys: isObj(json[b]) ? Object.keys(json[b]) : [] });
}

if (!a) out({ refused: "missing target path" }, 2);
const target = path.resolve(a);

if (cmd === "rules-status") {
  if (!b) out({ refused: "missing source path" }, 2);
  out(inspect(target, path.resolve(b)));
}

if (cmd === "rules-add") {
  if (!b) out({ refused: "missing source path" }, 2);
  const info = inspect(target, path.resolve(b));
  if (info.state === "missing") {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, block(b, "\n"), { encoding: "utf8", flag: "wx" });
    out({ done: "created", bytesBefore: 0, bytesAfter: fs.statSync(target).size });
  }
  if (info.state !== "absent") out({ refused: `rules-add needs state absent or missing, found ${info.state}`, ...info }, 2);
  const before = fs.readFileSync(target);
  const text = before.toString("utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const sep = (text.length === 0 || text.endsWith("\n") ? "" : eol) + (text.length === 0 ? "" : eol);
  const add = sep + block(b, eol);
  fs.appendFileSync(target, add, "utf8");
  const after = fs.readFileSync(target);
  const intact = after.subarray(0, before.length).equals(before);
  const expected = before.length + Buffer.byteLength(add, "utf8");
  if (!intact || after.length !== expected) out({ refused: "size or content check failed after append; restore the backup", intact, expected, actual: after.length }, 2);
  out({ done: "appended", bytesBefore: before.length, bytesAfter: after.length });
}

if (cmd === "rules-update") {
  if (!b) out({ refused: "missing source path" }, 2);
  const info = inspect(target, path.resolve(b));
  if (info.state !== "outdated") out({ refused: `rules-update needs state outdated, found ${info.state}`, ...info }, 2);
  const text = fs.readFileSync(target, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const s = text.indexOf(START);
  const e = text.indexOf(END) + END.length;
  const rest = text.slice(e).replace(/^\r?\n/, "");
  const next = text.slice(0, s) + block(b, eol) + rest;
  writeAtomic(target, next);
  out({ done: "updated", bytesBefore: Buffer.byteLength(text, "utf8"), bytesAfter: fs.statSync(target).size });
}

if (cmd === "rules-remove") {
  const info = inspect(target, null);
  if (info.state !== "present") out({ refused: `rules-remove needs one kit block, found ${info.state}`, ...info }, 2);
  const text = fs.readFileSync(target, "utf8");
  const s = text.indexOf(START);
  const e = text.indexOf(END) + END.length;
  let head = text.slice(0, s);
  const tail = text.slice(e).replace(/^\r?\n/, "");
  if (tail === "") head = head.replace(/\r?\n$/, "");
  writeAtomic(target, head + tail);
  out({ done: "removed", bytesBefore: Buffer.byteLength(text, "utf8"), bytesAfter: fs.statSync(target).size });
}

out({ refused: `unknown command ${cmd}` }, 2);
