import { tool } from "ai";
import { z } from "zod";
import type { A2AClient } from "../a2a-client.js";

export function createCheckTaskTool(client: A2AClient) {
  return tool({
    description:
      "Check the current status of an A2A task. Use this to verify if a payment was accepted or to see task progress.",
    parameters: z.object({
      taskId: z.string().describe("The A2A task ID"),
    }),
    execute: async ({ taskId }) => {
      const response = await client.getTask(taskId);

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const task = response.result as any;
      return {
        success: true,
        taskId: task.id,
        state: task.status.state,
        message: task.status.message?.parts?.find(
          (p: any) => p.type === "text"
        )?.text,
        artifacts: task.artifacts,
        metadata: task.metadata,
      };
    },
  });
}
