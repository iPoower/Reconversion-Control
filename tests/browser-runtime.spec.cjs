"use strict";
const assert = require("node:assert/strict");
const {verifyVersions} = require("./browser-runtime.cjs");
const valid = {declared: "1.63.0", locked: "1.63.0", installed: "1.63.0", image: "mcr.microsoft.com/playwright:v1.63.0-noble@sha256:" + "a".repeat(64)};
verifyVersions(valid);
for (const invalid of [{declared: "^1.63.0"}, {locked: "1.64.0"}, {installed: "1.62.0"},
  {image: "mcr.microsoft.com/playwright:v1.64.0-noble@sha256:" + "a".repeat(64)},
  {image: "mcr.microsoft.com/playwright:v1.63.0-noble"}]) {
  assert.throws(() => verifyVersions({...valid, ...invalid}));
}
console.log("PASS browser runtime contract: exact matching package/lock/install/image and rejection of mutable or mismatched versions");
