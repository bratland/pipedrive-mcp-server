import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerDealFieldTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_deal_fields",
    description: "List all deal fields (including custom fields)",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/dealFields", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_deal_field",
    description: "Get a specific deal field",
    parameters: z.object({ id: z.number().describe("Deal field ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/dealFields/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_deal_field",
    description: "Create a new custom deal field",
    parameters: z.object({
      name: z.string().describe("Field name"),
      field_type: z.enum(["varchar", "varchar_auto", "text", "double", "monetary", "date", "set", "enum", "user", "org", "people", "phone", "time", "timerange", "daterange", "address"]).describe("Field type"),
      options: z.array(z.object({ label: z.string() })).optional().describe("Options for enum/set fields"),
      add_visible_flag: z.boolean().optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/dealFields", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_deal_field",
    description: "Update a custom deal field",
    parameters: z.object({
      id: z.number().describe("Deal field ID"),
      name: z.string().optional(),
      options: z.array(z.object({ id: z.number().optional(), label: z.string() })).optional(),
      add_visible_flag: z.boolean().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/dealFields/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_deal_field",
    description: "Delete a custom deal field",
    parameters: z.object({ id: z.number().describe("Deal field ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/dealFields/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
