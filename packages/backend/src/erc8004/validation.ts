/**
 * ERC-8004 Validation Registry Module
 *
 * Provides functions to request and query validation results
 * via the ValidationRegistry contract on Base Sepolia.
 */

import type { Address, Hash } from "viem";
import { getERC8004PublicClient, getERC8004WalletClient } from "./client.js";
import { ERC8004_CONTRACTS } from "./config.js";
import { VALIDATION_REGISTRY_ABI } from "./abis/ValidationRegistry.js";
import type { ValidationStatus, ValidationSummary } from "./types.js";

/**
 * Request validation from a specific validator.
 * Only the agent owner/operator can call this.
 */
export async function requestValidation(
  validatorAddress: Address,
  agentId: bigint,
  requestURI: string,
  requestHash: `0x${string}`,
): Promise<Hash> {
  const walletClient = getERC8004WalletClient();
  return walletClient.writeContract({
    address: ERC8004_CONTRACTS.validationRegistry,
    abi: VALIDATION_REGISTRY_ABI,
    functionName: "validationRequest",
    args: [validatorAddress, agentId, requestURI, requestHash],
  });
}

/**
 * Respond to a validation request.
 * Only the designated validator can call this.
 */
export async function respondToValidation(
  requestHash: `0x${string}`,
  response: number,
  responseURI: string,
  responseHash: `0x${string}`,
  tag: string,
): Promise<Hash> {
  const walletClient = getERC8004WalletClient();
  return walletClient.writeContract({
    address: ERC8004_CONTRACTS.validationRegistry,
    abi: VALIDATION_REGISTRY_ABI,
    functionName: "validationResponse",
    args: [requestHash, response, responseURI, responseHash, tag],
  });
}

/**
 * Get the status of a validation request.
 */
export async function getValidationStatus(requestHash: `0x${string}`): Promise<ValidationStatus> {
  const publicClient = getERC8004PublicClient();
  const result = await publicClient.readContract({
    address: ERC8004_CONTRACTS.validationRegistry,
    abi: VALIDATION_REGISTRY_ABI,
    functionName: "getValidationStatus",
    args: [requestHash],
  });

  return {
    validatorAddress: result[0],
    agentId: result[1],
    response: result[2],
    responseHash: result[3],
    tag: result[4],
    lastUpdate: result[5],
  };
}

/**
 * Get validation summary for an agent.
 */
export async function getValidationSummary(
  agentId: bigint,
  validatorAddresses: Address[] = [],
  tag = "",
): Promise<ValidationSummary> {
  const publicClient = getERC8004PublicClient();
  const result = await publicClient.readContract({
    address: ERC8004_CONTRACTS.validationRegistry,
    abi: VALIDATION_REGISTRY_ABI,
    functionName: "getSummary",
    args: [agentId, validatorAddresses, tag],
  });

  return {
    count: Number(result[0]),
    avgResponse: result[1],
  };
}

/**
 * Get all validation request hashes for an agent.
 */
export async function getAgentValidations(agentId: bigint): Promise<`0x${string}`[]> {
  const publicClient = getERC8004PublicClient();
  const result = await publicClient.readContract({
    address: ERC8004_CONTRACTS.validationRegistry,
    abi: VALIDATION_REGISTRY_ABI,
    functionName: "getAgentValidations",
    args: [agentId],
  });
  return [...result];
}

/**
 * Get all validation request hashes assigned to a validator.
 */
export async function getValidatorRequests(validatorAddress: Address): Promise<`0x${string}`[]> {
  const publicClient = getERC8004PublicClient();
  const result = await publicClient.readContract({
    address: ERC8004_CONTRACTS.validationRegistry,
    abi: VALIDATION_REGISTRY_ABI,
    functionName: "getValidatorRequests",
    args: [validatorAddress],
  });
  return [...result];
}
