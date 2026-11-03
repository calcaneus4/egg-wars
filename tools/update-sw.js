#!/usr/bin/env node
// Rebuilds the offline file list and version in sw.js. Run after adding or changing game files:
//   node tools/update-sw.js
// (tools/smoke-test.js fails if sw.js is out of date, so a stale offline copy can't slip through.)
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");

function files() {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  const icons = fs.readdirSync(path.join(root, "icons")).map((f) => `icons/${f}`);
  return ["./", "index.html", "styles.css", "manifest.webmanifest", ...scripts, ...icons.sort()];
}

function version(list) {
  const hash = crypto.createHash("sha256");
  for (const f of list) if (f !== "./") hash.update(f).update(fs.readFileSync(path.join(root, f)));
  return hash.digest("hex").slice(0, 12);
}

function render() {
  const list = files();
  const tpl = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  return tpl
    .replace(/const VERSION = "[^"]*";/, `const VERSION = "${version(list)}";`)
    .replace(/const FILES = \[[\s\S]*?\];/, `const FILES = [\n${list.map((f) => `  ${JSON.stringify(f)},`).join("\n")}\n];`);
}

module.exports = { render };

if (require.main === module) {
  fs.writeFileSync(path.join(root, "sw.js"), render());
  console.log("sw.js updated");
}
