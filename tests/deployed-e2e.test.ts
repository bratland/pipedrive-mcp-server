import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const BASE_URL = process.env.MCP_DEPLOYED_URL || 'https://pipedrive-mcp-five.vercel.app';
const API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

if (!API_TOKEN) throw new Error('PIPEDRIVE_API_TOKEN required in .env');

const MCP_URL = `${BASE_URL}/api/mcp/${API_TOKEN}`;

let rpcId = 0;

async function rpc(method: string, params?: Record<string, unknown>): Promise<any> {
  const body = { jsonrpc: '2.0', id: ++rpcId, method, params };
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function callTool(name: string, args: Record<string, unknown> = {}): Promise<any> {
  const res = await rpc('tools/call', { name, arguments: args });
  if (res.error) throw new Error(res.error.message);
  const text = res.result?.content?.[0]?.text;
  if (!text) return res.result;
  return JSON.parse(text);
}

describe('Deployed MCP Server E2E', () => {
  describe('protocol', () => {
    it('responds to initialize', async () => {
      const res = await rpc('initialize');
      expect(res.result.protocolVersion).toBe('2025-03-26');
      expect(res.result.serverInfo.name).toBe('pipedrive-mcp-server');
    });

    it('responds to ping', async () => {
      const res = await rpc('ping');
      expect(res.result).toBeDefined();
    });

    it('lists exactly 4 tools', async () => {
      const res = await rpc('tools/list');
      const tools = res.result.tools;
      expect(tools).toHaveLength(4);
      const names = tools.map((t: any) => t.name).sort();
      expect(names).toEqual(['pipedrive', 'pipedrive_overview', 'pipedrive_quarter', 'pipedrive_search']);
    });

    it('returns error for unknown tool', async () => {
      const res = await rpc('tools/call', { name: 'nonexistent_tool' });
      expect(res.error).toBeDefined();
      expect(res.error.message).toContain('not found');
    });

    it('returns error for unknown method', async () => {
      const res = await rpc('unknown/method');
      expect(res.error).toBeDefined();
    });
  });

  describe('pipedrive tool: read operations', () => {
    it('lists deals', async () => {
      const data = await callTool('pipedrive', { resource: 'deals', action: 'list', params: { limit: 3 } });
      expect(data.success).toBe(true);
    });

    it('lists persons', async () => {
      const data = await callTool('pipedrive', { resource: 'persons', action: 'list', params: { limit: 3 } });
      expect(data.success).toBe(true);
    });

    it('lists organizations', async () => {
      const data = await callTool('pipedrive', { resource: 'orgs', action: 'list', params: { limit: 3 } });
      expect(data.success).toBe(true);
    });

    it('gets current user', async () => {
      const data = await callTool('pipedrive', { resource: 'users', action: 'me' });
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('email');
    });

    it('lists pipelines', async () => {
      const data = await callTool('pipedrive', { resource: 'pipelines', action: 'list' });
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('lists stages', async () => {
      const data = await callTool('pipedrive', { resource: 'stages', action: 'list' });
      expect(data.success).toBe(true);
    });

    it('lists activities', async () => {
      const data = await callTool('pipedrive', { resource: 'activities', action: 'list', params: { limit: 3 } });
      expect(data.success).toBe(true);
    });

    it('lists currencies', async () => {
      const data = await callTool('pipedrive', { resource: 'currencies', action: 'list' });
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('lists deal fields', async () => {
      const data = await callTool('pipedrive', { resource: 'deal-fields', action: 'list', params: { limit: 5 } });
      expect(data.success).toBe(true);
    });

    it('lists filters', async () => {
      const data = await callTool('pipedrive', { resource: 'filters', action: 'list' });
      expect(data.success).toBe(true);
    });

    it('lists activity types', async () => {
      const data = await callTool('pipedrive', { resource: 'activity-types', action: 'list' });
      expect(data.success).toBe(true);
    });

    it('searches deals via pipedrive tool', async () => {
      const data = await callTool('pipedrive', { resource: 'deals', action: 'search', params: { term: 'test', limit: 3 } });
      expect(data.success).toBe(true);
    });

    it('uses alias: contacts = persons', async () => {
      const data = await callTool('pipedrive', { resource: 'contacts', action: 'list', params: { limit: 1 } });
      expect(data.success).toBe(true);
    });
  });

  describe('pipedrive tool: error handling', () => {
    it('returns error for unknown resource', async () => {
      const data = await callTool('pipedrive', { resource: 'nonexistent', action: 'list' });
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unknown resource');
    });

    it('returns error for unknown action', async () => {
      const data = await callTool('pipedrive', { resource: 'deals', action: 'nonexistent' });
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unknown action');
    });

    it('returns error for missing id', async () => {
      const data = await callTool('pipedrive', { resource: 'deals', action: 'get' });
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required id');
    });
  });

  describe('pipedrive tool: CRUD lifecycle', () => {
    let dealId: number;

    it('creates a deal', async () => {
      const data = await callTool('pipedrive', {
        resource: 'deals', action: 'create',
        params: { title: 'Deployed_E2E_Test', value: 999, currency: 'SEK' },
      });
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.title).toBe('Deployed_E2E_Test');
      dealId = data.data.id;
    });

    it('reads the deal', async () => {
      const data = await callTool('pipedrive', { resource: 'deals', action: 'get', id: dealId });
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(dealId);
    });

    it('updates the deal', async () => {
      const data = await callTool('pipedrive', {
        resource: 'deals', action: 'update', id: dealId,
        params: { title: 'Deployed_E2E_Updated', value: 1234 },
      });
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Deployed_E2E_Updated');
    });

    it('deletes the deal', async () => {
      const data = await callTool('pipedrive', { resource: 'deals', action: 'delete', id: dealId });
      expect(data.success).toBe(true);
    });
  });

  describe('specialized tools', () => {
    it('pipedrive_overview returns data', async () => {
      const data = await callTool('pipedrive_overview', {});
      expect(data.success).toBe(true);
    });

    it('pipedrive_quarter returns quarter summary', async () => {
      const data = await callTool('pipedrive_quarter', { quarter: 'current' });
      expect(data.success).toBe(true);
    });

    it('pipedrive_search returns results', async () => {
      const data = await callTool('pipedrive_search', { term: 'test' });
      expect(data).toBeDefined();
    });
  });

  describe('GET endpoint', () => {
    it('returns server info on GET', async () => {
      const res = await fetch(MCP_URL);
      expect(res.ok).toBe(true);
      const data = await res.json() as any;
      expect(data.name).toBe('pipedrive-mcp-server');
      expect(data.status).toBe('ok');
    });
  });
});
