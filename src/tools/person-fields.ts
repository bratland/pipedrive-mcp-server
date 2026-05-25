import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerPersonFieldTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_person_fields",
    description: "List all person fields (including custom fields)",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/personFields", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_person_field",
    description: "Get a specific person field",
    parameters: z.object({ id: z.number().describe("Person field ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/personFields/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_person_field",
    description: "Create a new custom person field",
    parameters: z.object({
      name: z.string().describe("Field name"),
      field_type: z.enum(["varchar", "varchar_auto", "text", "double", "monetary", "date", "set", "enum", "user", "org", "people", "phone", "time", "timerange", "daterange", "address"]),
      options: z.array(z.object({ label: z.string() })).optional(),
      add_visible_flag: z.boolean().optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/personFields", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_person_field",
    description: "Update a custom person field",
    parameters: z.object({
      id: z.number().describe("Person field ID"),
      name: z.string().optional(),
      options: z.array(z.object({ id: z.number().optional(), label: z.string() })).optional(),
      add_visible_flag: z.boolean().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/personFields/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_person_field",
    description: "Delete a custom person field",
    parameters: z.object({ id: z.number().describe("Person field ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/personFields/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
