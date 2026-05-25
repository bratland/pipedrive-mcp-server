import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerPersonTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_persons",
    description: "List persons/contacts from Pipedrive",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
      user_id: z.number().optional().describe("Filter by owner user ID"),
      filter_id: z.number().optional(),
      first_char: z.string().optional().describe("Filter by first letter of name"),
      sort: z.string().optional().describe("Field and order, e.g. 'name ASC'"),
    }),
    execute: async (args) => {
      const result = await client.get("/persons", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_person",
    description: "Get a specific person by ID",
    parameters: z.object({
      id: z.number().describe("Person ID"),
    }),
    execute: async ({ id }) => {
      const result = await client.get(`/persons/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_person",
    description: "Create a new person/contact",
    parameters: z.object({
      name: z.string().describe("Person name"),
      owner_id: z.number().optional().describe("Owner user ID"),
      org_id: z.number().optional().describe("Organization ID"),
      email: z.union([z.string(), z.array(z.object({ value: z.string(), primary: z.boolean().optional(), label: z.string().optional() }))]).optional().describe("Email address or array of emails"),
      phone: z.union([z.string(), z.array(z.object({ value: z.string(), primary: z.boolean().optional(), label: z.string().optional() }))]).optional().describe("Phone number or array of phones"),
      visible_to: z.enum(["1", "3", "5", "7"]).optional(),
      marketing_status: z.enum(["no_consent", "unsubscribed", "subscribed", "archived"]).optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/persons", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_person",
    description: "Update an existing person",
    parameters: z.object({
      id: z.number().describe("Person ID"),
      name: z.string().optional(),
      owner_id: z.number().optional(),
      org_id: z.number().optional(),
      email: z.union([z.string(), z.array(z.object({ value: z.string(), primary: z.boolean().optional(), label: z.string().optional() }))]).optional(),
      phone: z.union([z.string(), z.array(z.object({ value: z.string(), primary: z.boolean().optional(), label: z.string().optional() }))]).optional(),
      visible_to: z.enum(["1", "3", "5", "7"]).optional(),
      marketing_status: z.enum(["no_consent", "unsubscribed", "subscribed", "archived"]).optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/persons/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_person",
    description: "Delete a person",
    parameters: z.object({
      id: z.number().describe("Person ID"),
    }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/persons/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "search_persons",
    description: "Search for persons by term",
    parameters: z.object({
      term: z.string().describe("Search term"),
      fields: z.string().optional().describe("Fields to search (comma-separated): name, email, phone, notes"),
      exact_match: z.boolean().optional(),
      org_id: z.number().optional(),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/persons/search", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "merge_persons",
    description: "Merge two persons into one",
    parameters: z.object({
      id: z.number().describe("Person ID to keep"),
      merge_with_id: z.number().describe("Person ID to merge and remove"),
    }),
    execute: async ({ id, merge_with_id }) => {
      const result = await client.put(`/persons/${id}/merge`, { merge_with_id });
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_person_deals",
    description: "List deals associated with a person",
    parameters: z.object({
      id: z.number().describe("Person ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
      status: z.enum(["all_not_deleted", "open", "won", "lost", "deleted"]).optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/persons/${id}/deals`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_person_activities",
    description: "List activities associated with a person",
    parameters: z.object({
      id: z.number().describe("Person ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
      done: z.enum(["0", "1"]).optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/persons/${id}/activities`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_person_flow",
    description: "List updates/flow of a person",
    parameters: z.object({
      id: z.number().describe("Person ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/persons/${id}/flow`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_person_files",
    description: "List files attached to a person",
    parameters: z.object({
      id: z.number().describe("Person ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/persons/${id}/files`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_person_followers",
    description: "List followers of a person",
    parameters: z.object({
      id: z.number().describe("Person ID"),
    }),
    execute: async ({ id }) => {
      const result = await client.get(`/persons/${id}/followers`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "add_person_follower",
    description: "Add a follower to a person",
    parameters: z.object({
      id: z.number().describe("Person ID"),
      user_id: z.number().describe("User ID to add as follower"),
    }),
    execute: async ({ id, user_id }) => {
      const result = await client.post(`/persons/${id}/followers`, { user_id });
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_person_follower",
    description: "Remove a follower from a person",
    parameters: z.object({
      id: z.number().describe("Person ID"),
      follower_id: z.number().describe("Follower ID"),
    }),
    execute: async ({ id, follower_id }) => {
      const result = await client.deleteRequest(`/persons/${id}/followers/${follower_id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
