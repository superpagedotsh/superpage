import { tool } from "ai";
import { z } from "zod";
import type { A2AClient } from "../a2a-client.js";

export function createDiscoverTool(client: A2AClient) {
  return tool({
    description:
      "Discover a merchant agent by fetching its AgentCard. Call this first to learn what the merchant can do, what skills it supports, and what payment networks/tokens it accepts.",
    parameters: z.object({}),
    execute: async () => {
      const card = await client.getAgentCard();
      return {
        name: card.name,
        description: card.description,
        url: card.url,
        version: card.version,
        skills: card.skills,
        extensions: card.extensions,
        provider: card.provider,
      };
    },
  });
}
