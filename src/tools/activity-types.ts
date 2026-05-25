import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerActivityTypeTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_activity_types",
    description: "List all activity types",
    parameters: z.object({}),
    execute: async () => {
      const result = await client.get("/activityTypes");
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_activity_type",
    description: "Create a new activity type",
    parameters: z.object({
      name: z.string().describe("Activity type name"),
      icon_key: z.string().describe("Icon key (e.g. task, email, meeting, deadline, call, lunch)"),
      color: z.string().optional().describe("Hex color code"),
    }),
    execute: async (args) => {
      const result = await client.post("/activityTypes", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_activity_type",
    description: "Update an activity type",
    parameters: z.object({
      id: z.number().describe("Activity type ID"),
      name: z.string().optional(),
      icon_key: z.string().optional(),
      color: z.string().optional(),
      order_nr: z.number().optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/activityTypes/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_activity_type",
    description: "Delete an activity type",
    parameters: z.object({ id: z.number().describe("Activity type ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/activityTypes/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
