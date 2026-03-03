/**
 * ERC-8004 Reputation Registry Module
 *
 * Provides functions to submit, read, and manage reputation feedback
 * for agents via the ReputationRegistry contract on Base Sepolia.
 */

import type { Address, Hash } from "viem";
import { getERC8004PublicClient, getERC8004WalletClient } from "./client.js";
import { ERC8004_CONTRACTS } from "./config.js";
import { REPUTATION_REGISTRY_ABI } from "./abis/ReputationRegistry.js";
import type {
  GiveFeedbackParams,
  FeedbackResult,
  FeedbackEntry,
  ReputationSummary,
} from "./types.js";

const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

/**
 * Submit reputation feedback for an agent.
 * The caller (msg.sender) must NOT be the agent owner/operator.
 */
export async function giveFeedback(params: GiveFeedbackParams): Promise<Hash> {
  const walletClient = getERC8004WalletClient();
  return walletClient.writeContract({
    address: ERC8004_CONTRACTS.reputationRegistry,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "giveFeedback",
    args: [
      params.agentId,
      BigInt(params.value),
      params.valueDecimals ?? 0,
      params.tag1 ?? "",
      params.tag2 ?? "",
      params.endpoint ?? "",
      params.feedbackURI ?? "",
      params.feedbackHash ?? ZERO_BYTES32,
    ],
  });
}

/**
 * Revoke previously submitted feedback.
 * Only the original feedback submitter can revoke.
 */
export async function revokeFeedback(agentId: bigint, feedbackIndex: number): Promise<Hash> {
  const walletClient = getERC8004WalletClient();
  return walletClient.writeContract({
    address: ERC8004_CONTRACTS.reputationRegistry,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "revokeFeedback",
    args: [agentId, BigInt(feedbackIndex)],
  });
}

/**
 * Append a response to existing feedback.
 */
export async function appendResponse(
  agentId: bigint,
  clientAddress: Address,
  feedbackIndex: number,
  responseURI: string,
  responseHash: `0x${string}` = ZERO_BYTES32,
): Promise<Hash> {
  const walletClient = getERC8004WalletClient();
  return walletClient.writeContract({
    address: ERC8004_CONTRACTS.reputationRegistry,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "appendResponse",
    args: [agentId, clientAddress, BigInt(feedbackIndex), responseURI, responseHash],
  });
}

/**
 * Read a specific feedback entry.
 */
export async function readFeedback(
  agentId: bigint,
  clientAddress: Address,
  feedbackIndex: number,
): Promise<FeedbackResult> {
  const publicClient = getERC8004PublicClient();
  const result = await publicClient.readContract({
    address: ERC8004_CONTRACTS.reputationRegistry,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "readFeedback",
    args: [agentId, clientAddress, BigInt(feedbackIndex)],
  });

  return {
    value: result[0],
    valueDecimals: result[1],
    tag1: result[2],
    tag2: result[3],
    isRevoked: result[4],
  };
}

/**
 * Read all feedback entries for an agent, optionally filtered.
 */
export async function readAllFeedback(
  agentId: bigint,
  clientAddresses: Address[],
  tag1 = "",
  tag2 = "",
  includeRevoked = false,
): Promise<FeedbackEntry[]> {
  const publicClient = getERC8004PublicClient();
  const result = await publicClient.readContract({
    address: ERC8004_CONTRACTS.reputationRegistry,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "readAllFeedback",
    args: [agentId, clientAddresses, tag1, tag2, includeRevoked],
  });

  const [clients, feedbackIndexes, values, valueDecimalsArr, tag1s, tag2s, revokedStatuses] = result;
  const entries: FeedbackEntry[] = [];

  for (let i = 0; i < clients.length; i++) {
    entries.push({
      clientAddress: clients[i],
      feedbackIndex: Number(feedbackIndexes[i]),
      value: values[i],
      valueDecimals: valueDecimalsArr[i],
      tag1: tag1s[i],
      tag2: tag2s[i],
      isRevoked: revokedStatuses[i],
    });
  }

  return entries;
}

/**
 * Get reputation summary for an agent.
 * clientAddresses is required by the contract for anti-Sybil filtering.
 * Pass an empty array to get an unfiltered summary (returns all clients' feedback).
 */
export async function getReputationSummary(
  agentId: bigint,
  clientAddresses: Address[] = [],
  tag1 = "",
  tag2 = "",
): Promise<ReputationSummary> {
  const publicClient = getERC8004PublicClient();

  // If no client addresses provided, first fetch all clients
  let addresses = clientAddresses;
  if (addresses.length === 0) {
    addresses = await getClients(agentId);
  }

  if (addresses.length === 0) {
    return { count: 0, summaryValue: 0n, summaryValueDecimals: 0 };
  }

  const result = await publicClient.readContract({
    address: ERC8004_CONTRACTS.reputationRegistry,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "getSummary",
    args: [agentId, addresses, tag1, tag2],
  });

  return {
    count: Number(result[0]),
    summaryValue: result[1],
    summaryValueDecimals: result[2],
  };
}

/**
 * Get all client addresses that have left feedback for an agent.
 */
export async function getClients(agentId: bigint): Promise<Address[]> {
  const publicClient = getERC8004PublicClient();
  const result = await publicClient.readContract({
    address: ERC8004_CONTRACTS.reputationRegistry,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "getClients",
    args: [agentId],
  });
  return [...result];
}

/**
 * Get the last feedback index for a specific client-agent pair.
 */
export async function getLastIndex(agentId: bigint, clientAddress: Address): Promise<number> {
  const publicClient = getERC8004PublicClient();
  const result = await publicClient.readContract({
    address: ERC8004_CONTRACTS.reputationRegistry,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "getLastIndex",
    args: [agentId, clientAddress],
  });
  return Number(result);
}
