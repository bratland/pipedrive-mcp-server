import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerOrganizationTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_organizations",
    description: "List organizations from Pipedrive",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
      user_id: z.number().optional(),
      filter_id: z.number().optional(),
      first_char: z.string().optional(),
      sort: z.string().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/organizations", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_organization",
    description: "Get a specific organization by ID",
    parameters: z.object({ id: z.number().describe("Organization ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/organizations/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_organization",
    description: "Create a new organization",
    parameters: z.object({
      name: z.string().describe("Organization name"),
      owner_id: z.number().optional(),
      visible_to: z.enum(["1", "3", "5", "7"]).optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/organizations", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_organization",
    description: "Update an existing organization",
    parameters: z.object({
      id: z.number().describe("Organization ID"),
      name: z.string().optional(),
      owner_id: z.number().optional(),
      visible_to: z.enum(["1", "3", "5", "7"]).optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/organizations/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_organization",
    description: "Delete an organization",
    parameters: z.object({ id: z.number().describe("Organization ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/organizations/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "search_organizations",
    description: "Search for organizations",
    parameters: z.object({
      term: z.string().describe("Search term"),
      fields: z.string().optional(),
      exact_match: z.boolean().optional(),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/organizations/search", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "merge_organizations",
    description: "Merge two organizations",
    parameters: z.object({
      id: z.number().describe("Organization ID to keep"),
      merge_with_id: z.number().describe("Organization ID to merge and remove"),
    }),
    execute: async ({ id, merge_with_id }) => {
      const result = await client.put(`/organizations/${id}/merge`, { merge_with_id });
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_organization_deals",
    description: "List deals associated with an organization",
    parameters: z.object({
      id: z.number().describe("Organization ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
      status: z.enum(["all_not_deleted", "open", "won", "lost", "deleted"]).optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/organizations/${id}/deals`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_organization_persons",
    description: "List persons in an organization",
    parameters: z.object({
      id: z.number().describe("Organization ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/organizations/${id}/persons`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_organization_activities",
    description: "List activities associated with an organization",
    parameters: z.object({
      id: z.number().describe("Organization ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
      done: z.enum(["0", "1"]).optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/organizations/${id}/activities`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_organization_flow",
    description: "List updates/flow of an organization",
    parameters: z.object({
      id: z.number().describe("Organization ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/organizations/${id}/flow`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_organization_files",
    description: "List files attached to an organization",
    parameters: z.object({
      id: z.number().describe("Organization ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/organizations/${id}/files`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_organization_followers",
    description: "List followers of an organization",
    parameters: z.object({ id: z.number().describe("Organization ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/organizations/${id}/followers`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "add_organization_follower",
    description: "Add a follower to an organization",
    parameters: z.object({
      id: z.number().describe("Organization ID"),
      user_id: z.number().describe("User ID to add"),
    }),
    execute: async ({ id, user_id }) => {
      const result = await client.post(`/organizations/${id}/followers`, { user_id });
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_organization_follower",
    description: "Remove a follower from an organization",
    parameters: z.object({
      id: z.number().describe("Organization ID"),
      follower_id: z.number().describe("Follower ID"),
    }),
    execute: async ({ id, follower_id }) => {
      const result = await client.deleteRequest(`/organizations/${id}/followers/${follower_id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
