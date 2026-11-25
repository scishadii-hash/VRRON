import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createHttpServer } from "../src/http/adapter.ts";
import { createRegistry } from "../src/core/registry.ts";
import { handleRequest } from "../src/core/router.ts";

const registry = createRegistry([
  {
    id: "demo",
    name: { ar: "تجربة", en: "Demo" },
    description: { ar: "وصف", en: "Description" },
    accent: "violet",
    enabled: true,
    systemPrompt: "secret",
    tools: ["web_search"],
  },
  {
    id: "off",
    name: { ar: "مغلق", en: "Off" },
    description: { ar: "وصف", en: "Description" },
    accent: "blue",
    enabled: false,
    systemPrompt: "secret",
    tools: [],
  },
]);

let server: Server;
let base = "";

before(async () => {
  server = createHttpServer({ registry, version: "test", now: () => new Date("2026-01-01T00:00:00Z") });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("GET /health returns ok", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /application\/json/);
  assert.deepEqual(await res.json(), {
    status: "ok",
    service: "vrron-core",
    version: "test",
    timestamp: "2026-01-01T00:00:00.000Z",
  });
});

test("GET /assistants lists only enabled assistants without secrets", async () => {
  const res = await fetch(`${base}/assistants`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as { assistants: Array<Record<string, unknown>> };
  assert.equal(body.assistants.length, 1);
  assert.equal(body.assistants[0]?.id, "demo");
  assert.equal("systemPrompt" in body.assistants[0]!, false);
});

test("trailing slash is accepted", async () => {
  const res = await fetch(`${base}/health/`);
  assert.equal(res.status, 200);
});

test("unknown route returns 404 with the error shape", async () => {
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: { code: "not_found", message: "Route not found." } });
});

test("non-GET on a known route returns 405 with Allow header", async () => {
  const res = await fetch(`${base}/health`, { method: "POST" });
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("allow"), "GET");
});

test("Core works without any HTTP layer", () => {
  const res = handleRequest({ method: "GET", path: "/assistants" }, { registry, version: "x" });
  assert.equal(res.status, 200);
});
