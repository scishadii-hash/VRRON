import { fileURLToPath } from "node:url";
import { createHttpServer } from "./http/adapter.ts";
import { loadAssistants } from "./core/loadAssistants.ts";
import { createRegistry } from "./core/registry.ts";
import { VERSION } from "./core/version.ts";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const assistantsDir = fileURLToPath(new URL("./assistants", import.meta.url));
const { configs, issues } = await loadAssistants(assistantsDir);
for (const issue of issues) console.warn(`[assistants] skipped: ${issue}`);

const registry = createRegistry(configs);
const server = createHttpServer({ registry, version: VERSION });

server.listen(port, host, () => {
  console.log(
    `VRRON Core ${VERSION} listening on http://${host}:${port} ` +
      `(${configs.length} assistant(s) registered, ${registry.list().length} enabled)`,
  );
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down.`);
  server.close(() => process.exit(0));
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
