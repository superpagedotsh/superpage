import { tool } from "ai";
import { z } from "zod";
import type { A2AClient } from "../a2a-client.js";

const AP2_DATA_KEYS = {
  INTENT_MANDATE: "ap2.mandates.IntentMandate",
  PAYMENT_MANDATE: "ap2.mandates.PaymentMandate",
} as const;

export function createAP2MandateTools(client: A2AClient) {
  const sendIntentMandate = tool({
    description:
      "Send an AP2 IntentMandate to the merchant agent for mandate-based shopping. Describe what you want to buy in natural language. The merchant returns a CartMandate with items and total price. Use this as an alternative to browsing+purchasing when you have a general description of what the user wants.",
    parameters: z.object({
      description: z
        .string()
        .describe("Natural language description of what to buy"),
      skus: z
        .array(z.string())
        .optional()
        .describe("Optional product SKUs or IDs to include"),
      userConfirmationRequired: z
        .boolean()
        .optional()
        .describe("Whether user must confirm cart (default true)"),
      expiresInMinutes: z
        .number()
        .optional()
        .describe("How long the intent is valid (default 30)"),
    }),
    execute: async ({
      description,
      skus,
      userConfirmationRequired,
      expiresInMinutes,
    }) => {
      const expiryMs = (expiresInMinutes || 30) * 60 * 1000;

      const response = await client.sendRpc("message/send", {
        message: {
          role: "user",
          parts: [
            {
              type: "data",
              data: {
                [AP2_DATA_KEYS.INTENT_MANDATE]: {
                  natural_language_description: description,
                  user_cart_confirmation_required:
                    userConfirmationRequired ?? true,
                  skus,
                  intent_expiry: new Date(
                    Date.now() + expiryMs
                  ).toISOString(),
                },
              },
            },
          ],
        },
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const task = response.result as any;
      // Extract cart mandate or payment requirements from response
      const dataPart = task?.status?.message?.parts?.find(
        (p: any) => p.type === "data"
      );
      const cartMandate =
        dataPart?.data?.["ap2.mandates.CartMandate"];
      const paymentRequirements =
        dataPart?.data?.paymentRequirements;

      return {
        success: task.status.state !== "failed",
        taskId: task.id,
        state: task.status.state,
        cartMandate,
        paymentRequirements,
        message: task.status.message?.parts?.find(
          (p: any) => p.type === "text"
        )?.text,
      };
    },
  });

  const submitPaymentMandate = tool({
    description:
      "Submit an AP2 PaymentMandate with on-chain payment proof for a cart. Use this after making an on-chain payment for a CartMandate received from send_intent_mandate. The merchant verifies the payment and returns a PaymentReceipt.",
    parameters: z.object({
      taskId: z
        .string()
        .describe("The A2A task ID from the cart creation step"),
      transactionHash: z
        .string()
        .describe("The on-chain transaction hash"),
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
      const response = await client.sendRpc("message/send", {
        message: {
          role: "user",
          parts: [
            {
              type: "data",
              data: {
                [AP2_DATA_KEYS.PAYMENT_MANDATE]: {
                  payment_mandate_contents: {
                    payment_mandate_id: `pm_${Date.now()}`,
                    payment_details_id: taskId,
                    payment_details_total: {
                      label: "Total",
                      amount: { currency: "USD", value: 0 },
                    },
                    payment_response: {
                      request_id: taskId,
                      method_name: "https://www.x402.org/",
                      details: {
                        transactionHash,
                        network:
                          network || "bite-v2-sandbox",
                        chainId: chainId || 103698795,
                        timestamp: Date.now(),
                      },
                    },
                    merchant_agent: "",
                    timestamp: new Date().toISOString(),
                  },
                },
                taskId,
              },
            },
          ],
        },
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const task = response.result as any;
      return {
        success: task.status.state === "completed",
        taskId: task.id,
        state: task.status.state,
        message: task.status.message?.parts?.find(
          (p: any) => p.type === "text"
        )?.text,
        receipt: task.artifacts?.find(
          (a: any) => a.name === "payment-receipt"
        ),
      };
    },
  });

  return { sendIntentMandate, submitPaymentMandate };
}
