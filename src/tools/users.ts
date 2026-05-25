import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerUserTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_users",
    description: "List all users in the Pipedrive company",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/users", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_user",
    description: "Get a specific user by ID",
    parameters: z.object({ id: z.number().describe("User ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/users/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_current_user",
    description: "Get the current authenticated user",
    parameters: z.object({}),
    execute: async () => {
      const result = await client.get("/users/me");
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_user_permissions",
    description: "List permission sets assigned to a user",
    parameters: z.object({ id: z.number().describe("User ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/users/${id}/permissions`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_user_role_assignments",
    description: "List role assignments for a user",
    parameters: z.object({ id: z.number().describe("User ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/users/${id}/roleAssignments`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_user_role_settings",
    description: "List role settings for a user",
    parameters: z.object({ id: z.number().describe("User ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/users/${id}/roleSettings`);
      return JSON.stringify(result, null, 2);
    },
  });
}
