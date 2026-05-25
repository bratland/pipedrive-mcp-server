import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";
import { addDateContextToResponse } from "../utils/date-context.js";

export function registerQuarterlyTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "get_current_quarter_deals",
    description: "Get deals from the current quarter with date context",
    parameters: z.object({
      status: z.enum(["all_not_deleted", "open", "won", "lost"]).optional(),
      user_id: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.getCurrentQuarterDeals(args);
      const withContext = addDateContextToResponse(result);
      return JSON.stringify(withContext, null, 2);
    },
  });

  server.addTool({
    name: "get_quarter_summary",
    description: "Get a summary of deals for a specific quarter",
    parameters: z.object({
      quarter: z.enum(["Q1", "Q2", "Q3", "Q4", "current"]).optional().describe("Quarter (default: current)"),
      year: z.number().optional(),
      user_id: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.getQuarterSummary(
        args.quarter || "current",
        args.year,
        args.user_id
      );
      const withContext = addDateContextToResponse(result);
      return JSON.stringify(withContext, null, 2);
    },
  });

  server.addTool({
    name: "get_quarterly_progress",
    description: "Get quarterly progress report for the current quarter",
    parameters: z.object({
      user_id: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.getQuarterSummary("current", undefined, args.user_id);
      const withContext = addDateContextToResponse(result);
      return JSON.stringify(withContext, null, 2);
    },
  });
}
