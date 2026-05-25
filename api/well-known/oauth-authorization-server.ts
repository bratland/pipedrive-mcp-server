import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");

  if (req.method === "OPTIONS") return res.status(204).end();

  return res.status(200).json({
    issuer: "https://pipedrive-mcp-five.vercel.app",
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint: "https://pipedrive-mcp-five.vercel.app/oauth/token",
    authorization_endpoint: "https://pipedrive-mcp-five.vercel.app/oauth/authorize",
  });
}
