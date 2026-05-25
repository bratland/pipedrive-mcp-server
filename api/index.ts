import type { VercelRequest, VercelResponse } from "@vercel/node";
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

const apiToken = process.env.PIPEDRIVE_API_TOKEN!;
const serverSecret = process.env.MCP_SERVER_SECRET!;
const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://pipedrive-mcp-five.vercel.app";

const landingPage = `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pipedrive MCP Server</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e5e5e5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem}
.card{background:#171717;border:1px solid #262626;border-radius:12px;padding:2.5rem;max-width:540px;width:100%}
h1{font-size:1.25rem;font-weight:600;margin-bottom:.25rem}
.sub{color:#a3a3a3;font-size:.875rem;margin-bottom:2rem}
label{display:block;font-size:.8125rem;font-weight:500;color:#a3a3a3;margin-bottom:.375rem}
input{width:100%;padding:.625rem .75rem;background:#0a0a0a;border:1px solid #333;border-radius:8px;color:#e5e5e5;font-size:.875rem;font-family:ui-monospace,monospace;outline:none;transition:border-color .15s}
input:focus{border-color:#3b82f6}
button{width:100%;padding:.625rem;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;margin-top:1rem;transition:background .15s}
button:hover{background:#2563eb}
.output{display:none;margin-top:1.5rem}
.output.show{display:block}
.field{margin-bottom:1rem}
.field-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:.375rem}
.copy{background:none;border:none;color:#3b82f6;font-size:.75rem;cursor:pointer;padding:0;margin:0;width:auto;font-weight:400}
.copy:hover{color:#60a5fa;background:none}
.copy.done{color:#22c55e}
pre{background:#0a0a0a;border:1px solid #262626;border-radius:8px;padding:.75rem;font-size:.8125rem;font-family:ui-monospace,monospace;overflow-x:auto;white-space:pre;line-height:1.5;color:#d4d4d4}
.tag{display:inline-block;background:#1e3a5f;color:#93c5fd;font-size:.6875rem;font-weight:500;padding:.125rem .5rem;border-radius:99px;margin-left:.5rem}
.info{color:#737373;font-size:.75rem;margin-top:1.5rem;line-height:1.5}
</style>
</head>
<body>
<div class="card">
  <h1>Pipedrive MCP Server <span class="tag">187 tools</span></h1>
  <p class="sub">Generera en MCP-anslutnings-URL for Claude Desktop, Claude Code, eller annan MCP-klient.</p>
  <div>
    <label for="key">Server-nyckel</label>
    <input type="password" id="key" placeholder="Klistra in nyckeln du fatt" autocomplete="off">
  </div>
  <button onclick="generate()">Generera URL</button>
  <div class="output" id="output">
    <div class="field">
      <div class="field-label">
        <label>MCP URL</label>
        <button class="copy" onclick="copyText('url-val',this)">Kopiera</button>
      </div>
      <pre id="url-val"></pre>
    </div>
    <div class="field">
      <div class="field-label">
        <label>Claude Desktop / Code config</label>
        <button class="copy" onclick="copyText('config-val',this)">Kopiera</button>
      </div>
      <pre id="config-val"></pre>
    </div>
  </div>
  <p class="info">Nyckeln skickas som URL-parameter. Dela aldrig URL:en offentligt.</p>
</div>
<script>
const BASE="${baseUrl}";
function generate(){
  const k=document.getElementById("key").value.trim();
  if(!k)return;
  const url=BASE+"/mcp?key="+encodeURIComponent(k);
  document.getElementById("url-val").textContent=url;
  document.getElementById("config-val").textContent=JSON.stringify({"mcpServers":{"pipedrive":{"type":"streamable-http","url":url}}},null,2);
  document.getElementById("output").classList.add("show");
}
function copyText(id,btn){
  navigator.clipboard.writeText(document.getElementById(id).textContent);
  btn.textContent="Kopierad!";btn.classList.add("done");
  setTimeout(()=>{btn.textContent="Kopiera";btn.classList.remove("done")},1500);
}
document.getElementById("key").addEventListener("keydown",e=>{if(e.key==="Enter")generate()});
</script>
</body>
</html>`;


interface McpTool {
  name: string;
  description?: string;
  parameters?: any;
  execute: (args: any) => Promise<any>;
}

const tools: McpTool[] = [];

const toolCollector = {
  addTool(tool: McpTool) {
    tools.push(tool);
  },
};

const client = new PipedriveClient({ apiToken });

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
    if (typeof z.toJSONSchema === "function") {
      return z.toJSONSchema(schema);
    }
    if ("_def" in schema || schema instanceof z.ZodType) {
      return zodToJsonSchema(schema, { target: "openApi3" });
    }
    return { type: "object" };
  } catch {
    return { type: "object" };
  }
}

function rpcError(id: any, code: number, message: string) {
  return { error: { code, message }, id, jsonrpc: "2.0" };
}

async function handleMessage(msg: any) {
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0") {
    return rpcError(msg?.id ?? null, -32600, "Invalid Request");
  }
  if (!("id" in msg) || msg.id === undefined) return null;

  const { method, params, id } = msg;

  switch (method) {
    case "initialize":
      return {
        id,
        jsonrpc: "2.0",
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
        id,
        jsonrpc: "2.0",
        result: {
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.parameters
              ? schemaToJsonSchema(t.parameters)
              : { type: "object" },
          })),
        },
      };
    case "tools/call": {
      const tool = tools.find((t) => t.name === params?.name);
      if (!tool) return rpcError(id, -32602, `Tool not found: ${params?.name}`);
      try {
        const result = await tool.execute(params?.arguments ?? {});
        const content =
          typeof result === "string"
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Mcp-Session-Id"
  );

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    const path = req.url?.split("?")[0] || "/";
    if (path === "/health") return res.status(200).send("ok");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(landingPage);
  }

  if (req.method === "DELETE") return res.status(204).end();

  if (req.method !== "POST") return res.status(405).json(rpcError(null, -32000, "Method not allowed"));

  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const key = typeof req.query.key === "string" ? req.query.key : undefined;
  if ((bearer || key) !== serverSecret) {
    return res.status(401).json(rpcError(null, -32000, "Unauthorized"));
  }

  const body = req.body;
  const messages = Array.isArray(body) ? body : [body];
  const responses: any[] = [];

  for (const msg of messages) {
    const response = await handleMessage(msg);
    if (response) responses.push(response);
  }

  if (responses.length === 0) return res.status(202).end();

  res.setHeader("Content-Type", "application/json");
  return res.json(responses.length === 1 ? responses[0] : responses);
}
