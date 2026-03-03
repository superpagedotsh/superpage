/**
 * A2A JSON-RPC Client
 *
 * Thin HTTP wrapper for A2A protocol communication.
 */
import type {
  A2AJsonRpcRequest,
  A2AJsonRpcResponse,
  AgentCard,
  Part,
} from "./types.js";

export class A2AClient {
  private a2aEndpoint: string;
  private baseUrl: string;
  private requestIdCounter = 0;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.a2aEndpoint = `${this.baseUrl}/a2a`;
  }

  /** Fetch the AgentCard from /.well-known/agent.json */
  async getAgentCard(): Promise<AgentCard> {
    const res = await fetch(`${this.baseUrl}/.well-known/agent.json`);
    if (!res.ok)
      throw new Error(
        `Failed to fetch AgentCard: ${res.status} ${res.statusText}`
      );
    return res.json() as Promise<AgentCard>;
  }

  /** Send a JSON-RPC request to the A2A endpoint */
  async sendRpc(
    method: string,
    params: Record<string, unknown>
  ): Promise<A2AJsonRpcResponse> {
    const id = ++this.requestIdCounter;
    const body: A2AJsonRpcRequest = { jsonrpc: "2.0", id, method, params };

    const res = await fetch(this.a2aEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok)
      throw new Error(`A2A request failed: ${res.status} ${res.statusText}`);
    return res.json() as Promise<A2AJsonRpcResponse>;
  }

  /** Send message/send with a data part */
  async sendMessage(
    data: Record<string, unknown>
  ): Promise<A2AJsonRpcResponse> {
    return this.sendRpc("message/send", {
      message: {
        role: "user",
        parts: [{ type: "data", data }] as Part[],
      },
    });
  }

  /** Get task by ID */
  async getTask(taskId: string): Promise<A2AJsonRpcResponse> {
    return this.sendRpc("tasks/get", { id: taskId });
  }

  /** Cancel task */
  async cancelTask(taskId: string): Promise<A2AJsonRpcResponse> {
    return this.sendRpc("tasks/cancel", { id: taskId });
  }

  // ── REST helpers for browsing ──

  async listStores(): Promise<unknown[]> {
    const res = await fetch(`${this.baseUrl}/x402/stores`);
    if (!res.ok) throw new Error(`Failed to list stores: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data as any).stores || [];
  }

  async listProducts(storeId: string): Promise<unknown[]> {
    const res = await fetch(
      `${this.baseUrl}/x402/stores/${storeId}/products`
    );
    if (!res.ok) throw new Error(`Failed to list products: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data as any).products || [];
  }

  async listResources(): Promise<unknown[]> {
    const res = await fetch(`${this.baseUrl}/x402/resources`);
    if (!res.ok) throw new Error(`Failed to list resources: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data as any).resources || [];
  }
}
