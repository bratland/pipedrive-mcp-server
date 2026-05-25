import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerRecentTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_recents",
    description: "List recent changes across all entity types in Pipedrive",
    parameters: z.object({
      since_timestamp: z.string().describe("Timestamp to fetch changes since (YYYY-MM-DD HH:MM:SS)"),
      items: z.string().optional().describe("Entity types: deal, person, organization, activity, note, product, file, pipeline, stage, user"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/recents", args);
      return JSON.stringify(result, null, 2);
    },
  });
}
