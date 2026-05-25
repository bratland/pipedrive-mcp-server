import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerWebhookTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_webhooks",
    description: "List all webhooks",
    parameters: z.object({}),
    execute: async () => {
      const result = await client.get("/webhooks");
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_webhook",
    description: "Create a new webhook subscription",
    parameters: z.object({
      subscription_url: z.string().describe("URL to receive webhook POST"),
      event_action: z.enum(["added", "updated", "merged", "deleted", "*"]).describe("Action to trigger on"),
      event_object: z.enum(["deal", "person", "organization", "activity", "note", "pipeline", "stage", "user", "product", "*"]).describe("Object type to watch"),
      user_id: z.number().optional().describe("Filter by user"),
      http_auth_user: z.string().optional(),
      http_auth_password: z.string().optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/webhooks", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_webhook",
    description: "Delete a webhook subscription",
    parameters: z.object({ id: z.number().describe("Webhook ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/webhooks/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
