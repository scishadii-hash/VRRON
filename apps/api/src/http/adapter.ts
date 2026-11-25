import { createServer } from "node:http";
import type { Server } from "node:http";
import { handleRequest } from "../core/router.ts";
import type { CoreDeps } from "../core/router.ts";

const BASE_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

/** Thin node:http adapter. All behavior lives in core/router.ts. */
export function createHttpServer(deps: CoreDeps): Server {
  return createServer((req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const response = handleRequest({ method: req.method ?? "GET", path: url.pathname }, deps);
      res.writeHead(response.status, { ...BASE_HEADERS, ...response.headers });
      res.end(JSON.stringify(response.body));
    } catch (error) {
      console.error("Unhandled error while handling request:", error);
      res.writeHead(500, BASE_HEADERS);
      res.end(JSON.stringify({ error: { code: "internal_error", message: "Something went wrong." } }));
    }
  });
}
