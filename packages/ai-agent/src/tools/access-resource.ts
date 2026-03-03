import { tool } from "ai";
import { z } from "zod";
import type { A2AClient } from "../a2a-client.js";
import type { PurchaseCache } from "./index.js";

export function createAccessResourceTool(
  client: A2AClient,
  cache: PurchaseCache
) {
  return tool({
    description:
      "Request access to a payment-gated resource (API, file, content) via the A2A protocol. Returns a task with payment requirements. IMPORTANT: Always use the exact 'slug' field returned by list_resources (e.g. 'weather-api', 'exclusive-creator-video'). If the resource was already purchased in this session, returns the cached content instead of paying again.",
    parameters: z.object({
      resourceId: z
        .string()
        .describe("The exact resource slug from list_resources"),
    }),
    execute: async ({ resourceId }) => {
      // Check if already purchased — return cached content
      const cached = cache.get(resourceId);
      if (cached) {
        return {
          success: true,
          alreadyPurchased: true,
          taskId: cached.taskId,
          txHash: cached.txHash,
          content: cached.content,
          message: `Already purchased. Returning cached content.`,
        };
      }

      const response = await client.sendMessage({
        action: "access-resource",
        resourceId,
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const task = response.result as any;
      const dataPart = task?.status?.message?.parts?.find(
        (p: any) => p.type === "data"
      );
      const paymentReqs = dataPart?.data?.paymentRequirements;

      return {
        success: true,
        taskId: task.id,
        state: task.status.state,
        paymentRequirements: paymentReqs,
        message: task.status.message?.parts?.find(
          (p: any) => p.type === "text"
        )?.text,
      };
    },
  });
}
