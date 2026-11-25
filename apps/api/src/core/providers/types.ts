/**
 * Provider abstraction (interface only).
 * No real AI provider is connected in Phase 1.1. In Phase 2 each provider
 * implements this interface, so the Core never depends on one vendor.
 */
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProviderRequest = {
  messages: ChatMessage[];
  model?: string;
  signal?: AbortSignal;
};

export type ProviderChunk = { type: "text"; text: string } | { type: "done" };

export type AIProvider = {
  readonly id: string;
  stream(request: ProviderRequest): AsyncIterable<ProviderChunk>;
};
