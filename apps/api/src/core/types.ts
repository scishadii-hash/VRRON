/**
 * Transport-neutral request/response used by the Core.
 * The HTTP layer (node:http today, Hono later) converts to and from these,
 * so Core logic never depends on a web framework.
 */
export type CoreRequest = {
  method: string;
  path: string;
};

export type CoreResponse = {
  status: number;
  headers?: Record<string, string>;
  body: unknown;
};
