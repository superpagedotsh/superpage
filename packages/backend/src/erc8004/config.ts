/**
 * ERC-8004 Configuration
 *
 * Contract addresses and chain config for the ERC-8004 Trustless Agents
 * registries deployed on BITE V2 Sandbox (zero gas).
 */

export const ERC8004_CHAIN_ID = 103698795;
export const ERC8004_NETWORK = "bite-v2-sandbox" as const;
export const ERC8004_RPC_URL = "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox";
export const ERC8004_EXPLORER_URL = "https://base-sepolia-testnet-explorer.skalenodes.com:10032";

export const ERC8004_CONTRACTS = {
  identityRegistry: "0xa059e27967e5a573a14a62c706ebd1be75333f9a" as `0x${string}`,
  reputationRegistry: "0x11c2dfed5b71a60a4a9a22b2aedca64d5132ea7c" as `0x${string}`,
  validationRegistry: "0x9815dba34c266dc8be4687ff86247a17e7c63c78" as `0x${string}`,
} as const;

export const ERC8004_EXTENSION_URI = "urn:eip:8004:trustless-agents";

export interface ERC8004Config {
  agentId: bigint | null;
  registrationUri: string;
  walletPrivateKey: string | undefined;
}

export function getERC8004Config(): ERC8004Config {
  const baseUrl = process.env.APP_URL || "http://localhost:3001";
  return {
    agentId: process.env.ERC8004_AGENT_ID ? BigInt(process.env.ERC8004_AGENT_ID) : null,
    registrationUri: process.env.ERC8004_REGISTRATION_URI || `${baseUrl}/.well-known/agent-registration.json`,
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY,
  };
}
