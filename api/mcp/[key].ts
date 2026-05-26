import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleMessage, rpcError, SESSION_ID } from "../_shared";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Mcp-Session-Id");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

  if (req.method === "OPTIONS") return res.status(204).end();

  const pipedriveToken = typeof req.query.key === "string" ? req.query.key : undefined;
  if (!pipedriveToken || pipedriveToken.length < 10) {
    return res.status(401).json(rpcError(null, -32000, "Missing or invalid API token"));
  }

  if (req.method === "GET") {
    const accept = req.headers.accept || "";
    if (accept.includes("text/event-stream")) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Mcp-Session-Id", SESSION_ID);
      return res.status(200).end();
    }
    return res.status(200).json({ name: "pipedrive-mcp-server", version: "1.0.0", status: "ok" });
  }

  if (req.method === "DELETE") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json(rpcError(null, -32000, "Method not allowed"));

  const body = req.body;
  const messages = Array.isArray(body) ? body : [body];
  const responses: any[] = [];

  for (const msg of messages) {
    const response = await handleMessage(msg, pipedriveToken);
    if (response) responses.push(response);
  }

  if (responses.length === 0) return res.status(202).end();

  const accept = req.headers.accept || "";
  if (accept.includes("text/event-stream")) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Mcp-Session-Id", SESSION_ID);
    res.status(200);
    for (const r of responses) {
      res.write(`event: message\ndata: ${JSON.stringify(r)}\n\n`);
    }
    return res.end();
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Mcp-Session-Id", SESSION_ID);
  return res.json(responses.length === 1 ? responses[0] : responses);
}
