/**
 * ERC-8004 Identity Registry Module
 *
 * Provides functions to register agents, manage on-chain identity,
 * and interact with the IdentityRegistry contract on Base Sepolia.
 */

import type { Address, Hash } from "viem";
import { decodeEventLog, toHex } from "viem";
import { getERC8004PublicClient, getERC8004WalletClient } from "./client.js";
import { ERC8004_CONTRACTS } from "./config.js";
import { IDENTITY_REGISTRY_ABI } from "./abis/IdentityRegistry.js";
import type { AgentRegistrationResult, AgentInfo } from "./types.js";

/**
 * Register a new agent on the Identity Registry.
 * Mints an ERC-721 identity NFT and sets agentWallet to msg.sender.
 */
export async function registerAgent(agentURI?: string): Promise<AgentRegistrationResult> {
  const walletClient = getERC8004WalletClient();
  const publicClient = getERC8004PublicClient();

  let txHash: Hash;
  if (agentURI) {
    txHash = await walletClient.writeContract({
      address: ERC8004_CONTRACTS.identityRegistry,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "register",
      args: [agentURI],
    });
  } else {
    txHash = await walletClient.writeContract({
      address: ERC8004_CONTRACTS.identityRegistry,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "register",
      args: [],
    });
  }

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  // Parse the Registered event to get the agentId
  let agentId = 0n;
  for (const log of receipt.logs) {
    try {
      const event = decodeEventLog({
        abi: IDENTITY_REGISTRY_ABI,
        data: log.data,
        topics: log.topics,
      });
      if (event.eventName === "Registered") {
        agentId = (event.args as { agentId: bigint }).agentId;
        break;
      }
    } catch {
      // Not a matching event, skip
    }
  }

  return {
    agentId,
    txHash,
    owner: walletClient.account.address,
  };
}

/**
 * Get the registration URI (tokenURI) for an agent.
 */
export async function getAgentURI(agentId: bigint): Promise<string> {
  const publicClient = getERC8004PublicClient();
  return publicClient.readContract({
    address: ERC8004_CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "tokenURI",
    args: [agentId],
  });
}

/**
 * Update the registration URI for an agent.
 */
export async function setAgentURI(agentId: bigint, newURI: string): Promise<Hash> {
  const walletClient = getERC8004WalletClient();
  return walletClient.writeContract({
    address: ERC8004_CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "setAgentURI",
    args: [agentId, newURI],
  });
}

/**
 * Get the verified payment wallet for an agent.
 */
export async function getAgentWallet(agentId: bigint): Promise<Address> {
  const publicClient = getERC8004PublicClient();
  return publicClient.readContract({
    address: ERC8004_CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "getAgentWallet",
    args: [agentId],
  });
}

/**
 * Get the owner (NFT holder) of an agent identity.
 */
export async function getAgentOwner(agentId: bigint): Promise<Address> {
  const publicClient = getERC8004PublicClient();
  return publicClient.readContract({
    address: ERC8004_CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "ownerOf",
    args: [agentId],
  });
}

/**
 * Read on-chain metadata for an agent.
 */
export async function getAgentMetadata(agentId: bigint, key: string): Promise<string> {
  const publicClient = getERC8004PublicClient();
  const raw = await publicClient.readContract({
    address: ERC8004_CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "getMetadata",
    args: [agentId, key],
  });
  // Decode bytes to UTF-8 string
  return Buffer.from(raw.slice(2), "hex").toString("utf-8");
}

/**
 * Set on-chain metadata for an agent.
 */
export async function setAgentMetadata(agentId: bigint, key: string, value: string): Promise<Hash> {
  const walletClient = getERC8004WalletClient();
  return walletClient.writeContract({
    address: ERC8004_CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "setMetadata",
    args: [agentId, key, toHex(value)],
  });
}

/**
 * Check if an agent ID is registered (exists on-chain).
 */
export async function isAgentRegistered(agentId: bigint): Promise<boolean> {
  try {
    await getAgentOwner(agentId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get full agent info (URI, owner, wallet) in a single call.
 */
export async function getAgentInfo(agentId: bigint): Promise<AgentInfo> {
  const [owner, agentURI, agentWallet] = await Promise.all([
    getAgentOwner(agentId),
    getAgentURI(agentId),
    getAgentWallet(agentId),
  ]);

  return { agentId, owner, agentURI, agentWallet };
}
