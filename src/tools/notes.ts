import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerNoteTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_notes",
    description: "List notes from Pipedrive",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
      user_id: z.number().optional(),
      deal_id: z.number().optional(),
      person_id: z.number().optional(),
      org_id: z.number().optional(),
      pinned_to_deal_flag: z.enum(["0", "1"]).optional(),
      pinned_to_person_flag: z.enum(["0", "1"]).optional(),
      pinned_to_organization_flag: z.enum(["0", "1"]).optional(),
      sort: z.string().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/notes", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_note",
    description: "Get a specific note by ID",
    parameters: z.object({ id: z.number().describe("Note ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/notes/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_note",
    description: "Create a new note",
    parameters: z.object({
      content: z.string().describe("Note content (HTML supported)"),
      deal_id: z.number().optional().describe("Attach to deal"),
      person_id: z.number().optional().describe("Attach to person"),
      org_id: z.number().optional().describe("Attach to organization"),
      lead_id: z.string().optional().describe("Attach to lead (UUID)"),
      pinned_to_deal_flag: z.enum(["0", "1"]).optional(),
      pinned_to_person_flag: z.enum(["0", "1"]).optional(),
      pinned_to_organization_flag: z.enum(["0", "1"]).optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/notes", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_note",
    description: "Update an existing note",
    parameters: z.object({
      id: z.number().describe("Note ID"),
      content: z.string().optional(),
      deal_id: z.number().optional(),
      person_id: z.number().optional(),
      org_id: z.number().optional(),
      lead_id: z.string().optional(),
      pinned_to_deal_flag: z.enum(["0", "1"]).optional(),
      pinned_to_person_flag: z.enum(["0", "1"]).optional(),
      pinned_to_organization_flag: z.enum(["0", "1"]).optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/notes/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_note",
    description: "Delete a note",
    parameters: z.object({ id: z.number().describe("Note ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/notes/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
