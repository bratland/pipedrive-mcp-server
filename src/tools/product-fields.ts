import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerProductFieldTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_product_fields",
    description: "List all product fields (including custom fields)",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/productFields", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_product_field",
    description: "Get a specific product field",
    parameters: z.object({ id: z.number().describe("Product field ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/productFields/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_product_field",
    description: "Create a new custom product field",
    parameters: z.object({
      name: z.string().describe("Field name"),
      field_type: z.enum(["varchar", "varchar_auto", "text", "double", "monetary", "date", "set", "enum", "user", "org", "people", "phone", "time", "timerange", "daterange", "address"]),
      options: z.array(z.object({ label: z.string() })).optional(),
      add_visible_flag: z.boolean().optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/productFields", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_product_field",
    description: "Update a custom product field",
    parameters: z.object({
      id: z.number().describe("Product field ID"),
      name: z.string().optional(),
      options: z.array(z.object({ id: z.number().optional(), label: z.string() })).optional(),
      add_visible_flag: z.boolean().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/productFields/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_product_field",
    description: "Delete a custom product field",
    parameters: z.object({ id: z.number().describe("Product field ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/productFields/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
