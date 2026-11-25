import type { AssistantConfig } from "../../core/assistant.ts";

/**
 * VRRON General — registered but NOT enabled in Phase 1.1.
 * It is built in Phase 3; until then it must not appear to any client.
 */
const config: AssistantConfig = {
  id: "general",
  name: { ar: "VRRON General", en: "VRRON General" },
  description: {
    ar: "المساعد العام لمنظومة VRRON",
    en: "The general-purpose assistant of the VRRON ecosystem",
  },
  accent: "violet",
  enabled: false,
  systemPrompt: "DRAFT: the final prompt is written in Phase 3.",
  tools: [],
};

export default config;
