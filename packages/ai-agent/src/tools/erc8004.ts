/**
 * ERC-8004 Trustless Agent tools for the buyer agent.
 * Enables on-chain identity, reputation checking, and feedback.
 */
import { tool } from "ai";
import { z } from "zod";
import { ERC8004Client } from "../erc8004/index.js";
import * as ui from "../ui.js";

export function createERC8004Tools(erc8004: ERC8004Client) {
  const register_identity = tool({
    description:
      "Register this agent on the ERC-8004 Identity Registry. This creates an on-chain identity (NFT) for the agent. Only needs to be done once. Returns the agentId which should be saved.",
    parameters: z.object({
      agentURI: z
        .string()
        .optional()
        .describe(
          "Optional URI pointing to the agent's registration file (e.g. https://example.com/.well-known/agent-registration.json)"
        ),
    }),
    execute: async ({ agentURI }) => {
      try {
        ui.hint("Registering on-chain identity...");
        const { agentId, txHash } = await erc8004.registerAgent(agentURI);
        ui.hint(`Registered! Agent ID: ${agentId.toString()}`);
        return {
          success: true,
          agentId: agentId.toString(),
          txHash,
          message: `Successfully registered on-chain. Your Agent ID is ${agentId.toString()}. Save this as ERC8004_AGENT_ID in your .env file.`,
        };
      } catch (err: any) {
        return { success: false, error: `Registration failed: ${err.message}` };
      }
    },
  });

  const lookup_agent = tool({
    description:
      "Look up an agent's on-chain identity by their Agent ID. Returns the owner address, registration URI, and payment wallet.",
    parameters: z.object({
      agentId: z
        .string()
        .describe("The numeric Agent ID to look up (e.g. '1', '42')"),
    }),
    execute: async ({ agentId }) => {
      try {
        const id = BigInt(agentId);
        const info = await erc8004.getAgentInfo(id);
        return {
          success: true,
          agentId: info.agentId.toString(),
          owner: info.owner,
          agentURI: info.agentURI,
          agentWallet: info.agentWallet,
        };
      } catch (err: any) {
        return {
          success: false,
          error: `Agent lookup failed: ${err.message}`,
        };
      }
    },
  });

  const check_reputation = tool({
    description:
      "Check an agent's on-chain reputation. Returns the number of feedback entries and average rating. Use this before making large purchases to verify merchant trustworthiness.",
    parameters: z.object({
      agentId: z
        .string()
        .describe("The Agent ID to check reputation for"),
      includeFeedback: z
        .boolean()
        .optional()
        .describe(
          "If true, also returns individual feedback entries (default false)"
        ),
    }),
    execute: async ({ agentId, includeFeedback }) => {
      try {
        const id = BigInt(agentId);
        const summary = await erc8004.getReputationSummary(id);

        const result: Record<string, unknown> = {
          success: true,
          agentId,
          feedbackCount: summary.count,
          totalScore: summary.summaryValue.toString(),
          averageScore:
            summary.count > 0
              ? (
                  Number(summary.summaryValue) /
                  10 ** summary.summaryValueDecimals /
                  summary.count
                ).toFixed(1)
              : "N/A",
        };

        if (includeFeedback && summary.count > 0) {
          const entries = await erc8004.getAllFeedback(id);
          result.feedback = entries.map((e) => ({
            from: e.clientAddress,
            value: e.value.toString(),
            tag1: e.tag1 || undefined,
            tag2: e.tag2 || undefined,
            revoked: e.isRevoked || undefined,
          }));
        }

        return result;
      } catch (err: any) {
        return {
          success: false,
          error: `Reputation check failed: ${err.message}`,
        };
      }
    },
  });

  const leave_feedback = tool({
    description:
      "Leave on-chain feedback for a merchant agent after a purchase. The value is a rating: 1 (bad) to 5 (excellent). Tags can categorize the feedback (e.g. 'quality', 'speed').",
    parameters: z.object({
      agentId: z
        .string()
        .describe("The merchant's Agent ID to leave feedback for"),
      rating: z
        .number()
        .min(1)
        .max(5)
        .describe("Rating from 1 (bad) to 5 (excellent)"),
      tag1: z
        .string()
        .optional()
        .describe("Primary tag (e.g. 'quality', 'reliability', 'speed')"),
      tag2: z
        .string()
        .optional()
        .describe("Secondary tag (e.g. 'api', 'product', 'resource')"),
    }),
    execute: async ({ agentId, rating, tag1, tag2 }) => {
      try {
        ui.hint(`Submitting feedback (${rating}/5) for agent ${agentId}...`);
        const txHash = await erc8004.giveFeedback(
          BigInt(agentId),
          rating,
          tag1 || "",
          tag2 || ""
        );
        return {
          success: true,
          agentId,
          rating,
          txHash,
          message: `Feedback submitted: ${rating}/5 for agent ${agentId}`,
        };
      } catch (err: any) {
        return {
          success: false,
          error: `Feedback submission failed: ${err.message}`,
        };
      }
    },
  });

  const check_validations = tool({
    description:
      "Check if a merchant agent has been validated by third-party validators. Returns the number of validations and average response score. Higher scores indicate more trusted agents.",
    parameters: z.object({
      agentId: z
        .string()
        .describe("The Agent ID to check validations for"),
    }),
    execute: async ({ agentId }) => {
      try {
        const id = BigInt(agentId);
        const summary = await erc8004.getValidationSummary(id);

        let validationDetails: unknown[] = [];
        if (summary.count > 0) {
          const hashes = await erc8004.getValidationHashes(id);
          const details = await Promise.all(
            hashes.slice(0, 5).map((h) => erc8004.getValidationStatus(h))
          );
          validationDetails = details.map((d) => ({
            validator: d.validatorAddress,
            response: d.response,
            tag: d.tag || undefined,
          }));
        }

        return {
          success: true,
          agentId,
          validationCount: summary.count,
          avgResponse: summary.avgResponse,
          validations: validationDetails.length > 0 ? validationDetails : undefined,
        };
      } catch (err: any) {
        return {
          success: false,
          error: `Validation check failed: ${err.message}`,
        };
      }
    },
  });

  return {
    register_identity,
    lookup_agent,
    check_reputation,
    leave_feedback,
    check_validations,
  };
}
