import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerRoleTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_roles",
    description: "List all roles",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/roles", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_role",
    description: "Get a specific role",
    parameters: z.object({ id: z.number().describe("Role ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/roles/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_role",
    description: "Create a new role",
    parameters: z.object({
      name: z.string().describe("Role name"),
      parent_role_id: z.number().optional().describe("Parent role ID (0 for top-level)"),
    }),
    execute: async (args) => {
      const result = await client.post("/roles", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_role",
    description: "Update a role",
    parameters: z.object({
      id: z.number().describe("Role ID"),
      name: z.string().optional(),
      parent_role_id: z.number().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/roles/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_role",
    description: "Delete a role",
    parameters: z.object({ id: z.number().describe("Role ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/roles/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_role_assignments",
    description: "List users assigned to a role",
    parameters: z.object({
      id: z.number().describe("Role ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/roles/${id}/assignments`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_role_settings",
    description: "Get settings for a role",
    parameters: z.object({ id: z.number().describe("Role ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/roles/${id}/settings`);
      return JSON.stringify(result, null, 2);
    },
  });
}
