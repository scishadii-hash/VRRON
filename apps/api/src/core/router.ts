import type { ApiErrorResponse, AssistantsResponse, HealthResponse } from "@vrron/contract";
import type { Registry } from "./registry.ts";
import type { CoreRequest, CoreResponse } from "./types.ts";

export type CoreDeps = {
  registry: Registry;
  version: string;
  now?: () => Date;
};

function error(status: number, code: string, message: string, headers?: Record<string, string>): CoreResponse {
  const body: ApiErrorResponse = { error: { code, message } };
  return headers ? { status, headers, body } : { status, body };
}

/** Pure function: no I/O, no framework. Easy to test and to host anywhere. */
export function handleRequest(request: CoreRequest, deps: CoreDeps): CoreResponse {
  const path = request.path.length > 1 ? request.path.replace(/\/+$/, "") : request.path;
  const known = path === "/health" || path === "/assistants";

  if (!known) return error(404, "not_found", "Route not found.");
  if (request.method !== "GET") {
    return error(405, "method_not_allowed", "Only GET is supported for this route.", { allow: "GET" });
  }

  if (path === "/health") {
    const body: HealthResponse = {
      status: "ok",
      service: "vrron-core",
      version: deps.version,
      timestamp: (deps.now ? deps.now() : new Date()).toISOString(),
    };
    return { status: 200, body };
  }

  const body: AssistantsResponse = { assistants: deps.registry.list() };
  return { status: 200, body };
}
