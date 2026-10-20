import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "@/lib/env";

export const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});

export const model = "nvidia/nemotron-3.5-lightning:free";
