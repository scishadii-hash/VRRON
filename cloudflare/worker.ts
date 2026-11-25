const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...HEADERS, ...extra },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.length > 1 ? url.pathname.replace(/\\/+$/, "") : url.pathname;

    if (path !== "/health" && path !== "/assistants") {
      return json({ error: { code: "not_found", message: "Route not found." } }, 404);
    }
    if (request.method !== "GET") {
      return json({ error: { code: "method_not_allowed", message: "Only GET is supported for this route." } }, 405, { allow: "GET" });
    }
    if (path === "/health") {
      return json({ status: "ok", service: "vrron-core", version: "0.1.0", timestamp: new Date().toISOString() });
    }
    // Current assistant configs rely on Node filesystem discovery and are not
    // bundled into this Worker adapter yet; never advertise nonexistent bots.
    return json({ assistants: [] });
  },
};
