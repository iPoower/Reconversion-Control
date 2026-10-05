"use strict";
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const publicFiles = new Set(["index.html", "app.js", "data.js", "course-foundations.js", "course-race.js", "course-operations.js", "learning.js", "english.js", "drive-learning.js", "style.css", "sw.js", "manifest.webmanifest", "assets/icon-192.png", "assets/icon-512.png"]);
const types = {".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".webmanifest": "application/manifest+json", ".png": "image/png"};
async function startServer(options = {}) {
  const basePath = options.basePath || "/";
  const requests = [];
  const failures = new Map();
  const responseOverrides = new Map();
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const withinScope = url.pathname.startsWith(basePath);
    const relative = withinScope ? url.pathname.slice(basePath.length) : null;
    const name = relative === "" ? "index.html" : relative;
    requests.push({path: url.pathname, query: url.search, method: req.method});
    if (failures.has(url.pathname)) {
      res.writeHead(failures.get(url.pathname), {"Content-Type": "text/plain"});
      res.end("Simulated upstream failure");
      return;
    }
    if (name === "__test_control.html") {
      res.writeHead(200, {"Content-Type": "text/html", "Cache-Control": "no-store"});
      res.end("<!doctype html><title>Browser test control</title>");
      return;
    }
    if (!publicFiles.has(name)) {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.end("Not found");
      return;
    }
    try {
      const override = responseOverrides.get(url.pathname);
      const body = override ? override.body : await fs.readFile(path.join(root, name));
      res.writeHead(200, {"Content-Type": types[path.extname(name)] || "application/octet-stream", "Cache-Control": "no-store", ...(override && override.headers)});
      res.end(body);
    } catch {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.end("Not found");
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = "http://127.0.0.1:" + server.address().port;
  return {url: origin + basePath.slice(0, -1), origin, requests, failures, responseOverrides, close: () => new Promise(resolve => server.close(resolve))};
}
module.exports = {startServer};
