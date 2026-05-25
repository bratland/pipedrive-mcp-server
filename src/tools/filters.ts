import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerFilterTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_filters",
    description: "List all filters",
    parameters: z.object({
      type: z.enum(["deals", "persons", "org", "products", "activities"]).optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/filters", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_filter",
    description: "Get a specific filter by ID",
    parameters: z.object({ id: z.number().describe("Filter ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/filters/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_filter",
    description: "Create a new filter",
    parameters: z.object({
      name: z.string().describe("Filter name"),
      type: z.enum(["deals", "persons", "org", "products", "activities"]).describe("Filter type"),
      conditions: z.any().describe("Filter conditions object (see Pipedrive filter docs)"),
    }),
    execute: async (args) => {
      const result = await client.post("/filters", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_filter",
    description: "Update a filter",
    parameters: z.object({
      id: z.number().describe("Filter ID"),
      name: z.string().optional(),
      conditions: z.any().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/filters/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_filter",
    description: "Delete a filter",
    parameters: z.object({ id: z.number().describe("Filter ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/filters/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
