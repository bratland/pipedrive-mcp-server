import { PipedriveClient } from "../src/pipedrive-client";
import { registerDealTools } from "../src/tools/deals";
import { registerPersonTools } from "../src/tools/persons";
import { registerOrganizationTools } from "../src/tools/organizations";
import { registerActivityTools } from "../src/tools/activities";
import { registerActivityTypeTools } from "../src/tools/activity-types";
import { registerNoteTools } from "../src/tools/notes";
import { registerLeadTools } from "../src/tools/leads";
import { registerLeadLabelTools } from "../src/tools/lead-labels";
import { registerProductTools } from "../src/tools/products";
import { registerPipelineTools } from "../src/tools/pipelines";
import { registerStageTools } from "../src/tools/stages";
import { registerUserTools } from "../src/tools/users";
import { registerGoalTools } from "../src/tools/goals";
import { registerFileTools } from "../src/tools/files";
import { registerFilterTools } from "../src/tools/filters";
import { registerWebhookTools } from "../src/tools/webhooks";
import { registerDealFieldTools } from "../src/tools/deal-fields";
import { registerPersonFieldTools } from "../src/tools/person-fields";
import { registerOrgFieldTools } from "../src/tools/org-fields";
import { registerProductFieldTools } from "../src/tools/product-fields";
import { registerCurrencyTools } from "../src/tools/currencies";
import { registerRoleTools } from "../src/tools/roles";
import { registerTeamTools } from "../src/tools/teams";
import { registerMailTools } from "../src/tools/mail";
import { registerSubscriptionTools } from "../src/tools/subscriptions";
import { registerCallLogTools } from "../src/tools/call-logs";
import { registerSearchTools } from "../src/tools/search";
import { registerRecentTools } from "../src/tools/recents";
import { registerOptimizedTools } from "../src/tools/optimized";
import { registerQuarterlyTools } from "../src/tools/quarterly";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface McpTool {
  name: string;
  description?: string;
  parameters?: any;
  execute: (args: any) => Promise<any>;
}

export const tools: McpTool[] = [];
export const serverSecret = process.env.MCP_SERVER_SECRET!;
export const SESSION_ID = "pipedrive-mcp-static-session";

const toolCollector = { addTool(tool: McpTool) { tools.push(tool); } };
const client = new PipedriveClient({ apiToken: process.env.PIPEDRIVE_API_TOKEN! });

registerDealTools(toolCollector as any, client);
registerPersonTools(toolCollector as any, client);
registerOrganizationTools(toolCollector as any, client);
registerActivityTools(toolCollector as any, client);
registerActivityTypeTools(toolCollector as any, client);
registerNoteTools(toolCollector as any, client);
registerLeadTools(toolCollector as any, client);
registerLeadLabelTools(toolCollector as any, client);
registerProductTools(toolCollector as any, client);
registerPipelineTools(toolCollector as any, client);
registerStageTools(toolCollector as any, client);
registerUserTools(toolCollector as any, client);
registerGoalTools(toolCollector as any, client);
registerFileTools(toolCollector as any, client);
registerFilterTools(toolCollector as any, client);
registerWebhookTools(toolCollector as any, client);
registerDealFieldTools(toolCollector as any, client);
registerPersonFieldTools(toolCollector as any, client);
registerOrgFieldTools(toolCollector as any, client);
registerProductFieldTools(toolCollector as any, client);
registerCurrencyTools(toolCollector as any, client);
registerRoleTools(toolCollector as any, client);
registerTeamTools(toolCollector as any, client);
registerMailTools(toolCollector as any, client);
registerSubscriptionTools(toolCollector as any, client);
registerCallLogTools(toolCollector as any, client);
registerSearchTools(toolCollector as any, client);
registerRecentTools(toolCollector as any, client);
registerOptimizedTools(toolCollector as any, client);
registerQuarterlyTools(toolCollector as any, client);

function schemaToJsonSchema(schema: any): any {
  try {
    if (typeof z.toJSONSchema === "function") return z.toJSONSchema(schema);
    if ("_def" in schema || schema instanceof z.ZodType) return zodToJsonSchema(schema, { target: "openApi3" });
    return { type: "object" };
  } catch { return { type: "object" }; }
}

export function rpcError(id: any, code: number, message: string) {
  return { error: { code, message }, id, jsonrpc: "2.0" };
}

export async function handleMessage(msg: any) {
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0") {
    return rpcError(msg?.id ?? null, -32600, "Invalid Request");
  }
  if (!("id" in msg) || msg.id === undefined) return null;

  const { method, params, id } = msg;

  switch (method) {
    case "initialize":
      return {
        id, jsonrpc: "2.0",
        result: {
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "pipedrive-mcp-server", version: "1.0.0" },
        },
      };
    case "ping":
      return { id, jsonrpc: "2.0", result: {} };
    case "tools/list":
      return {
        id, jsonrpc: "2.0",
        result: {
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.parameters ? schemaToJsonSchema(t.parameters) : { type: "object" },
          })),
        },
      };
    case "tools/call": {
      const tool = tools.find((t) => t.name === params?.name);
      if (!tool) return rpcError(id, -32602, `Tool not found: ${params?.name}`);
      try {
        const result = await tool.execute(params?.arguments ?? {});
        const content = typeof result === "string"
          ? [{ type: "text", text: result }]
          : result?.content ?? [{ type: "text", text: JSON.stringify(result) }];
        return { id, jsonrpc: "2.0", result: { content } };
      } catch (error: any) {
        return rpcError(id, -32603, `Tool error: ${error.message}`);
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
