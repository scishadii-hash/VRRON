import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validateAssistantConfig } from "./assistant.ts";
import type { AssistantConfig } from "./assistant.ts";

export type LoadResult = {
  configs: AssistantConfig[];
  /** Human-readable problems; a bad assistant is skipped, never fatal. */
  issues: string[];
};

/**
 * Auto-discovers assistants: every sub-folder of `dir` that contains a
 * `config.ts` with a default export is one assistant. The folder name must
 * equal the assistant id. Adding an assistant never touches Core code.
 */
export async function loadAssistants(dir: string): Promise<LoadResult> {
  const configs: AssistantConfig[] = [];
  const issues: string[] = [];
  const seen = new Set<string>();

  const entries = (await readdir(dir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const file = path.join(dir, entry.name, "config.ts");
    let loaded: unknown;
    try {
      const module = (await import(pathToFileURL(file).href)) as { default?: unknown };
      loaded = module.default;
    } catch (error) {
      issues.push(`${entry.name}: cannot load config.ts (${(error as Error).message})`);
      continue;
    }

    const result = validateAssistantConfig(loaded);
    if (!result.ok) {
      issues.push(`${entry.name}: invalid config (${result.error})`);
      continue;
    }
    if (result.config.id !== entry.name) {
      issues.push(`${entry.name}: id "${result.config.id}" must equal the folder name`);
      continue;
    }
    if (seen.has(result.config.id)) {
      issues.push(`${entry.name}: duplicate id "${result.config.id}"`);
      continue;
    }
    seen.add(result.config.id);
    configs.push(result.config);
  }

  return { configs, issues };
}
