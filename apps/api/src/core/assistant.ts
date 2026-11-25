import type { AssistantAccent, LocalizedText } from "@vrron/contract";

/**
 * Full server-side definition of an assistant. Clients only ever see the
 * summary (see registry.ts); systemPrompt and tools never leave the server.
 */
export type AssistantConfig = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  accent: AssistantAccent;
  /** Only enabled assistants are listed to clients. */
  enabled: boolean;
  systemPrompt: string;
  /** Tool ids this assistant may use (tools are implemented in Phase 2). */
  tools: string[];
};

export type ValidationResult =
  | { ok: true; config: AssistantConfig }
  | { ok: false; error: string };

const ID_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;
const ACCENTS = ["violet", "blue"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isLocalizedText(value: unknown): value is LocalizedText {
  return isRecord(value) && isNonEmptyString(value.ar) && isNonEmptyString(value.en);
}

export function validateAssistantConfig(value: unknown): ValidationResult {
  if (!isRecord(value)) return { ok: false, error: "config must be an object" };
  if (typeof value.id !== "string" || !ID_PATTERN.test(value.id)) {
    return { ok: false, error: "id must match /^[a-z][a-z0-9-]{1,31}$/" };
  }
  if (!isLocalizedText(value.name)) return { ok: false, error: "name needs non-empty ar and en" };
  if (!isLocalizedText(value.description)) {
    return { ok: false, error: "description needs non-empty ar and en" };
  }
  if (typeof value.accent !== "string" || !ACCENTS.includes(value.accent)) {
    return { ok: false, error: `accent must be one of: ${ACCENTS.join(", ")}` };
  }
  if (typeof value.enabled !== "boolean") return { ok: false, error: "enabled must be boolean" };
  if (typeof value.systemPrompt !== "string") return { ok: false, error: "systemPrompt must be a string" };
  if (!Array.isArray(value.tools) || !value.tools.every((t) => typeof t === "string")) {
    return { ok: false, error: "tools must be an array of strings" };
  }
  return { ok: true, config: value as AssistantConfig };
}
