import { PipedriveClient, runWithToken } from "../src/pipedrive-client";
import { registerUnifiedTools } from "../src/tools/unified";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface McpTool {
  name: string;
  description?: string;
  parameters?: any;
  annotations?: any;
  execute: (args: any) => Promise<any>;
}

export const tools: McpTool[] = [];
export const SESSION_ID = "pipedrive-mcp-static-session";

const toolCollector = { addTool(tool: McpTool) { tools.push(tool); } };
const client = new PipedriveClient({ apiToken: "placeholder" });

registerUnifiedTools(toolCollector as any, client);

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

export async function handleMessage(msg: any, pipedriveToken?: string) {
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
        const run = () => tool.execute(params?.arguments ?? {});
        const result = pipedriveToken ? await runWithToken(pipedriveToken, run) : await run();
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
