import { tool } from "ai";
import { z } from "zod";
import type { Address } from "viem";
import type { Wallet } from "../wallet.js";
import * as ui from "../ui.js";

export function createMakePaymentTool(
  wallet: Wallet,
  _opts: { autoApprove?: boolean } = {}
) {
  return tool({
    description:
      "Execute an on-chain USDC payment on BITE V2 Sandbox. Transfers real tokens from the agent's wallet to the merchant. Use after receiving payment requirements. Returns the transaction hash needed for submit_payment_proof. Amounts are in base units (6 decimals: 1000000 = $1.00 USDC).",
    parameters: z.object({
      payTo: z
        .string()
        .describe("Recipient address (from paymentRequirements.payTo)"),
      amount: z
        .string()
        .describe("Amount in base units (from paymentRequirements.amount)"),
    }),
    execute: async ({ payTo, amount }) => {
      try {
        const balance = await wallet.getUsdcBalance();
        const displayAmount = wallet.formatUsdc(amount);

        if (parseFloat(balance) < parseFloat(displayAmount)) {
          ui.paymentFailed(
            `Insufficient balance. Have: ${balance}, Need: ${displayAmount}`
          );
          return {
            success: false,
            error: `Insufficient USDC balance. Have: ${balance} USDC, Need: ${displayAmount} USDC`,
            walletAddress: wallet.address,
            balance,
          };
        }

        ui.paymentPending(displayAmount, payTo);
        ui.paymentSending();

        const txHash = await wallet.transferUsdc(
          payTo as Address,
          amount
        );

        const confirmed = await wallet.waitForTx(txHash);
        const explorerUrl = `https://base-sepolia-testnet-explorer.skalenodes.com:10032/tx/${txHash}`;

        if (confirmed) {
          ui.paymentConfirmed(txHash, explorerUrl);
        } else {
          ui.paymentFailed("Transaction failed on-chain");
        }

        return {
          success: confirmed,
          transactionHash: txHash,
          amount: displayAmount,
          amountBaseUnits: amount,
          payTo,
          network: "bite-v2-sandbox",
          chainId: 103698795,
          explorerUrl,
        };
      } catch (err: any) {
        ui.paymentFailed(err.message);
        return { success: false, error: `Payment failed: ${err.message}` };
      }
    },
  });
}
