import { FastMCP } from "fastmcp";
import { z } from "zod";
import { PipedriveClient } from "../pipedrive-client.js";

export function registerMailTools(server: FastMCP, client: PipedriveClient) {
  server.addTool({
    name: "list_mail_threads",
    description: "List mail threads from Pipedrive mailbox",
    parameters: z.object({
      folder: z.enum(["inbox", "drafts", "sent", "archive"]).optional().describe("Mail folder"),
      start: z.number().optional(),
      limit: z.number().optional(),
    }),
    execute: async (args) => {
      const result = await client.get("/mailbox/mailThreads", args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_mail_thread",
    description: "Get a specific mail thread",
    parameters: z.object({ id: z.number().describe("Mail thread ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/mailbox/mailThreads/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_mail_thread_messages",
    description: "List messages in a mail thread",
    parameters: z.object({ id: z.number().describe("Mail thread ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/mailbox/mailThreads/${id}/mailMessages`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_mail_thread",
    description: "Update a mail thread (mark read, archive, etc.)",
    parameters: z.object({
      id: z.number().describe("Mail thread ID"),
      deal_id: z.number().optional().describe("Link to deal"),
      shared_flag: z.enum(["0", "1"]).optional(),
      read_flag: z.enum(["0", "1"]).optional(),
      archived_flag: z.enum(["0", "1"]).optional(),
    }),
    execute: async ({ id, ...data }) => {
      const result = await client.put(`/mailbox/mailThreads/${id}`, data);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_mail_thread",
    description: "Delete a mail thread",
    parameters: z.object({ id: z.number().describe("Mail thread ID") }),
    execute: async ({ id }) => {
      const result = await client.deleteRequest(`/mailbox/mailThreads/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_mail_message",
    description: "Get a specific mail message",
    parameters: z.object({ id: z.number().describe("Mail message ID") }),
    execute: async ({ id }) => {
      const result = await client.get(`/mailbox/mailMessages/${id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
