import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerCallLogTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_call_logs",
    description: "List call logs",
    parameters: z.object({
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/callLogs", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_call_log",
    description: "Get a specific call log by ID",
    parameters: z.object({ id: z.string().describe("Call log ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/callLogs/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_call_log",
    description: "Create a new call log entry",
    parameters: z.object({
      user_id: z.number().optional(),
      activity_id: z.number().optional().describe("Link to activity"),
      subject: z.string().optional(),
      duration: z.string().optional().describe("Duration in format HH:MM:SS"),
      outcome: z.enum(["connected", "no_answer", "left_message", "left_voicemail", "wrong_number", "busy"]),
      from_phone_number: z.string().optional(),
      to_phone_number: z.string().describe("Called phone number"),
      start_time: z.string().describe("Call start time (ISO 8601)"),
      end_time: z.string().describe("Call end time (ISO 8601)"),
      person_id: z.number().optional(),
      org_id: z.number().optional(),
      deal_id: z.number().optional(),
      note: z.string().optional(),
    }),
    execute: async (args) => {
      const result = await client.post("/callLogs", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_call_log",
    description: "Delete a call log entry",
    parameters: z.object({ id: z.string().describe("Call log ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/callLogs/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
