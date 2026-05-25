import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerFileTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_files",
    description: "List files from Pipedrive",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
      sort: z.string().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/files", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_file",
    description: "Get a specific file by ID",
    parameters: z.object({ id: z.number().describe("File ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/files/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_remote_file_link",
    description: "Link a remote file (URL) to a Pipedrive item",
    parameters: z.object({
      file_type: z.enum(["gdoc", "gslides", "gsheet", "gform", "gdraw", "url"]).describe("Type of remote file"),
      title: z.string().describe("File title"),
      item_type: z.enum(["deal", "person", "organization", "activity", "lead", "product"]).describe("Entity to attach to"),
      item_id: z.number().describe("Entity ID"),
      remote_location: z.enum(["googledrive", "onedrive", "other"]),
      remote_id: z.string().describe("Remote file ID or URL"),
    }),
    execute: async (args) => {
      const result = await client.post("/files/remote", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "link_remote_file_to_item",
    description: "Link an existing remote file to an item",
    parameters: z.object({
      item_type: z.enum(["deal", "person", "organization", "activity", "lead", "product"]),
      item_id: z.number(),
      remote_id: z.string(),
      remote_location: z.enum(["googledrive", "onedrive", "other"]),
    }),
    execute: async (args) => {
      const result = await client.post("/files/remoteLink", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_file",
    description: "Delete a file",
    parameters: z.object({ id: z.number().describe("File ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/files/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
