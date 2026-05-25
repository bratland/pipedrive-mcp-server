import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerOrgFieldTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_organization_fields",
    description: "List all organization fields (including custom fields)",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/organizationFields", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_organization_field",
    description: "Get a specific organization field",
    parameters: z.object({ id: z.number().describe("Organization field ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/organizationFields/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_organization_field",
    description: "Create a new custom organization field",
    parameters: z.object({
      name: z.string().describe("Field name"),
      field_type: z.enum(["varchar", "varchar_auto", "text", "double", "monetary", "date", "set", "enum", "user", "org", "people", "phone", "time", "timerange", "daterange", "address"]),
      options: z.array(z.object({ label: z.string() })).optional(),
      add_visible_flag: z.boolean().optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/organizationFields", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_organization_field",
    description: "Update a custom organization field",
    parameters: z.object({
      id: z.number().describe("Organization field ID"),
      name: z.string().optional(),
      options: z.array(z.object({ id: z.number().optional(), label: z.string() })).optional(),
      add_visible_flag: z.boolean().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/organizationFields/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_organization_field",
    description: "Delete a custom organization field",
    parameters: z.object({ id: z.number().describe("Organization field ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/organizationFields/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
