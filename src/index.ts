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

dotenv.config();

const apiToken = process.env.PIPEDRIVE_API_TOKEN;
if (!apiToken) {
  console.error("Error: PIPEDRIVE_API_TOKEN environment variable is not set");
  process.exit(1);
}

const client = new PipedriveClient({ apiToken });

const server = new FastMCP({
  name: "pipedrive-mcp-server",
  version: "1.0.0",
});

// Register all tool groups
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
  transportType: "stdio",
});
