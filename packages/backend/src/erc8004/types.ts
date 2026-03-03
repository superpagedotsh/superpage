/**
 * ERC-8004 Trustless Agents — Shared Types
 */

import type { Address, Hash } from "viem";

// ============================================================
// Registration File (ERC-8004 spec)
// ============================================================

export interface RegistrationFileService {
  name: string;
  endpoint: string;
  version?: string;
  skills?: string[];
  domains?: string[];
}

export interface RegistrationFileEntry {
  agentId: number;
  agentRegistry: string; // "eip155:{chainId}:{identityRegistryAddress}"
}

export interface RegistrationFile {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";
  name: string;
  description: string;
  image?: string;
  services: RegistrationFileService[];
  x402Support: boolean;
  active: boolean;
  registrations: RegistrationFileEntry[];
  supportedTrust: string[];
}

// ============================================================
// Identity
// ============================================================

export interface AgentRegistrationResult {
  agentId: bigint;
  txHash: Hash;
  owner: Address;
}

export interface AgentInfo {
  agentId: bigint;
  owner: Address;
  agentURI: string;
  agentWallet: Address;
}

// ============================================================
// Reputation
// ============================================================

export interface GiveFeedbackParams {
  agentId: bigint;
  value: number;
  valueDecimals?: number;
  tag1?: string;
  tag2?: string;
  endpoint?: string;
  feedbackURI?: string;
  feedbackHash?: `0x${string}`;
}

export interface FeedbackResult {
  value: bigint;
  valueDecimals: number;
  tag1: string;
  tag2: string;
  isRevoked: boolean;
}

export interface FeedbackEntry extends FeedbackResult {
  clientAddress: Address;
  feedbackIndex: number;
}

export interface ReputationSummary {
  count: number;
  summaryValue: bigint;
  summaryValueDecimals: number;
}

// ============================================================
// Validation
// ============================================================

export interface ValidationStatus {
  validatorAddress: Address;
  agentId: bigint;
  response: number;
  responseHash: `0x${string}`;
  tag: string;
  lastUpdate: bigint;
}

export interface ValidationSummary {
  count: number;
  avgResponse: number;
}
