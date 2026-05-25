import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Mcp-Session-Id");

  if (req.method === "OPTIONS") return res.status(204).end();

  return res.status(200).json({
    resource: "https://pipedrive-mcp-five.vercel.app",
    bearer_methods_supported: ["header", "body"],
    resource_name: "Pipedrive MCP Server",
  });
}
