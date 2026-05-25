import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerCurrencyTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_currencies",
    description: "List all supported currencies in Pipedrive",
    parameters: z.object({
      term: z.string().optional().describe("Search term to filter currencies"),
    }),
    execute: async (args) => {
      const result = await client.get("/currencies", args);
      return JSON.stringify(result, null, 2);
    },
  });
}
