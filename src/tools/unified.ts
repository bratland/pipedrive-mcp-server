import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";
import { ROUTES, Route, generateToolDescription } from "../routes.js";
import { optimizeResponse } from "../utils/token-optimizer.js";
import { addDateContextToResponse } from "../utils/date-context.js";

function parseValue(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  const num = Number(v);
  if (!isNaN(num) && v.trim() !== '') return num;
  if ((v.startsWith('[') || v.startsWith('{')) && v.length > 1) {
    try { return JSON.parse(v); } catch { /* use as string */ }
  }
  return v;
}

function parseParams(raw: Record<string, unknown>): Record<string, unknown> {
  const parsed: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    parsed[k] = parseValue(v);
  }
  return parsed;
}

async function executeRoute(
  client: PipedriveClient,
  route: Route,
  id: string | undefined,
  rawParams: Record<string, unknown>,
): Promise<string> {
  let path = route.path;
  const params = parseParams(rawParams);

  if (path.includes(':id')) {
    if (route.requireId && !id) {
      return JSON.stringify({ success: false, error: 'Missing required id' });
    }
    if (id) {
      path = path.replace(':id', String(id));
    }
  }

  if (path.includes(':sub_id') && route.subResourceId) {
    const subId = params[route.subResourceId];
    if (!subId) {
      return JSON.stringify({ success: false, error: `Missing required ${route.subResourceId}` });
    }
    path = path.replace(':sub_id', String(subId));
    delete params[route.subResourceId];
  }

  if (route.requireTerm) {
    const term = params.term;
    if (!term) {
      return JSON.stringify({ success: false, error: 'Missing required term' });
    }
    if (route.searchParam && route.searchParam !== 'term') {
      params[route.searchParam] = term;
      delete params.term;
    }
  }

  if (route.paginatable) {
    if (params.start === undefined) params.start = 0;
    if (params.limit === undefined) params.limit = 20;
  }

  let result;
  switch (route.method) {
    case 'GET':
      result = await client.get(path, Object.keys(params).length > 0 ? params : undefined);
      break;
    case 'POST':
      result = await client.post(path, route.bodyFromArgs ? params : undefined);
      break;
    case 'PUT':
      result = await client.put(path, route.bodyFromArgs ? params : undefined);
      break;
    case 'PATCH':
      result = await client.patch(path, route.bodyFromArgs ? params : undefined);
      break;
    case 'DELETE':
      result = await client.deleteRequest(path);
      break;
  }

  return JSON.stringify(result, null, 2);
}

export function registerUnifiedTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "pipedrive",
    description: generateToolDescription(),
    annotations: {
      openWorldHint: true,
    },
    parameters: z.object({
      resource: z.string().describe("Resource type (deals, persons, orgs, activities, notes, leads, products, pipelines, stages, users, goals, files, filters, webhooks, deal-fields, person-fields, org-fields, product-fields, currencies, roles, teams, mail, subscriptions, call-logs, recents, search, activity-types, lead-labels)"),
      action: z.string().describe("Action to perform (list, get, create, update, delete, search, etc.)"),
      id: z.union([z.string(), z.number()]).optional().describe("Resource ID (required for get/update/delete and sub-resources)"),
      params: z.record(z.string(), z.unknown()).optional().describe("Additional parameters as key-value pairs"),
    }),
    execute: async (args) => {
      const { resource, action, id, params } = args;

      const resourceRoutes = ROUTES[resource];
      if (!resourceRoutes) {
        const available = Object.keys(ROUTES).filter(k => k !== 'contacts' && k !== 'organizations').join(', ');
        return JSON.stringify({ success: false, error: `Unknown resource: ${resource}. Available: ${available}` });
      }

      const route = resourceRoutes[action];
      if (!route) {
        const actions = Object.keys(resourceRoutes).join(', ');
        return JSON.stringify({ success: false, error: `Unknown action: ${action}. Available for ${resource}: ${actions}` });
      }

      return executeRoute(client, route, id !== undefined ? String(id) : undefined, params || {});
    },
  });

  server.addTool({
    name: "pipedrive_overview",
    description: "Get a high-level CRM overview with recent deals and activities (token-optimized)",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
    },
    parameters: z.object({
      user_id: z.number().optional().describe("Filter by user ID"),
      include_recent_deals: z.boolean().optional().describe("Include recent deals (default true)"),
      include_recent_activities: z.boolean().optional().describe("Include recent activities (default true)"),
    }),
    execute: async (args) => {
      const result = await client.getOverview(args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "pipedrive_quarter",
    description: "Get quarterly deal summary with metrics and date context",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
    },
    parameters: z.object({
      quarter: z.enum(["Q1", "Q2", "Q3", "Q4", "current"]).optional().describe("Quarter (default: current)"),
      year: z.number().optional().describe("Year (default: current year)"),
      user_id: z.number().optional().describe("Filter by user ID"),
    }),
    execute: async (args) => {
      const result = await client.getQuarterSummary(
        args.quarter || "current",
        args.year,
        args.user_id,
      );
      const withContext = addDateContextToResponse(result);
      return JSON.stringify(withContext, null, 2);
    },
  });

  server.addTool({
    name: "pipedrive_search",
    description: "Search across all Pipedrive entities with token-optimized results",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
    },
    parameters: z.object({
      term: z.string().describe("Search term (min 2 characters)"),
      item_types: z.string().optional().describe("Comma-separated types to search: deal, person, organization, product, lead"),
      limit: z.number().optional().describe("Max results (default 10, max 20)"),
    }),
    execute: async ({ term, ...params }) => {
      const safeParams = { ...params, limit: Math.min(params.limit || 10, 20) };
      const result = await client.searchItems(term, safeParams);
      const optimized = optimizeResponse(result, "deals", { maxItems: 10, summarizeItems: true });
      return JSON.stringify(optimized, null, 2);
    },
  });
}
