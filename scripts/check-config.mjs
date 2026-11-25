// Verifies project configuration without installing anything.
// Run with: npm run check
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
let passed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
  } else {
    failures.push(`${name}${detail ? `: ${detail}` : ""}`);
  }
}

function readJson(relative) {
  try {
    return JSON.parse(readFileSync(path.join(root, relative), "utf8"));
  } catch (error) {
    failures.push(`${relative} is not valid JSON (${error.message})`);
    return null;
  }
}

// 1. JSON files parse and have the expected fields.
const packages = {
  "package.json": "vrron",
  "apps/api/package.json": "@vrron/api",
  "apps/mobile/package.json": "@vrron/mobile",
  "packages/contract/package.json": "@vrron/contract",
  "packages/design/package.json": "@vrron/design",
};
const names = [];
for (const [file, expectedName] of Object.entries(packages)) {
  const json = readJson(file);
  check(`${file} name`, json?.name === expectedName, `expected ${expectedName}`);
  if (json?.name) names.push(json.name);
}
check("workspace package names are unique", new Set(names).size === names.length);

const app = readJson("apps/mobile/app.json");
check("app.json android.package is valid", /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(app?.expo?.android?.package ?? ""));
check("app.json slug is set", typeof app?.expo?.slug === "string" && app.expo.slug.length > 0);

const eas = readJson("apps/mobile/eas.json");
check("eas preview builds an APK", eas?.build?.preview?.android?.buildType === "apk");
check("eas production builds an AAB", eas?.build?.production?.android?.buildType === "app-bundle");

// 2. Required documentation exists.
for (const file of [
  "README.md",
  "PROJECT_STATUS.md",
  "NEXT_STEPS.md",
  "docs/ARCHITECTURE.md",
  "docs/EXTERNAL_SETUP.md",
]) {
  check(`${file} exists`, existsSync(path.join(root, file)));
}

// 3. No hard-coded secrets in source files.
const secretPattern = /(api[_-]?key|secret|token|password)\s*[:=]\s*["'][A-Za-z0-9_\-./+]{16,}["']/i;
const skip = new Set(["node_modules", ".git", ".expo", "dist"]);
const scanned = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (skip.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|mjs|json|md)$/.test(entry) && entry !== "package-lock.json") scanned.push(full);
  }
}
walk(root);
for (const file of scanned) {
  if (file.endsWith("check-config.mjs")) continue;
  const text = readFileSync(file, "utf8");
  check(`no secret-like value in ${path.relative(root, file)}`, !secretPattern.test(text));
}

if (failures.length > 0) {
  console.error(`FAILED (${failures.length}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`OK: ${passed} checks passed.`);
