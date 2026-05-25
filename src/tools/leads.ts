import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerLeadTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_leads",
    description: "List leads from Pipedrive",
    parameters: z.object({
      limit: z.number().optional(),
      start: z.number().optional(),
      archived_status: z.enum(["archived", "not_archived", "all"]).optional(),
      owner_id: z.number().optional(),
      person_id: z.number().optional(),
      organization_id: z.number().optional(),
      filter_id: z.number().optional(),
      sort: z.string().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/leads", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_lead",
    description: "Get a specific lead by ID",
    parameters: z.object({ id: z.string().describe("Lead ID (UUID)") }),
    execute: async ({ id }) => {
      const result = await client.get(`/leads/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_lead",
    description: "Create a new lead",
    parameters: z.object({
      title: z.string().describe("Lead title"),
      owner_id: z.number().optional(),
      label_ids: z.array(z.string()).optional().describe("Array of label UUIDs"),
      person_id: z.number().optional(),
      organization_id: z.number().optional(),
      value: z.object({
        amount: z.number(),
        currency: z.string(),
      }).optional().describe("Lead value with amount and currency"),
      expected_close_date: z.string().optional().describe("Expected close date (YYYY-MM-DD)"),
      visible_to: z.enum(["1", "3", "5", "7"]).optional(),
      was_seen: z.boolean().optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/leads", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_lead",
    description: "Update an existing lead",
    parameters: z.object({
      id: z.string().describe("Lead ID (UUID)"),
      title: z.string().optional(),
      owner_id: z.number().optional(),
      label_ids: z.array(z.string()).optional(),
      person_id: z.number().optional(),
      organization_id: z.number().optional(),
      value: z.object({
        amount: z.number(),
        currency: z.string(),
      }).optional(),
      expected_close_date: z.string().optional(),
      visible_to: z.enum(["1", "3", "5", "7"]).optional(),
      is_archived: z.boolean().optional(),
      was_seen: z.boolean().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.patch(`/leads/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_lead",
    description: "Delete a lead",
    parameters: z.object({ id: z.string().describe("Lead ID (UUID)") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/leads/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "search_leads",
    description: "Search for leads",
    parameters: z.object({
      term: z.string().describe("Search term"),
      fields: z.string().optional(),
      exact_match: z.boolean().optional(),
      person_id: z.number().optional(),
      organization_id: z.number().optional(),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/leads/search", args);
      return JSON.stringify(result, null, 2);
    },
  });
}
