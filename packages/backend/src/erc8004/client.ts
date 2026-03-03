/**
 * ERC-8004 Viem Client Factory
 *
 * Provides singleton PublicClient and WalletClient for interacting
 * with ERC-8004 contracts on BITE V2 Sandbox (zero gas).
 */

import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ERC8004_RPC_URL } from "./config.js";

const biteV2Sandbox = defineChain({
  id: 103698795,
  name: "BITE V2 Sandbox 2",
  network: "bite-v2-sandbox",
  nativeCurrency: { decimals: 18, name: "sFUEL", symbol: "sFUEL" },
  rpcUrls: {
    default: { http: [ERC8004_RPC_URL] },
  },
  testnet: true,
  fees: {
    defaultPriorityFee: () => BigInt(0),
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _publicClient: any = null;

export function getERC8004PublicClient() {
  if (!_publicClient) {
    _publicClient = createPublicClient({
      chain: biteV2Sandbox,
      transport: http(ERC8004_RPC_URL),
    });
  }
  return _publicClient;
}

export function getERC8004WalletClient() {
  const privateKey = process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("No private key configured for ERC-8004 transactions (set WALLET_PRIVATE_KEY or ETH_PRIVATE_KEY)");
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return createWalletClient({
    account,
    chain: biteV2Sandbox,
    transport: http(ERC8004_RPC_URL),
  });
}

export function getERC8004Account() {
  const privateKey = process.env.WALLET_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("No private key configured for ERC-8004 transactions");
  }
  return privateKeyToAccount(privateKey as `0x${string}`);
}
