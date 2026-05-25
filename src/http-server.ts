#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import { PipedriveClient } from "./pipedrive-client.js";
import { registerDealTools } from "./tools/deals.js";
import { registerPersonTools } from "./tools/persons.js";
import { registerOrganizationTools } from "./tools/organizations.js";
import { registerActivityTools } from "./tools/activities.js";
import { registerActivityTypeTools } from "./tools/activity-types.js";
import { registerNoteTools } from "./tools/notes.js";
import { registerLeadTools } from "./tools/leads.js";
import { registerLeadLabelTools } from "./tools/lead-labels.js";
import { registerProductTools } from "./tools/products.js";
import { registerPipelineTools } from "./tools/pipelines.js";
import { registerStageTools } from "./tools/stages.js";
import { registerUserTools } from "./tools/users.js";
import { registerGoalTools } from "./tools/goals.js";
import { registerFileTools } from "./tools/files.js";
import { registerFilterTools } from "./tools/filters.js";
import { registerWebhookTools } from "./tools/webhooks.js";
import { registerDealFieldTools } from "./tools/deal-fields.js";
import { registerPersonFieldTools } from "./tools/person-fields.js";
import { registerOrgFieldTools } from "./tools/org-fields.js";
import { registerProductFieldTools } from "./tools/product-fields.js";
import { registerCurrencyTools } from "./tools/currencies.js";
import { registerRoleTools } from "./tools/roles.js";
import { registerTeamTools } from "./tools/teams.js";
import { registerMailTools } from "./tools/mail.js";
import { registerSubscriptionTools } from "./tools/subscriptions.js";
import { registerCallLogTools } from "./tools/call-logs.js";
import { registerSearchTools } from "./tools/search.js";
import { registerRecentTools } from "./tools/recents.js";
import { registerOptimizedTools } from "./tools/optimized.js";
import { registerQuarterlyTools } from "./tools/quarterly.js";
import dotenv from "dotenv";
import http from "http";

dotenv.config();

const apiToken = process.env.PIPEDRIVE_API_TOKEN;
if (!apiToken) {
  console.error("Error: PIPEDRIVE_API_TOKEN environment variable is not set");
  process.exit(1);
}

const serverSecret = process.env.MCP_SERVER_SECRET;
if (!serverSecret) {
  console.error(
    "Error: MCP_SERVER_SECRET environment variable is not set. " +
      "Generate one with: openssl rand -hex 32"
  );
  process.exit(1);
}

const port = parseInt(process.env.PORT || "3100", 10);
const host = process.env.HOST || "0.0.0.0";

const client = new PipedriveClient({ apiToken });

type AuthSession = { authenticated: true };

const server = new FastMCP<AuthSession>({
  name: "pipedrive-mcp-server",
  version: "1.0.0",
  health: {
    enabled: true,
    path: "/health",
    message: "ok",
  },
  authenticate: async (request: http.IncomingMessage) => {
    const bearer = request.headers.authorization?.startsWith("Bearer ")
      ? request.headers.authorization.slice(7)
      : undefined;
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const key = url.searchParams.get("key") || undefined;
    if ((bearer || key) !== serverSecret) {
      throw new Error("Unauthorized");
    }
    return { authenticated: true };
  },
});

registerDealTools(server, client);
registerPersonTools(server, client);
registerOrganizationTools(server, client);
registerActivityTools(server, client);
registerActivityTypeTools(server, client);
registerNoteTools(server, client);
registerLeadTools(server, client);
registerLeadLabelTools(server, client);
registerProductTools(server, client);
registerPipelineTools(server, client);
registerStageTools(server, client);
registerUserTools(server, client);
registerGoalTools(server, client);
registerFileTools(server, client);
registerFilterTools(server, client);
registerWebhookTools(server, client);
registerDealFieldTools(server, client);
registerPersonFieldTools(server, client);
registerOrgFieldTools(server, client);
registerProductFieldTools(server, client);
registerCurrencyTools(server, client);
registerRoleTools(server, client);
registerTeamTools(server, client);
registerMailTools(server, client);
registerSubscriptionTools(server, client);
registerCallLogTools(server, client);
registerSearchTools(server, client);
registerRecentTools(server, client);
registerOptimizedTools(server, client);
registerQuarterlyTools(server, client);

server.start({
  transportType: "httpStream",
  httpStream: {
    port,
    host,
  },
}).then(() => {
  console.log(`Pipedrive MCP Server (HTTP Stream) listening on ${host}:${port}`);
  console.log(`MCP endpoint: http://${host}:${port}/mcp`);
  console.log(`Health check: http://${host}:${port}/health`);
});
