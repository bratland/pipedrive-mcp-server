import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerStageTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_stages",
    description: "List pipeline stages",
    parameters: z.object({
      pipeline_id: z.number().optional().describe("Filter by pipeline ID"),
    }),
    execute: async (args) => {
      const result = await client.get("/stages", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_stage",
    description: "Get a specific stage by ID",
    parameters: z.object({ id: z.number().describe("Stage ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/stages/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_stage",
    description: "Create a new pipeline stage",
    parameters: z.object({
      name: z.string().describe("Stage name"),
      pipeline_id: z.number().describe("Pipeline ID this stage belongs to"),
      deal_probability: z.number().optional().describe("Probability percentage (0-100)"),
      order_nr: z.number().optional(),
      rotten_flag: z.enum(["0", "1"]).optional().describe("Enable rotting for deals in this stage"),
      rotten_days: z.number().optional().describe("Days until a deal is considered rotten"),
    }),
    execute: async (args) => {
      const result = await client.post("/stages", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_stage",
    description: "Update a pipeline stage",
    parameters: z.object({
      id: z.number().describe("Stage ID"),
      name: z.string().optional(),
      pipeline_id: z.number().optional(),
      deal_probability: z.number().optional(),
      order_nr: z.number().optional(),
      rotten_flag: z.enum(["0", "1"]).optional(),
      rotten_days: z.number().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/stages/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_stage",
    description: "Delete a pipeline stage",
    parameters: z.object({ id: z.number().describe("Stage ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/stages/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_stage_deals",
    description: "List deals in a specific stage",
    parameters: z.object({
      id: z.number().describe("Stage ID"),
      filter_id: z.number().optional(),
      user_id: z.number().optional(),
      everyone: z.enum(["0", "1"]).optional(),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/stages/${id}/deals`, params);
      return JSON.stringify(result, null, 2);
    },
  });
}
