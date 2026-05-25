import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerDealTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_deals",
    description: "List deals from Pipedrive with optional filters",
    parameters: z.object({
      start: z.number().optional().describe("Pagination start (default: 0)"),
      limit: z.number().optional().describe("Items per page (max 500)"),
      status: z.enum(["all_not_deleted", "open", "won", "lost", "deleted"]).optional(),
      filter_id: z.number().optional().describe("Predefined filter ID"),
      user_id: z.number().optional().describe("Filter by owner user ID"),
      person_id: z.number().optional().describe("Filter by associated person"),
      org_id: z.number().optional().describe("Filter by associated organization"),
      stage_id: z.number().optional().describe("Filter by stage"),
      sort: z.string().optional().describe("Field and order to sort by, e.g. 'update_time DESC'"),
    }),
    execute: async (args) => {
      const result = await client.get("/deals", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_deal",
    description: "Get a specific deal by ID",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
    }),
    execute: async ({ id }) => {
      const result = await client.get(`/deals/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_deal",
    description: "Create a new deal in Pipedrive",
    parameters: z.object({
      title: z.string().describe("Deal title"),
      value: z.number().optional().describe("Deal value"),
      currency: z.string().optional().describe("Currency code (e.g. SEK, EUR, USD)"),
      user_id: z.number().optional().describe("Owner user ID"),
      person_id: z.number().optional().describe("Associated person ID"),
      org_id: z.number().optional().describe("Associated organization ID"),
      pipeline_id: z.number().optional().describe("Pipeline ID"),
      stage_id: z.number().optional().describe("Stage ID"),
      status: z.enum(["open", "won", "lost", "deleted"]).optional(),
      expected_close_date: z.string().optional().describe("Expected close date (YYYY-MM-DD)"),
      probability: z.number().optional().describe("Deal success probability (0-100)"),
      lost_reason: z.string().optional(),
      visible_to: z.enum(["1", "3", "5", "7"]).optional().describe("Visibility: 1=owner, 3=owner+group, 5=owner+group+company, 7=everyone"),
    }),
    execute: async (args) => {
      const result = await client.post("/deals", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_deal",
    description: "Update an existing deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      title: z.string().optional(),
      value: z.number().optional(),
      currency: z.string().optional(),
      user_id: z.number().optional(),
      person_id: z.number().optional(),
      org_id: z.number().optional(),
      pipeline_id: z.number().optional(),
      stage_id: z.number().optional(),
      status: z.enum(["open", "won", "lost", "deleted"]).optional(),
      expected_close_date: z.string().optional(),
      probability: z.number().optional(),
      lost_reason: z.string().optional(),
      visible_to: z.enum(["1", "3", "5", "7"]).optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/deals/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_deal",
    description: "Delete a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
    }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/deals/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "search_deals",
    description: "Search for deals by term",
    parameters: z.object({
      term: z.string().describe("Search term"),
      fields: z.string().optional().describe("Fields to search in (comma-separated)"),
      exact_match: z.boolean().optional(),
      person_id: z.number().optional(),
      org_id: z.number().optional(),
      status: z.enum(["open", "won", "lost"]).optional(),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/deals/search", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "merge_deals",
    description: "Merge two deals into one",
    parameters: z.object({
      id: z.number().describe("Deal ID to keep"),
      merge_with_id: z.number().describe("Deal ID to merge and remove"),
    }),
    execute: async ({ id, merge_with_id }) => {
      const result = await client.put(`/deals/${id}/merge`, { merge_with_id });
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "duplicate_deal",
    description: "Duplicate a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID to duplicate"),
    }),
    execute: async ({ id }) => {
      const result = await client.post(`/deals/${id}/duplicate`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_deal_followers",
    description: "List followers of a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
    }),
    execute: async ({ id }) => {
      const result = await client.get(`/deals/${id}/followers`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "add_deal_follower",
    description: "Add a follower to a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      user_id: z.number().describe("User ID to add as follower"),
    }),
    execute: async ({ id, user_id }) => {
      const result = await client.post(`/deals/${id}/followers`, { user_id });
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_deal_follower",
    description: "Remove a follower from a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      follower_id: z.number().describe("Follower ID to remove"),
    }),
    execute: async ({ id, follower_id }) => {
      const result = await client.deleteRequest(`/deals/${id}/followers/${follower_id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_deal_participants",
    description: "List participants of a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/deals/${id}/participants`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "add_deal_participant",
    description: "Add a participant (person) to a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      person_id: z.number().describe("Person ID to add as participant"),
    }),
    execute: async ({ id, person_id }) => {
      const result = await client.post(`/deals/${id}/participants`, { person_id });
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_deal_participant",
    description: "Remove a participant from a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      deal_participant_id: z.number().describe("Participant ID to remove"),
    }),
    execute: async ({ id, deal_participant_id }) => {
      const result = await client.deleteRequest(`/deals/${id}/participants/${deal_participant_id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_deal_products",
    description: "List products attached to a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/deals/${id}/products`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "add_deal_product",
    description: "Add a product to a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      product_id: z.number().describe("Product ID"),
      item_price: z.number().describe("Price per unit"),
      quantity: z.number().describe("Quantity"),
      discount_percentage: z.number().optional().describe("Discount percentage (0-100)"),
      duration: z.number().optional(),
      product_variation_id: z.number().optional(),
      comments: z.string().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.post(`/deals/${id}/products`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_deal_product",
    description: "Update a product attached to a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      deal_product_id: z.number().describe("Deal-product attachment ID"),
      item_price: z.number().optional(),
      quantity: z.number().optional(),
      discount_percentage: z.number().optional(),
      duration: z.number().optional(),
      comments: z.string().optional(),
    }),
    execute: async ({ id, deal_product_id, ...data }) => {
      const result = await client.put(`/deals/${id}/products/${deal_product_id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_deal_product",
    description: "Remove a product from a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      deal_product_id: z.number().describe("Deal-product attachment ID"),
    }),
    execute: async ({ id, deal_product_id }) => {
      const result = await client.deleteRequest(`/deals/${id}/products/${deal_product_id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_deal_activities",
    description: "List activities associated with a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
      done: z.enum(["0", "1"]).optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/deals/${id}/activities`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_deal_flow",
    description: "List updates (flow/timeline) of a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/deals/${id}/flow`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_deal_files",
    description: "List files attached to a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/deals/${id}/files`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_deal_mail_messages",
    description: "List mail messages associated with a deal",
    parameters: z.object({
      id: z.number().describe("Deal ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/deals/${id}/mailMessages`, params);
      return JSON.stringify(result, null, 2);
    },
  });
}
