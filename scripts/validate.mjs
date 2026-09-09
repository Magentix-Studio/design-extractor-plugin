import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const SKIP_DIRS = new Set([".git", "node_modules"]);
const SKILL_LINE_LIMIT = 300;
const SITE = "https://www.design-extractor.com";
const MCP_URL = `${SITE}/api/mcp`;
const failures = [];

function fail(message) {
  failures.push(message);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

function rel(path) {
  return relative(root, path);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${rel(path)}: invalid JSON (${error.message})`);
    return null;
  }
}

function requireString(json, file, field, expected) {
  const value = json?.[field];
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${file}: "${field}" must be a non-empty string`);
    return;
  }
  if (expected !== undefined && value !== expected) {
    fail(`${file}: "${field}" is "${value}", expected "${expected}"`);
  }
}

function requireObjectWithName(json, file, field) {
  const value = json?.[field];
  if (!value || typeof value !== "object" || typeof value.name !== "string" || value.name.trim() === "") {
    fail(`${file}: "${field}" must be an object with a "name"`);
  }
}

const files = walk(root);
const jsonFiles = files.filter((path) => path.endsWith(".json"));
const parsed = new Map(jsonFiles.map((path) => [rel(path), readJson(path)]));

const version = readFileSync(join(root, "VERSION"), "utf8").trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) fail(`VERSION: "${version}" is not a semantic version`);

const PLUGIN_NAME = "design-extractor";

for (const file of [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"]) {
  const json = parsed.get(file);
  if (!json) {
    fail(`${file}: missing`);
    continue;
  }
  requireString(json, file, "name", PLUGIN_NAME);
  requireString(json, file, "version", version);
  requireString(json, file, "description");
  requireString(json, file, "homepage");
  requireObjectWithName(json, file, "author");
  requireString(json, file, "mcpServers", "./.mcp.json");
  if (typeof json.skills !== "string" || !json.skills.startsWith("./skills")) {
    fail(`${file}: "skills" must point at ./skills`);
  }
}

{
  const file = ".claude-plugin/marketplace.json";
  const json = parsed.get(file);
  if (!json) fail(`${file}: missing`);
  else {
    requireString(json, file, "name", PLUGIN_NAME);
    requireObjectWithName(json, file, "owner");
    const entry = Array.isArray(json.plugins) ? json.plugins[0] : undefined;
    if (!entry || json.plugins.length !== 1) fail(`${file}: "plugins" must list exactly one plugin`);
    else {
      requireString(entry, file, "name", PLUGIN_NAME);
      requireString(entry, file, "source", "./");
      requireString(entry, file, "version", version);
    }
  }
}

{
  const file = ".agents/plugins/marketplace.json";
  const json = parsed.get(file);
  if (!json) fail(`${file}: missing`);
  else {
    requireString(json, file, "name", PLUGIN_NAME);
    const entry = Array.isArray(json.plugins) ? json.plugins[0] : undefined;
    if (!entry || json.plugins.length !== 1) fail(`${file}: "plugins" must list exactly one plugin`);
    else {
      requireString(entry, file, "name", PLUGIN_NAME);
      if (entry.source?.source !== "local" || entry.source?.path !== "./") {
        fail(`${file}: plugin source must be { "source": "local", "path": "./" }`);
      }
    }
  }
}

{
  const file = ".mcp.json";
  const json = parsed.get(file);
  const server = json?.mcpServers?.[PLUGIN_NAME];
  if (!server) fail(`${file}: must declare mcpServers.${PLUGIN_NAME}`);
  else {
    requireString(server, file, "type", "http");
    requireString(server, file, "url", MCP_URL);
    requireString(server.headers ?? {}, file, "Authorization", "Bearer ${DESIGN_EXTRACTOR_API_KEY}");
  }
}

const skillFiles = files.filter((path) => path.endsWith("/SKILL.md") && rel(path).startsWith("skills/"));
if (skillFiles.length === 0) fail("skills/: no SKILL.md found");
for (const path of skillFiles) {
  const file = rel(path);
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n");
  if (lines.length > SKILL_LINE_LIMIT) fail(`${file}: ${lines.length} lines, limit ${SKILL_LINE_LIMIT}`);
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    fail(`${file}: missing front matter`);
    continue;
  }
  const frontMatter = Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.match(/^([\w-]+):\s*(.+?)\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
  const dirName = file.split("/").at(-2);
  if (!frontMatter.name) fail(`${file}: front matter needs "name"`);
  else if (frontMatter.name !== dirName) fail(`${file}: name "${frontMatter.name}" must match folder "${dirName}"`);
  if (!frontMatter.description) fail(`${file}: front matter needs "description"`);
}

for (const path of files) {
  if (/\.(md|json|yml|mjs)$/.test(path) && readFileSync(path, "utf8").includes("\u2014")) {
    fail(`${rel(path)}: contains an em dash`);
  }
  if (/\.(md|json)$/.test(path) && /Bearer dx_[A-Za-z0-9]{8,}/.test(readFileSync(path, "utf8"))) {
    fail(`${rel(path)}: looks like it contains a real API key`);
  }
}

if (failures.length > 0) {
  for (const message of failures) console.error(`FAIL ${message}`);
  process.exit(1);
}
console.log(`OK: ${jsonFiles.length} JSON files, ${skillFiles.length} skill(s), version ${version}`);
