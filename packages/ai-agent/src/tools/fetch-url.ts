import { tool } from "ai";
import { z } from "zod";

export function createFetchUrlTool() {
  return tool({
    description:
      "Fetch content from a URL and return the response body. Use this after receiving a resource URL from submit_payment_proof to retrieve the actual data (API responses, JSON, text, etc.). Supports JSON and plain text responses.",
    parameters: z.object({
      url: z.string().describe("The URL to fetch"),
      method: z
        .enum(["GET", "POST"])
        .optional()
        .describe("HTTP method (default GET)"),
      headers: z
        .record(z.string())
        .optional()
        .describe("Optional request headers"),
    }),
    execute: async ({ url, method, headers }) => {
      try {
        const res = await fetch(url, {
          method: method || "GET",
          headers: headers || {},
        });

        if (!res.ok) {
          return {
            success: false,
            status: res.status,
            error: `HTTP ${res.status} ${res.statusText}`,
          };
        }

        const contentType = res.headers.get("content-type") || "";
        let body: unknown;

        if (contentType.includes("application/json")) {
          body = await res.json();
        } else {
          body = await res.text();
          // Try to parse as JSON if it looks like JSON
          if (typeof body === "string" && (body.startsWith("{") || body.startsWith("["))) {
            try {
              body = JSON.parse(body);
            } catch {
              // keep as text
            }
          }
        }

        return {
          success: true,
          status: res.status,
          contentType,
          data: body,
        };
      } catch (err: any) {
        return { success: false, error: `Fetch failed: ${err.message}` };
      }
    },
  });
}
