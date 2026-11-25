/**
 * VRRON API contract (v1).
 * Types only. Every client (Android app, web, future interfaces) and the Core
 * agree on these shapes. Keep this package free of runtime code.
 */

export type LocalizedText = {
  ar: string;
  en: string;
};

export type AssistantAccent = "violet" | "blue";

/** What a client is allowed to know about an assistant. */
export type AssistantSummary = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  accent: AssistantAccent;
};

/** GET /health */
export type HealthResponse = {
  status: "ok";
  service: "vrron-core";
  version: string;
  timestamp: string;
};

/** GET /assistants — only assistants that are enabled. */
export type AssistantsResponse = {
  assistants: AssistantSummary[];
};

/** Every non-2xx response uses this shape. */
export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};
