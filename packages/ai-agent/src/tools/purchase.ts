import { tool } from "ai";
import { z } from "zod";
import type { A2AClient } from "../a2a-client.js";

export function createPurchaseTool(client: A2AClient) {
  return tool({
    description:
      "Initiate a product purchase via the A2A protocol. Sends a purchase action to the merchant agent, which returns a task with payment requirements. You must then use make_onchain_payment to pay, followed by submit_payment_proof to complete the purchase.",
    parameters: z.object({
      storeId: z.string().describe("The store ID"),
      productId: z.string().describe("The product ID to purchase"),
      quantity: z
        .number()
        .optional()
        .describe("Quantity to buy (default 1)"),
    }),
    execute: async ({ storeId, productId, quantity }) => {
      const response = await client.sendMessage({
        action: "purchase",
        storeId,
        productId,
        quantity: quantity || 1,
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
