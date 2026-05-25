import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerSearchTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "search_items",
    description: "Search across all Pipedrive entities (deals, persons, organizations, products, files, mail)",
    parameters: z.object({
      term: z.string().describe("Search term"),
      item_types: z.string().optional().describe("Comma-separated types: deal, person, organization, product, file, mail_attachment, project"),
      fields: z.string().optional().describe("Fields to search: custom_fields, notes, title, etc."),
      search_for_related_items: z.boolean().optional(),
      exact_match: z.boolean().optional(),
      include_fields: z.string().optional(),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/itemSearch", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "search_by_field",
    description: "Search items by a specific field value",
    parameters: z.object({
      term: z.string().describe("Search term"),
      field_type: z.enum(["dealField", "personField", "organizationField", "productField"]).describe("Field type"),
      field_key: z.string().describe("Field key to search"),
      exact_match: z.boolean().optional(),
      return_item_ids: z.boolean().optional(),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/itemSearch/field", args);
      return JSON.stringify(result, null, 2);
    },
  });
}
