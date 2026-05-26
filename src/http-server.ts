#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import { PipedriveClient } from "./pipedrive-client.js";
import { registerUnifiedTools } from "./tools/unified.js";
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

registerUnifiedTools(server, client);

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
