/**
 * Terminal UI — Claude Code-style CLI experience.
 */
import ora, { type Ora } from "ora";

// ANSI colors
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

let spinner: Ora | null = null;

export function banner() {
  console.log(
    `\n${c.bold}${c.cyan}  ╭─────────────────────────────────────────╮`
  );
  console.log(`  │                SuperAgent               │`);
  console.log(`  │         Your trustless AI agent         │`);
  console.log(`  ╰─────────────────────────────────────────╯${c.reset}\n`);
}

export function info(label: string, value: string) {
  console.log(`  ${c.dim}${label.padEnd(10)}${c.reset} ${value}`);
}

export function startThinking() {
  spinner = ora({
    text: `${c.dim}Thinking...${c.reset}`,
    prefixText: " ",
    spinner: "dots",
    color: "cyan",
    discardStdin: false,
  }).start();
}

export function stopThinking() {
  if (spinner) {
    spinner.stop();
    spinner = null;
  }
}

export function toolCall(name: string, args: Record<string, unknown>) {
  stopThinking();
  const argsStr = Object.entries(args)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" ");
  const display = argsStr
    ? `${name} ${c.dim}${argsStr.slice(0, 60)}${c.reset}`
    : name;
  console.log(`  ${c.blue}⚡ ${display}${c.reset}`);
}

export function startThinkingAfterTool() {
  spinner = ora({
    text: `${c.dim}Thinking...${c.reset}`,
    prefixText: " ",
    spinner: "dots",
    color: "cyan",
    discardStdin: false,
  }).start();
}

export function agentResponse(text: string) {
  const formatted = text.replace(/\n/g, "\n  ");
  console.log(`\n  ${formatted}\n`);
}

export function paymentPending(amount: string, recipient: string) {
  stopThinking();
  console.log(
    `  ${c.yellow}💳 ${amount} USDC → ${recipient.slice(0, 6)}...${recipient.slice(-4)}${c.reset}`
  );
}

export function paymentSending() {
  spinner = ora({
    text: `${c.dim}Sending payment...${c.reset}`,
    prefixText: " ",
    spinner: "dots",
    color: "yellow",
    discardStdin: false,
  }).start();
}

export function paymentConfirmed(txHash: string, explorerUrl: string) {
  if (spinner) {
    spinner.succeed(
      `${c.green}Confirmed${c.reset}  ${c.dim}TX: ${txHash.slice(0, 10)}...${txHash.slice(-6)}${c.reset}`
    );
  } else {
    console.log(
      `  ${c.green}✓ Confirmed${c.reset}  ${c.dim}TX: ${txHash.slice(0, 10)}...${txHash.slice(-6)}${c.reset}`
    );
  }
  spinner = null;
  console.log(`  ${c.dim}${explorerUrl}${c.reset}`);
}

export function paymentFailed(error: string) {
  if (spinner) {
    spinner.fail(`${c.red}Failed: ${error}${c.reset}`);
  } else {
    console.log(`  ${c.red}✗ Payment failed: ${error}${c.reset}`);
  }
  spinner = null;
}

export function walletInfo(address: string, balance: string) {
  console.log(
    `  ${c.dim}Wallet${c.reset}     ${address.slice(0, 6)}...${address.slice(-4)}  ${c.bold}${balance} USDC${c.reset}`
  );
}

export function userPrompt(): string {
  return `${c.green}${c.bold}❯ ${c.reset}`;
}

export function error(msg: string) {
  console.log(`  ${c.red}${c.bold}Error:${c.reset} ${c.red}${msg}${c.reset}`);
}

export function goodbye() {
  console.log(`\n  ${c.dim}Goodbye!${c.reset}\n`);
}

export function hint(msg: string) {
  console.log(`  ${c.dim}${msg}${c.reset}`);
}

export function slashCommand(name: string, desc: string) {
  console.log(
    `  ${c.cyan}/${name.padEnd(12)}${c.reset} ${c.dim}${desc}${c.reset}`
  );
}
