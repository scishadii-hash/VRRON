import type { AssistantSummary } from "@vrron/contract";
import type { AssistantConfig } from "./assistant.ts";

export type Registry = {
  /** Enabled assistants only, safe to send to clients. */
  list(): AssistantSummary[];
  /** Any registered assistant (enabled or not), for server-side use. */
  get(id: string): AssistantConfig | undefined;
};

export function createRegistry(configs: AssistantConfig[]): Registry {
  const byId = new Map(configs.map((config) => [config.id, config]));

  return {
    list() {
      return [...byId.values()]
        .filter((config) => config.enabled)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(({ id, name, description, accent }) => ({ id, name, description, accent }));
    },
    get(id) {
      return byId.get(id);
    },
  };
}
