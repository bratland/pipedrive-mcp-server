#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import { PipedriveClient } from "./pipedrive-client.js";
import { registerUnifiedTools } from "./tools/unified.js";
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

registerUnifiedTools(server, client);

server.start({
  transportType: "stdio",
});
