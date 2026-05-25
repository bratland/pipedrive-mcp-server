import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerPipelineTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_pipelines",
    description: "List all pipelines",
    parameters: z.object({}),
    execute: async () => {
      const result = await client.get("/pipelines");
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_pipeline",
    description: "Get a specific pipeline by ID",
    parameters: z.object({ id: z.number().describe("Pipeline ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/pipelines/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_pipeline",
    description: "Create a new pipeline",
    parameters: z.object({
      name: z.string().describe("Pipeline name"),
      deal_probability: z.enum(["0", "1"]).optional().describe("Whether deal probability is enabled"),
      order_nr: z.number().optional(),
      active: z.enum(["0", "1"]).optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/pipelines", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_pipeline",
    description: "Update an existing pipeline",
    parameters: z.object({
      id: z.number().describe("Pipeline ID"),
      name: z.string().optional(),
      deal_probability: z.enum(["0", "1"]).optional(),
      order_nr: z.number().optional(),
      active: z.enum(["0", "1"]).optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/pipelines/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_pipeline",
    description: "Delete a pipeline",
    parameters: z.object({ id: z.number().describe("Pipeline ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/pipelines/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_pipeline_deals",
    description: "List deals in a pipeline",
    parameters: z.object({
      id: z.number().describe("Pipeline ID"),
      filter_id: z.number().optional(),
      user_id: z.number().optional(),
      everyone: z.enum(["0", "1"]).optional(),
      stage_id: z.number().optional(),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/pipelines/${id}/deals`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_pipeline_movement_statistics",
    description: "Get movement statistics for a pipeline (deals entering, leaving stages)",
    parameters: z.object({
      id: z.number().describe("Pipeline ID"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().describe("End date (YYYY-MM-DD)"),
      user_id: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/pipelines/${id}/movement_statistics`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_pipeline_conversion_statistics",
    description: "Get conversion rate statistics for a pipeline",
    parameters: z.object({
      id: z.number().describe("Pipeline ID"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().describe("End date (YYYY-MM-DD)"),
      user_id: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/pipelines/${id}/conversion_statistics`, params);
      return JSON.stringify(result, null, 2);
    },
  });
}
