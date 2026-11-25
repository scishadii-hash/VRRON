import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAssistants } from "../src/core/loadAssistants.ts";
import { createRegistry } from "../src/core/registry.ts";

const realDir = fileURLToPath(new URL("../src/assistants", import.meta.url));

function configSource(id: string, enabled: boolean): string {
  return `export default {
    id: "${id}",
    name: { ar: "اختبار", en: "Test" },
    description: { ar: "وصف", en: "Description" },
    accent: "blue",
    enabled: ${enabled},
    systemPrompt: "x",
    tools: []
  };`;
}

async function withTempDir(run: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(path.join(tmpdir(), "vrron-assistants-"));
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function addAssistant(dir: string, folder: string, source: string) {
  await mkdir(path.join(dir, folder), { recursive: true });
  await writeFile(path.join(dir, folder, "config.ts"), source);
}

test("real assistants folder: general is registered but not listed to clients", async () => {
  const { configs, issues } = await loadAssistants(realDir);
  assert.deepEqual(issues, []);
  const registry = createRegistry(configs);
  assert.equal(registry.get("general")?.enabled, false);
  assert.deepEqual(registry.list(), []);
});

test("adding a folder with an enabled config makes it appear without touching Core", async () => {
  await withTempDir(async (dir) => {
    await addAssistant(dir, "demo", configSource("demo", true));
    const { configs, issues } = await loadAssistants(dir);
    assert.deepEqual(issues, []);
    const list = createRegistry(configs).list();
    assert.equal(list.length, 1);
    assert.equal(list[0]?.id, "demo");
  });
});

test("disabled assistants are never listed", async () => {
  await withTempDir(async (dir) => {
    await addAssistant(dir, "hidden", configSource("hidden", false));
    const { configs } = await loadAssistants(dir);
    assert.deepEqual(createRegistry(configs).list(), []);
  });
});

test("list() does not leak systemPrompt or tools", async () => {
  await withTempDir(async (dir) => {
    await addAssistant(dir, "demo", configSource("demo", true));
    const { configs } = await loadAssistants(dir);
    const item = createRegistry(configs).list()[0] as Record<string, unknown>;
    assert.equal("systemPrompt" in item, false);
    assert.equal("tools" in item, false);
  });
});

test("invalid config is skipped and reported, others still load", async () => {
  await withTempDir(async (dir) => {
    await addAssistant(dir, "good", configSource("good", true));
    await addAssistant(dir, "bad", `export default { id: "bad" };`);
    const { configs, issues } = await loadAssistants(dir);
    assert.equal(configs.length, 1);
    assert.equal(issues.length, 1);
    assert.match(issues[0]!, /bad: invalid config/);
  });
});

test("id must equal folder name", async () => {
  await withTempDir(async (dir) => {
    await addAssistant(dir, "folder-a", configSource("other-id", true));
    const { configs, issues } = await loadAssistants(dir);
    assert.equal(configs.length, 0);
    assert.match(issues[0]!, /must equal the folder name/);
  });
});

test("folder without config.ts is reported, not fatal", async () => {
  await withTempDir(async (dir) => {
    await mkdir(path.join(dir, "empty"));
    const { configs, issues } = await loadAssistants(dir);
    assert.equal(configs.length, 0);
    assert.match(issues[0]!, /cannot load config\.ts/);
  });
});
