import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerActivityTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_activities",
    description: "List activities from Pipedrive",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
      user_id: z.number().optional(),
      filter_id: z.number().optional(),
      type: z.string().optional().describe("Activity type (e.g. call, meeting, email)"),
      done: z.enum(["0", "1"]).optional().describe("0=undone, 1=done"),
      start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
    }),
    execute: async (args) => {
      const result = await client.get("/activities", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_activity",
    description: "Get a specific activity by ID",
    parameters: z.object({ id: z.number().describe("Activity ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/activities/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_activity",
    description: "Create a new activity",
    parameters: z.object({
      subject: z.string().describe("Activity subject/title"),
      type: z.string().describe("Activity type (call, meeting, task, deadline, email, lunch)"),
      done: z.enum(["0", "1"]).optional(),
      due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
      due_time: z.string().optional().describe("Due time (HH:MM)"),
      duration: z.string().optional().describe("Duration (HH:MM)"),
      user_id: z.number().optional(),
      deal_id: z.number().optional(),
      person_id: z.number().optional(),
      org_id: z.number().optional(),
      note: z.string().optional().describe("Activity note/description"),
      location: z.string().optional(),
      public_description: z.string().optional(),
      busy_flag: z.boolean().optional(),
      participants: z.array(z.object({ person_id: z.number(), primary_flag: z.boolean().optional() })).optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/activities", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_activity",
    description: "Update an existing activity",
    parameters: z.object({
      id: z.number().describe("Activity ID"),
      subject: z.string().optional(),
      type: z.string().optional(),
      done: z.enum(["0", "1"]).optional(),
      due_date: z.string().optional(),
      due_time: z.string().optional(),
      duration: z.string().optional(),
      user_id: z.number().optional(),
      deal_id: z.number().optional(),
      person_id: z.number().optional(),
      org_id: z.number().optional(),
      note: z.string().optional(),
      location: z.string().optional(),
      busy_flag: z.boolean().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/activities/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_activity",
    description: "Delete an activity",
    parameters: z.object({ id: z.number().describe("Activity ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/activities/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
