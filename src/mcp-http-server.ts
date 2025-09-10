import express, { Request, Response } from 'express';
import { PipedriveClient } from './pipedrive-client.js';
import { dealTools } from './tools/deals.js';
import { personTools } from './tools/persons.js';
import { organizationTools } from './tools/organizations.js';
import { pipelineTools } from './tools/pipelines.js';
import { activityTools } from './tools/activities.js';
import { noteTools } from './tools/notes.js';
import { searchTools } from './tools/search.js';
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

// Combine all tools
const allTools = [
  ...dealTools,
  ...personTools,
  ...organizationTools,
  ...pipelineTools,
  ...activityTools,
  ...noteTools,
  ...searchTools,
];

const prompts = [
  {
    name: 'list_all_deals',
    description: 'List all deals with their details',
    arguments: [],
  },
  {
    name: 'search_person',
    description: 'Search for a person by name',
    arguments: [
      {
        name: 'name',
        description: 'Name of the person to search for',
        required: true,
      },
    ],
  },
  {
    name: 'get_organization_deals',
    description: 'Get all deals for a specific organization',
    arguments: [
      {
        name: 'org_id',
        description: 'Organization ID',
        required: true,
      },
    ],
  },
  {
    name: 'pipeline_overview',
    description: 'Get overview of all pipelines and their stages',
    arguments: [],
  },
];

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'pipedrive-mcp-server' });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Pipedrive MCP Server',
    version: '1.0.0',
    description: 'MCP server for Pipedrive API integration',
    endpoints: ['/mcp'],
    tools: allTools.length,
    prompts: prompts.length
  });
});

// Single MCP endpoint that handles all MCP protocol requests
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const { method, params } = req.body;

    if (!method) {
      return res.status(400).json({
        error: { code: -32600, message: 'Invalid Request', data: 'Missing method' }
      });
    }

    switch (method) {
      case 'tools/list':
        return res.json({
          result: {
            tools: allTools
          }
        });

      case 'prompts/list':
        return res.json({
          result: {
            prompts: prompts
          }
        });

      case 'prompts/get':
        const { name, arguments: args } = params || {};
        
        switch (name) {
          case 'list_all_deals':
            return res.json({
              result: {
                messages: [
                  {
                    role: 'user',
                    content: {
                      type: 'text',
                      text: 'List all deals with their current status, value, and associated contacts'
                    }
                  }
                ]
              }
            });
            
          case 'search_person':
            return res.json({
              result: {
                messages: [
                  {
                    role: 'user',
                    content: {
                      type: 'text',
                      text: `Search for a person named "${args?.name || ''}" and show their contact information and associated deals`
                    }
                  }
                ]
              }
            });
            
          case 'get_organization_deals':
            return res.json({
              result: {
                messages: [
                  {
                    role: 'user',
                    content: {
                      type: 'text',
                      text: `Get all deals associated with organization ID ${args?.org_id || ''} including their status and value`
                    }
                  }
                ]
              }
            });
            
          case 'pipeline_overview':
            return res.json({
              result: {
                messages: [
                  {
                    role: 'user',
                    content: {
                      type: 'text',
                      text: 'Provide an overview of all pipelines and their stages, including deal counts per stage'
                    }
                  }
                ]
              }
            });
            
          default:
            return res.status(404).json({
              error: { code: -32601, message: 'Prompt not found', data: name }
            });
        }

      case 'tools/call':
        const { name: toolName, arguments: toolArgs } = params || {};

        if (!toolName) {
          return res.status(400).json({
            error: { code: -32602, message: 'Invalid params', data: 'Missing tool name' }
          });
        }

        let result;
        
        switch (toolName) {
          case 'get_deals':
            result = await client.getDeals(toolArgs);
            break;
            
          case 'get_deal':
            if (!toolArgs?.id) {
              return res.status(400).json({
                error: { code: -32602, message: 'Invalid params', data: 'Missing deal ID' }
              });
            }
            result = await client.getDeal(toolArgs.id);
            break;
            
          case 'search_deals':
            if (!toolArgs?.term) {
              return res.status(400).json({
                error: { code: -32602, message: 'Invalid params', data: 'Missing search term' }
              });
            }
            const { term: dealTerm, ...dealParams } = toolArgs;
            result = await client.searchDeals(dealTerm, dealParams);
            break;
            
          case 'get_persons':
            result = await client.getPersons(toolArgs);
            break;
            
          case 'get_person':
            if (!toolArgs?.id) {
              return res.status(400).json({
                error: { code: -32602, message: 'Invalid params', data: 'Missing person ID' }
              });
            }
            result = await client.getPerson(toolArgs.id);
            break;
            
          case 'search_persons':
            if (!toolArgs?.term) {
              return res.status(400).json({
                error: { code: -32602, message: 'Invalid params', data: 'Missing search term' }
              });
            }
            const { term: personTerm, ...personParams } = toolArgs;
            result = await client.searchPersons(personTerm, personParams);
            break;
            
          case 'get_organizations':
            result = await client.getOrganizations(toolArgs);
            break;
            
          case 'get_organization':
            if (!toolArgs?.id) {
              return res.status(400).json({
                error: { code: -32602, message: 'Invalid params', data: 'Missing organization ID' }
              });
            }
            result = await client.getOrganization(toolArgs.id);
            break;
            
          case 'search_organizations':
            if (!toolArgs?.term) {
              return res.status(400).json({
                error: { code: -32602, message: 'Invalid params', data: 'Missing search term' }
              });
            }
            const { term: orgTerm, ...orgParams } = toolArgs;
            result = await client.searchOrganizations(orgTerm, orgParams);
            break;
            
          case 'get_pipelines':
            result = await client.getPipelines();
            break;
            
          case 'get_pipeline':
            if (!toolArgs?.id) {
              return res.status(400).json({
                error: { code: -32602, message: 'Invalid params', data: 'Missing pipeline ID' }
              });
            }
            result = await client.getPipeline(toolArgs.id);
            break;
            
          case 'get_stages':
            result = await client.getStages(toolArgs?.pipeline_id);
            break;
            
          case 'get_stage':
            if (!toolArgs?.id) {
              return res.status(400).json({
                error: { code: -32602, message: 'Invalid params', data: 'Missing stage ID' }
              });
            }
            result = await client.getStage(toolArgs.id);
            break;
            
          case 'get_activities':
            result = await client.getActivities(toolArgs);
            break;
            
          case 'get_activity':
            if (!toolArgs?.id) {
              return res.status(400).json({
                error: { code: -32602, message: 'Invalid params', data: 'Missing activity ID' }
              });
            }
            result = await client.getActivity(toolArgs.id);
            break;
            
          case 'get_notes':
            result = await client.getNotes(toolArgs);
            break;
            
          case 'get_note':
            if (!toolArgs?.id) {
              return res.status(400).json({
                error: { code: -32602, message: 'Invalid params', data: 'Missing note ID' }
              });
            }
            result = await client.getNote(toolArgs.id);
            break;
            
          case 'search_items':
            if (!toolArgs?.term) {
              return res.status(400).json({
                error: { code: -32602, message: 'Invalid params', data: 'Missing search term' }
              });
            }
            const { term: searchTerm, ...searchParams } = toolArgs;
            result = await client.searchItems(searchTerm, searchParams);
            break;
            
          default:
            return res.status(404).json({
              error: { code: -32601, message: 'Method not found', data: toolName }
            });
        }

        return res.json({
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        });

      default:
        return res.status(404).json({
          error: { code: -32601, message: 'Method not found', data: method }
        });
    }

  } catch (error) {
    console.error('MCP endpoint error:', error);
    return res.status(500).json({
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: {
      code: -32603,
      message: 'Internal error',
      data: err.message || 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Pipedrive MCP Server running on port ${PORT}`);
  console.log(`MCP endpoint available at: http://localhost:${PORT}/mcp`);
});