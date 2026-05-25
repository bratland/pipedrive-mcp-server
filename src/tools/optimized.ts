import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";
import { optimizeResponse } from "../utils/token-optimizer.js";

export function registerOptimizedTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "get_deals_summary",
    description: "Get a token-optimized summary of deals (compact format for AI consumption)",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional().describe("Max items (default 20, max 50)"),
      status: z.enum(["all_not_deleted", "open", "won", "lost", "deleted"]).optional(),
      user_id: z.number().optional(),
    }),
    execute: async (args) => {
      const safeParams = { ...args, limit: Math.min(args.limit || 20, 50) };
      const result = await client.getDeals(safeParams);
      const optimized = optimizeResponse(result, "deals", { maxItems: 20, summarizeItems: true });
      return JSON.stringify(optimized, null, 2);
    },
  });

  server.addTool({
    name: "get_persons_summary",
    description: "Get a token-optimized summary of persons",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
      user_id: z.number().optional(),
    }),
    execute: async (args) => {
      const safeParams = { ...args, limit: Math.min(args.limit || 20, 50) };
      const result = await client.getPersons(safeParams);
      const optimized = optimizeResponse(result, "persons", { maxItems: 20, summarizeItems: true });
      return JSON.stringify(optimized, null, 2);
    },
  });

  server.addTool({
    name: "get_organizations_summary",
    description: "Get a token-optimized summary of organizations",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
      user_id: z.number().optional(),
    }),
    execute: async (args) => {
      const safeParams = { ...args, limit: Math.min(args.limit || 20, 50) };
      const result = await client.getOrganizations(safeParams);
      const optimized = optimizeResponse(result, "organizations", { maxItems: 20, summarizeItems: true });
      return JSON.stringify(optimized, null, 2);
    },
  });

  server.addTool({
    name: "get_activities_summary",
    description: "Get a token-optimized summary of activities",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
      user_id: z.number().optional(),
      done: z.boolean().optional(),
    }),
    execute: async (args) => {
      const { done, ...otherParams } = args;
      const safeParams = {
        ...otherParams,
        limit: Math.min(args.limit || 20, 50),
        done: done !== undefined ? (done ? 1 : 0) as 0 | 1 : undefined,
      };
      const result = await client.getActivities(safeParams);
      const optimized = optimizeResponse(result, "activities", { maxItems: 20, summarizeItems: true });
      return JSON.stringify(optimized, null, 2);
    },
  });

  server.addTool({
    name: "get_overview",
    description: "Get a high-level overview of recent deals and activities (token-optimized)",
    parameters: z.object({
      include_recent_deals: z.boolean().optional().describe("Include recent deals (default true)"),
      include_recent_activities: z.boolean().optional().describe("Include recent activities (default true)"),
      user_id: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.getOverview(args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "search_summarized",
    description: "Search and return token-optimized results",
    parameters: z.object({
      term: z.string().describe("Search term"),
      item_types: z.string().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ term, ...params }) => {
      const safeParams = { ...params, limit: Math.min(params.limit || 10, 20) };
      const result = await client.searchItems(term, safeParams);
      const optimized = optimizeResponse(result, "deals", { maxItems: 10, summarizeItems: true });
      return JSON.stringify(optimized, null, 2);
    },
  });
}
