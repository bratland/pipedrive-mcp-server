import express, { Request, Response } from 'express';
import { PipedriveClient } from './pipedrive-client.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const apiToken = process.env.PIPEDRIVE_API_TOKEN;

if (!apiToken) {
  console.error('Error: PIPEDRIVE_API_TOKEN environment variable is not set');
  process.exit(1);
}

const client = new PipedriveClient({ apiToken });

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'pipedrive-mcp-server' });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Pipedrive MCP Server',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/api/deals',
      '/api/deals/:id',
      '/api/deals/search',
      '/api/persons',
      '/api/persons/:id',
      '/api/persons/search',
      '/api/organizations',
      '/api/organizations/:id',
      '/api/organizations/search',
      '/api/pipelines',
      '/api/pipelines/:id',
      '/api/stages',
      '/api/stages/:id',
      '/api/activities',
      '/api/activities/:id',
      '/api/notes',
      '/api/notes/:id',
      '/api/search'
    ]
  });
});

// Deals endpoints
app.get('/api/deals', async (req: Request, res: Response) => {
  try {
    const result = await client.getDeals(req.query as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/deals/search', async (req: Request, res: Response) => {
  try {
    const { term, ...params } = req.query;
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    const result = await client.searchDeals(term as string, params as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/deals/:id', async (req: Request, res: Response) => {
  try {
    const result = await client.getDeal(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Persons endpoints
app.get('/api/persons', async (req: Request, res: Response) => {
  try {
    const result = await client.getPersons(req.query as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/persons/search', async (req: Request, res: Response) => {
  try {
    const { term, ...params } = req.query;
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    const result = await client.searchPersons(term as string, params as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/persons/:id', async (req: Request, res: Response) => {
  try {
    const result = await client.getPerson(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Organizations endpoints
app.get('/api/organizations', async (req: Request, res: Response) => {
  try {
    const result = await client.getOrganizations(req.query as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/organizations/search', async (req: Request, res: Response) => {
  try {
    const { term, ...params } = req.query;
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    const result = await client.searchOrganizations(term as string, params as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/organizations/:id', async (req: Request, res: Response) => {
  try {
    const result = await client.getOrganization(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Pipelines endpoints
app.get('/api/pipelines', async (_req: Request, res: Response) => {
  try {
    const result = await client.getPipelines();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/pipelines/:id', async (req: Request, res: Response) => {
  try {
    const result = await client.getPipeline(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Stages endpoints
app.get('/api/stages', async (req: Request, res: Response) => {
  try {
    const pipeline_id = req.query.pipeline_id ? parseInt(req.query.pipeline_id as string) : undefined;
    const result = await client.getStages(pipeline_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/stages/:id', async (req: Request, res: Response) => {
  try {
    const result = await client.getStage(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Activities endpoints
app.get('/api/activities', async (req: Request, res: Response) => {
  try {
    const result = await client.getActivities(req.query as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/activities/:id', async (req: Request, res: Response) => {
  try {
    const result = await client.getActivity(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Notes endpoints
app.get('/api/notes', async (req: Request, res: Response) => {
  try {
    const result = await client.getNotes(req.query as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/notes/:id', async (req: Request, res: Response) => {
  try {
    const result = await client.getNote(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Search endpoint
app.get('/api/search', async (req: Request, res: Response) => {
  try {
    const { term, ...params } = req.query;
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    const result = await client.searchItems(term as string, params as any);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Pipedrive MCP HTTP Server running on port ${PORT}`);
});