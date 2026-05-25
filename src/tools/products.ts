import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerProductTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_products",
    description: "List products from Pipedrive",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
      user_id: z.number().optional(),
      filter_id: z.number().optional(),
      first_char: z.string().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/products", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_product",
    description: "Get a specific product by ID",
    parameters: z.object({ id: z.number().describe("Product ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/products/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_product",
    description: "Create a new product",
    parameters: z.object({
      name: z.string().describe("Product name"),
      code: z.string().optional().describe("Product code/SKU"),
      unit: z.string().optional().describe("Unit name"),
      tax: z.number().optional().describe("Tax percentage"),
      active_flag: z.boolean().optional(),
      visible_to: z.enum(["1", "3", "5", "7"]).optional(),
      owner_id: z.number().optional(),
      prices: z.array(z.object({
        currency: z.string(),
        price: z.number(),
        cost: z.number().optional(),
        overhead_cost: z.number().optional(),
      })).optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/products", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_product",
    description: "Update an existing product",
    parameters: z.object({
      id: z.number().describe("Product ID"),
      name: z.string().optional(),
      code: z.string().optional(),
      unit: z.string().optional(),
      tax: z.number().optional(),
      active_flag: z.boolean().optional(),
      visible_to: z.enum(["1", "3", "5", "7"]).optional(),
      owner_id: z.number().optional(),
      prices: z.array(z.object({
        currency: z.string(),
        price: z.number(),
        cost: z.number().optional(),
        overhead_cost: z.number().optional(),
      })).optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/products/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_product",
    description: "Delete a product",
    parameters: z.object({ id: z.number().describe("Product ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/products/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "search_products",
    description: "Search for products",
    parameters: z.object({
      term: z.string().describe("Search term"),
      fields: z.string().optional(),
      exact_match: z.boolean().optional(),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/products/search", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_product_deals",
    description: "List deals associated with a product",
    parameters: z.object({
      id: z.number().describe("Product ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
      status: z.enum(["all_not_deleted", "open", "won", "lost", "deleted"]).optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/products/${id}/deals`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_product_files",
    description: "List files attached to a product",
    parameters: z.object({
      id: z.number().describe("Product ID"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const result = await client.get(`/products/${id}/files`, params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_product_followers",
    description: "List followers of a product",
    parameters: z.object({ id: z.number().describe("Product ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/products/${id}/followers`);
      return JSON.stringify(result, null, 2);
    },
  });
}
