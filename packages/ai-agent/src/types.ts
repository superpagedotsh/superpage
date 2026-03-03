/**
 * Client-side A2A types for the buyer agent.
 * Lean subset — just enough to construct and parse JSON-RPC messages.
 */

// JSON-RPC 2.0
export interface A2AJsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface A2AJsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// Message parts
export interface TextPart {
  type: "text";
  text: string;
}
export interface DataPart {
  type: "data";
  data: Record<string, unknown>;
  mimeType?: string;
}
export interface FilePart {
  type: "file";
  file: { name: string; mimeType: string; bytes?: string; uri?: string };
}
export type Part = TextPart | DataPart | FilePart;

// A2A Task
export interface A2ATask {
  id: string;
  status: {
    state:
      | "submitted"
      | "working"
      | "input-required"
      | "completed"
      | "failed"
      | "canceled";
    message?: { role: string; parts: Part[] };
    timestamp: string;
  };
  artifacts?: Array<{
    name?: string;
    description?: string;
    parts: Part[];
    index: number;
  }>;
  metadata?: Record<string, unknown>;
}

// AP2 Payment requirements (received from merchant)
export interface AP2PaymentRequirements {
  extensionUri: string;
  networks: Array<{
    network: string;
    chainId: number;
    rpcUrl?: string;
    tokenAddress?: string;
  }>;
  asset: string;
  amount: string;
  payTo: string;
  scheme: string;
  requestId?: string;
  expiresAt?: string;
  memo?: string;
}

// AgentCard (discovery)
export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: Record<string, unknown>;
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags?: string[];
    examples?: string[];
  }>;
  extensions?: Array<{
    uri: string;
    description?: string;
    required?: boolean;
    config?: Record<string, unknown>;
  }>;
  provider?: { organization: string; url?: string };
}
