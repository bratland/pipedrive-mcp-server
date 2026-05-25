import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerTeamTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_teams",
    description: "List all teams (legacy teams endpoint)",
    parameters: z.object({
      order_by: z.enum(["id", "name", "manager_id", "active_flag"]).optional(),
      skip_users: z.enum(["0", "1"]).optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/legacyTeams", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_team",
    description: "Get a specific team",
    parameters: z.object({
      id: z.number().describe("Team ID"),
      skip_users: z.enum(["0", "1"]).optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/legacyTeams/${id}`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_team",
    description: "Create a new team",
    parameters: z.object({
      name: z.string().describe("Team name"),
      manager_id: z.number().describe("Manager user ID"),
      description: z.string().optional(),
      users: z.array(z.number()).optional().describe("Array of user IDs"),
    }),
    execute: async (args) => {
      const result = await client.post("/legacyTeams", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_team",
    description: "Update a team",
    parameters: z.object({
      id: z.number().describe("Team ID"),
      name: z.string().optional(),
      manager_id: z.number().optional(),
      description: z.string().optional(),
      users: z.array(z.number()).optional(),
      active_flag: z.boolean().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/legacyTeams/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_team_users",
    description: "List users in a team",
    parameters: z.object({ id: z.number().describe("Team ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/legacyTeams/${id}/users`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "add_team_user",
    description: "Add users to a team",
    parameters: z.object({
      id: z.number().describe("Team ID"),
      users: z.array(z.number()).describe("User IDs to add"),
    }),
    execute: async ({ id, users }) => {
      const result = await client.post(`/legacyTeams/${id}/users`, { users });
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_team_user",
    description: "Remove users from a team",
    parameters: z.object({
      id: z.number().describe("Team ID"),
      users: z.array(z.number()).describe("User IDs to remove"),
    }),
    execute: async ({ id, users }) => {
      const result = await client.deleteRequest(`/legacyTeams/${id}/users`);
      return JSON.stringify(result, null, 2);
    },
  });
}
