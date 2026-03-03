import { tool } from "ai";
import { z } from "zod";
import type { A2AClient } from "../a2a-client.js";
import type { PurchaseCache } from "./index.js";

export function createSubmitPaymentTool(
  client: A2AClient,
  cache: PurchaseCache
) {
  return tool({
    description:
      "Submit on-chain payment proof to the merchant agent for verification. Call this after make_onchain_payment succeeds, providing the transaction hash and task ID. The merchant verifies the payment on-chain and completes the task. Returns the resource content if available.",
    parameters: z.object({
      taskId: z
        .string()
        .describe("The A2A task ID from the purchase/access step"),
      transactionHash: z
        .string()
        .describe(
          "The on-chain transaction hash from make_onchain_payment"
        ),
      network: z
        .string()
        .optional()
        .describe("Network (default bite-v2-sandbox)"),
      chainId: z
        .number()
        .optional()
        .describe("Chain ID (default 103698795)"),
    }),
    execute: async ({ taskId, transactionHash, network, chainId }) => {
      const response = await client.sendMessage({
        action: "submit-payment",
        taskId,
        payment: {
          transactionHash,
          network: network || "bite-v2-sandbox",
          chainId: chainId || 103698795,
          timestamp: Date.now(),
        },
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const task = response.result as any;

      // Extract resource content from artifacts
      const resourceArtifact = task.artifacts?.find(
        (a: any) => a.name === "resource-content"
      );
      const resourceData = resourceArtifact?.parts?.find(
        (p: any) => p.type === "data"
      )?.data;

      // Cache the resource content for future requests
      if (resourceData?.resourceId) {
        cache.set(resourceData.resourceId as string, {
          content: resourceData,
          taskId: task.id,
          txHash: transactionHash,
        });
      }

      // Extract text parts from status message
      const statusParts = task.status?.message?.parts || [];
      const resourceContent = statusParts.find(
        (p: any) => p.type === "data" && p.data?.content
      )?.data;

      return {
        success: task.status.state === "completed",
        taskId: task.id,
        state: task.status.state,
        message: statusParts.find((p: any) => p.type === "text")?.text,
        resourceContent: resourceContent || resourceData || null,
        artifacts: task.artifacts,
      };
    },
  });
}
