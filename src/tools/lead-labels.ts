import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerLeadLabelTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_lead_labels",
    description: "List all lead labels",
    parameters: z.object({}),
    execute: async () => {
      const result = await client.get("/leadLabels");
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_lead_label",
    description: "Create a new lead label",
    parameters: z.object({
      name: z.string().describe("Label name"),
      color: z.string().describe("Label color (e.g. green, blue, red, yellow, purple, gray)"),
    }),
    execute: async (args) => {
      const result = await client.post("/leadLabels", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_lead_label",
    description: "Update a lead label",
    parameters: z.object({
      id: z.string().describe("Lead label ID (UUID)"),
      name: z.string().optional(),
      color: z.string().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/leadLabels/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_lead_label",
    description: "Delete a lead label",
    parameters: z.object({ id: z.string().describe("Lead label ID (UUID)") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/leadLabels/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
