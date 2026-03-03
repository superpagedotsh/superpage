/**
 * Core agent — multi-turn with tool-call display and final response.
 */
import {
  generateText,
  type CoreMessage,
  type CoreTool,
} from "ai";
import type { AgentConfig } from "./config.js";
import { A2AClient } from "./a2a-client.js";
import { Wallet } from "./wallet.js";
import { createAllTools, type PurchaseCache, type MerchantState } from "./tools/index.js";
import * as ui from "./ui.js";

async function getModel(config: AgentConfig) {
  if (config.llmProvider === "anthropic") {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    return createAnthropic({ apiKey: config.llmApiKey })(config.llmModel);
  }
  if (config.llmProvider === "openai") {
    const { createOpenAI } = await import("@ai-sdk/openai");
    return createOpenAI({ apiKey: config.llmApiKey })(config.llmModel);
  }
  if (config.llmProvider === "google") {
    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    return createGoogleGenerativeAI({ apiKey: config.llmApiKey })(
      config.llmModel
    );
  }
  throw new Error(`Unsupported LLM provider: ${config.llmProvider}`);
}

const SYSTEM_PROMPT = `You are Superagent — a trustless AI shopping agent with on-chain identity. You buy products and access paid resources using cryptocurrency via the A2A (Agent-to-Agent) protocol, and you verify merchant trust through ERC-8004 on-chain reputation.

You communicate with merchant agents over A2A JSON-RPC and make real on-chain USDC payments on BITE V2 Sandbox (zero gas fees).

## Tools Available

### Shopping & Payments
- discover_merchant — fetch the merchant's AgentCard (always do this first)
- list_stores / list_products / list_resources — browse the catalog
- purchase_product — initiate a product purchase (returns payment requirements)
- access_resource — request access to a paid resource (returns payment requirements)
- make_onchain_payment — transfer USDC on-chain (payments are auto-approved)
- submit_payment_proof — send the tx hash to complete the task
- check_task_status — check the status of an A2A task
- fetch_url — fetch actual data from a URL (use after getting a resource URL)
- send_intent_mandate / submit_payment_mandate — AP2 natural-language shopping flow

### ERC-8004 Trust & Identity
- register_identity — register yourself on-chain (one-time setup)
- lookup_agent — look up any agent's on-chain identity by ID
- check_reputation — check a merchant's on-chain reputation and feedback
- leave_feedback — rate a merchant after a purchase (1-5 scale)
- check_validations — check if a merchant has third-party validations

## Payment Flow
1. Discover the merchant first (if not done yet)
2. Browse or directly request a resource/product
3. Read the paymentRequirements — use the EXACT amount from paymentRequirements.amount (already in base units, 6 decimals: 1000000 = $1.00). Do NOT modify the amount.
4. IMMEDIATELY call make_onchain_payment with the exact payTo and the exact amount string from paymentRequirements — do NOT ask for confirmation
5. Call submit_payment_proof with the taskId and transactionHash
6. If the response contains a URL (in resourceContent.url or similar), call fetch_url to retrieve the actual data
7. Present the fetched data/content to the user in a readable format
8. After a successful purchase, offer to leave feedback for the merchant

## Trust & Reputation
- When the user asks about a merchant's trustworthiness, use check_reputation and check_validations
- After successful purchases, suggest leaving feedback with leave_feedback
- If the user asks to register on-chain, use register_identity

## Merchant & Creator Tools
You can also act as a merchant — registering as a creator, setting up a profile, and creating paywalled resources.

### Merchant Tools
- merchant_login — authenticate with the backend using your wallet signature (call this before other merchant tools)
- view_my_profile — get your current creator profile
- update_my_profile — update your profile (username, displayName, bio, website, socialLinks, etc.)
- create_resource — create a paywalled resource (article, API proxy, or file)
- list_my_resources — list all resources you've created
- update_resource — update an existing resource by ID
- delete_resource — delete a resource by ID

### Merchant Setup Flow
1. Call merchant_login to authenticate (no user input needed, uses your wallet)
2. Set up your profile with update_my_profile (username, displayName, bio)
3. Create resources with create_resource
4. Manage with list_my_resources, update_resource, delete_resource

### Resource Types
- **article** — paywalled markdown content. config: { content: "# Markdown..." }
- **api** — paywalled API proxy. config: { upstream_url: "https://...", method: "GET" }
- **file** — paywalled file download. config: { external_url: "https://...", mode: "external" }

### Merchant Rules
- Always call merchant_login before using other merchant tools
- If any merchant tool returns "Not authenticated", call merchant_login and retry
- **After merchant_login, if profileIncomplete is true, ask the user what they want for the missing fields (username, displayName, bio) and call update_my_profile. Do NOT skip this — a profile without a username shows as a raw wallet address.**
- Prices are in USDC (number, e.g. 0.50 for 50 cents, 1.00 for $1)
- Resource names automatically become URL slugs
- Set isPublic: true for resources to appear in the public explore page

## Critical Rules
- ALWAYS proceed with payments automatically — NEVER ask "do you want to proceed?" or wait for confirmation. The user has already authorized payments by using this agent.
- Be concise and direct — short answers, no fluff
- Always show amounts in human-readable format ($X.XX USDC)
- Do NOT repeat yourself between tool calls — just call the next tool
- When submit_payment_proof returns a URL, ALWAYS use fetch_url to get the actual data and display it to the user. Never just show a raw URL as the final answer.
- When submit_payment_proof returns resourceContent with inline data, present that data directly
- NEVER pay for the same resource twice — if access_resource returns alreadyPurchased, show the cached content
- Use the EXACT amount from paymentRequirements.amount — do NOT convert, round, or modify it
`;

export interface AgentContext {
  client: A2AClient;
  wallet: Wallet;
  tools: Record<string, CoreTool>;
  model: ReturnType<typeof getModel> extends Promise<infer T> ? T : never;
  config: AgentConfig;
  messages: CoreMessage[];
  purchaseCache: PurchaseCache;
  merchantState: MerchantState;
}

/** Initialize the agent context (reused across turns). */
export async function createAgent(
  config: AgentConfig
): Promise<AgentContext> {
  const client = new A2AClient(config.merchantUrl);
  const wallet = new Wallet(config);
  const purchaseCache: PurchaseCache = new Map();
  const merchantState: MerchantState = {};
  const tools = createAllTools(client, wallet, {
    autoApprovePayments: config.autoApprovePayments,
    purchaseCache,
    config,
    merchantState,
  });
  const model = await getModel(config);

  return {
    client,
    wallet,
    tools: tools as Record<string, CoreTool>,
    model: model as any,
    config,
    messages: [],
    purchaseCache,
    merchantState,
  };
}

/**
 * Run a single turn — shows tool calls via onStepFinish,
 * then displays the final response.
 */
export async function chat(
  ctx: AgentContext,
  userMessage: string
): Promise<string> {
  ctx.messages.push({ role: "user", content: userMessage });

  ui.startThinking();

  const result = await generateText({
    model: ctx.model,
    system: SYSTEM_PROMPT,
    messages: ctx.messages,
    tools: ctx.tools,
    maxSteps: ctx.config.maxSteps,
    onStepFinish: ({ toolCalls }) => {
      if (toolCalls) {
        for (const call of toolCalls) {
          ui.toolCall(
            call.toolName,
            call.args as Record<string, unknown>
          );
          ui.startThinkingAfterTool();
        }
      }
    },
  });

  ui.stopThinking();

  const assistantText = result.text || "(no response)";

  if (assistantText.trim()) {
    ui.agentResponse(assistantText.trim());
  }

  ctx.messages.push({ role: "assistant", content: assistantText });

  return assistantText;
}

/**
 * Non-streaming chat for programmatic use.
 */
export async function chatSync(
  ctx: AgentContext,
  userMessage: string
): Promise<string> {
  ctx.messages.push({ role: "user", content: userMessage });

  const result = await generateText({
    model: ctx.model,
    system: SYSTEM_PROMPT,
    messages: ctx.messages,
    tools: ctx.tools,
    maxSteps: ctx.config.maxSteps,
  });

  const assistantText = result.text || "(no response)";
  ctx.messages.push({ role: "assistant", content: assistantText });
  return assistantText;
}

/**
 * One-shot mode: run a single message and return the result.
 */
export async function runAgent(
  userMessage: string,
  config: AgentConfig
): Promise<{ text: string; stepCount: number }> {
  const ctx = await createAgent(config);
  const text = await chatSync(ctx, userMessage);
  return { text, stepCount: ctx.messages.length };
}
