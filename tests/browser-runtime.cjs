"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function verifyVersions({declared, locked, installed, image}) {
  assert.match(declared, /^\d+\.\d+\.\d+$/, "Playwright must use an exact version");
  assert.equal(locked, declared, "lockfile and package.json must agree");
  assert.equal(installed, declared, "installed Playwright must match the lockfile");
  assert.match(image, new RegExp("^mcr\\.microsoft\\.com/playwright:v" + declared.replaceAll(".", "\\.") + "-noble@sha256:[0-9a-f]{64}$"), "official test image must match Playwright and use an immutable digest");
}

async function main() {
  const root = path.resolve(__dirname, ".."), pkg = require("../package.json"), lock = require("../package-lock.json");
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/tests.yml"), "utf8");
  const image = workflow.match(/^\s+image:\s*(\S+)\s*$/m);
  assert(image, "browser job image must be explicit");
  verifyVersions({declared: pkg.devDependencies.playwright, locked: lock.packages["node_modules/playwright"].version,
    installed: require("playwright/package.json").version, image: image[1]});
  const name = process.env.BROWSER;
  assert(["chromium", "webkit"].includes(name), "BROWSER must select a required matrix browser");
  const type = require("playwright")[name];
  fs.accessSync(type.executablePath(), fs.constants.R_OK);
  const browser = await type.launch({headless: true});
  await browser.close();
  console.log("PASS locked Playwright " + pkg.devDependencies.playwright + ": preinstalled " + name + " launches; image " + image[1]);
}
module.exports = {verifyVersions};
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
