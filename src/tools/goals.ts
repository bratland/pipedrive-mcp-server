import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerGoalTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_goals",
    description: "List goals from Pipedrive",
    parameters: z.object({
      type_name: z.enum(["deals_won", "deals_progressed", "activities_completed", "activities_added", "deals_started"]).optional(),
      title: z.string().optional(),
      is_active: z.boolean().optional(),
      assignee_id: z.number().optional(),
      assignee_type: z.enum(["person", "company", "team"]).optional(),
      expected_outcome_target: z.number().optional(),
      expected_outcome_tracking_metric: z.enum(["quantity", "sum"]).optional(),
      expected_outcome_currency_id: z.number().optional(),
      type_params_pipeline_id: z.number().optional(),
      type_params_stage_id: z.number().optional(),
      type_params_activity_type_id: z.number().optional(),
      period_start: z.string().optional().describe("Period start (YYYY-MM-DD)"),
      period_end: z.string().optional().describe("Period end (YYYY-MM-DD)"),
    }),
    execute: async (args) => {
      const result = await client.get("/goals/find", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_goal",
    description: "Get a goal result",
    parameters: z.object({
      id: z.string().describe("Goal ID"),
      period_start: z.string().describe("Period start (YYYY-MM-DD)"),
      period_end: z.string().describe("Period end (YYYY-MM-DD)"),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/goals/${id}/results`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_goal",
    description: "Create a new goal",
    parameters: z.object({
      title: z.string().describe("Goal title"),
      assignee: z.object({
        id: z.number(),
        type: z.enum(["person", "company", "team"]),
      }),
      type: z.object({
        name: z.enum(["deals_won", "deals_progressed", "activities_completed", "activities_added", "deals_started"]),
        params: z.object({
          pipeline_id: z.number().optional(),
          stage_id: z.number().optional(),
          activity_type_id: z.number().optional(),
        }).optional(),
      }),
      expected_outcome: z.object({
        target: z.number(),
        tracking_metric: z.enum(["quantity", "sum"]),
        currency_id: z.number().optional(),
      }),
      duration: z.object({
        start: z.string().describe("Start date (YYYY-MM-DD)"),
        end: z.string().optional().describe("End date (YYYY-MM-DD)"),
      }),
      interval: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
    }),
    execute: async (args) => {
      const result = await client.post("/goals", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_goal",
    description: "Update an existing goal",
    parameters: z.object({
      id: z.string().describe("Goal ID"),
      title: z.string().optional(),
      assignee: z.object({
        id: z.number(),
        type: z.enum(["person", "company", "team"]),
      }).optional(),
      expected_outcome: z.object({
        target: z.number(),
        tracking_metric: z.enum(["quantity", "sum"]),
        currency_id: z.number().optional(),
      }).optional(),
      duration: z.object({
        start: z.string(),
        end: z.string().optional(),
      }).optional(),
      interval: z.enum(["weekly", "monthly", "quarterly", "yearly"]).optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/goals/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_goal",
    description: "Delete a goal",
    parameters: z.object({ id: z.string().describe("Goal ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/goals/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
