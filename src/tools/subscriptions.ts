import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerSubscriptionTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "get_subscription",
    description: "Get a subscription by ID",
    parameters: z.object({ id: z.number().describe("Subscription ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/subscriptions/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_deal_subscription",
    description: "Get subscription for a deal",
    parameters: z.object({ deal_id: z.number().describe("Deal ID") }),
    execute: async ({ deal_id }) => {
      const result = await client.get(`/subscriptions/find/${deal_id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_recurring_subscription",
    description: "Create a recurring subscription for a deal",
    parameters: z.object({
      deal_id: z.number().describe("Deal ID"),
      currency: z.string().describe("Currency code"),
      cadence_type: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
      cycles_count: z.number().optional().describe("Number of cycles (0 = infinite)"),
      cycle_amount: z.number().describe("Amount per cycle"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      infinite: z.boolean().optional(),
      payments: z.array(z.object({
        amount: z.number(),
        description: z.string().optional(),
        due_at: z.string(),
      })).optional(),
      update_deal_value: z.boolean().optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/subscriptions/recurring", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_installment_subscription",
    description: "Create an installment subscription for a deal",
    parameters: z.object({
      deal_id: z.number().describe("Deal ID"),
      currency: z.string().describe("Currency code"),
      payments: z.array(z.object({
        amount: z.number(),
        description: z.string().optional(),
        due_at: z.string().describe("Due date (YYYY-MM-DD)"),
      })).describe("Payment schedule"),
      update_deal_value: z.boolean().optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/subscriptions/installment", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_recurring_subscription",
    description: "Update a recurring subscription",
    parameters: z.object({
      id: z.number().describe("Subscription ID"),
      cadence_type: z.enum(["weekly", "monthly", "quarterly", "yearly"]).optional(),
      cycle_amount: z.number().optional(),
      effective_date: z.string().describe("Effective date of change (YYYY-MM-DD)"),
      cycles_count: z.number().optional(),
      infinite: z.boolean().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/subscriptions/recurring/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_installment_subscription",
    description: "Update an installment subscription",
    parameters: z.object({
      id: z.number().describe("Subscription ID"),
      payments: z.array(z.object({
        amount: z.number(),
        description: z.string().optional(),
        due_at: z.string(),
      })),
      update_deal_value: z.boolean().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/subscriptions/installment/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "cancel_subscription",
    description: "Cancel a subscription",
    parameters: z.object({
      id: z.number().describe("Subscription ID"),
      end_date: z.string().optional().describe("End date (YYYY-MM-DD), default is today"),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.deleteRequest(`/subscriptions/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_subscription_payments",
    description: "List payments of a subscription",
    parameters: z.object({ id: z.number().describe("Subscription ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/subscriptions/${id}/payments`);
      return JSON.stringify(result, null, 2);
    },
  });
}
